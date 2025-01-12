import axios from 'axios';
import { ElMessage } from 'element-plus';
import { useRouter } from 'vue-router';
import { useUserStore } from '../store/user';

const request = axios.create({
    baseURL: '/api',
    timeout: 5000
});

// 请求拦截器
request.interceptors.request.use(
    config => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    error => {
        console.error('Request error:', error);
        return Promise.reject(error);
    }
);

// 响应拦截器
request.interceptors.response.use(
    response => response,
    async error => {
        console.error('Response error:', error);
        
        if (error.response) {
            switch (error.response.status) {
                case 401:
                    // 清除用户状态
                    const userStore = useUserStore();
                    userStore.logout();
                    ElMessage.error('登录已过期，请重新登录');
                    const router = useRouter();
                    router.push('/login');
                    break;
                case 403:
                    ElMessage.error('没有权限');
                    break;
                case 404:
                    ElMessage.error('请求的资源不存在');
                    break;
                case 500:
                    ElMessage.error('服务器错误');
                    break;
                default:
                    ElMessage.error(error.response.data?.message || '请求失败');
            }
        } else if (error.request) {
            ElMessage.error('网络错误，请检查网络连接');
        } else {
            ElMessage.error('请求配置错误');
        }
        
        return Promise.reject(error);
    }
);

export default request; 