import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class BreedSearchDto {
  @ApiPropertyOptional({ example: 'sib' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ enum: [0, 1], example: 1 })
  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === '' ? undefined : Number(value),
  )
  @IsIn([0, 1])
  attach_image?: 0 | 1;
}
