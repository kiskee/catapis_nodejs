import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthResponseDto } from '../dtos/auth-response.dto';
import { LoginDto } from '../dtos/login.dto';
import { RegisterDto } from '../dtos/register.dto';
import { AuthService } from '../services/auth.service';
import { HttpErrorDto } from 'src/common/dto/http-error.dto';
import { Public } from '../decorators/public.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Registrar un usuario con email y password' })
  @ApiBody({ type: RegisterDto })
  @ApiCreatedResponse({
    description: 'Usuario creado y JWT emitido',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Body inválido o email ya registrado',
    type: HttpErrorDto,
    examples: {
      validation: {
        summary: 'Validación (class-validator)',
        value: {
          statusCode: 400,
          message: [
            'email must be an email',
            'password must be longer than or equal to 8 characters',
          ],
          error: 'Bad Request',
        },
      },
      exists: {
        summary: 'Email ya registrado',
        value: {
          statusCode: 400,
          message: 'Email ya registrado',
          error: 'Bad Request',
        },
      },
    },
  })
  async register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return await this.auth.register(dto);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión con email y password' })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    description: 'Login correcto; devuelve usuario + JWT',
    type: AuthResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Credenciales inválidas',
    type: HttpErrorDto,
    examples: {
      wrongCreds: {
        summary: 'Email o password incorrectos',
        value: {
          statusCode: 401,
          message: 'Credenciales inválidas',
          error: 'Unauthorized',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Body inválido (falta email/password o formatos)',
    type: HttpErrorDto,
    examples: {
      validation: {
        summary: 'Validación (class-validator)',
        value: {
          statusCode: 400,
          message: ['email must be an email', 'password must be a string'],
          error: 'Bad Request',
        },
      },
    },
  })
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return await this.auth.login(dto);
  }
}
