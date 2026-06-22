<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import PageIntro from '../../components/PageIntro.vue';
import EntityDialog from '../../components/EntityDialog.vue';
import { adminApi } from '@/api/services.js';
import { toPageData } from '@/utils/helpers.js';

import type {
  MajorDTO,
  MajorUpdateDTO,
  MajorPageQueryDTO,
  MajorPageQueryVO,
} from '@/types/api';

const query = reactive<MajorPageQueryDTO>({
  majorCode: '',
  majorName: '',
  pageNum: 1,
  pageSize: 10,
});
const page = ref({ records: [] as MajorPageQueryVO[], total: 0 });
const dialogVisible = ref(false);
const editing = ref<MajorPageQueryVO | null>(null);

const loadData = async () => {
  try {
    page.value = toPageData(await adminApi.getMajorsPage(query));
  } catch (error) {
    const message = error instanceof Error ? error.message : '加载专业失败';
    ElMessage.error(message);
  }
};

const save = async (payload: Record<string, unknown>) => {
  try {
    if (editing.value) {
      await adminApi.updateMajor({
        ...editing.value,
        ...payload,
      } as unknown as MajorUpdateDTO);
    } else {
      await adminApi.createMajor(payload as unknown as MajorDTO);
    }
    dialogVisible.value = false;
    await loadData();
    ElMessage.success('专业已保存');
  } catch (error) {
    const message = error instanceof Error ? error.message : '保存专业失败';
    ElMessage.error(message);
  }
};

const remove = async (row: MajorPageQueryVO) => {
  try {
    await ElMessageBox.confirm(
      `确认删除专业 ${row.majorCode} 吗？`,
      '删除专业',
      { type: 'warning' },
    );
    await adminApi.deleteMajor(row.majorCode);
    ElMessage.success('专业已删除');
    await loadData();
  } catch (error) {
    if (error !== 'cancel') {
      const message = error instanceof Error ? error.message : '删除专业失败';
      ElMessage.error(message);
    }
  }
};

onMounted(loadData);
</script>

<template>
  <div class="page-container">
    <PageIntro subtitle="维护专业编码、名称和所属院系。" title="专业管理">
      <el-input
        v-model="query.majorCode"
        placeholder="专业代码"
        style="width: 160px"
      />
      <el-input
        v-model="query.majorName"
        placeholder="专业名称"
        style="width: 160px"
      />
      <el-button @click="loadData">查询</el-button>
      <el-button
        type="primary"
        @click="
          editing = null;
          dialogVisible = true;
        "
        >新增专业</el-button
      >
    </PageIntro>

    <div class="page-grid grid-2">
      <section class="glass-panel page-card">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">专业列表</h3>
            <p class="panel-subtitle">维护专业编码、名称和所属院系</p>
          </div>
        </div>
        <el-table :data="page.records" stripe>
          <el-table-column label="专业代码" min-width="60" prop="majorCode" />
          <el-table-column label="专业名称" min-width="160" prop="majorName" />
          <el-table-column label="院系名称" prop="departmentName" min-width="180" />
          <el-table-column label="操作" width="150">
            <template #default="{ row }">
              <el-space>
                <el-button
                  link
                  @click="
                    editing = (row as MajorPageQueryVO);
                    dialogVisible = true;
                  "
                  >编辑</el-button
                >
                <el-button link type="danger" @click="remove(row as MajorPageQueryVO)"
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

      <section class="glass-panel page-card major-stats-card">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">数据统计</h3>
            <p class="panel-subtitle">当前分页数据概览</p>
          </div>
        </div>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="总专业数">{{
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
            <li>支持按专业代码精确查询</li>
            <li>支持按专业名称模糊查询</li>
            <li>点击查询按钮刷新数据</li>
          </ul>
        </div>
      </section>
    </div>

    <EntityDialog
      v-model="dialogVisible"
      :fields="[
        { key: 'majorCode', label: '专业代码' },
        { key: 'majorName', label: '专业名称' },
        { key: 'departmentCode', label: '院系代码' },
      ]"
      :initial-value="editing || {}"
      :title="editing ? '编辑专业' : '新增专业'"
      @submit="save"
    />
  </div>
</template>

<style scoped>
.page-card {
  padding: 24px;
}

.major-stats-card {
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
