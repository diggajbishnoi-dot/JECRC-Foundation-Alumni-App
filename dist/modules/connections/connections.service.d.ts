import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { PrismaService } from '../../prisma/prisma.service';
export declare class ConnectionsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    sendRequest(requesterId: string, receiverId: string): Promise<{
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
    getAcceptedConnections(userId: string, pagination: PaginationQueryDto): Promise<{
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
    areConnected(userAId: string, userBId: string): Promise<boolean>;
}
