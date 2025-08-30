import {
  Inject,
  Injectable,
  Logger,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HTTP_ADAPTER } from 'src/infrastructure/adapters/http/http.module';
import type { IHttpAdapter } from 'src/infrastructure/adapters/http/IHttpAdapter';

@Injectable()
export class CatsService {
  private readonly logger = new Logger(CatsService.name);
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

  async listBreeds() {
    try {
      return await this.http.get('/breeds', { headers: this.headers() });
    } catch (error: any) {
      this.logger.error(`Error listando razas: ${error.message}`);
      throw new InternalServerErrorException(
        'No se pudieron obtener las razas',
      );
    }
  }

  async getBreedById(breed_id: string) {
    try {
      const res = await this.http.get('/breeds/search', {
        params: { q: breed_id },
        headers: this.headers(),
      });

      if (!Array.isArray(res) || res.length === 0) {
        throw new NotFoundException(`Raza con id "${breed_id}" no encontrada`);
      }

      const exact = res.find((b: any) => b.id === breed_id);
      return exact ?? res[0];
    } catch (error: any) {
      this.logger.error(
        `Error obteniendo raza por id=${breed_id}: ${error.message}`,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `No se pudo obtener la raza con id ${breed_id}`,
      );
    }
  }

  async searchBreeds(query: { q?: string; attach_image?: 0 | 1 }) {
    try {
      return await this.http.get('/breeds/search', {
        params: query,
        headers: this.headers(),
      });
    } catch (error: any) {
      this.logger.error(
        `Error buscando razas con query=${JSON.stringify(query)}: ${
          error.message
        }`,
      );

      if (error.response?.status === 400) {
        throw new BadRequestException('Parámetros de búsqueda inválidos');
      }

      throw new InternalServerErrorException('No se pudo realizar la búsqueda');
    }
  }
}
