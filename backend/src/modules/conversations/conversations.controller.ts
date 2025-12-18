import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ConversationsService } from './conversations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ConversationStatus } from '@prisma/client';

@ApiTags('conversations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(private conversationsService: ConversationsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar conversas' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ConversationStatus })
  @ApiQuery({ name: 'assignedToId', required: false })
  @ApiQuery({ name: 'search', required: false })
  async findAll(
    @CurrentUser() user: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: ConversationStatus,
    @Query('assignedToId') assignedToId?: string,
    @Query('search') search?: string,
  ) {
    return this.conversationsService.findAll(user.organizationId, {
      page,
      limit,
      status,
      assignedToId,
      search,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Estatísticas das conversas' })
  async getStats(@CurrentUser() user: any) {
    return this.conversationsService.getStats(user.organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter detalhes de uma conversa' })
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.conversationsService.findById(id, user.organizationId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Atualizar status da conversa' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: ConversationStatus,
  ) {
    return this.conversationsService.updateStatus(id, status);
  }

  @Patch(':id/assign')
  @ApiOperation({ summary: 'Atribuir conversa a um agente' })
  async assign(
    @Param('id') id: string,
    @Body('assignedToId') assignedToId: string | null,
  ) {
    return this.conversationsService.assign(id, assignedToId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Marcar conversa como lida' })
  async markAsRead(@Param('id') id: string) {
    return this.conversationsService.markAsRead(id);
  }

  @Post(':id/tags')
  @ApiOperation({ summary: 'Adicionar tag à conversa' })
  async addTag(
    @Param('id') id: string,
    @Body('tagId') tagId: string,
  ) {
    return this.conversationsService.addTag(id, tagId);
  }

  @Delete(':id/tags/:tagId')
  @ApiOperation({ summary: 'Remover tag da conversa' })
  async removeTag(
    @Param('id') id: string,
    @Param('tagId') tagId: string,
  ) {
    return this.conversationsService.removeTag(id, tagId);
  }

  @Post(':id/notes')
  @ApiOperation({ summary: 'Adicionar nota interna' })
  async addNote(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body('content') content: string,
  ) {
    return this.conversationsService.addNote(id, user.id, content);
  }
}

