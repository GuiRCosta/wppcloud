import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Headers,
  RawBodyRequest,
  Req,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Request } from 'express';
import { WebhookService } from './webhook.service';

@ApiTags('webhook')
@Controller('webhook/whatsapp')
export class WebhookController {
  constructor(private webhookService: WebhookService) {}

  @Get()
  @ApiOperation({ summary: 'Verificação do webhook (Meta)' })
  verify(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ) {
    const result = this.webhookService.verifyWebhook(mode, token, challenge);

    if (result) {
      return result;
    }

    throw new BadRequestException('Verificação falhou');
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async receive(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-hub-signature-256') signature: string,
    @Body() body: any,
  ) {
    // Validate signature
    const rawBody = req.rawBody?.toString() || JSON.stringify(body);
    
    if (signature && !this.webhookService.validateSignature(rawBody, signature)) {
      throw new BadRequestException('Assinatura inválida');
    }

    // Process webhook asynchronously
    this.webhookService.processWebhook(body).catch((error) => {
      console.error('Error processing webhook:', error);
    });

    // Return 200 immediately to acknowledge receipt
    return { status: 'received' };
  }
}

