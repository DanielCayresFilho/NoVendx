import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ConversationsService } from '../conversations/conversations.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';

@Injectable()
export class MessageQueueService {
  constructor(
    private prisma: PrismaService,
    private conversationsService: ConversationsService,
    private websocketGateway: WebsocketGateway,
  ) {}

  /**
   * Adiciona mensagem à fila quando não há operador online
   */
  async addToQueue(
    contactPhone: string,
    contactName: string,
    message: string,
    messageType: string = 'text',
    mediaUrl?: string,
    segment?: number,
  ) {
    return await this.prisma.messageQueue.create({
      data: {
        contactPhone,
        contactName,
        message,
        messageType,
        mediaUrl,
        segment,
        status: 'pending',
      },
    });
  }

  /**
   * Processa mensagens pendentes quando operador fica online
   */
  async processPendingMessages(operatorId: number, operatorSegment?: number) {
    const whereClause: any = {
      status: 'pending',
    };

    // Filtrar por segmento se o operador tiver segmento
    if (operatorSegment) {
      whereClause.segment = operatorSegment;
    }

    const pendingMessages = await this.prisma.messageQueue.findMany({
      where: whereClause,
      orderBy: { createdAt: 'asc' },
      take: 10, // Processar até 10 mensagens por vez
    });

    for (const queuedMessage of pendingMessages) {
      try {
        // Marcar como processando
        await this.prisma.messageQueue.update({
          where: { id: queuedMessage.id },
          data: { status: 'processing', attempts: { increment: 1 } },
        });

        // Criar conversa e enviar mensagem via WebSocket
        // Nota: Isso vai criar a conversa e notificar o operador
        await this.conversationsService.create({
          contactPhone: queuedMessage.contactPhone,
          contactName: queuedMessage.contactName || queuedMessage.contactPhone,
          message: queuedMessage.message,
          sender: 'contact',
          messageType: queuedMessage.messageType,
          mediaUrl: queuedMessage.mediaUrl,
          segment: queuedMessage.segment,
          userId: operatorId,
        });

        // Marcar como enviada
        await this.prisma.messageQueue.update({
          where: { id: queuedMessage.id },
          data: {
            status: 'sent',
            processedAt: new Date(),
          },
        });

        // Notificar operador via WebSocket sobre nova mensagem na fila
        this.websocketGateway.emitToUser(operatorId, 'queued-message-processed', {
          messageId: queuedMessage.id,
          contactPhone: queuedMessage.contactPhone,
        });
      } catch (error) {
        console.error(`❌ [MessageQueue] Erro ao processar mensagem ${queuedMessage.id}:`, error);
        
        // Marcar como falha se exceder 3 tentativas
        if (queuedMessage.attempts >= 3) {
          await this.prisma.messageQueue.update({
            where: { id: queuedMessage.id },
            data: {
              status: 'failed',
              errorMessage: error.message,
            },
          });
        } else {
          // Voltar para pending para tentar novamente
          await this.prisma.messageQueue.update({
            where: { id: queuedMessage.id },
            data: { status: 'pending' },
          });
        }
      }
    }

    return pendingMessages.length;
  }

  /**
   * Verifica se há operadores online para processar mensagens
   */
  async checkAndProcessQueue() {
    // Buscar operadores online
    const onlineOperators = await this.prisma.user.findMany({
      where: {
        role: 'operator',
        status: 'Online',
      },
      include: {
        lineOperators: true,
      },
    });

    // Processar mensagens para cada operador online
    for (const operator of onlineOperators) {
      if (operator.lineOperators.length > 0) {
        // Operador tem linha, pode processar mensagens
        await this.processPendingMessages(operator.id, operator.segment || undefined);
      }
    }
  }
}

