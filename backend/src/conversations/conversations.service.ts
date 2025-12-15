import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';

@Injectable()
export class ConversationsService {
  constructor(private prisma: PrismaService) {}

  async create(createConversationDto: CreateConversationDto) {
    return this.prisma.conversation.create({
      data: {
        ...createConversationDto,
        datetime: new Date(),
      },
    });
  }

  async findAll(filters?: any) {
    // Remover campos inválidos que não existem no schema
    const { search, ...validFilters } = filters || {};
    
    // Se houver busca por texto, aplicar filtros
    const where = search 
      ? {
          ...validFilters,
          OR: [
            { contactName: { contains: search, mode: 'insensitive' } },
            { contactPhone: { contains: search } },
            { message: { contains: search, mode: 'insensitive' } },
          ],
        }
      : validFilters;

    return this.prisma.conversation.findMany({
      where,
      orderBy: {
        datetime: 'desc',
      },
    });
  }

  async findByContactPhone(contactPhone: string, tabulated: boolean = false, userLine?: number) {
    const where: any = {
      contactPhone,
      tabulation: tabulated ? { not: null } : null,
    };

    // Se for operador, filtrar apenas conversas da sua linha
    if (userLine) {
      where.userLine = userLine;
    }

    return this.prisma.conversation.findMany({
      where,
      orderBy: {
        datetime: 'asc',
      },
    });
  }

  async findActiveConversations(userLine?: number, userName?: string) {
    const where: any = {
      tabulation: null,
    };

    if (userLine) {
      where.userLine = userLine;
    }

    // Se for operador, garantir que só veja suas próprias mensagens (sender=contact ou userName do operador)
    if (userName) {
      where.OR = [
        { sender: 'contact' },
        { userName },
      ];
    }

    // Retornar TODAS as mensagens não tabuladas (o frontend vai agrupar)
    const conversations = await this.prisma.conversation.findMany({
      where,
      orderBy: {
        datetime: 'asc', // Ordem cronológica para histórico
      },
    });

    return conversations;
  }

  async findOne(id: number) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversa com ID ${id} não encontrada`);
    }

    return conversation;
  }

  async update(id: number, updateConversationDto: UpdateConversationDto) {
    await this.findOne(id);

    return this.prisma.conversation.update({
      where: { id },
      data: updateConversationDto,
    });
  }

  async tabulateConversation(contactPhone: string, tabulationId: number) {
    // Atualizar todas as mensagens daquele contactPhone que ainda não foram tabuladas
    return this.prisma.conversation.updateMany({
      where: {
        contactPhone,
        tabulation: null,
      },
      data: {
        tabulation: tabulationId,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.conversation.delete({
      where: { id },
    });
  }

  async getConversationsBySegment(segment: number, tabulated: boolean = false) {
    return this.prisma.conversation.findMany({
      where: {
        segment,
        tabulation: tabulated ? { not: null } : null,
      },
      orderBy: {
        datetime: 'desc',
      },
    });
  }
}
