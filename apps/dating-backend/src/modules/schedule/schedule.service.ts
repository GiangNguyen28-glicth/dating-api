import { Client, Place } from '@googlemaps/google-maps-services-js';
import { BadRequestException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { GoogleAuth } from 'google-auth-library';
import { get, isNil } from 'lodash';

import {
  DATABASE_TYPE,
  DatingStatus,
  NotificationType,
  OK,
  PROVIDER_REPO,
  RequestDatingStatus,
  ReviewDatingStatus,
  SortQuery,
} from '@common/consts';
import { IResponse, IResult } from '@common/interfaces';
import { ScheduleRepo } from '@dating/repositories';
import { FilterBuilder, formatResult, getFormatGroupISODate, throwIfNotExists } from '@dating/utils';

import { User } from '@modules/users/entities';

import { ConversationService } from '@modules/conversation/conversation.service';
import { MailService } from '@modules/mail/mail.service';
import { NotificationService } from '@modules/notification/notification.service';
import { SocketGateway } from '@modules/socket/socket.gateway';
import { SocketService } from '@modules/socket/socket.service';

import { JwtService } from '@nestjs/jwt';
import {
  CreateScheduleDTO,
  FilterGetAllScheduleDTO,
  ReviewDatingDTO,
  SuggestLocationDTO,
  UpdateScheduleDTO,
} from './dto';
import { LocationDating, Schedule } from './entities';
import { IPayloadPlace, IReviewDating } from './interfaces';
import { getAddress, getPlaceName, mappingPlaceDetail } from './utils';
import { FilterGetStatistic } from '@modules/admin/dto';

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
export class ScheduleService {
  private client = new Client({});
  constructor(
    @Inject(PROVIDER_REPO.SCHEDULE + DATABASE_TYPE.MONGO)
    private scheduleRepo: ScheduleRepo,

    private conversationService: ConversationService,
    private socketGateway: SocketGateway,
    private socketService: SocketService,
    private notiService: NotificationService,
    private configService: ConfigService,
    private mailService: MailService,
    private jwtService: JwtService,
  ) {}

  async getSchedulePlaceDetail(_id: string, user: User): Promise<Schedule> {
    const schedule = this.scheduleRepo.toJSON(await this.findOne(_id, user._id.toString()));
    const locationsDating = await Promise.all(
      schedule.locationDating.map(async place_id => {
        const placeDetail = await this.getPlaceById(place_id);
        const newLocation = new LocationDating();
        newLocation.place_id = place_id;
        if (placeDetail) {
          const photo = get(placeDetail, 'photos.0.photo_reference');
          newLocation.image = await this.getPhotoByPhotoReference(photo);
          mappingPlaceDetail(placeDetail, newLocation);
        }
        return newLocation;
      }),
    );
    schedule['locationDating'] = [...locationsDating] as any;
    return schedule;
  }

  async findOne(_id: string, userId: string): Promise<Schedule> {
    try {
      const userField: string = ['_id', 'images', 'email', 'name'].join(' ');
      const schedule = await this.scheduleRepo.findOne({
        queryFilter: { _id, isDeleted: false },
        populate: [
          { path: 'sender', select: userField },
          { path: 'receiver', select: userField },
        ],
      });
      throwIfNotExists(schedule, 'Không tìm thấy cuộc hẹn');
      const memberId: string =
        get(schedule, 'receiver._id', null) == userId
          ? get(schedule, 'sender._id', null)
          : get(schedule, 'receiver._id', null);
      const conversation = await this.conversationService.findOneByMembers([userId, memberId]);
      if (!conversation) {
        throw new ForbiddenException('Forbidden access');
      }

      return schedule;
    } catch (error) {
      throw error;
    }
  }

  async findAll(filter: FilterGetAllScheduleDTO, user: User): Promise<IResult<Schedule>> {
    try {
      const userField: string = ['_id', 'images', 'email', 'name'].join(' ');
      const queryBuilder = new FilterBuilder<Schedule>()
        .setFilterItem('status', '$eq', filter?.status)
        .setFilterItem('sender', '$eq', filter?.sender)
        .setFilterItem('receiver', '$eq', filter?.receiver)
        .setFilterItem('appointmentDate', '$gte', filter?.fromDate)
        .setFilterItem('appointmentDate', '$lte', filter?.toDate)
        .setSortItem('updatedAt', 'descending');
      if (!user.role) {
        queryBuilder.setFilterItemWithObject('$or', [{ receiver: filter?.userId }, { sender: filter?.userId }]);
      }
      const [queryFilter, sortOption] = queryBuilder.buildQuery();
      const [results, totalCount] = await Promise.all([
        this.scheduleRepo.findAll({
          queryFilter,
          sortOption,
          populate: [
            { path: 'sender', select: userField },
            { path: 'receiver', select: userField },
          ],
        }),
        this.scheduleRepo.count(queryFilter),
      ]);
      return formatResult(results, totalCount, { page: filter?.page, size: filter?.size });
    } catch (error) {
      throw error;
    }
  }

  async getScheduleByAppointmentDateJob(queryFilter: Partial<Schedule>, sortOption: SortQuery): Promise<Schedule[]> {
    try {
      const userField: string = ['_id', 'images', 'email'].join(' ');
      return await this.scheduleRepo.findAll({
        queryFilter,
        populate: [
          { path: 'sender', select: userField },
          { path: 'receiver', select: userField },
        ],
        sortOption,
      });
    } catch (error) {
      throw error;
    }
  }

  async create(scheduleDto: CreateScheduleDTO, user: User): Promise<IResponse> {
    try {
      const conversation = await this.conversationService.findOneByMembers([user._id.toString(), scheduleDto.receiver]);
      throwIfNotExists(conversation, 'Bạn chưa kết đôi với user này');
      const schedule: Schedule = await this.scheduleRepo.insert(scheduleDto);
      schedule.sender = user._id;
      const receiver: string = conversation.members.find(member => member != user._id.toString()).toString();
      await this.scheduleRepo.save(schedule);
      const [socketIds, notification] = await Promise.all([
        this.socketService.getSocketIdsByUser(schedule.receiver.toString()),
        this.notiService.create({
          sender: user,
          receiver: receiver,
          type: NotificationType.INVITE_SCHEDULE_DATING,
          schedule,
        }),
      ]);
      await this.socketGateway.sendEventToClient(socketIds, 'newNotification', notification);
      return {
        success: true,
        message: 'Tạo lịch hẹn thành công',
      };
    } catch (error) {
      throw error;
    }
  }

  async update(_id: string, updateDto: UpdateScheduleDTO, user: User): Promise<IResponse> {
    try {
      const schedule = await this.findOne(_id, user._id.toString());
      await this.scheduleRepo.save(Object.assign(schedule, updateDto));
      return {
        success: true,
        message: 'Cập nhật cuộc hẹn thành công',
      };
    } catch (error) {
      throw error;
    }
  }

  async delete(_id: string, user: User): Promise<IResponse> {
    try {
      const schedule = await this.findOne(_id, user._id.toString());
      schedule.isDeleted = true;
      await this.scheduleRepo.save(schedule);
      return {
        success: true,
        message: 'Xóa cuộc hẹn thành công',
      };
    } catch (error) {
      throw error;
    }
  }

  async action(_id: string, user: User, status: RequestDatingStatus): Promise<IResponse> {
    try {
      const userField: string = ['_id', 'images', 'email'].join(' ');
      const schedule = await this.scheduleRepo.findOne({
        queryFilter: { _id, isDeleted: false },
        populate: [
          { path: 'sender', select: userField },
          { path: 'receiver', select: userField },
        ],
      });
      throwIfNotExists(schedule, 'Không tìm thấy cuộc hẹn');
      let receiver: User = get(schedule, 'sender', null);
      if (user._id.toString() == String(get(schedule, 'sender._id', null))) {
        receiver = get(schedule, 'receiver', null);
      }

      const conversation = await this.conversationService.findOneByMembers([user._id, receiver._id]);
      if (!conversation) {
        throw new ForbiddenException('Forbidden access');
      }

      switch (status) {
        case RequestDatingStatus.ACCEPT:
          return await this.accept(user, schedule, receiver);
        case RequestDatingStatus.CANCEL:
          return await this.cancel(user, schedule, receiver);
        case RequestDatingStatus.DECLINE:
          return await this.decline(user, schedule, receiver);
        default:
          throw new BadRequestException('Status does not accept');
      }
    } catch (error) {
      throw error;
    }
  }

  async cancel(user: User, schedule: Schedule, receiver: User): Promise<IResponse> {
    try {
      if (schedule.status === RequestDatingStatus.WAIT_FOR_APPROVAL) {
        schedule.status = RequestDatingStatus.CANCEL;
        await Promise.all([
          this.scheduleRepo.save(schedule),
          this.notiService.deleteMany({
            schedule: schedule._id,
            receiver: user._id,
          }),
        ]);
        return {
          success: true,
          message: 'Hủy cuộc hẹn thành công',
        };
      }

      if (schedule.status != RequestDatingStatus.ACCEPT) {
        throw new BadRequestException('Status is not accept');
      }

      const promises: Promise<any>[] = [];
      // if (receiver.email) {
      //   promises.push(
      //     this.mailService.sendMail({ to: receiver.email, subject: 'Cancel Schedule', html: '<p>Hehe</p>' }),
      //   );
      // }

      schedule.status = RequestDatingStatus.CANCEL;
      await this.scheduleRepo.save(schedule);
      promises.push(
        this.socketService.getSocketIdsByUser(receiver._id.toString()),
        this.notiService.create({
          sender: user,
          receiver,
          type: NotificationType.CANCEL_SCHEDULE_DATING,
          description: NotificationType.CANCEL_SCHEDULE_DATING,
          schedule,
        }),
      );

      // const [, , socketIds, notification] = await Promise.all(promises);
      const [socketIds, notification] = await Promise.all(promises);

      await this.socketGateway.sendEventToClient(socketIds, 'newNotification', notification);

      return {
        success: true,
        message: 'Hủy cuộc hẹn thành công',
      };
    } catch (error) {
      throw error;
    }
  }

  async accept(user: User, schedule: Schedule, receiver: User): Promise<IResponse> {
    try {
      if (schedule.status != RequestDatingStatus.WAIT_FOR_APPROVAL) {
        throw new BadRequestException('Status is not accept');
      }

      schedule.status = RequestDatingStatus.ACCEPT;
      await this.scheduleRepo.save(schedule);

      const promises: Promise<any>[] = [];
      // if (receiver.email) {
      //   promises.push(
      //     this.mailService.sendMail({ to: receiver.email, subject: 'Accept schedule', html: '<p>Hehe</p>' }),
      //   );
      // }
      promises.push(
        this.notiService.deleteMany({
          receiver: user._id,
          schedule: schedule._id,
        }),
        this.socketService.getSocketIdsByUser(receiver._id.toString()),
        this.notiService.create({
          sender: user,
          receiver,
          type: NotificationType.ACCEPT_SCHEDULE_DATING,
          description: NotificationType.ACCEPT_SCHEDULE_DATING,
          schedule,
        }),
      );

      // const [, , socketIds, notification] = await Promise.all(promises);
      const [, socketIds, notification] = await Promise.all(promises);
      await this.socketGateway.sendEventToClient(socketIds, 'newNotification', {
        notificationId: notification._id,
        schedule,
      });
      return {
        success: true,
        message: OK,
      };
    } catch (error) {
      throw error;
    }
  }

  async decline(user: User, schedule: Schedule, receiver: User): Promise<IResponse> {
    try {
      if (schedule.status != RequestDatingStatus.WAIT_FOR_APPROVAL) {
        throw new BadRequestException('Status is not accept');
      }

      schedule.status = RequestDatingStatus.DECLINE;
      await this.scheduleRepo.save(schedule);

      const promises: Promise<any>[] = [];
      // if (receiver.email) {
      //   promises.push(
      //     this.mailService.sendMail({ to: receiver.email, subject: 'Decline schedule', html: '<p>Hehe</p>' }),
      //   );
      // }
      promises.push(
        this.notiService.deleteMany({
          schedule: schedule._id,
          receiver: user._id,
        }),
        this.socketService.getSocketIdsByUser(receiver._id.toString()),
        this.notiService.create({
          sender: user,
          receiver,
          type: NotificationType.DECLINE_SCHEDULE_DATING,
          description: NotificationType.DECLINE_SCHEDULE_DATING,
          schedule,
        }),
      );

      // const [, , socketIds, notification] = await Promise.all(promises);
      const [, socketIds, notification] = await Promise.all(promises);
      await this.socketGateway.sendEventToClient(socketIds, 'newNotification', {
        notificationId: notification._id,
        schedule,
      });
      return {
        success: true,
        message: OK,
      };
    } catch (error) {
      throw error;
    }
  }

  async suggestLocation(suggestDto: SuggestLocationDTO): Promise<LocationDating[]> {
    try {
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
              content: suggestDto.content,
            },
          ],
          parameters: {
            maxOutputTokens: 1024,
            temperature: 0.2,
            candidateCount: 1,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${resToken.token}`,
          },
        },
      );
      const data = await response.data;
      const aiSuggestionData: string[] = get(data, 'predictions[0].content').split('\n');
      const places: IPayloadPlace[] = aiSuggestionData.map(content => {
        return this.getPlaceByContent(suggestDto, content);
      });

      return await Promise.all(
        places.map(async place => {
          return this.searchText(place);
        }),
      );
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async searchText(payloadPlace: IPayloadPlace): Promise<LocationDating> {
    try {
      const results = await this.client.textSearch({
        params: {
          key: this.configService.get<string>('GOOGLE_MAP_API_KEY'),
          query: payloadPlace.textSearch,
        },
      });
      // Trả về kết quả tìm kiếm
      return this.mappingSuggestLocation(results.data.results, payloadPlace);
    } catch (error) {
      return null;
    }
  }

  async getPlaceById(place_id: string): Promise<Place> {
    try {
      const results = await this.client.placeDetails({
        params: {
          key: this.configService.get<string>('GOOGLE_MAP_API_KEY'),
          place_id,
        },
      });
      return results.data.result;
    } catch (error) {
      throw error;
    }
  }

  async getPhotoByPhotoReference(photoreference: string): Promise<string> {
    if (!photoreference) {
      return null;
    }
    try {
      const results = await axios.get(
        `https://maps.googleapis.com/maps/api/place/photo?photoreference=${photoreference}&sensor=false&maxheight=400&maxwidth=400&key=${this.configService.get<string>(
          'GOOGLE_MAP_API_KEY',
        )}`,
      );
      return `https://lh3.googleusercontent.com/${results.request.path}`;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async mappingSuggestLocation(results: Place[], payloadPlace: IPayloadPlace): Promise<LocationDating> {
    const locationDating: LocationDating = new LocationDating();
    if (!results.length) {
      locationDating.isEmpty = true;
      locationDating.name = payloadPlace.name;
      locationDating.address = payloadPlace.address;
      return locationDating;
    }
    const place = { ...results[0] };
    const photoReference = get(place, 'photos[0].photo_reference', null);
    locationDating.address = get(place, 'formatted_address', null);
    locationDating.name = get(place, 'name', null);
    locationDating.place_id = get(place, 'place_id', null);
    locationDating.rating = get(place, 'rating', null);
    locationDating.userRatingsTotal = get(place, 'user_ratings_total', null);
    const [placeDetail, photo] = await Promise.all([
      this.getPlaceById(locationDating.place_id),
      this.getPhotoByPhotoReference(photoReference),
    ]);
    locationDating.website = get(placeDetail, 'website', null);
    locationDating.url = get(placeDetail, 'url', null);
    locationDating.reviews = get(placeDetail, 'reviews', null);
    locationDating.image = photo;
    // locationDating.geoLocation = [get(placeDetail,)]
    return locationDating;
  }

  getPlaceByContent(suggestDto: SuggestLocationDTO, rawContent: string): IPayloadPlace {
    const place: IPayloadPlace = {};
    const address = getAddress(rawContent);
    place.name = getPlaceName(rawContent);
    place.address = address ? address : suggestDto.location;
    if (place.name) {
      place.textSearch = place.name + ' ' + place.address;
    }
    place.rawContent = rawContent;
    return place;
  }

  async countScheduleByStatus(filter: FilterGetAllScheduleDTO): Promise<IResponse> {
    try {
      const [queryFilter] = new FilterBuilder<Schedule>()
        .setFilterItem('status', '$eq', filter?.status)
        .setFilterItem('isDeleted', '$eq', false, true)
        .setFilterItemWithObject('$or', [{ receiver: filter?.userId }, { sender: filter?.userId }])
        .buildQuery();
      const totalCount = await this.scheduleRepo.count(queryFilter);
      return {
        success: true,
        data: {
          totalCount,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async reviewDating(token: string, review: ReviewDatingDTO): Promise<IResponse> {
    try {
      const payload: IReviewDating = await this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_VERIFICATION_REVIEW_SCHEDULE_TOKEN_SECRET'),
      });
      review.createdBy = payload.user;
      const schedule = await this.findOne(payload.schedule, payload.user);
      const isSubmitReview = schedule.reviews.find(review => review.createdBy === payload.user);
      if (!isNil(isSubmitReview)) {
        throw new BadRequestException('Đánh giá cho cuộc hẹn đã được submit');
      }
      if (review.datingStatus === DatingStatus.YES) {
        if (!schedule.reviews.length || schedule.reviews[0].datingStatus === DatingStatus.YES) {
          const receiver: any =
            String(get(schedule, 'receiver._id', null)) === payload.user ? schedule.sender : schedule.receiver;
          const notification = await this.notiService.create({
            sender: payload.user,
            receiver,
            type: NotificationType.SCHEDULE_DATING,
            description: NotificationType.POSITIVE_REVIEW_DATING,
            schedule,
          });
          const socketIds = await this.socketService.getSocketIdsByUser(receiver._id);
          await this.socketGateway.sendEventToClient(socketIds, 'newNotification', notification);
        }
      }
      schedule.reviews.push(review);
      const { NOT_JOINING, FAILED } = ReviewDatingStatus;
      if (![NOT_JOINING, FAILED].includes(schedule.reviewDatingStatus)) {
        schedule.reviewDatingStatus = Schedule.getReviewDatingStatusDating(schedule.reviews);
      }
      await this.scheduleRepo.save(schedule);
      return {
        success: true,
        message: OK,
      };
    } catch (error) {
      throw error;
    }
  }

  async sendReviewDating(payload: IReviewDating): Promise<string> {
    const token = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_VERIFICATION_REVIEW_SCHEDULE_TOKEN_SECRET'),
      expiresIn: this.configService.get<number>('JWT_VERIFICATION_REVIEW_SCHEDULE_EXPIRATION_TIME'),
    });
    return token;
  }

  async verifyTokenReviewDating(token: string): Promise<IResponse> {
    try {
      const payload: IReviewDating = await this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_VERIFICATION_REVIEW_SCHEDULE_TOKEN_SECRET'),
      });
      const schedule = await this.findOne(payload.schedule, payload.user);
      const currentUser = get(schedule, 'sender._id', null) === payload.user ? schedule.sender : schedule.receiver;
      if (!schedule.reviews.length) {
        return {
          success: true,
          data: {
            schedule,
            currentUser,
          },
        };
      }
      const isSubmitReview = schedule.reviews.find(review => review.createdBy === payload.user);
      if (!isNil(isSubmitReview)) {
        throw new BadRequestException('Đánh giá cho cuộc hẹn đã được submit');
      }
      return {
        success: true,
        data: {
          schedule,
          currentUser,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  //======================================Admin======================================
  async statisticByRangeDate(filter: FilterGetStatistic): Promise<any> {
    filter.format = getFormatGroupISODate(filter?.typeRange);
    const queryBuilder = new FilterBuilder<Schedule>().setFilterItem('status', '$eq', RequestDatingStatus.ACCEPT);
    if (filter?.fromDate && filter?.toDate) {
      queryBuilder.setFilterItemWithObject('createdAt', { $gte: filter?.fromDate, $lte: filter?.toDate });
    }
    const [queryFilter] = queryBuilder.buildQuery();
    const appointment = await this.scheduleRepo.statisticByRangeDate(queryFilter, filter.format);
    return appointment;
  }
}
