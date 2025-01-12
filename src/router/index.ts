import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '../store/user';
import { ElMessage } from 'element-plus';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            redirect: '/login'
        },
        {
            path: '/login',
            component: () => import('../views/Login.vue')
        },
        {
            path: '/chat',
            component: () => import('../views/Chat.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/profile',
            component: () => import('../views/Profile.vue'),
            meta: { requiresAuth: true }
        }
    ]
});

router.beforeEach(async (to, from, next) => {
    const userStore = useUserStore();
    const token = localStorage.getItem('token');
    
    console.log('Route guard - Current route:', to.path);
    console.log('Route guard - User state:', {
        userId: userStore.userId,
        username: userStore.username,
        token: userStore.token,
        localStorageToken: token
    });
    
    if (to.meta.requiresAuth) {
        if (!token) {
            console.log('No token found in localStorage');
            ElMessage.warning('请先登录');
            next('/login');
            return;
        }

        if (!userStore.userId || !userStore.token) {
            console.log('Store state is invalid, but token exists. Attempting to restore session...');
            try {
                // 等待会话恢复完成
                const restored = await userStore.restoreSession();
                if (!restored) {
                    console.log('Failed to restore session');
                    ElMessage.warning('会话已过期，请重新登录');
                    next('/login');
                    return;
                }
                console.log('Session restored successfully');
            } catch (error) {
                console.error('Error restoring session:', error);
                ElMessage.error('恢复会话失败，请重新登录');
                next('/login');
                return;
            }
        }
    }
    
    if (to.path === '/login' && token) {
        next('/chat');
        return;
    }
    
    next();
});

export default router; 