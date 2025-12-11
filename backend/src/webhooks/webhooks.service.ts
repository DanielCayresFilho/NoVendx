import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ConversationsService } from '../conversations/conversations.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { LinesService } from '../lines/lines.service';

@Injectable()
export class WebhooksService {
  constructor(
    private prisma: PrismaService,
    private conversationsService: ConversationsService,
    private websocketGateway: WebsocketGateway,
    private linesService: LinesService,
  ) {}

  async handleEvolutionMessage(data: any) {
    try {
      console.log('📩 Webhook recebido:', JSON.stringify(data, null, 2));

      // Verificar se é uma mensagem recebida
      if (data.event === 'messages.upsert' || data.event === 'MESSAGES_UPSERT') {
        const message = data.data?.message || data.message;

        if (!message) {
          return { status: 'ignored', reason: 'No message data' };
        }

        // Ignorar mensagens enviadas pelo próprio bot
        if (message.key?.fromMe) {
          return { status: 'ignored', reason: 'Message from self' };
        }

        // Número do contato (fallbacks para formatos diferentes de payload)
        const from =
          message.key?.remoteJid?.replace('@s.whatsapp.net', '') ||
          (typeof data.from === 'string' ? data.from.replace('@s.whatsapp.net', '') : undefined) ||
          (typeof data.sender === 'string' ? data.sender.replace('@s.whatsapp.net', '') : undefined);

        if (!from) {
          console.warn('Webhook sem número do remetente; ignorando.', { dataSnippet: data?.event || data?.data });
          return { status: 'ignored', reason: 'Missing sender/remoteJid' };
        }
        const messageText = message.message?.conversation
          || message.message?.extendedTextMessage?.text
          || message.message?.imageMessage?.caption
          || message.message?.videoMessage?.caption
          || 'Mídia recebida';

        const messageType = this.getMessageType(message.message);
        const mediaUrl = this.getMediaUrl(message.message);

        // Buscar a linha que recebeu a mensagem
        const instanceName = data.instance || data.instanceName;
        const phoneNumber = instanceName?.replace('line_', '');

        const line = await this.prisma.linesStock.findFirst({
          where: {
            phone: {
              contains: phoneNumber,
            },
          },
        });

        if (!line) {
          console.warn('Linha não encontrada para o número:', phoneNumber);
          return { status: 'ignored', reason: 'Line not found' };
        }

        // Buscar contato
        let contact = await this.prisma.contact.findFirst({
          where: { phone: from },
        });

        if (!contact) {
          // Criar contato se não existir
          contact = await this.prisma.contact.create({
            data: {
              name: message.pushName || from,
              phone: from,
              segment: line.segment,
            },
          });
        }

        // Criar conversa
        const conversation = await this.conversationsService.create({
          contactName: contact.name,
          contactPhone: from,
          segment: line.segment,
          userName: null,
          userLine: line.id,
          message: messageText,
          sender: 'contact',
          messageType,
          mediaUrl,
        });

        // Emitir via WebSocket
        await this.websocketGateway.emitNewMessage(conversation);

        return { status: 'success', conversation };
      }

      // Verificar status de conexão
      if (data.event === 'connection.update' || data.event === 'CONNECTION_UPDATE') {
        const state = data.data?.state || data.state;

        if (state === 'close' || state === 'DISCONNECTED') {
          // Linha foi desconectada/banida
          const instanceName = data.instance || data.instanceName;
          const phoneNumber = instanceName?.replace('line_', '');

          const line = await this.prisma.linesStock.findFirst({
            where: {
              phone: {
                contains: phoneNumber,
              },
            },
          });

          if (line) {
            // Marcar como banida e trocar automaticamente
            await this.linesService.handleBannedLine(line.id);
          }

          return { status: 'line_disconnected', lineId: line?.id };
        }
      }

      return { status: 'processed' };
    } catch (error) {
      console.error('Erro ao processar webhook:', error);
      return { status: 'error', error: error.message };
    }
  }

  private getMessageType(message: any): string {
    if (message?.imageMessage) return 'image';
    if (message?.videoMessage) return 'video';
    if (message?.audioMessage) return 'audio';
    if (message?.documentMessage) return 'document';
    return 'text';
  }

  private getMediaUrl(message: any): string | undefined {
    if (message?.imageMessage?.url) return message.imageMessage.url;
    if (message?.videoMessage?.url) return message.videoMessage.url;
    if (message?.audioMessage?.url) return message.audioMessage.url;
    if (message?.documentMessage?.url) return message.documentMessage.url;
    return undefined;
  }
}
