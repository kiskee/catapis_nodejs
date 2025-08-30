import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from 'helmet';
import compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  app.use(helmet());
  app.use(compression());
  app.enableCors({ origin: '*', credentials: true });

  // pipes globales
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  if ((process.env.NODE_ENV ?? 'development') !== 'production') {
    const { SwaggerModule, DocumentBuilder } = await import('@nestjs/swagger');
    const doc = new DocumentBuilder()
      .setTitle('Cat APIs')
      .setDescription('API de razas, imágenes y auth')
      .setVersion('1.0.0')
      .addBearerAuth()
      .build();
    const openapi = SwaggerModule.createDocument(app, doc);
    SwaggerModule.setup('docs', app, openapi);
  }

  app.enableShutdownHooks();

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  Logger.log(
    `HTTP server running on http://localhost:${port} (env=${process.env.NODE_ENV ?? 'development'})`,
  );
}

bootstrap();
