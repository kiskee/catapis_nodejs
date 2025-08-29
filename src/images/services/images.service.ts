// src/images/images.service.ts
import { BadRequestException, HttpException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ImagesByBreedDto } from '../dtos/images-by-breed.dto';
import type { IHttpAdapter } from 'src/infrastructure/adapters/http/IHttpAdapter';
import { HTTP_ADAPTER } from 'src/infrastructure/adapters/http/http.module';

@Injectable()
export class ImagesService {
  private readonly apiKey?: string;

  constructor(
    @Inject(HTTP_ADAPTER) private readonly http: IHttpAdapter,
    private readonly config: ConfigService,
  ) {
    const key = this.config.get<string>('CAT_API_KEY');
    this.apiKey = key && key.trim() ? key : undefined;
  }

  private headers(): Record<string, string> | undefined {
    return this.apiKey ? { 'x-api-key': this.apiKey } : undefined;
  }

  async getByBreed(dto: ImagesByBreedDto) {
    if (!dto.breed_id) throw new BadRequestException('breed_id es requerido');

    try {
      const params: any = {
        breed_ids: dto.breed_id,       // clave para TheCatAPI
        limit: dto.limit ?? 5,
        size: dto.size ?? 'med',
        order: dto.order ?? 'RANDOM',
      };
      if (dto.mime_types) params.mime_types = dto.mime_types;
      if (dto.page !== undefined) params.page = dto.page;
      if (dto.include_breeds !== undefined) params.include_breeds = dto.include_breeds;
      if (dto.has_breeds !== undefined) params.has_breeds = dto.has_breeds;

      // GET /images/search
      const data = await this.http.get('/images/search', {
        params,
        headers: this.headers(),
      });

      return data; // array de imágenes
    } catch (e: any) {
      throw new HttpException(e.message ?? 'Error fetching images by breed', e.status ?? 502);
    }
  }
}
