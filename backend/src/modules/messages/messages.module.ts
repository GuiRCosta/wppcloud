import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [WhatsappModule, ConversationsModule, WebsocketModule],
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}

