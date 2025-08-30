import { InjectModel } from '@nestjs/mongoose';
import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { User } from '../shemas/user.schema';
import { RegisterDto } from '../dtos/register.dto';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from '../dtos/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    try {
      const exists = await this.userModel.exists({ email: dto.email });
      if (exists) {
        throw new BadRequestException('Email ya registrado');
      }

      const hash = await bcrypt.hash(dto.password, 10);

      const user = await this.userModel.create({
        email: dto.email,
        password: hash,
      });

      return {
        user: {
          id: String(user._id),
          email: user.email,
          isActive: user.isActive,
        },
        accessToken: await this.signToken(user),
      };
    } catch (error) {
      this.logger.error(
        `Error en register para email=${dto.email}: ${error.message}`,
      );

      if (error instanceof BadRequestException) {
        throw error; // re-lanzamos validaciones conocidas
      }

      throw new InternalServerErrorException('No se pudo registrar el usuario');
    }
  }

  async login(dto: LoginDto) {
    try {
      const user = await this.userModel.findOne({ email: dto.email }).lean();
      if (!user) {
        throw new UnauthorizedException('Credenciales inválidas');
      }

      const ok = await bcrypt.compare(dto.password, user.password);
      if (!ok) {
        throw new UnauthorizedException('Credenciales inválidas');
      }

      return {
        user: {
          id: String(user._id),
          email: user.email,
          isActive: user.isActive,
        },
        accessToken: await this.signToken(user as any),
      };
    } catch (error) {
      this.logger.warn(
        `Intento de login fallido para email=${dto.email}: ${error.message}`,
      );

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new InternalServerErrorException('No se pudo procesar el login');
    }
  }

  private async signToken(user: { _id?: any; id?: string; email: string }) {
    try {
      const payload = {
        sub: user._id ? String(user._id) : user.id,
        email: user.email,
      };
      return await this.jwt.signAsync(payload);
    } catch (error) {
      this.logger.error(
        `Error firmando token para user=${user.email}: ${error.message}`,
      );
      throw new InternalServerErrorException('Error al generar el token JWT');
    }
  }
}
