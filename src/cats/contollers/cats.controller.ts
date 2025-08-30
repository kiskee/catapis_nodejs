import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CatsService } from '../services/cats.service';
import { BreedSearchDto } from '../dtos/breed-search.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { BreedDto } from '../dtos/breed.dto';

@ApiTags('breeds')
@Auth()
@ApiBearerAuth()
@Controller('breeds')
export class CatsController {
  constructor(private readonly cats: CatsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas las razas' })
  @ApiOkResponse({
    description: 'Listado de razas',
    type: BreedDto,
    isArray: true,
    schema: {
      example: [
        {
          id: 'abys',
          name: 'Abyssinian',
          origin: 'Egypt',
          temperament: 'Active, Energetic, Independent, Intelligent, Gentle',
          description:
            'The Abyssinian is easy to care for, and a joy to have in your home.',
          weight: { imperial: '7 - 12', metric: '3 - 5' },
          life_span: '14 - 15',
          wikipedia_url: 'https://en.wikipedia.org/wiki/Abyssinian_(cat)',
          reference_image_id: '0XYvRd7oD',
        },
      ],
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Falta o es inválido el Bearer token',
  })
  list() {
    return this.cats.listBreeds();
  }

  //se puso el search antes de endpoint de busqueda por id ya que semanticamente entran en conflictos
  @Get('search')
  @ApiOperation({
    summary: 'Buscar razas',
    description:
      'Busca por nombre/código. Si `attach_image=1`, adjunta un objeto `image` con la imagen de referencia.',
  })
  @ApiQuery({
    name: 'q',
    required: false,
    description: 'Término de búsqueda (nombre/código). Ej: "sib"',
    example: 'sib',
  })
  @ApiQuery({
    name: 'attach_image',
    required: false,
    description: 'Adjuntar imagen de referencia (0/1).',
    enum: [0, 1],
    example: 1,
  })
  @ApiOkResponse({
    description: 'Resultados de búsqueda',
    type: BreedDto,
    isArray: true,
    schema: {
      example: [
        {
          id: 'sibe',
          name: 'Siberian',
          origin: 'Russia',
          temperament: 'Curious, Intelligent, Loyal, Sweet',
          weight: { imperial: '8 - 17', metric: '4 - 8' },
          life_span: '12 - 15',
          reference_image_id: '3bkZAjRh1',
          image: {
            id: '3bkZAjRh1',
            url: 'https://cdn2.thecatapi.com/images/3bkZAjRh1.jpg',
            width: 1200,
            height: 800,
          },
        },
      ],
    },
  })
  @ApiBadRequestResponse({
    description: 'Parámetros inválidos (attach_image debe ser 0 o 1)',
  })
  @ApiUnauthorizedResponse({
    description: 'Falta o es inválido el Bearer token',
  })
  search(@Query() query: BreedSearchDto) {
    return this.cats.searchBreeds(query);
  }

  @Get(':breed_id')
  @ApiOperation({ summary: 'Obtener una raza por ID' })
  @ApiParam({
    name: 'breed_id',
    example: 'abys',
    description: 'ID de la raza (p. ej. "abys", "sibe", "asho")',
  })
  @ApiOkResponse({
    description: 'Raza encontrada',
    type: BreedDto,
    schema: {
      example: {
        id: 'abys',
        name: 'Abyssinian',
        origin: 'Egypt',
        temperament: 'Active, Energetic, Independent, Intelligent, Gentle',
        description:
          'The Abyssinian is easy to care for, and a joy to have in your home.',
        weight: { imperial: '7 - 12', metric: '3 - 5' },
        life_span: '14 - 15',
        wikipedia_url: 'https://en.wikipedia.org/wiki/Abyssinian_(cat)',
        reference_image_id: '0XYvRd7oD',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Falta o es inválido el Bearer token',
  })
  getOne(@Param('breed_id') breed_id: string) {
    return this.cats.getBreedById(breed_id);
  }
}
