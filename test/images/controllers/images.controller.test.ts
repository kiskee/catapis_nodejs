import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';

jest.mock(
  'src/auth/decorators/auth.decorator',
  () => ({
    Auth: () => () => {},
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

import { ImagesController } from '../../../src/images/contollers/images.controller';
import { ImagesService } from '../../../src/images/services/images.service';

describe('ImagesController', () => {
  let controller: ImagesController;
  let images: { getByBreed: jest.Mock };

  beforeEach(async () => {
    images = { getByBreed: jest.fn() };

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [ImagesController],
      providers: [{ provide: ImagesService, useValue: images }],
    }).compile();

    controller = moduleRef.get(ImagesController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('getByBreed()', () => {
    const query = {
      breed_id: 'abys',
      limit: 5,
      size: 'med',
      order: 'RANDOM',
      mime_types: 'jpg,png',
      page: 0,
      include_breeds: 1 as any,
      has_breeds: 1 as any,
    };

    it('delegar al servicio con el query y devolver el resultado', async () => {
      const data = [{ id: 'img1' }];
      images.getByBreed.mockResolvedValue(data);

      const res = await controller.getByBreed(query as any);

      expect(images.getByBreed).toHaveBeenCalledWith(query);
      expect(res).toBe(data);
    });

    it('propaga BadRequestException del servicio', async () => {
      images.getByBreed.mockRejectedValue(
        new BadRequestException('parámetros inválidos'),
      );

      await expect(controller.getByBreed(query as any)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('propaga otros errores (InternalServerErrorException, etc.)', async () => {
      images.getByBreed.mockRejectedValue(
        new InternalServerErrorException('boom'),
      );

      await expect(controller.getByBreed(query as any)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });
});
