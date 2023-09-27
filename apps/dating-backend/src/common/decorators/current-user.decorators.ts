import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator((data: unknown, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest();
  return request.user;
});

export const CurrentUserWS = createParamDecorator((data: string, context: ExecutionContext) => {
  const user = context.switchToWs().getClient().handshake.user;
  return user;
});
