import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email do usuário',
  })
  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  email: string;

  @ApiProperty({
    example: 'Senha@123',
    description: 'Senha do usuário (mínimo 8 caracteres)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @MinLength(8, { message: 'Senha deve ter no mínimo 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Senha deve conter letras maiúsculas, minúsculas e números',
  })
  password: string;

  @ApiProperty({
    example: 'João',
    description: 'Primeiro nome',
  })
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @MinLength(2, { message: 'Nome deve ter no mínimo 2 caracteres' })
  @MaxLength(50, { message: 'Nome deve ter no máximo 50 caracteres' })
  firstName: string;

  @ApiProperty({
    example: 'Silva',
    description: 'Sobrenome',
  })
  @IsString()
  @IsNotEmpty({ message: 'Sobrenome é obrigatório' })
  @MinLength(2, { message: 'Sobrenome deve ter no mínimo 2 caracteres' })
  @MaxLength(50, { message: 'Sobrenome deve ter no máximo 50 caracteres' })
  lastName: string;

  @ApiPropertyOptional({
    example: 'Minha Empresa',
    description: 'Nome da organização',
  })
  @IsString()
  @IsOptional()
  organizationName?: string;

  @ApiPropertyOptional({
    example: 'minha-empresa',
    description: 'Slug da organização (identificador único)',
  })
  @IsString()
  @IsOptional()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug deve conter apenas letras minúsculas, números e hífens',
  })
  organizationSlug?: string;
}

