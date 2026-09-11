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
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreatePostDto, QueryPostsDto } from './dto/posts.dto';
import { PostsService } from './posts.service';

@ApiTags('Posts & Jobs')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a post (General update, Job, or Internship)' })
  @ApiResponse({ status: 201, description: 'Post created successfully' })
  async createPost(
    @CurrentUser('id') userId: string,
    @Body() dto: CreatePostDto,
  ) {
    return await this.postsService.createPost(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get paginated post & job feed' })
  async getPostsFeed(@Query() query: QueryPostsDto) {
    return await this.postsService.getPostsFeed(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get post by ID' })
  async getPostById(@Param('id') id: string) {
    return await this.postsService.getPostById(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a post (Owner or Admin only)' })
  async deletePost(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return await this.postsService.deletePost(id, userId, role);
  }

  @Post(':id/report')
  @ApiOperation({ summary: 'Flag or report an inappropriate post' })
  async reportPost(@Param('id') id: string) {
    return await this.postsService.reportPost(id);
  }
}
