import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class CreateThreadDto {
  @ApiProperty({ example: 'Best practices for transition from SWE to AI Engineer' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Looking for guidance on what courses, projects, and math background help most...' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'Career Advice', description: 'e.g. Career Advice, Startup Ideas, Higher Studies, General' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiPropertyOptional({ description: 'Optional affinity group ID if scoped to a group' })
  @IsOptional()
  @IsString()
  groupId?: string;
}

export class CreateReplyDto {
  @ApiProperty({ example: 'I transitioned last year. I would strongly recommend starting with hands-on projects...' })
  @IsString()
  @IsNotEmpty()
  content: string;
}

export class QueryThreadsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'Career Advice' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'AI' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ['newest', 'upvotes'], default: 'newest' })
  @IsOptional()
  @IsString()
  sortBy?: 'newest' | 'upvotes';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  groupId?: string;
}
