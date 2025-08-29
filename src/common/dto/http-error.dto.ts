// (opcional) estandarizar error para examples
// src/common/dto/http-error.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class HttpErrorDto {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: ['email must be an email'] })
  message: string[] | string;

  @ApiProperty({ example: 'Bad Request' })
  error: string;
}
