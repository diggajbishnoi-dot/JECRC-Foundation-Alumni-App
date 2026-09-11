import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GroupType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class CreateGroupDto {
  @ApiProperty({ example: 'Bangalore Chapter - Alumni Founders' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: GroupType, default: GroupType.INTEREST })
  @IsEnum(GroupType)
  type: GroupType;

  @ApiPropertyOptional({ example: 'A community of founders, co-founders, and early-stage entrepreneurs from our college.' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateGroupDto {
  @ApiPropertyOptional({ example: 'Updated Group Name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Updated Description' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class QueryGroupsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: GroupType })
  @IsOptional()
  @IsEnum(GroupType)
  type?: GroupType;

  @ApiPropertyOptional({ example: 'Bangalore' })
  @IsOptional()
  @IsString()
  search?: string;
}
