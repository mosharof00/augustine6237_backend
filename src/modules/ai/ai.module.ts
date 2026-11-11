import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

@Module({
  imports: [PrismaModule],
  controllers: [AiController],
  exports: [AiService],
  providers: [AiService],
})
export class AiModule {}
