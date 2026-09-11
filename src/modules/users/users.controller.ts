import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  RegisterDeviceTokenDto,
  SearchUsersQueryDto,
  UpdateProfileDto,
  UploadPublicKeyDto,
} from './dto/users.dto';
import { UsersService } from './users.service';

@ApiTags('Users & Profiles')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile', description: 'Returns authenticated profile with stats' })
  async getMe(@CurrentUser('id') userId: string) {
    return await this.usersService.getMe(userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update profile details' })
  async updateMe(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return await this.usersService.updateMe(userId, dto);
  }

  @Delete('me')
  @ApiOperation({ summary: 'Delete current user account permanently' })
  async deleteMe(@CurrentUser('id') userId: string) {
    return await this.usersService.deleteAccount(userId);
  }

  @Post('me/profile-picture')
  @ApiOperation({ summary: 'Upload avatar to S3' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfilePicture(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: any,
  ) {
    return await this.usersService.uploadProfilePicture(userId, file);
  }

  @Post('me/public-key')
  @ApiOperation({
    summary: 'Upload device X25519 public key',
    description: 'Enables WhatsApp-style E2E encrypted messaging. The server stores only this public key.',
  })
  async savePublicKey(
    @CurrentUser('id') userId: string,
    @Body() dto: UploadPublicKeyDto,
  ) {
    return await this.usersService.savePublicKey(userId, dto);
  }

  @Post('me/device-token')
  @ApiOperation({ summary: 'Register FCM device token for push notifications' })
  async registerDeviceToken(
    @CurrentUser('id') userId: string,
    @Body() dto: RegisterDeviceTokenDto,
  ) {
    return await this.usersService.registerDeviceToken(userId, dto);
  }

  @Public()
  @Get('search')
  @ApiOperation({
    summary: 'Search & filter directory',
    description: 'Filter students & alumni by role, branch, batch, company, or city with pagination.',
  })
  async searchUsers(@Query() query: SearchUsersQueryDto) {
    return await this.usersService.searchUsers(query);
  }

  @Get(':id/public-key')
  @ApiOperation({
    summary: 'Fetch recipient public key',
    description: 'Allows client device to derive shared secret and encrypt message prior to transmission.',
  })
  async getPublicKey(@Param('id') id: string) {
    return await this.usersService.getPublicKey(id);
  }

  @Get(':id/presence')
  @ApiOperation({
    summary: 'Get online/offline status and last seen',
    description: 'Fetches real-time status from Redis. Respects user privacy hideLastSeen flag.',
  })
  async getPresence(
    @Param('id') targetId: string,
    @CurrentUser('id') currentUserId: string,
  ) {
    return await this.usersService.getPresence(targetId, currentUserId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'View user profile',
    description: 'Returns profile details. Sensitive contact info is restricted to accepted connections.',
  })
  async getUserById(
    @Param('id') targetId: string,
    @CurrentUser('id') currentUserId: string,
  ) {
    return await this.usersService.getUserById(targetId, currentUserId);
  }
}
