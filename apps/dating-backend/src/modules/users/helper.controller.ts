import {
  Body,
  Controller,
  Get,
  OnModuleInit,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import axios from 'axios';
import * as tf from '@tensorflow/tfjs-node';
import * as nsfw from 'nsfwjs';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const sharp = require('sharp');

import { CurrentUser } from '@common/decorators';
import { AtGuard } from '@common/guards';
import { IResponse } from '@common/interfaces';

import { UpdateImageVerifiedDTO } from './dto';
import { User } from './entities';
import { UserHelper } from './helper/user.helper';

@ApiTags('Helper')
@Controller()
export class HelperController implements OnModuleInit {
  private model: nsfw.NSFWJS;
  constructor(private userHelper: UserHelper) {}

  async onModuleInit() {
    this.model = await nsfw.load('https://res.cloudinary.com/finder-next/raw/upload/v1700214306/models/model/', {
      size: 299,
    });
  }

  @Get('/location/province')
  async getProvince() {
    return (await axios.get('https://provinces.open-api.vn/api/')).data;
  }
  @Get('/location/district/:code')
  @ApiParam({ type: 'string', name: 'code' })
  async getDistrict(@Param('code') code: string) {
    const resp = await axios.get(`https://provinces.open-api.vn/api/p/${code}?depth=2`);
    return resp.data;
  }

  @Get('/location/wards/:code')
  @ApiParam({ type: 'string', name: 'code' })
  async getWards(@Param('code') code: string) {
    const resp = await axios.get('https://provinces.open-api.vn/api/d/' + code + '?depth=2');
    return resp.data;
  }

  @Get('spotify/info')
  @UseGuards(AtGuard)
  @ApiQuery({ name: 'token', type: 'string' })
  async getSpotifyInfo(@Query() data, @CurrentUser() user: User): Promise<IResponse> {
    const { token } = data;
    return await this.userHelper.socialSpotifyGetTopArtists(token, user);
  }

  @Get('ins/info')
  @UseGuards(AtGuard)
  @ApiQuery({ name: 'token', type: 'string' })
  async getInsInfo(@Query() data, @CurrentUser() user: User): Promise<IResponse> {
    const { token } = data;
    return await this.userHelper.socialInsGetInfo(token, user);
  }

  @Post('ins/unlink')
  @UseGuards(AtGuard)
  async insUnlink(@CurrentUser() user: User): Promise<IResponse> {
    return await this.userHelper.insUnlink(user);
  }

  @Post('spotify/unlink')
  @UseGuards(AtGuard)
  async spotifyUnlink(@CurrentUser() user: User): Promise<IResponse> {
    return await this.userHelper.spotifyUnlink(user);
  }

  @Get('/school')
  @ApiQuery({ type: 'string', name: 'q' })
  async getSchool(@Query('q') q: string) {
    const resp = await axios.get(`https://api.gotinder.com/v2/profile/autocomplete?locale=vi&q=${q}&type=school`, {
      headers: { 'x-auth-token': '37ac37aa-ee56-497f-8569-d5345183acfb' },
    });
    return resp.data;
  }

  @Post('/images/verified')
  async updateImageVerified(@Body() dto: UpdateImageVerifiedDTO): Promise<void> {
    await this.userHelper.updateImageVerified(dto);
  }

  @Post('/images/upload')
  @UseInterceptors(FileInterceptor('file'))
  async imageUpload(@UploadedFile() file): Promise<IResponse> {
    if (!file) return { success: false, message: 'File not found' };

    if (file.mimetype !== 'image/png' && file.mimetype !== 'image/jpeg')
      return { success: false, message: 'File type not support' };

    const promises = [this.userHelper.uploadImage(file)];

    let buffer = file.buffer;

    if (file.mimetype === 'image/png') {
      buffer = await sharp(file.buffer).jpeg().toBuffer();
    }

    const tfImage = tf.node.decodeImage(buffer);

    promises.push(this.model.classify(tfImage as tf.Tensor3D));

    const [url, results] = await Promise.all(promises);

    const predictions = results.reduce((acc, cur) => {
      acc[cur.className] = cur.probability;
      return acc;
    }, {});

    return {
      success: true,
      message: 'Ok',
      data: {
        url,
        predictions,
      },
    };
  }
}
