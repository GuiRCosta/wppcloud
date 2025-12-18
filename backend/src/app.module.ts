import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

// Core Modules
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AppController } from './app.controller';

// Feature Modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { MessagesModule } from './modules/messages/messages.module';
import { WebhookModule } from './modules/webhook/webhook.module';
import { WhatsappModule } from './modules/whatsapp/whatsapp.module';
import { WebsocketModule } from './modules/websocket/websocket.module';
import { MediaModule } from './modules/media/media.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';

@Module({
  controllers: [AppController],
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // Serve static files (uploaded media)
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
      serveStaticOptions: {
        index: false,
      },
    }),

    // Core
    PrismaModule,
    RedisModule,

    // Features
    AuthModule,
    UsersModule,
    ConversationsModule,
    MessagesModule,
    WebhookModule,
    WhatsappModule,
    WebsocketModule,
    MediaModule,
    OrganizationsModule,
  ],
})
export class AppModule {}

