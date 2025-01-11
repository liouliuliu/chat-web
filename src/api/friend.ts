import request from '../utils/request';

export interface UserSearchResponse {
    userId: number;
    username: string;
    nickname: string;
    avatarUrl: string;
    friendshipStatus: string | null;
    requestId?: number;
}

export const searchUser = (username: string) => {
    return request.get<UserSearchResponse>(`/friends/search?username=${username}`);
};

export const sendFriendRequest = (username: string) => {
    return request.post('/friends/request', { username });
};

export const getPendingRequests = () => {
    return request.get<UserSearchResponse[]>('/friends/requests');
};

export const handleFriendRequest = (requestId: number, accept: boolean) => {
    return request.post(`/friends/requests/${requestId}/handle?accept=${accept}`);
}; 