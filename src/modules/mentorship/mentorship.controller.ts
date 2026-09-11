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
import { MentorshipStatus, Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  CreateMentorshipRequestDto,
  MentorOptInDto,
  QueryMentorsDto,
  QueryMyMentorshipsDto,
} from './dto/mentorship.dto';
import { MentorshipService } from './mentorship.service';

@ApiTags('Mentorship Matching')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('mentorship')
export class MentorshipController {
  constructor(private readonly mentorshipService: MentorshipService) {}

  @Post('opt-in')
  @ApiOperation({
    summary: 'Opt in or update mentor profile (Alumni only)',
    description: 'Allows alumni to register domains, availability, and max mentee cap.',
  })
  @ApiResponse({ status: 201, description: 'Mentor profile updated' })
  async optIn(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
    @Body() dto: MentorOptInDto,
  ) {
    return await this.mentorshipService.optInAsMentor(userId, role, dto);
  }

  @Get('mentors')
  @ApiOperation({ summary: 'Browse/search active mentors (filter by domain or company)' })
  async getMentors(@Query() query: QueryMentorsDto) {
    return await this.mentorshipService.getMentors(query);
  }

  @Post('request')
  @ApiOperation({
    summary: 'Request mentorship from an alumni mentor (Students only)',
    description: 'Enforces mentor max mentee capacity check.',
  })
  async requestMentorship(
    @CurrentUser('id') studentId: string,
    @CurrentUser('role') role: Role,
    @Body() dto: CreateMentorshipRequestDto,
  ) {
    return await this.mentorshipService.requestMentorship(studentId, role, dto);
  }

  @Patch(':id/accept')
  @ApiOperation({
    summary: 'Accept mentorship request (Mentor only)',
    description: 'Unlocks one-to-one encrypted chat between student and mentor.',
  })
  async acceptMentorship(
    @CurrentUser('id') mentorId: string,
    @Param('id') requestId: string,
  ) {
    return await this.mentorshipService.acceptMentorship(mentorId, requestId);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Reject mentorship request (Mentor only)' })
  async rejectMentorship(
    @CurrentUser('id') mentorId: string,
    @Param('id') requestId: string,
  ) {
    return await this.mentorshipService.rejectMentorship(mentorId, requestId);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Mark mentorship as COMPLETED' })
  async completeMentorship(
    @CurrentUser('id') userId: string,
    @Param('id') requestId: string,
  ) {
    return await this.mentorshipService.closeMentorship(
      userId,
      requestId,
      MentorshipStatus.COMPLETED,
    );
  }

  @Patch(':id/end')
  @ApiOperation({ summary: 'End mentorship relationship' })
  async endMentorship(
    @CurrentUser('id') userId: string,
    @Param('id') requestId: string,
  ) {
    return await this.mentorshipService.closeMentorship(
      userId,
      requestId,
      MentorshipStatus.ENDED,
    );
  }

  @Get('mine')
  @ApiOperation({ summary: 'Get current user mentorship requests (as student or mentor)' })
  async getMyMentorships(
    @CurrentUser('id') userId: string,
    @Query() query: QueryMyMentorshipsDto,
  ) {
    return await this.mentorshipService.getMyMentorships(userId, query);
  }
}
