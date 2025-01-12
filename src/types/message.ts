export enum MessageType {
    CONNECT = 'CONNECT',
    PRIVATE_MSG = 'PRIVATE_MSG',
    GROUP_MSG = 'GROUP_MSG',
    SYSTEM_MSG = 'SYSTEM_MSG'
}

export interface ChatMessage {
    type: MessageType;
    fromUserId: number;
    toUserId?: number;
    groupId?: number;
    content?: string;
    timestamp: number;
}

export interface Message extends ChatMessage {
    id?: number;
    status?: MessageStatus;
}

export enum MessageStatus {
    UNSENT = 'UNSENT',
    SENT = 'SENT',
    DELIVERED = 'DELIVERED',
    READ = 'READ',
    FAILED = 'FAILED'
} 