import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IResult } from '@common/interfaces';
import { User } from '@modules/users/entities';
import { MatchRequest } from '../entities';

@Injectable()
export class BlurImageInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user: User = request.user;
    return next.handle().pipe(
      map((data: IResult<MatchRequest>) => {
        if (user.featureAccess.blur.unlimited) {
          return data;
        }

        for (const index in data.results) {
          (data.results[index].sender as User).images = [];
        }
        return data;
      }),
    );
  }
}
