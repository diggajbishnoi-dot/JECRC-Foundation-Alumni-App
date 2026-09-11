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
            branch: string;
            currentYear: number;
            expectedPassoutYear: number;
            id: string;
            createdAt: Date;
            updatedAt: Date;
        };
        alumniDetails: {
            userId: string;
            branch: string;
            batch: string;
            passoutYear: number;
            currentCompany: string;
            designation: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        name: string;
        role: import(".prisma/client").$Enums.Role;
        city: string | null;
        email: string | null;
        mobile: string | null;
        publicKey: string | null;
        id: string;
        passwordHash: string;
        isVerified: boolean;
        profilePicUrl: string | null;
        bio: string | null;
        refreshTokenHash: string | null;
        hideLastSeen: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
export {};
