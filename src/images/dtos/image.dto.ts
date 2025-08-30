// src/images/dto/image.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ImageBreedDto {
  @ApiProperty({ example: 'abys' })
  id: string;

  @ApiProperty({ example: 'Abyssinian' })
  name: string;

  @ApiPropertyOptional({ example: '0XYvRd7oD' })
  reference_image_id?: string;

  @ApiPropertyOptional({ example: 'Egypt' })
  origin?: string;
}

export class ImageDto {
  @ApiProperty({ example: '0XYvRd7oD' })
  id: string;

  @ApiProperty({
    example: 'https://cdn2.thecatapi.com/images/0XYvRd7oD.jpg',
  })
  url: string;

  @ApiProperty({ example: 1200 })
  width: number;

  @ApiProperty({ example: 800 })
  height: number;

  // Aparece si include_breeds=1 o has_breeds=1
  @ApiPropertyOptional({ type: [ImageBreedDto] })
  breeds?: ImageBreedDto[];
}
