import { AtGuard, CurrentUser, IResponse, IResult, PaginationDTO } from '@dating/common';
import { Body, Controller, Delete, Get, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { UpdateUserLocationDTO, UpdateUserProfileDto, UpdateUserSettingDTO } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UserService } from './users.service';

@ApiTags(User.name)
@Controller('users')
export class UsersController {
  constructor(private readonly userService: UserService) {}

  @Get('current-user')
  @ApiBearerAuth()
  @UseGuards(AtGuard)
  getCurrentUser(@CurrentUser() user: User): User {
    return user;
  }

  // @Get(':id')
  // @ApiParam({ type: 'string', name: 'id' })
  // async findOne(@Param('id') id: string) {
  //   try {
  //     const user = await this.userService.findOne({ _id: id });
  //     throwIfNotExists(user, 'Không tìm thấy User');
  //     return user;
  //   } catch (error) {
  //     throw error;
  //   }
  // }

  @Get('recommendation')
  @ApiBearerAuth()
  @UseGuards(AtGuard)
  async recommendation(@CurrentUser() user: User, @Query() pagination: PaginationDTO): Promise<IResult<User>> {
    return await this.userService.recommendation(user, pagination);
  }

  @Patch('update_profile')
  @ApiBody({ type: UpdateUserProfileDto })
  @ApiBearerAuth()
  @UseGuards(AtGuard)
  async updateProfile(@CurrentUser() user: User, @Body() updateUserDto: UpdateUserProfileDto): Promise<IResponse> {
    await this.userService.findOneAndUpdate(user._id.toString(), updateUserDto);
    return {
      success: true,
      message: 'Cập nhật profile thành công',
    };
  }

  @Patch('update_location')
  @ApiBody({ type: UpdateUserLocationDTO })
  @ApiBearerAuth()
  @UseGuards(AtGuard)
  async updateLocation(@CurrentUser() user: User, @Body() location: UpdateUserLocationDTO): Promise<IResponse> {
    await this.userService.updateLocation(user._id.toString(), location);
    return {
      success: true,
      message: 'Cập nhật vị trí user thành công',
    };
  }

  @Patch('update_setting')
  @ApiBody({ type: UpdateUserSettingDTO })
  @ApiBearerAuth()
  @UseGuards(AtGuard)
  async updateSetting(@CurrentUser() user: User, @Body() setting: UpdateUserSettingDTO): Promise<IResponse> {
    await this.userService.updateSetting(user._id.toString(), { setting });
    return {
      success: true,
      message: 'Cập nhật setting thành công',
    };
  }

  @Post('insertMany')
  async insertMany() {
    await this.userService.insertManyUser();
    return true;
  }

  @Delete('deleteMany')
  async deleteMany() {
    return this.userService.deleteMany();
  }

  @Get('migrate')
  async migrate() {
    return this.userService.migrate();
  }
}
