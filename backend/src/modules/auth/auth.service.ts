import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

export interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  organizationId: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    avatar?: string;
    onlineStatus?: string;
    organization?: {
      id: string;
      name: string;
      slug: string;
    };
  };
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService,
    private usersService: UsersService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Email já está em uso');
    }

    // Find or create organization
    let organization = await this.prisma.organization.findFirst({
      where: { slug: dto.organizationSlug },
    });

    if (!organization) {
      organization = await this.prisma.organization.create({
        data: {
          name: dto.organizationName || 'Minha Empresa',
          slug: dto.organizationSlug || `org-${uuidv4().slice(0, 8)}`,
        },
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 12);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        organizationId: organization.id,
        role: 'ADMIN', // First user is admin
        status: 'ACTIVE',
        emailVerified: true, // For MVP, skip email verification
      },
    });

    return this.generateTokens(user);
  }

  async login(dto: LoginDto, deviceInfo?: { userAgent?: string; ip?: string }): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: { organization: true },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Conta desativada ou pendente de verificação');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        onlineStatus: 'ONLINE',
      },
    });

    // Set user online in Redis
    await this.redisService.setUserOnline(user.id);

    return this.generateTokens(user, deviceInfo);
  }

  async refreshToken(dto: RefreshTokenDto): Promise<AuthResponse> {
    // Find session by refresh token
    const session = await this.prisma.session.findUnique({
      where: { refreshToken: dto.refreshToken },
      include: { user: true },
    });

    if (!session) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    if (session.expiresAt < new Date()) {
      await this.prisma.session.delete({ where: { id: session.id } });
      throw new UnauthorizedException('Refresh token expirado');
    }

    // Delete old session
    await this.prisma.session.delete({ where: { id: session.id } });

    // Generate new tokens
    return this.generateTokens(session.user);
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    // Delete specific session or all sessions
    if (refreshToken) {
      await this.prisma.session.deleteMany({
        where: { userId, refreshToken },
      });
    }

    // Update user status
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        onlineStatus: 'OFFLINE',
        lastSeenAt: new Date(),
      },
    });

    // Remove from Redis
    await this.redisService.setUserOffline(userId);
  }

  async logoutAll(userId: string): Promise<void> {
    await this.prisma.session.deleteMany({
      where: { userId },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        onlineStatus: 'OFFLINE',
        lastSeenAt: new Date(),
      },
    });

    await this.redisService.setUserOffline(userId);
  }

  async validateUser(payload: TokenPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { organization: true },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException();
    }

    return user;
  }

  private async generateTokens(
    user: any,
    deviceInfo?: { userAgent?: string; ip?: string },
  ): Promise<AuthResponse> {
    // Load organization if not already included
    let organization = user.organization;
    if (!organization) {
      organization = await this.prisma.organization.findUnique({
        where: { id: user.organizationId },
      });
    }

    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = uuidv4();
    const refreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';
    const refreshExpiresMs = this.parseExpiry(refreshExpiresIn);

    // Create session
    await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshToken,
        userAgent: deviceInfo?.userAgent,
        ipAddress: deviceInfo?.ip,
        expiresAt: new Date(Date.now() + refreshExpiresMs),
      },
    });

    const accessExpiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || '15m';

    return {
      accessToken,
      refreshToken,
      expiresIn: this.parseExpiry(accessExpiresIn) / 1000, // in seconds
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
        onlineStatus: user.onlineStatus || 'ONLINE',
        organization: organization ? {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
        } : undefined,
      },
    };
  }

  private parseExpiry(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 15 * 60 * 1000; // default 15 minutes

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        return 15 * 60 * 1000;
    }
  }
}

