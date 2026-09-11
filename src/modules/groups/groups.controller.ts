import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateThreadDto } from '../discussions/dto/discussions.dto';
import { CreateGroupDto, QueryGroupsDto, UpdateGroupDto } from './dto/groups.dto';
import { GroupsService } from './groups.service';

@ApiTags('Affinity Groups')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create an Affinity Group',
    description: 'Create a Batch group (e.g. CSE 2020) or Interest group (e.g. Startup Founders).',
  })
  @ApiResponse({ status: 201, description: 'Group created' })
  async createGroup(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateGroupDto,
  ) {
    return await this.groupsService.createGroup(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all groups (filter by type or keyword)' })
  async getGroups(
    @Query() query: QueryGroupsDto,
    @CurrentUser('id') currentUserId: string,
  ) {
    return await this.groupsService.getGroups(query, currentUserId);
  }

  @Get('suggested')
  @ApiOperation({
    summary: 'Auto-suggested groups',
    description: 'Suggests groups matching current user batch, branch, or graduation year.',
  })
  async getSuggestedGroups(@CurrentUser('id') userId: string) {
    return await this.groupsService.getSuggestedGroups(userId);
  }

  @Post(':id/join')
  @ApiOperation({ summary: 'Join an affinity group' })
  async joinGroup(
    @Param('id') groupId: string,
    @CurrentUser('id') userId: string,
  ) {
    return await this.groupsService.joinGroup(groupId, userId);
  }

  @Delete(':id/leave')
  @ApiOperation({ summary: 'Leave an affinity group' })
  async leaveGroup(
    @Param('id') groupId: string,
    @CurrentUser('id') userId: string,
  ) {
    return await this.groupsService.leaveGroup(groupId, userId);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'List group members with pagination' })
  async getGroupMembers(
    @Param('id') groupId: string,
    @Query() pagination: PaginationQueryDto,
  ) {
    return await this.groupsService.getGroupMembers(groupId, pagination);
  }

  @Get(':id/discussions')
  @ApiOperation({ summary: 'Get discussions scoped to this group' })
  async getGroupDiscussions(
    @Param('id') groupId: string,
    @Query() pagination: PaginationQueryDto,
    @CurrentUser('id') currentUserId: string,
  ) {
    return await this.groupsService.getGroupDiscussions(
      groupId,
      pagination,
      currentUserId,
    );
  }

  @Post(':id/discussions')
  @ApiOperation({ summary: 'Post a new discussion thread inside a group (members only)' })
  async createGroupDiscussion(
    @Param('id') groupId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateThreadDto,
  ) {
    return await this.groupsService.createGroupDiscussion(groupId, userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update group name/description (Admin or Creator)' })
  async updateGroup(
    @Param('id') groupId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
    @Body() dto: UpdateGroupDto,
  ) {
    return await this.groupsService.updateGroup(groupId, userId, role, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete group (Creator or Platform Admin only)' })
  async deleteGroup(
    @Param('id') groupId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return await this.groupsService.deleteGroup(groupId, userId, role);
  }
}
