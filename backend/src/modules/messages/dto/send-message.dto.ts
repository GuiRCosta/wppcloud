import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { MessageType } from '@prisma/client';

export class SendMessageDto {
  @ApiProperty({
    enum: MessageType,
    example: 'TEXT',
    description: 'Tipo da mensagem',
  })
  @IsEnum(MessageType)
  type: MessageType;

  @ApiProperty({
    example: { body: 'Olá, como posso ajudar?' },
    description: 'Conteúdo da mensagem (estrutura varia por tipo)',
  })
  @IsObject()
  @IsNotEmpty()
  content: Record<string, any>;

  @ApiPropertyOptional({
    example: 'wamid.xxx',
    description: 'ID da mensagem sendo respondida (quote)',
  })
  @IsString()
  @IsOptional()
  contextWamid?: string;
}

// Content structures by type:
//
// TEXT:
// { body: "Mensagem de texto" }
//
// IMAGE:
// { mediaId: "xxx" } or { url: "https://..." }
// Optional: { caption: "Legenda" }
//
// VIDEO:
// { mediaId: "xxx" } or { url: "https://..." }
// Optional: { caption: "Legenda" }
//
// AUDIO:
// { mediaId: "xxx" } or { url: "https://..." }
//
// DOCUMENT:
// { mediaId: "xxx" } or { url: "https://..." }
// Optional: { filename: "arquivo.pdf", caption: "Legenda" }
//
// STICKER:
// { mediaId: "xxx" } or { url: "https://..." }
//
// LOCATION:
// { latitude: -23.5505, longitude: -46.6333 }
// Optional: { name: "Local", address: "Endereço" }
//
// CONTACTS:
// { contacts: [{ name: {...}, phones: [...] }] }
//
// INTERACTIVE (Buttons):
// {
//   type: "button",
//   body: { text: "Escolha:" },
//   action: {
//     buttons: [
//       { type: "reply", reply: { id: "btn1", title: "Opção 1" } }
//     ]
//   }
// }
//
// INTERACTIVE (List):
// {
//   type: "list",
//   body: { text: "Selecione:" },
//   action: {
//     button: "Ver opções",
//     sections: [...]
//   }
// }
//
// TEMPLATE:
// {
//   name: "template_name",
//   language: { code: "pt_BR" },
//   components: [...]
// }

