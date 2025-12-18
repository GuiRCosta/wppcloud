import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
    });

    if (!organization) {
      throw new NotFoundException('Organização não encontrada');
    }

    return organization;
  }

  async findBySlug(slug: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { slug },
    });

    if (!organization) {
      throw new NotFoundException('Organização não encontrada');
    }

    return organization;
  }

  async create(data: {
    name: string;
    slug?: string;
  }) {
    // Generate slug from name if not provided
    const slug = data.slug || this.generateSlug(data.name);

    // Check if slug exists
    const existing = await this.prisma.organization.findUnique({
      where: { slug },
    });

    if (existing) {
      throw new BadRequestException('Já existe uma organização com esse identificador');
    }

    return this.prisma.organization.create({
      data: {
        name: data.name,
        slug,
      },
    });
  }

  async update(id: string, data: {
    name?: string;
    logo?: string;
    timezone?: string;
    settings?: Record<string, any>;
  }) {
    return this.prisma.organization.update({
      where: { id },
      data,
    });
  }

  async updateWhatsAppConfig(id: string, config: {
    wabaId?: string;
    phoneNumberId?: string;
    phoneNumber?: string;
    accessToken?: string;
    webhookSecret?: string;
  }) {
    return this.prisma.organization.update({
      where: { id },
      data: config,
    });
  }

  async getStats(id: string) {
    const [usersCount, conversationsCount, messagesCount] = await Promise.all([
      this.prisma.user.count({ where: { organizationId: id } }),
      this.prisma.conversation.count({ where: { organizationId: id } }),
      this.prisma.message.count({
        where: { conversation: { organizationId: id } },
      }),
    ]);

    return {
      users: usersCount,
      conversations: conversationsCount,
      messages: messagesCount,
    };
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with dashes
      .replace(/^-|-$/g, '') // Remove leading/trailing dashes
      .substring(0, 50); // Limit length
  }
}

