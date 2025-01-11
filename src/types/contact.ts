export interface Friend {
    userId: number;
    username: string;
    nickname?: string;
    avatarUrl?: string;
    status: string;
}

export interface Group {
    groupId: number;
    name: string;
    avatarUrl?: string;
    memberCount: number;
} 