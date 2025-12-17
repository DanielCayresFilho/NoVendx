# 📊 Guia Completo: Prometheus + Grafana + Swagger

## 🎯 1. Swagger (Documentação da API)

### Onde está?
O Swagger está disponível em: **`http://localhost:3000/api/docs`**

### Como acessar?

1. **Inicie o servidor backend:**
   ```bash
   cd backend
   npm run start:dev
   ```

2. **Acesse no navegador:**
   ```
   http://localhost:3000/api/docs
   ```

3. **Autenticação:**
   - Clique no botão **"Authorize"** (cadeado no topo)
   - Cole seu token JWT (obtido após fazer login)
   - Clique em **"Authorize"**
   - Agora você pode testar todos os endpoints!

### O que você pode fazer?
- ✅ Ver todos os endpoints da API
- ✅ Testar endpoints diretamente no navegador
- ✅ Ver exemplos de request/response
- ✅ Ver códigos de erro possíveis
- ✅ Copiar código de exemplo para seu frontend

---

## 📈 2. Prometheus (Coleta de Métricas)

### O que é?
Prometheus é uma ferramenta que coleta métricas do seu backend e armazena em um banco de dados de séries temporais.

### Como instalar?

#### Opção 1: Docker (Recomendado)
```bash
# Criar arquivo docker-compose-prometheus.yml
cat > docker-compose-prometheus.yml << 'EOF'
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: vend-prometheus
    restart: always
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/usr/share/prometheus/console_libraries'
      - '--web.console.templates=/usr/share/prometheus/consoles'

volumes:
  prometheus_data:
EOF

# Criar arquivo de configuração prometheus.yml
cat > prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'newvend-backend'
    static_configs:
      - targets: ['host.docker.internal:3000']  # Para Docker Desktop
        # Se estiver rodando no mesmo host, use: ['localhost:3000']
    metrics_path: '/metrics'
EOF

# Iniciar Prometheus
docker-compose -f docker-compose-prometheus.yml up -d
```

#### Opção 2: Binário (Linux/Mac)
```bash
# Baixar Prometheus
wget https://github.com/prometheus/prometheus/releases/download/v2.48.0/prometheus-2.48.0.linux-amd64.tar.gz
tar xvfz prometheus-2.48.0.linux-amd64.tar.gz
cd prometheus-2.48.0.linux-amd64

# Criar arquivo prometheus.yml
cat > prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'newvend-backend'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
EOF

# Iniciar Prometheus
./prometheus --config.file=prometheus.yml
```

### Como acessar?
1. **Acesse:** `http://localhost:9090`
2. **Verifique se está coletando métricas:**
   - Vá em **Status > Targets**
   - Deve mostrar `newvend-backend` como **UP** (verde)

### Métricas disponíveis no seu backend:
O endpoint `/metrics` expõe as seguintes métricas:

#### Contadores:
- `messages_sent_total` - Total de mensagens enviadas
- `messages_received_total` - Total de mensagens recebidas
- `errors_total` - Total de erros
- `line_assignments_total` - Total de atribuições de linha

#### Gauges:
- `active_operators` - Operadores ativos
- `active_lines` - Linhas ativas
- `message_queue_size` - Tamanho da fila de mensagens

#### Histograms:
- `message_latency_seconds` - Latência de envio de mensagens
- `api_latency_seconds` - Latência de chamadas à API

### Exemplos de queries Prometheus:
```promql
# Mensagens enviadas por minuto
rate(messages_sent_total[1m])

# Total de erros
sum(errors_total)

# Operadores ativos
active_operators

# Latência P95 (95% das mensagens)
histogram_quantile(0.95, message_latency_seconds_bucket)

# Taxa de erro
rate(errors_total[5m]) / rate(messages_sent_total[5m])
```

---

## 📊 3. Grafana (Visualização de Métricas)

### O que é?
Grafana é uma ferramenta de visualização que cria dashboards bonitos com as métricas do Prometheus.

### Como instalar?

#### Opção 1: Docker (Recomendado)
```bash
# Adicionar ao docker-compose-prometheus.yml
cat >> docker-compose-prometheus.yml << 'EOF'

  grafana:
    image: grafana/grafana:latest
    container_name: vend-grafana
    restart: always
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana-dashboard.json:/etc/grafana/provisioning/dashboards/dashboard.json

volumes:
  prometheus_data:
  grafana_data:
EOF

# Reiniciar
docker-compose -f docker-compose-prometheus.yml up -d
```

#### Opção 2: Binário (Linux/Mac)
```bash
# Ubuntu/Debian
sudo apt-get install -y software-properties-common
sudo add-apt-repository "deb https://packages.grafana.com/oss/deb stable main"
wget -q -O - https://packages.grafana.com/gpg.key | sudo apt-key add -
sudo apt-get update
sudo apt-get install grafana
sudo systemctl start grafana-server
sudo systemctl enable grafana-server
```

