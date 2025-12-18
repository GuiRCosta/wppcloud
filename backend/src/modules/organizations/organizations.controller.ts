import {
  Controller,
  Get,
  Put,
  Patch,
  Body,
  UseGuards,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('organizations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(private organizationsService: OrganizationsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user organization' })
  async getMe(@CurrentUser() user: any) {
    return this.organizationsService.findById(user.organizationId);
  }

  @Get('current')
  @ApiOperation({ summary: 'Get current user organization (alias)' })
  async getCurrent(@CurrentUser() user: any) {
    return this.organizationsService.findById(user.organizationId);
  }

  @Get('me/stats')
  @ApiOperation({ summary: 'Get organization statistics' })
  async getMeStats(@CurrentUser() user: any) {
    return this.organizationsService.getStats(user.organizationId);
  }

  @Get('current/stats')
  @ApiOperation({ summary: 'Get organization statistics (alias)' })
  async getStats(@CurrentUser() user: any) {
    return this.organizationsService.getStats(user.organizationId);
  }

  @Patch('me')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update current organization' })
  async updateMe(
    @CurrentUser() user: any,
    @Body() data: { name?: string; logo?: string; timezone?: string; settings?: Record<string, any> },
  ) {
    return this.organizationsService.update(user.organizationId, data);
  }

  @Put('current')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update current organization (alias)' })
  async update(
    @CurrentUser() user: any,
    @Body() data: { name?: string; logo?: string; timezone?: string; settings?: Record<string, any> },
  ) {
    return this.organizationsService.update(user.organizationId, data);
  }

  @Patch('me/whatsapp')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update WhatsApp configuration' })
  async updateMeWhatsApp(
    @CurrentUser() user: any,
    @Body() config: {
      wabaId?: string;
      phoneNumberId?: string;
      phoneNumber?: string;
      accessToken?: string;
      webhookSecret?: string;
    },
  ) {
    return this.organizationsService.updateWhatsAppConfig(user.organizationId, config);
  }

  @Put('current/whatsapp')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update WhatsApp configuration (alias)' })
  async updateWhatsApp(
    @CurrentUser() user: any,
    @Body() config: {
      wabaId?: string;
      phoneNumberId?: string;
      phoneNumber?: string;
      accessToken?: string;
      webhookSecret?: string;
    },
  ) {
    return this.organizationsService.updateWhatsAppConfig(user.organizationId, config);
  }
}

