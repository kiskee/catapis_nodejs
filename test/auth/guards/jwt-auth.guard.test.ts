import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from '../../../src/auth/guards/jwt-auth.guard';
import { IS_PUBLIC_KEY } from '../../../src/auth/decorators/public.decorator';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: { getAllAndOverride: jest.Mock };

  const makeCtx = (): ExecutionContext => {
    const handler = () => {};
    class DummyController {}
    return {
      // solo lo que usa el guard + mocks vacíos para el resto
      getHandler: jest.fn(() => handler),
      getClass: jest.fn(() => DummyController),
      switchToHttp: jest.fn() as any,
      switchToRpc: jest.fn() as any,
      switchToWs: jest.fn() as any,
      getType: jest.fn() as any,
      getArgs: jest.fn() as any,
      getArgByIndex: jest.fn() as any,
    } as unknown as ExecutionContext;
  };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        { provide: Reflector, useValue: { getAllAndOverride: jest.fn() } },
      ],
    }).compile();

    guard = moduleRef.get(JwtAuthGuard);
    reflector = moduleRef.get(Reflector) as any;
  });

  afterEach(() => jest.clearAllMocks());

  it('retorna true si la ruta es pública y NO llama a super.canActivate', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    const ctx = makeCtx();

    // spy sobre el canActivate del padre (AuthGuard('jwt'))
    const parentProto = Object.getPrototypeOf(Object.getPrototypeOf(guard));
    const superSpy = jest.spyOn(parentProto, 'canActivate');

    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    expect(superSpy).not.toHaveBeenCalled();
  });
  it('delegar a super.canActivate cuando NO es pública (retorno sincrónico)', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const ctx = makeCtx();

    const parentProto = Object.getPrototypeOf(Object.getPrototypeOf(guard));
    const superSpy = jest
      .spyOn(parentProto, 'canActivate')
      .mockReturnValue(true as any);

    const result = await guard.canActivate(ctx);

    expect(superSpy).toHaveBeenCalledWith(ctx);
    expect(result).toBe(true);
  });
  it('propaga un Promise<boolean> de super.canActivate cuando NO es pública', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const ctx = makeCtx();

    const parentProto = Object.getPrototypeOf(Object.getPrototypeOf(guard));
    const superSpy = jest
      .spyOn(parentProto, 'canActivate')
      .mockResolvedValue(true as any);

    const result = await guard.canActivate(ctx);

    expect(superSpy).toHaveBeenCalledWith(ctx);
    expect(result).toBe(true);
  });
});
