import { defineStore } from 'pinia';
import { login, register } from '../api/user';

export const useUserStore = defineStore('user', {
    state: () => ({
        userId: '',
        username: '',
        token: '',
        isLoggedIn: false,
    }),
    
    actions: {
        async login(username: string, password: string) {
            try {
                const response = await login({ username, password });
                const { token } = response.data;
                this.token = token;
                this.username = username;
                this.isLoggedIn = true;
                localStorage.setItem('token', token);
                return true;
            } catch (error) {
                console.error('Login failed:', error);
                return false;
            }
        },

        async register(username: string, password: string, nickname?: string) {
            try {
                await register({ username, password, nickname });
                return true;
            } catch (error) {
                console.error('Register failed:', error);
                return false;
            }
        },
        
        logout() {
            this.userId = '';
            this.username = '';
            this.token = '';
            this.isLoggedIn = false;
            localStorage.removeItem('token');
        }
    }
}); 