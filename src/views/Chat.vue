<template>
    <div class="chat-container">
        <el-container>
            <el-aside width="200px">
                <div class="sidebar">
                    <div class="user-info">
                        {{ userStore.username }}
                        <el-button type="text" @click="handleLogout">退出</el-button>
                    </div>
                    <div class="contact-list">
                        <div v-for="contact in contacts" 
                             :key="contact.id"
                             :class="['contact-item', { active: currentContact?.id === contact.id }]"
                             @click="selectContact(contact)">
                            {{ contact.name }}
                        </div>
                    </div>
                    <div class="sidebar-actions">
                        <el-button @click="showAddFriend = true" type="primary" plain>添加好友</el-button>
                        <el-button @click="showFriendRequests = true" type="info" plain>
                            好友请求
                            <el-badge v-if="pendingRequestCount > 0" :value="pendingRequestCount" />
                        </el-button>
                    </div>
                </div>
            </el-aside>
            
            <el-container>
                <el-main>
                    <div class="message-container" ref="messageContainer">
                        <div v-for="msg in messages" 
                             :key="msg.timestamp"
                             :class="['message', { 'message-self': msg.fromUserId === userStore.userId }]">
                            <div class="message-content">{{ msg.content }}</div>
                            <div class="message-time">{{ formatTime(msg.timestamp) }}</div>
                        </div>
                    </div>
                    <div class="input-container">
                        <el-input v-model="messageInput" 
                                 type="textarea" 
                                 :rows="3"
                                 @keyup.enter="sendMessage" />
                        <el-button type="primary" @click="sendMessage">发送</el-button>
                    </div>
                </el-main>
            </el-container>
        </el-container>

        <!-- 添加好友对话框 -->
        <el-dialog
            v-model="showAddFriend"
            title="添加好友"
            width="500px"
        >
            <add-friend />
        </el-dialog>

        <!-- 好友请求对话框 -->
        <el-dialog v-model="showFriendRequests" title="好友请求" width="500px">
            <friend-requests />
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../store/user';
import { WebSocketClient } from '../utils/websocket';
import { Message, MessageType } from '../types/message';
import { ElMessage } from 'element-plus';
import AddFriend from '../components/AddFriend.vue';
import FriendRequests from '../components/FriendRequests.vue';
import { getPendingRequests } from '../api/friend';

const router = useRouter();
const userStore = useUserStore();
const wsClient = new WebSocketClient('ws://localhost:8888');

const messages = ref<Message[]>([]);
const messageInput = ref('');
const messageContainer = ref<HTMLElement>();

const contacts = ref([
    { id: '1', name: '用户1' },
    { id: '2', name: '用户2' },
    { id: '3', name: '群聊1', isGroup: true }
]);

const currentContact = ref(contacts.value[0]);

const showAddFriend = ref(false);
const showFriendRequests = ref(false);
const pendingRequestCount = ref(0);

onMounted(() => {
    wsClient.connect(userStore.userId);
    wsClient.onMessage((message) => {
        messages.value.push(message);
        scrollToBottom();
    });
    loadPendingRequestCount();
    setInterval(loadPendingRequestCount, 30000);
});

onUnmounted(() => {
    wsClient.disconnect();
});

const selectContact = (contact: any) => {
    currentContact.value = contact;
    messages.value = []; // 清空消息
};

const sendMessage = () => {
    if (!messageInput.value.trim()) {
        return;
    }

    const message: Message = {
        type: currentContact.value.isGroup ? MessageType.GROUP_MSG : MessageType.PRIVATE_MSG,
        fromUserId: userStore.userId,
        toUserId: currentContact.value.isGroup ? undefined : currentContact.value.id,
        groupId: currentContact.value.isGroup ? currentContact.value.id : undefined,
        content: messageInput.value,
        timestamp: Date.now()
    };

    wsClient.sendMessage(message);
    messageInput.value = '';
};

const handleLogout = () => {
    userStore.logout();
    wsClient.disconnect();
    router.push('/');
};

const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
};

const scrollToBottom = () => {
    if (messageContainer.value) {
        messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
    }
};

const loadPendingRequestCount = async () => {
    try {
        const response = await getPendingRequests();
        pendingRequestCount.value = response.data.length;
    } catch (error) {
        console.error('Failed to load pending requests:', error);
    }
};
</script>

<style scoped>
.chat-container {
    height: 100vh;
}

.sidebar {
    height: 100%;
    border-right: 1px solid #dcdfe6;
}

.user-info {
    padding: 20px;
    border-bottom: 1px solid #dcdfe6;
}

.contact-list {
    padding: 10px;
}

.contact-item {
    padding: 10px;
    cursor: pointer;
}

.contact-item.active {
    background-color: #ecf5ff;
}

.message-container {
    height: calc(100vh - 200px);
    overflow-y: auto;
    padding: 20px;
}

.message {
    margin-bottom: 10px;
    display: flex;
    flex-direction: column;
}

.message-self {
    align-items: flex-end;
}

.message-content {
    max-width: 70%;
    padding: 10px;
    border-radius: 4px;
    background-color: #f4f4f5;
}

.message-self .message-content {
    background-color: #ecf5ff;
}

.message-time {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
}

.input-container {
    padding: 20px;
    border-top: 1px solid #dcdfe6;
}

.sidebar-actions {
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 10px;
}
</style> 