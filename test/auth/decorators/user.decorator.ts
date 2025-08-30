// user.decorator.spec.ts
import 'reflect-metadata';
import type { ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { User } from '../../../src/auth/decorators/user.decorator';

const makeCtx = (req: any): ExecutionContext => {
  const getRequest = jest.fn(() => req);
  const switchToHttp = jest.fn(() => ({ getRequest }));
  return {
    switchToHttp,
    switchToRpc: jest.fn() as any,
    switchToWs: jest.fn() as any,
    getType: jest.fn() as any,
    getClass: jest.fn() as any,
    getHandler: jest.fn() as any,
    getArgs: jest.fn() as any,
    getArgByIndex: jest.fn() as any,
  } as unknown as ExecutionContext;
};

// aplica @User() (o @User(data)) a un parámetro índice 0
const applyParamDecorator = (decoratorFactory: any, target: any, method: string, index = 0) => {
  const paramDecorator: ParameterDecorator = decoratorFactory as any;
  // cuando es param decorator, hay que invocarlo para obtener el "aplicador"
  const applicator = (paramDecorator as any)(); // sin data
  applicator(target, method, index);
};

const applyParamDecoratorWithData = (decoratorFactory: any, data: any, target: any, method: string, index = 0) => {
  const applicator = (decoratorFactory as any)(data); // con data
  applicator(target, method, index);
};

const getParamMeta = (target: any, method: string) => {
  const meta = Reflect.getMetadata(ROUTE_ARGS_METADATA, target, method);
  expect(meta).toBeDefined();
  const entry = Object.values(meta)[0] as any; // único parámetro decorado
  expect(entry).toBeDefined();
  expect(entry.factory).toBeInstanceOf(Function);
  return entry;
};

describe('@User param decorator', () => {
  it('retorna req.user desde la factory del decorador', () => {
    class Ctrl { handler(_user: any) {} }

    // aplica @User() al parámetro 0 de handler
    applyParamDecorator(User, Ctrl.prototype, 'handler');

    const entry = getParamMeta(Ctrl.prototype, 'handler');

    const req = { user: { id: 'u1', email: 'test@example.com' } };
    const ctx = makeCtx(req);

    const result = entry.factory(undefined, ctx); // (data, ctx)
    expect(result).toEqual(req.user);
  });

  it('retorna undefined si req.user no existe', () => {
    class Ctrl { handler(_user: any) {} }

    applyParamDecorator(User, Ctrl.prototype, 'handler');

    const entry = getParamMeta(Ctrl.prototype, 'handler');

    const req = {};
    const ctx = makeCtx(req);

    const result = entry.factory(undefined, ctx);
    expect(result).toBeUndefined();
  });

  it('ignora cualquier "data" pasado al decorador', () => {
    class Ctrl { handler(_user: any) {} }

    // aplica @User({ cualquier: 'cosa' })
    applyParamDecoratorWithData(User, { cualquier: 'cosa' }, Ctrl.prototype, 'handler');

    const entry = getParamMeta(Ctrl.prototype, 'handler');

    const req = { user: { id: 'u2' } };
    const ctx = makeCtx(req);

    const r1 = entry.factory(undefined, ctx);
    const r2 = entry.factory({ cualquier: 'otra' }, ctx);

    expect(r1).toEqual(req.user);
    expect(r2).toEqual(req.user);
  });
});
