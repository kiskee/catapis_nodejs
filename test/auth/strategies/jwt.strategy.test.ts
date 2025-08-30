jest.mock('passport', () => ({
  use: jest.fn(),
  authenticate: jest.fn(),
}));

let capturedOptions: any;

jest.mock('passport-jwt', () => {
  const extractorFn = jest.fn();
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

    expect(ExtractJwt.fromAuthHeaderAsBearerToken).toHaveBeenCalledTimes(1);
    const returnedExtractor = (
      ExtractJwt.fromAuthHeaderAsBearerToken as jest.Mock
    ).mock.results[0].value;

    expect(Strategy).toHaveBeenCalledTimes(1);
    expect(capturedOptions).toBeDefined();
    expect(capturedOptions.jwtFromRequest).toBe(returnedExtractor);
    expect(capturedOptions.ignoreExpiration).toBe(false);
    expect(capturedOptions.secretOrKey).toBe('test-secret');

    expect((passport as any).use).toHaveBeenCalled();

    expect(strategy).toBeInstanceOf(JwtStrategy);
  });

  it('validate() mapea el payload a { id, email }', () => {
    const strategy = new JwtStrategy();

    const payload = {
      sub: '507f1f77bcf86cd799439011',
      email: 'test@example.com',
    };
    const result = strategy.validate(payload as any);

    expect(result).toEqual({
      id: '507f1f77bcf86cd799439011',
      email: 'test@example.com',
    });
  });
});
