import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { TabulateConversationDto } from './dto/tabulate-conversation.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('conversations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post()
  @Roles(Role.admin, Role.supervisor, Role.operator)
  create(@Body() createConversationDto: CreateConversationDto) {
    console.log('📝 [POST /conversations] Criando conversa:', JSON.stringify(createConversationDto, null, 2));
    return this.conversationsService.create(createConversationDto);
  }

  @Get()
  @Roles(Role.admin, Role.supervisor, Role.operator)
  findAll(@Query() filters: any, @CurrentUser() user: any) {
    const where: any = { ...filters };

    // Aplicar filtros baseados no papel do usuário
    if (user.role === Role.operator && user.line) {
      // Operador só vê conversas da sua linha
      where.userLine = user.line;
    } else if (user.role === Role.supervisor && user.segment) {
      // Supervisor só vê conversas do seu segmento
      where.segment = user.segment;
    }
    // Admin não tem filtro - vê todas as conversas

    return this.conversationsService.findAll(where);
  }

  @Get('active')
  @Roles(Role.admin, Role.supervisor, Role.operator)
  getActiveConversations(@CurrentUser() user: any) {
    console.log(`📋 [GET /conversations/active] Usuário: ${user.name} (${user.role}), line: ${user.line}, segment: ${user.segment}`);
    
    // Admin vê TODAS as conversas ativas (sem filtro)
    if (user.role === Role.admin) {
      return this.conversationsService.findAll({ tabulation: null });
    }
    // Supervisor vê apenas conversas ativas do seu segmento
    if (user.role === Role.supervisor) {
      return this.conversationsService.findAll({ segment: user.segment, tabulation: null });
    }
    // Operador: se não tiver linha atribuída, não retorna nada
    if (!user.line) {
      return [];
    }
    // Filtrar por linha e pelo operador (apenas mensagens dele ou do contato)
    return this.conversationsService.findActiveConversations(user.line, user.name);
  }

  @Get('segment/:segment')
  @Roles(Role.supervisor, Role.admin)
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
  @Roles(Role.admin, Role.supervisor, Role.operator)
  getByContactPhone(
    @Param('phone') phone: string,
    @Query('tabulated') tabulated?: string,
    @CurrentUser() user?: any,
  ) {
    // Admin e Supervisor podem ver qualquer contato
    // Operador só pode ver contatos da sua linha
    if (user?.role === Role.operator && user?.line) {
      // Verificar se o contato tem conversas na linha do operador
      return this.conversationsService.findByContactPhone(
        phone,
        tabulated === 'true',
        user.line, // Passar a linha como filtro adicional
      );
    }
    return this.conversationsService.findByContactPhone(
      phone,
      tabulated === 'true',
    );
  }

  @Get(':id')
  @Roles(Role.admin, Role.supervisor, Role.operator)
  findOne(@Param('id') id: string) {
    return this.conversationsService.findOne(+id);
  }

  @Patch(':id')
  @Roles(Role.admin, Role.supervisor, Role.operator)
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

  @Delete(':id')
  @Roles(Role.admin, Role.supervisor)
  remove(@Param('id') id: string) {
    return this.conversationsService.remove(+id);
  }
}
