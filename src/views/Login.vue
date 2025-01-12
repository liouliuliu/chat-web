<template>
    <div class="login-container">
        <el-card class="login-card">
            <template #header>
                <div class="card-header">
                    <span>{{ isLogin ? '登录' : '注册' }}</span>
                </div>
            </template>
            
            <el-form :model="form" :rules="rules" ref="formRef">
                <el-form-item prop="username">
                    <el-input v-model="form.username" placeholder="用户名" />
                </el-form-item>
                
                <el-form-item prop="password">
                    <el-input v-model="form.password" type="password" placeholder="密码" />
                </el-form-item>
                
                <el-form-item v-if="!isLogin" prop="nickname">
                    <el-input v-model="form.nickname" placeholder="昵称（选填）" />
                </el-form-item>
                
                <el-form-item>
                    <el-button type="primary" @click="handleSubmit" :loading="loading">
                        {{ isLogin ? '登录' : '注册' }}
                    </el-button>
                    <el-button type="text" @click="toggleMode">
                        {{ isLogin ? '没有账号？去注册' : '已有账号？去登录' }}
                    </el-button>
                </el-form-item>
            </el-form>
        </el-card>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../store/user';
import type { FormInstance } from 'element-plus';

const router = useRouter();
const userStore = useUserStore();
const formRef = ref<FormInstance>();
const isLogin = ref(true);
const loading = ref(false);

const form = ref({
    username: '',
    password: '',
    nickname: ''
});

const rules = {
    username: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
        { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
    ],
    password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
    ]
};

const handleSubmit = async () => {
    if (!formRef.value) return;
    
    await formRef.value.validate(async (valid) => {
        if (valid) {
            loading.value = true;
            try {
                let success;
                if (isLogin.value) {
                    success = await userStore.login(form.value.username, form.value.password);
                } else {
                    success = await userStore.register(form.value);
                    if (success) {
                        isLogin.value = true;
                        return;
                    }
                }
                
                if (success) {
                    router.push('/chat');
                }
            } finally {
                loading.value = false;
            }
        }
    });
};

const toggleMode = () => {
    isLogin.value = !isLogin.value;
    form.value = {
        username: '',
        password: '',
        nickname: ''
    };
};
</script>

<style scoped>
.login-container {
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #f5f7fa;
}

.login-card {
    width: 400px;
}

.card-header {
    text-align: center;
    font-size: 20px;
}

.el-button {
    width: 100%;
    margin-bottom: 10px;
}

.el-button--text {
    margin: 0;
}
</style> 