import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfirmChannel } from 'amqplib';
import { isNil } from 'lodash';

import { RabbitService } from '@app/shared';
import { DATABASE_TYPE, PROVIDER_REPO, QUEUE_NAME, RMQ_CHANNEL } from '@common/consts';
import { IUserImageBuilder } from '@common/message';

import { ImageDTO } from '@modules/users/dto';
import { SpotifyInfo, User } from '@modules/users/entities';
import { ImageService } from '../../images/image.service';
import { UserRepo } from '@dating/repositories';

@Injectable()
export class UserConsumer implements OnModuleInit, OnModuleDestroy {
  private channel: ConfirmChannel;

  constructor(
    @Inject(PROVIDER_REPO.USER + DATABASE_TYPE.MONGO)
    private userRepo: UserRepo,

    private rabbitService: RabbitService,
    private imageService: ImageService,
  ) {}

  async onModuleInit() {
    await this.rabbitService.connectRmq();
    this.rabbitService.setChannelName(RMQ_CHANNEL.USER_CHANNEL);
    this.channel = await this.rabbitService.createChannel(RMQ_CHANNEL.USER_CHANNEL);
    this.channel.prefetch(100);

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
    await Promise.all([this.consumeImageBuilder()]);
    await this.rabbitService.startConsuming(RMQ_CHANNEL.USER_CHANNEL);
  }

  async consumeImageBuilder(): Promise<void> {
    const hook = async (): Promise<void> => {
      this.channel.consume(
        QUEUE_NAME.USER_IMAGES_BUILDER,
        async msg => {
          try {
            const content: IUserImageBuilder = this.rabbitService.getContentFromMessage(msg);
            await this.processEncodeImage(content);
            await this.channel.ack(msg);
          } catch (error) {
            console.log(error);
            await this.rabbitService.reject(msg);
          }
        },
        { noAck: false },
      );
    };
    this.rabbitService.pushToHooks(RMQ_CHANNEL.USER_CHANNEL, hook);
  }

  onModuleDestroy() {
    return;
    throw new Error('Method not implemented.');
  }

  async processEncodeImage(msg: IUserImageBuilder): Promise<void> {
    try {
      const entities: Pick<Partial<User>, 'images' | 'insImages' | 'blurAvatar' | 'spotifyInfo'> = {};
      if (msg.images) {
        const promises: Promise<any>[] = [this.processBlurImages(msg.images)];
        if (msg.blurAvatar) {
          promises.push(this.imageService.transformImage(msg.images[0].url, msg.userId));
        }
        const [images, blurAvatar] = await Promise.all(promises);
        if (!isNil(blurAvatar)) {
          entities.blurAvatar = blurAvatar;
        }
        if (!isNil(images)) {
          entities.images = images;
        }
      }
      if (msg.insImages) {
        entities.insImages = await this.processBlurImages(msg.insImages);
      }
      if (msg.spotifyInfo) {
        entities.spotifyInfo = await this.processBlurImagesSpotify(msg.spotifyInfo);
      }
      await this.userRepo.findOneAndUpdate(msg.userId, entities);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async processBlurImagesSpotify(spotifyInfo: SpotifyInfo[]): Promise<SpotifyInfo[]> {
    return await Promise.all(
      spotifyInfo.map(async info => {
        info.image.blur = await this.imageService.encodeImageToBlurhash(info.image.url);
        return info;
      }),
    );
  }

  async processBlurImages(images: ImageDTO[]): Promise<ImageDTO[]> {
    return await Promise.all(
      images.map(async image => {
        if (!image.blur) {
          image.blur = await this.imageService.encodeImageToBlurhash(image.url);
        }
        return image;
      }),
    );
  }
}
