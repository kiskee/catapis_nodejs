import { Module } from '@nestjs/common';
import { CatsModule } from './cats/cats.module';
import { ImagesModule } from './images/images.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    CatsModule,
    ImagesModule,
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      useFactory: (cs: ConfigService) => ({
        uri: cs.get<string>('MONGO_URI'),
        dbName: 'catapis',  
      }),
      inject: [ConfigService],
    }),
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
