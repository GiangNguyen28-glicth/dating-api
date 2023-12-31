import { docToObject } from '@dating/utils';
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { get, isNil } from 'lodash';
import { Observable } from 'rxjs';
import { UpdateUserProfileDto } from '../dto';
import { User } from '../entities';

@Injectable()
export class UpdateUserProfileInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user: User = docToObject(request.user);
    let isChangeSetting = false;
    const setting = { ...user.setting };
    if (request.body) {
      const data: UpdateUserProfileDto = request.body;
      if (get(data, 'heightSetting.value')) {
        data.height = get(data, 'heightSetting.value');
        if (!isNil(get(data, 'heightSetting.isShowInFinder'))) {
          setting.hiddenProfile.height = data.heightSetting.isShowInFinder;
          isChangeSetting = true;
        }
      }
      if (get(data, 'weightSetting.value')) {
        data.weight = get(data, 'weightSetting.value');
        if (!isNil(get(data, 'weightSetting.isShowInFinder'))) {
          setting.hiddenProfile.weight = data.weightSetting.isShowInFinder;
          isChangeSetting = true;
        }
      }
      if (isChangeSetting) {
        data.setting = setting;
      }
      request.body = data;
    }
    return next.handle();
  }
}
