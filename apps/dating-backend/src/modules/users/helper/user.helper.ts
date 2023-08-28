import { LookingFor, MongoID } from '@common/consts';
import { FilterBuilder } from '@dating/utils';
import { ActionService } from '@modules/action/action.service';
import {
  BadRequestException,
  Inject,
  Injectable,
  forwardRef,
} from '@nestjs/common';
import axios from 'axios';
import { v2 } from 'cloudinary';
import * as _ from 'lodash';
import { User, UserAddress } from '../entities/user.entity';
const GOOGLE_MAP_API_KEY = process.env.GOOGLE_MAP_API_KEY;

@Injectable()
export class UserHelper {
  constructor(
    @Inject(forwardRef(() => ActionService))
    private actionService: ActionService,
  ) {}
  async getRawLocation(lat: number, long: number) {
    if (!lat || !long) {
      throw new BadRequestException('Missing param lat,long');
    }
    return await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${long}&key=${GOOGLE_MAP_API_KEY}`,
    );
  }

  async getProvince() {
    return (await axios.get('https://provinces.open-api.vn/api/')).data;
  }

  async getLocation(lat: number, long: number): Promise<UserAddress> {
    const userAddress = new UserAddress();
    const rawLocation = await this.getRawLocation(lat, long);
    const result = _.get(rawLocation, 'data.results', []);
    const addressComponents = _.get(result[0], 'address_components', []) || [];
    userAddress.fullAddress = _.get(result[0], 'formatted_address', null);
    for (let i = 0; i < addressComponents.length; i++) {
      const item = addressComponents[i];
      const types = _.get(item, 'types', []);
      if (types.includes('route')) {
        userAddress.route = _.get(item, 'long_name', null);
        continue;
      }
      if (types.includes('locality')) {
        userAddress.district = _.get(item, 'long_name', null);
        continue;
      }
      if (types.includes('administrative_area_level_1')) {
        userAddress.province = _.get(item, 'long_name', null);
        continue;
      }
      if (types.includes('administrative_area_level_2')) {
        userAddress.district = _.get(item, 'long_name', null);
        continue;
      }
      if (types.includes('country')) {
        userAddress.country = _.get(item, 'long_name', null);
        continue;
      }
    }
    return userAddress;
  }

  async buildFilterBySetting(user: User) {
    const isApplyAge = user.setting.discovery.onlyShowAgeThisRange;
    const ignoreIds = await this.getIgnoreIds(user._id.toString());
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const queryFilter = new FilterBuilder<User>()
      .setFilterItem('isBlocked', '$eq', false, true)
      .setFilterItem('_id', '$nin', ignoreIds)
      .setFilterItem('isDeleted', '$eq', false, true);
    // .setFilterItem('showMeInTinder', '$eq', true)
    // .setFilterItem('lastActiveDate', '$gte', sevenDaysAgo);
    if (isApplyAge) {
      queryFilter.setFilterItemWithObject('age', {
        $gte: user.setting.discovery.minAge,
        $lte: user.setting.discovery.maxAge,
      });
    }
    if (user.setting.discovery.lookingFor != LookingFor.ALL) {
      queryFilter.setFilterItem(
        'gender',
        '$eq',
        user.setting.discovery.lookingFor,
      );
    }
    return queryFilter.buildQuery()[0];
  }

  getFilterByDistance(user: User, filter) {
    if (!user.setting.discovery.onlyShowDistanceThisRange) {
      return { $match: filter };
    }
    return {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [
            user.geoLocation.coordinates[0],
            user.geoLocation.coordinates[1],
          ],
        },
        spherical: true,
        distanceField: 'calcDistance',
        query: filter,
      },
    };
  }

  async getIgnoreIds(userId: string): Promise<any[]> {
    const [userIdsUnLiked, userIdsLiked] = await Promise.all([
      this.actionService.getAllIgnoreIdsUser(userId, 'unLikedUser'), //8
      this.actionService.getAllIgnoreIdsUser(userId, 'likedUser'), //7
    ]);
    userIdsLiked.push(userId);
    return userIdsLiked.concat(userIdsUnLiked);
  }

  async uploadImage(path): Promise<any> {
    try {
      const options = {
        use_filename: false,
        unique_filename: false,
        overwrite: true,
      };
      const result = await v2.uploader.upload(path, options);
      return result.url;
    } catch (err) {
      console.log(err);
    }
  }
}
