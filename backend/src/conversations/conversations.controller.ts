import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { TabulateConversationDto } from './dto/tabulate-conversation.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma.service';

@Controller('conversations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ConversationsController {
  constructor(
    private readonly conversationsService: ConversationsService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @Roles(Role.admin, Role.supervisor, Role.operator)
  create(@Body() createConversationDto: CreateConversationDto) {
    console.log('📝 [POST /conversations] Criando conversa:', JSON.stringify(createConversationDto, null, 2));
    return this.conversationsService.create(createConversationDto);
  }

  @Get()
  @Roles(Role.admin, Role.supervisor, Role.operator, Role.digital)
  findAll(@Query() filters: any, @CurrentUser() user: any) {
    const where: any = { ...filters };

    // Aplicar filtros baseados no papel do usuário
    if (user.role === Role.operator) {
      // IMPORTANTE: Operador vê conversas apenas por userId (não por userLine)
      // Isso permite que as conversas continuem aparecendo mesmo se a linha foi banida
      where.userId = user.id; // Filtrar apenas conversas atribuídas a ele
    } else if (user.role === Role.supervisor && user.segment) {
      // Supervisor só vê conversas do seu segmento
      where.segment = user.segment;
    }
    // Admin e digital não têm filtro - veem todas as conversas

    return this.conversationsService.findAll(where);
  }

  @Get('active')
  @Roles(Role.admin, Role.supervisor, Role.operator, Role.digital)
  async getActiveConversations(@CurrentUser() user: any) {
    console.log(`📋 [GET /conversations/active] Usuário: ${user.name} (${user.role}), line: ${user.line}, segment: ${user.segment}`);

    // Admin e digital veem TODAS as conversas ativas (sem filtro)
    if (user.role === Role.admin || user.role === Role.digital) {
      return this.conversationsService.findAll({ tabulation: null });
    }
    // Supervisor vê apenas conversas ativas do seu segmento
    if (user.role === Role.supervisor) {
      return this.conversationsService.findAll({ segment: user.segment, tabulation: null });
    }
    // Operador: buscar linha atual (pode estar em LineOperator ou no campo legacy)
    let currentLineId = user.line;
    if (!currentLineId) {
      const lineOperator = await this.prisma.lineOperator.findFirst({
        where: { userId: user.id },
        select: { lineId: true },
      });
      currentLineId = lineOperator?.lineId || null;
    }

    // Se não tem linha, retornar apenas conversas do próprio operador
    if (!currentLineId) {
      console.log(`📋 [GET /conversations/active] Operador ${user.name} não tem linha - retornando apenas suas conversas`);
      return this.conversationsService.findActiveConversations(undefined, user.id);
    }

    // MODO COMPARTILHADO: Buscar todos os operadores da mesma linha
    const lineOperators = await this.prisma.lineOperator.findMany({
      where: { lineId: currentLineId },
      select: { userId: true },
    });

    const userIds = lineOperators.map(lo => lo.userId);
    console.log(`📋 [GET /conversations/active] Operador ${user.name} está na linha ${currentLineId} com ${userIds.length} operador(es) - retornando conversas de todos`);

    // Retornar conversas de TODOS os operadores da linha compartilhada
    return this.conversationsService.findActiveConversationsByUserIds(userIds);
  }

  @Get('tabulated')
  @Roles(Role.admin, Role.supervisor, Role.operator, Role.digital)
  async getTabulatedConversations(@CurrentUser() user: any) {
    console.log(`📋 [GET /conversations/tabulated] Usuário: ${user.name} (${user.role}), line: ${user.line}, segment: ${user.segment}`);

    // Admin e digital veem TODAS as conversas tabuladas (sem filtro)
    if (user.role === Role.admin || user.role === Role.digital) {
      return this.conversationsService.findAll({ tabulation: { not: null } });
    }
    // Supervisor vê apenas conversas tabuladas do seu segmento
    if (user.role === Role.supervisor) {
      return this.conversationsService.findAll({ segment: user.segment, tabulation: { not: null } });
    }
    // Operador: buscar linha atual (pode estar em LineOperator ou no campo legacy)
    let currentLineId = user.line;
    if (!currentLineId) {
      const lineOperator = await this.prisma.lineOperator.findFirst({
        where: { userId: user.id },
        select: { lineId: true },
      });
      currentLineId = lineOperator?.lineId || null;
    }

    // Se não tem linha, retornar apenas conversas do próprio operador
    if (!currentLineId) {
      console.log(`📋 [GET /conversations/tabulated] Operador ${user.name} não tem linha - retornando apenas suas conversas`);
      return this.conversationsService.findTabulatedConversations(undefined, user.id);
    }

    // MODO COMPARTILHADO: Buscar todos os operadores da mesma linha
    const lineOperators = await this.prisma.lineOperator.findMany({
      where: { lineId: currentLineId },
      select: { userId: true },
    });

    const userIds = lineOperators.map(lo => lo.userId);
    console.log(`📋 [GET /conversations/tabulated] Operador ${user.name} está na linha ${currentLineId} com ${userIds.length} operador(es) - retornando conversas de todos`);

    // Retornar conversas de TODOS os operadores da linha compartilhada
    return this.conversationsService.findTabulatedConversationsByUserIds(userIds);
  }

  @Get('segment/:segment')
  @Roles(Role.supervisor, Role.admin, Role.digital)
  getBySegment(
    @Param('segment') segment: string,
    @Query('tabulated') tabulated?: string,
  ) {
    return this.conversationsService.getConversationsBySegment(
      +segment,
      tabulated === 'true',
    );
  }

  @Get('contact/:phone')
  @Roles(Role.admin, Role.supervisor, Role.operator, Role.digital)
  getByContactPhone(
    @Param('phone') phone: string,
    @Query('tabulated') tabulated?: string,
    @CurrentUser() user?: any,
  ) {
    // Admin e Supervisor podem ver qualquer contato
    // Operador só pode ver contatos que tem conversas com ele (por userId, não por linha)
    // IMPORTANTE: Não filtrar por userLine para que conversas de linhas banidas continuem aparecendo
    if (user?.role === Role.operator) {
      return this.conversationsService.findByContactPhone(phone, tabulated === 'true', user.id);
    }
    return this.conversationsService.findByContactPhone(
      phone,
      tabulated === 'true',
    );
  }

  @Get(':id')
  @Roles(Role.admin, Role.supervisor, Role.operator, Role.digital)
  findOne(@Param('id') id: string) {
    return this.conversationsService.findOne(+id);
  }

  @Patch(':id')
  @Roles(Role.admin, Role.supervisor, Role.operator, Role.digital)
  update(@Param('id') id: string, @Body() updateConversationDto: UpdateConversationDto) {
    return this.conversationsService.update(+id, updateConversationDto);
  }

  @Post('tabulate/:phone')
  @Roles(Role.operator)
  tabulate(
    @Param('phone') phone: string,
    @Body() tabulateDto: TabulateConversationDto,
  ) {
    return this.conversationsService.tabulateConversation(phone, tabulateDto.tabulationId);
  }

  @Post('recall/:phone')
  @Roles(Role.operator)
  async recallContact(
    @Param('phone') phone: string,
    @CurrentUser() user: any,
  ) {
    console.log(`📞 [POST /conversations/recall/:phone] Operador ${user.name} rechamando contato ${phone}`);
    
    // Buscar linha atual do operador (pode estar na tabela LineOperator ou no campo legacy)
    let userLine = user.line;
    
    // Se não tiver no campo legacy, buscar na tabela LineOperator
    if (!userLine) {
      const lineOperator = await this.prisma.lineOperator.findFirst({
        where: { userId: user.id },
        select: { lineId: true },
      });
      userLine = lineOperator?.lineId || null;
    }
    
    return this.conversationsService.recallContact(phone, user.id, userLine);
  }

  @Delete(':id')
  @Roles(Role.admin, Role.supervisor)
  remove(@Param('id') id: string) {
    return this.conversationsService.remove(+id);
  }
}
