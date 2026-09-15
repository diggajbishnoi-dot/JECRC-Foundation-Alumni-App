import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PostType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class CreatePostDto {
  @ApiProperty({ enum: PostType, default: PostType.GENERAL })
  @IsEnum(PostType)
  type: PostType;

  @ApiProperty({ example: 'Software Engineer II Opening at Microsoft' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'We are hiring for our cloud infrastructure team in Bengaluru...' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ example: 'Microsoft' })
  @ValidateIf((o) => o.type === PostType.JOB || o.type === PostType.INTERNSHIP)
  @IsNotEmpty({ message: 'Company is required for Job or Internship posts' })
  @IsString()
  company?: string;

  @ApiPropertyOptional({ example: 'Bengaluru, India (Hybrid)' })
  @ValidateIf((o) => o.type === PostType.JOB || o.type === PostType.INTERNSHIP)
  @IsNotEmpty({ message: 'Location is required for Job or Internship posts' })
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: '₹12–18 LPA or Undisclosed' })
  @IsOptional()
  @IsString()
  pay?: string;

  @ApiPropertyOptional({ example: 'https://careers.microsoft.com/job/12345 or attachment url' })
  @IsOptional()
  @IsString()
  attachmentUrl?: string;
}

export class QueryPostsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: PostType })
  @IsOptional()
  @IsEnum(PostType)
  type?: PostType;

  @ApiPropertyOptional({ example: 'Bengaluru' })
  @IsOptional()
  @IsString()
  location?: string;
}
