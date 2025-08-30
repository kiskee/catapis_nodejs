const mockServerlessHandler = jest.fn();
const serverlessMock = jest.fn(() => mockServerlessHandler);
jest.mock('serverless-http', () => serverlessMock);

const nestFactoryCreate = jest.fn();
jest.mock('@nestjs/core', () => ({
  NestFactory: { create: nestFactoryCreate },
}));

jest.mock(
  'src/auth/decorators/auth.decorator',
  () => ({
    Auth: () => () => {
      /* no-op */
    },
  }),
  { virtual: true },
);

jest.mock(
  'src/infrastructure/adapters/http/http.module',
  () => {
    const { Module } = require('@nestjs/common');
    const HTTP_ADAPTER = 'HTTP_ADAPTER';
    @Module({
      providers: [{ provide: HTTP_ADAPTER, useValue: { get: jest.fn() } }],
      exports: [HTTP_ADAPTER],
    })
    class HttpModule {}
    return { HttpModule, HTTP_ADAPTER };
  },
  { virtual: true },
);

function makeAppMock(expressApp: any) {
  return {
    use: jest.fn(),
    useGlobalPipes: jest.fn(),
    init: jest.fn().mockResolvedValue(undefined),
    getHttpAdapter: jest.fn(() => ({
      getInstance: jest.fn(() => expressApp),
    })),
  };
}

function loadFreshHandler() {
  jest.resetModules();
  jest.doMock('serverless-http', () => serverlessMock);
  jest.doMock('@nestjs/core', () => ({
    NestFactory: { create: nestFactoryCreate },
  }));
  jest.doMock(
    'src/auth/decorators/auth.decorator',
    () => ({ Auth: () => () => {} }),
    { virtual: true },
  );
  jest.doMock(
    'src/infrastructure/adapters/http/http.module',
    () => {
      const { Module } = require('@nestjs/common');
      const HTTP_ADAPTER = 'HTTP_ADAPTER';
      @Module({
        providers: [{ provide: HTTP_ADAPTER, useValue: { get: jest.fn() } }],
        exports: [HTTP_ADAPTER],
      })
      class HttpModule {}
      return { HttpModule, HTTP_ADAPTER };
    },
    { virtual: true },
  );

  const mod = require('../src/lambda') as {
    handler: (event: any, context: any, callback?: any) => Promise<any>;
  };
  return mod.handler;
}

describe('Lambda handler (serverless-http + Nest bootstrap con caché)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('bootstrap inicial: crea Nest app, registra middleware y pipes, llama serverless y devuelve resultado', async () => {
    const expressApp = {};
    const appMock = makeAppMock(expressApp);
    nestFactoryCreate.mockResolvedValueOnce(appMock);

    const handler = loadFreshHandler();

    const event = { httpMethod: 'GET', path: '/health' };
    const context: any = { callbackWaitsForEmptyEventLoop: true };
    const callback = jest.fn();

    mockServerlessHandler.mockResolvedValueOnce({
      statusCode: 200,
      body: 'ok',
    });

    const result = await handler(event, context, callback);

    expect(nestFactoryCreate).toHaveBeenCalledTimes(1);
    expect(appMock.init).toHaveBeenCalledTimes(1);

    expect(appMock.use).toHaveBeenCalledTimes(1);
    expect(appMock.useGlobalPipes).toHaveBeenCalledTimes(1);

    const pipeArg = appMock.useGlobalPipes.mock.calls[0][0];
    expect(pipeArg).toBeDefined();
    expect(pipeArg?.constructor?.name).toBe('ValidationPipe');
    expect(typeof (pipeArg as any).transform).toBe('function');

    expect(serverlessMock).toHaveBeenCalled();
    expect(mockServerlessHandler).toHaveBeenCalledWith(
      event,
      context,
      callback,
    );
    expect(result).toEqual({ statusCode: 200, body: 'ok' });

    expect(context.callbackWaitsForEmptyEventLoop).toBe(false);
  });

  it('usa caché: segunda invocación NO vuelve a crear la app ni llamar serverless()', async () => {
    const expressApp = {};
    const appMock = makeAppMock(expressApp);
    nestFactoryCreate.mockResolvedValueOnce(appMock);

    const handler = loadFreshHandler();

    mockServerlessHandler.mockResolvedValue({ statusCode: 204 });

    await handler({ a: 1 }, { callbackWaitsForEmptyEventLoop: true } as any);

    await handler({ a: 2 }, { callbackWaitsForEmptyEventLoop: true } as any);

    expect(nestFactoryCreate).toHaveBeenCalledTimes(1);
    expect(serverlessMock).toHaveBeenCalledTimes(1);
    expect(mockServerlessHandler).toHaveBeenCalledTimes(2);
  });

  it('middleware JSON: parsea body Buffer/string cuando Content-Type incluye application/json', async () => {
    const expressApp = {};
    const appMock = makeAppMock(expressApp);
    nestFactoryCreate.mockResolvedValueOnce(appMock);

    const handler = loadFreshHandler();

    mockServerlessHandler.mockResolvedValue({ statusCode: 200 });
    await handler({}, { callbackWaitsForEmptyEventLoop: true } as any);

    const mw = appMock.use.mock.calls[0][0] as Function;
    expect(typeof mw).toBe('function');

    const req1: any = {
      headers: { 'content-type': 'application/json' },
      body: Buffer.from(JSON.stringify({ x: 1 }), 'utf8'),
    };
    const next1 = jest.fn();
    mw(req1, {}, next1);
    expect(req1.body).toEqual({ x: 1 });
    expect(next1).toHaveBeenCalled();

    const req2: any = {
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: '{"y":2}',
    };
    const next2 = jest.fn();
    mw(req2, {}, next2);
    expect(req2.body).toEqual({ y: 2 });
    expect(next2).toHaveBeenCalled();

    const req3: any = {
      headers: { 'content-type': 'application/json' },
      body: '{not-valid',
    };
    const next3 = jest.fn();
    mw(req3, {}, next3);
    expect(req3.body).toBe('{not-valid');
    expect(next3).toHaveBeenCalled();

    const req4: any = {
      headers: { 'content-type': 'text/plain' },
      body: 'foo',
    };
    const next4 = jest.fn();
    mw(req4, {}, next4);
    expect(req4.body).toBe('foo');
    expect(next4).toHaveBeenCalled();
  });
});
