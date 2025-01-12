<template>
    <div class="chat-container">
        <el-container>
            <el-aside width="250px">
                <div class="sidebar">
                    <div class="user-info">
                        <div class="user-profile-link" @click="goToProfile">
                            <el-avatar 
                                :size="40" 
                                :src="userStore.avatarUrl || defaultAvatar"
                            >
                                {{ userStore.nickname?.charAt(0) || userStore.username.charAt(0) }}
                            </el-avatar>
                            <div class="user-details">
                                <span class="username">{{ userStore.nickname || userStore.username }}</span>
                                <span class="user-id">ID: {{ userStore.userId }}</span>
                            </div>
                        </div>
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
                                <el-dropdown 
                                    v-for="friend in friends" 
                                    :key="friend.userId"
                                    trigger="click"
                                    @command="handleCommand($event, friend)"
                                >
                                    <div :class="['contact-item', { active: currentContact && isFriend(currentContact) && currentContact.userId === friend.userId }]">
                                        <el-avatar :size="32" :src="friend.avatarUrl">
                                            {{ friend.nickname?.charAt(0) || friend.username.charAt(0) }}
                                        </el-avatar>
                                        <div class="contact-info">
                                            <div class="contact-name">{{ friend.nickname || friend.username }}</div>
                                            <div class="contact-status" :class="friend.status">{{ friend.status }}</div>
                                        </div>
                                    </div>
                                    <template #dropdown>
                                        <el-dropdown-menu>
                                            <el-dropdown-item command="chat">发送消息</el-dropdown-item>
                                            <el-dropdown-item command="profile">查看资料</el-dropdown-item>
                                            <el-dropdown-item command="delete" divided>删除好友</el-dropdown-item>
                                        </el-dropdown-menu>
                                    </template>
                                </el-dropdown>
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
                                     :class="['contact-item', { active: currentContact && isGroup(currentContact) && currentContact.groupId === group.groupId }]"
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
                             :key="msg.id || msg.createdAt"
                             :class="['message', { 'message-self': msg.fromUserId === userStore.userId }]">
                            <div class="message-content">{{ msg.content }}</div>
                            <div class="message-time">{{ formatTime(msg.createdAt) }}</div>
                        </div>
                    </div>
                    <div class="input-container">
                        <el-input v-model="messageInput" 
                                 type="textarea" 
                                 :rows="3"
                                 @keyup.enter.prevent="sendMessage" />
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

        <!-- 添加用户资料对话框 -->
        <user-profile
          v-model:visible="showUserProfile"
          :user-id="selectedUserId"
          @send-message="handleSendMessageFromProfile"
        />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../store/user';
import { WebSocketClient } from '../utils/websocket';
import { Message, MessageType } from '../types/message';
import { Friend, Group, Contact, isFriend, isGroup } from '../types/contact';
import type { UserSearchResponse } from '../types/user';
import { ElMessage } from 'element-plus';
import AddFriend from '../components/AddFriend.vue';
import FriendRequests from '../components/FriendRequests.vue';
import UserProfile from './UserProfile.vue';
import defaultAvatar from '../assets/default-avatar.svg';
import { getFriendList, getGroupList, getPendingRequests } from '../api/friend';
import { getHistoryMessages, getOfflineMessages } from '../api/message';

const router = useRouter();
const userStore = useUserStore();
const wsUrl = `ws://${window.location.hostname}:9000/ws`;
const wsClient = new WebSocketClient(wsUrl);
let wsConnected = ref(false);

const activeCollapse = ref(['friends', 'groups']);
const friends = ref<Friend[]>([]);
const groups = ref<Group[]>([]);
const currentContact = ref<Contact | null>(null);
const messages = ref<Message[]>([]);
const messageInput = ref('');
const showAddFriend = ref(false);
const showFriendRequests = ref(false);
const pendingRequestCount = ref(0);
const messageContainer = ref<HTMLElement | null>(null);
const showUserProfile = ref(false);
const selectedUserId = ref<number | null>(null);

// 加载好友列表
const loadFriends = async () => {
    try {
        const response = await getFriendList();
        friends.value = response.data.map(user => ({
            userId: user.userId,
            username: user.username,
            nickname: user.nickname,
            avatarUrl: user.avatarUrl,
            status: 'offline'
        }));
    } catch (error) {
        console.error('Failed to load friends:', error);
        ElMessage.error('加载好友列表失败');
    }
};

// 加载群组列表
const loadGroups = async () => {
    try {
        const response = await getGroupList();
        groups.value = response.data;
    } catch (error) {
        console.error('Failed to load groups:', error);
    }
};

// 在 script setup 中添加消息处理相关的函数
const handleOfflineMessages = (messages: Message[], contact: Contact | null) => {
    if (!contact || !isFriend(contact)) return [];
    return messages.filter(msg => 
        msg.fromUserId === contact.userId ||
        msg.toUserId === contact.userId
    );
};

