export declare class PaginationQueryDto {
    page?: number;
    limit?: number;
    get skip(): number;
    get take(): number;
}
