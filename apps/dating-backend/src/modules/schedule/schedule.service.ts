import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IResponse } from '@common/interfaces';
import axios from 'axios';
import { GoogleAuth } from 'google-auth-library';

import { DATABASE_TYPE, PROVIDER_REPO } from '@common/consts';
import { ScheduleRepo } from '@dating/repositories';

import { User } from '@modules/users/entities';
import { ConversationService } from '@modules/conversation/conversation.service';
import { Conversation } from '@modules/conversation/entities';

import { CreateScheduleDTO, SuggestLocationDTO, UpdateScheduleDTO } from './dto';
import { throwIfNotExists } from '@dating/utils';

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
  constructor(
    @Inject(PROVIDER_REPO.SCHEDULE + DATABASE_TYPE.MONGO)
    private scheduleRepo: ScheduleRepo,

    private conversationService: ConversationService,
  ) {}

  async create(scheduleDto: CreateScheduleDTO, user: User): Promise<IResponse> {
    try {
      await this.conversationService.findOne({ _id: scheduleDto.conversation }, user);
      const schedule = await this.scheduleRepo.insert(scheduleDto);
      await this.scheduleRepo.save(schedule);
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
      const schedule = await this.scheduleRepo.findOne({
        queryFilter: { _id, isDeleted: false },
        populate: [{ path: 'conversation' }],
      });
      throwIfNotExists(schedule, 'Không tìm thấy cuộc hẹn');
      if (!(schedule.conversation as Conversation).members.includes(user._id)) {
        throw new NotFoundException('Không tìm thấy cuộc hẹn');
      }
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
      const schedule = await this.scheduleRepo.findOne({
        queryFilter: { _id, isDeleted: false },
        populate: [{ path: 'conversation' }],
      });
      throwIfNotExists(schedule, 'Không tìm thấy cuộc hẹn');
      if (!(schedule.conversation as Conversation).members.includes(user._id)) {
        throw new NotFoundException('Không tìm thấy cuộc hẹn');
      }
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

  async suggestLocation(suggestDto: SuggestLocationDTO): Promise<any> {
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
          instances: [suggestDto],
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
    } catch (error) {
      throw error;
    }
  }
}
