# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
# Usar npm install com --legacy-peer-deps para compatibilidade
RUN npm install --legacy-peer-deps

# Copiar código fonte
COPY . .

# Build da aplicação Vite
RUN npm run build

# Production stage - usar nginx para servir arquivos estáticos
FROM nginx:alpine

# Instalar wget para healthcheck
RUN apk add --no-cache wget

# Copiar arquivos buildados do stage anterior
COPY --from=builder /app/dist /usr/share/nginx/html

# Verificar se os arquivos foram copiados corretamente
RUN ls -la /usr/share/nginx/html/ && \
    test -f /usr/share/nginx/html/index.html || (echo "ERROR: index.html not found!" && exit 1)

# Copiar configuração customizada do nginx para SPA (Single Page Application)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Testar configuração do nginx
RUN nginx -t

# Expor porta 80
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Nginx já inicia automaticamente
CMD ["nginx", "-g", "daemon off;"]
