import request from '../utils/request';

export interface LoginRequest {
    username: string;
    password: string;
}

export interface RegisterRequest {
    username: string;
    password: string;
    nickname?: string;
}

export const login = (data: LoginRequest) => {
    return request.post('/users/login', data);
};

export const register = (data: RegisterRequest) => {
    return request.post('/users/register', data);
}; 