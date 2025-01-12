import request from '../utils/request';
import type { UserSearchResponse } from '../types/user';

export const getFriendList = () => {
  return request.get<UserSearchResponse[]>('/friends/list');
};

export const getGroupList = () => {
  return request.get('/groups/list');
};

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