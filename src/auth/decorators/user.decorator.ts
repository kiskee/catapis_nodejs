// src/auth/decorators/user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
export const User = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest();
  return req.user; // { id, email } desde JwtStrategy
});
