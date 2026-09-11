import { Role } from '@prisma/client';
export declare class RegisterDto {
    name: string;
    email?: string;
    mobile?: string;
    password: string;
    role: Role;
    publicKey?: string;
    branch?: string;
    currentYear?: number;
    expectedPassoutYear?: number;
    alumniBranch?: string;
    batch?: string;
    passoutYear?: number;
    currentCompany?: string;
    designation?: string;
}
