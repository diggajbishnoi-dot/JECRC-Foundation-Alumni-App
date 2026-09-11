export declare class SendMessageDto {
    receiverId: string;
    encryptedContent: string;
    nonce?: string;
}
export declare class MarkDeliveredDto {
    messageId: string;
}
export declare class MarkReadDto {
    messageId: string;
}
