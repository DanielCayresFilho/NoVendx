FROM node:20-alpine

# Instalar wget para healthcheck
RUN apk add --no-cache wget

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npx prisma generate

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
