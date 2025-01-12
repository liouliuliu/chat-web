<template>
  <div class="profile-container">
    <el-card class="profile-card">
      <div class="avatar-section">
        <el-avatar 
          :size="120" 
          :src="userInfo.avatarUrl || defaultAvatar" 
          @click="triggerUpload"
        />
        <input 
          type="file" 
          ref="fileInput" 
          style="display: none" 
          accept="image/*"
          @change="handleFileSelect"
        />
        <el-button 
          type="primary" 
          size="small" 
          class="upload-btn"
          @click="triggerUpload"
        >
          更换头像
        </el-button>
      </div>

      <el-form 
        :model="userInfo" 
        label-width="80px"
        class="profile-form"
      >
        <el-form-item label="用户名">
          <el-input v-model="userInfo.username" disabled />
        </el-form-item>
        
        <el-form-item label="昵称">
          <div class="nickname-container">
            <el-input v-model="userInfo.nickname" />
            <el-image 
              :src="userInfo.gender === 'MALE' ? maleIcon : femaleIcon"
              class="gender-icon"
            />
          </div>
        </el-form-item>

        <el-form-item label="性别">
          <el-radio-group v-model="userInfo.gender">
            <el-radio label="MALE">男</el-radio>
            <el-radio label="FEMALE">女</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="saveProfile">保存修改</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 图片裁剪对话框 -->
    <el-dialog
      v-model="showCropper"
      title="裁剪头像"
      width="600px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
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
          :center="true"
          :highlight="true"
          :rotatable="true"
        />
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showCropper = false">取消</el-button>
          <el-button type="primary" @click="handleCrop" :loading="uploading">
            确定
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 上传进度条 -->
    <el-dialog
      v-model="showProgress"
      title="上传进度"
      width="400px"
      :close-on-click-modal="false"
      :show-close="false"
    >
      <el-progress 
        :percentage="uploadProgress" 
        :status="uploadStatus"
      />
      <div class="progress-text">{{ uploadProgressText }}</div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '../store/user'
import { ElMessage } from 'element-plus'
import 'vue-cropper/dist/index.css'
import { VueCropper } from 'vue-cropper'
import defaultAvatar from '../assets/default-avatar.svg'
import maleIcon from '../assets/male.svg'
import femaleIcon from '../assets/female.svg'

const userStore = useUserStore()
const fileInput = ref<HTMLInputElement | null>(null)
const cropperRef = ref<typeof VueCropper | null>(null)
const showCropper = ref(false)
const cropperImage = ref('')
const uploading = ref(false)
const showProgress = ref(false)
const uploadProgress = ref(0)
const uploadStatus = ref<'' | 'success' | 'warning' | 'exception'>('')
const uploadProgressText = ref('正在上传...')

const userInfo = ref({
  userId: '',
  username: '',
  nickname: '',
  avatarUrl: '',
  gender: 'MALE'
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
      userInfo.value = data
    }
  } catch (error) {
    ElMessage.error('获取用户信息失败')
  }
})

const triggerUpload = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (!target.files?.length) return

  const file = target.files[0]
  const reader = new FileReader()
  
  reader.onload = (e) => {
    cropperImage.value = e.target?.result as string
    showCropper.value = true
  }
  
  reader.readAsDataURL(file)
  // 清空 input 的值，这样可以重复选择同一个文件
  target.value = ''
}

const handleCrop = async () => {
  if (!cropperRef.value) return
  
  uploading.value = true
  showProgress.value = true
  uploadProgress.value = 0
  uploadStatus.value = ''
  
  try {
    // 获取裁剪后的图片 blob 数据
    const blob = await new Promise<Blob>((resolve) => {
      cropperRef.value?.getCropBlob((data: Blob) => {
        resolve(data)
      })
    })

    const formData = new FormData()
    formData.append('avatar', blob, 'avatar.png')

    const xhr = new XMLHttpRequest()
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        uploadProgress.value = Math.round((e.loaded * 100) / e.total)
      }
    }

    const response = await new Promise((resolve, reject) => {
      xhr.open('POST', '/api/users/avatar')
      xhr.setRequestHeader('Authorization', `Bearer ${userStore.token}`)
      
      xhr.onload = () => {
        if (xhr.status === 200) {
          resolve(JSON.parse(xhr.response))
        } else {
          reject(new Error('上传失败'))
        }
      }
      
      xhr.onerror = () => reject(new Error('网络错误'))
      xhr.send(formData)
    })

    userInfo.value.avatarUrl = (response as any).avatarUrl
    uploadStatus.value = 'success'
    uploadProgressText.value = '上传成功！'
    
    setTimeout(() => {
      showCropper.value = false
      showProgress.value = false
      ElMessage.success('头像更新成功')
    }, 500)
  } catch (error) {
    uploadStatus.value = 'exception'
    uploadProgressText.value = '上传失败，请重试'
    ElMessage.error('头像上传失败')
  } finally {
    uploading.value = false
  }
}

const saveProfile = async () => {
  try {
    const response = await fetch('/api/users/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userStore.token}`
      },
      body: JSON.stringify({
        nickname: userInfo.value.nickname,
        gender: userInfo.value.gender
      })
    })

    if (response.ok) {
      ElMessage.success('个人信息更新成功')
    }
  } catch (error) {
    ElMessage.error('保存失败')
  }
}
</script>

<style scoped>
.profile-container {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
}

.profile-card {
  padding: 20px;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 30px;
}

.upload-btn {
  margin-top: 10px;
}

.profile-form {
  margin-top: 20px;
}

.nickname-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.gender-icon {
  width: 20px;
  height: 20px;
}

.el-avatar {
  cursor: pointer;
}

.cropper-container {
  width: 100%;
  height: 400px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.progress-text {
  text-align: center;
  margin-top: 10px;
  color: #606266;
}
</style> 