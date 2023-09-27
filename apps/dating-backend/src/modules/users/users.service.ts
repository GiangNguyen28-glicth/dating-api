import { ConfirmChannel } from 'amqplib';
import { Inject, Injectable, OnModuleInit, forwardRef } from '@nestjs/common';
import { get } from 'lodash';
import { PipelineStage } from 'mongoose';

import {
  DATABASE_TYPE,
  IOptionFilterGetAll,
  IResponse,
  IResult,
  PROVIDER_REPO,
  PaginationDTO,
  QUEUE_NAME,
  RMQ_CHANNEL,
} from '@dating/common';
import { UserRepo } from '@dating/repositories';
import { FilterBuilder, downloadImage, formatResult, mappingData, throwIfNotExists } from '@dating/utils';
import { RabbitService } from '@app/shared';
import { TagService } from '@modules/tag/tag.service';

import { CreateUserDTO, FilterGetOneUserDTO, UpdateUserProfileDto, UpdateUserTagDTO } from './dto';
import { User } from './entities';
import { UserHelper } from './helper';
import { FinalCondRecommendation } from './interfaces';
import { Tag } from '@modules/tag/entities';

@Injectable()
export class UserService implements OnModuleInit {
  private channel: ConfirmChannel;
  constructor(
    @Inject(PROVIDER_REPO.USER + DATABASE_TYPE.MONGO)
    private userRepo: UserRepo,
    private userHelper: UserHelper,
    private rabbitService: RabbitService,
    private tagService: TagService,
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
      const finalStage: PipelineStage[] = [];
      const finalCond: FinalCondRecommendation = {};
      if (geoQuery) {
        finalCond.$geoNear = queryByDistance;
        finalStage.push(finalCond.$geoNear);
      } else {
        finalCond.$match = queryByDistance;
        finalStage.push(finalCond.$match);
      }
      const cloneFinalStage = [...finalStage];
      finalStage.push(
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
          $project: {
            __v: 0,
            geoLocation: 0,
            featureAccess: 0,
            setting: 0,
            registerType: 0,
          },
        },
        {
          $sort: { _id: -1 },
        },
        {
          $skip: (pagination?.page - 1) * pagination?.size || 0,
        },
        {
          $limit: pagination?.size || 100,
        },
      );
      const [totalCount, results] = await Promise.all([
        this.userRepo.countRecommendation(cloneFinalStage),
        this.userRepo.recommendation(finalStage),
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

  async findAll(option?: IOptionFilterGetAll<User>): Promise<User[]> {
    return await this.userRepo.findAll(option);
  }

  async findOneAndUpdate(_id: string, entities: Partial<User>): Promise<User> {
    try {
      const user = await this.userRepo.findOneAndUpdate(_id, entities);
      throwIfNotExists(user, 'Cập nhật thất bại. Không thể tìm thấy User');
      if (entities.images && entities.images.length && this.userHelper.validateBlurImage(entities.images)) {
        await this.rabbitService.sendToQueue(QUEUE_NAME.USER_IMAGES_BUILDER, {
          userId: _id,
          images: entities.images,
        });
      }
      return user;
    } catch (error) {
      throw error;
    }
  }

  async updateSetting(_id: string, entities: Partial<User>): Promise<User> {
    try {
      if (entities?.setting && entities?.setting['stepStarted']) {
        entities['stepStarted'] = entities.setting['stepStarted'];
      }
      const user = await this.userRepo.findOneAndUpdate(_id, entities);
      return user;
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
      user = await this.populateTag(user);
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

  async updateMany(ids: string[], entities): Promise<void> {
    await this.userRepo.updateMany(ids, entities);
  }

  async populateTag(user: User): Promise<User> {
    return this.userRepo.populate(user as unknown as Document, [{ path: 'tags' }]);
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
          const url = await this.userHelper.uploadImage(
            `E:/Nestjs/dating-api/apps/dating-backend/images/${user.email}_${image}.jpg`,
          );
          user.images[i].url = url;
          image++;
        }
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

  async deleteMany() {
    return await this.userRepo.deleteManyUser();
  }

  async migrate() {
    await this.userRepo.migrateData();
    return true;
  }
}
