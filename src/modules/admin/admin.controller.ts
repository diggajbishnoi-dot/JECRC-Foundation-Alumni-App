import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminService } from './admin.service';

@ApiTags('Admin Panel')
@ApiBearerAuth('JWT')
@Roles(Role.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users/unverified')
  @ApiOperation({ summary: 'List alumni pending verification' })
  @ApiResponse({ status: 200, description: 'Unverified alumni list' })
  async getUnverifiedAlumni(@Query() pagination: PaginationQueryDto) {
    return await this.adminService.getUnverifiedAlumni(pagination);
  }

  @Patch('users/:id/verify')
  @ApiOperation({ summary: 'Approve alumni verification' })
  async verifyUser(@Param('id') userId: string) {
    return await this.adminService.verifyUser(userId);
  }

  @Delete('posts/:id')
  @ApiOperation({ summary: 'Remove spam post' })
  async deletePost(@Param('id') postId: string) {
    return await this.adminService.deletePost(postId);
  }

  @Delete('discussions/:id')
  @ApiOperation({ summary: 'Remove spam discussion thread' })
  async deleteDiscussion(@Param('id') threadId: string) {
    return await this.adminService.deleteDiscussion(threadId);
  }

  @Delete('groups/:id')
  @ApiOperation({ summary: 'Remove spam/inappropriate group' })
  async deleteGroup(@Param('id') groupId: string) {
    return await this.adminService.deleteGroup(groupId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get complete platform KPIs & analytics' })
  async getDashboardStats() {
    return await this.adminService.getDashboardStats();
  }
}
