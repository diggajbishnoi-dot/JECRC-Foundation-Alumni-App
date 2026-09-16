import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Rahul Sharma', description: 'Full name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'rahul@alumni.edu', description: 'Email address (Required for OTP verification)' })
  @IsEmail()
  @IsNotEmpty({ message: 'Email address is required for registration and OTP verification' })
  email: string;

  @ApiPropertyOptional({ example: '+919876543210', description: 'Mobile number with country code' })
  @IsString()
  @IsOptional()
  mobile?: string;

  @ApiProperty({ example: 'P@ssw0rd123', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @ApiProperty({ enum: Role, default: Role.STUDENT })
  @IsEnum(Role)
  role: Role;

  @ApiPropertyOptional({ description: 'Base64/Hex public key for E2E encryption generated on device' })
  @IsOptional()
  @IsString()
  publicKey?: string;

  // Student specific fields
  @ApiPropertyOptional({ example: 'Computer Science and Engineering' })
  @IsOptional()
  @IsString()
  branch?: string;

  @ApiPropertyOptional({ example: 3, description: 'Current year of study (1-5)' })
  @IsOptional()
  @IsInt()
  currentYear?: number;

  @ApiPropertyOptional({ example: 2027, description: 'Expected graduation year' })
  @IsOptional()
  @IsInt()
  expectedPassoutYear?: number;

  // Alumni specific fields
  @ApiPropertyOptional({ example: 'Electrical Engineering' })
  @IsOptional()
  @IsString()
  alumniBranch?: string;

  @ApiPropertyOptional({ example: '2019-2023', description: 'Batch name or year span' })
  @IsOptional()
  @IsString()
  batch?: string;

  @ApiPropertyOptional({ example: 2023, description: 'Graduation passout year' })
  @IsOptional()
  @IsInt()
  passoutYear?: number;

  @ApiPropertyOptional({ example: 'Google', description: 'Current employer' })
  @IsOptional()
  @IsString()
  currentCompany?: string;

  @ApiPropertyOptional({ example: 'Senior Software Engineer', description: 'Job title' })
  @IsOptional()
  @IsString()
  designation?: string;
}
