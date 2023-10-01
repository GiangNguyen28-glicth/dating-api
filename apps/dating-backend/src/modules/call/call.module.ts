import { Global, Module } from '@nestjs/common';

import { WsStrategy } from '@common/strategies';

import { CallController } from './call.gateway';

@Global()
@Module({
  providers: [CallController, WsStrategy],
  exports: [CallController],
})
export class CallModule {}
