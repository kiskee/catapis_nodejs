// src/lambda.ts (extracto)
import { Handler, Context } from 'aws-lambda';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import serverless from 'serverless-http';

let cachedHandler: any = null;

async function bootstrapServer() {
  const app = await NestFactory.create(AppModule);

  // 👇 Middleware: si el body llega como Buffer, parsearlo
  app.use((req: any, _res: any, next: any) => {
    const ct = (req.headers?.['content-type'] || req.headers?.['Content-Type'] || '').toString();
    if (ct.includes('application/json') && Buffer.isBuffer(req.body)) {
      try { req.body = JSON.parse(req.body.toString('utf8')); } catch { /* ignore */ }
    } else if (ct.includes('application/json') && typeof req.body === 'string') {
      try { req.body = JSON.parse(req.body); } catch { /* ignore */ }
    }
    next();
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();

  const expressApp = app.getHttpAdapter().getInstance();
  return serverless(expressApp, {
    // si mantienes stage "default", conserva este basePath (lo ya sugerido)
    basePath: (req: any) => {
      const stage = req?.requestContext?.stage;
      return stage && stage !== '$default' ? `/${stage}` : '';
    },
  });
}

export const handler: Handler = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  if (!cachedHandler) cachedHandler = await bootstrapServer();
  return cachedHandler(event, context, callback);
};
