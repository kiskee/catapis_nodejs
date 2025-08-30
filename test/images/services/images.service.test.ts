import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

jest.mock(
  'src/infrastructure/adapters/http/http.module',
  () => ({
    HTTP_ADAPTER: 'HTTP_ADAPTER',
  }),
  { virtual: true },
);

import { HTTP_ADAPTER } from 'src/infrastructure/adapters/http/http.module';
import { ImagesService } from '../../../src/images/services/images.service';

describe('ImagesService', () => {
  let service: ImagesService;
  let http: { get: jest.Mock };
  let config: { get: jest.Mock };

  async function buildModule(apiKey?: string) {
    http = { get: jest.fn() };
    config = { get: jest.fn().mockReturnValue(apiKey) };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ImagesService,
        { provide: HTTP_ADAPTER, useValue: http },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    service = moduleRef.get(ImagesService);
  }

  beforeEach(async () => {
    await buildModule('test-key');
  });

  afterEach(() => jest.clearAllMocks());

  describe('validaciones iniciales', () => {
    it('lanza BadRequest si falta breed_id', async () => {
      // @ts-expect-error forzamos dto inválido
      await expect(service.getByBreed({})).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(http.get).not.toHaveBeenCalled();
    });

    it('lanza BadRequest si breed_id es string vacío', async () => {
      await expect(
        service.getByBreed({ breed_id: '   ' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(http.get).not.toHaveBeenCalled();
    });

    it('lanza BadRequest si limit < 1', async () => {
      await expect(
        service.getByBreed({ breed_id: 'abys', limit: 0 }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(http.get).not.toHaveBeenCalled();
    });

    it('lanza BadRequest si limit > 25', async () => {
      await expect(
        service.getByBreed({ breed_id: 'abys', limit: 26 }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(http.get).not.toHaveBeenCalled();
    });
  });

  describe('getByBreed()', () => {
    it('usa defaults (limit=5, size=med, order=RANDOM) y header x-api-key', async () => {
      const dto = { breed_id: 'abys' };
      const data = [{ id: 'img1' }];
      http.get.mockResolvedValue(data);

      const res = await service.getByBreed(dto as any);

      expect(http.get).toHaveBeenCalledWith('/images/search', {
        params: {
          breed_ids: 'abys',
          limit: 5,
          size: 'med',
          order: 'RANDOM',
        },
        headers: { 'x-api-key': 'test-key' },
      });
      expect(res).toBe(data);
    });

    it('no envía headers cuando no hay apiKey', async () => {
      await buildModule('   ');
      const dto = { breed_id: 'abys' };
      const data = [{ id: 'img1' }];
      http.get.mockResolvedValue(data);

      const res = await service.getByBreed(dto as any);

      expect(http.get).toHaveBeenCalledWith('/images/search', {
        params: {
          breed_ids: 'abys',
          limit: 5,
          size: 'med',
          order: 'RANDOM',
        },
        headers: undefined,
      });
      expect(res).toBe(data);
    });

    it('incluye parámetros opcionales cuando existen', async () => {
      const dto = {
        breed_id: 'abys',
        limit: 10,
        size: 'full' as const,
        order: 'ASC' as any,
        mime_types: 'jpg,png',
        page: 2,
        include_breeds: 1 as any,
        has_breeds: 1 as any,
      };
      const data = [{ id: 'imgX' }];
      http.get.mockResolvedValue(data);

      const res = await service.getByBreed(dto as any);

      expect(http.get).toHaveBeenCalledWith(
        '/images/search',
        expect.objectContaining({
          params: {
            breed_ids: 'abys',
            limit: 10,
            size: 'full',
            order: 'ASC',
            mime_types: 'jpg,png',
            page: 2,
            include_breeds: 1,
            has_breeds: 1,
          },
        }),
      );
      expect(res).toBe(data);
    });

    it('si la respuesta no es un array: loguea y lanza InternalServerError', async () => {
      const loggerSpy = jest
        .spyOn((service as any).logger, 'error')
        .mockImplementation(() => {});
      http.get.mockResolvedValue({ not: 'array' });

      await expect(
        service.getByBreed({ breed_id: 'abys' } as any),
      ).rejects.toBeInstanceOf(InternalServerErrorException);

      expect(loggerSpy).toHaveBeenCalled();
    });

    it('mapea status 400 a BadRequestException y loguea', async () => {
      const loggerSpy = jest
        .spyOn((service as any).logger, 'error')
        .mockImplementation(() => {});
      http.get.mockRejectedValue({ response: { status: 400 }, message: 'bad' });

      await expect(
        service.getByBreed({ breed_id: 'abys' } as any),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(loggerSpy).toHaveBeenCalled();
    });

    it('otros errores → InternalServerErrorException y loguea', async () => {
      const loggerSpy = jest
        .spyOn((service as any).logger, 'error')
        .mockImplementation(() => {});
      http.get.mockRejectedValue({
        response: { status: 500 },
        message: 'boom',
      });

      await expect(
        service.getByBreed({ breed_id: 'abys' } as any),
      ).rejects.toBeInstanceOf(InternalServerErrorException);

      expect(loggerSpy).toHaveBeenCalled();
    });
  });
});
