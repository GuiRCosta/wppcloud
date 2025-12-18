import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MediaService {
  private readonly uploadDir: string;

  constructor(
    private prisma: PrismaService,
    private whatsappService: WhatsappService,
    private configService: ConfigService,
  ) {
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR') || './uploads';
    // Create upload directory if it doesn't exist
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Upload file to WhatsApp and save metadata
   */
  async uploadToWhatsApp(
    file: Express.Multer.File,
    messageId?: string,
  ): Promise<{ mediaId: string; localPath: string }> {
    // Validate file
    this.validateFile(file);

    // Generate unique filename
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    const localPath = path.join(this.uploadDir, filename);

    // Save file locally
    fs.writeFileSync(localPath, file.buffer);

    // Upload to WhatsApp
    const result = await this.whatsappService.uploadMedia(
      file.buffer,
      file.mimetype,
      file.originalname,
    );

    // Save media record if messageId provided
    if (messageId) {
      await this.prisma.media.create({
        data: {
          messageId,
          mediaId: result.id,
          type: this.getMediaType(file.mimetype),
          mimeType: file.mimetype,
          fileName: file.originalname,
          fileSize: file.size,
          localPath,
        },
      });
    }

    return {
      mediaId: result.id,
      localPath,
    };
  }

  /**
   * Download media from WhatsApp and cache locally
   */
  async getMedia(mediaId: string): Promise<{ buffer: Buffer; mimeType: string; filename: string }> {
    // Check if we have it cached locally
    const cached = await this.prisma.media.findFirst({
      where: { mediaId },
    });

    if (cached?.localPath && fs.existsSync(cached.localPath)) {
      return {
        buffer: fs.readFileSync(cached.localPath),
        mimeType: cached.mimeType,
        filename: cached.fileName || 'file',
      };
    }

    // Get URL from WhatsApp
    const url = await this.whatsappService.getMediaUrl(mediaId);
    
    // Download the file
    const buffer = await this.whatsappService.downloadMedia(url);

    // Cache locally
    const ext = this.getExtensionFromMimeType(cached?.mimeType || 'application/octet-stream');
    const filename = `${mediaId}${ext}`;
    const localPath = path.join(this.uploadDir, filename);
    fs.writeFileSync(localPath, buffer);

    // Update cache reference if record exists
    if (cached) {
      await this.prisma.media.update({
        where: { id: cached.id },
        data: { localPath },
      });
    }

    return {
      buffer,
      mimeType: cached?.mimeType || 'application/octet-stream',
      filename: cached?.fileName || filename,
    };
  }

  /**
   * Get media by message ID
   */
  async getMediaByMessageId(messageId: string): Promise<any[]> {
    return this.prisma.media.findMany({
      where: { messageId },
    });
  }

  /**
   * Save media metadata for received messages
   */
  async saveReceivedMedia(
    messageId: string,
    mediaId: string,
    mimeType: string,
    type: string,
    sha256?: string,
    filename?: string,
  ): Promise<void> {
    await this.prisma.media.create({
      data: {
        messageId,
        mediaId,
        type,
        mimeType,
        sha256,
        fileName: filename,
      },
    });
  }

  private validateFile(file: Express.Multer.File): void {
    const allowedMimes = [
      // Images
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      // Videos
      'video/mp4',
      'video/3gpp',
      // Audio
      'audio/aac',
      'audio/mp3',
      'audio/mpeg',
      'audio/ogg',
      'audio/amr',
      'audio/opus',
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
    ];

    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException(`Tipo de arquivo não suportado: ${file.mimetype}`);
    }

    // Size limits (WhatsApp limits)
    const maxSizes: Record<string, number> = {
      image: 5 * 1024 * 1024, // 5MB
      video: 16 * 1024 * 1024, // 16MB
      audio: 16 * 1024 * 1024, // 16MB
      document: 100 * 1024 * 1024, // 100MB
    };

    const type = this.getMediaType(file.mimetype);
    const maxSize = maxSizes[type] || maxSizes.document;

    if (file.size > maxSize) {
      throw new BadRequestException(
        `Arquivo muito grande. Máximo: ${Math.round(maxSize / 1024 / 1024)}MB`,
      );
    }
  }

  private getMediaType(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'document';
  }

  private getExtensionFromMimeType(mimeType: string): string {
    const extensions: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
      'video/mp4': '.mp4',
      'video/3gpp': '.3gp',
      'audio/aac': '.aac',
      'audio/mp3': '.mp3',
      'audio/mpeg': '.mp3',
      'audio/ogg': '.ogg',
      'audio/opus': '.opus',
      'audio/amr': '.amr',
      'application/pdf': '.pdf',
    };

    return extensions[mimeType] || '';
  }
}

