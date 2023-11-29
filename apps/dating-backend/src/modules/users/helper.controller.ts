import { Body, Controller, Get, Param, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import axios from 'axios';
import * as nsfw from 'nsfwjs';

import { CurrentUser } from '@common/decorators';
import { AtGuard } from '@common/guards';
import { IResponse } from '@common/interfaces';

import { TokenDTO } from '@common/dto';
import { ImageProcessOptionsDTO, UpdateImageVerifiedDTO } from './dto';
import { User } from './entities';
import { UserHelper } from './helper/user.helper';

@ApiTags('Helper')
@Controller()
export class HelperController {
  constructor(private userHelper: UserHelper) {}

  @Get('/location/province')
  async getProvince() {
    try {
      return (await axios.get('https://provinces.open-api.vn/api/')).data;
    } catch (error) {
      throw error;
    }
  }
  @Get('/location/district/:code')
  @ApiParam({ type: 'string', name: 'code' })
  async getDistrict(@Param('code') code: string) {
    try {
      return (await axios.get(`https://provinces.open-api.vn/api/p/${code}?depth=2`)).data;
    } catch (error) {
      throw error;
    }
  }

  @Get('/location/wards/:code')
  @ApiParam({ type: 'string', name: 'code' })
  async getWards(@Param('code') code: string) {
    try {
      return (await axios.get('https://provinces.open-api.vn/api/d/' + code + '?depth=2')).data;
    } catch (error) {
      throw error;
    }
  }

  @Get('spotify/info')
  @UseGuards(AtGuard)
  @ApiQuery({ name: 'token', type: 'string' })
  async getSpotifyInfo(@Query() data: TokenDTO, @CurrentUser() user: User): Promise<IResponse> {
    const { token } = data;
    return await this.userHelper.socialSpotifyGetTopArtists(token, user);
  }

  @Get('ins/info')
  @UseGuards(AtGuard)
  @ApiQuery({ name: 'token', type: 'string' })
  async getInsInfo(@Query() data: TokenDTO, @CurrentUser() user: User): Promise<IResponse> {
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
  async imageUpload(@UploadedFile() file, @Body() data: ImageProcessOptionsDTO): Promise<IResponse> {
    return await this.userHelper.imageUpload(file, data);
  }
}
