import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../../../src/auth/services/auth.service';
import {
  BadRequestException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';

function buildUserModelMock() {
  const Ctor: any = jest.fn(function (this: any, dto: any) {
    Object.assign(this, dto);
  });

  Ctor.prototype.save = jest.fn();

  Ctor.findOne = jest.fn();
  Ctor.create = jest.fn();
  Ctor.exists = jest.fn();

  return Ctor;
}

jest.mock('bcrypt', () => ({
  __esModule: true,
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let UserModel: any;
  let jwt: { signAsync: jest.Mock };

  beforeEach(async () => {
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    UserModel = buildUserModelMock();

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getModelToken('User'), useValue: UserModel },
        { provide: JwtService, useValue: { signAsync: jest.fn() } },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
    jwt = moduleRef.get(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('register()', () => {
    const mockRegisterDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    const mockUser = {
      _id: '507f1f77bcf86cd799439011',
      email: 'test@example.com',
      password: 'hashedPassword',
      isActive: true,
    };

    const mockHashedPassword = 'hashedPassword123';
    const mockAccessToken = 'mock.jwt.token';
    it('debe registrar un usuario exitosamente', async () => {
      const existsSpy = jest
        .spyOn(UserModel, 'exists')
        .mockResolvedValue(null as any);
      const hashSpy = jest
        .spyOn(bcrypt, 'hash' as any)
        .mockResolvedValue(mockHashedPassword);
      const createSpy = jest
        .spyOn(UserModel, 'create')
        .mockResolvedValue(mockUser as any);
      const signSpy = jest
        .spyOn(service as any, 'signToken')
        .mockResolvedValue(mockAccessToken);

      const resp = await service.register(mockRegisterDto);

      expect(existsSpy).toHaveBeenCalledWith({ email: mockRegisterDto.email });
      expect(hashSpy).toHaveBeenCalledWith(mockRegisterDto.password, 10);
      expect(createSpy).toHaveBeenCalledWith({
        email: mockRegisterDto.email,
        password: mockHashedPassword,
      });
      expect(signSpy).toHaveBeenCalledWith(mockUser);

      expect(resp).toEqual({
        user: {
          id: String(mockUser._id),
          email: mockUser.email,
          isActive: mockUser.isActive,
        },
        accessToken: mockAccessToken,
      });
    });

    it('debe lanzar BadRequestException si el email ya está registrado (y loguear el error)', async () => {
      if (!(service as any).logger)
        (service as any).logger = { error: jest.fn() };
      const loggerSpy = jest
        .spyOn((service as any).logger, 'error')
        .mockImplementation(() => {});

      const existsSpy = jest
        .spyOn(UserModel, 'exists')
        .mockResolvedValue({ _id: 'x' } as any);
      const hashSpy = jest.spyOn(bcrypt, 'hash' as any);
      const createSpy = jest.spyOn(UserModel, 'create');

      await expect(service.register(mockRegisterDto)).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(existsSpy).toHaveBeenCalledWith({ email: mockRegisterDto.email });
      expect(hashSpy).not.toHaveBeenCalled();
      expect(createSpy).not.toHaveBeenCalled();
      expect(loggerSpy).toHaveBeenCalled();
      const loggedMsg = (loggerSpy.mock.calls[0]?.[0] as string) ?? '';
      expect(loggedMsg).toContain('register');
      expect(loggedMsg).toContain(mockRegisterDto.email);
    });
    it('convierte errores inesperados en InternalServerErrorException (por ejemplo, create falla)', async () => {
      if (!(service as any).logger)
        (service as any).logger = { error: jest.fn() };
      const loggerSpy = jest
        .spyOn((service as any).logger, 'error')
        .mockImplementation(() => {});

      jest.spyOn(UserModel, 'exists').mockResolvedValue(null as any);
      jest.spyOn(bcrypt, 'hash' as any).mockResolvedValue(mockHashedPassword);
      jest.spyOn(UserModel, 'create').mockRejectedValue(new Error('db down'));

      await expect(service.register(mockRegisterDto)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );

      expect(loggerSpy).toHaveBeenCalled();
    });
    it('si signToken falla, lanza InternalServerErrorException (y loguea)', async () => {
      if (!(service as any).logger)
        (service as any).logger = { error: jest.fn() };
      const loggerSpy = jest
        .spyOn((service as any).logger, 'error')
        .mockImplementation(() => {});

      jest.spyOn(UserModel, 'exists').mockResolvedValue(null as any);
      jest.spyOn(bcrypt, 'hash' as any).mockResolvedValue(mockHashedPassword);
      jest.spyOn(UserModel, 'create').mockResolvedValue(mockUser as any);
      jest
        .spyOn(service as any, 'signToken')
        .mockRejectedValue(new Error('jwt fail'));

      await expect(service.register(mockRegisterDto)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
      expect(loggerSpy).toHaveBeenCalled();
    });
  });

  describe('login()', () => {
    const dto = { email: 'test@example.com', password: 'password123' };
    const userDoc = {
      _id: '507f1f77bcf86cd799439011',
      email: 'test@example.com',
      password: 'hashedPassword',
      isActive: true,
    };
    const accessToken = 'mock.jwt.token';

    function mockFindOneReturning(value: any) {
      const lean = jest.fn().mockResolvedValue(value);
      const query: any = { lean };
      const findOneSpy = jest
        .spyOn(UserModel, 'findOne')
        .mockReturnValue(query);
      return { findOneSpy, lean };
    }
    it('debe loguear exitosamente y devolver user + accessToken', async () => {
      const { findOneSpy, lean } = mockFindOneReturning(userDoc);
      const compareSpy = jest
        .spyOn(bcrypt, 'compare' as any)
        .mockResolvedValue(true);
      const signSpy = jest
        .spyOn(service as any, 'signToken')
        .mockResolvedValue(accessToken);

      const resp = await service.login(dto);

      expect(findOneSpy).toHaveBeenCalledWith({ email: dto.email });
      expect(lean).toHaveBeenCalled();
      expect(compareSpy).toHaveBeenCalledWith(dto.password, userDoc.password);
      expect(signSpy).toHaveBeenCalledWith(userDoc as any);

      expect(resp).toEqual({
        user: {
          id: String(userDoc._id),
          email: userDoc.email,
          isActive: userDoc.isActive,
        },
        accessToken,
      });
    });
    it('lanza UnauthorizedException si el email no existe (y hace warn)', async () => {
      if (!(service as any).logger)
        (service as any).logger = { warn: jest.fn() };
      const warnSpy = jest
        .spyOn((service as any).logger, 'warn')
        .mockImplementation(() => {});

      const { findOneSpy, lean } = mockFindOneReturning(null);
      const compareSpy = jest.spyOn(bcrypt, 'compare' as any);

      await expect(service.login(dto)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );

      expect(findOneSpy).toHaveBeenCalledWith({ email: dto.email });
      expect(lean).toHaveBeenCalled();
      expect(compareSpy).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalled();
      const msg = (warnSpy.mock.calls[0]?.[0] as string) ?? '';
      expect(msg).toContain('login');
      expect(msg).toContain(dto.email);
    });
    it('lanza UnauthorizedException si la contraseña no coincide (y hace warn)', async () => {
      if (!(service as any).logger)
        (service as any).logger = { warn: jest.fn() };
      const warnSpy = jest
        .spyOn((service as any).logger, 'warn')
        .mockImplementation(() => {});

      const { findOneSpy, lean } = mockFindOneReturning(userDoc);
      const compareSpy = jest
        .spyOn(bcrypt, 'compare' as any)
        .mockResolvedValue(false);
      const signSpy = jest.spyOn(service as any, 'signToken');

      await expect(service.login(dto)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );

      expect(findOneSpy).toHaveBeenCalledWith({ email: dto.email });
      expect(lean).toHaveBeenCalled();
      expect(compareSpy).toHaveBeenCalledWith(dto.password, userDoc.password);
      expect(signSpy).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalled();
    });
    it('convierte errores inesperados en InternalServerErrorException (por ejemplo, .lean() falla)', async () => {
      if (!(service as any).logger)
        (service as any).logger = { warn: jest.fn() };
      const warnSpy = jest
        .spyOn((service as any).logger, 'warn')
        .mockImplementation(() => {});

      // findOne().lean() rechaza
      const lean = jest.fn().mockRejectedValue(new Error('db down'));
      jest.spyOn(UserModel, 'findOne').mockReturnValue({ lean } as any);

      await expect(service.login(dto)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );

      expect(lean).toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalled();
    });

    it('si bcrypt.compare lanza error, responde InternalServerErrorException (y hace warn)', async () => {
      if (!(service as any).logger)
        (service as any).logger = { warn: jest.fn() };
      const warnSpy = jest
        .spyOn((service as any).logger, 'warn')
        .mockImplementation(() => {});

      const { findOneSpy, lean } = mockFindOneReturning(userDoc);
      jest
        .spyOn(bcrypt, 'compare' as any)
        .mockRejectedValue(new Error('bcrypt fail'));
      const signSpy = jest.spyOn(service as any, 'signToken');

      await expect(service.login(dto)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );

      expect(findOneSpy).toHaveBeenCalledWith({ email: dto.email });
      expect(lean).toHaveBeenCalled();
      expect(signSpy).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalled();
    });
  });
});
