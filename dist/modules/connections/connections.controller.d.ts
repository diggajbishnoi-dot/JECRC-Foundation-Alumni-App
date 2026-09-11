import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { ConnectionsService } from './connections.service';
import { SendConnectionRequestDto } from './dto/connections.dto';
export declare class ConnectionsController {
    private readonly connectionsService;
    constructor(connectionsService: ConnectionsService);
    sendRequest(requesterId: string, dto: SendConnectionRequestDto): Promise<{
        requesterId: string;
        receiverId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.ConnectionStatus;
    }>;
    acceptRequest(userId: string, connectionId: string): Promise<{
        requesterId: string;
        receiverId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.ConnectionStatus;
    }>;
    rejectRequest(userId: string, connectionId: string): Promise<{
        requesterId: string;
        receiverId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.ConnectionStatus;
    }>;
    removeConnection(userId: string, connectionId: string): Promise<{
        message: string;
    }>;
    getAcceptedConnections(userId: string, query: PaginationQueryDto): Promise<{
        items: {
            connectionId: string;
            connectedSince: Date;
            peer: {
                studentDetails: {
                    userId: string;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    branch: string;
                    currentYear: number;
                    expectedPassoutYear: number;
                };
                alumniDetails: {
                    userId: string;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    branch: string;
                    batch: string;
                    passoutYear: number;
                    currentCompany: string;
                    designation: string;
                };
                id: string;
                name: string;
                role: import(".prisma/client").$Enums.Role;
                profilePicUrl: string;
            };
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getPendingRequests(userId: string): Promise<({
        requester: {
            studentDetails: {
                userId: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                branch: string;
                currentYear: number;
                expectedPassoutYear: number;
            };
            alumniDetails: {
                userId: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                branch: string;
                batch: string;
                passoutYear: number;
                currentCompany: string;
                designation: string;
            };
            id: string;
            name: string;
            role: import(".prisma/client").$Enums.Role;
            profilePicUrl: string;
        };
    } & {
        requesterId: string;
        receiverId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.ConnectionStatus;
    })[]>;
    getSentRequests(userId: string): Promise<({
        receiver: {
            studentDetails: {
                userId: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                branch: string;
                currentYear: number;
                expectedPassoutYear: number;
            };
            alumniDetails: {
                userId: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                branch: string;
                batch: string;
                passoutYear: number;
                currentCompany: string;
                designation: string;
            };
            id: string;
            name: string;
            role: import(".prisma/client").$Enums.Role;
            profilePicUrl: string;
        };
    } & {
        requesterId: string;
        receiverId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.ConnectionStatus;
    })[]>;
}
