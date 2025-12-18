import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('root')
@Controller()
export class AppController {
  @Get()
  @ApiOperation({ summary: 'Informações da API' })
  @ApiResponse({ status: 200, description: 'Informações da API' })
  getInfo() {
    return {
      name: 'WhatsApp Chat API',
      version: '1.0.0',
      description: 'API para integração com WhatsApp Business Cloud API',
      endpoints: {
        auth: '/api/v1/auth',
        users: '/api/v1/users',
        conversations: '/api/v1/conversations',
        messages: '/api/v1/conversations/:conversationId/messages',
        webhook: '/webhook/whatsapp',
        docs: '/docs',
      },
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  @ApiResponse({ status: 200, description: 'API está funcionando' })
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}

