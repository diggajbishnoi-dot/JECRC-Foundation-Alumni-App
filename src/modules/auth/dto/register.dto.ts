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

  @ApiPropertyOptional({ example: 'rahul@alumni.edu', description: 'Email address' })
  @ValidateIf((o) => !o.mobile || o.email)
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '+919876543210', description: 'Mobile number with country code' })
  @ValidateIf((o) => !o.email || o.mobile)
  @IsString()
  @IsOptional()
  mobile?: string;

  @ApiProperty({ example: 'StrongP@ssw0rd!', minLength: 8 })
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
  @ValidateIf((o) => o.role === Role.STUDENT)
  @IsNotEmpty({ message: 'branch is required for students' })
  @IsString()
  branch?: string;

  @ApiPropertyOptional({ example: 3, description: 'Current year of study (1-5)' })
  @ValidateIf((o) => o.role === Role.STUDENT)
  @IsNotEmpty({ message: 'currentYear is required for students' })
  @IsInt()
  currentYear?: number;

  @ApiPropertyOptional({ example: 2027, description: 'Expected graduation year' })
  @ValidateIf((o) => o.role === Role.STUDENT)
  @IsNotEmpty({ message: 'expectedPassoutYear is required for students' })
  @IsInt()
  expectedPassoutYear?: number;

  // Alumni specific fields
  @ApiPropertyOptional({ example: 'Electrical Engineering' })
  @ValidateIf((o) => o.role === Role.ALUMNI)
  @IsNotEmpty({ message: 'alumni branch is required' })
  @IsString()
  alumniBranch?: string;

  @ApiPropertyOptional({ example: '2019-2023', description: 'Batch name or year span' })
  @ValidateIf((o) => o.role === Role.ALUMNI)
  @IsNotEmpty({ message: 'batch is required for alumni' })
  @IsString()
  batch?: string;

  @ApiPropertyOptional({ example: 2023, description: 'Graduation passout year' })
  @ValidateIf((o) => o.role === Role.ALUMNI)
  @IsNotEmpty({ message: 'passoutYear is required for alumni' })
  @IsInt()
  passoutYear?: number;

  @ApiPropertyOptional({ example: 'Google', description: 'Current employer' })
  @ValidateIf((o) => o.role === Role.ALUMNI)
  @IsNotEmpty({ message: 'currentCompany is required for alumni' })
  @IsString()
  currentCompany?: string;

  @ApiPropertyOptional({ example: 'Senior Software Engineer', description: 'Job title' })
  @ValidateIf((o) => o.role === Role.ALUMNI)
  @IsNotEmpty({ message: 'designation is required for alumni' })
  @IsString()
  designation?: string;
}
