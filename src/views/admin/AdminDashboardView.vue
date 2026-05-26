<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import PageIntro from '../../components/PageIntro.vue';
import MetricPanel from '../../components/MetricPanel.vue';
import { adminApi } from '@/api/services.js';
import { toPageData } from '@/utils/helpers.js';

import type {
  UsersPageQueryVO,
  MajorPageQueryVO,
  DepartmentPageQueryVO,
  DictTypePageQueryVO,
} from '@/types/api';

const users = ref({ records: [] as UsersPageQueryVO[], total: 0 });
const majors = ref({ records: [] as MajorPageQueryVO[], total: 0 });
const departments = ref({ records: [] as DepartmentPageQueryVO[], total: 0 });
const dictTypes = ref({ records: [] as DictTypePageQueryVO[], total: 0 });

const metrics = computed(() => [
  { title: '用户总量', value: users.value.total, tone: 'primary' },
  { title: '专业数量', value: majors.value.total, tone: 'blue' },
  { title: '院系数量', value: departments.value.total, tone: 'orange' },
  { title: '字典类型', value: dictTypes.value.total, tone: 'red' },
]);

const loadData = async () => {
  try {
    const [usersData, majorData, departmentData, dictTypeData] =
      await Promise.all([
        adminApi.usersPage({ pageNum: 1, pageSize: 8 }),
        adminApi.getMajorsPage({ pageNum: 1, pageSize: 8 }),
        adminApi.getDepartmentsPage({ pageNum: 1, pageSize: 8 }),
        adminApi.getDictTypesPage({ pageNum: 1, pageSize: 8 }),
      ]);
    users.value = toPageData(usersData);
    majors.value = toPageData(majorData);
    departments.value = toPageData(departmentData);
    dictTypes.value = toPageData(dictTypeData);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '加载管理员总览失败';
    ElMessage.error(message);
  }
};

onMounted(loadData);
</script>

<template>
  <div class="page-container">
    <PageIntro
      subtitle="管理员侧首页，用于观察基础数据建设是否完整。"
      title="系统概览"
    >
      <el-button type="primary" @click="loadData">刷新统计</el-button>
    </PageIntro>

    <div class="page-grid grid-3">
      <MetricPanel
        v-for="metric in metrics"
        :key="metric.title"
        :title="metric.title"
        :tone="metric.tone"
        :value="metric.value"
      />
    </div>

    <div class="page-grid grid-2">
      <section class="glass-panel page-card">
        <div class="panel-header">
          <div><h3 class="panel-title">最近用户</h3></div>
        </div>
        <el-table :data="users.records" stripe>
          <el-table-column label="用户名" min-width="120" prop="username" />
          <el-table-column label="姓名" min-width="120" prop="realName" />
          <el-table-column label="编号" min-width="140" prop="userNumber" />
          <el-table-column label="班级" prop="classCode" width="120" />
        </el-table>
      </section>

      <section class="glass-panel page-card">
        <div class="panel-header">
          <div><h3 class="panel-title">最近专业与院系</h3></div>
        </div>
        <el-table :data="majors.records" stripe>
          <el-table-column label="专业代码" min-width="120" prop="majorCode" />
          <el-table-column label="专业名称" min-width="160" prop="majorName" />
          <el-table-column label="院系代码" prop="departmentCode" width="120" />
        </el-table>
      </section>
    </div>
  </div>
</template>

<style scoped>
.page-card {
  padding: 24px;
}
</style>
