import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { DiscussionsService } from './discussions.service';
import {
  CreateReplyDto,
  CreateThreadDto,
  QueryThreadsDto,
} from './dto/discussions.dto';

@ApiTags('Discussions & Idea Board')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('discussions')
export class DiscussionsController {
  constructor(private readonly discussionsService: DiscussionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new discussion thread' })
  @ApiResponse({ status: 201, description: 'Thread created' })
  async createThread(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateThreadDto,
  ) {
    return await this.discussionsService.createThread(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get paginated discussion threads (filter by category, sort by newest/upvotes)' })
  async getThreads(
    @Query() query: QueryThreadsDto,
    @CurrentUser('id') currentUserId: string,
  ) {
    return await this.discussionsService.getThreads(query, currentUserId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get discussion thread details' })
  async getThreadById(
    @Param('id') id: string,
    @CurrentUser('id') currentUserId: string,
  ) {
    return await this.discussionsService.getThreadById(id, currentUserId);
  }

  @Get(':id/replies')
  @ApiOperation({ summary: 'Get paginated replies for a thread' })
  async getThreadReplies(
    @Param('id') threadId: string,
    @Query() pagination: PaginationQueryDto,
    @CurrentUser('id') currentUserId: string,
  ) {
    return await this.discussionsService.getThreadReplies(
      threadId,
      pagination,
      currentUserId,
    );
  }

  @Post(':id/replies')
  @ApiOperation({ summary: 'Add a reply to a discussion thread' })
  async createReply(
    @Param('id') threadId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateReplyDto,
  ) {
    return await this.discussionsService.createReply(threadId, userId, dto);
  }

  @Post(':id/upvote')
  @ApiOperation({ summary: 'Toggle upvote on a discussion thread' })
  async toggleThreadUpvote(
    @Param('id') threadId: string,
    @CurrentUser('id') userId: string,
  ) {
    return await this.discussionsService.toggleThreadUpvote(threadId, userId);
  }

  @Post(':id/replies/:replyId/upvote')
  @ApiOperation({ summary: 'Toggle upvote on a reply' })
  async toggleReplyUpvote(
    @Param('replyId') replyId: string,
    @CurrentUser('id') userId: string,
  ) {
    return await this.discussionsService.toggleReplyUpvote(replyId, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete thread (Owner or Admin)' })
  async deleteThread(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return await this.discussionsService.deleteThread(id, userId, role);
  }

  @Delete(':id/replies/:replyId')
  @ApiOperation({ summary: 'Delete reply (Owner or Admin)' })
  async deleteReply(
    @Param('id') threadId: string,
    @Param('replyId') replyId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return await this.discussionsService.deleteReply(replyId, userId, role);
  }

  @Post(':id/report')
  @ApiOperation({ summary: 'Flag or report a thread' })
  async reportThread(@Param('id') id: string) {
    return await this.discussionsService.reportThread(id);
  }
}
