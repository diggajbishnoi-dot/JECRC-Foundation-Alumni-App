import { ApiPropertyOptional } from '@nestjs/swagger';
import { Platform, Role } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Arjun Mehta' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Tech enthusiast and open source contributor' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ example: 'Jaipur, India' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'Computer Science and Engineering' })
  @IsOptional()
  @IsString()
  branch?: string;

  @ApiPropertyOptional({ example: '2024' })
  @IsOptional()
  @IsString()
  batch?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  hideLastSeen?: boolean;

  // Optional updates for alumni
  @ApiPropertyOptional({ example: 'Microsoft' })
  @IsOptional()
  @IsString()
  currentCompany?: string;

  @ApiPropertyOptional({ example: 'Principal Engineer' })
  @IsOptional()
  @IsString()
  designation?: string;
}

export class UploadPublicKeyDto {
  @ApiPropertyOptional({
    description: 'X25519 Public Key (Base64 or Hex encoded) generated on client device for E2E encryption',
    example: 'dGhpcy1pcy1hLXZhbGlkLXgyNTUxOS1wdWJsaWMta2V5',
  })
  @IsString()
  @IsNotEmpty()
  publicKey: string;
}

export class RegisterDeviceTokenDto {
  @ApiPropertyOptional({
    description: 'Firebase Cloud Messaging (FCM) device registration token',
    example: 'fcm_token_abc_123_xyz',
  })
  @IsString()
  @IsNotEmpty()
  fcmToken: string;

  @ApiPropertyOptional({ enum: Platform, default: Platform.ANDROID })
  @IsEnum(Platform)
  platform: Platform;
}

export class SearchUsersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'Rahul' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ enum: Role })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({ example: 'Computer Science and Engineering' })
  @IsOptional()
  @IsString()
  branch?: string;

  @ApiPropertyOptional({ example: '2019-2023' })
  @IsOptional()
  @IsString()
  batch?: string;

  @ApiPropertyOptional({ example: 2023 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  passoutYear?: number;

  @ApiPropertyOptional({ example: 'Google' })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiPropertyOptional({ example: 'Bengaluru' })
  @IsOptional()
  @IsString()
  city?: string;
}
