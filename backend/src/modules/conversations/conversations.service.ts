import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConversationStatus } from '@prisma/client';

@Injectable()
export class ConversationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string, params?: {
    page?: number;
    limit?: number;
    status?: ConversationStatus;
    assignedToId?: string;
    search?: string;
  }) {
    const { status, assignedToId, search } = params || {};
    // Ensure page and limit are valid numbers
    const page = Math.max(1, Number(params?.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(params?.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {
      organizationId,
    };

    if (status) {
      where.status = status;
    }

    if (assignedToId) {
      if (assignedToId === 'unassigned') {
        where.assignedToId = null;
      } else {
        where.assignedToId = assignedToId;
      }
    }

    if (search) {
      where.OR = [
        { contact: { profileName: { contains: search, mode: 'insensitive' } } },
        { contact: { phoneNumber: { contains: search } } },
        { contact: { customName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [conversations, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { lastMessageAt: 'desc' },
        include: {
          contact: {
            select: {
              id: true,
              waId: true,
              phoneNumber: true,
              profileName: true,
              customName: true,
              profilePicture: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
        },
      }),
      this.prisma.conversation.count({ where }),
    ]);

    return {
      data: conversations.map((conv) => ({
        id: conv.id,
        status: conv.status,
        priority: conv.priority,
        unreadCount: conv.unreadCount,
        lastMessageAt: conv.lastMessageAt,
        lastMessagePreview: conv.lastMessagePreview,
        lastMessageType: conv.lastMessageType,
        windowExpiresAt: conv.windowExpiresAt,
        contact: {
          id: conv.contact.id,
          waId: conv.contact.waId,
          phoneNumber: conv.contact.phoneNumber,
          name: conv.contact.customName || conv.contact.profileName || conv.contact.phoneNumber,
          avatar: conv.contact.profilePicture,
        },
        assignedTo: conv.assignedTo,
        tags: conv.tags.map((t) => t.tag),
        createdAt: conv.createdAt,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string, organizationId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id, organizationId },
      include: {
        contact: true,
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        notes: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversa não encontrada');
    }

    return conversation;
  }

  async findOrCreateByWaId(organizationId: string, waId: string, phoneNumber: string, profileName?: string) {
    // Find or create contact
    let contact = await this.prisma.contact.findUnique({
      where: {
        organizationId_waId: {
          organizationId,
          waId,
        },
      },
    });

    if (!contact) {
      contact = await this.prisma.contact.create({
        data: {
          organizationId,
          waId,
          phoneNumber,
          profileName,
        },
      });
    } else if (profileName && profileName !== contact.profileName) {
      contact = await this.prisma.contact.update({
        where: { id: contact.id },
        data: { profileName },
      });
    }

    // Find or create conversation
    let conversation = await this.prisma.conversation.findFirst({
      where: {
        organizationId,
        contactId: contact.id,
        status: { not: 'CLOSED' },
      },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          organizationId,
          contactId: contact.id,
          status: 'OPEN',
          windowExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
        },
      });
    }

    return { conversation, contact };
  }

  async updateStatus(id: string, status: ConversationStatus) {
    const data: any = { status };

    if (status === 'RESOLVED') {
      data.resolvedAt = new Date();
    } else if (status === 'CLOSED') {
      data.closedAt = new Date();
    }

    return this.prisma.conversation.update({
      where: { id },
      data,
    });
  }

  async assign(id: string, assignedToId: string | null) {
    return this.prisma.conversation.update({
      where: { id },
      data: { assignedToId },
    });
  }

  async updateLastMessage(id: string, preview: string, type: string) {
    return this.prisma.conversation.update({
      where: { id },
      data: {
        lastMessageAt: new Date(),
        lastMessagePreview: preview.substring(0, 100),
        lastMessageType: type as any,
      },
    });
  }

  async incrementUnread(id: string) {
    return this.prisma.conversation.update({
      where: { id },
      data: {
        unreadCount: { increment: 1 },
      },
    });
  }

  async markAsRead(id: string) {
    return this.prisma.conversation.update({
      where: { id },
      data: { unreadCount: 0 },
    });
  }

  async updateWindow(id: string) {
    return this.prisma.conversation.update({
      where: { id },
      data: {
        windowExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
  }

  async addTag(conversationId: string, tagId: string) {
    return this.prisma.conversationTag.upsert({
      where: {
        conversationId_tagId: {
          conversationId,
          tagId,
        },
      },
      create: {
        conversationId,
        tagId,
      },
      update: {},
    });
  }

  async removeTag(conversationId: string, tagId: string) {
    return this.prisma.conversationTag.deleteMany({
      where: {
        conversationId,
        tagId,
      },
    });
  }

  async addNote(conversationId: string, userId: string, content: string) {
    return this.prisma.note.create({
      data: {
        conversationId,
        userId,
        content,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });
  }

  async getStats(organizationId: string) {
    const [total, open, pending, resolved, unassigned] = await Promise.all([
      this.prisma.conversation.count({ where: { organizationId } }),
      this.prisma.conversation.count({ where: { organizationId, status: 'OPEN' } }),
      this.prisma.conversation.count({ where: { organizationId, status: 'PENDING' } }),
      this.prisma.conversation.count({ where: { organizationId, status: 'RESOLVED' } }),
      this.prisma.conversation.count({ where: { organizationId, assignedToId: null, status: 'OPEN' } }),
    ]);

    return {
      total,
      open,
      pending,
      resolved,
      unassigned,
    };
  }
}

