import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ImagesService } from '../services/images.service';
import { ImagesByBreedDto } from '../dtos/images-by-breed.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ImageDto } from '../dtos/image.dto';

@ApiTags('images')
@Auth()
@ApiBearerAuth()
@Controller()
export class ImagesController {
  constructor(private readonly images: ImagesService) {}

  @Get('imagesbybreedid')
  @ApiOperation({
    summary: 'Imágenes por raza',
    description:
      'Proxy de TheCatAPI /images/search. Requiere "breed_id". ' +
      'Puedes paginar con "page" y "limit" (1-25). ' +
      'Usa "include_breeds=1" o "has_breeds=1" para traer metadata de la raza.',
  })
  @ApiQuery({ name: 'breed_id', example: 'abys', required: true })
  @ApiQuery({ name: 'limit', example: 5, required: false })
  @ApiQuery({
    name: 'size',
    enum: ['thumb', 'small', 'med', 'full'],
    required: false,
    example: 'med',
  })
  @ApiQuery({ name: 'mime_types', example: 'jpg,png', required: false })
  @ApiQuery({
    name: 'order',
    enum: ['RANDOM', 'ASC', 'DESC'],
    required: false,
    example: 'RANDOM',
  })
  @ApiQuery({ name: 'page', example: 0, required: false })
  @ApiQuery({
    name: 'include_breeds',
    enum: [0, 1],
    required: false,
    example: 1,
  })
  @ApiQuery({ name: 'has_breeds', enum: [0, 1], required: false })
  @ApiOkResponse({
    description: 'Listado de imágenes',
    type: ImageDto,
    isArray: true,
    schema: {
      example: [
        {
          id: '0XYvRd7oD',
          url: 'https://cdn2.thecatapi.com/images/0XYvRd7oD.jpg',
          width: 1200,
          height: 800,
          breeds: [
            {
              id: 'abys',
              name: 'Abyssinian',
              reference_image_id: '0XYvRd7oD',
              origin: 'Egypt',
            },
          ],
        },
      ],
    },
  })
  @ApiBadRequestResponse({
    description: 'Parámetros inválidos (p. ej. falta breed_id, limit inválido)',
    schema: {
      example: {
        statusCode: 400,
        message: [
          'breed_id must be a string',
          'limit must be an integer number',
        ],
        error: 'Bad Request',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Falta o es inválido el Bearer token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized',
      },
    },
  })
  getByBreed(@Query() query: ImagesByBreedDto) {
    return this.images.getByBreed(query);
  }
}
