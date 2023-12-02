import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  OnModuleInit,
  UnsupportedMediaTypeException,
  forwardRef,
} from '@nestjs/common';
import * as tf from '@tensorflow/tfjs-node';
import { ConfirmChannel } from 'amqplib';
import axios from 'axios';
import { v2 } from 'cloudinary';
import * as _ from 'lodash';
import { Types } from 'mongoose';
import fetch from 'node-fetch';
import * as nsfw from 'nsfwjs';
import { getPlaiceholder } from 'plaiceholder';
import toStream = require('buffer-to-stream');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const sharp = require('sharp');

import { RabbitService } from '@app/shared';
import { DATABASE_TYPE, LookingFor, OK, PROVIDER_REPO, QUEUE_NAME, RMQ_CHANNEL } from '@common/consts';
import { IResponse } from '@common/interfaces';
import { UserRepo } from '@dating/repositories';
import { FilterBuilder } from '@dating/utils';

import { ActionService } from '@modules/action/action.service';

import { ImageProcessOptionsDTO, UpdateImageVerifiedDTO, UpdateUserProfileDto, calField } from '../dto';
import { Image, SpotifyInfo, User, UserAddress } from '../entities';
import { InsPayload, SpotifyPayload } from '../interfaces';

@Injectable()
export class UserHelper implements OnModuleInit {
  private channel: ConfirmChannel;
  private model: nsfw.NSFWJS;

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
    if (process.env.NODE_ENV === 'prod') {
      this.model = await nsfw.load('https://res.cloudinary.com/finder-next/raw/upload/v1700214306/models/model/', {
        size: 299,
      });
    }
  }
  async getRawLocation(lat: number, long: number) {
    try {
      if (!lat || !long) {
        throw new BadRequestException('Missing param lat,long');
      }
      const GOOGLE_MAP_API_KEY = process.env.GOOGLE_MAP_API_KEY;
      return await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${long}&key=${GOOGLE_MAP_API_KEY}`,
      );
    } catch (error) {
      throw error;
    }
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
      .setFilterItem('showMeInFinder', '$eq', true)
      .setFilterItem('stepStarted', '$eq', 4);
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
    if (user.setting.advancedFilter.enable) {
      const tagIds: Types.ObjectId[] = user.setting.advancedFilter.tags.map(tag => new Types.ObjectId(tag.tagId));
      if (tagIds.length) {
        queryFilter.setFilterItem('tags', '$all', tagIds);
      }
    }
    return queryFilter.buildQuery()[0];
  }

  getFilterByDistance(user: User, filter) {
    if (!user.setting.discovery.onlyShowDistanceThisRange || _.isNil(user.geoLocation)) {
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

  async uploadImageV2(path): Promise<any> {
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

  async uploadImage(file): Promise<any> {
    try {
      return new Promise((resolve, reject) => {
        const streamLoad = v2.uploader.upload_stream(function (error, result) {
          if (result) {
            const resultUrl = result.secure_url;
            resolve(resultUrl);
          } else {
            reject(error);
          }
        });
        toStream(file.buffer).pipe(streamLoad);
      });
    } catch (err) {
      throw err;
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
        message: OK,
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
        message: OK,
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
        message: OK,
      };
    } catch (error) {
      throw error;
    }
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

  async updateImageVerified(dto: UpdateImageVerifiedDTO): Promise<void> {
    const user = await this.userRepo.findOne({ queryFilter: { _id: dto.userId } });
    if (!user) {
      return;
    }
    user.images.map(img => {
      const imgVerified = dto.images.find(item => item.url === img.url);
      if (imgVerified) {
        img.isVerifiedSuccess = imgVerified.isVerified;
      }
      return img;
    });
    await this.userRepo.save(user);
  }

  async encodeImageToBlurhash(imageUrl: string): Promise<string> {
    const buffer = await fetch(imageUrl).then(async res => Buffer.from(await res.arrayBuffer()));
    const { base64 } = await getPlaiceholder(buffer, { size: 4 });
    return base64;
  }

  async imageUpload(file, data: ImageProcessOptionsDTO): Promise<IResponse> {
    try {
      if (!file) throw new NotFoundException('File not found');

      if (file.mimetype !== 'image/png' && file.mimetype !== 'image/jpeg')
        throw new UnsupportedMediaTypeException('File type not support');

      const promises = [this.uploadImage(file), null, null];

      let classification = null;
      let buffer = file.buffer;

      if (data?.nsfw) {
        if (file.mimetype === 'image/png') {
          buffer = await sharp(file.buffer).jpeg().toBuffer();
        }

        const tfImage = tf.node.decodeImage(buffer);

        promises[1] = this.model.classify(tfImage as tf.Tensor3D);
      }

      if (data?.blur) {
        promises[2] = getPlaiceholder(buffer, { size: 4 });
      }

      const [url, results, blurResult] = await Promise.all(promises);

      if (results) {
        classification = results.reduce((acc, cur) => {
          acc[cur.className.toLowerCase()] = cur.probability;
          return acc;
        }, {});
      }

      return {
        success: true,
        message: OK,
        data: {
          url,
          classification,
          blur: blurResult?.base64,
        },
      };
    } catch (error) {
      throw error;
    }
  }
}
