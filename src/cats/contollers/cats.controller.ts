// src/cats/cats.controller.ts
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { CatsService } from '../services/cats.service';
import { BreedSearchDto } from '../dtos/breed-search.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';

@ApiTags('breeds')
@Auth()
@Controller('breeds')
export class CatsController {
  constructor(private readonly cats: CatsService) {}

  @Get()
  list() {
    return this.cats.listBreeds();
  }

  // 👇 PONER search ANTES de :breed_id
  @Get('search')
  @ApiResponse({ status: 200 })
  search(@Query() query: BreedSearchDto) {
    return this.cats.searchBreeds(query);
  }

  @Get(':breed_id')
  @ApiResponse({ status: 200 })
  getOne(@Param('breed_id') breed_id: string) {
    return this.cats.getBreedById(breed_id);
  }
}
