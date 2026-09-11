import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({ description: 'Recipient user ID' })
  @IsString()
  @IsNotEmpty()
  receiverId: string;

  /**
   * CRITICAL SECURITY INVARIANT:
   * This field holds CIPHERTEXT ONLY. The server must never receive or log plaintext.
   */
  @ApiProperty({
    description: 'Ciphertext only - encrypted on mobile device via X25519 + AES/XSalsa20 before sending',
    example: 'dGhpcyBpcyBhbiBlbmNyeXB0ZWQgY2lwaGVydGV4dA==',
  })
  @IsString()
  @IsNotEmpty()
  encryptedContent: string;

  @ApiProperty({
    description: 'Initialization vector / Nonce generated during client-side encryption',
    example: 'ubqO67k81zZp18Xz9A7n0Q==',
  })
  @IsString()
  @IsNotEmpty()
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
