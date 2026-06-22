<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import PageIntro from '../../components/PageIntro.vue';
import EntityDialog from '../../components/EntityDialog.vue';
import { adminApi } from '@/api/services.js';
import { toPageData } from '@/utils/helpers.js';

import type {
  UsersDTO,
  UsersUpdateDTO,
  UsersPageQueryDTO,
  UsersPageQueryVO,
} from '@/types/api';

const query = reactive<UsersPageQueryDTO>({
  username: '',
  realName: '',
  userNumber: '',
  pageNum: 1,
  pageSize: 10,
});
const page = ref({ records: [] as UsersPageQueryVO[], total: 0 });
const dialogVisible = ref(false);
const editing = ref<UsersPageQueryVO | null>(null);

// 新增用户时的角色选项（用于管理员后台）
const userRoleOptions = [
  { label: '学生', value: 'STUDENT' },
  { label: '教师', value: 'TEACHER' },
];

const loadData = async () => {
  try {
    page.value = toPageData(await adminApi.usersPage(query));
  } catch (error) {
    const message = error instanceof Error ? error.message : '加载用户失败';
    ElMessage.error(message);
  }
};

const save = async (payload: Record<string, unknown>) => {
  try {
    if (editing.value) {
      // 编辑模式：转换为 Record 以安全删除属性
      const updateData: Record<string, unknown> = { ...payload };
      delete updateData.password;
      delete updateData.roleCode;
      await adminApi.updateUser(updateData as unknown as UsersUpdateDTO);
      ElMessage.success('用户已更新');
    } else {
      // 新增模式：精准转换为 CreateRequest
      await adminApi.createUser(payload as unknown as UsersDTO);
      ElMessage.success('用户已新增');
    }
    dialogVisible.value = false;
    await loadData();
  } catch (error) {
    const message = error instanceof Error ? error.message : '保存用户失败';
    ElMessage.error(message);
  }
};

const remove = async (row: UsersPageQueryVO) => {
  try {
    await ElMessageBox.confirm(
      `确认删除用户 ${row.userNumber} 吗？`,
      '删除用户',
      { type: 'warning' },
    );
    await adminApi.deleteUser(row.userNumber);
    ElMessage.success('用户已删除');
    await loadData();
  } catch (error) {
    if (error !== 'cancel') {
      const message = error instanceof Error ? error.message : '删除用户失败';
      ElMessage.error(message);
    }
  }
};

onMounted(loadData);
</script>

<template>
  <div class="page-container">
    <PageIntro title="用户管理">
      <el-input
        v-model="query.username"
        placeholder="用户名"
        style="width: 160px"
      />
      <el-input
        v-model="query.realName"
        placeholder="姓名"
        style="width: 160px"
      />
      <el-input
        v-model="query.userNumber"
        placeholder="学工/工号"
        style="width: 160px"
      />
      <el-button @click="loadData">查询</el-button>
      <el-button
        type="primary"
        @click="
          editing = null;
          dialogVisible = true;
        "
        >新增用户</el-button
      >
    </PageIntro>

    <div class="page-grid grid-2">
      <section class="glass-panel page-card">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">用户列表</h3>
            <p class="panel-subtitle">管理系统中的所有用户及其角色分配</p>
          </div>
        </div>
        <el-table :data="page.records" stripe>
          <el-table-column label="用户名" min-width="120" prop="username" />
          <el-table-column label="姓名" min-width="80" prop="realName" />
          <el-table-column
            label="学号/工号"
            min-width="60"
            prop="userNumber"
          />
          <el-table-column label="专业名称" prop="majorName" width="160" />
          <el-table-column label="班级名称" prop="className" width="160" />
          <el-table-column label="操作" width="150">
            <template #default="{ row }">
              <el-space>
                <el-button
                  link
                  @click="
                    editing = (row as UsersPageQueryVO);
                    dialogVisible = true;
                  "
                  >编辑</el-button
                >
                <el-button link type="danger" @click="remove(row as UsersPageQueryVO)"
                  >删除</el-button
                >
              </el-space>
            </template>
          </el-table-column>
        </el-table>
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="query.pageNum"
            v-model:page-size="query.pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="page.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="loadData"
            @current-change="loadData"
          />
        </div>
      </section>

      <section class="glass-panel page-card user-stats-card">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">用户统计</h3>
            <p class="panel-subtitle">当前分页数据概览</p>
          </div>
        </div>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="总用户数">{{
            page.total
          }}</el-descriptions-item>
          <el-descriptions-item label="当前页显示">{{
            page.records.length
          }}</el-descriptions-item>
          <el-descriptions-item label="页码">{{
            query.pageNum
          }}</el-descriptions-item>
          <el-descriptions-item label="每页数量">{{
            query.pageSize
          }}</el-descriptions-item>
        </el-descriptions>

        <div class="search-hints">
          <h4>快速筛选提示</h4>
          <ul>
            <li>支持按用户名模糊查询</li>
            <li>支持按姓名模糊查询</li>
            <li>支持按用户编号模糊查询</li>
            <li>点击查询按钮刷新数据</li>
          </ul>
        </div>
      </section>
    </div>

    <EntityDialog
      v-model="dialogVisible"
      :fields="
        editing
          ? [
              { key: 'username', label: '用户名' },
              { key: 'realName', label: '真实姓名' },
              { key: 'userNumber', label: '用户编号' },
              { key: 'email', label: '邮箱' },
              { key: 'majorCode', label: '专业代码' },
              { key: 'classCode', label: '班级代码' },
            ]
          : [
              { key: 'username', label: '用户名' },
              { key: 'realName', label: '真实姓名' },
              { key: 'userNumber', label: '用户编号' },
              { key: 'email', label: '邮箱' },
              { key: 'password', label: '密码' },
              {
                key: 'roleCode',
                label: '角色编码',
                type: 'select',
                options: userRoleOptions,
                defaultValue: 'STUDENT',
              },
              { key: 'majorCode', label: '专业代码' },
              { key: 'classCode', label: '班级代码' },
            ]
      "
      :initial-value="editing || {}"
      :title="editing ? '编辑用户' : '新增用户'"
      @submit="save"
    />
  </div>
</template>

<style scoped>
.page-card {
  padding: 24px;
}

.user-stats-card {
  display: flex;
  flex-direction: column;
}

.search-hints {
  margin-top: auto;
  padding-top: 20px;
  border-top: 1px solid var(--border);
}

.search-hints h4 {
  margin: 0 0 12px;
  font-size: 14px;
  color: var(--text-soft);
}

.search-hints ul {
  margin: 0;
  padding-left: 18px;
}

.search-hints li {
  margin-bottom: 6px;
  font-size: 13px;
  color: var(--text-soft);
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
  padding-top: 16px;
}
</style>
