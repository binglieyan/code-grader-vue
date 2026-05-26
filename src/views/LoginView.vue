<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '../stores/auth';
import { roleOptions } from '../config/navigation';

const router = useRouter();
const authStore = useAuthStore();
const loading = ref(false);
const form = reactive({
  role: 'teacher',
  userNumber: '',
  password: '',
});

const login = async () => {
  loading.value = true;
  try {
    const redirect = await authStore.login(form.role, {
      userNumber: form.userNumber,
      password: form.password,
    });
    ElMessage.success('登录成功');
    if (redirect) {
      await router.push(redirect);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '登录失败';
    ElMessage.error(message);
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="login-page">
    <div class="login-page__shell">
      <section class="login-page__hero">
        <div class="login-page__eyebrow">Course Ops Console</div>
        <h1>Java课程实验作业批改系统前端控制台</h1>
        <p>
          教师侧可完成班级、作业、题目、测试用例、批改与查重管理；学生侧可提交代码并查看评分；管理员侧可维护用户、专业、院系与字典数据。
        </p>
        <div class="login-page__badges">
          <span class="status-chip">Element Plus</span>
          <span class="status-chip">Vue Router</span>
          <span class="status-chip">Pinia</span>
        </div>
      </section>

      <section class="login-panel glass-panel">
        <div>
          <h2>账号登录</h2>
        </div>

        <el-form label-position="top" @submit.prevent="login">
          <el-form-item label="登录角色">
            <el-segmented
              v-model="form.role"
              :options="roleOptions"
              block
              class="role-switcher"
            />
          </el-form-item>
          <el-form-item label="学号 / 工号">
            <el-input
              v-model="form.userNumber"
              placeholder="请输入账号编号"
              size="large"
            />
          </el-form-item>
          <el-form-item label="密码">
            <el-input
              v-model="form.password"
              placeholder="请输入密码"
              show-password
              size="large"
              type="password"
            />
          </el-form-item>
          <el-button
            :loading="loading"
            class="login-button"
            size="large"
            type="primary"
            @click="login"
          >
            进入系统
          </el-button>
        </el-form>
      </section>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
}

.login-page__shell {
  width: min(1180px, 100%);
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(420px, 500px);
  gap: 40px;
  align-items: center;
}

.login-page__hero {
  padding: 36px 28px 36px 12px;
}

.login-page__eyebrow {
  display: inline-flex;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(15, 118, 110, 0.12);
  color: var(--primary);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

h1 {
  margin: 18px 0 16px;
  max-width: 680px;
  font-size: clamp(40px, 5vw, 64px);
  line-height: 1.08;
}

p {
  max-width: 700px;
  color: var(--text-soft);
  font-size: 16px;
  line-height: 1.75;
}

.login-page__badges {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  flex-wrap: wrap;
}

.login-panel {
  width: 100%;
  padding: 36px;
}

.login-panel h2 {
  margin: 0 0 8px;
  font-size: 32px;
}

.role-switcher {
  width: 100%;
}

.login-button {
  width: 100%;
  margin-top: 8px;
}

@media (max-width: 980px) {
  .login-page {
    padding: 18px;
  }

  .login-page__shell {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .login-page__hero {
    padding: 8px;
  }

  .login-panel {
    padding: 24px;
  }
}

@media (max-width: 560px) {
}
</style>
