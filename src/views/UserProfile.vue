<template>
  <el-dialog
    :visible="visible"
    @update:visible="emit('update:visible', $event)"
    width="360px"
    :show-close="false"
    class="user-profile-dialog"
  >
    <div class="user-profile">
      <div class="profile-header">
        <div class="avatar-section">
          <el-avatar 
            :size="64" 
            :src="userInfo.avatarUrl || defaultAvatar" 
          />
        </div>
        <div class="basic-info">
          <div class="nickname">{{ userInfo.nickname || userInfo.username }}</div>
          <div class="username">微信号：{{ userInfo.username }}</div>
        </div>
      </div>
      
      <div class="profile-actions">
        <el-button type="success" plain @click="sendMessage">发消息</el-button>
      </div>

      <div class="profile-details">
        <div class="info-item">
          <span class="label">性别</span>
          <span>{{ userInfo.gender === 'MALE' ? '男' : userInfo.gender === 'FEMALE' ? '女' : '未设置' }}</span>
        </div>
        
        <div class="info-item">
          <span class="label">状态</span>
          <el-tag :type="userInfo.status === 'online' ? 'success' : 'info'" size="small">
            {{ userInfo.status === 'online' ? '在线' : '离线' }}
          </el-tag>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="emit('update:visible', false)">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits, watch } from 'vue'
import { useUserStore } from '../store/user'
import { ElMessage } from 'element-plus'
import defaultAvatar from '../assets/default-avatar.svg'
import maleIcon from '../assets/male.svg'
import femaleIcon from '../assets/female.svg'

const props = defineProps<{
  visible: boolean
  userId: number | null
}>()

const emit = defineEmits(['update:visible', 'send-message'])

const userStore = useUserStore()
const userInfo = ref({
  userId: null,
  username: '',
  nickname: '',
  avatarUrl: '',
  gender: '',
  status: '',
  lastLoginTime: null
})

watch(() => props.userId, async (newUserId) => {
  if (newUserId && props.visible) {
    await loadUserInfo(newUserId)
  }
})

watch(() => props.visible, async (newVisible) => {
  if (newVisible && props.userId) {
    await loadUserInfo(props.userId)
  }
})

const loadUserInfo = async (userId: number) => {
  try {
    const response = await fetch(`/api/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${userStore.token}`
      }
    })
    if (response.ok) {
      userInfo.value = await response.json()
    }
  } catch (error) {
    ElMessage.error('获取用户信息失败')
  }
}

const formatDate = (date: string | null) => {
  if (!date) return '未知'
  return new Date(date).toLocaleString()
}

const sendMessage = () => {
  emit('send-message', userInfo.value)
  emit('update:visible', false)
}
</script>

<style scoped>
.user-profile-dialog :deep(.el-dialog__header) {
  display: none;
}

.user-profile {
  padding: 0;
}

.profile-header {
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.basic-info {
  flex: 1;
}

.nickname {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 4px;
}

.username {
  font-size: 14px;
  color: #666;
}

.profile-actions {
  padding: 16px;
  display: flex;
  justify-content: center;
  border-bottom: 1px solid #f0f0f0;
}

.profile-details {
  padding: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-item:last-child {
  border-bottom: none;
}

.label {
  color: #666;
}

.dialog-footer {
  text-align: center;
  padding-top: 0;
}
</style> 