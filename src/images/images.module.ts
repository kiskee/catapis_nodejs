import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from 'src/infrastructure/adapters/http/http.module';
import { ImagesController } from './contollers/images.controller';
import { ImagesService } from './services/images.service';

@Module({
  imports: [ConfigModule, HttpModule],
  controllers: [ImagesController],
  providers: [ImagesService],
  exports: [ImagesService],
})
export class ImagesModule {}
