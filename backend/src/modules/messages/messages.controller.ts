import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { 
  ApiTags, 
  ApiOperation, 
  ApiBearerAuth, 
  ApiQuery, 
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SendMessageDto } from './dto/send-message.dto';

@ApiTags('messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('conversations/:conversationId/messages')
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar mensagens de uma conversa' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'before', required: false, description: 'ID da mensagem para paginação' })
  async findAll(
    @Param('conversationId') conversationId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('before') before?: string,
  ) {
    return this.messagesService.findByConversation(conversationId, {
      page,
      limit,
      before,
    });
  }

  @Post()
  @ApiOperation({ summary: 'Enviar mensagem' })
  async send(
    @CurrentUser() user: any,
    @Param('conversationId') conversationId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.messagesService.send(conversationId, dto, user.id);
  }

  @Post('media')
  @ApiOperation({ summary: 'Enviar mensagem com mídia (imagem, vídeo, áudio, documento)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        type: {
          type: 'string',
          enum: ['IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'STICKER'],
        },
        caption: {
          type: 'string',
        },
        filename: {
          type: 'string',
        },
      },
      required: ['file', 'type'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async sendMedia(
    @CurrentUser() user: any,
    @Param('conversationId') conversationId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('type') type: string,
    @Body('caption') caption?: string,
    @Body('filename') filename?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado');
    }

    return this.messagesService.sendWithMedia(
      conversationId, 
      file, 
      type, 
      user.id,
      { caption, filename },
    );
  }
}

