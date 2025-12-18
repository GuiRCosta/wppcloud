import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { OnlineStatus } from '@prisma/client';

export class UpdateStatusDto {
  @ApiProperty({ enum: OnlineStatus })
  @IsEnum(OnlineStatus)
  onlineStatus: OnlineStatus;
}

