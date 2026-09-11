import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SendMessageDto } from './dto/messages.dto';
import { MessagesService } from './messages.service';

@ApiTags('Messages & Chat')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @ApiOperation({
    summary: 'Send message',
    description: 'Send a message to a connected user via REST.',
  })
  @ApiResponse({ status: 201, description: 'Message successfully created and sent' })
  async sendMessage(
    @CurrentUser('id') currentUserId: string,
    @Body() dto: SendMessageDto,
  ) {
    return await this.messagesService.sendMessage(currentUserId, dto);
  }

  @Get(':userId')
  @ApiOperation({
    summary: 'Fetch encrypted conversation history',
    description:
      'Returns paginated list of encrypted messages and nonces for local decryption on the client device.',
  })
  @ApiResponse({ status: 200, description: 'List of encrypted messages' })
  async getConversationHistory(
    @CurrentUser('id') currentUserId: string,
    @Param('userId') otherUserId: string,
    @Query() pagination: PaginationQueryDto,
  ) {
    return await this.messagesService.getConversationHistory(
      currentUserId,
      otherUserId,
      pagination,
    );
  }

  @Patch(':userId/read')
  @ApiOperation({
    summary: 'Mark conversation as read',
    description: 'Bulk marks all incoming messages from this user as READ upon opening the chat screen.',
  })
  async markConversationRead(
    @CurrentUser('id') currentUserId: string,
    @Param('userId') otherUserId: string,
  ) {
    return await this.messagesService.markConversationRead(currentUserId, otherUserId);
  }
}
