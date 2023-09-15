import { Inject, Injectable } from '@nestjs/common';
import { PopulateOptions } from 'mongoose';

import { DATABASE_TYPE, NotificationType, PROVIDER_REPO, REDIS_KEY_PREFIX } from '@common/consts';
import { PaginationDTO } from '@common/dto';
import { IResponse, IResult, ISocketIdsClient } from '@common/interfaces';
import { MatchRequestRepo } from '@dating/repositories';
import { FilterBuilder, formatResult } from '@dating/utils';
import { User } from '@modules/users/entities';
import { ConversationService } from '@modules/conversation/conversation.service';

import { MatchRequest } from './entities';
import { CreateMatchRequestDto, FilterGelAllMqDTO, FilterGetOneMq } from './dto';
import { SocketGateway } from '@modules/socket/socket.gateway';
import { NotificationService } from '@modules/notification/notification.service';
import { RedisService } from '@app/shared';

@Injectable()
export class MatchRequestService {
  constructor(
    @Inject(PROVIDER_REPO.MATCH_REQUEST + DATABASE_TYPE.MONGO)
    private matchRequestRepo: MatchRequestRepo,

    private conversationService: ConversationService,
    private socketGateway: SocketGateway,
    private notfiService: NotificationService,
    private redisService: RedisService,
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
      const pagination: PaginationDTO = {
        size: filter?.size,
        page: filter?.page,
      };
      const basicFieldsPopulate = ['_id', 'name', 'images', 'tags', 'bio'];
      const populate: PopulateOptions[] = [];
      if (isPopulate) {
        populate.push({
          path: 'requestBy',
          select: basicFieldsPopulate.join(' '),
        });
      }
      const [queryFilter] = new FilterBuilder<MatchRequest>()
        .setFilterItem('receiver', '$eq', user._id.toString())
        .buildQuery();
      const [results, totalCount] = await Promise.all([
        this.matchRequestRepo.findAll({ queryFilter, populate, pagination }),
        this.matchRequestRepo.count(queryFilter),
      ]);
      return formatResult(results, totalCount, pagination);
    } catch (error) {
      throw error;
    }
  }

  async findOne(filter: FilterGetOneMq): Promise<MatchRequest> {
    try {
      const [queryFilter] = new FilterBuilder<MatchRequest>()
        .setFilterItem('receiver', '$eq', filter?.receiver)
        .setFilterItem('sender', '$eq', filter?.sender)
        .buildQuery();
      return await this.matchRequestRepo.findOne({ queryFilter });
    } catch (error) {
      throw error;
    }
  }

  async remove(id: string): Promise<IResponse> {
    try {
      await this.matchRequestRepo.delete(id);
      return {
        success: true,
        message: 'Xoa thanh cong MatchRequest',
      };
    } catch (error) {
      throw error;
    }
  }

  async matched(sender: User, receiver: User, socketIdsClient: ISocketIdsClient, matchRqId: string): Promise<void> {
    const conversation = await this.conversationService.create({
      members: [sender, receiver],
    });
    const REDIS_KEY = `${REDIS_KEY_PREFIX}${conversation._id.toString()}_${receiver._id.toString()}`;
    await Promise.all([
      this.notfiService.create({ sender, receiver, type: NotificationType.MATCHED, conversation }),
      this.redisService.set({ key: REDIS_KEY, ttl: 10 * 60, data: true }),
    ]);
    const newConversation = await this.conversationService.toJSON(conversation);
    newConversation.members = [sender, receiver];
    await this.remove(matchRqId);
    const socketIds = socketIdsClient.receiver.concat(socketIdsClient.sender);
    this.socketGateway.sendEventToClient(socketIds, 'newMatched', newConversation);
  }
}
