import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePostDto, QueryPostsDto } from './dto/posts.dto';

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a post (General, Job opening, or Internship)
   */
  async createPost(userId: string, dto: CreatePostDto) {
    const post = await this.prisma.post.create({
      data: {
        userId,
        type: dto.type,
        title: dto.title,
        description: dto.description,
        company: dto.company || null,
        location: dto.location || null,
        attachmentUrl: dto.attachmentUrl || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
            profilePicUrl: true,
            alumniDetails: true,
          },
        },
      },
    });

    return post;
  }

  /**
   * Get paginated post feed
   */
  async getPostsFeed(query: QueryPostsDto) {
    const where: Prisma.PostWhereInput = {};

    if (query.type) {
      where.type = query.type;
    }

    if (query.location) {
      where.location = { contains: query.location, mode: 'insensitive' };
    }

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              role: true,
              profilePicUrl: true,
              alumniDetails: true,
              studentDetails: true,
            },
          },
        },
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      items: posts,
      meta: {
        total,
        page: query.page || 1,
        limit: query.limit || 20,
        totalPages: Math.ceil(total / (query.limit || 20)),
      },
    };
  }

  /**
   * Get a single post by ID
   */
  async getPostById(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
            profilePicUrl: true,
            alumniDetails: true,
            studentDetails: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return post;
  }

  /**
   * Delete post (owner or admin only)
   */
  async deletePost(id: string, userId: string, role: Role) {
    const post = await this.prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.userId !== userId && role !== Role.ADMIN) {
      throw new ForbiddenException('You do not have permission to delete this post');
    }

    await this.prisma.post.delete({
      where: { id },
    });

    return { message: 'Post deleted successfully' };
  }

  /**
   * Report/Flag a post
   */
  async reportPost(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const updated = await this.prisma.post.update({
      where: { id },
      data: { reportCount: { increment: 1 } },
    });

    return {
      message: 'Post reported to moderation queue. Thank you for keeping our community safe.',
      reportCount: updated.reportCount,
    };
  }
}
