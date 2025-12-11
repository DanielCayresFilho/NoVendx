import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportFilterDto } from './dto/report-filter.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /**
   * RELATÓRIOS FUNDAMENTAIS
   */

  @Get('op-sintetico')
  @Roles('admin', 'supervisor')
  async getOpSinteticoReport(@Query() filters: ReportFilterDto) {
    return this.reportsService.getOpSinteticoReport(filters);
  }

  @Get('kpi')
  @Roles('admin', 'supervisor')
  async getKpiReport(@Query() filters: ReportFilterDto) {
    return this.reportsService.getKpiReport(filters);
  }

  @Get('hsm')
  @Roles('admin', 'supervisor')
  async getHsmReport(@Query() filters: ReportFilterDto) {
    return this.reportsService.getHsmReport(filters);
  }

  @Get('line-status')
  @Roles('admin', 'supervisor')
  async getLineStatusReport(@Query() filters: ReportFilterDto) {
    return this.reportsService.getLineStatusReport(filters);
  }

  /**
   * RELATÓRIOS BANCO DE DADOS
   */

  @Get('envios')
  @Roles('admin', 'supervisor')
  async getEnviosReport(@Query() filters: ReportFilterDto) {
    return this.reportsService.getEnviosReport(filters);
  }

  @Get('indicadores')
  @Roles('admin', 'supervisor')
  async getIndicadoresReport(@Query() filters: ReportFilterDto) {
    return this.reportsService.getIndicadoresReport(filters);
  }

  @Get('tempos')
  @Roles('admin', 'supervisor')
  async getTemposReport(@Query() filters: ReportFilterDto) {
    return this.reportsService.getTemposReport(filters);
  }

  /**
   * RELATÓRIO CONSOLIDADO
   * Retorna todos os relatórios de uma vez
   */
  @Get('consolidado')
  @Roles('admin', 'supervisor')
  async getConsolidatedReport(@Query() filters: ReportFilterDto) {
    const [opSintetico, kpi, hsm, lineStatus, envios, indicadores, tempos] = await Promise.all([
      this.reportsService.getOpSinteticoReport(filters),
      this.reportsService.getKpiReport(filters),
      this.reportsService.getHsmReport(filters),
      this.reportsService.getLineStatusReport(filters),
      this.reportsService.getEnviosReport(filters),
      this.reportsService.getIndicadoresReport(filters),
      this.reportsService.getTemposReport(filters),
    ]);

    return {
      periodo: {
        inicio: filters.startDate || 'Início',
        fim: filters.endDate || 'Atual',
      },
      segmento: filters.segment || 'Todos',
      relatorios: {
        opSintetico,
        kpi,
        hsm,
        lineStatus,
        envios,
        indicadores,
        tempos,
      },
    };
  }
}

