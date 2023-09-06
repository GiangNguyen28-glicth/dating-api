import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    return request.user;
  },
);

export const CurrentUserWS = createParamDecorator(
  (data: string, context: ExecutionContext) => {
    console.log(
      '========================CurrentUserWS========================',
      context.switchToWs().getClient(),
    );

    const user = context.switchToWs().getClient().handshake.user;
    return user;
  },
);
