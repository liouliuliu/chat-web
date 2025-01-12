import request from '../utils/request';
import type { Message } from '../types/message';

export const getHistoryMessages = (userId: number) => {
    return request.get<Message[]>(`/messages/history/${userId}`);
};

export const getOfflineMessages = () => {
    return request.get<Message[]>('/messages/offline');
}; 