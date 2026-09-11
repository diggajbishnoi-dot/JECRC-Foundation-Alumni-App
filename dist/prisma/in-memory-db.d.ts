export declare class InMemoryDb {
    users: any[];
    studentDetails: any[];
    alumniDetails: any[];
    mentorProfiles: any[];
    posts: any[];
    discussionThreads: any[];
    discussionReplies: any[];
    discussionUpvotes: any[];
    groups: any[];
    groupMemberships: any[];
    connections: any[];
    mentorshipRequests: any[];
    messages: any[];
    notifications: any[];
    otpVerifications: any[];
    deviceTokens: any[];
    constructor();
    private seed;
    makeDelegate(collectionName: keyof InMemoryDb, relationsMap?: Record<string, {
        collection: keyof InMemoryDb;
        foreignKey: string;
        single?: boolean;
    }>): {
        findUnique(args: any): Promise<any>;
        findFirst(args?: any): Promise<any>;
        findMany(args?: any): Promise<any[]>;
        create(args: any): Promise<any>;
        update(args: any): Promise<any>;
        updateMany(args: any): Promise<{
            count: number;
        }>;
        upsert(args: any): Promise<any>;
        delete(args: any): Promise<any>;
        deleteMany(args?: any): Promise<{
            count: number;
        }>;
        count(args?: any): Promise<number>;
    };
    private matchesWhere;
    private applyOrderBy;
    private expandRelations;
}
