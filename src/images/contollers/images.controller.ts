// src/images/images.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { ImagesService } from '../services/images.service';
import { ImagesByBreedDto } from '../dtos/images-by-breed.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';


@ApiTags('images')
@Auth()
@Controller()
export class ImagesController {
  constructor(private readonly images: ImagesService) {}

  // Requisito: GET /imagesbybreedid
  @Get('imagesbybreedid')
  @ApiResponse({ status: 200, description: 'Imágenes asociadas a una raza' })
  getByBreed(@Query() query: ImagesByBreedDto) {
    return this.images.getByBreed(query);
  }
}
