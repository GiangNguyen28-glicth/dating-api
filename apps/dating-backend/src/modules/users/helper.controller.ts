import { AtGuard } from '@common/guards';
import { IResponse } from '@common/interfaces';
import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import axios from 'axios';
import { UserHelper } from './helper/user.helper';
import { User } from './entities';
import { CurrentUser } from '@common/decorators';

@ApiTags('Helper')
@Controller()
export class HelperController {
  constructor(private userHelper: UserHelper) {}
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

  @Get('/blur')
  async blur() {
    return await this.userHelper.blurImage();
  }
}
