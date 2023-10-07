import { BadRequestException, Inject, Injectable, OnModuleInit, forwardRef } from '@nestjs/common';
import axios from 'axios';
import { v2 } from 'cloudinary';
import * as _ from 'lodash';
import { Types } from 'mongoose';
import { ConfirmChannel } from 'amqplib';
import { GoogleAuth } from 'google-auth-library';

import { DATABASE_TYPE, LookingFor, PROVIDER_REPO, QUEUE_NAME, RMQ_CHANNEL } from '@common/consts';
import { FilterBuilder } from '@dating/utils';
import { ActionService } from '@modules/action/action.service';
import { IResponse } from '@common/interfaces';
import { RabbitService } from '@app/shared';
import { UserRepo } from '@dating/repositories';

import { Image, SpotifyInfo, User, UserAddress } from '../entities';
import { InsPayload, SpotifyPayload } from '../interfaces';
import { UpdateUserProfileDto, calField } from '../dto';
const serviceAccountInfo = {
  type: 'service_account',
  project_id: 'sunny-cider-400601',
  private_key_id: '4bb7440bbfc66eebae4240de699de140d5caa752',
  private_key:
    '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDYZt/utxkDZW8C\n8+PtfDdf5ob86ZW5zr8GFpxYOQ7aFAAeNNuM0Hw6pRaQbKdCHAQPzIcSLTc8ubIZ\nqZL/eAbbGob3c2yv1hBgpQ/y4xL6eiU74qf6PleVzWHaE8phngMo953pr3CjspyG\nmaL9dZYI3VnoDmsIOBUmqaDpznWggsuzXgshJOLQtGuUvlmECYwqs07/Wd/DQ/nO\nPDyq2qo1xQbi8tmikKL27anNX/9mD58nae5+01RTVsKW/SCjynI3pi4+i8zQxpdl\nZqfc8VpYldZGiJY95lxhtRIh9rTHt1lgWWDUiDqwu9ssKK5PD3sePIJiCiXaA8ma\naQmcCBuDAgMBAAECggEAauvhhvQmwrvSbtYMbyGpxpODbOEI3oadcaeoVhrTEMND\nD6m0NM4qI1vAW1mkBpELHLdEoaF/olxp+C4F+H3YfVeNCiSYtgSBkQ7dY3f4v5Os\nY/toXceBxP12dKbEnxjQnORDvNu3PtqYZhTxKGR53iVoL7U4AxaatMCpRfyBt+0f\nhrbhAn/ULgzIGzrd9S/ZHpA7K6twEGXbmvdDQ6bCSq/LyP9p4vTSAi8tmPKvT7kk\nhmO0lRlT5p7I4hfm+wuzVoWkc5LWFdjxQ/2347yLoQ9u0lN4yh0NorBpYtnSWkdZ\nPhmOpQd+zk/6bY6AyFuJs1o5JpCo1oNhRgDq42oICQKBgQDxsHeNtks0GhW0pb/u\nS2Hm+Vsyy7gUb1z3A/x+xbwmAUiooLTG/G26P31V38Exsvcpsn/BOkvYLld2G+ut\nxlfDE1r+R8D7tCt949H3dtYm0PUGSjl5XxJVP9P2G7gYQJfVM9crij1erOmUQydi\nE3jb7nz8Ro1ysk2YyR4BfoIaTwKBgQDlNxmAMn+hFaghFeoljenOncM0h2HKWUVm\nKQqaxx3CBoEr1jUJj+xVyTGi0eRnnaKq0zTM8bE2TfG6ccfMCSd28/cbz2040MfK\nZor5Q3+ypLyyh7wSEP4CkJW59Ti6VQisEDcQnDhILTnktQZGmtoAyxNMY2aBPnaK\nzpqEp2UCjQKBgQC02AQ9B2AyNipzp2p71fAFsiOpWIH+2G1Jb7Qo77AfB+rkMovS\nMOOx7vvLm8eldnI2wxeQ8Bv8QIC1IaMxvi3BC+SUTAB81o2Mf0GG12baWJRfBn8G\n8Dp5i28AwjD4BK0XnNit/Zx6EQweIjl/y24tsr/WzLveTMh/QE2xdIXJRQKBgGra\n/PBemlEmH3MNHFLVjaHcuhvK4TPL2iZ+C4uMN7sz/RPKkH8csThsys70ul3zhtnM\nDFlecxa1z3LziAj+W3+AzDoSwQAzlHAuzarWZLmLQsyXqn1hnojjjmlagE+dRKWy\nCXmc2kALlWmhWoOfvPGRujVqQWcPD4Q2PKKKxvQhAoGAHSRaPpCXscm8kWgo0Hq8\nBzZ3PYyQamED1j6qrwKhRqmy4E+SjK5536pgX3sZgdFCD+kRqDn//AGRmfVOdFEP\neYO1Z340uNsyL38r72zBRIdGSktqRascoPCJ7f7LFMGfCNDgoiVGvrGE+rTS7Plp\nzwhWeKyQlF1F+JxObtk8NwY=\n-----END PRIVATE KEY-----\n',
  client_email: 'sunny-cider-400601@appspot.gserviceaccount.com',
  client_id: '105418304382311867213',
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url:
    'https://www.googleapis.com/robot/v1/metadata/x509/sunny-cider-400601%40appspot.gserviceaccount.com',
  universe_domain: 'googleapis.com',
};

@Injectable()
export class UserHelper implements OnModuleInit {
  private channel: ConfirmChannel;
  constructor(
    @Inject(PROVIDER_REPO.USER + DATABASE_TYPE.MONGO)
    private userRepo: UserRepo,
    @Inject(forwardRef(() => ActionService))
    private actionService: ActionService,
    private rabbitService: RabbitService,
  ) {}

