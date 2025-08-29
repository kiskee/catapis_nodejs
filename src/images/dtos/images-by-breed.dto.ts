// src/images/dto/images-by-breed.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

export class ImagesByBreedDto {
  @ApiProperty({ description: 'Breed ID (ej: abys, sib, beng)', example: 'abys' })
  @IsString()
  breed_id!: string;

  @ApiPropertyOptional({ example: 5, description: 'Cantidad de imágenes (1-25)' })
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({ enum: ['thumb', 'small', 'med', 'full'], example: 'med' })
  @IsOptional()
  @IsIn(['thumb', 'small', 'med', 'full'])
  size?: 'thumb' | 'small' | 'med' | 'full';

  @ApiPropertyOptional({ example: 'jpg,png', description: 'Tipos mime separados por coma' })
  @IsOptional()
  @IsString()
  mime_types?: string;

  @ApiPropertyOptional({ enum: ['RANDOM', 'ASC', 'DESC'], example: 'RANDOM' })
  @IsOptional()
  @IsIn(['RANDOM', 'ASC', 'DESC'])
  order?: 'RANDOM' | 'ASC' | 'DESC';

  @ApiPropertyOptional({ example: 0, description: 'Página para paginar (0-n)' })
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsInt()
  @Min(0)
  page?: number;

  @ApiPropertyOptional({ example: 1, description: 'Incluye datos de la raza en la respuesta' })
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsIn([0, 1])
  include_breeds?: 0 | 1;

  @ApiPropertyOptional({ example: 1, description: 'Solo imágenes con breed data' })
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsIn([0, 1])
  has_breeds?: 0 | 1;

  // puedes agregar include_categories, format, etc. si los necesitas
}
