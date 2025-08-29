// src/infrastructure/adapters/http/http.module.ts
import { Module, Provider } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AxiosAdapter } from './axios.adapter';

export const HTTP_ADAPTER = 'HTTP_ADAPTER';

const httpProvider: Provider = {
  provide: HTTP_ADAPTER,
  useFactory: (cs: ConfigService) => {
    const timeout = Number(cs.get('HTTP_TIMEOUT_MS') ?? 10000);
    const retries = Number(cs.get('HTTP_RETRIES') ?? 0);
    const retryDelay = Number(cs.get('HTTP_RETRY_DELAY_MS') ?? 250);
    const baseURL = cs.get<string>('HTTP_BASE_URL') || undefined;

    return new AxiosAdapter({
      baseURL,
      timeoutMs: timeout,
      retries,
      retryDelayMs: retryDelay,
      defaultHeaders: {},
    });
  },
  inject: [ConfigService],
};

@Module({
  imports: [ConfigModule],
  providers: [httpProvider],
  exports: [HTTP_ADAPTER],
})
export class HttpModule {}
