import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { BlocklistService } from '../blocklist/blocklist.service';
import { ConversationsService } from '../conversations/conversations.service';
import axios from 'axios';

@Injectable()
@Processor('campaigns')
export class CampaignsProcessor {
  constructor(
    private prisma: PrismaService,
    private blocklistService: BlocklistService,
    private conversationsService: ConversationsService,
  ) {}

  @Process('send-campaign-message')
  async handleSendMessage(job: Job) {
    const { campaignId, contactName, contactPhone, contactSegment, lineId, message } = job.data;

    try {
      // Verificar se está na blocklist
      const isBlocked = await this.blocklistService.isBlocked(contactPhone);
      if (isBlocked) {
        console.log(`❌ Contato ${contactPhone} está na blocklist`);
        await this.prisma.campaign.update({
          where: { id: campaignId },
          data: { response: false },
        });
        return;
      }

      // Buscar a linha
      const line = await this.prisma.linesStock.findUnique({
        where: { id: lineId },
      });

      if (!line || line.lineStatus !== 'active') {
        throw new Error('Linha não disponível');
      }

      // Buscar evolução
      const evolution = await this.prisma.evolution.findUnique({
        where: { evolutionName: line.evolutionName },
      });

      // Enviar mensagem via Evolution API
      const instanceName = `line_${line.phone.replace(/\D/g, '')}`;

      let retries = 0;
      let sent = false;

      while (retries < 3 && !sent) {
        try {
          await axios.post(
            `${evolution.evolutionUrl}/message/sendText/${instanceName}`,
            {
              number: contactPhone.replace(/\D/g, ''),
              text: message || 'Olá! Esta é uma mensagem da nossa campanha.',
            },
            {
              headers: {
                'apikey': evolution.evolutionKey,
              },
            }
          );

          sent = true;

          // Registrar conversa
          await this.conversationsService.create({
            contactName,
            contactPhone,
            segment: contactSegment,
            userName: 'Sistema',
            userLine: lineId,
            message: message || 'Olá! Esta é uma mensagem da nossa campanha.',
            sender: 'operator',
          });

          // Atualizar campanha
          await this.prisma.campaign.update({
            where: { id: campaignId },
            data: { response: true },
          });

          console.log(`✅ Mensagem enviada para ${contactPhone}`);
        } catch (error) {
          retries++;
          console.error(`Tentativa ${retries} falhou para ${contactPhone}:`, error.message);

          if (retries >= 3) {
            await this.prisma.campaign.update({
              where: { id: campaignId },
              data: {
                response: false,
                retryCount: retries,
              },
            });
          }
        }
      }
    } catch (error) {
      console.error('Erro ao processar campanha:', error);
      throw error;
    }
  }
}
