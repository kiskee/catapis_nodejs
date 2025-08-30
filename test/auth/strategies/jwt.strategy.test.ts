// jwt.strategy.spec.ts
// ⚠️ Ajusta las rutas si difieren en tu proyecto

// 1) Mock de passport para evitar la validación del "name"
jest.mock('passport', () => ({
  use: jest.fn(),
  authenticate: jest.fn(),
}));

// 2) Capturamos las opciones que recibe Strategy (lo que pasa al super())
let capturedOptions: any;

// 3) Mock de passport-jwt
jest.mock('passport-jwt', () => {
  const extractorFn = jest.fn(); // lo que devuelve fromAuthHeaderAsBearerToken()
  const Strategy = jest.fn().mockImplementation(function (options: any) {
    capturedOptions = options;
  });
  return {
    Strategy,
    ExtractJwt: {
      fromAuthHeaderAsBearerToken: jest.fn(() => extractorFn),
    },
  };
});

// 4) Mock del secreto
jest.mock('../../../src/auth/jwt.config', () => ({
  JWT_SECRET: 'test-secret',
}));

import * as passport from 'passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtStrategy } from '../../../src/auth/strategies/jwt.strategy';

describe('JwtStrategy', () => {
  beforeEach(() => {
    capturedOptions = undefined;
    jest.clearAllMocks();
  });

  it('configura Strategy con el extractor Bearer, secret y ignoreExpiration=false', () => {
    const strategy = new JwtStrategy();

    // Se invocó el extractor correcto
    expect(ExtractJwt.fromAuthHeaderAsBearerToken).toHaveBeenCalledTimes(1);
    const returnedExtractor =
      (ExtractJwt.fromAuthHeaderAsBearerToken as jest.Mock).mock.results[0].value;

    // Se construyó la Strategy con las opciones esperadas
    expect(Strategy).toHaveBeenCalledTimes(1);
    expect(capturedOptions).toBeDefined();
    expect(capturedOptions.jwtFromRequest).toBe(returnedExtractor);
    expect(capturedOptions.ignoreExpiration).toBe(false);
    expect(capturedOptions.secretOrKey).toBe('test-secret');

    // Nest registra la estrategia en passport.use (mockeado)
    expect((passport as any).use).toHaveBeenCalled();

    expect(strategy).toBeInstanceOf(JwtStrategy);
  });

  it('validate() mapea el payload a { id, email }', () => {
    const strategy = new JwtStrategy();

    const payload = { sub: '507f1f77bcf86cd799439011', email: 'test@example.com' };
    const result = strategy.validate(payload as any);
    

    expect(result).toEqual({
      id: '507f1f77bcf86cd799439011',
      email: 'test@example.com',
    });
  });
});
