import { defineStore } from 'pinia';
import { login, register } from '../api/user';
import type {  RegisterRequest } from '../types/user';
import { ElMessage } from 'element-plus';
import axios from 'axios';

interface UserState {
    userId: number;
    username: string;
    token: string;
}

export const useUserStore = defineStore({
    id: 'user',
    state: (): UserState => ({
        userId: 0,
        username: '',
        token: localStorage.getItem('token') || ''
    }),

    actions: {
        async login(username: string, password: string) {
            try {
                const response = await login({ username, password });
                console.log('Login response:', response.data);
                
                const { userId, username: name, token } = response.data;
                
                if (!userId || typeof userId !== 'number') {
                    console.error('Invalid userId in response:', userId);
                    throw new Error('Invalid login response: missing or invalid userId');
                }
                
                if (!name || typeof name !== 'string') {
                    console.error('Invalid username in response:', name);
                    throw new Error('Invalid login response: missing or invalid username');
                }
                
                if (!token || typeof token !== 'string') {
                    console.error('Invalid token in response:', token);
                    throw new Error('Invalid login response: missing or invalid token');
                }

                this.$patch({
                    userId: Number(userId),
                    username: name,
                    token
                });
                localStorage.setItem('token', token);
                
                ElMessage.success('登录成功');
                return true;
            } catch (error: any) {
                console.error('Login failed:', error);
                if (error.response?.status === 403) {
                    ElMessage.error('用户名或密码错误');
                } else if (error.message) {
                    ElMessage.error(error.message);
                } else {
                    ElMessage.error('登录失败，请稍后重试');
                }
                return false;
            }
        },

        async register(data: RegisterRequest) {
            try {
                await register(data);
                ElMessage.success('注册成功');
                return true;
            } catch (error: any) {
                console.error('Register failed:', error);
                if (error.response?.status === 409) {
                    ElMessage.error('用户名已存在');
                }
                return false;
            }
        },

        logout() {
            this.$patch({
                userId: 0,
                username: '',
                token: ''
            });
            localStorage.removeItem('token');
        },

        async restoreSession() {
            const token = localStorage.getItem('token');
            if (!token) return false;

            try {
                // 尝试获取用户信息
                const response = await axios.get('/api/users/me', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                const { userId, username } = response.data;
                this.$patch({
                    userId: Number(userId),
                    username,
                    token
                });
                return true;
            } catch (error) {
                console.error('Failed to restore session:', error);
                this.logout();
                return false;
            }
        }
    },

    persist: true
}); 