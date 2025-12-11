import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ReportFilterDto } from './dto/report-filter.dto';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Helper: Formatar data como YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Helper: Formatar hora como HH:MM:SS
   */
  private formatTime(date: Date): string {
    return date.toISOString().split('T')[1].split('.')[0];
  }

  /**
   * OP SINTÉTICO
   * Estrutura: Segmento, Data, Hora, Qtd. Total Mensagens, Qtd. Total Entrantes, 
   * Qtd. Promessas, Conversão, Tempo Médio Transbordo, Tempo Médio Espera Total, 
   * Tempo Médio Atendimento, Tempo Médio Resposta
   */
  async getOpSinteticoReport(filters: ReportFilterDto) {
    const whereClause: any = {};

    if (filters.segment) {
      whereClause.segment = filters.segment;
    }

    if (filters.startDate || filters.endDate) {
      whereClause.datetime = {};
      if (filters.startDate) {
        whereClause.datetime.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        whereClause.datetime.lte = new Date(filters.endDate);
      }
    }

    const conversations = await this.prisma.conversation.findMany({
      where: whereClause,
      orderBy: { datetime: 'asc' },
    });

    const segments = await this.prisma.segment.findMany();
    const segmentMap = new Map(segments.map(s => [s.id, s]));

    const tabulations = await this.prisma.tabulation.findMany();
    const tabulationMap = new Map(tabulations.map(t => [t.id, t]));

    // Agrupar por segmento e data
    const grouped: Record<string, Record<string, any>> = {};

    conversations.forEach(conv => {
      const segmentName = conv.segment ? segmentMap.get(conv.segment)?.name || 'Sem Segmento' : 'Sem Segmento';
      const date = this.formatDate(conv.datetime);

      const key = `${segmentName}|${date}`;
      if (!grouped[key]) {
        grouped[key] = {
          segment: segmentName,
          date,
          totalMensagens: 0,
          entrantes: 0,
          promessas: 0,
          tempos: [],
        };
      }

      grouped[key].totalMensagens++;
      
      if (conv.sender === 'contact') {
        grouped[key].entrantes++;
      }

      // Verificar se é promessa (tabulação CPC)
      if (conv.tabulation) {
        const tabulation = tabulationMap.get(conv.tabulation);
        if (tabulation?.isCPC) {
          grouped[key].promessas++;
        }
      }
    });

    const result = Object.values(grouped).map((item: any) => ({
      Segmento: item.segment,
      Data: item.date,
      Hora: null, // Agregado por dia, não por hora específica
      'Qtd. Total Mensagens': item.totalMensagens,
      'Qtd. Total Entrantes': item.entrantes,
      'Qtd. Promessas': item.promessas,
      Conversão: item.totalMensagens > 0 
        ? `${((item.promessas / item.totalMensagens) * 100).toFixed(2)}%`
        : '0%',
      'Tempo Médio Transbordo': null,
      'Tempo Médio Espera Total': null,
      'Tempo Médio Atendimento': null,
      'Tempo Médio Resposta': null,
    }));

    return result;
  }

  /**
   * RELATÓRIO KPI
   * Estrutura: Data Evento, Descrição Evento, Tipo de Evento, Evento Finalizador, 
   * Contato, Identificação, Código Contato, Hashtag, Usuário, Número Protocolo, 
   * Data Hora Geração Protocolo, Observação, SMS Principal, Whatsapp Principal, 
   * Email Principal, Canal, Carteiras, Carteira do Evento, Valor da oportunidade, 
   * Identificador da chamada de Voz
   */
  async getKpiReport(filters: ReportFilterDto) {
    const whereClause: any = {
      tabulation: { not: null },
    };

    if (filters.segment) {
      whereClause.segment = filters.segment;
    }

    if (filters.startDate || filters.endDate) {
      whereClause.datetime = {};
      if (filters.startDate) {
        whereClause.datetime.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        whereClause.datetime.lte = new Date(filters.endDate);
      }
    }

    const conversations = await this.prisma.conversation.findMany({
      where: whereClause,
      orderBy: { datetime: 'desc' },
    });

    const tabulations = await this.prisma.tabulation.findMany();
    const tabulationMap = new Map(tabulations.map(t => [t.id, t]));

    const segments = await this.prisma.segment.findMany();
    const segmentMap = new Map(segments.map(s => [s.id, s]));

    const contacts = await this.prisma.contact.findMany();
    const contactMap = new Map(contacts.map(c => [c.phone, c]));

    const result = conversations.map(conv => {
      const tabulation = conv.tabulation ? tabulationMap.get(conv.tabulation) : null;
      const segment = conv.segment ? segmentMap.get(conv.segment) : null;
      const contact = contactMap.get(conv.contactPhone);

      return {
        'Data Evento': this.formatDate(conv.datetime),
        'Descrição Evento': tabulation?.name || 'Sem Tabulação',
        'Tipo de Evento': tabulation?.isCPC ? 'CPC' : 'Atendimento',
        'Evento Finalizador': tabulation ? 'Sim' : 'Não',
        Contato: conv.contactName,
        Identificação: contact?.cpf || null,
        'Código Contato': contact?.id || null,
        Hashtag: null,
        Usuário: conv.userName || null,
        'Número Protocolo': null,
        'Data Hora Geração Protocolo': null,
        Observação: conv.message,
        'SMS Principal': null,
        'Whatsapp Principal': conv.contactPhone,
        'Email Principal': null,
        Canal: 'WhatsApp',
        Carteiras: segment?.name || null,
        'Carteira do Evento': segment?.name || null,
        'Valor da oportunidade': null,
        'Identificador da chamada de Voz': null,
      };
    });

    return result;
  }

  /**
   * RELATÓRIO HSM
   * Estrutura: Contato, Identificador, Código, Hashtag, Template, WhatsApp do contato, 
   * Solicitação envio, Envio, Confirmação, Leitura (se habilitado), Falha entrega, 
   * Motivo falha, WhatsApp de saida, Usuário Solicitante, Carteira, Teve retorno
   */
  async getHsmReport(filters: ReportFilterDto) {
    const whereClause: any = {};

    if (filters.segment) {
      whereClause.contactSegment = filters.segment;
    }

    if (filters.startDate || filters.endDate) {
      whereClause.dateTime = {};
      if (filters.startDate) {
        whereClause.dateTime.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        whereClause.dateTime.lte = new Date(filters.endDate);
      }
    }

    const campaigns = await this.prisma.campaign.findMany({
      where: whereClause,
      orderBy: { dateTime: 'desc' },
    });

    const segments = await this.prisma.segment.findMany();
    const segmentMap = new Map(segments.map(s => [s.id, s]));

    const contacts = await this.prisma.contact.findMany();
    const contactMap = new Map(contacts.map(c => [c.phone, c]));

    const lines = await this.prisma.linesStock.findMany();
    const lineMap = new Map(lines.map(l => [l.id, l]));

    const result = campaigns.map(campaign => {
      const contact = contactMap.get(campaign.contactPhone);
      const segment = campaign.contactSegment ? segmentMap.get(campaign.contactSegment) : null;
      const line = campaign.lineReceptor ? lineMap.get(campaign.lineReceptor) : null;

      return {
        Contato: campaign.contactName,
        Identificador: contact?.cpf || null,
        Código: contact?.id || null,
        Hashtag: null,
        Template: campaign.name,
        'WhatsApp do contato': campaign.contactPhone,
        'Solicitação envio': this.formatDate(campaign.createdAt),
        Envio: this.formatDate(campaign.dateTime),
        Confirmação: campaign.response ? 'Sim' : 'Não',
        'Leitura (se habilitado)': null,
        'Falha entrega': campaign.retryCount > 0 ? 'Sim' : 'Não',
        'Motivo falha': null,
        'WhatsApp de saida': line?.phone || null,
        'Usuário Solicitante': null,
        Carteira: segment?.name || null,
        'Teve retorno': campaign.response ? 'Sim' : 'Não',
      };
    });

    return result;
  }

  /**
   * RELATÓRIO STATUS DE LINHA
   * Estrutura: Data, Numero, Business, QualityScore, Tier, Segmento
   */
  async getLineStatusReport(filters: ReportFilterDto) {
    const whereClause: any = {};

    if (filters.segment) {
      whereClause.segment = filters.segment;
    }

    const lines = await this.prisma.linesStock.findMany({
      where: whereClause,
      orderBy: { updatedAt: 'desc' },
    });

    const segments = await this.prisma.segment.findMany();
    const segmentMap = new Map(segments.map(s => [s.id, s]));

    const result = lines.map(line => {
      const segment = line.segment ? segmentMap.get(line.segment) : null;

      return {
        Data: this.formatDate(line.updatedAt),
        Numero: line.phone,
        Business: line.businessID || null,
        QualityScore: null,
        Tier: null,
        Segmento: segment?.name || null,
      };
    });

    return result;
  }

  /**
   * RELATÓRIO DE ENVIOS
   * Estrutura: data_envio, hora_envio, fornecedor_envio, codigo_carteira, nome_carteira, 
   * segmento_carteira, numero_contrato, cpf_cliente, telefone_cliente, status_envio, 
   * numero_saida, login_usuario, template_envio, coringa_1, coringa_2, coringa_3, 
   * coringa_4, tipo_envio
   */
  async getEnviosReport(filters: ReportFilterDto) {
    const whereClause: any = {};

    if (filters.segment) {
      whereClause.contactSegment = filters.segment;
    }

    if (filters.startDate || filters.endDate) {
      whereClause.dateTime = {};
      if (filters.startDate) {
        whereClause.dateTime.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        whereClause.dateTime.lte = new Date(filters.endDate);
      }
    }

    // Buscar campanhas (envios massivos)
    const campaigns = await this.prisma.campaign.findMany({
      where: whereClause,
      orderBy: { dateTime: 'desc' },
    });

    // Buscar conversas de operadores (envios 1:1)
    const conversationWhere: any = {
      sender: 'operator',
    };
    if (filters.segment) {
      conversationWhere.segment = filters.segment;
    }
    if (filters.startDate || filters.endDate) {
      conversationWhere.datetime = {};
      if (filters.startDate) {
        conversationWhere.datetime.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        conversationWhere.datetime.lte = new Date(filters.endDate);
      }
    }

    const conversations = await this.prisma.conversation.findMany({
      where: conversationWhere,
      orderBy: { datetime: 'desc' },
    });

    const segments = await this.prisma.segment.findMany();
    const segmentMap = new Map(segments.map(s => [s.id, s]));

    const contacts = await this.prisma.contact.findMany();
    const contactMap = new Map(contacts.map(c => [c.phone, c]));

    const lines = await this.prisma.linesStock.findMany();
    const lineMap = new Map(lines.map(l => [l.id, l]));

    const result: any[] = [];

    // Processar campanhas (massivos)
    campaigns.forEach(campaign => {
      const contact = contactMap.get(campaign.contactPhone);
      const segment = campaign.contactSegment ? segmentMap.get(campaign.contactSegment) : null;
      const line = campaign.lineReceptor ? lineMap.get(campaign.lineReceptor) : null;

      result.push({
        data_envio: this.formatDate(campaign.dateTime),
        hora_envio: this.formatTime(campaign.dateTime),
        fornecedor_envio: line?.evolutionName || null,
        codigo_carteira: segment?.id || null,
        nome_carteira: segment?.name || null,
        segmento_carteira: segment?.name || null,
        numero_contrato: contact?.contract || null,
        cpf_cliente: contact?.cpf || null,
        telefone_cliente: campaign.contactPhone,
        status_envio: campaign.response ? 'Entregue' : 'Pendente',
        numero_saida: line?.phone || null,
        login_usuario: null,
        template_envio: campaign.name,
        coringa_1: null,
        coringa_2: null,
        coringa_3: null,
        coringa_4: null,
        tipo_envio: 'Massivo',
      });
    });

    // Processar conversas 1:1
    conversations.forEach(conv => {
      const contact = contactMap.get(conv.contactPhone);
      const segment = conv.segment ? segmentMap.get(conv.segment) : null;
      const line = conv.userLine ? lineMap.get(conv.userLine) : null;

      result.push({
        data_envio: this.formatDate(conv.datetime),
        hora_envio: this.formatTime(conv.datetime),
        fornecedor_envio: line?.evolutionName || null,
        codigo_carteira: segment?.id || null,
        nome_carteira: segment?.name || null,
        segmento_carteira: segment?.name || null,
        numero_contrato: contact?.contract || null,
        cpf_cliente: contact?.cpf || null,
        telefone_cliente: conv.contactPhone,
        status_envio: 'Enviado',
        numero_saida: line?.phone || null,
        login_usuario: conv.userName || null,
        template_envio: null,
        coringa_1: null,
        coringa_2: null,
        coringa_3: null,
        coringa_4: null,
        tipo_envio: '1:1',
      });
    });

    // Ordenar por data/hora descendente
    result.sort((a, b) => {
      const dateA = `${a.data_envio} ${a.hora_envio}`;
      const dateB = `${b.data_envio} ${b.hora_envio}`;
      return dateB.localeCompare(dateA);
    });

    return result;
  }

  /**
   * RELATÓRIO DE INDICADORES
   * Estrutura: data, data_envio, inicio_atendimento, fim_atendimento, tma, tipo_atendimento, 
   * fornecedor, codigo_carteira, carteira, segmento, contrato, cpf, telefone, status, 
   * login, evento, evento_normalizado, envio, falha, entregue, lido, cpc, cpc_produtivo, 
   * boleto, valor, transbordo, primeira_opcao_oferta, segunda_via, nota_nps, obs_nps, 
   * erro_api, abandono, protocolo
   */
  async getIndicadoresReport(filters: ReportFilterDto) {
    const whereClause: any = {};

    if (filters.segment) {
      whereClause.segment = filters.segment;
    }

    if (filters.startDate || filters.endDate) {
      whereClause.datetime = {};
      if (filters.startDate) {
        whereClause.datetime.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        whereClause.datetime.lte = new Date(filters.endDate);
      }
    }

    const conversations = await this.prisma.conversation.findMany({
      where: whereClause,
      orderBy: { datetime: 'asc' },
    });

    const tabulations = await this.prisma.tabulation.findMany();
    const tabulationMap = new Map(tabulations.map(t => [t.id, t]));

    const segments = await this.prisma.segment.findMany();
    const segmentMap = new Map(segments.map(s => [s.id, s]));

    const contacts = await this.prisma.contact.findMany();
    const contactMap = new Map(contacts.map(c => [c.phone, c]));

    const lines = await this.prisma.linesStock.findMany();
    const lineMap = new Map(lines.map(l => [l.id, l]));

    // Agrupar conversas por contato para calcular TMA
    const contactConvs: Record<string, any[]> = {};
    conversations.forEach(conv => {
      if (!contactConvs[conv.contactPhone]) {
        contactConvs[conv.contactPhone] = [];
      }
      contactConvs[conv.contactPhone].push(conv);
    });

    const result: any[] = [];

    Object.entries(contactConvs).forEach(([phone, convs]) => {
      const firstConv = convs[0];
      const lastConv = convs[convs.length - 1];
      const contact = contactMap.get(phone);
      const segment = firstConv.segment ? segmentMap.get(firstConv.segment) : null;
      const line = firstConv.userLine ? lineMap.get(firstConv.userLine) : null;
      const tabulation = lastConv.tabulation ? tabulationMap.get(lastConv.tabulation) : null;

      // Calcular TMA (tempo médio de atendimento em minutos)
      const tma = convs.length > 1
        ? Math.round((lastConv.datetime.getTime() - firstConv.datetime.getTime()) / 1000 / 60)
        : 0;

      result.push({
        data: this.formatDate(firstConv.datetime),
        data_envio: this.formatDate(firstConv.datetime),
        inicio_atendimento: this.formatTime(firstConv.datetime),
        fim_atendimento: this.formatTime(lastConv.datetime),
        tma: tma.toString(),
        tipo_atendimento: firstConv.sender === 'operator' ? '1:1' : 'Receptivo',
        fornecedor: line?.evolutionName || null,
        codigo_carteira: segment?.id || null,
        carteira: segment?.name || null,
        segmento: segment?.name || null,
        contrato: contact?.contract || null,
        cpf: contact?.cpf || null,
        telefone: phone,
        status: tabulation ? 'Finalizado' : 'Em Andamento',
        login: firstConv.userName || null,
        evento: tabulation?.name || null,
        evento_normalizado: tabulation?.name || null,
        envio: 'Sim',
        falha: 'Não',
        entregue: 'Sim',
        lido: null,
        cpc: tabulation?.isCPC ? 'Sim' : 'Não',
        cpc_produtivo: tabulation?.isCPC ? 'Sim' : 'Não',
        boleto: tabulation?.isCPC ? 'Sim' : 'Não',
        valor: null,
        transbordo: null,
        primeira_opcao_oferta: null,
        segunda_via: null,
        nota_nps: null,
        obs_nps: null,
        erro_api: null,
        abandono: !tabulation ? 'Sim' : 'Não',
        protocolo: null,
      });
    });

    return result;
  }

  /**
   * RELATÓRIO DE TEMPOS
   * Estrutura: data, hora, fornecedor, codigo_carteira, carteira, segmento, contrato, 
   * cpf, telefone, login, evento, evento_normalizado, tma, tmc, tmpro, tmf, tmrc, 
   * tmro, protocolo
   */
  async getTemposReport(filters: ReportFilterDto) {
    const whereClause: any = {};

    if (filters.segment) {
      whereClause.segment = filters.segment;
    }

    if (filters.startDate || filters.endDate) {
      whereClause.datetime = {};
      if (filters.startDate) {
        whereClause.datetime.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        whereClause.datetime.lte = new Date(filters.endDate);
      }
    }

    const conversations = await this.prisma.conversation.findMany({
      where: whereClause,
      orderBy: [
        { contactPhone: 'asc' },
        { datetime: 'asc' },
      ],
    });

    const tabulations = await this.prisma.tabulation.findMany();
    const tabulationMap = new Map(tabulations.map(t => [t.id, t]));

    const segments = await this.prisma.segment.findMany();
    const segmentMap = new Map(segments.map(s => [s.id, s]));

    const contacts = await this.prisma.contact.findMany();
    const contactMap = new Map(contacts.map(c => [c.phone, c]));

    const lines = await this.prisma.linesStock.findMany();
    const lineMap = new Map(lines.map(l => [l.id, l]));

    // Agrupar por contato
    const contactConvs: Record<string, any[]> = {};
    conversations.forEach(conv => {
      if (!contactConvs[conv.contactPhone]) {
        contactConvs[conv.contactPhone] = [];
      }
      contactConvs[conv.contactPhone].push(conv);
    });

    const result: any[] = [];

    Object.entries(contactConvs).forEach(([phone, convs]) => {
      if (convs.length < 2) return; // Precisa de pelo menos 2 mensagens

      const firstConv = convs[0];
      const lastConv = convs[convs.length - 1];
      const contact = contactMap.get(phone);
      const segment = firstConv.segment ? segmentMap.get(firstConv.segment) : null;
      const line = firstConv.userLine ? lineMap.get(firstConv.userLine) : null;
      const tabulation = lastConv.tabulation ? tabulationMap.get(lastConv.tabulation) : null;

      // Calcular tempos em minutos
      const tma = Math.round((lastConv.datetime.getTime() - firstConv.datetime.getTime()) / 1000 / 60);

      result.push({
        data: this.formatDate(firstConv.datetime),
        hora: this.formatTime(firstConv.datetime),
        fornecedor: line?.evolutionName || null,
        codigo_carteira: segment?.id || null,
        carteira: segment?.name || null,
        segmento: segment?.name || null,
        contrato: contact?.contract || null,
        cpf: contact?.cpf || null,
        telefone: phone,
        login: firstConv.userName || null,
        evento: tabulation?.name || null,
        evento_normalizado: tabulation?.name || null,
        tma: tma.toString(),
        tmc: null, // Tempo médio de conversação
        tmpro: null, // Tempo médio de processamento
        tmf: null, // Tempo médio de fila
        tmrc: null, // Tempo médio de resposta do contato
        tmro: null, // Tempo médio de resposta do operador
        protocolo: null,
      });
    });

    return result;
  }
}
