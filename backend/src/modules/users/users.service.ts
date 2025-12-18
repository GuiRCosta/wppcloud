import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserStatus, OnlineStatus } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string, params?: {
    page?: number;
    limit?: number;
    role?: string;
    status?: string;
    search?: string;
  }) {
    const { page = 1, limit = 20, role, status, search } = params || {};
    const skip = (page - 1) * limit;

    const where: any = {
      organizationId,
    };

    if (role) {
      where.role = role;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          displayName: true,
          avatar: true,
          role: true,
          status: true,
          onlineStatus: true,
          lastSeenAt: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        displayName: true,
        avatar: true,
        phone: true,
        role: true,
        status: true,
        onlineStatus: true,
        lastSeenAt: true,
        createdAt: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Check email uniqueness if changing
    if (dto.email && dto.email !== user.email) {
      const existingUser = await this.findByEmail(dto.email);
      if (existingUser) {
        throw new ConflictException('Email já está em uso');
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        ...dto,
        email: dto.email?.toLowerCase(),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        displayName: true,
        avatar: true,
        phone: true,
        role: true,
        status: true,
        onlineStatus: true,
      },
    });
  }

  async updateStatus(id: string, status: UserStatus) {
    return this.prisma.user.update({
      where: { id },
      data: { status },
    });
  }

  async updateOnlineStatus(id: string, onlineStatus: OnlineStatus) {
    return this.prisma.user.update({
      where: { id },
      data: {
        onlineStatus,
        lastSeenAt: onlineStatus === 'OFFLINE' ? new Date() : undefined,
      },
    });
  }

  async delete(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Soft delete - just update status
    return this.prisma.user.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });
  }

  async getAgents(organizationId: string) {
    return this.prisma.user.findMany({
      where: {
        organizationId,
        status: 'ACTIVE',
        role: { in: ['AGENT', 'SUPERVISOR', 'ADMIN', 'SUPER_ADMIN'] },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        displayName: true,
        avatar: true,
        role: true,
        onlineStatus: true,
      },
      orderBy: { firstName: 'asc' },
    });
  }
}

