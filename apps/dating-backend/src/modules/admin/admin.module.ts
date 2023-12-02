import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { AtStrategy } from '@common/strategies';

import { BillingModule } from '@modules/billing';
import { OfferingModule } from '@modules/offering';
import { ConversationModule } from '@modules/conversation';
import { MatchRequestModule } from '@modules/match-request';

import { Admin, AdminSchema } from './entities';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Admin.name, schema: AdminSchema }]),
    BillingModule,
    OfferingModule,
    ConversationModule,
    MatchRequestModule,
  ],
  controllers: [AdminController],
  providers: [JwtService, AdminService, AtStrategy],
  exports: [AdminService],
})
export class AdminModule {}
