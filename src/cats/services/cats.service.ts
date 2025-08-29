// src/cats/cats.service.ts
import { Inject, Injectable, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HTTP_ADAPTER } from 'src/infrastructure/adapters/http/http.module';
import type { IHttpAdapter } from 'src/infrastructure/adapters/http/IHttpAdapter';

@Injectable()
export class CatsService {
  private readonly apiKey?: string;

  constructor(
    @Inject(HTTP_ADAPTER) private readonly http: IHttpAdapter,
    private readonly config: ConfigService,
  ) {
    const key = this.config.get<string>('CAT_API_KEY');
    this.apiKey = key && key.trim() ? key : undefined;
  }

  // ✅ Si no hay key -> undefined (no envía el header).
  private headers(): Record<string, string> | undefined {
    if (!this.apiKey) return undefined;
    return { 'x-api-key': this.apiKey };
  }

  async listBreeds() {
    try {
      return await this.http.get('/breeds', { headers: this.headers() });
    } catch (e: any) {
      throw new HttpException(
        e.message ?? 'Error fetching breeds',
        e.status ?? 502,
      );
    }
  }

  async getBreedById(breed_id: string) {
    try {
      const res = await this.http.get('/breeds/search', {
        params: { q: breed_id },
        headers: this.headers(),
      });
      const exact = Array.isArray(res)
        ? res.find((b: any) => b.id === breed_id)
        : null;
      return exact ?? (Array.isArray(res) ? res[0] : res);
    } catch (e: any) {
      throw new HttpException(
        e.message ?? 'Error fetching breed',
        e.status ?? 502,
      );
    }
  }

  async searchBreeds(query: { q?: string; attach_image?: 0 | 1 }) {
    try {
      return await this.http.get('/breeds/search', {
        params: query,
        headers: this.headers(),
      });
    } catch (e: any) {
      throw new HttpException(
        e.message ?? 'Error searching breeds',
        e.status ?? 502,
      );
    }
  }
}
