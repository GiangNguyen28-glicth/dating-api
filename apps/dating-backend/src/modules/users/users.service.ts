import { ConfirmChannel } from 'amqplib';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';

import {
  DATABASE_TYPE,
  IOptionFilterGetAll,
  IResult,
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
  mappingData,
  throwIfNotExists,
} from '@dating/utils';
import { RabbitService } from '@app/shared';

import { CreateUserDTO, FilterGetOneUserDTO } from './dto';
import { User } from './entities';
import { UserHelper } from './helper';

@Injectable()
export class UserService implements OnModuleInit {
  private channel: ConfirmChannel;
  constructor(
    @Inject(PROVIDER_REPO.USER + DATABASE_TYPE.MONGO)
    private userRepo: UserRepo,
    private userHelper: UserHelper,
    private rabbitService: RabbitService,
  ) {}

  async onModuleInit() {
    await this.rabbitService.connectRmq();
    this.channel = await this.rabbitService.createChannel(
      RMQ_CHANNEL.USER_CHANNEL,
    );
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

  async recommendation(
    user: User,
    pagination: PaginationDTO,
  ): Promise<IResult<User>> {
    try {
      const queryFilter = await this.userHelper.buildFilterBySetting(user);
      const [totalCount, results] = await Promise.all([
        this.userRepo.count(queryFilter),
        this.userRepo.recommendation(user, queryFilter, pagination),
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
      if (
        entities.images &&
        entities.images.length &&
        this.userHelper.validateBlurImage(entities.images)
      ) {
        console.log('Send message to queue images builder');
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

  async updateMany(ids: string[], entities): Promise<void> {
    await this.userRepo.updateMany(ids, entities);
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
