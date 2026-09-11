import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MentorshipStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class MentorOptInDto {
  @ApiProperty({
    example: ['Software Engineering', 'System Design', 'FAANG Interview Prep'],
    description: 'Domains and skills available to mentor',
  })
  @IsArray()
  @IsString({ each: true })
  domains: string[];

  @ApiPropertyOptional({
    example: '10+ years in distributed systems. Happy to guide on career, resume, and tech stack.',
  })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({ example: '2 sessions per month (45 mins each)' })
  @IsString()
  @IsNotEmpty()
  availability: string;

  @ApiPropertyOptional({ example: 3, default: 3 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxMentees?: number = 3;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}

export class CreateMentorshipRequestDto {
  @ApiProperty({ description: 'Target alumni mentor user ID' })
  @IsString()
  @IsNotEmpty()
  mentorId: string;

  @ApiProperty({
    example: 'Hi! I am in 3rd year CSE preparing for backend engineering internships and would love your mentorship.',
  })
  @IsString()
  @IsNotEmpty()
  message: string;
}

export class QueryMentorsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'Software Engineering' })
  @IsOptional()
  @IsString()
  domain?: string;

  @ApiPropertyOptional({ example: 'Google' })
  @IsOptional()
  @IsString()
  company?: string;
}

export class QueryMyMentorshipsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: MentorshipStatus })
  @IsOptional()
  @IsEnum(MentorshipStatus)
  status?: MentorshipStatus;
}
