import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SendConnectionRequestDto {
  @ApiProperty({ description: 'Target user ID to connect with', example: 'uuid-alumni-123' })
  @IsString()
  @IsNotEmpty()
  receiverId: string;
}
