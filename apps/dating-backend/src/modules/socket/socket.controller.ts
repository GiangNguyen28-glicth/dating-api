import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { AtGuard } from '@dating/common';
import { AvailableUsersParams } from './dto/call.dto';
import { SocketService } from './socket.service';

@ApiTags('Socket')
@Controller('socket')
export class SocketController {
  constructor(private socketService: SocketService) {}
  @Get('available-users')
  @ApiBearerAuth()
  @UseGuards(AtGuard)
  async getAvailableUsers(@Query() params: AvailableUsersParams) {
    return this.socketService.userAvailable(params.roomId);
  }
}
