<script setup lang="ts">
import { onMounted, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import PageIntro from '../../components/PageIntro.vue';
import { teacherApi } from '@/api/services.js';
import type { TeacherVO } from '@/types/api';

const form = reactive<TeacherVO>({
  username: '',
  email: '',
  realName: '',
  userNumber: '',
  majorCode: '',
});

const loadProfile = async () => {
  try {
    Object.assign(form, await teacherApi.getProfile());
  } catch (error) {
    const message = error instanceof Error ? error.message : '加载教师资料失败';
    ElMessage.error(message);
  }
};

onMounted(loadProfile);
</script>

<template>
  <div class="page-container">
    <PageIntro
      subtitle="教师资料仅展示，修改统一由管理员处理。"
      title="个人中心"
    />
    <div class="page-grid grid-2">
      <section class="glass-panel page-card profile-card">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">基本信息</h3>
            <p class="panel-subtitle">教师资料仅展示，修改统一由管理员处理。</p>
          </div>
        </div>
        <el-form label-position="top">
          <el-row :gutter="18">
            <el-col :span="12">
              <el-form-item label="用户名">
                <el-input v-model="form.username" disabled />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="邮箱">
                <el-input v-model="form.email" disabled />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="真实姓名">
                <el-input v-model="form.realName" disabled />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="工号">
                <el-input v-model="form.userNumber" disabled />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="专业代码">
                <el-input v-model="form.majorCode" disabled />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </section>
    </div>
  </div>
</template>

<style scoped>
.profile-card {
  padding: 24px;
}
</style>
