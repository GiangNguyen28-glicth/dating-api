import { MerchandisingType } from '@common/consts';
import { IResult } from '@common/interfaces';
import { User } from '@modules/users/entities';
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { isNil } from 'lodash';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MatchRequest } from '../entities';

@Injectable()
export class BlurImageInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user: User = request.user;
    return next.handle().pipe(
      map((data: IResult<MatchRequest>) => {
        const unBlur = user.featureAccess.find(item => item.name === MerchandisingType.UN_BLUR && item.unlimited);
        const boostsMatchRequest: MatchRequest[] = [];
        for (const index in data.results) {
          if (!isNil(unBlur)) {
            (data.results[index].sender as User).images = [];
          }
        }
        data.results = boostsMatchRequest.concat(data.results);
        return data;
      }),
    );
  }
}
