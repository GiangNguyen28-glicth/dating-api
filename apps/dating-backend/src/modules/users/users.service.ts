import { Inject, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { ConfirmChannel } from 'amqplib';
import { get, isNil, sumBy } from 'lodash';
import { PipelineStage } from 'mongoose';

import { RabbitService } from '@app/shared';
import {
  DATABASE_TYPE,
  IResponse,
  IResult,
  OK,
  PROVIDER_REPO,
  PaginationDTO,
  QUEUE_NAME,
  RMQ_CHANNEL,
} from '@dating/common';
import { UserRepo } from '@dating/repositories';
import {
  FilterBuilder,
  downloadImage,
  formatResult,
  getPercentage,
  mappingData,
  throwIfNotExists,
} from '@dating/utils';

import { BillingService } from '@modules/billing/billing.service';
import { TagService } from '@modules/tag/tag.service';

import { FilterGetStatistic } from '@modules/admin/dto';
import { CreateUserDTO, FilterGetAllUserDTO, FilterGetOneUserDTO, UpdateUserTagDTO } from './dto';
import { User, UserSetting } from './entities';
import { UserHelper } from './helper';
import { FinalCondRecommendation, excludeFieldRecommendation } from './interfaces';

@Injectable()
export class UserService implements OnModuleInit {
  private channel: ConfirmChannel;
  constructor(
    @Inject(PROVIDER_REPO.USER + DATABASE_TYPE.MONGO)
    private userRepo: UserRepo,
    private userHelper: UserHelper,
    private rabbitService: RabbitService,
    private tagService: TagService,
    private billingService: BillingService,
  ) {}

  async onModuleInit() {
    await this.rabbitService.connectRmq();
    this.channel = await this.rabbitService.createChannel(RMQ_CHANNEL.USER_CHANNEL);
    await this.rabbitService.assertQueue(
      {
        queue: QUEUE_NAME.USER_IMAGES_BUILDER,
        options: {
          durable: true,
          arguments: {
            'x-queue-type': 'quorum',
          },
        },
      },
      RMQ_CHANNEL.USER_CHANNEL,
    );
  }

  async create(createUserDto: CreateUserDTO): Promise<User> {
    try {
      const user = await this.userRepo.insert(createUserDto);
      return await this.userRepo.save(user);
    } catch (error) {
      throw error;
    }
  }

  async recommendation(user: User, pagination: PaginationDTO): Promise<IResult<User>> {
    try {
      const queryByUserSetting = await this.userHelper.buildFilterBySetting(user);
      const queryByDistance: any = this.userHelper.getFilterByDistance(user, queryByUserSetting);
      const geoQuery = get(queryByDistance, '$geoNear', null);
      const recommendationStage: PipelineStage[] = [];
      const finalCond: FinalCondRecommendation = {};
      if (geoQuery) {
        finalCond.$geoNear = queryByDistance;
        recommendationStage.push(finalCond.$geoNear);
      } else {
        finalCond.$match = queryByDistance;
        recommendationStage.push(finalCond.$match);
      }
      const countStage = [...recommendationStage];
      recommendationStage.push(
        {
          $skip: (pagination?.page - 1) * pagination?.size || 0,
        },
        {
          $limit: pagination?.size || 100,
        },
        {
          $lookup: {
            from: 'tags',
            let: { tags: '$tags' },
            pipeline: [
              {
                $match: {
                  $expr: { $in: ['$_id', '$$tags'] },
                },
              },
              {
                $project: {
                  name: 1,
                  type: 1,
                  parentType: 1,
                },
              },
            ],
            as: 'tags',
          },
        },
        {
          $lookup: {
            from: 'relationships',
            let: { relationships: '$relationships' },
            pipeline: [
              {
                $match: {
                  $expr: { $in: ['$_id', '$$relationships'] },
                },
              },
              {
                $project: {
                  name: 1,
                  description: 1,
                },
              },
            ],
            as: 'relationships',
          },
        },
        {
          $lookup: {
            from: 'relationships',
            localField: 'relationshipStatus',
            foreignField: '_id',
            as: 'relationshipStatus',
          },
        },
        {
          $project: excludeFieldRecommendation,
        },
        {
          $sort: { 'boostsSession.expiredDate': -1, _id: -1 },
        },
      );
      const [totalCount, results] = await Promise.all([
        this.userRepo.countRecommendation(countStage),
        this.userRepo.recommendation(recommendationStage),
      ]);
      return formatResult(results, totalCount, pagination);
    } catch (error) {
      throw error;
    }
  }

  async findOne(filter: FilterGetOneUserDTO): Promise<User> {
    try {
      const [queryFilter] = new FilterBuilder<User>()
        .setFilterItem('_id', '$eq', filter?._id)
        .setFilterItem('email', '$eq', filter?.email)
        .setFilterItem('registerType', '$eq', filter?.registerType)
        .setFilterItem('phoneNumber', '$eq', filter?.phoneNumber)
        .buildQuery();
      return await this.userRepo.findOne({ queryFilter });
    } catch (error) {
      throw error;
    }
  }

  async findAll(filter: FilterGetAllUserDTO): Promise<IResult<User>> {
    const queryBuilder = new FilterBuilder<User>()
      .setFilterItem('email', '$eq', filter?.email)
      .setFilterItem('gender', '$eq', filter?.gender)
      .setSortItem('blockedAt', 'desc');
    if (!isNil(filter?.isBlocked)) {
      queryBuilder.setFilterItem('isBlocked', '$eq', filter?.isBlocked, true);
    }
    const [queryFilter] = queryBuilder.buildQuery();
    const selectFields: Array<keyof User> = [
      '_id',
      'images',
      'email',
      'blockedAt',
      'unBlockedAt',
      'isBlocked',
      'name',
      'createdAt',
    ];
    const [results, totalCount] = await Promise.all([
      this.userRepo.findAll({ queryFilter, fields: selectFields }),
      this.userRepo.count(queryFilter),
    ]);
    return formatResult(results, totalCount);
  }

  async findOneAndUpdate(_id: string, entities: Partial<User>): Promise<User> {
    try {
      return await this.userRepo.findOneAndUpdate(_id, entities);
    } catch (error) {
      throw error;
    }
  }

  async updateProfile(user: User, entities: Partial<User>): Promise<User> {
    try {
      entities.totalFinishProfile = this.userHelper.calTotalFinishProfile(user, entities);
      const newUser = await this.userRepo.findOneAndUpdate(user._id, entities);
      throwIfNotExists(newUser, 'Cập nhật thất bại. Không thể tìm thấy User');
      await this.processImage(user._id, entities);
      return user;
    } catch (error) {
      throw error;
    }
  }

  async processImage(userId: string, entities: Partial<User>): Promise<void> {
    if (entities?.images?.length) {
      if (this.userHelper.validateBlurImage(entities.images) || entities.blurAvatar) {
        await this.rabbitService.sendToQueue(QUEUE_NAME.USER_IMAGES_BUILDER, {
          userId,
          images: entities.images,
          blurAvatar: entities.blurAvatar,
        });
      }
      const imagesVerify = entities.images.filter(img => isNil(img.isVerifiedSuccess)).map(item => item.url);
      // if (imagesVerify.length) {
      //   try {
      //     axios.post('https://finder.sohe.in/face/recognize', {
      //       userId: userId,
      //       images: imagesVerify,
      //     });
      //   } catch (error) {
      //     console.log('aaaaaaaaa', error);
      //   }
      // }
    }
  }

  async updateSetting(user: User, setting: UserSetting): Promise<IResponse> {
    try {
      const updated: Partial<User> = {};
      if (setting['stepStarted']) {
        updated.stepStarted = setting['stepStarted'];
      }
      updated.setting = Object.assign(user.setting, setting);
      await this.userRepo.findOneAndUpdate(user._id, updated);
      return {
        success: true,
        message: OK,
      };
    } catch (error) {
      throw error;
    }
  }

  async updateLocation(_id: string, { lat, long }): Promise<void> {
    try {
      const userAddress = await this.userHelper.getLocation(lat, long);
      await this.findOneAndUpdate(_id, {
        address: userAddress,
        geoLocation: {
          type: 'Point',
          coordinates: [long, lat],
        },
      });
    } catch (error) {
      throw error;
    }
  }

  async updateTag(user: User, updateTagDto: UpdateUserTagDTO): Promise<IResponse> {
    try {
      const { tagId, tagType } = updateTagDto;
      const tag = await this.tagService.findOne({ _id: tagId, type: tagType });
      user = await this.userRepo.populate(user as unknown as Document, [{ path: 'tags' }]);
      user.tags = user.tags.filter(tag => {
        if (tag.type != updateTagDto.tagType) {
          return tag;
        }
      });
      user.tags.push(tag);
      await this.userRepo.save(user);
      return {
        success: true,
        message: 'Thêm mới tag thành công',
      };
    } catch (error) {
      throw error;
    }
  }

  async getCurrentUser(user: User, offering = false): Promise<User> {
    try {
      const currentUser = await this.userRepo.toJSON(
        await this.userRepo.populate(user as unknown as Document, [
          { path: 'tags' },
          { path: 'relationships' },
          { path: 'relationshipStatus' },
        ]),
      );
      if (offering) {
        const billing = await this.billingService.findOneByCurrentUser(user._id);
        currentUser['offering'] = billing?.offering;
      }
      return currentUser;
    } catch (error) {
      throw error;
    }
  }

  //======================================Admin======================================
  async statisticByRangeDate(filter: FilterGetStatistic): Promise<any> {
    const queryBuilder = new FilterBuilder<User>();
    if (filter?.fromDate && filter?.toDate) {
      queryBuilder.setFilterItemWithObject('createdAt', { $gte: filter?.fromDate, $lte: filter?.toDate });
    }
    const [queryFilter] = queryBuilder.buildQuery();
    return await this.userRepo.statisticByRangeDate(queryFilter, filter.format);
  }

  async distribution(): Promise<any> {
    try {
      const defaultAgeGroup = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
      const [ageGroup, genderGroup] = await Promise.all([
        this.userRepo.distributionAge(),
        this.userRepo.distributionGender(),
      ]);
      const totalCountGroup = sumBy(ageGroup, 'count');
      const newAgeGroup = defaultAgeGroup.map(item => {
        const group = ageGroup.find(age => age._id === item);
        const count = get(group, 'count', 0);
        return {
          _id: item,
          count,
          percentage: getPercentage(count, totalCountGroup),
        };
      });
      const newGenderGroup = genderGroup.map(item => {
        return {
          ...item,
          percentage: getPercentage(item.count, totalCountGroup),
        };
      });
      return {
        ageGroup: newAgeGroup,
        genderGroup: newGenderGroup,
        totalCount: totalCountGroup,
      };
    } catch (error) {
      throw error;
    }
  }

  async insertManyUser(): Promise<boolean> {
    try {
      const users = mappingData();
      let count = 0;
      for (const user of users) {
        let image = 0;
        user.email = `user${count}@gmail.com`;
        user.phoneNumber = `+84${count}`;
        for (let i = 0; i < user.images.length; i++) {
          await downloadImage(user.images[i].url, `${user.email}_${image}`);
          const url = await this.userHelper.uploadImageV2(
            `E:/Nestjs/dating-api/apps/dating-backend/images/${user.email}_${image}.jpg`,
          );
          user.images[i].url = url;
          image++;
        }
        user.stepStarted = 4;
        const newUser = await this.userRepo.insert(user);
        // await this.rabbitService.sendToQueue(QUEUE.IMAGES_BUILDER, {
        //   userId: newUser._id,
        //   images: newUser.images,
        // });
        await this.userRepo.save(newUser);
        count++;
      }
      return true;
    } catch (error) {
      throw error;
    }
  }

  async deleteAccount(user: User): Promise<IResponse> {
    try {
      const newUser = await this.userRepo.findOneAndUpdate(user._id, { isDeleted: true });
      if (!newUser) {
        throw new NotFoundException('Không tìm thấy User');
      }
      return {
        success: true,
        message: OK,
      };
    } catch (error) {
      throw error;
    }
  }

  async migrate() {
    const users = await this.userRepo.migrateData();
    // for (const user of users) {
    //   if (user.images.length) {
    //     await this.rabbitService.sendToQueue(QUEUE_NAME.USER_IMAGES_BUILDER, {
    //       userId: user._id,
    //       images: user.images,
    //       blurAvatar: user.images[0],
    //     });
    //   }
    // }
    return true;
  }
}
