import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RedisService } from '../../redis/redis.service';
import { MarkDeliveredDto, MarkReadDto, SendMessageDto } from './dto/messages.dto';
import { MessagesService } from './messages.service';
interface AuthenticatedSocket extends Socket {
    userId?: string;
}
export declare class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly messagesService;
    private readonly jwtService;
    private readonly configService;
    private readonly redisService;
    server: Server;
    private readonly logger;
    private typingTimeouts;
    constructor(messagesService: MessagesService, jwtService: JwtService, configService: ConfigService, redisService: RedisService);
    handleConnection(client: AuthenticatedSocket): Promise<void>;
    handleDisconnect(client: AuthenticatedSocket): Promise<void>;
    handleSendMessage(client: AuthenticatedSocket, dto: SendMessageDto): Promise<{
        success: boolean;
        message: {
            receiverId: string;
            senderId: string;
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.MessageStatus;
            encryptedContent: string;
            nonce: string;
        };
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        message?: undefined;
    }>;
    handleMessageDelivered(client: AuthenticatedSocket, dto: MarkDeliveredDto): Promise<{
        success: boolean;
    }>;
    handleMessageRead(client: AuthenticatedSocket, dto: MarkReadDto): Promise<{
        success: boolean;
    }>;
    handleTyping(client: AuthenticatedSocket, data: {
        receiverId: string;
    }): void;
    handleStopTyping(client: AuthenticatedSocket, data: {
        receiverId: string;
    }): void;
}
export {};
