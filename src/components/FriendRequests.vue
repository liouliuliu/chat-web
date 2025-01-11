<template>
    <div class="friend-requests">
        <div v-if="requests.length === 0" class="empty-text">
            暂无好友请求
        </div>
        <el-card v-for="request in requests" :key="request.requestId" class="request-item">
            <div class="user-info">
                <el-avatar :src="request.avatarUrl">
                    {{ request.nickname?.charAt(0) || request.username.charAt(0) }}
                </el-avatar>
                <div class="user-details">
                    <div class="username">{{ request.username }}</div>
                    <div class="nickname">{{ request.nickname }}</div>
                </div>
                <div class="actions">
                    <el-button type="primary" size="small" @click="handleRequest(request.requestId, true)">
                        接受
                    </el-button>
                    <el-button type="danger" size="small" @click="handleRequest(request.requestId, false)">
                        拒绝
                    </el-button>
                </div>
            </div>
        </el-card>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { getPendingRequests, handleFriendRequest } from '../api/friend';
import type { UserSearchResponse } from '../api/friend';

const emit = defineEmits(['friendAccepted']);
const requests = ref<UserSearchResponse[]>([]);

const loadRequests = async () => {
    try {
        const response = await getPendingRequests();
        requests.value = response.data;
    } catch (error) {
        ElMessage.error('加载好友请求失败');
    }
};

const handleRequest = async (requestId: number, accept: boolean) => {
    try {
        await handleFriendRequest(requestId, accept);
        ElMessage.success(accept ? '已接受好友请求' : '已拒绝好友请求');
        requests.value = requests.value.filter(req => req.requestId !== requestId);
        
        // 如果接受了好友请求，触发事件通知父组件刷新好友列表
        if (accept) {
            emit('friendAccepted');
        }
    } catch (error) {
        ElMessage.error('处理好友请求失败');
    }
};

onMounted(() => {
    loadRequests();
});
</script>

<style scoped>
.friend-requests {
    padding: 20px;
}

.empty-text {
    text-align: center;
    color: #909399;
    padding: 20px;
}

.request-item {
    margin-bottom: 10px;
}

.user-info {
    display: flex;
    align-items: center;
    gap: 16px;
}

.user-details {
    flex: 1;
}

.username {
    font-weight: bold;
}

.nickname {
    color: #666;
    font-size: 14px;
}

.actions {
    display: flex;
    gap: 8px;
}
</style> 