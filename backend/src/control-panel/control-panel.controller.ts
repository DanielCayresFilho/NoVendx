import { Controller, Get, Post, Body, Param, Delete, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ControlPanelService } from './control-panel.service';
import { UpdateControlPanelDto, AddBlockPhraseDto, RemoveBlockPhraseDto } from './dto/control-panel.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('control-panel')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ControlPanelController {
  constructor(private readonly controlPanelService: ControlPanelService) {}

  // Buscar configurações (global ou por segmento)
  @Get()
  @Roles('admin', 'supervisor')
  async findOne(@Query('segmentId') segmentId?: string) {
    const segId = segmentId ? parseInt(segmentId, 10) : undefined;
    return this.controlPanelService.findOne(segId);
  }

  // Atualizar configurações
  @Post()
  @Roles('admin', 'supervisor')
  async upsert(@Body() dto: UpdateControlPanelDto) {
    return this.controlPanelService.upsert(dto);
  }

  // Adicionar frase de bloqueio
  @Post('block-phrases')
  @Roles('admin', 'supervisor')
  async addBlockPhrase(
    @Body() dto: AddBlockPhraseDto,
    @Query('segmentId') segmentId?: string,
  ) {
    const segId = segmentId ? parseInt(segmentId, 10) : undefined;
    return this.controlPanelService.addBlockPhrase(dto.phrase, segId);
  }

  // Remover frase de bloqueio
  @Delete('block-phrases')
  @Roles('admin', 'supervisor')
  async removeBlockPhrase(
    @Body() dto: RemoveBlockPhraseDto,
    @Query('segmentId') segmentId?: string,
  ) {
    const segId = segmentId ? parseInt(segmentId, 10) : undefined;
    return this.controlPanelService.removeBlockPhrase(dto.phrase, segId);
  }

  // Verificar se pode contatar CPC
  @Get('check-cpc/:phone')
  @Roles('admin', 'supervisor', 'operator')
  async checkCPC(
    @Param('phone') phone: string,
    @Query('segmentId') segmentId?: string,
  ) {
    const segId = segmentId ? parseInt(segmentId, 10) : undefined;
    return this.controlPanelService.canContactCPC(phone, segId);
  }

  // Verificar se pode reenviar
  @Get('check-resend/:phone')
  @Roles('admin', 'supervisor', 'operator')
  async checkResend(
    @Param('phone') phone: string,
    @Query('segmentId') segmentId?: string,
  ) {
    const segId = segmentId ? parseInt(segmentId, 10) : undefined;
    return this.controlPanelService.canResend(phone, segId);
  }

  // Marcar contato como CPC
  @Post('mark-cpc/:phone')
  @Roles('admin', 'supervisor', 'operator')
  async markAsCPC(
    @Param('phone') phone: string,
    @Body() body: { isCPC: boolean },
  ) {
    await this.controlPanelService.markAsCPC(phone, body.isCPC);
    return { success: true };
  }
}

