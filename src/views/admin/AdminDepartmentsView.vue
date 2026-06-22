<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import PageIntro from '../../components/PageIntro.vue';
import EntityDialog from '../../components/EntityDialog.vue';
import { adminApi } from '@/api/services.js';
import { toPageData } from '@/utils/helpers.js';

import type {
  DepartmentDTO,
  DepartmentUpdateDTO,
  DepartmentPageQueryDTO,
  DepartmentPageQueryVO,
} from '@/types/api';

const query = reactive<DepartmentPageQueryDTO>({
  departmentCode: '',
  departmentName: '',
  pageNum: 1,
  pageSize: 10,
});
const page = ref({ records: [] as DepartmentPageQueryVO[], total: 0 });
const dialogVisible = ref(false);
const editing = ref<DepartmentPageQueryVO | null>(null);

const loadData = async () => {
  try {
    page.value = toPageData(await adminApi.getDepartmentsPage(query));
  } catch (error) {
    const message = error instanceof Error ? error.message : '加载院系失败';
    ElMessage.error(message);
  }
};

const save = async (payload: Record<string, unknown>) => {
  try {
    if (editing.value) {
      await adminApi.updateDepartment(
        editing.value.departmentCode,
        payload as unknown as DepartmentUpdateDTO,
      );
    } else {
      await adminApi.createDepartment(payload as unknown as DepartmentDTO);
    }
    dialogVisible.value = false;
    await loadData();
    ElMessage.success('院系已保存');
  } catch (error) {
    const message = error instanceof Error ? error.message : '保存院系失败';
    ElMessage.error(message);
  }
};

const remove = async (row: DepartmentPageQueryVO) => {
  try {
    await ElMessageBox.confirm(
      `确认删除院系 ${row.departmentCode} 吗？`,
      '删除院系',
      { type: 'warning' },
    );
    await adminApi.deleteDepartment(row.departmentCode);
    ElMessage.success('院系已删除');
    await loadData();
  } catch (error) {
    if (error !== 'cancel') {
      const message = error instanceof Error ? error.message : '删除院系失败';
      ElMessage.error(message);
    }
  }
};

onMounted(loadData);
</script>

<template>
  <div class="page-container">
    <PageIntro subtitle="维护院系基础编码和名称。" title="院系管理">
      <el-input
        v-model="query.departmentCode"
        placeholder="院系代码"
        style="width: 160px"
      />
      <el-input
        v-model="query.departmentName"
        placeholder="院系名称"
        style="width: 160px"
      />
      <el-button @click="loadData">查询</el-button>
      <el-button
        type="primary"
        @click="
          editing = null;
          dialogVisible = true;
        "
        >新增院系</el-button
      >
    </PageIntro>

    <div class="page-grid grid-2">
      <section class="glass-panel page-card">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">院系列表</h3>
            <p class="panel-subtitle">维护院系基础编码和名称</p>
          </div>
        </div>
        <el-table :data="page.records" stripe>
          <el-table-column
            label="院系代码"
            min-width="140"
            prop="departmentCode"
          />
          <el-table-column
            label="院系名称"
            min-width="200"
            prop="departmentName"
          />
          <el-table-column label="操作" width="150">
            <template #default="{ row }">
              <el-space>
                <el-button
                  link
                  @click="
                    editing = (row as DepartmentPageQueryVO);
                    dialogVisible = true;
                  "
                  >编辑</el-button
                >
                <el-button link type="danger" @click="remove(row as DepartmentPageQueryVO)"
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

      <section class="glass-panel page-card dept-stats-card">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">数据统计</h3>
            <p class="panel-subtitle">当前分页数据概览</p>
          </div>
        </div>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="总院系数">{{
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
            <li>支持按院系代码精确查询</li>
            <li>支持按院系名称模糊查询</li>
            <li>点击查询按钮刷新数据</li>
          </ul>
        </div>
      </section>
    </div>

    <EntityDialog
      v-model="dialogVisible"
      :fields="[
        { key: 'departmentCode', label: '院系代码' },
        { key: 'departmentName', label: '院系名称', span: 24 },
      ]"
      :initial-value="editing || {}"
      :title="editing ? '编辑院系' : '新增院系'"
      @submit="save"
    />
  </div>
</template>

<style scoped>
.page-card {
  padding: 24px;
}

.dept-stats-card {
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
