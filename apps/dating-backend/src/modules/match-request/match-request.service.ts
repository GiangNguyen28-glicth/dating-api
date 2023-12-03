import { Inject, Injectable } from '@nestjs/common';
import { PopulateOptions } from 'mongoose';

import {
  DATABASE_TYPE,
  MatchRqStatus,
  MerchandisingType,
  NotificationStatus,
  NotificationType,
  PROVIDER_REPO,
} from '@common/consts';
import { IResponse, IResult } from '@common/interfaces';
import { MatchRequestRepo, PassesRequestRepo } from '@dating/repositories';
import { FilterBuilder, docToObject, formatResult, getFormatGroupISODate } from '@dating/utils';

import { ConversationService } from '@modules/conversation/conversation.service';
import { NotificationService } from '@modules/notification/notification.service';
import { SocketGateway } from '@modules/socket/socket.gateway';

import { User } from '@modules/users/entities';

import { CreateConversationDto } from '@modules/conversation/dto';
import { CreateNotificationDto } from '@modules/notification/dto';

import { CreateMatchRequestDto, FilterGelAllMqDTO, FilterGetOneMq } from './dto';
import { MatchRequest } from './entities';
import { IMatchedAction } from './interfaces';
import { FilterGetStatistic, GroupDate } from '@modules/admin/dto';
import { flatten, groupBy, map, orderBy, sumBy } from 'lodash';

@Injectable()
export class MatchRequestService {
  constructor(
    @Inject(PROVIDER_REPO.MATCH_REQUEST + DATABASE_TYPE.MONGO)
    private matchRequestRepo: MatchRequestRepo,

    @Inject(PROVIDER_REPO.PASSES_REQUEST + DATABASE_TYPE.MONGO)
    private passesRequestRepo: PassesRequestRepo,

    private conversationService: ConversationService,
    private socketGateway: SocketGateway,
    private notiService: NotificationService,
  ) {}

  async create(matchRequestDto: CreateMatchRequestDto): Promise<MatchRequest> {
    try {
      const matchRequest = await this.matchRequestRepo.insert(matchRequestDto);
      await this.matchRequestRepo.save(matchRequest);
      return matchRequest;
    } catch (error) {
      throw error;
    }
  }

  async findAll(filter: FilterGelAllMqDTO, user: User, isPopulate = false): Promise<IResult<MatchRequest>> {
    try {
      const unBlurIdx = user.featureAccess.findIndex(ft => ft.name === MerchandisingType.UN_BLUR && ft.unlimited);
      const selectFieldsPopulate: Array<keyof User> = ['_id', 'name', 'tags', 'bio', 'blurAvatar'];
      if (unBlurIdx != -1) {
        selectFieldsPopulate.push('images');
      }
      const populate: PopulateOptions[] = [];
      if (isPopulate) {
        populate.push({
          path: 'sender',
          select: selectFieldsPopulate.join(' '),
        });
      }
      const queryBuilder = new FilterBuilder<MatchRequest>()
        .setFilterItem('receiver', '$eq', user._id.toString())
        .setFilterItem('status', '$eq', MatchRqStatus.REQUESTED);
      const [nonBoostsFilter, sortNonBoostsRq] = docToObject(queryBuilder.buildQuery());
      const [boostsFilter, sortBoostRq] = queryBuilder
        .setFilterItem('isBoosts', '$eq', true)
        .setFilterItem('expiredAt', '$gte', new Date())
        .setSortItem('expiredAt', 'asc')
        .buildQuery();
      const [totalBoostsRq, totalCount] = await Promise.all([
        this.matchRequestRepo.findAll({
          queryFilter: boostsFilter,
          pagination: { size: filter?.size, page: filter?.page },
          sortOption: sortBoostRq,
        }),
        this.matchRequestRepo.count(nonBoostsFilter),
      ]);
      if (totalBoostsRq.length >= filter?.size || totalBoostsRq.length >= totalCount) {
        return formatResult(totalBoostsRq, totalCount, { size: filter?.size, page: filter?.page });
      }
      const totalNonBoostsRq = await this.matchRequestRepo.findAll({
        queryFilter: nonBoostsFilter,
        populate,
        pagination: { size: filter?.size - totalBoostsRq.length, page: filter?.page },
        sortOption: sortNonBoostsRq,
      });

      return formatResult(totalBoostsRq.concat(totalNonBoostsRq), totalCount, {
        size: filter?.size,
        page: filter?.page,
      });
    } catch (error) {
      throw error;
    }
  }

