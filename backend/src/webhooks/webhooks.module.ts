import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { PrismaService } from '../prisma.service';
import { ConversationsModule } from '../conversations/conversations.module';
import { WebsocketModule } from '../websocket/websocket.module';
import { LinesModule } from '../lines/lines.module';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [ConversationsModule, WebsocketModule, LinesModule, MediaModule],
  controllers: [WebhooksController],
  providers: [WebhooksService, PrismaService],
})
export class WebhooksModule {}
