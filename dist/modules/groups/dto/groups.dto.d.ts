import { GroupType } from '@prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
export declare class CreateGroupDto {
    name: string;
    type: GroupType;
    description?: string;
}
export declare class UpdateGroupDto {
    name?: string;
    description?: string;
}
export declare class QueryGroupsDto extends PaginationQueryDto {
    type?: GroupType;
    search?: string;
}
