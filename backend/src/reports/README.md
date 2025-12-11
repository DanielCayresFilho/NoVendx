# Módulo de Relatórios

Este módulo fornece endpoints para geração de relatórios analíticos da plataforma com estruturas padronizadas conforme solicitação do cliente.

## RELATÓRIOS FUNDAMENTAIS

### 1. OP Sintético
**Endpoint:** `GET /reports/op-sintetico`

**Estrutura de Retorno:**
- Segmento
- Data
- Hora
- Qtd. Total Mensagens
- Qtd. Total Entrantes
- Qtd. Promessas
- Conversão
- Tempo Médio Transbordo
- Tempo Médio Espera Total
- Tempo Médio Atendimento
- Tempo Médio Resposta

**Filtros (Query Params):**
- `startDate` (opcional): Data inicial (formato: YYYY-MM-DD)
- `endDate` (opcional): Data final (formato: YYYY-MM-DD)
- `segment` (opcional): ID do segmento específico

### 2. KPI
**Endpoint:** `GET /reports/kpi`

Visão analítica de cada finalização dentro da plataforma.

**Estrutura de Retorno:**
- Data Evento
- Descrição Evento
- Tipo de Evento
- Evento Finalizador
- Contato
- Identificação
- Código Contato
- Hashtag
- Usuário
- Número Protocolo
- Data Hora Geração Protocolo
- Observação
- SMS Principal
- Whatsapp Principal
- Email Principal
- Canal
- Carteiras
- Carteira do Evento
- Valor da oportunidade
- Identificador da chamada de Voz

### 3. HSM (Disparos)
**Endpoint:** `GET /reports/hsm`

Visão analítica de cada disparo realizado dentro da plataforma.

**Estrutura de Retorno:**
- Contato
- Identificador
- Código
- Hashtag
- Template
- WhatsApp do contato
- Solicitação envio
- Envio
- Confirmação
- Leitura (se habilitado)
- Falha entrega
- Motivo falha
- WhatsApp de saida
- Usuário Solicitante
- Carteira
- Teve retorno

### 4. Status de Linha
**Endpoint:** `GET /reports/line-status`

Visão analítica dos status de cada linha.

**Estrutura de Retorno:**
- Data
- Numero
- Business
- QualityScore
- Tier
- Segmento

## RELATÓRIOS BANCO DE DADOS

### 5. Envios
**Endpoint:** `GET /reports/envios`

Apresenta uma visão consolidada de tudo que foi disparado (enviado) na plataforma, seja de forma massiva ou individual (1 a 1).

**Estrutura de Retorno:**
- data_envio
- hora_envio
- fornecedor_envio
- codigo_carteira
- nome_carteira
- segmento_carteira
- numero_contrato
- cpf_cliente
- telefone_cliente
- status_envio
- numero_saida
- login_usuario
- template_envio
- coringa_1
- coringa_2
- coringa_3
- coringa_4
- tipo_envio

### 6. Indicadores
**Endpoint:** `GET /reports/indicadores`

Relatório unificado com DE-PARA de classificação de finalização, para acompanhar performance dos disparos desde o envio até a conversão.

**Estrutura de Retorno:**
- data
- data_envio
- inicio_atendimento
- fim_atendimento
- tma
- tipo_atendimento
- fornecedor
- codigo_carteira
- carteira
- segmento
- contrato
- cpf
- telefone
- status
- login
- evento
- evento_normalizado
- envio
- falha
- entregue
- lido
- cpc
- cpc_produtivo
- boleto
- valor
- transbordo
- primeira_opcao_oferta
- segunda_via
- nota_nps
- obs_nps
- erro_api
- abandono
- protocolo

### 7. Tempos
**Endpoint:** `GET /reports/tempos`

Relatório unificado de tempos de atendimento.

**Estrutura de Retorno:**
- data
- hora
- fornecedor
- codigo_carteira
- carteira
- segmento
- contrato
- cpf
- telefone
- login
- evento
- evento_normalizado
- tma
- tmc
- tmpro
- tmf
- tmrc
- tmro
- protocolo

## RELATÓRIO CONSOLIDADO

### Consolidado (Todos os relatórios)
**Endpoint:** `GET /reports/consolidado`

Retorna todos os 7 relatórios de uma vez (executados em paralelo).

**Resposta:**
```json
{
  "periodo": {
    "inicio": "2024-12-01",
    "fim": "2024-12-31"
  },
  "segmento": "Todos",
  "relatorios": {
    "opSintetico": [...],
    "kpi": [...],
    "hsm": [...],
    "lineStatus": [...],
    "envios": [...],
    "indicadores": [...],
    "tempos": [...]
  }
}
```

## Permissões

Todos os endpoints de relatórios exigem:
- Autenticação JWT (`@UseGuards(JwtAuthGuard)`)
- Role de `admin` ou `supervisor` (`@Roles('admin', 'supervisor')`)

Operadores não têm acesso aos relatórios.

## Filtros Disponíveis

Todos os relatórios aceitam os seguintes filtros via query params:

- `startDate` (opcional): Data inicial no formato YYYY-MM-DD
- `endDate` (opcional): Data final no formato YYYY-MM-DD
- `segment` (opcional): ID do segmento específico (número)

**Exemplos:**
```
GET /reports/kpi?startDate=2024-12-01&endDate=2024-12-31&segment=1
GET /reports/envios?startDate=2024-12-01
GET /reports/tempos?segment=2
```

## Campos Null

Campos que não existem ou não fazem sentido para a aplicação atual são retornados como `null`, conforme estrutura padronizada do cliente.

Exemplos:
- QualityScore, Tier (Status de Linha)
- Hashtag, Número Protocolo (KPI)
- coringa_1, coringa_2, coringa_3, coringa_4 (Envios)
- tmc, tmpro, tmf, tmrc, tmro (Tempos)
- nota_nps, obs_nps, primeira_opcao_oferta, segunda_via (Indicadores)

## Observações

1. **Agrupamento por Segmento**: Todos os relatórios consideram segmentos.
2. **Datas**: Formato ISO 8601 (YYYY-MM-DD) para filtros.
3. **Performance**: Relatório consolidado executa queries em paralelo.
4. **CPC**: Tabulações marcadas com `isCPC = true` são consideradas conversões produtivas.
5. **TMA**: Tempo Médio de Atendimento calculado em minutos.
6. **Tipo de Envio**: "Massivo" (campanhas) ou "1:1" (atendimento individual).
