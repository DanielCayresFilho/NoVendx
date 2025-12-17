import { Controller, Get, Header } from '@nestjs/common';
import { PrometheusService } from './prometheus.service';

@Controller('metrics')
export class PrometheusController {
  constructor(private prometheusService: PrometheusService) {}

  @Get()
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  async getMetrics() {
    const metrics = await this.prometheusService.getMetrics();
    return metrics;
  }
}

