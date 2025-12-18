import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Security
  app.use(helmet());

  // CORS
  const corsOrigins = configService.get<string>('CORS_ORIGINS')?.split(',') || [
    'http://localhost:3000',
  ];
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Global prefix
  const apiPrefix = configService.get<string>('API_PREFIX') || 'api/v1';
  app.setGlobalPrefix(apiPrefix, {
    exclude: ['webhook/whatsapp', 'health', '/'], // Webhook, health e rota raiz não têm prefix
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger Documentation
  if (configService.get<string>('NODE_ENV') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('WhatsApp Chat API')
      .setDescription('API para integração com WhatsApp Business Cloud API')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Autenticação e autorização')
      .addTag('users', 'Gerenciamento de usuários')
      .addTag('conversations', 'Gerenciamento de conversas')
      .addTag('messages', 'Envio e recebimento de mensagens')
      .addTag('webhook', 'Webhooks do WhatsApp')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  const port = configService.get<number>('PORT') || 3001;
  await app.listen(port);

  console.log(`
  🚀 WhatsApp Chat API is running!
  
  📍 Server:    http://localhost:${port}
  📍 API:       http://localhost:${port}/${apiPrefix}
  📍 Docs:      http://localhost:${port}/docs
  📍 Webhook:   http://localhost:${port}/webhook/whatsapp
  
  Environment: ${configService.get<string>('NODE_ENV') || 'development'}
  `);
}

bootstrap();

