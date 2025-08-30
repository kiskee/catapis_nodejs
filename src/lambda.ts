import { Handler, Context } from 'aws-lambda';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
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

  app.enableCors({
    origin: ['http://localhost:5173'], // agrega tu dominio prod si aplica
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false, // true solo si manejas cookies
    optionsSuccessStatus: 204,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const cfg = new DocumentBuilder()
    .setTitle('API')
    .setDescription('Documentación de la API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const doc = SwaggerModule.createDocument(app, cfg);
  SwaggerModule.setup('docs', app, doc, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.init();

  const expressApp = app.getHttpAdapter().getInstance();
  return serverless(expressApp);
}

export const handler: Handler = async (event, context: Context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  if (!cached) cached = await bootstrap();
  return cached(event, context, callback);
};
