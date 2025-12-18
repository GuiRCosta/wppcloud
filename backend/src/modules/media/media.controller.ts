import {
  Controller,
  Get,
  Post,
  Param,
  Res,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { MediaService } from './media.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('media')
@ApiBearerAuth()
@Controller('media')
export class MediaController {
  constructor(private mediaService: MediaService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload a media file to WhatsApp' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado');
    }

    const result = await this.mediaService.uploadToWhatsApp(file);

    return {
      success: true,
      mediaId: result.mediaId,
      localPath: result.localPath,
    };
  }

  @Get(':mediaId')
  @Public()
  @ApiOperation({ summary: 'Download media from WhatsApp' })
  async getMedia(@Param('mediaId') mediaId: string, @Res() res: Response) {
    try {
      const { buffer, mimeType, filename } = await this.mediaService.getMedia(mediaId);

      res.set({
        'Content-Type': mimeType,
        'Content-Disposition': `inline; filename="${filename}"`,
        'Content-Length': buffer.length,
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      });

      res.send(buffer);
    } catch (error) {
      res.status(404).json({ error: 'Mídia não encontrada' });
    }
  }

  @Get('message/:messageId')
  @ApiOperation({ summary: 'Get all media for a message' })
  async getMediaByMessage(@Param('messageId') messageId: string) {
    return this.mediaService.getMediaByMessageId(messageId);
  }
}

