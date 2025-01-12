<template>
  <div class="profile-edit">
    <div class="header">
      <el-button @click="router.back()">返回</el-button>
      <h2>个人资料</h2>
    </div>

    <div class="edit-form">
      <div class="avatar-section">
        <el-avatar 
          :size="80" 
          :src="previewUrl || userInfo.avatarUrl || defaultAvatar"
        />
        <el-upload
          ref="uploadRef"
          class="avatar-uploader"
          action="/api/users/avatar"
          :headers="{ 'Authorization': `Bearer ${userStore.token}` }"
          :show-file-list="false"
          :auto-upload="false"
          :on-change="handleFileChange"
          accept="image/jpeg,image/png"
        >
          <template #default>
            <div class="upload-trigger">
              <el-button type="primary">{{ previewUrl ? '重新选择' : '选择图片' }}</el-button>
              <div class="upload-tip">支持 jpg、png 格式，大小不超过 2MB</div>
            </div>
          </template>
        </el-upload>
      </div>

      <!-- 图片裁剪对话框 -->
      <el-dialog
        v-model="showCropper"
        title="裁剪头像"
        width="500px"
        :close-on-click-modal="false"
        :show-close="false"
      >
        <div class="cropper-container">
          <vue-cropper
            ref="cropperRef"
            :src="cropperImage"
            :aspect-ratio="1"
            :view-mode="1"
            :auto-crop-area="1"
            :background="true"
            :movable="true"
            :zoomable="true"
            :guides="true"
          />
        </div>
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="cancelCrop">取消</el-button>
            <el-button type="primary" @click="confirmCrop">确定</el-button>
          </div>
        </template>
      </el-dialog>

      <div class="form-item">
        <label>昵称</label>
        <el-input v-model="userInfo.nickname" placeholder="请输入昵称" />
      </div>

      <div class="form-item">
        <label>性别</label>
        <el-radio-group v-model="userInfo.gender">
          <el-radio label="MALE">男</el-radio>
          <el-radio label="FEMALE">女</el-radio>
        </el-radio-group>
      </div>

      <div class="form-actions">
        <el-button type="primary" @click="saveProfile">保存</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user'
import { ElMessage } from 'element-plus'
import type { UploadInstance, UploadFile } from 'element-plus'
import { VueCropper } from 'vue-cropper'
import 'vue-cropper/dist/index.css'
import defaultAvatar from '../assets/default-avatar.svg'

const router = useRouter()
const userStore = useUserStore()
const uploadRef = ref<UploadInstance>()
const cropperRef = ref<any>()
const showCropper = ref(false)
const cropperImage = ref('')
const previewUrl = ref('')

const userInfo = ref({
  nickname: '',
  gender: '',
  avatarUrl: ''
})

// 处理文件选择
const handleFileChange = (file: UploadFile) => {
  const isJPG = file.raw?.type === 'image/jpeg'
  const isPNG = file.raw?.type === 'image/png'
  const isLt2M = file.size! / 1024 / 1024 < 2

  if (!isJPG && !isPNG) {
    ElMessage.error('只能上传 JPG/PNG 格式的图片')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB')
    return false
  }

  // 显示裁剪对话框
  const reader = new FileReader()
  reader.onload = (e) => {
    cropperImage.value = e.target?.result as string
    showCropper.value = true
  }
  if (file.raw) {
    reader.readAsDataURL(file.raw)
  }
}

// 取消裁剪
const cancelCrop = () => {
  showCropper.value = false
  cropperImage.value = ''
  if (uploadRef.value) {
    uploadRef.value.clearFiles()
  }
}

// 确认裁剪
const confirmCrop = async () => {
  if (!cropperRef.value) return
  
  const canvas = cropperRef.value.getCanvas()
  if (!canvas) return

  canvas.toBlob(async (blob: Blob | null) => {
    if (!blob) {
      ElMessage.error('图片处理失败')
      return
    }

    // 创建预览
    previewUrl.value = URL.createObjectURL(blob)

    // 创建表单数据
    const formData = new FormData()
    formData.append('avatar', blob, 'avatar.jpg')

    try {
      const response = await fetch('/api/users/avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userStore.token}`
        },
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        if (data.avatarUrl) {
          userInfo.value.avatarUrl = data.avatarUrl
          userStore.setUser({ ...userStore.$state, avatarUrl: data.avatarUrl })
          ElMessage.success('头像上传成功')
        } else {
          ElMessage.error('头像上传失败：返回的URL为空')
        }
      } else {
        throw new Error('上传失败')
      }
    } catch (error) {
      console.error('Upload error:', error)
      ElMessage.error('头像上传失败：' + (error instanceof Error ? error.message : '未知错误'))
    }

    showCropper.value = false
    cropperImage.value = ''
    if (uploadRef.value) {
      uploadRef.value.clearFiles()
    }
  }, 'image/jpeg', 0.9)
}

// 组件卸载时清理资源
onUnmounted(() => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }
})

onMounted(async () => {
  try {
    const response = await fetch('/api/users/me', {
      headers: {
        'Authorization': `Bearer ${userStore.token}`
      }
    })
    if (response.ok) {
      const data = await response.json()
      userInfo.value = {
        nickname: data.nickname || '',
        gender: data.gender || '',
        avatarUrl: data.avatarUrl || ''
      }
    }
  } catch (error) {
    ElMessage.error('获取用户信息失败')
  }
})

const saveProfile = async () => {
  try {
    debugger
    const response = await fetch('/api/users/profile', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${userStore.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nickname: userInfo.value.nickname,
        gender: userInfo.value.gender
      })
    })

    if (response.ok) {
      ElMessage.success('保存成功')
      router.back()
    } else {
      ElMessage.error('保存失败')
    }
  } catch (error) {
    ElMessage.error('保存失败')
  }
}
</script>

<style scoped>
.profile-edit {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.edit-form {
  background: white;
  padding: 24px;
  border-radius: 8px;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  position: relative;
  width: 100%;
  max-width: 300px;
  margin-left: auto;
  margin-right: auto;
}

.avatar-section .el-avatar {
  border: 2px solid #fff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.upload-trigger {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
}

:deep(.avatar-uploader .el-upload) {
  width: 100%;
  text-align: center;
  cursor: pointer;
}

:deep(.el-progress-bar__inner) {
  transition: width 0.3s ease;
}

.form-item {
  margin-bottom: 20px;
}

.form-item label {
  display: block;
  margin-bottom: 8px;
  color: #606266;
}

.form-actions {
  margin-top: 32px;
  text-align: center;
}

.cropper-container {
  height: 400px;
  background: #f5f7fa;
}

:deep(.cropper-view-box) {
  border-radius: 50%;
  outline: 2px solid #fff;
  outline-offset: -1px;
}

:deep(.cropper-face) {
  border-radius: 50%;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 16px;
}
</style> 