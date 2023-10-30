import { Global, Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';

import { BillingMongoRepoProvider, MessageMongoRepoProvider, UserMongoRepoProvider } from '@dating/repositories';

import { Billing, BillingSchema } from '@modules/billing/entities';
import { Message, MessageSchema } from '@modules/message/entities';
import { User, UserSchema } from '@modules/users/entities';

import { MessageConsumer, PaymentConsumer, SendMailConsumer, UserConsumer } from './consumer';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Billing.name, schema: BillingSchema }]),
    MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  providers: [
    JwtService,
    BillingMongoRepoProvider,
    UserMongoRepoProvider,
    MessageMongoRepoProvider,
    PaymentConsumer,
    UserConsumer,
    MessageConsumer,
    SendMailConsumer,
  ],
  exports: [],
})
export class RabbitConsumerModule {}
