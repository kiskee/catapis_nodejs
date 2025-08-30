import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
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

import { CatsService } from '../../../src/cats/services/cats.service';

describe('CatsService', () => {
  let service: CatsService;
  let http: { get: jest.Mock };
  let config: { get: jest.Mock };

  async function buildModule(apiKey?: string) {
    http = { get: jest.fn() };
    config = { get: jest.fn().mockReturnValue(apiKey) };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        CatsService,
        { provide: HTTP_ADAPTER, useValue: http },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    service = moduleRef.get(CatsService);
  }

  beforeEach(async () => {
    await buildModule('test-key');
  });

  afterEach(() => jest.clearAllMocks());

  describe('listBreeds()', () => {
    it('devuelve la lista y envía header x-api-key si hay apiKey', async () => {
      const data = [{ id: 'abys', name: 'Abyssinian' }];
      http.get.mockResolvedValue(data);

      const res = await service.listBreeds();

      expect(http.get).toHaveBeenCalledWith('/breeds', {
        headers: { 'x-api-key': 'test-key' },
      });
      expect(res).toBe(data);
    });

    it('sin apiKey no envía headers', async () => {
      await buildModule('   ');
      const data = [{ id: 'abys' }];
      http.get.mockResolvedValue(data);

      const res = await service.listBreeds();

      expect(http.get).toHaveBeenCalledWith('/breeds', { headers: undefined });
      expect(res).toBe(data);
    });

    it('mapea error a InternalServerErrorException y loguea', async () => {
      const loggerSpy = jest
        .spyOn((service as any).logger, 'error')
        .mockImplementation(() => {});
      http.get.mockRejectedValue(new Error('down'));

      await expect(service.listBreeds()).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
      expect(loggerSpy).toHaveBeenCalled();
    });
  });

  describe('getBreedById()', () => {
    const id = 'abys';

    it('retorna el match exacto si existe', async () => {
      const arr = [
        { id: 'siam', name: 'Siamese' },
        { id: 'abys', name: 'Abyssinian' },
      ];
      http.get.mockResolvedValue(arr);

      const res = await service.getBreedById(id);

      expect(http.get).toHaveBeenCalledWith('/breeds/search', {
        params: { q: id },
        headers: { 'x-api-key': 'test-key' },
      });
      expect(res).toEqual({ id: 'abys', name: 'Abyssinian' });
    });

    it('si no hay match exacto, retorna el primer elemento', async () => {
      const arr = [{ id: 'siam', name: 'Siamese' }];
      http.get.mockResolvedValue(arr);

      const res = await service.getBreedById(id);

      expect(res).toBe(arr[0]);
    });

    it('si la respuesta es [] lanza NotFoundException y loguea', async () => {
      const loggerSpy = jest
        .spyOn((service as any).logger, 'error')
        .mockImplementation(() => {});
      http.get.mockResolvedValue([]);

      await expect(service.getBreedById(id)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(loggerSpy).toHaveBeenCalled();
    });

    it('errores inesperados se mapean a InternalServerErrorException y loguea', async () => {
      const loggerSpy = jest
        .spyOn((service as any).logger, 'error')
        .mockImplementation(() => {});
      http.get.mockRejectedValue(new Error('net fail'));

      await expect(service.getBreedById(id)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
      expect(loggerSpy).toHaveBeenCalled();
    });
  });

  describe('searchBreeds()', () => {
    const query = { q: 'abys', attach_image: 1 as const };

    it('devuelve la búsqueda y envía params + headers', async () => {
      const data = [{ id: 'abys', name: 'Abyssinian' }];
      http.get.mockResolvedValue(data);

      const res = await service.searchBreeds(query);

      expect(http.get).toHaveBeenCalledWith('/breeds/search', {
        params: query,
        headers: { 'x-api-key': 'test-key' },
      });
      expect(res).toBe(data);
    });

    it('si API responde 400, lanza BadRequestException y loguea', async () => {
      const loggerSpy = jest
        .spyOn((service as any).logger, 'error')
        .mockImplementation(() => {});
      http.get.mockRejectedValue({ response: { status: 400 }, message: 'bad' });

      await expect(service.searchBreeds(query)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(loggerSpy).toHaveBeenCalled();
    });

    it('otros errores se mapean a InternalServerErrorException y loguea', async () => {
      const loggerSpy = jest
        .spyOn((service as any).logger, 'error')
        .mockImplementation(() => {});
      http.get.mockRejectedValue({
        response: { status: 500 },
        message: 'oops',
      });

      await expect(service.searchBreeds(query)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
      expect(loggerSpy).toHaveBeenCalled();
    });

    it('sin apiKey no envía headers', async () => {
      await buildModule(undefined);
      const data = [{ id: 'abys' }];
      http.get.mockResolvedValue(data);

      const res = await service.searchBreeds(query);

      expect(http.get).toHaveBeenCalledWith('/breeds/search', {
        params: query,
        headers: undefined,
      });
      expect(res).toBe(data);
    });
  });
});
