export interface User {
    userId: number;
    username: string;
    nickname?: string;
    avatarUrl?: string;
    status: string;
}

export interface UserSearchResponse {
    userId: number;
    username: string;
    nickname?: string;
    avatarUrl?: string;
    friendshipStatus: string | null;
    requestId?: number;
}

export interface LoginRequest {
    username: string;
    password: string;
}

export interface RegisterRequest {
    username: string;
    password: string;
    nickname?: string;
}

export interface LoginResponse {
    userId: number;
    username: string;
    token: string;
} 