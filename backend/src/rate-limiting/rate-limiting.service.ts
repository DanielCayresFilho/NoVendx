import { Injectable, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { LineReputationService } from '../line-reputation/line-reputation.service';

interface RateLimit {
  daily: number;
  hourly: number;
}

@Injectable()
export class RateLimitingService {
  private readonly baseLimits: Record<string, RateLimit> = {
    newLine: { daily: 20, hourly: 5 },      // Linhas novas (< 7 dias)
    warmingUp: { daily: 50, hourly: 10 },  // Linhas aquecendo (7-30 dias)
    mature: { daily: 150, hourly: 30 },    // Linhas maduras (> 30 dias)
  };

  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => LineReputationService))
    private lineReputationService?: LineReputationService,
  ) {}

  /**
   * Verifica se uma linha pode enviar mensagem baseado no rate limit
   * @param lineId ID da linha
   * @returns true se pode enviar, false caso contrário
   */
  async canSendMessage(lineId: number): Promise<boolean> {
    const line = await this.prisma.linesStock.findUnique({
      where: { id: lineId },
    });

    if (!line) {
      throw new BadRequestException('Linha não encontrada');
    }

    const lineAge = this.getLineAge(line.createdAt);
    const limit = await this.getLimit(lineAge, lineId);

    // Verificar limite diário
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const messagesToday = await this.prisma.conversation.count({
      where: {
        userLine: lineId,
        sender: 'operator',
        datetime: {
          gte: today,
        },
      },
    });

    if (messagesToday >= limit.daily) {
      console.warn(`⚠️ [RateLimit] Linha ${line.phone} atingiu limite diário: ${messagesToday}/${limit.daily}`);
      return false;
    }

    // Verificar limite horário
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const messagesLastHour = await this.prisma.conversation.count({
      where: {
        userLine: lineId,
        sender: 'operator',
        datetime: {
          gte: oneHourAgo,
        },
      },
    });

    if (messagesLastHour >= limit.hourly) {
      console.warn(`⚠️ [RateLimit] Linha ${line.phone} atingiu limite horário: ${messagesLastHour}/${limit.hourly}`);
      return false;
    }

    return true;
  }

  /**
   * Obtém o limite de mensagens baseado na idade da linha e reputação
   * @param lineAge Idade da linha em dias
   * @param lineId ID da linha (para calcular reputação)
   * @returns Limite de mensagens
   */
  private async getLimit(lineAge: number, lineId: number): Promise<RateLimit> {
    let baseLimit: RateLimit;
    
    if (lineAge < 7) {
      baseLimit = this.baseLimits.newLine;
    } else if (lineAge < 30) {
      baseLimit = this.baseLimits.warmingUp;
    } else {
      baseLimit = this.baseLimits.mature;
    }

    // Ajustar limite baseado na reputação (se disponível)
    if (this.lineReputationService) {
      try {
        const reputationLimit = await this.lineReputationService.getReputationBasedLimit(lineId);
        // Usar o menor entre o limite base e o limite baseado em reputação
        return {
          daily: Math.min(baseLimit.daily, reputationLimit),
          hourly: Math.min(baseLimit.hourly, Math.floor(reputationLimit / 6)), // Aproximadamente 1/6 do limite diário
        };
      } catch (error) {
        console.warn(`⚠️ [RateLimit] Erro ao calcular limite baseado em reputação:`, error.message);
        // Em caso de erro, usar limite base
      }
    }

    return baseLimit;
  }

  /**
   * Calcula a idade da linha em dias
   * @param createdAt Data de criação da linha
   * @returns Idade em dias
   */
  private getLineAge(createdAt: Date): number {
    const now = new Date();
    const diffTime = now.getTime() - createdAt.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24)); // Converter para dias
  }

  /**
   * Obtém informações sobre o rate limit de uma linha
   * @param lineId ID da linha
   * @returns Informações sobre o rate limit
   */
  async getRateLimitInfo(lineId: number): Promise<{
    lineAge: number;
    limit: RateLimit;
    messagesToday: number;
    messagesLastHour: number;
    canSend: boolean;
  }> {
    const line = await this.prisma.linesStock.findUnique({
      where: { id: lineId },
    });

    if (!line) {
      throw new BadRequestException('Linha não encontrada');
    }

    const lineAge = this.getLineAge(line.createdAt);
    const limit = await this.getLimit(lineAge, lineId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const messagesToday = await this.prisma.conversation.count({
      where: {
        userLine: lineId,
        sender: 'operator',
        datetime: {
          gte: today,
        },
      },
    });

    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const messagesLastHour = await this.prisma.conversation.count({
      where: {
        userLine: lineId,
        sender: 'operator',
        datetime: {
          gte: oneHourAgo,
        },
      },
    });

    const canSend = messagesToday < limit.daily && messagesLastHour < limit.hourly;

    return {
      lineAge,
      limit,
      messagesToday,
      messagesLastHour,
      canSend,
    };
  }
}

