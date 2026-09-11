import { PostType } from '@prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
export declare class CreatePostDto {
    type: PostType;
    title: string;
    description: string;
    company?: string;
    location?: string;
    attachmentUrl?: string;
}
export declare class QueryPostsDto extends PaginationQueryDto {
    type?: PostType;
    location?: string;
}
