export interface Friend {
    userId: number;
    username: string;
    nickname?: string;
    avatarUrl?: string;
    status: string;
    lastMessage?: string;
    unreadCount?: number;
}

export interface Group {
    groupId: number;
    name: string;
    avatarUrl?: string;
    memberCount: number;
    lastMessage?: string;
    unreadCount?: number;
}

export type Contact = Friend | Group;

export function isFriend(contact: Contact): contact is Friend {
    return 'userId' in contact && !('groupId' in contact);
}

export function isGroup(contact: Contact): contact is Group {
    return 'groupId' in contact && !('userId' in contact);
} 