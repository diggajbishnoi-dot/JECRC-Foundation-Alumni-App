import { ConfigService } from '@nestjs/config';
import { Strategy } from 'passport-jwt';
import { PrismaService } from '../../../prisma/prisma.service';
export interface JwtPayload {
    sub: string;
    email?: string;
    mobile?: string;
    role: string;
}
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly configService;
    private readonly prisma;
    constructor(configService: ConfigService, prisma: PrismaService);
    validate(payload: JwtPayload): Promise<{
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
    } & {
        email: string | null;
        id: string;
        mobile: string | null;
        name: string;
        passwordHash: string;
        role: import(".prisma/client").$Enums.Role;
        isVerified: boolean;
        profilePicUrl: string | null;
        bio: string | null;
        city: string | null;
        publicKey: string | null;
        refreshTokenHash: string | null;
        hideLastSeen: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
export {};
