// src/auth/dto/register.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email único del usuario' })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'MiClaveSegura123',
    minLength: 8,
    maxLength: 64,
    description: 'Contraseña (8-64 chars)'
  })
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  password: string;
}