### Como configurar?

1. **Acesse Grafana:**
   ```
   http://localhost:3001
   ```

2. **Login inicial:**
   - Usuário: `admin`
   - Senha: `admin` (vai pedir para trocar)

3. **Adicionar Prometheus como Data Source:**
   - Vá em **Configuration > Data Sources**
   - Clique em **Add data source**
   - Selecione **Prometheus**
   - URL: `http://prometheus:9090` (se Docker) ou `http://localhost:9090`
   - Clique em **Save & Test**

4. **Importar Dashboard:**
   - Vá em **Dashboards > Import**
   - Clique em **Upload JSON file**
   - Selecione o arquivo `backend/grafana-dashboard.json`
   - Selecione o Prometheus como data source
   - Clique em **Import**

### Dashboard pré-configurado:
O arquivo `backend/grafana-dashboard.json` já contém:
- ✅ Total de mensagens enviadas/recebidas
- ✅ Gráfico de mensagens por minuto
- ✅ Latência P95
- ✅ Erros por tipo
- ✅ Operadores ativos
- ✅ Linhas ativas
- ✅ Tamanho da fila

---

## 🚀 Setup Completo (Docker Compose)

Crie um arquivo único para tudo:

```bash
cat > docker-compose-monitoring.yml << 'EOF'
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: vend-prometheus
    restart: always
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'

  grafana:
    image: grafana/grafana:latest
    container_name: vend-grafana
    restart: always
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana-dashboard.json:/etc/grafana/provisioning/dashboards/dashboard.json
    depends_on:
      - prometheus

volumes:
  prometheus_data:
  grafana_data:
EOF

# Criar prometheus.yml
cat > prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'newvend-backend'
    static_configs:
      - targets: ['host.docker.internal:3000']  # Docker Desktop
        # Para Linux/WSL: ['172.17.0.1:3000'] ou IP do host
    metrics_path: '/metrics'
EOF

# Iniciar tudo
docker-compose -f docker-compose-monitoring.yml up -d
```

---

## 📝 Checklist de Configuração

### 1. Backend está expondo métricas?
```bash
# Teste se o endpoint /metrics está funcionando
curl http://localhost:3000/metrics
```

### 2. Prometheus está coletando?
- Acesse: `http://localhost:9090`
- Vá em **Status > Targets**
- Deve estar **UP** (verde)

### 3. Grafana está conectado ao Prometheus?
- Acesse: `http://localhost:3001`
- Vá em **Configuration > Data Sources**
- Prometheus deve estar **Working** (verde)

### 4. Dashboard está funcionando?
- Vá em **Dashboards**
- Deve aparecer "NewVend - Métricas do Sistema"
- Os gráficos devem estar populados

---

## 🎓 Exemplos Práticos

### Ver mensagens enviadas em tempo real:
1. Abra Grafana
2. Vá no dashboard "NewVend"
3. Veja o card "Mensagens Enviadas (Total)"
4. Atualiza automaticamente a cada 30 segundos

### Criar alerta quando muitos erros:
1. Vá em **Alerting > Alert rules**
2. Clique em **New alert rule**
3. Query: `rate(errors_total[5m]) > 10`
4. Configure notificação (email, Slack, etc.)

### Ver latência das mensagens:
1. No dashboard, veja o gráfico "Latência de Mensagens (P95)"
2. Mostra o tempo que 95% das mensagens levam para ser enviadas
3. Se subir muito, pode indicar problema

---

## 🔧 Troubleshooting

### Prometheus não consegue conectar ao backend?
```yaml
# No prometheus.yml, tente diferentes targets:
targets:
  - 'localhost:3000'           # Se mesmo host
  - 'host.docker.internal:3000' # Docker Desktop
  - '172.17.0.1:3000'          # Linux/WSL
  - 'SEU_IP_LOCAL:3000'        # IP da sua máquina
```

### Grafana não mostra dados?
1. Verifique se Prometheus está coletando (Status > Targets)
2. Verifique se o data source está configurado corretamente
3. Teste uma query simples: `messages_sent_total`

### Dashboard não aparece?
1. Vá em **Dashboards > Import**
2. Cole o conteúdo de `grafana-dashboard.json`
3. Ou faça upload do arquivo

---

## 📚 URLs Importantes

| Serviço | URL | Descrição |
|---------|-----|-----------|
| **Swagger** | http://localhost:3000/api/docs | Documentação da API |
| **Prometheus** | http://localhost:9090 | Coleta de métricas |
| **Grafana** | http://localhost:3001 | Dashboards |
| **Backend Metrics** | http://localhost:3000/metrics | Endpoint de métricas |

---

## 🎯 Próximos Passos

1. ✅ Configure Prometheus
2. ✅ Configure Grafana
3. ✅ Importe o dashboard
4. ✅ Crie alertas personalizados
5. ✅ Configure notificações (opcional)

Pronto! Agora você tem monitoramento completo do sistema! 🚀

