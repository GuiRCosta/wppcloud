import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { MessagesService } from '../messages/messages.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';

interface WebhookEntry {
  id: string;
  changes: {
    value: {
      messaging_product: string;
      metadata: {
        display_phone_number: string;
        phone_number_id: string;
      };
      contacts?: {
        profile: { name: string };
        wa_id: string;
      }[];
      messages?: WhatsAppMessage[];
      statuses?: WhatsAppStatus[];
    };
    field: string;
  }[];
}

interface WhatsAppMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
  image?: { id: string; mime_type: string; sha256: string; caption?: string };
  video?: { id: string; mime_type: string; sha256: string; caption?: string };
  audio?: { id: string; mime_type: string; sha256: string };
  document?: { id: string; mime_type: string; sha256: string; filename?: string; caption?: string };
  sticker?: { id: string; mime_type: string; sha256: string };
  location?: { latitude: number; longitude: number; name?: string; address?: string };
  contacts?: any[];
  interactive?: { type: string; button_reply?: { id: string; title: string }; list_reply?: { id: string; title: string; description?: string } };
  context?: { from: string; id: string };
  reaction?: { message_id: string; emoji: string };
}

interface WhatsAppStatus {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipient_id: string;
  errors?: { code: number; title: string; message: string }[];
}

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private messagesService: MessagesService,
    private whatsappService: WhatsappService,
  ) {}

  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    const verifyToken = this.configService.get<string>('WHATSAPP_WEBHOOK_VERIFY_TOKEN');

    if (mode === 'subscribe' && token === verifyToken) {
      return challenge;
    }

    return null;
  }

  validateSignature(payload: string, signature: string): boolean {
    const appSecret = this.configService.get<string>('META_APP_SECRET');
    if (!appSecret) return true; // Skip validation if not configured

    const expectedSignature = crypto
      .createHmac('sha256', appSecret)
      .update(payload)
      .digest('hex');

    return `sha256=${expectedSignature}` === signature;
  }

  async processWebhook(body: { object: string; entry: WebhookEntry[] }): Promise<void> {
    if (body.object !== 'whatsapp_business_account') {
      return;
    }

    for (const entry of body.entry) {
      // Log webhook for debugging
      await this.prisma.webhookLog.create({
        data: {
          entryId: entry.id,
          eventType: 'webhook',
          payload: body as any,
        },
      });

      for (const change of entry.changes) {
        if (change.field !== 'messages') continue;

        const { value } = change;

        // Get organization by phone number ID
        const organization = await this.prisma.organization.findFirst({
          where: { phoneNumberId: value.metadata.phone_number_id },
        });

        if (!organization) {
          console.warn(`Organization not found for phone_number_id: ${value.metadata.phone_number_id}`);
          continue;
        }

        // Process messages
        if (value.messages) {
          for (const message of value.messages) {
            const contact = value.contacts?.find((c) => c.wa_id === message.from);
            await this.processMessage(
              organization.id,
              message,
              contact?.profile?.name,
            );
          }
        }

        // Process statuses
        if (value.statuses) {
          for (const status of value.statuses) {
            await this.processStatus(status);
          }
        }
      }
    }
  }

  private async processMessage(
    organizationId: string,
    message: WhatsAppMessage,
    profileName?: string,
  ): Promise<void> {
    const content = this.extractContent(message);

    // Create the message first
    const savedMessage = await this.messagesService.createInbound(
      organizationId,
      message.from,
      message.from, // phoneNumber same as waId for WhatsApp
      profileName || message.from,
      {
        wamid: message.id,
        type: this.mapMessageType(message.type),
        content,
        timestamp: new Date(parseInt(message.timestamp) * 1000),
        contextWamid: message.context?.id,
      },
    );

    // Save media metadata if message has media
    await this.saveMediaIfPresent(savedMessage.id, message);

    // Mark as read on WhatsApp (acknowledge receipt)
    try {
      await this.whatsappService.markAsRead(message.id);
    } catch (error) {
      this.logger.warn(`Failed to mark message ${message.id} as read: ${error.message}`);
    }
  }

  private async saveMediaIfPresent(messageId: string, message: WhatsAppMessage): Promise<void> {
    const mediaTypes = ['image', 'video', 'audio', 'document', 'sticker'];
    
    for (const type of mediaTypes) {
      const mediaData = message[type as keyof WhatsAppMessage] as any;
      if (mediaData?.id) {
        try {
          await this.prisma.media.create({
            data: {
              messageId,
              mediaId: mediaData.id,
              type,
              mimeType: mediaData.mime_type || 'application/octet-stream',
              sha256: mediaData.sha256,
              fileName: mediaData.filename,
            },
          });
          this.logger.log(`Saved media ${mediaData.id} for message ${messageId}`);
        } catch (error) {
          this.logger.error(`Failed to save media for message ${messageId}: ${error.message}`);
        }
        break; // Only one media type per message
      }
    }
  }

  private async processStatus(status: WhatsAppStatus): Promise<void> {
    const statusMap: Record<string, 'SENT' | 'DELIVERED' | 'READ' | 'FAILED'> = {
      sent: 'SENT',
      delivered: 'DELIVERED',
      read: 'READ',
      failed: 'FAILED',
    };

    await this.messagesService.updateStatus(
      status.id,
      statusMap[status.status] || 'SENT',
      new Date(parseInt(status.timestamp) * 1000),
    );
  }

  private extractContent(message: WhatsAppMessage): Record<string, any> {
    switch (message.type) {
      case 'text':
        return { body: message.text?.body };

      case 'image':
        return {
          mediaId: message.image?.id,
          mimeType: message.image?.mime_type,
          sha256: message.image?.sha256,
          caption: message.image?.caption,
        };

      case 'video':
        return {
          mediaId: message.video?.id,
          mimeType: message.video?.mime_type,
          sha256: message.video?.sha256,
          caption: message.video?.caption,
        };

      case 'audio':
        return {
          mediaId: message.audio?.id,
          mimeType: message.audio?.mime_type,
          sha256: message.audio?.sha256,
        };

      case 'document':
        return {
          mediaId: message.document?.id,
          mimeType: message.document?.mime_type,
          sha256: message.document?.sha256,
          filename: message.document?.filename,
          caption: message.document?.caption,
        };

      case 'sticker':
        return {
          mediaId: message.sticker?.id,
          mimeType: message.sticker?.mime_type,
          sha256: message.sticker?.sha256,
        };

      case 'location':
        return {
          latitude: message.location?.latitude,
          longitude: message.location?.longitude,
          name: message.location?.name,
          address: message.location?.address,
        };

      case 'contacts':
        return { contacts: message.contacts };

      case 'interactive':
        return {
          type: message.interactive?.type,
          buttonReply: message.interactive?.button_reply,
          listReply: message.interactive?.list_reply,
        };

      case 'reaction':
        return {
          messageId: message.reaction?.message_id,
          emoji: message.reaction?.emoji,
        };

      default:
        return { raw: message };
    }
  }

  private mapMessageType(type: string): string {
    const typeMap: Record<string, string> = {
      text: 'TEXT',
      image: 'IMAGE',
      video: 'VIDEO',
      audio: 'AUDIO',
      document: 'DOCUMENT',
      sticker: 'STICKER',
      location: 'LOCATION',
      contacts: 'CONTACTS',
      interactive: 'INTERACTIVE',
      button: 'INTERACTIVE',
      reaction: 'REACTION',
    };

    return typeMap[type] || 'UNKNOWN';
  }
}

