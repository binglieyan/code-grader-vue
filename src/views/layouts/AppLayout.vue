<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.js';
import { navigationByRole } from '@/config/navigation.js';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const navigation = computed(() => navigationByRole[authStore.role] || []);
const activePath = computed(() => route.path);

const logout = () => {
  authStore.logout();
  router.push('/login');
};
</script>

<template>
  <div class="layout">
    <aside class="layout__sidebar">
      <div class="layout__brand">
        <div class="layout__logo">CG</div>
        <div>
          <div class="layout__brand-title">Code Grader</div>
          <div class="layout__brand-subtitle">Java课程实验作业批改系统</div>
        </div>
      </div>
      <el-menu
        :collapse-transition="false"
        :default-active="activePath"
        class="layout__menu"
        router
      >
        <el-menu-item
          v-for="item in navigation"
          :key="item.path"
          :index="item.path"
        >
          <el-icon>
            <component :is="item.icon" />
          </el-icon>
          <span>{{ item.label }}</span>
        </el-menu-item>
      </el-menu>
      <div class="layout__sidebar-foot glass-panel">
        <div class="layout__role">{{ authStore.role || 'guest' }}</div>
        <div class="layout__name">{{ authStore.displayName }}</div>
        <div class="soft-text">
          学号/工号：{{ authStore.profile?.userNumber || '--' }}
        </div>
      </div>
    </aside>

    <main class="layout__main">
      <header class="layout__header glass-panel">
        <div>
          <div class="layout__header-title">统一教学控制台</div>
        </div>
        <div class="layout__header-actions">
          <el-button plain @click="router.go(0)">刷新页面</el-button>
          <el-button plain type="danger" @click="logout">退出登录</el-button>
        </div>
      </header>

      <section class="layout__content">
        <router-view />
      </section>
    </main>
  </div>
</template>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  min-height: 100vh;
}

.layout__sidebar {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 24px 18px;
  background: linear-gradient(
    180deg,
    rgba(10, 24, 40, 0.98),
    rgba(18, 52, 86, 0.96)
  );
  color: #f8fbff;
}

.layout__brand {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 12px;
}

.layout__logo {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 18px;
  background: linear-gradient(135deg, #14b8a6, #2dd4bf);
  color: #042f2e;
  font-weight: 800;
}

.layout__brand-title {
  font-size: 18px;
  font-weight: 800;
}

.layout__brand-subtitle {
  margin-top: 4px;
  color: rgba(248, 251, 255, 0.68);
  font-size: 12px;
}

.layout__menu {
  border: none;
  background: transparent;
}

.layout__menu .el-menu-item {
  color: rgba(248, 251, 255, 0.85);
}

.layout__menu .el-menu-item:hover,
.layout__menu .el-menu-item.is-active {
  color: #ffffff;
  background-color: rgba(255, 255, 255, 0.12);
}

.layout__sidebar-foot {
  margin-top: auto;
  padding: 18px;
  background: rgba(255, 255, 255, 0.08);
  color: #f8fbff;
}

.layout__role {
  text-transform: uppercase;
  font-size: 12px;
  color: #5eead4;
  letter-spacing: 0.14em;
}

.layout__name {
  margin: 8px 0 4px;
  font-size: 20px;
  font-weight: 700;
}

.layout__main {
  padding: 22px;
}

.layout__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 20px 24px;
}

.layout__header-title {
  font-size: 22px;
  font-weight: 800;
}

.layout__header-actions {
  display: flex;
  gap: 12px;
}

.layout__content {
  margin-top: 20px;
}

@media (max-width: 1080px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .layout__sidebar {
    padding-bottom: 8px;
  }

  .layout__header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
