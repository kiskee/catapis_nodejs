import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthController } from '../../../src/auth/contollers/auth.controller';
import { AuthService } from '../../../src/auth/services/auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let auth: { register: jest.Mock; login: jest.Mock };
  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = moduleRef.get(AuthController);
    auth = moduleRef.get(AuthService) as unknown as typeof auth;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });
  describe('register()', () => {
    const dto = { email: 'test@example.com', password: 'password123' };
    const resp = {
      user: {
        id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        isActive: true,
      },
      accessToken: 'mock.jwt.token',
    };
    it('debe delegar en el servicio y devolver la respuesta', async () => {
      auth.register.mockResolvedValue(resp);

      const result = await controller.register(dto);

      expect(auth.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual(resp);
    });
    it('propaga BadRequestException del servicio', async () => {
      auth.register.mockRejectedValue(
        new BadRequestException('Email ya registrado'),
      );

      await expect(controller.register(dto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(auth.register).toHaveBeenCalledWith(dto);
    });
    it('propaga InternalServerErrorException del servicio', async () => {
      auth.register.mockRejectedValue(
        new InternalServerErrorException('No se pudo registrar el usuario'),
      );

      await expect(controller.register(dto)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
      expect(auth.register).toHaveBeenCalledWith(dto);
    });
  });
  describe('login()', () => {
    const dto = { email: 'test@example.com', password: 'password123' };
    const resp = {
      user: {
        id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        isActive: true,
      },
      accessToken: 'mock.jwt.token',
    };
    it('debe delegar en el servicio y devolver la respuesta', async () => {
      auth.login.mockResolvedValue(resp);

      const result = await controller.login(dto);

      expect(auth.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual(resp);
    });
    it('propaga UnauthorizedException del servicio (credenciales inválidas)', async () => {
      auth.login.mockRejectedValue(
        new UnauthorizedException('Credenciales inválidas'),
      );

      await expect(controller.login(dto)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(auth.login).toHaveBeenCalledWith(dto);
    });

    it('propaga InternalServerErrorException del servicio', async () => {
      auth.login.mockRejectedValue(
        new InternalServerErrorException('No se pudo procesar el login'),
      );

      await expect(controller.login(dto)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
      expect(auth.login).toHaveBeenCalledWith(dto);
    });
  });
});
