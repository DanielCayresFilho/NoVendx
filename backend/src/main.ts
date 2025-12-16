import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // Permitir frontends configuráveis via env (lista separada por vírgula)
  const originEnv = configService.get<string>('CORS_ORIGINS');
  const allowedOrigins = originEnv
    ? originEnv.split(',').map((o) => o.trim()).filter(Boolean)
    : ['http://localhost:5173', 'http://localhost:3001'];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false, // Permitir campos extras (mais flexível)
      transform: true,
      transformOptions: {
        enableImplicitConversion: true, // Conversão automática de tipos
      },
    }),
  );

  // Middleware para garantir UTF-8 em todas as respostas JSON
  app.use((req, res, next) => {
    if (req.path.startsWith('/reports')) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }
    next();
  });

  const port = configService.get('PORT') || 3000;
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
}
bootstrap();
