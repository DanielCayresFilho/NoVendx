import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { LinesService } from '../lines/lines.service';
import { ControlPanelService } from '../control-panel/control-panel.service';
import { AppLoggerService } from '../logger/logger.service';

interface LineAssignmentResult {
  success: boolean;
  lineId?: number;
  linePhone?: string;
  reason?: string;
}

@Injectable()
export class LineAssignmentService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => LinesService))
    private linesService: LinesService,
    private controlPanelService: ControlPanelService,
    private logger: AppLoggerService,
  ) {}

  /**
   * Encontra uma linha disponível para um operador
   * Centraliza toda a lógica de atribuição de linha (elimina duplicação)
   */
  async findAvailableLineForOperator(
    userId: number,
    userSegment: number | null,
    traceId?: string,
    excludeLineId?: number,
  ): Promise<LineAssignmentResult> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          lineOperators: {
            include: {
              line: true,
            },
          },
        },
      });

      if (!user) {
        return { success: false, reason: 'Usuário não encontrado' };
      }

      // Se já tem linha ativa E não é para excluir essa linha, retornar
      if (user.line && (!excludeLineId || user.line !== excludeLineId)) {
        const existingLine = await this.prisma.linesStock.findUnique({
          where: { id: user.line },
        });

        if (existingLine && existingLine.lineStatus === 'active') {
          this.logger.log(
            `Operador ${user.name} já possui linha ativa: ${existingLine.phone}`,
            'LineAssignment',
            { userId, lineId: existingLine.id, traceId },
          );
          return {
            success: true,
            lineId: existingLine.id,
            linePhone: existingLine.phone,
          };
        }
      }

      // Buscar linhas disponíveis seguindo prioridade:
      // 1. Linhas do segmento do operador
      // 2. Linhas com segmento null
      // 3. Linhas do segmento "Padrão"
      // 4. Qualquer linha ativa

      const activeEvolutions = await this.controlPanelService.getActiveEvolutions();
      const availableLines = await this.controlPanelService.filterLinesByActiveEvolutions(
        await this.prisma.linesStock.findMany({
          where: {
            lineStatus: 'active',
          },
          include: {
            operators: {
              include: {
                user: {
                  select: {
                    id: true,
                    segment: true,
                  },
                },
              },
            },
          },
        }),
      );

      // Prioridade 1: Linhas do segmento do operador (excluindo a linha antiga se fornecida)
      let candidateLine = availableLines.find((line) => {
        if (excludeLineId && line.id === excludeLineId) return false; // IMPORTANTE: Excluir linha antiga
        if (line.segment !== userSegment) return false;
        if (line.operators.length >= 2) return false;
        // Verificar se não mistura segmentos
        const hasDifferentSegment = line.operators.some(
          (op) => op.user?.segment !== userSegment,
        );
        return !hasDifferentSegment;
      });

      // Prioridade 2: Linhas com segmento null (excluindo a linha antiga)
      if (!candidateLine) {
        candidateLine = availableLines.find((line) => {
          if (excludeLineId && line.id === excludeLineId) return false;
          if (line.segment !== null) return false;
          if (line.operators.length >= 2) return false;
          return true;
        });
      }

      // Prioridade 3: Linhas do segmento "Padrão" (excluindo a linha antiga)
      if (!candidateLine) {
        candidateLine = availableLines.find((line) => {
          if (excludeLineId && line.id === excludeLineId) return false;
          if (line.segment !== 'Padrão') return false;
          if (line.operators.length >= 2) return false;
          return true;
        });
      }

      // Prioridade 4: Qualquer linha disponível (excluindo a linha antiga) - última tentativa
      if (!candidateLine) {
        candidateLine = availableLines.find((line) => {
          if (excludeLineId && line.id === excludeLineId) return false;
          if (line.operators.length >= 2) return false;
          return true;
        });
      }

      if (!candidateLine) {
        this.logger.warn(
          `Nenhuma linha disponível para operador ${user.name}`,
          'LineAssignment',
          { userId, userSegment, traceId },
        );
        return { success: false, reason: 'Nenhuma linha disponível' };
      }

      // Atribuir linha usando método com transaction e lock
      try {
        await this.linesService.assignOperatorToLine(candidateLine.id, userId);
        
        // Se a linha tinha segmento null, atualizar para o segmento do operador
        if (candidateLine.segment === null && userSegment !== null) {
          await this.prisma.linesStock.update({
            where: { id: candidateLine.id },
            data: { segment: userSegment },
          });
        }

        this.logger.log(
          `Linha ${candidateLine.phone} atribuída ao operador ${user.name}`,
          'LineAssignment',
          { userId, lineId: candidateLine.id, linePhone: candidateLine.phone, traceId },
        );

        return {
          success: true,
          lineId: candidateLine.id,
          linePhone: candidateLine.phone,
        };
      } catch (error: any) {
        this.logger.error(
          `Erro ao atribuir linha ${candidateLine.phone} ao operador ${user.name}`,
          error.stack,
          'LineAssignment',
          { userId, lineId: candidateLine.id, error: error.message, traceId },
        );
        return { success: false, reason: error.message };
      }
    } catch (error: any) {
      this.logger.error(
        `Erro ao buscar linha disponível para operador ${userId}`,
        error.stack,
        'LineAssignment',
        { userId, error: error.message, traceId },
      );
      return { success: false, reason: error.message };
    }
  }

  /**
   * Realoca uma linha para um operador (quando linha atual foi banida ou com erro)
   * IMPORTANTE: Se a linha estiver banida, atualiza o status para 'ban' e desvincula TODOS os operadores
   */
  async reallocateLineForOperator(
    userId: number,
    userSegment: number | null,
    oldLineId?: number,
    traceId?: string,
    markAsBanned: boolean = false,
  ): Promise<LineAssignmentResult> {
    try {
      // Se linha deve ser marcada como banida, atualizar status e desvincular TODOS os operadores
      if (oldLineId && markAsBanned) {
        // Buscar linha para verificar status atual
        const oldLine = await this.prisma.linesStock.findUnique({
          where: { id: oldLineId },
          include: {
            operators: {
              include: {
                user: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        });

        if (oldLine && oldLine.lineStatus !== 'ban') {
          // Atualizar status da linha para 'ban'
          await this.prisma.linesStock.update({
            where: { id: oldLineId },
            data: { lineStatus: 'ban' },
          });

          this.logger.warn(
            `Linha ${oldLine.phone} marcada como banida`,
            'LineAssignment',
            { lineId: oldLineId, operatorsCount: oldLine.operators.length },
          );

          // Desvincular TODOS os operadores dessa linha
          const operatorIds = oldLine.operators.map(op => op.userId);
          await this.prisma.lineOperator.deleteMany({
            where: {
              lineId: oldLineId,
            },
          });

          // Atualizar campo 'line' de todos os operadores vinculados para null
          await this.prisma.user.updateMany({
            where: {
              id: { in: operatorIds },
            },
            data: { line: null },
          });

          this.logger.log(
            `Todos os operadores desvinculados da linha banida ${oldLine.phone}`,
            'LineAssignment',
            { lineId: oldLineId, operatorIds },
          );
        }
      } else if (oldLineId) {
        // Se não é para marcar como banida, apenas remover o operador atual
        await this.prisma.lineOperator.deleteMany({
          where: {
            userId,
            lineId: oldLineId,
          },
        });

        await this.prisma.user.update({
          where: { id: userId },
          data: { line: null },
        });
      }

      // Buscar nova linha disponível EXCLUINDO a linha antiga
      return await this.findAvailableLineForOperator(userId, userSegment, traceId, oldLineId);
    } catch (error: any) {
      this.logger.error(
        `Erro ao realocar linha para operador ${userId}`,
        error.stack,
        'LineAssignment',
        { userId, oldLineId, error: error.message, traceId },
      );
      return { success: false, reason: error.message };
    }
  }
}

