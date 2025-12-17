import { Module } from '@nestjs/common';
import { MessageQueueService } from './message-queue.service';
import { PrismaService } from '../prisma.service';
import { ConversationsModule } from '../conversations/conversations.module';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [ConversationsModule, WebsocketModule],
  providers: [MessageQueueService, PrismaService],
  exports: [MessageQueueService],
})
export class MessageQueueModule {}

