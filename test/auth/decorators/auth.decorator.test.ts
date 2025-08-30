import 'reflect-metadata';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { JwtAuthGuard } from '../../../src/auth/guards/jwt-auth.guard';
import { Auth } from '../../../src/auth/decorators/auth.decorator';

jest.mock('@nestjs/swagger', () => ({
  ApiBearerAuth: jest.fn(),
}));
import { ApiBearerAuth } from '@nestjs/swagger';

function getMethodMeta(key: string, target: any, propertyKey: string) {
  return (
    Reflect.getMetadata(key, target, propertyKey) ??
    Reflect.getMetadata(key, target[propertyKey])
  );
}

describe('@Auth decorator', () => {
  beforeEach(() => jest.clearAllMocks());

  it('aplica UseGuards(JwtAuthGuard) y ejecuta ApiBearerAuth en una CLASE', () => {
    const swaggerDecorator = jest.fn();
    (ApiBearerAuth as jest.Mock).mockReturnValue(swaggerDecorator);

    @Auth()
    class Ctrl {}

    expect(ApiBearerAuth).toHaveBeenCalledTimes(1);
    expect(swaggerDecorator).toHaveBeenCalledTimes(1);

    const guards = Reflect.getMetadata(GUARDS_METADATA, Ctrl);
    expect(guards).toBeDefined();
    expect(guards).toEqual(expect.arrayContaining([JwtAuthGuard]));
  });

  it('aplica UseGuards(JwtAuthGuard) y ejecuta ApiBearerAuth en un MÉTODO', () => {
    const swaggerDecorator = jest.fn();
    (ApiBearerAuth as jest.Mock).mockReturnValue(swaggerDecorator);

    class Ctrl {
      @Auth()
      list() {}
    }

    expect(ApiBearerAuth).toHaveBeenCalledTimes(1);
    expect(swaggerDecorator).toHaveBeenCalledTimes(1);

    const guards = getMethodMeta(GUARDS_METADATA, Ctrl.prototype, 'list');
    expect(guards).toBeDefined();
    expect(guards).toEqual(expect.arrayContaining([JwtAuthGuard]));
  });
});
