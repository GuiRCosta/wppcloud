import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;
  private readonly subscriber: Redis;
  private readonly publisher: Redis;

  constructor(private configService: ConfigService) {
    const redisConfig = {
      host: this.configService.get<string>('REDIS_HOST') || 'localhost',
      port: this.configService.get<number>('REDIS_PORT') || 6379,
      password: this.configService.get<string>('REDIS_PASSWORD') || undefined,
      retryStrategy: (times: number) => {
        // Retry até 3 vezes, depois desiste silenciosamente
        if (times > 3) {
          return null; // Não retry mais
        }
        return Math.min(times * 200, 2000);
      },
      maxRetriesPerRequest: null,
      lazyConnect: true, // Não conectar automaticamente
    };

    this.client = new Redis(redisConfig);
    this.subscriber = new Redis(redisConfig);
    this.publisher = new Redis(redisConfig);

    // Tentar conectar, mas não falhar se não conseguir
    this.client.connect().catch(() => {
      console.warn('⚠️  Redis não disponível. Funcionalidades de cache serão limitadas.');
    });
    this.subscriber.connect().catch(() => {});
    this.publisher.connect().catch(() => {});
  }

  getClient(): Redis {
    return this.client;
  }

  getSubscriber(): Redis {
    return this.subscriber;
  }

  getPublisher(): Redis {
    return this.publisher;
  }

  // Cache operations
  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch {
      return null; // Retorna null se Redis não estiver disponível
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      if (ttlSeconds) {
        await this.client.set(key, value, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, value);
      }
    } catch {
      // Silenciosamente ignora se Redis não estiver disponível
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  // JSON operations
  async getJson<T>(key: string): Promise<T | null> {
    const value = await this.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  async setJson<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttlSeconds);
  }

  // Pub/Sub
  async publish(channel: string, message: string): Promise<void> {
    await this.publisher.publish(channel, message);
  }

  async subscribe(
    channel: string,
    callback: (message: string) => void,
  ): Promise<void> {
    await this.subscriber.subscribe(channel);
    this.subscriber.on('message', (ch, message) => {
      if (ch === channel) {
        callback(message);
      }
    });
  }

  // Session management
  async setSession(
    sessionId: string,
    userId: string,
    ttlSeconds: number,
  ): Promise<void> {
    await this.set(`session:${sessionId}`, userId, ttlSeconds);
  }

  async getSession(sessionId: string): Promise<string | null> {
    return this.get(`session:${sessionId}`);
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.del(`session:${sessionId}`);
  }

  // Online status
  async setUserOnline(userId: string): Promise<void> {
    await this.set(`user:online:${userId}`, 'true', 300); // 5 min TTL
  }

  async setUserOffline(userId: string): Promise<void> {
    await this.del(`user:online:${userId}`);
  }

  async isUserOnline(userId: string): Promise<boolean> {
    return this.exists(`user:online:${userId}`);
  }

  async onModuleDestroy() {
    await this.client.quit();
    await this.subscriber.quit();
    await this.publisher.quit();
  }
}

