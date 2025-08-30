import {
  BadRequestException,
  Injectable,
  Inject,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ImagesByBreedDto } from '../dtos/images-by-breed.dto';
import type { IHttpAdapter } from 'src/infrastructure/adapters/http/IHttpAdapter';
import { HTTP_ADAPTER } from 'src/infrastructure/adapters/http/http.module';

@Injectable()
export class ImagesService {
  private readonly logger = new Logger(ImagesService.name);
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
    if (!dto.breed_id || !dto.breed_id.trim()) {
      throw new BadRequestException('breed_id es requerido');
    }
    if (dto.limit !== undefined && (dto.limit < 1 || dto.limit > 25)) {
      throw new BadRequestException('limit debe estar entre 1 y 25');
    }

    const limit = dto.limit ?? 5;
    const size = dto.size ?? 'med';
    const order = dto.order ?? 'RANDOM';

    try {
      const params: Record<string, any> = {
        breed_ids: dto.breed_id,
        limit,
        size,
        order,
      };

      if (dto.mime_types) params.mime_types = dto.mime_types;
      if (dto.page !== undefined) params.page = dto.page;
      if (dto.include_breeds !== undefined)
        params.include_breeds = dto.include_breeds;
      if (dto.has_breeds !== undefined) params.has_breeds = dto.has_breeds;

      const data = await this.http.get('/images/search', {
        params,
        headers: this.headers(),
      });

      if (!Array.isArray(data)) {
        this.logger.error(
          `Respuesta inesperada de /images/search: ${JSON.stringify(data).slice(0, 300)}...`,
        );
        throw new InternalServerErrorException(
          'Respuesta inesperada del proveedor de imágenes',
        );
      }

      return data;
    } catch (error: any) {
      const status = error?.status ?? error?.response?.status;
      const message =
        error?.message ??
        error?.response?.data?.message ??
        'Error fetching images by breed';

      this.logger.error(
        `Error en getByBreed(breed_id=${dto.breed_id}, limit=${limit}, size=${size}, order=${order}): ${message}`,
      );

      if (status === 400) {
        throw new BadRequestException(
          'Parámetros inválidos para /images/search',
        );
      }

      throw new InternalServerErrorException(
        'No se pudieron obtener las imágenes',
      );
    }
  }
}
