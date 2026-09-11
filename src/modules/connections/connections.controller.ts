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
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ConnectionsService } from './connections.service';
import { SendConnectionRequestDto } from './dto/connections.dto';

@ApiTags('Connections')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('connections')
export class ConnectionsController {
  constructor(private readonly connectionsService: ConnectionsService) {}

  @Post('request')
  @ApiOperation({ summary: 'Send a connection request' })
  @ApiResponse({ status: 201, description: 'Request sent' })
  async sendRequest(
    @CurrentUser('id') requesterId: string,
    @Body() dto: SendConnectionRequestDto,
  ) {
    return await this.connectionsService.sendRequest(requesterId, dto.receiverId);
  }

  @Patch(':id/accept')
  @ApiOperation({ summary: 'Accept a pending connection request' })
  async acceptRequest(
    @CurrentUser('id') userId: string,
    @Param('id') connectionId: string,
  ) {
    return await this.connectionsService.acceptRequest(userId, connectionId);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Reject a pending connection request' })
  async rejectRequest(
    @CurrentUser('id') userId: string,
    @Param('id') connectionId: string,
  ) {
    return await this.connectionsService.rejectRequest(userId, connectionId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove or disconnect an existing connection' })
  async removeConnection(
    @CurrentUser('id') userId: string,
    @Param('id') connectionId: string,
  ) {
    return await this.connectionsService.removeConnection(userId, connectionId);
  }

  @Get()
  @ApiOperation({ summary: 'List accepted connections with pagination' })
  async getAcceptedConnections(
    @CurrentUser('id') userId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return await this.connectionsService.getAcceptedConnections(userId, query);
  }

  @Get('pending')
  @ApiOperation({ summary: 'List incoming pending connection requests' })
  async getPendingRequests(@CurrentUser('id') userId: string) {
    return await this.connectionsService.getPendingRequests(userId);
  }

  @Get('sent')
  @ApiOperation({ summary: 'List outgoing pending connection requests' })
  async getSentRequests(@CurrentUser('id') userId: string) {
    return await this.connectionsService.getSentRequests(userId);
  }
}
