import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CloudinaryProvider } from '@common/provider';
import { LANGUAGE } from '@dating/common';
import { UserMongoRepoProvider } from '@dating/repositories';
import { toKeyword, toSlug } from '@dating/utils';
import { ActionModule } from '@modules/action';
import { User, UserSchema } from './entities/user.entity';
import { HelperController } from './helper.controller';
import { UserHelper } from './helper/user.helper';
import { UsersController } from './users.controller';
import { UserService } from './users.service';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: User.name,
        useFactory: () => {
          UserSchema.pre('save', function (next) {
            if (this.name) {
              this.slug = toSlug(this.name, LANGUAGE.VI);
              this.keyword = toKeyword(this.slug);
              this.slug += '-' + this._id.toString();
            }
            if (this.birthDate && !this.age) {
              const currentDate = new Date();
              this.age =
                currentDate.getFullYear() - this.birthDate.getFullYear();
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
  providers: [
    UserService,
    UserHelper,
    UserMongoRepoProvider,
    CloudinaryProvider,
  ],
  exports: [UserService, UserHelper, UserMongoRepoProvider],
})
export class UsersModule {}
