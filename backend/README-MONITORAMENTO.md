# 🚀 Guia Rápido: Swagger + Prometheus + Grafana

## 📚 1. Swagger (Documentação da API)

### Acesse:
```
http://localhost:3000/api/docs
```

### Como usar:
1. Inicie o backend: `npm run start:dev`
2. Abra o navegador em `http://localhost:3000/api/docs`
3. Clique em **"Authorize"** (cadeado no topo)
4. Cole seu token JWT (obtido após login)
5. Teste os endpoints diretamente!

---

## 📊 2. Prometheus + Grafana (Monitoramento)

### Setup Rápido (Docker):

```bash
cd backend

# 1. Iniciar Prometheus + Grafana
docker-compose -f docker-compose-monitoring.yml up -d

# 2. Verificar se está rodando
docker ps | grep -E "prometheus|grafana"
```

### Acessar:

| Serviço | URL | Login |
|---------|-----|-------|
| **Prometheus** | http://localhost:9090 | - |
| **Grafana** | http://localhost:3001 | admin / admin |

### Configurar Grafana:

1. **Login inicial:**
   - Acesse: http://localhost:3001
   - Usuário: `admin`
   - Senha: `admin` (vai pedir para trocar)

2. **Adicionar Prometheus:**
   - Vá em **Configuration > Data Sources**
   - Clique em **Add data source**
   - Selecione **Prometheus**
   - URL: `http://prometheus:9090`
   - Clique em **Save & Test** (deve aparecer verde ✅)

3. **Importar Dashboard:**
   - Vá em **Dashboards > Import**
   - Clique em **Upload JSON file**
   - Selecione: `backend/grafana-dashboard.json`
   - Clique em **Import**

### Verificar se está funcionando:

```bash
# 1. Backend está expondo métricas?
curl http://localhost:3000/metrics | head -20

# 2. Prometheus está coletando?
# Acesse: http://localhost:9090
# Vá em: Status > Targets
# Deve estar UP (verde)

# 3. Ver métricas no Prometheus:
# Acesse: http://localhost:9090
# Vá em: Graph
# Digite: messages_sent_total
# Clique em: Execute
```

---

## 🎯 Métricas Disponíveis

### No Prometheus (http://localhost:9090):
- `messages_sent_total` - Total de mensagens enviadas
- `messages_received_total` - Total de mensagens recebidas
- `errors_total` - Total de erros
- `active_operators` - Operadores ativos
- `active_lines` - Linhas ativas
- `message_latency_seconds` - Latência de mensagens

### No Grafana:
- Dashboard pré-configurado com gráficos
- Atualização automática a cada 30 segundos
- Visualização em tempo real

---

## 🔧 Troubleshooting

### Prometheus não conecta ao backend?
Edite `prometheus.yml` e teste diferentes targets:
```yaml
targets:
  - 'host.docker.internal:3000'  # Docker Desktop
  - '172.17.0.1:3000'            # Linux/WSL
  - 'localhost:3000'             # Mesmo host
```

### Ver logs:
```bash
# Prometheus
docker logs vend-prometheus

# Grafana
docker logs vend-grafana
```

### Parar tudo:
```bash
docker-compose -f docker-compose-monitoring.yml down
```

---

## 📖 Documentação Completa

Para mais detalhes, veja: `backend/GUIA-MONITORAMENTO.md`

