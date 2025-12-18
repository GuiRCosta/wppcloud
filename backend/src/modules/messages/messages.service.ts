import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { ConversationsService } from '../conversations/conversations.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { MessageType, MessageDirection, MessageStatus } from '@prisma/client';
import { SendMessageDto } from './dto/send-message.dto';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    private whatsappService: WhatsappService,
    private conversationsService: ConversationsService,
    private websocketGateway: WebsocketGateway,
  ) {}

  async findByConversation(conversationId: string, params?: {
    page?: number;
    limit?: number;
    before?: string;
  }) {
    const { page = 1, limit = 50, before } = params || {};
    const skip = (page - 1) * limit;

    const where: any = { conversationId };

    if (before) {
      const beforeMessage = await this.prisma.message.findUnique({
        where: { id: before },
      });
      if (beforeMessage) {
        where.timestamp = { lt: beforeMessage.timestamp };
      }
    }

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: {
          media: true,
          sentBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
      }),
      this.prisma.message.count({ where }),
    ]);

    return {
      data: messages.reverse(), // Return in chronological order
      meta: {
        total,
        page,
        limit,
        hasMore: skip + messages.length < total,
      },
    };
  }

  async send(conversationId: string, dto: SendMessageDto, userId: string) {
    // Get conversation with contact info
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        contact: true,
        organization: true,
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversa não encontrada');
    }

    // Check 24h window
    const isWindowOpen = conversation.windowExpiresAt && conversation.windowExpiresAt > new Date();
    if (!isWindowOpen && dto.type !== 'TEMPLATE') {
      throw new BadRequestException(
        'Janela de 24h expirada. Use um template para iniciar uma nova conversa.',
      );
    }

    // Create message in database first (pending status)
    const message = await this.prisma.message.create({
      data: {
        conversationId,
        type: dto.type,
        direction: 'OUTBOUND',
        status: 'PENDING',
        content: dto.content,
        timestamp: new Date(),
        sentById: userId,
      },
      include: {
        sentBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    // Send via WhatsApp API
    try {
      const waResponse = await this.whatsappService.sendMessage(
        conversation.contact.waId,
        dto.type,
        dto.content,
      );

      // Update message with WhatsApp ID
      const updatedMessage = await this.prisma.message.update({
        where: { id: message.id },
        data: {
          wamid: waResponse.messages[0].id,
          status: 'SENT',
        },
        include: {
          media: true,
          sentBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
      });

      // Update conversation
      await this.conversationsService.updateLastMessage(
        conversationId,
        this.getMessagePreview(dto.type, dto.content),
        dto.type,
      );

      // Emit via WebSocket
      this.websocketGateway.emitToOrganization(
        conversation.organizationId,
        'message:new',
        {
          conversationId,
          message: updatedMessage,
        },
      );

      return updatedMessage;
    } catch (error) {
      // Update message as failed
      await this.prisma.message.update({
        where: { id: message.id },
        data: {
          status: 'FAILED',
          errorCode: error.code,
          errorMessage: error.message,
        },
      });

      throw error;
    }
  }

  async createInbound(
    organizationId: string,
    waId: string,
    phoneNumber: string,
    profileName: string,
    messageData: {
      wamid: string;
      type: string;
      content: any;
      timestamp: Date;
      contextWamid?: string;
    },
  ) {
    // Find or create conversation
    const { conversation } = await this.conversationsService.findOrCreateByWaId(
      organizationId,
      waId,
      phoneNumber,
      profileName,
    );

    // Create message
    const message = await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        wamid: messageData.wamid,
        type: messageData.type as MessageType,
        direction: 'INBOUND',
        status: 'DELIVERED',
        content: messageData.content,
        timestamp: messageData.timestamp,
        contextWamid: messageData.contextWamid,
      },
      include: {
        media: true,
      },
    });

    // Update conversation
    await Promise.all([
      this.conversationsService.updateLastMessage(
        conversation.id,
        this.getMessagePreview(messageData.type, messageData.content),
        messageData.type,
      ),
      this.conversationsService.incrementUnread(conversation.id),
      this.conversationsService.updateWindow(conversation.id),
    ]);

    // Emit via WebSocket
    this.websocketGateway.emitToOrganization(organizationId, 'message:new', {
      conversationId: conversation.id,
      message,
    });

    return message;
  }

  async updateStatus(wamid: string, status: MessageStatus, timestamp?: Date) {
    const message = await this.prisma.message.findUnique({
      where: { wamid },
      include: { conversation: true },
    });

    if (!message) return null;

    const updatedMessage = await this.prisma.message.update({
      where: { id: message.id },
      data: { status },
    });

    // Emit via WebSocket
    this.websocketGateway.emitToOrganization(
      message.conversation.organizationId,
      'message:status',
      {
        conversationId: message.conversationId,
        messageId: message.id,
        wamid,
        status,
        timestamp,
      },
    );

    return updatedMessage;
  }

  private getMessagePreview(type: string, content: any): string {
    switch (type) {
      case 'TEXT':
        return content.body || content.text || '';
      case 'IMAGE':
        return '📷 Imagem';
      case 'VIDEO':
        return '🎥 Vídeo';
      case 'AUDIO':
        return '🎵 Áudio';
      case 'DOCUMENT':
        return `📄 ${content.filename || 'Documento'}`;
      case 'STICKER':
        return '🎭 Sticker';
      case 'LOCATION':
        return '📍 Localização';
      case 'CONTACTS':
        return '👤 Contato';
      case 'INTERACTIVE':
        return content.body?.text || 'Mensagem interativa';
      case 'TEMPLATE':
        return 'Template';
      default:
        return 'Mensagem';
    }
  }

  /**
   * Send message with media file
   */
  async sendWithMedia(
    conversationId: string,
    file: Express.Multer.File,
    type: string,
    userId: string,
    options?: { caption?: string; filename?: string },
  ) {
    // Get conversation with contact info
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        contact: true,
        organization: true,
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversa não encontrada');
    }

    // Check 24h window
    const isWindowOpen = conversation.windowExpiresAt && conversation.windowExpiresAt > new Date();
    if (!isWindowOpen) {
      throw new BadRequestException(
        'Janela de 24h expirada. Use um template para iniciar uma nova conversa.',
      );
    }

    // Save file locally
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    const localPath = path.join(uploadDir, filename);
    fs.writeFileSync(localPath, file.buffer);

    // Create message in database first (pending status)
    const message = await this.prisma.message.create({
      data: {
        conversationId,
        type: type as MessageType,
        direction: 'OUTBOUND',
        status: 'PENDING',
        content: {
          caption: options?.caption,
          filename: options?.filename || file.originalname,
          mimeType: file.mimetype,
          size: file.size,
        },
        timestamp: new Date(),
        sentById: userId,
      },
      include: {
        sentBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    try {
      // Upload to WhatsApp
      const uploadResult = await this.whatsappService.uploadMedia(
        file.buffer,
        file.mimetype,
        file.originalname,
      );

      // Build content for WhatsApp
      const content: Record<string, any> = {
        mediaId: uploadResult.id,
      };

      if (options?.caption) {
        content.caption = options.caption;
      }

      if (options?.filename || type.toUpperCase() === 'DOCUMENT') {
        content.filename = options?.filename || file.originalname;
      }

      // Send via WhatsApp API
      const waResponse = await this.whatsappService.sendMessage(
        conversation.contact.waId,
        type,
        content,
      );

      // Save media record
      await this.prisma.media.create({
        data: {
          messageId: message.id,
          mediaId: uploadResult.id,
          type: type.toLowerCase(),
          mimeType: file.mimetype,
          fileName: options?.filename || file.originalname,
          fileSize: file.size,
          localPath,
        },
      });

      // Update message with WhatsApp ID and URL
      const updatedMessage = await this.prisma.message.update({
        where: { id: message.id },
        data: {
          wamid: waResponse.messages[0].id,
          status: 'SENT',
          content: {
            ...message.content as object,
            mediaId: uploadResult.id,
            localUrl: `/uploads/${filename}`,
          },
        },
        include: {
          media: true,
          sentBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
      });

      // Update conversation
      await this.conversationsService.updateLastMessage(
        conversationId,
        this.getMessagePreview(type, { filename: options?.filename || file.originalname }),
        type,
      );

      // Emit via WebSocket
      this.websocketGateway.emitToOrganization(
        conversation.organizationId,
        'message:new',
        {
          conversationId,
          message: updatedMessage,
        },
      );

      return updatedMessage;
    } catch (error) {
      // Clean up local file on error
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }

      // Update message as failed
      await this.prisma.message.update({
        where: { id: message.id },
        data: {
          status: 'FAILED',
          errorCode: error.code,
          errorMessage: error.message,
        },
      });

      throw error;
    }
  }
}

