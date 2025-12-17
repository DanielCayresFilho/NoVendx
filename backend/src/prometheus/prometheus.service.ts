import { Injectable } from '@nestjs/common';
import * as promClient from 'prom-client';

@Injectable()
export class PrometheusService {
  private readonly register: promClient.Registry;
  
  // Contadores
  public readonly messagesSentCounter: promClient.Counter<string>;
  public readonly messagesReceivedCounter: promClient.Counter<string>;
  public readonly errorsCounter: promClient.Counter<string>;
  public readonly lineAssignmentsCounter: promClient.Counter<string>;
  
  // Gauges
  public readonly activeOperatorsGauge: promClient.Gauge<string>;
  public readonly activeLinesGauge: promClient.Gauge<string>;
  public readonly queueSizeGauge: promClient.Gauge<string>;
  
  // Histograms
  public readonly messageLatencyHistogram: promClient.Histogram<string>;
  public readonly apiLatencyHistogram: promClient.Histogram<string>;

  constructor() {
    this.register = new promClient.Registry();
    promClient.collectDefaultMetrics({ register: this.register });

    // Contadores
    this.messagesSentCounter = new promClient.Counter({
      name: 'messages_sent_total',
      help: 'Total de mensagens enviadas',
      labelNames: ['line_id', 'message_type', 'status'],
      registers: [this.register],
    });

    this.messagesReceivedCounter = new promClient.Counter({
      name: 'messages_received_total',
      help: 'Total de mensagens recebidas',
      labelNames: ['line_id'],
      registers: [this.register],
    });

    this.errorsCounter = new promClient.Counter({
      name: 'errors_total',
      help: 'Total de erros',
      labelNames: ['type', 'module', 'severity'],
      registers: [this.register],
    });

    this.lineAssignmentsCounter = new promClient.Counter({
      name: 'line_assignments_total',
      help: 'Total de atribuições de linha',
      labelNames: ['segment', 'status'],
      registers: [this.register],
    });

    // Gauges
    this.activeOperatorsGauge = new promClient.Gauge({
      name: 'active_operators',
      help: 'Número de operadores ativos',
      labelNames: ['segment'],
      registers: [this.register],
    });

    this.activeLinesGauge = new promClient.Gauge({
      name: 'active_lines',
      help: 'Número de linhas ativas',
      labelNames: ['status', 'segment'],
      registers: [this.register],
    });

    this.queueSizeGauge = new promClient.Gauge({
      name: 'message_queue_size',
      help: 'Tamanho da fila de mensagens',
      labelNames: ['status', 'segment'],
      registers: [this.register],
    });

    // Histograms
    this.messageLatencyHistogram = new promClient.Histogram({
      name: 'message_latency_seconds',
      help: 'Latência de envio de mensagens em segundos',
      labelNames: ['line_id', 'message_type'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
      registers: [this.register],
    });

    this.apiLatencyHistogram = new promClient.Histogram({
      name: 'api_latency_seconds',
      help: 'Latência de chamadas à Evolution API em segundos',
      labelNames: ['endpoint', 'method'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
      registers: [this.register],
    });
  }

  /**
   * Retorna métricas no formato Prometheus
   */
  async getMetrics(): Promise<string> {
    return this.register.metrics();
  }

  /**
   * Incrementa contador de mensagens enviadas
   */
  incrementMessagesSent(
    lineId: number,
    messageType: string,
    status: 'success' | 'error',
  ) {
    this.messagesSentCounter.inc({
      line_id: lineId.toString(),
      message_type: messageType,
      status,
    });
  }

  /**
   * Incrementa contador de mensagens recebidas
   */
  incrementMessagesReceived(lineId: number) {
    this.messagesReceivedCounter.inc({
      line_id: lineId.toString(),
    });
  }

  /**
   * Incrementa contador de erros
   */
  incrementErrors(type: string, module: string, severity: string) {
    this.errorsCounter.inc({
      type,
      module,
      severity,
    });
  }

  /**
   * Incrementa contador de atribuições de linha
   */
  incrementLineAssignments(segment: number | null, status: 'success' | 'error') {
    this.lineAssignmentsCounter.inc({
      segment: segment?.toString() || 'null',
      status,
    });
  }

  /**
   * Atualiza gauge de operadores ativos
   */
  setActiveOperators(count: number, segment?: number | null) {
    this.activeOperatorsGauge.set(
      { segment: segment?.toString() || 'all' },
      count,
    );
  }

  /**
   * Atualiza gauge de linhas ativas
   */
  setActiveLines(count: number, status: string, segment?: number | null) {
    this.activeLinesGauge.set(
      { status, segment: segment?.toString() || 'all' },
      count,
    );
  }

  /**
   * Atualiza gauge de tamanho da fila
   */
  setQueueSize(count: number, status: string, segment?: number | null) {
    this.queueSizeGauge.set(
      { status, segment: segment?.toString() || 'all' },
      count,
    );
  }

  /**
   * Registra latência de mensagem
   */
  recordMessageLatency(lineId: number, messageType: string, seconds: number) {
    this.messageLatencyHistogram.observe(
      { line_id: lineId.toString(), message_type: messageType },
      seconds,
    );
  }

  /**
   * Registra latência de API
   */
  recordApiLatency(endpoint: string, method: string, seconds: number) {
    this.apiLatencyHistogram.observe({ endpoint, method }, seconds);
  }
}

