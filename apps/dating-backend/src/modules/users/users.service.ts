import {
  DATABASE_TYPE,
  IResult,
  PROVIDER_REPO,
  PaginationDTO,
} from '@dating/common';
import { UserRepo } from '@dating/repositories';
import {
  FilterBuilder,
  downloadImage,
  formatResult,
  mappingData,
  throwIfNotExists,
} from '@dating/utils';
import { Inject, Injectable } from '@nestjs/common';
import { CreateUserDTO, FilterGetOneUserDTO } from './dto/user.dto';
import { User } from './entities/user.entity';
import { UserHelper } from './helper/user.helper';

@Injectable()
export class UserService {
  constructor(
    @Inject(PROVIDER_REPO.USER + DATABASE_TYPE.MONGO)
    private userRepo: UserRepo,
    private userHelper: UserHelper,
  ) {}

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
      const user = await this.userRepo.findOne({ queryFilter });
      return user;
    } catch (error) {
      throw error;
    }
  }

  async findOneAndUpdate(_id: string, entities: Partial<User>): Promise<User> {
    try {
      if (entities?.setting && entities?.setting['stepStarted']) {
        entities['stepStarted'] = entities.setting['stepStarted'];
      }
      const user = await this.userRepo.findOneAndUpdate(_id, entities);
      throwIfNotExists(user, 'Cập nhật thất bại. Không thể tìm thấy User');
      return user;
    } catch (error) {
      throw error;
    }
  }

  async updateSetting(_id: string, entities: Partial<User>): Promise<User> {
    try {
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

  async insertManyUser(): Promise<boolean> {
    try {
      const users = mappingData();
      let count = 0;
      for (const user of users) {
        let image = 0;
        user.email = `user${count}@gmail.com`;
        user.phoneNumber = `+84${count}`;
        for (let i = 0; i < user.images.length; i++) {
          await downloadImage(user.images[i], `${user.email}_${image}`);
          const url = await this.userHelper.uploadImage(
            `E:/Nestjs/date-api/images/${user.email}_${image}.jpg`,
          );
          user.images[i] = url;
          image++;
        }
        const newUser = await this.userRepo.insert(user);
        await this.userRepo.save(newUser);
        count++;
      }
      return true;
    } catch (error) {
      throw error;
    }
  }

  async deleteMany() {
    await this.userRepo.migrateData();
    return true;
  }
}
