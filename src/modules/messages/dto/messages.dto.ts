import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({ description: 'Recipient user ID' })
  @IsString()
  @IsNotEmpty()
  receiverId: string;

  /**
   * CRITICAL SECURITY INVARIANT:
   * This field holds encrypted ciphertext or message payload.
   */
  @ApiProperty({
    description: 'Message content or ciphertext',
    example: 'Hello!',
  })
  @IsString()
  @IsNotEmpty()
  encryptedContent: string;

  @ApiProperty({
    description: 'Initialization vector / Nonce required for encrypted message delivery',
    required: true,
    example: 'ubqO67k81zZp18Xz9A7n0Q==',
  })
  @IsString()
  @IsNotEmpty({ message: 'Nonce is required for encrypted message delivery' })
  nonce: string;
}

export class MarkDeliveredDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  messageId: string;
}

export class MarkReadDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  messageId: string;
}
