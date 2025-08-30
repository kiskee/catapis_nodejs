import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

let capturedCreateOptions: any;
const makeAxiosClient = () => ({
  request: jest.fn(),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
});
let axiosClient = makeAxiosClient();

jest.mock('axios', () => {
  const create = jest.fn((opts: any) => {
    capturedCreateOptions = opts;
    return axiosClient;
  });
  return { __esModule: true, default: { create }, create };
});

import axios from 'axios';
import {
  HttpModule,
  HTTP_ADAPTER,
} from '../../../../src/infrastructure/adapters/http/http.module';

describe('HttpModule (provider HTTP_ADAPTER)', () => {
  beforeEach(() => {
    capturedCreateOptions = undefined;
    axiosClient = makeAxiosClient();
    jest.clearAllMocks();
  });

  const makeConfig = (map: Record<string, any>) => ({
    get: jest.fn((k: string) => map[k]),
  });

  it('crea AxiosAdapter con valores por defecto cuando no hay config', async () => {
    const config = makeConfig({}); // todo undefined → defaults
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
    })
      .overrideProvider(ConfigService)
      .useValue(config)
      .compile();

    const adapter: any = moduleRef.get(HTTP_ADAPTER);
    expect(adapter).toBeDefined();

    // axios.create fue llamado con defaults
    expect((axios as any).create).toHaveBeenCalledTimes(1);
    expect(capturedCreateOptions).toEqual({
      baseURL: undefined,
      timeout: 10_000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    expect(axiosClient.interceptors.request.use).toHaveBeenCalledTimes(1);
    expect(axiosClient.interceptors.response.use).toHaveBeenCalledTimes(1);

    axiosClient.request.mockResolvedValue({ data: { pong: true } });
    await expect(adapter.get('/ping')).resolves.toEqual({ pong: true });
    expect(axiosClient.request).toHaveBeenCalledWith({
      method: 'GET',
      url: '/ping',
    });
  });

  it('lee ConfigService y pasa baseURL/timeout/headers a axios.create', async () => {
    const config = makeConfig({
      HTTP_BASE_URL: 'https://api.example.com',
      HTTP_TIMEOUT_MS: '15000',
      HTTP_RETRIES: '3',
      HTTP_RETRY_DELAY_MS: '400',
    });

    const moduleRef = await Test.createTestingModule({
      imports: [HttpModule],
    })
      .overrideProvider(ConfigService)
      .useValue(config)
      .compile();

    const adapter = moduleRef.get(HTTP_ADAPTER);
    expect(adapter).toBeDefined();

    expect((axios as any).create).toHaveBeenCalledTimes(1);
    expect(capturedCreateOptions).toEqual({
      baseURL: 'https://api.example.com',
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
  });

  it('usa el número de retries de la config (reintenta ante 5xx y luego tiene éxito)', async () => {
    const config = makeConfig({
      HTTP_RETRIES: '2',
      HTTP_RETRY_DELAY_MS: '1',
    });

    const moduleRef = await Test.createTestingModule({
      imports: [HttpModule],
    })
      .overrideProvider(ConfigService)
      .useValue(config)
      .compile();

    const adapter: any = moduleRef.get(HTTP_ADAPTER);

    jest.spyOn(adapter, 'delay' as any).mockResolvedValue(undefined);

    const err5xx = {
      isAxiosError: true,
      response: { status: 502, data: { message: 'bad gateway' } },
      config: { url: '/retry', method: 'get' },
      message: 'fail',
    };

    axiosClient.request
      .mockRejectedValueOnce(err5xx)
      .mockRejectedValueOnce(err5xx)
      .mockResolvedValueOnce({
        data: { ok: 1 },
        status: 200,
        config: { url: '/retry' },
      });

    await expect(adapter.get('/retry')).resolves.toEqual({ ok: 1 });
    expect(axiosClient.request).toHaveBeenCalledTimes(3);
  });

  it('no reintenta ante 4xx y lanza el error normalizado', async () => {
    const config = makeConfig({ HTTP_RETRIES: '5' });
    const moduleRef = await Test.createTestingModule({
      imports: [HttpModule],
    })
      .overrideProvider(ConfigService)
      .useValue(config)
      .compile();

    const adapter: any = moduleRef.get(HTTP_ADAPTER);

    const err4xx = {
      isAxiosError: true,
      response: { status: 404, data: { message: 'not found' } },
      config: { url: '/noretry', method: 'get' },
      message: 'oops',
    };

    axiosClient.request.mockRejectedValue(err4xx);

    await expect(adapter.get('/noretry')).rejects.toThrow(
      '[404] GET /noretry -> not found',
    );
    expect(axiosClient.request).toHaveBeenCalledTimes(1);
  });
});
