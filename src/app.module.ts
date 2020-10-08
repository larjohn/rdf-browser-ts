import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { DataModule } from './data/data.module';
import { PageModule } from './page/page.module';
import configuration from './config/configuration';

@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true,
    load: [configuration],

  },), DataModule, PageModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule  {}
