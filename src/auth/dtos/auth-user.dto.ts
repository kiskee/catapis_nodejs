// src/auth/dto/auth-user.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class AuthUserDto {
  @ApiProperty({ example: '66e2b7c01d1f2a0012abc345' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: true })
  isActive: boolean;
}
