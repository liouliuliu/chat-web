export enum MessageType {
    CONNECT = 'CONNECT',
    PRIVATE_MSG = 'PRIVATE_MSG',
    GROUP_MSG = 'GROUP_MSG',
    SYSTEM_MSG = 'SYSTEM_MSG',
    HEARTBEAT = 'HEARTBEAT'
}

export interface Message {
    type: MessageType;
    fromUserId: string;
    toUserId?: string;
    groupId?: string;
    content: string;
    timestamp: number;
} 