import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from 'src/infrastructure/adapters/http/http.module';
import { CatsController } from './contollers/cats.controller';
import { CatsService } from './services/cats.service';

@Module({
  imports: [ConfigModule, HttpModule],
  controllers: [CatsController],
  providers: [CatsService],
})
export class CatsModule {}
