import { Logger } from '@nestjs/common';

type ReqFn = jest.Mock;
const makeAxiosClient = () => {
  const request: ReqFn = jest.fn();
  const requestUse = jest.fn();
  const responseUse = jest.fn();
  return {
    request,
    interceptors: {
      request: { use: requestUse },
      response: { use: responseUse },
    },
  };
};

let axiosClient: ReturnType<typeof makeAxiosClient>;

jest.mock('axios', () => {
  const create = jest.fn(() => axiosClient);
  return { __esModule: true, default: { create }, create };
});

import axios from 'axios';
import { AxiosAdapter } from '../../../../src/infrastructure/adapters/http/axios.adapter';

describe('AxiosAdapter', () => {
  beforeEach(() => {
    axiosClient = makeAxiosClient();
    jest.clearAllMocks();
  });

  const getCreateMock = () => (axios as any).create as jest.Mock;

  it('configura el cliente con baseURL/timeout/headers y registra interceptores', () => {
    const createMock = getCreateMock();

    const adapter = new AxiosAdapter({
      baseURL: 'https://api.test',
      timeoutMs: 1234,
      defaultHeaders: { 'x-custom': '1' },
    });

    expect(createMock).toHaveBeenCalledWith({
      baseURL: 'https://api.test',
      timeout: 1234,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'x-custom': '1',
      },
    });

    expect(axiosClient.interceptors.request.use).toHaveBeenCalledTimes(1);
    expect(axiosClient.interceptors.response.use).toHaveBeenCalledTimes(1);

    const reqFn = (axiosClient.interceptors.request.use as jest.Mock).mock
      .calls[0][0];
    const loggerSpy = jest
      .spyOn((adapter as any).logger as Logger, 'debug')
      .mockImplementation(() => {});
    const cfg = reqFn({
      method: 'get',
      baseURL: 'https://api.test',
      url: '/x',
    });
    expect(loggerSpy).toHaveBeenCalledWith('HTTP GET https://api.test/x');
    expect(cfg).toEqual({
      method: 'get',
      baseURL: 'https://api.test',
      url: '/x',
    });

    const resFn = (axiosClient.interceptors.response.use as jest.Mock).mock
      .calls[0][0];
    resFn({ status: 200, config: { url: '/y' } });
    expect(loggerSpy).toHaveBeenCalledWith('HTTP 200 /y');

    expect(adapter).toBeInstanceOf(AxiosAdapter);
  });

  it('get/post/put/patch/delete delegan a send() y devuelven data', async () => {
    const adapter = new AxiosAdapter();
    axiosClient.request.mockResolvedValue({
      data: { ok: true },
      config: { url: '/z' },
      status: 200,
    });

    // GET con opts mapeados
    await adapter.get('/a', {
      headers: { h: '1' },
      params: { q: 'x' },
      timeoutMs: 5000,
      baseURL: 'https://api',
    });
    expect(axiosClient.request).toHaveBeenCalledWith({
      method: 'GET',
      url: '/a',
      headers: { h: '1' },
      params: { q: 'x' },
      timeout: 5000,
      baseURL: 'https://api',
    });

    await adapter.post('/b', { foo: 1 });
    expect(axiosClient.request).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'POST', url: '/b', data: { foo: 1 } }),
    );

    await adapter.put('/c', { bar: 2 });
    expect(axiosClient.request).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'PUT', url: '/c', data: { bar: 2 } }),
    );

    await adapter.patch('/d', { baz: 3 });
    expect(axiosClient.request).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'PATCH', url: '/d', data: { baz: 3 } }),
    );

    await adapter.delete('/e', { params: { id: 9 } });
    expect(axiosClient.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'DELETE',
        url: '/e',
        params: { id: 9 },
      }),
    );
  });

  it('retorna res.data ante éxito', async () => {
    const adapter = new AxiosAdapter();
    axiosClient.request.mockResolvedValue({
      data: { hello: 'world' },
      status: 200,
      config: { url: '/ok' },
    });

    const out = await adapter.get('/ok');
    expect(out).toEqual({ hello: 'world' });
  });

  it('reintenta ante error 5xx hasta agotar retries y luego lanza error normalizado', async () => {
    const adapter = new AxiosAdapter({ retries: 2, retryDelayMs: 10 });
    const delaySpy = jest
      .spyOn(adapter as any, 'delay')
      .mockResolvedValue(undefined);

    const err = {
      isAxiosError: true,
      response: { status: 503, data: { message: 'down' } },
      config: { url: '/r', method: 'get' },
      message: 'Request failed',
    };

    axiosClient.request
      .mockRejectedValueOnce(err)
      .mockRejectedValueOnce(err)
      .mockRejectedValueOnce(err);

    await expect(adapter.get('/r')).rejects.toThrow('[503] GET /r -> down');

    expect(delaySpy).toHaveBeenCalledTimes(2);
    expect(await (adapter.get as any)).toBeUndefined;
  });

  it('si error 5xx y luego éxito, cumple (con reintentos y delay)', async () => {
    const adapter = new AxiosAdapter({ retries: 2, retryDelayMs: 5 });
    jest.spyOn(adapter as any, 'delay').mockResolvedValue(undefined);

    const err = {
      isAxiosError: true,
      response: { status: 500, data: { error: 'boom' } },
      config: { url: '/retry', method: 'post' },
      message: 'fail',
    };

    axiosClient.request
      .mockRejectedValueOnce(err)
      .mockResolvedValueOnce({
        data: { ok: 1 },
        status: 200,
        config: { url: '/retry' },
      });

    const out = await adapter.post('/retry', { a: 1 });
    expect(out).toEqual({ ok: 1 });
  });

  it('NO reintenta cuando status es 4xx; lanza error normalizado', async () => {
    const adapter = new AxiosAdapter({ retries: 3 });
    const err = {
      isAxiosError: true,
      response: { status: 400, data: { message: 'bad' } },
      config: { url: '/no-retry', method: 'get' },
      message: 'bad req',
    };

    axiosClient.request.mockRejectedValue(err);

    await expect(adapter.get('/no-retry')).rejects.toThrow(
      '[400] GET /no-retry -> bad',
    );
    expect(axiosClient.request).toHaveBeenCalledTimes(1);
  });

  it('reintenta si no hay status (network error) y luego lanza normalizado sin status', async () => {
    const adapter = new AxiosAdapter({ retries: 1, retryDelayMs: 1 });
    jest.spyOn(adapter as any, 'delay').mockResolvedValue(undefined);

    const errNoStatus = {
      isAxiosError: true,
      response: undefined,
      config: { url: '/net', method: 'get' },
      message: 'Network Error',
    };

    axiosClient.request.mockRejectedValue(errNoStatus);

    axiosClient.request.mockRejectedValue(errNoStatus);

    await expect(adapter.get('/net')).rejects.toThrow(
      '[0] GET /net -> Network Error',
    );
  });

  it('normaliza mensaje cuando response.data es string', async () => {
    const adapter = new AxiosAdapter();
    const err = {
      isAxiosError: true,
      response: { status: 404, data: 'Not Found' },
      config: { url: '/x', method: 'get' },
      message: 'req failed',
    };

    axiosClient.request.mockRejectedValue(err);

    await expect(adapter.get('/x')).rejects.toThrow(
      '[404] GET /x -> Not Found',
    );
  });

  it('mapOpts mapea headers/params/timeout/baseURL correctamente', async () => {
    const adapter = new AxiosAdapter();
    axiosClient.request.mockResolvedValue({
      data: { ok: true },
      status: 200,
      config: { url: '/m' },
    });

    await adapter.get('/m', {
      headers: { a: '1' },
      params: { p: 'v' },
      timeoutMs: 321,
      baseURL: 'https://b',
    });

    expect(axiosClient.request).toHaveBeenCalledWith({
      method: 'GET',
      url: '/m',
      headers: { a: '1' },
      params: { p: 'v' },
      timeout: 321,
      baseURL: 'https://b',
    });
  });

  it('response interceptor de error propaga el mismo error (Promise.reject)', async () => {
    new AxiosAdapter(); // registra interceptores
    const errorHandler = (axiosClient.interceptors.response.use as jest.Mock)
      .mock.calls[0][1];
    const err = new Error('x');
    await expect(errorHandler(err)).rejects.toEqual(err);
  });
});
