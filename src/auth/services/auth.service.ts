// src/auth/auth.service.ts
import { InjectModel } from '@nestjs/mongoose';
import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Model } from 'mongoose';
import { User } from '../shemas/user.schema';
import { RegisterDto } from '../dtos/register.dto';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from '../dtos/login.dto';
import * as bcrypt from 'bcrypt';


@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.userModel.exists({ email: dto.email });
    if (exists) throw new BadRequestException('Email ya registrado');

    const hash = await bcrypt.hash(dto.password, 10);
    const user = await this.userModel.create({ email: dto.email, password: hash });

    return {
      user: { id: String(user._id), email: user.email, isActive: user.isActive },
      accessToken: await this.signToken(user),
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userModel.findOne({ email: dto.email }).lean();
    if (!user) throw new UnauthorizedException('Credenciales inválidas');

    const ok = await bcrypt.compare(dto.password, user.password);
    if (!ok) throw new UnauthorizedException('Credenciales inválidas');

    return {
      user: { id: String(user._id), email: user.email, isActive: user.isActive },
      accessToken: await this.signToken(user as any),
    };
  }

  private async signToken(user: { _id?: any; id?: string; email: string }) {
    const payload = { sub: user._id ? String(user._id) : user.id, email: user.email };
    return this.jwt.signAsync(payload);
  }
}
