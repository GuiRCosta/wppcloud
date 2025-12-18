import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { MessagesModule } from '../messages/messages.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [MessagesModule, WhatsappModule],
  controllers: [WebhookController],
  providers: [WebhookService],
})
export class WebhookModule {}

