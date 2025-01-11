<template>
    <div class="login-container">
        <el-card class="login-card">
            <el-tabs v-model="activeTab">
                <el-tab-pane label="登录" name="login">
                    <el-form :model="loginForm" @submit.prevent="handleLogin">
                        <el-form-item>
                            <el-input v-model="loginForm.username" placeholder="用户名" />
                        </el-form-item>
                        <el-form-item>
                            <el-input v-model="loginForm.password" type="password" placeholder="密码" />
                        </el-form-item>
                        <el-form-item>
                            <el-button type="primary" native-type="submit" block>登录</el-button>
                        </el-form-item>
                    </el-form>
                </el-tab-pane>
                
                <el-tab-pane label="注册" name="register">
                    <el-form :model="registerForm" @submit.prevent="handleRegister">
                        <el-form-item>
                            <el-input v-model="registerForm.username" placeholder="用户名" />
                        </el-form-item>
                        <el-form-item>
                            <el-input v-model="registerForm.password" type="password" placeholder="密码" />
                        </el-form-item>
                        <el-form-item>
                            <el-input v-model="registerForm.nickname" placeholder="昵称（选填）" />
                        </el-form-item>
                        <el-form-item>
                            <el-button type="primary" native-type="submit" block>注册</el-button>
                        </el-form-item>
                    </el-form>
                </el-tab-pane>
            </el-tabs>
        </el-card>
    </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../store/user';
import { ElMessage } from 'element-plus';

const router = useRouter();
const userStore = useUserStore();
const activeTab = ref('login');

const loginForm = reactive({
    username: '',
    password: ''
});

const registerForm = reactive({
    username: '',
    password: '',
    nickname: ''
});

const handleLogin = async () => {
    if (!loginForm.username || !loginForm.password) {
        ElMessage.error('请输入用户名和密码');
        return;
    }

    const success = await userStore.login(loginForm.username, loginForm.password);
    if (success) {
        router.push('/chat');
    } else {
        ElMessage.error('登录失败');
    }
};

const handleRegister = async () => {
    if (!registerForm.username || !registerForm.password) {
        ElMessage.error('请输入用户名和密码');
        return;
    }

    const success = await userStore.register(
        registerForm.username,
        registerForm.password,
        registerForm.nickname
    );

    if (success) {
        ElMessage.success('注册成功，请登录');
        activeTab.value = 'login';
    } else {
        ElMessage.error('注册失败');
    }
};
</script>

<style scoped>
.login-container {
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #f5f5f5;
}

.login-card {
    width: 400px;
}
</style> 