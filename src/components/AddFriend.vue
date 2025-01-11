<template>
    <div class="add-friend">
        <el-input
            v-model="searchUsername"
            placeholder="输入用户名搜索"
            @keyup.enter="handleSearch"
        >
            <template #append>
                <el-button @click="handleSearch">搜索</el-button>
            </template>
        </el-input>

        <div v-if="searchResult" class="search-result">
            <el-card>
                <div class="user-info">
                    <el-avatar :src="searchResult.avatarUrl">
                        {{ searchResult.nickname?.charAt(0) || searchResult.username.charAt(0) }}
                    </el-avatar>
                    <div class="user-details">
                        <div class="username">{{ searchResult.username }}</div>
                        <div class="nickname">{{ searchResult.nickname }}</div>
                    </div>
                    <div class="action">
                        <el-button
                            v-if="!searchResult.friendshipStatus"
                            type="primary"
                            @click="handleAddFriend"
                        >
                            添加好友
                        </el-button>
                        <el-tag v-else-if="searchResult.friendshipStatus === 'pending'">
                            请求已发送
                        </el-tag>
                        <el-tag v-else-if="searchResult.friendshipStatus === 'accepted'" type="success">
                            已是好友
                        </el-tag>
                    </div>
                </div>
            </el-card>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { searchUser, sendFriendRequest } from '../api/friend';
import type { UserSearchResponse } from '../api/friend';

const searchUsername = ref('');
const searchResult = ref<UserSearchResponse | null>(null);

const handleSearch = async () => {
    if (!searchUsername.value) {
        ElMessage.warning('请输入用户名');
        return;
    }

    try {
        const response = await searchUser(searchUsername.value);
        searchResult.value = response.data;
        if (!searchResult.value) {
            ElMessage.info('未找到该用户');
        }
    } catch (error) {
        ElMessage.error('搜索失败');
    }
};

const handleAddFriend = async () => {
    if (!searchResult.value) return;

    try {
        await sendFriendRequest(searchResult.value.username);
        ElMessage.success('好友请求已发送');
        searchResult.value.friendshipStatus = 'pending';
    } catch (error) {
        ElMessage.error('发送好友请求失败');
    }
};
</script>

<style scoped>
.add-friend {
    padding: 20px;
}

.search-result {
    margin-top: 20px;
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

.action {
    margin-left: auto;
}
</style> 