# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Argumentos de build
ARG VITE_API_URL=http://localhost:3000

# Definir como variável de ambiente para o build
ENV VITE_API_URL=${VITE_API_URL}

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# Stage 2: Production
FROM nginx:alpine

# Instalar wget para healthcheck
RUN apk add --no-cache wget

# Copiar arquivos buildados
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuração customizada do nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
