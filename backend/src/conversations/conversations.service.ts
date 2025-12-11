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

  async findByContactPhone(contactPhone: string, tabulated: boolean = false) {
    return this.prisma.conversation.findMany({
      where: {
        contactPhone,
        tabulation: tabulated ? { not: null } : null,
      },
      orderBy: {
        datetime: 'asc',
      },
    });
  }

  async findActiveConversations(userLine?: number) {
    const where: any = {
      tabulation: null,
    };

    if (userLine) {
      where.userLine = userLine;
    }

    // Agrupar por contactPhone para pegar apenas a última mensagem de cada conversa
    const conversations = await this.prisma.conversation.findMany({
      where,
      orderBy: {
        datetime: 'desc',
      },
    });

    // Agrupar por contactPhone
    const grouped = conversations.reduce((acc, conv) => {
      if (!acc[conv.contactPhone]) {
        acc[conv.contactPhone] = conv;
      }
      return acc;
    }, {});

    return Object.values(grouped);
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