  async findOne(filter: FilterGetOneMq): Promise<MatchRequest> {
    try {
      const queryBuilder = new FilterBuilder<MatchRequest>().setFilterItem('status', '$eq', filter?.status);
      if (filter?.receiver && filter?.sender) {
        queryBuilder.setFilterItemWithObject('$or', [
          { receiver: filter?.sender, sender: filter?.receiver },
          { receiver: filter?.receiver, sender: filter?.sender },
        ]);
      } else {
        queryBuilder.setFilterItem('receiver', '$eq', filter?.receiver);
      }
      const [queryFilter] = queryBuilder.buildQuery();
      const populate: PopulateOptions[] = [];
      if (filter?.populate) {
        populate.push({
          path: 'sender',
          select: '_id name images',
        });
      }
      return await this.matchRequestRepo.findOne({ queryFilter, populate });
    } catch (error) {
      throw error;
    }
  }

  async skip(receiverId: string, senderId: string): Promise<void> {
    try {
      const passes = await this.passesRequestRepo.insert({ sender: senderId, receiver: receiverId });
      await this.passesRequestRepo.save(passes);
    } catch (error) {
      throw error;
    }
  }

  async matched(matchedAction: IMatchedAction): Promise<void> {
    const { sender, receiver, socketIdsClient, matchRq } = matchedAction;
    const conversationDto: CreateConversationDto = {
      members: [sender._id, receiver._id],
    };

    const conversation = await this.conversationService.create(conversationDto);

    const senderNotiDto: CreateNotificationDto = {
      sender,
      receiver,
      type: NotificationType.MATCHED,
      conversation,
      status: NotificationStatus.NOT_RECEIVED,
    };
    matchRq.status = MatchRqStatus.MATCHED;
    const receiverNotiDto = { ...senderNotiDto };
    receiverNotiDto.sender = receiver;
    receiverNotiDto.receiver = sender;

    const [notiSender, notiReceiver] = await Promise.all([
      this.notiService.create(senderNotiDto),
      this.notiService.create(receiverNotiDto),
      this.matchRequestRepo.save(matchRq),
    ]);
    conversation.members = [sender, receiver];

    this.socketGateway.sendEventToClient(socketIdsClient.sender, 'newNotification', notiReceiver);
    this.socketGateway.sendEventToClient(socketIdsClient.receiver, 'newNotification', notiSender);
  }

  async save(matchRq: MatchRequest): Promise<void> {
    try {
      await this.matchRequestRepo.save(matchRq);
    } catch (error) {
      throw error;
    }
  }

  async countMatchRequest(user: User): Promise<IResponse> {
    const [totalCount, representUser] = await Promise.all([
      this.matchRequestRepo.count({ receiver: user._id, status: MatchRqStatus.REQUESTED }),
      this.findOne({ receiver: user._id, status: MatchRqStatus.REQUESTED, populate: true }),
    ]);
    let blur = null;
    if (totalCount > 0) {
      blur = (representUser.sender as User).images.find(image => image.blur).blur;
    }
    return {
      success: true,
      data: {
        totalCount,
        isBlur: true,
        blur,
      },
    };
  }

  //======================================Admin======================================
  async statisticLikeByRangeDate(filter: FilterGetStatistic): Promise<any> {
    filter.format = getFormatGroupISODate(filter?.typeRange);
    const queryBuilderLike = new FilterBuilder<MatchRequest>();
    const queryBuilderMatched = new FilterBuilder<MatchRequest>().setFilterItem('status', '$eq', MatchRqStatus.MATCHED);
    if (filter?.fromDate && filter?.toDate) {
      queryBuilderLike.setFilterItemWithObject('createdAt', { $gte: filter?.fromDate, $lte: filter?.toDate });
      queryBuilderMatched.setFilterItemWithObject('updatedAt', { $gte: filter?.fromDate, $lte: filter?.toDate });
    }
    const [queryFilterLike] = queryBuilderLike.buildQuery();
    const [queryFilterMatched] = queryBuilderMatched.buildQuery();
    const swipeLikes = await Promise.all([
      this.matchRequestRepo.statisticByRangeDate(queryFilterLike, filter.format),
      this.matchRequestRepo.statisticMatchedByRangeDate(queryFilterMatched, filter.format),
    ]);

    const flattenedArray = flatten(swipeLikes);
    const groupedByDate = groupBy(flattenedArray, 'date');
    const result = map(groupedByDate, (items, date) => ({
      _id: { date },
      date,
      count: sumBy(items, 'count'),
    }));

    return orderBy(result, ['date'], ['asc']);
  }

  async statisticSkipByRangeDate(filter: FilterGetStatistic): Promise<any> {
    filter.format = getFormatGroupISODate(filter?.typeRange);
    const queryBuilder = new FilterBuilder<MatchRequest>();
    if (filter?.fromDate && filter?.toDate) {
      queryBuilder.setFilterItemWithObject('createdAt', { $gte: filter?.fromDate, $lte: filter?.toDate });
    }
    const [queryFilter] = queryBuilder.buildQuery();
    const swipePasses = await this.passesRequestRepo.statisticByRangeDate(queryFilter, filter.format);
    return swipePasses;
  }
}
