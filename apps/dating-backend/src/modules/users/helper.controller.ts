import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import axios from 'axios';

@ApiTags('Helper')
@Controller()
export class HelperController {
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

  @Get('/school')
  @ApiQuery({ type: 'string', name: 'q' })
  async getSchool(@Query('q') q: string) {
    const resp = await axios.get(`https://api.gotinder.com/v2/profile/autocomplete?locale=vi&q=${q}&type=school`, {
      headers: { 'x-auth-token': '37ac37aa-ee56-497f-8569-d5345183acfb' },
    });
    return resp.data;
  }
}
