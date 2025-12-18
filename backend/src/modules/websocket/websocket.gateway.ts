import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  organizationId?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/ws',
})
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets: Map<string, Set<string>> = new Map();

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, organizationId: true, status: true },
      });

      if (!user || user.status !== 'ACTIVE') {
        client.disconnect();
        return;
      }

      client.userId = user.id;
      client.organizationId = user.organizationId;

      // Join organization room
      client.join(`org:${user.organizationId}`);

      // Join personal room
      client.join(`user:${user.id}`);

      // Track user sockets
      if (!this.userSockets.has(user.id)) {
        this.userSockets.set(user.id, new Set());
      }
      this.userSockets.get(user.id)?.add(client.id);

      // Update online status
      await this.prisma.user.update({
        where: { id: user.id },
        data: { onlineStatus: 'ONLINE' },
      });
      await this.redisService.setUserOnline(user.id);

      // Notify others
      this.server.to(`org:${user.organizationId}`).emit('user:online', {
        userId: user.id,
        status: 'ONLINE',
      });

      console.log(`Client connected: ${client.id} (User: ${user.id})`);
    } catch (error) {
      console.error('WebSocket connection error:', error.message);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    if (!client.userId) return;

    // Remove from tracking
    this.userSockets.get(client.userId)?.delete(client.id);

    // If no more connections, update offline status
    if (this.userSockets.get(client.userId)?.size === 0) {
      this.userSockets.delete(client.userId);

      await this.prisma.user.update({
        where: { id: client.userId },
        data: {
          onlineStatus: 'OFFLINE',
          lastSeenAt: new Date(),
        },
      });
      await this.redisService.setUserOffline(client.userId);

      // Notify others
      if (client.organizationId) {
        this.server.to(`org:${client.organizationId}`).emit('user:offline', {
          userId: client.userId,
          lastSeenAt: new Date(),
        });
      }
    }

    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('conversation:join')
  handleJoinConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.join(`conversation:${data.conversationId}`);
    return { success: true };
  }

  @SubscribeMessage('conversation:leave')
  handleLeaveConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.leave(`conversation:${data.conversationId}`);
    return { success: true };
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    this.server.to(`conversation:${data.conversationId}`).emit('typing:start', {
      conversationId: data.conversationId,
      userId: client.userId,
    });
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    this.server.to(`conversation:${data.conversationId}`).emit('typing:stop', {
      conversationId: data.conversationId,
      userId: client.userId,
    });
  }

  @SubscribeMessage('status:update')
  async handleStatusUpdate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { status: 'ONLINE' | 'AWAY' | 'BUSY' },
  ) {
    if (!client.userId) return;

    await this.prisma.user.update({
      where: { id: client.userId },
      data: { onlineStatus: data.status },
    });

    this.server.to(`org:${client.organizationId}`).emit('user:status', {
      userId: client.userId,
      status: data.status,
    });

    return { success: true };
  }

  // Emit methods for use by other services

  emitToOrganization(organizationId: string, event: string, data: any) {
    this.server.to(`org:${organizationId}`).emit(event, data);
  }

  emitToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  emitToConversation(conversationId: string, event: string, data: any) {
    this.server.to(`conversation:${conversationId}`).emit(event, data);
  }

  getOnlineUsers(organizationId: string): string[] {
    const room = this.server.sockets.adapter.rooms.get(`org:${organizationId}`);
    if (!room) return [];

    const onlineUsers = new Set<string>();
    room.forEach((socketId) => {
      const socket = this.server.sockets.sockets.get(socketId) as AuthenticatedSocket;
      if (socket?.userId) {
        onlineUsers.add(socket.userId);
      }
    });

    return Array.from(onlineUsers);
  }
}

