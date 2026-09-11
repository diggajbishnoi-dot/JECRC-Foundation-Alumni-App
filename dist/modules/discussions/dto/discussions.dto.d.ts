import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
export declare class CreateThreadDto {
    title: string;
    description: string;
    category: string;
    groupId?: string;
}
export declare class CreateReplyDto {
    content: string;
}
export declare class QueryThreadsDto extends PaginationQueryDto {
    category?: string;
    search?: string;
    sortBy?: 'newest' | 'upvotes';
    groupId?: string;
}
