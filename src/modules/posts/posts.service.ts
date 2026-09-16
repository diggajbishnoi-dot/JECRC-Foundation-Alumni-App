import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../services/storage/storage.service';
import { ApplyJobDto } from './dto/applications.dto';
import { CreatePostDto, QueryPostsDto } from './dto/posts.dto';

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

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
        pay: dto.pay || null,
        deadline: dto.deadline && !isNaN(new Date(dto.deadline).getTime()) ? new Date(dto.deadline) : null,
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
   * Get paginated post feed with application count
   */
  async getPostsFeed(query: QueryPostsDto) {
    // Auto-cleanup expired posts on every feed fetch
    await this.cleanupExpiredPosts();

    const where: Prisma.PostWhereInput = {};

    if (query.type) {
      where.type = query.type;
    }

    if (query.location) {
      where.location = { contains: query.location, mode: 'insensitive' };
    }

    // Only show posts that haven't expired (deadline is null or in the future)
    where.OR = [
      { deadline: null },
      { deadline: { gte: new Date() } },
    ];

    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query?.limit) || 20));
    const skip = (page - 1) * limit;
    const take = limit;

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        skip,
        take,
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
          _count: {
            select: { jobApplications: true },
          },
        },
      }),
      this.prisma.post.count({ where }),
    ]);

    const formattedPosts = posts.map((p: any) => {
      const applicantCount = p._count?.jobApplications ?? p.jobApplications?.length ?? 0;
      const { _count, jobApplications, ...rest } = p;
      return {
        ...rest,
        applicantCount,
      };
    });

    return {
      items: formattedPosts,
      meta: {
        total,
        page: query.page || 1,
        limit: query.limit || 20,
        totalPages: Math.ceil(total / (query.limit || 20)),
      },
    };
  }

  /**
   * Delete all posts whose deadline has passed
   */
  async cleanupExpiredPosts() {
    try {
      const result = await this.prisma.post.deleteMany({
        where: {
          deadline: {
            lt: new Date(),
          },
        },
      });
      if (result.count > 0) {
        console.log(`[PostsService] Auto-deleted ${result.count} expired post(s)`);
      }
    } catch {
      // Silently ignore cleanup errors
    }
  }

  /**
   * Get a single post by ID with application count
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
        _count: {
          select: { jobApplications: true },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const applicantCount = (post as any)._count?.jobApplications ?? (post as any).jobApplications?.length ?? 0;
    const { _count, jobApplications, ...rest } = post as any;

    return {
      ...rest,
      applicantCount,
    };
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

  /**
   * Student applies for a Job/Internship post
   */
  async applyToPost(postId: string, studentId: string, dto: ApplyJobDto) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Opportunity post not found');
    }

    // Check duplicate application
    const existing = await this.prisma.jobApplication.findFirst({
      where: { postId, studentId },
    });

    if (existing) {
      throw new ConflictException('You have already applied to this opportunity');
    }

    // Process resume upload if provided
    let resumeUrl: string | null = null;
    let resumeOriginalName: string | null = dto.resumeFileName || null;

    if (dto.resumeData) {
      resumeUrl = await this.storageService.uploadBase64Document(
        dto.resumeData,
        'resumes',
        dto.resumeFileName || `resume_${studentId.slice(0, 8)}.pdf`,
      );
      if (!resumeOriginalName) {
        resumeOriginalName = dto.resumeFileName || 'resume.pdf';
      }
    }

    const application = await this.prisma.jobApplication.create({
      data: {
        postId,
        studentId,
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone || null,
        college: dto.college || 'JECRC Foundation',
        course: dto.course || null,
        branch: dto.branch || null,
        graduationYear: dto.graduationYear || null,
        skills: dto.skills || [],
        experience: dto.experience || null,
        coverLetter: dto.coverLetter || null,
        resumeUrl,
        resumeOriginalName,
      },
    });

    // Notify post owner (Alumni creator)
    try {
      await this.prisma.notification.create({
        data: {
          userId: post.userId,
          type: 'JOB_APPLICATION_RECEIVED',
          payload: {
            postId: post.id,
            postTitle: post.title,
            studentId,
            applicantName: dto.fullName,
            applicationId: application.id,
          },
        },
      });
    } catch (_err) {
      // Notification creation error is non-fatal for application submission
    }

    return {
      message: 'Application submitted successfully',
      application,
    };
  }

  /**
   * Get all applicants for a Job/Internship post
   * STRICT AUTHORIZATION: ONLY the Alumni creator (post.userId) or ADMIN can access.
   */
  async getPostApplications(postId: string, requestingUserId: string, requestingRole: Role) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Opportunity post not found');
    }

    // STRICT IDOR SECURITY CHECK: Only post creator or Admin allowed!
    if (post.userId !== requestingUserId && requestingRole !== Role.ADMIN) {
      throw new ForbiddenException('Access denied: You are not authorized to view applications for this post');
    }

    const applications = await this.prisma.jobApplication.findMany({
      where: { postId },
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePicUrl: true,
            studentDetails: true,
          },
        },
      },
    });

    return {
      postId,
      postTitle: post.title,
      totalApplicants: applications.length,
      applications,
    };
  }

  /**
   * Get a single application detail by ID
   * STRICT AUTHORIZATION: Post owner, the applicant student, or Admin allowed.
   */
  async getSingleApplication(
    postId: string,
    appId: string,
    requestingUserId: string,
    requestingRole: Role,
  ) {
    const application = await this.prisma.jobApplication.findUnique({
      where: { id: appId },
      include: {
        post: {
          select: {
            id: true,
            title: true,
            userId: true,
          },
        },
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePicUrl: true,
            studentDetails: true,
          },
        },
      },
    });

    if (!application || application.postId !== postId) {
      throw new NotFoundException('Application not found');
    }

    // STRICT IDOR SECURITY CHECK
    const isPostOwner = application.post.userId === requestingUserId;
    const isApplicant = application.studentId === requestingUserId;
    const isAdmin = requestingRole === Role.ADMIN;

    if (!isPostOwner && !isApplicant && !isAdmin) {
      throw new ForbiddenException('Access denied: You do not have authorization to view this application');
    }

    return application;
  }

  /**
   * Get student's own application status for a specific post
   */
  async getMyApplication(postId: string, studentId: string) {
    const application = await this.prisma.jobApplication.findFirst({
      where: { postId, studentId },
    });

    return {
      applied: !!application,
      application: application || null,
    };
  }
}

