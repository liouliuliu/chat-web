<template>
    <div class="chat-container">
        <el-container>
            <el-aside width="250px">
                <div class="sidebar">
                    <div class="user-info">
                        <span>{{ userStore.username }}</span>
                        <el-button type="text" @click="handleLogout">退出</el-button>
                    </div>

                    <!-- 好友列表 -->
                    <el-collapse v-model="activeCollapse">
                        <el-collapse-item name="friends">
                            <template #title>
                                <div class="collapse-title">
                                    <span>我的好友</span>
                                    <el-tag size="small" round>{{ friends.length }}</el-tag>
                                </div>
                            </template>
                            <div class="contact-list">
                                <div v-for="friend in friends" 
                                     :key="friend.userId"
                                     :class="['contact-item', { active: currentContact?.id === friend.userId }]"
                                     @click="selectContact(friend)">
                                    <el-avatar :size="32" :src="friend.avatarUrl">
                                        {{ friend.nickname?.charAt(0) || friend.username.charAt(0) }}
                                    </el-avatar>
                                    <div class="contact-info">
                                        <div class="contact-name">{{ friend.nickname || friend.username }}</div>
                                        <div class="contact-status" :class="friend.status">{{ friend.status }}</div>
                                    </div>
                                </div>
                            </div>
                        </el-collapse-item>

                        <!-- 群组列表 -->
                        <el-collapse-item name="groups">
                            <template #title>
                                <div class="collapse-title">
                                    <span>我的群组</span>
                                    <el-tag size="small" round>{{ groups.length }}</el-tag>
                                </div>
                            </template>
                            <div class="contact-list">
                                <div v-for="group in groups" 
                                     :key="group.groupId"
                                     :class="['contact-item', { active: currentContact?.id === group.groupId }]"
                                     @click="selectContact(group)">
                                    <el-avatar :size="32" :src="group.avatarUrl">
                                        {{ group.name.charAt(0) }}
                                    </el-avatar>
                                    <div class="contact-info">
                                        <div class="contact-name">{{ group.name }}</div>
                                        <div class="contact-count">{{ group.memberCount }}人</div>
                                    </div>
                                </div>
                            </div>
                        </el-collapse-item>
                    </el-collapse>

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
            <friend-requests @friendAccepted="loadFriends" />
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../store/user';
import { WebSocketClient } from '../utils/websocket';
import { Message } from '../types/message';
import { Friend, Group } from '../types/contact';
import { ElMessage } from 'element-plus';
import AddFriend from '../components/AddFriend.vue';
import FriendRequests from '../components/FriendRequests.vue';
import { getPendingRequests } from '../api/friend';

const router = useRouter();
const userStore = useUserStore();
const wsClient = new WebSocketClient('ws://localhost:8888');

const activeCollapse = ref(['friends', 'groups']);
const friends = ref<Friend[]>([]);
const groups = ref<Group[]>([]);
const currentContact = ref<Friend | Group | null>(null);
const messages = ref<Message[]>([]);
const messageInput = ref('');
const showAddFriend = ref(false);
const showFriendRequests = ref(false);
const pendingRequestCount = ref(0);

// 加载好友列表
const loadFriends = async () => {
    try {
        const response = await fetch('/api/friends/list', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const data = await response.json();
        friends.value = data;
    } catch (error) {
        console.error('Failed to load friends:', error);
        ElMessage.error('加载好友列表失败');
    }
};

// 加载群组列表
const loadGroups = async () => {
    try {
        const response = await fetch('/api/groups/list', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const data = await response.json();
        groups.value = data;
    } catch (error) {
        console.error('Failed to load groups:', error);
    }
};

onMounted(() => {
    loadFriends();
    loadGroups();
    loadPendingRequestCount();
    setInterval(loadPendingRequestCount, 30000);
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
    display: flex;
    flex-direction: column;
}

.user-info {
    padding: 20px;
    border-bottom: 1px solid #dcdfe6;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.collapse-title {
    display: flex;
    align-items: center;
    gap: 8px;
}

.contact-list {
    padding: 4px;
}

.contact-item {
    padding: 8px;
    cursor: pointer;
    border-radius: 4px;
    display: flex;
    align-items: center;
    gap: 12px;
}

.contact-item:hover {
    background-color: #f5f7fa;
}

.contact-item.active {
    background-color: #ecf5ff;
}

.contact-info {
    flex: 1;
    min-width: 0;
}

.contact-name {
    font-size: 14px;
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.contact-status {
    font-size: 12px;
    color: #909399;
}

.contact-status.online {
    color: #67c23a;
}

.contact-status.offline {
    color: #909399;
}

.contact-count {
    font-size: 12px;
    color: #909399;
}

.sidebar-actions {
    margin-top: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
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
</style> 