<template>
  <div class="sidebar">
    <div class="user-info">
      <el-avatar 
        :size="50" 
        :src="userStore.avatarUrl || defaultAvatar"
        @click="goToProfile"
      />
      <div class="user-details">
        <span class="username">{{ userStore.username }}</span>
        <el-button type="text" @click="logout">退出</el-button>
      </div>
    </div>
    
    <div class="contacts">
      <div class="section-title">联系人</div>
      <div 
        v-for="friend in friends" 
        :key="friend.userId"
        class="contact-item"
        :class="{ active: currentContact?.userId === friend.userId }"
        @click="selectContact(friend)"
      >
        <el-avatar :size="40" :src="friend.avatarUrl || defaultAvatar" />
        <div class="contact-info">
          <span class="contact-name">{{ friend.nickname || friend.username }}</span>
          <el-image 
            v-if="friend.gender"
            :src="friend.gender === 'MALE' ? maleIcon : femaleIcon"
            class="gender-icon"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user'
import { ElMessage } from 'element-plus'
import defaultAvatar from '../assets/default-avatar.svg'
import maleIcon from '../assets/male.svg'
import femaleIcon from '../assets/female.svg'

const router = useRouter()
const userStore = useUserStore()

const goToProfile = () => {
  router.push('/profile')
}

const logout = async () => {
  try {
    await userStore.logout()
    router.push('/login')
  } catch (error) {
    ElMessage.error('退出失败')
  }
}

// ... 其他现有代码 ...
</script>

<style scoped>
.sidebar {
  width: 250px;
  height: 100%;
  border-right: 1px solid #dcdfe6;
  background-color: #f5f7fa;
}

.user-info {
  padding: 20px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #dcdfe6;
}

.user-details {
  margin-left: 10px;
  display: flex;
  flex-direction: column;
}

.username {
  font-weight: bold;
  margin-bottom: 5px;
}

.contacts {
  padding: 20px;
}

.section-title {
  font-weight: bold;
  margin-bottom: 15px;
  color: #606266;
}

.contact-item {
  display: flex;
  align-items: center;
  padding: 10px;
  cursor: pointer;
  border-radius: 4px;
  margin-bottom: 5px;
}

.contact-item:hover {
  background-color: #ecf5ff;
}

.contact-item.active {
  background-color: #ecf5ff;
}

.contact-info {
  margin-left: 10px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.contact-name {
  font-size: 14px;
}

.gender-icon {
  width: 16px;
  height: 16px;
}

.el-avatar {
  cursor: pointer;
}
</style> 