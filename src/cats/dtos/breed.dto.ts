// src/cats/dto/breed.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WeightDto {
  @ApiProperty({ example: '7 - 12' })
  imperial: string;

  @ApiProperty({ example: '3 - 5' })
  metric: string;
}

export class BreedImageDto {
  @ApiProperty({ example: '0XYvRd7oD' })
  id: string;

  @ApiProperty({ example: 'https://cdn2.thecatapi.com/images/0XYvRd7oD.jpg' })
  url: string;

  @ApiProperty({ example: 1200 })
  width: number;

  @ApiProperty({ example: 800 })
  height: number;
}

export class BreedDto {
  @ApiProperty({ example: 'abys' })
  id: string;

  @ApiProperty({ example: 'Abyssinian' })
  name: string;

  @ApiPropertyOptional({ example: 'Active, Energetic, Independent, Intelligent, Gentle' })
  temperament?: string;

  @ApiPropertyOptional({ example: 'Egypt' })
  origin?: string;

  @ApiPropertyOptional({ example: 'The Abyssinian is easy to care for, and a joy to have in your home.' })
  description?: string;

  @ApiPropertyOptional({ type: WeightDto })
  weight?: WeightDto;

  @ApiPropertyOptional({ example: '14 - 15' })
  life_span?: string;

  @ApiPropertyOptional({ example: 'https://en.wikipedia.org/wiki/Abyssinian_(cat)' })
  wikipedia_url?: string;

  @ApiPropertyOptional({ example: '0XYvRd7oD' })
  reference_image_id?: string;

  // sólo aparece en /breeds/search cuando attach_image=1
  @ApiPropertyOptional({ type: BreedImageDto })
  image?: BreedImageDto;
}