const isRelevantMessage = (message: Message, contact: Contact | null): boolean => {
    if (!contact || !isFriend(contact)) return false;
    return message.fromUserId === contact.userId || 
           message.toUserId === contact.userId;
};

onMounted(async () => {
    console.log('Chat component mounted');
    console.log('User store state:', userStore.$state);
    
    const userId = Number(userStore.userId);
    console.log('Current user ID:', userId);
    
    if (!userId || isNaN(userId)) {
        console.error('Invalid user ID:', userId);
        ElMessage.error('用户信息无效，请重新登录');
        router.push('/login');
        return;
    }
    
    try {
        // 连接 WebSocket
        await wsClient.connect(userId);
        wsConnected.value = true;
        console.log('WebSocket connected successfully');

        // 加载离线消息
        const offlineMessages = await getOfflineMessages();
        if (offlineMessages.data.length > 0) {
            ElMessage.info(`您有 ${offlineMessages.data.length} 条未读消息`);
            // 如果当前已选中联系人，直接显示相关消息
            const relevantMessages = handleOfflineMessages(offlineMessages.data, currentContact.value);
            if (relevantMessages.length > 0) {
                messages.value.push(...relevantMessages);
            }
        }
    } catch (error) {
        console.error('Failed to connect WebSocket:', error);
        ElMessage.error('聊天服务连接失败，请刷新页面重试');
    }

    loadFriends();
    loadGroups();
    loadPendingRequestCount();
    
    // 监听消息
    wsClient.onMessage((message: Message) => {
        console.log('Received message:', message);
        if (isRelevantMessage(message, currentContact.value)) {
            messages.value.push(message);
            nextTick(() => {
                scrollToBottom();
            });
        } else {
            ElMessage.info(`收到来自 ${message.fromUserId} 的新消息`);
        }
    });
});

const selectContact = async (contact: Contact) => {
    currentContact.value = contact;
    messages.value = []; // 清空消息
    
    if (isFriend(contact)) {
        try {
            // 加载历史消息
            const response = await getHistoryMessages(contact.userId);
            messages.value = response.data;
            nextTick(() => {
                scrollToBottom();
            });
        } catch (error) {
            console.error('Failed to load history messages:', error);
            ElMessage.error('加载历史消息失败');
        }
    }
};

const sendMessage = async () => {
    if (!messageInput.value.trim() || !currentContact.value || !isFriend(currentContact.value)) {
        return;
    }

    if (!wsConnected.value) {
        ElMessage.warning('正在连接聊天服务，请稍后重试');
        return;
    }

    const message: Message = {
        type: MessageType.PRIVATE_MSG,
        fromUserId: Number(userStore.userId),
        toUserId: currentContact.value.userId,
        content: messageInput.value.trim(),
        createdAt: new Date().toISOString()
    };

    try {
        console.log('Preparing to send message:', message);
        wsClient.sendMessage(message);
        console.log('Message sent successfully');
        
        messages.value.push(message);
        messageInput.value = '';
        
        nextTick(() => {
            scrollToBottom();
        });
    } catch (error) {
        console.error('Failed to send message:', error);
        ElMessage.error('发送消息失败: ' + (error instanceof Error ? error.message : String(error)));
    }
};

const handleLogout = () => {
    userStore.logout();
    wsClient.disconnect();
    router.push('/');
};

const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
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

// 处理好友操作命令
const handleCommand = (command: string, friend: Friend) => {
    switch (command) {
        case 'chat':
            selectContact(friend);
            break;
        case 'profile':
            showProfile(friend.userId);
            break;
        case 'delete':
            // TODO: 删除好友
            ElMessage.warning('确定要删除该好友吗？');
            break;
    }
};

const showProfile = (userId: number) => {
    selectedUserId.value = userId;
    showUserProfile.value = true;
};

// 处理从用户资料卡片发起聊天
const handleSendMessageFromProfile = (user: Friend) => {
    selectContact(user);
};

// 确保在组件卸载时断开WebSocket连接
onUnmounted(() => {
    console.log('Chat component unmounting, disconnecting WebSocket...');
    wsClient.disconnect();
});

const goToProfile = () => {
    router.push('/profile');
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

.user-profile-link {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
}

.user-profile-link:hover {
    opacity: 0.8;
}

.user-details {
    display: flex;
    flex-direction: column;
}

.username {
    font-weight: bold;
    font-size: 14px;
}

.user-id {
    font-size: 12px;
    color: #909399;
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
    width: 100%;
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

:deep(.el-dropdown) {
    display: block;
    width: 100%;
}

:deep(.el-dropdown-menu__item) {
    display: flex;
    align-items: center;
    gap: 8px;
}

:deep(.el-dropdown-menu__item.is-disabled) {
    cursor: not-allowed;
}
</style> 