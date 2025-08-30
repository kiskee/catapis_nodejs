import path from 'path';

describe('jwt.config', () => {
  const ORIGINAL_ENV = process.env;

  const CONFIG_PATH = path.join(__dirname, '../../src/auth/jwt.config');

  const loadConfig = () => {
    jest.resetModules();

    return require(CONFIG_PATH) as {
      JWT_SECRET: string;
      JWT_EXPIRES: string;
    };
  };

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
    delete process.env.JWT_SECRET;
    delete process.env.JWT_EXPIRES;
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('usa valores por defecto cuando no hay variables de entorno', () => {
    const { JWT_SECRET, JWT_EXPIRES } = loadConfig();
    expect(JWT_SECRET).toBe('dev-secret');
    expect(JWT_EXPIRES).toBe('1d');
  });

  it('usa variables de entorno cuando están definidas', () => {
    process.env.JWT_SECRET = 'super-secret';
    process.env.JWT_EXPIRES = '2h';
    const { JWT_SECRET, JWT_EXPIRES } = loadConfig();
    expect(JWT_SECRET).toBe('super-secret');
    expect(JWT_EXPIRES).toBe('2h');
  });

  it('si la env es cadena vacía, conserva la vacía (no cae al default)', () => {
    process.env.JWT_SECRET = '';
    process.env.JWT_EXPIRES = '';
    const { JWT_SECRET, JWT_EXPIRES } = loadConfig();
    expect(JWT_SECRET).toBe('');
    expect(JWT_EXPIRES).toBe('');
  });
});
