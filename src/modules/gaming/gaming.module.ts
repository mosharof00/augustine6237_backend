import { Module } from '@nestjs/common';
import { GamingController } from './gaming.controller';
import { GamingService } from './gaming.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GamingController],
  providers: [GamingService],
  exports: [GamingService],
})
export class GamingModule {}
