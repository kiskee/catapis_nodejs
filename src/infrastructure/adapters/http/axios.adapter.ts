// src/infrastructure/adapters/http/axios.adapter.ts
import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import type { IHttpAdapter, RequestOptions } from './IHttpAdapter';

interface AxiosAdapterOptions {
  baseURL?: string;
  timeoutMs?: number;
  retries?: number;     // reintentos en 5xx / errores de red
  retryDelayMs?: number;
  defaultHeaders?: Record<string, string>;
}

@Injectable()
export class AxiosAdapter implements IHttpAdapter {
  private readonly client: AxiosInstance;
  private readonly logger = new Logger(AxiosAdapter.name);
  private readonly retries: number;
  private readonly retryDelayMs: number;

  constructor(opts?: AxiosAdapterOptions) {
    this.retries = opts?.retries ?? 0;
    this.retryDelayMs = opts?.retryDelayMs ?? 250;

    this.client = axios.create({
      baseURL: opts?.baseURL,
      timeout: opts?.timeoutMs ?? 10_000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(opts?.defaultHeaders ?? {}),
      },
    });

    // Interceptor de request (log corto)
    this.client.interceptors.request.use((config) => {
      this.logger.debug(`HTTP ${config.method?.toUpperCase()} ${config.baseURL ?? ''}${config.url}`);
      return config;
    });

    // Interceptor de respuesta (log de status)
    this.client.interceptors.response.use(
      (res) => {
        this.logger.debug(`HTTP ${res.status} ${res.config.url}`);
        return res;
      },
      (error: AxiosError) => {
        // No lances aquí; normalizamos más abajo en send()
        return Promise.reject(error);
      },
    );
  }

  async get<T>(url: string, opts?: RequestOptions): Promise<T> {
    return this.send<T>({ method: 'GET', url, ...this.mapOpts(opts) });
  }

  async post<T>(url: string, data?: any, opts?: RequestOptions): Promise<T> {
    return this.send<T>({ method: 'POST', url, data, ...this.mapOpts(opts) });
  }

  async put<T>(url: string, data?: any, opts?: RequestOptions): Promise<T> {
    return this.send<T>({ method: 'PUT', url, data, ...this.mapOpts(opts) });
  }

  async patch<T>(url: string, data?: any, opts?: RequestOptions): Promise<T> {
    return this.send<T>({ method: 'PATCH', url, data, ...this.mapOpts(opts) });
  }

  async delete<T>(url: string, opts?: RequestOptions): Promise<T> {
    return this.send<T>({ method: 'DELETE', url, ...this.mapOpts(opts) });
  }

  // -------- privados --------
  private async send<T>(config: AxiosRequestConfig): Promise<T> {
    let attempt = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        const res = await this.client.request<T>(config);
        return res.data;
      } catch (e) {
        const err = e as AxiosError<any>;
        const status = err.response?.status;
        const shouldRetry =
          attempt < this.retries &&
          (!status || (status >= 500 && status <= 599)); // red/5xx

        if (!shouldRetry) {
          throw this.normalizeError(err);
        }

        attempt++;
        await this.delay(this.retryDelayMs * attempt); // backoff lineal sencillo
      }
    }
  }

  private mapOpts(opts?: RequestOptions): AxiosRequestConfig {
    const cfg: AxiosRequestConfig = {};
    if (!opts) return cfg;
    if (opts.headers) cfg.headers = opts.headers;
    if (opts.params) cfg.params = opts.params;
    if (opts.timeoutMs) cfg.timeout = opts.timeoutMs;
    if (opts.baseURL) cfg.baseURL = opts.baseURL;
    return cfg;
  }

  private delay(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }

  private normalizeError(err: AxiosError) {
    const status = err.response?.status ?? 0;
    const data: any = err.response?.data;
    const url = err.config?.url ?? '';
    const method = err.config?.method?.toUpperCase();
    const msg =
      typeof data === 'string'
        ? data
        : data?.message || data?.error || err.message || 'HTTP error';

    // Puedes mapearlo a HttpException si prefieres propagarlo al controller.
    const normalized = new Error(`[${status}] ${method} ${url} -> ${msg}`);
    (normalized as any).status = status;
    (normalized as any).data = data;
    return normalized;
  }
}
