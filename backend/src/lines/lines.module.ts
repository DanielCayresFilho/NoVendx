import { Module, forwardRef } from '@nestjs/common';
import { LinesService } from './lines.service';
import { LinesController } from './lines.controller';
import { PrismaService } from '../prisma.service';
import { WebsocketModule } from '../websocket/websocket.module';
import { ControlPanelModule } from '../control-panel/control-panel.module';

@Module({
  imports: [
    forwardRef(() => WebsocketModule),
    ControlPanelModule,
  ],
  controllers: [LinesController],
  providers: [LinesService, PrismaService],
  exports: [LinesService],
})
export class LinesModule {}
