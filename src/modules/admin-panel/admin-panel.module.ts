import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ControlPanelController } from './control-panel.controller';
import { ControlPanelService } from './control-panel.service';

@Module({
  imports: [PrismaModule],
  controllers: [ControlPanelController],
  exports: [ControlPanelService],
  providers: [ControlPanelService],
})
export class AdminPanelModule {}
