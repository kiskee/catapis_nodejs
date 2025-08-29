import { Handler, Context } from 'aws-lambda';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import serverless from 'serverless-http';

// cacheamos el serverless handler para evitar recrear nest en cada invocación (mejora cold start)
let cached: any = null;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // hack medio feo: a veces el body llega como Buffer/string y rompe los pipes de validación
  // acá lo fuerzo a JSON cuando viene como application/json
  app.use((req: any, _res: any, next: any) => {
    const ct = String(
      req.headers?.['content-type'] ?? req.headers?.['Content-Type'] ?? '',
    );
    if (ct.includes('application/json')) {
      if (Buffer.isBuffer(req.body)) {
        try {
          req.body = JSON.parse(req.body.toString('utf8'));
        } catch {
          // si falla el parseo lo dejo como estaba
        }
      } else if (typeof req.body === 'string') {
        try {
          req.body = JSON.parse(req.body);
        } catch {
          // lo mismo, no lo rompo si viene raro
        }
      }
    }
    next();
  });

  // pipes globales de validación, quitan campos extra y transforman DTOs
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // inicializamos la app (sin listen porque es lambda)
  await app.init();

  // le pasamos el express app a serverless-http
  const expressApp = app.getHttpAdapter().getInstance();
  return serverless(expressApp);
}

// handler principal que va a usar lambda
export const handler: Handler = async (event, context: Context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false; // no esperar a que cierren conexiones
  if (!cached) cached = await bootstrap(); // si no hay instancia, la levantamos
  return cached(event, context, callback); // delegamos a serverless-http
};
