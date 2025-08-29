import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from 'src/infrastructure/adapters/http/http.module';
import { CatsController } from './contollers/cats.controller';
import { CatsService } from './services/cats.service';

@Module({
  imports: [ConfigModule, HttpModule], // para inyectar HTTP_ADAPTER y leer CAT_API_KEY
  controllers: [CatsController],
  providers: [CatsService],
})
export class CatsModule {}
