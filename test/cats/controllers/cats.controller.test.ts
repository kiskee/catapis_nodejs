import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

jest.mock(
  'src/auth/decorators/auth.decorator',
  () => ({
    Auth: () => () => {
      /* no-op */
    },
  }),
  { virtual: true },
);

jest.mock(
  'src/infrastructure/adapters/http/http.module',
  () => ({
    HTTP_ADAPTER: 'HTTP_ADAPTER',
  }),
  { virtual: true },
);

import { CatsController } from '../../../src/cats/contollers/cats.controller';
import { CatsService } from '../../../src/cats/services/cats.service';

describe('CatsController', () => {
  let controller: CatsController;
  let cats: {
    listBreeds: jest.Mock;
    searchBreeds: jest.Mock;
    getBreedById: jest.Mock;
  };

  beforeEach(async () => {
    cats = {
      listBreeds: jest.fn(),
      searchBreeds: jest.fn(),
      getBreedById: jest.fn(),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [CatsController],
      providers: [{ provide: CatsService, useValue: cats }],
    }).compile();

    controller = moduleRef.get(CatsController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('list()', () => {
    it('delegar al servicio y devolver el resultado', async () => {
      const data = [{ id: 'abys', name: 'Abyssinian' }];
      cats.listBreeds.mockResolvedValue(data);

      const res = await controller.list();

      expect(cats.listBreeds).toHaveBeenCalledTimes(1);
      expect(res).toBe(data);
    });

    it('propaga errores del servicio', async () => {
      cats.listBreeds.mockRejectedValue(
        new InternalServerErrorException('fail'),
      );
      await expect(controller.list()).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  describe('search()', () => {
    const query = { q: 'sib', attach_image: 1 as const };

    it('delegar al servicio con el query y devolver el resultado', async () => {
      const data = [{ id: 'sibe', name: 'Siberian' }];
      cats.searchBreeds.mockResolvedValue(data);

      const res = await controller.search(query as any);

      expect(cats.searchBreeds).toHaveBeenCalledWith(query);
      expect(res).toBe(data);
    });

    it('propaga BadRequestException del servicio', async () => {
      cats.searchBreeds.mockRejectedValue(
        new BadRequestException('params inválidos'),
      );
      await expect(controller.search(query as any)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('propaga otros errores', async () => {
      cats.searchBreeds.mockRejectedValue(
        new InternalServerErrorException('boom'),
      );
      await expect(controller.search(query as any)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  describe('getOne()', () => {
    const id = 'abys';

    it('delegar al servicio con breed_id y devolver el resultado', async () => {
      const breed = { id: 'abys', name: 'Abyssinian' };
      cats.getBreedById.mockResolvedValue(breed);

      const res = await controller.getOne(id);

      expect(cats.getBreedById).toHaveBeenCalledWith(id);
      expect(res).toBe(breed);
    });

    it('propaga NotFoundException del servicio', async () => {
      cats.getBreedById.mockRejectedValue(
        new NotFoundException('no encontrada'),
      );
      await expect(controller.getOne(id)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('propaga otros errores', async () => {
      cats.getBreedById.mockRejectedValue(
        new InternalServerErrorException('fail'),
      );
      await expect(controller.getOne(id)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });
});
