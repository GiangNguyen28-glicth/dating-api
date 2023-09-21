import { CloudinaryProvider } from '@common/provider';
import { Global, Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ActionModule } from '@modules/action';
import { UserMongoRepoProvider } from '@dating/repositories';

import { User, UserSchema } from './entities';
import { HelperController } from './helper.controller';
import { UserHelper } from './helper/user.helper';
import { UsersController } from './users.controller';
import { UserService } from './users.service';

@Global()
@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: User.name,
        useFactory: () => {
          UserSchema.pre('save', function (next) {
            if (this.birthDate && !this.age) {
              const currentDate = new Date();
              this.age = currentDate.getFullYear() - this.birthDate.getFullYear();
            }
            return next();
          });
          return UserSchema;
        },
      },
    ]),
    forwardRef(() => ActionModule),
  ],
  controllers: [UsersController, HelperController],
  providers: [UserService, UserHelper, UserMongoRepoProvider, CloudinaryProvider],
  exports: [UserService, UserHelper, UserMongoRepoProvider],
})
export class UsersModule {}
