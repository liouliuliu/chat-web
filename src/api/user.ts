import request from '../utils/request';
import type { LoginRequest, RegisterRequest, LoginResponse } from '../types/user';

export const login = (data: LoginRequest) => {
    return request.post<LoginResponse>('/users/login', data);
};

export const register = (data: RegisterRequest) => {
    return request.post<void>('/users/register', data);
};

export const logout = () => {
    return request.post<void>('/users/logout');
}; 