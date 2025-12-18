import { Injectable, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface WhatsAppMessageResponse {
  messaging_product: string;
  contacts: { input: string; wa_id: string }[];
  messages: { id: string }[];
}

@Injectable()
export class WhatsappService {
  private readonly phoneNumberId: string;
  private readonly apiVersion: string;
  private readonly apiUrl: string;
  private readonly accessToken: string;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    this.apiVersion = configService.get<string>('META_API_VERSION') || 'v18.0';
    this.apiUrl = configService.get<string>('META_API_URL') || 'https://graph.facebook.com';
    this.accessToken = configService.get<string>('WHATSAPP_ACCESS_TOKEN') || '';
    this.phoneNumberId = configService.get<string>('WHATSAPP_PHONE_NUMBER_ID') || '';
  }

  async sendMessage(
    to: string,
    type: string,
    content: Record<string, any>,
  ): Promise<WhatsAppMessageResponse> {
    const payload = this.buildPayload(to, type, content);

    try {
      const response = await firstValueFrom(
        this.httpService.post<WhatsAppMessageResponse>(
          `${this.apiUrl}/${this.apiVersion}/${this.phoneNumberId}/messages`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async sendTextMessage(to: string, text: string): Promise<WhatsAppMessageResponse> {
    return this.sendMessage(to, 'TEXT', { body: text });
  }

  async sendImageMessage(
    to: string,
    mediaId: string,
    caption?: string,
  ): Promise<WhatsAppMessageResponse> {
    return this.sendMessage(to, 'IMAGE', { mediaId, caption });
  }

  async sendVideoMessage(
    to: string,
    mediaId: string,
    caption?: string,
  ): Promise<WhatsAppMessageResponse> {
    return this.sendMessage(to, 'VIDEO', { mediaId, caption });
  }

  async sendAudioMessage(to: string, mediaId: string): Promise<WhatsAppMessageResponse> {
    return this.sendMessage(to, 'AUDIO', { mediaId });
  }

  async sendDocumentMessage(
    to: string,
    mediaId: string,
    filename?: string,
    caption?: string,
  ): Promise<WhatsAppMessageResponse> {
    return this.sendMessage(to, 'DOCUMENT', { mediaId, filename, caption });
  }

  async sendLocationMessage(
    to: string,
    latitude: number,
    longitude: number,
    name?: string,
    address?: string,
  ): Promise<WhatsAppMessageResponse> {
    return this.sendMessage(to, 'LOCATION', { latitude, longitude, name, address });
  }

  async sendTemplateMessage(
    to: string,
    templateName: string,
    languageCode: string,
    components?: any[],
  ): Promise<WhatsAppMessageResponse> {
    return this.sendMessage(to, 'TEMPLATE', {
      name: templateName,
      language: { code: languageCode },
      components,
    });
  }

  async sendInteractiveButtons(
    to: string,
    bodyText: string,
    buttons: { id: string; title: string }[],
    headerText?: string,
    footerText?: string,
  ): Promise<WhatsAppMessageResponse> {
    return this.sendMessage(to, 'INTERACTIVE', {
      type: 'button',
      header: headerText ? { type: 'text', text: headerText } : undefined,
      body: { text: bodyText },
      footer: footerText ? { text: footerText } : undefined,
      action: {
        buttons: buttons.map((btn) => ({
          type: 'reply',
          reply: { id: btn.id, title: btn.title },
        })),
      },
    });
  }

  async sendInteractiveList(
    to: string,
    bodyText: string,
    buttonText: string,
    sections: { title: string; rows: { id: string; title: string; description?: string }[] }[],
    headerText?: string,
    footerText?: string,
  ): Promise<WhatsAppMessageResponse> {
    return this.sendMessage(to, 'INTERACTIVE', {
      type: 'list',
      header: headerText ? { type: 'text', text: headerText } : undefined,
      body: { text: bodyText },
      footer: footerText ? { text: footerText } : undefined,
      action: {
        button: buttonText,
        sections,
      },
    });
  }

  async sendReaction(to: string, messageId: string, emoji: string): Promise<WhatsAppMessageResponse> {
    return this.sendMessage(to, 'REACTION', {
      message_id: messageId,
      emoji,
    });
  }

  async uploadMedia(
    file: Buffer,
    mimeType: string,
    filename: string,
  ): Promise<{ id: string }> {
    // Using form-data for multipart/form-data uploads
    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('file', file, { filename, contentType: mimeType });
    formData.append('messaging_product', 'whatsapp');

    try {
      const response = await firstValueFrom(
        this.httpService.post<{ id: string }>(
          `${this.apiUrl}/${this.apiVersion}/${this.phoneNumberId}/media`,
          formData,
          {
            headers: {
              ...formData.getHeaders(),
              Authorization: `Bearer ${this.accessToken}`,
            },
          },
        ),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getMediaUrl(mediaId: string): Promise<string> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<{ url: string }>(
          `${this.apiUrl}/${this.apiVersion}/${mediaId}`,
          {
            headers: {
              Authorization: `Bearer ${this.accessToken}`,
            },
          },
        ),
      );
      return response.data.url;
    } catch (error) {
      this.handleError(error);
    }
  }

  async downloadMedia(url: string): Promise<Buffer> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          responseType: 'arraybuffer',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }),
      );
      return Buffer.from(response.data);
    } catch (error) {
      this.handleError(error);
    }
  }

  async markAsRead(messageId: string): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.post(
          `${this.apiUrl}/${this.apiVersion}/${this.phoneNumberId}/messages`,
          {
            messaging_product: 'whatsapp',
            status: 'read',
            message_id: messageId,
          },
          {
            headers: {
              Authorization: `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );
    } catch (error) {
      // Silently fail - not critical
      console.error('Failed to mark message as read:', error.message);
    }
  }

  private buildPayload(to: string, type: string, content: Record<string, any>): Record<string, any> {
    const payload: Record<string, any> = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
    };

    switch (type.toUpperCase()) {
      case 'TEXT':
        payload.type = 'text';
        payload.text = {
          preview_url: true,
          body: content.body || content.text,
        };
        break;

      case 'IMAGE':
        payload.type = 'image';
        payload.image = content.mediaId
          ? { id: content.mediaId, caption: content.caption }
          : { link: content.url, caption: content.caption };
        break;

      case 'VIDEO':
        payload.type = 'video';
        payload.video = content.mediaId
          ? { id: content.mediaId, caption: content.caption }
          : { link: content.url, caption: content.caption };
        break;

      case 'AUDIO':
        payload.type = 'audio';
        payload.audio = content.mediaId
          ? { id: content.mediaId }
          : { link: content.url };
        break;

      case 'DOCUMENT':
        payload.type = 'document';
        payload.document = content.mediaId
          ? { id: content.mediaId, filename: content.filename, caption: content.caption }
          : { link: content.url, filename: content.filename, caption: content.caption };
        break;

      case 'STICKER':
        payload.type = 'sticker';
        payload.sticker = content.mediaId
          ? { id: content.mediaId }
          : { link: content.url };
        break;

      case 'LOCATION':
        payload.type = 'location';
        payload.location = {
          latitude: content.latitude,
          longitude: content.longitude,
          name: content.name,
          address: content.address,
        };
        break;

      case 'CONTACTS':
        payload.type = 'contacts';
        payload.contacts = content.contacts;
        break;

      case 'INTERACTIVE':
        payload.type = 'interactive';
        payload.interactive = {
          type: content.type,
          header: content.header,
          body: content.body,
          footer: content.footer,
          action: content.action,
        };
        break;

      case 'TEMPLATE':
        payload.type = 'template';
        payload.template = {
          name: content.name,
          language: content.language,
          components: content.components,
        };
        break;

      case 'REACTION':
        payload.type = 'reaction';
        payload.reaction = {
          message_id: content.message_id,
          emoji: content.emoji,
        };
        break;

      default:
        throw new HttpException(`Tipo de mensagem não suportado: ${type}`, 400);
    }

    return payload;
  }

  private handleError(error: any): never {
    if (error.response) {
      const { status, data } = error.response;
      const errorData = data?.error || data;
      throw new HttpException(
        {
          code: errorData?.code || 'WHATSAPP_ERROR',
          message: errorData?.message || 'Erro ao comunicar com WhatsApp',
          details: errorData?.error_data,
        },
        status,
      );
    }
    throw new HttpException('Erro ao comunicar com WhatsApp', 500);
  }
}

