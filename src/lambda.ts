import { Handler, Context } from 'aws-lambda';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import serverless from 'serverless-http';

let cached: any = null;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use((req: any, _res: any, next: any) => {
    const ct = String(
      req.headers?.['content-type'] ?? req.headers?.['Content-Type'] ?? '',
    );
    if (ct.includes('application/json')) {
      if (Buffer.isBuffer(req.body)) {
        try {
          req.body = JSON.parse(req.body.toString('utf8'));
        } catch {}
      } else if (typeof req.body === 'string') {
        try {
          req.body = JSON.parse(req.body);
        } catch {}
      }
    }
    next();
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  await app.init();

  const expressApp = app.getHttpAdapter().getInstance();
  return serverless(expressApp);
}

export const handler: Handler = async (event, context: Context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  if (!cached) cached = await bootstrap();
  return cached(event, context, callback);
};
