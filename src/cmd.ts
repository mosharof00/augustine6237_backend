import 'dotenv/config';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommandFactory } from 'nest-commander';
import appConfig from './config/app.config';
import { PrismaService } from './prisma/prisma.service';
import { SeedCommand } from './command/seed.command';
import { UserRepository } from './common/repository/user/user.repository';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
  ],
  providers: [SeedCommand, PrismaService, UserRepository],
})
export class AppModule {}

async function bootstrap() {
  await CommandFactory.run(AppModule);
}

bootstrap();