  async onModuleInit() {
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
  async getRawLocation(lat: number, long: number) {
    if (!lat || !long) {
      throw new BadRequestException('Missing param lat,long');
    }
    const GOOGLE_MAP_API_KEY = process.env.GOOGLE_MAP_API_KEY;
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
    const addressComponents = _.get(result[0], 'address_components', []);
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
      .setFilterItem('isDeleted', '$eq', false, true)
      .setFilterItem('showMeInTinder', '$eq', true);
    // .setFilterItem('lastActiveDate', '$gte', sevenDaysAgo);
    if (isApplyAge) {
      queryFilter.setFilterItemWithObject('age', {
        $gte: user.setting.discovery.minAge,
        $lte: user.setting.discovery.maxAge,
      });
    }
    if (user.setting.discovery.lookingFor != LookingFor.ALL) {
      queryFilter.setFilterItem('gender', '$eq', user.setting.discovery.lookingFor);
    }
    if (user.tags.length) {
      queryFilter.setFilterItem('tags', '$in', user.tags);
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
          coordinates: [user.geoLocation.coordinates[0], user.geoLocation.coordinates[1]],
        },
        spherical: true,
        distanceField: 'calcDistance',
        maxDistance: user.setting.discovery.distance * 1000,
        query: filter,
      },
    };
  }

  async getIgnoreIds(userId: string): Promise<any[]> {
    const [userIdsUnLiked, userIdsLiked] = await Promise.all([
      this.actionService.getAllIgnoreIdsUser(userId, 'unLikedUser'), //8
      this.actionService.getAllIgnoreIdsUser(userId, 'likedUser'), //7
    ]);
    userIdsLiked.push(new Types.ObjectId(userId) as unknown as string);
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

  async socialInsGetInfo(token: string, user: User): Promise<IResponse> {
    try {
      const response = await axios.get(
        `https://graph.instagram.com/me/media?fields=id,media_type,media_url,username,timestamp&access_token=${token}`,
      );
      const { data } = _.get(response, 'data', {});
      if (!response.data || !data) {
        throw new BadRequestException(`Can not get info with token ${token}`);
      }
      const insImages: Image[] = [];
      (data as Array<InsPayload>).map(imageObj => {
        if (imageObj.media_url) {
          const existsImages = user?.insImages?.find(image => image.insId === imageObj.id);
          if (existsImages) {
            insImages.push(existsImages);
            return;
          }
          insImages.push({
            url: imageObj.media_url,
            insId: imageObj.id,
          });
        }
      });
      await this.userRepo.findOneAndUpdate(user._id, { insImages });
      await this.rabbitService.sendToQueue(QUEUE_NAME.USER_IMAGES_BUILDER, {
        userId: user._id,
        insImages,
      });
      return {
        success: true,
        message: 'Ok',
      };
    } catch (error) {
      throw error;
    }
  }

  async socialSpotifyGetTopArtists(token: string, user: User): Promise<IResponse> {
    try {
      const response = await axios.get('https://api.spotify.com/v1/me/top/artists?limit=6', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const items: SpotifyPayload[] = response.data.items;
      const spotify: SpotifyInfo[] = [];
      for (const item of items) {
        spotify.push({
          artist: item.name,
          image: { url: item.images[0]?.url },
        });
      }
      await this.userRepo.findOneAndUpdate(user._id, { spotifyInfo: spotify });
      await this.rabbitService.sendToQueue(QUEUE_NAME.USER_IMAGES_BUILDER, {
        userId: user._id,
        spotifyInfo: spotify,
      });
      return {
        success: true,
        message: 'Ok',
      };
    } catch (error) {
      throw error;
    }
  }

  async insUnlink(user: User): Promise<IResponse> {
    try {
      user.insImages = null;
      await this.userRepo.save(user);
      return {
        success: true,
        message: 'Ok',
      };
    } catch (error) {
      throw error;
    }
  }

  async spotifyUnlink(user: User): Promise<IResponse> {
    try {
      user.spotifyInfo = null;
      await this.userRepo.save(user);
      return {
        success: true,
        message: 'Ok',
      };
    } catch (error) {
      throw error;
    }
  }

  async suggestLocation(): Promise<any> {
    const auth = new GoogleAuth({
      credentials: serviceAccountInfo,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
    const client = await auth.getClient();
    const resToken = await client.getAccessToken();
    const response = await axios.post(
      'https://us-central1-aiplatform.googleapis.com/v1/projects/sunny-cider-400601/locations/us-central1/publishers/google/models/text-bison:predict',
      {
        instances: [
          {
            content: 'Gợi ý địa điểm hẹn hò ở Sài gòn. Và cho lat và long của từng địa điểm',
          },
        ],
        parameters: {
          candidateCount: 1,
          maxOutputTokens: 256,
          temperature: 0.2,
          topP: 0.8,
          topK: 40,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${resToken.token}`,
        },
      },
    );
    return await response.data;
  }

  calTotalFinishProfile(user: User, updateProfile: UpdateUserProfileDto): number {
    const everyRatioInField = 100 / calField.length;
    let totalFinishProfile = 0;
    for (const key of calField) {
      if (user[key] || updateProfile[key]) {
        totalFinishProfile += everyRatioInField;
      }
    }
    return Math.floor(totalFinishProfile) > 100 ? 100 : Math.floor(totalFinishProfile);
  }

  validateBlurImage(image: Image[]) {
    return image.some(item => !item.blur);
  }
}
