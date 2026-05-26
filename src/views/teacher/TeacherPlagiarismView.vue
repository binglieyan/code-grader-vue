<script setup lang="ts">
import { computed, ref } from 'vue';
import { ElMessage } from 'element-plus';
import PageIntro from '../../components/PageIntro.vue';
import { teacherApi } from '@/api/services.js';
import { formatDateTime } from '@/utils/helpers.js';

import type {
  ClassesVO,
  AssignmentVO,
  PlagiarismChecksVO,
  PlagiarismComparisonsVO,
} from '@/types/api';

const classes = ref<ClassesVO[]>([]);
const assignments = ref<AssignmentVO[]>([]);
const selectedClassCode = ref('');
const selectedAssignmentId = ref<number | ''>('');
const checks = ref<PlagiarismChecksVO[]>([]);
const comparisons = ref<PlagiarismComparisonsVO[]>([]);
const currentCheck = ref<PlagiarismChecksVO | null>(null);
const loading = ref(false);

const selectedClass = computed(
  () =>
    classes.value.find(
      (item) => String(item.classCode) === String(selectedClassCode.value),
    ) || null,
);
const selectedAssignment = computed(
  () =>
    assignments.value.find(
      (item) => String(item.id) === String(selectedAssignmentId.value),
    ) || null,
);

const resetCheckState = () => {
  checks.value = [];
  comparisons.value = [];
  currentCheck.value = null;
};

const loadClasses = async () => {
  try {
    const result = await teacherApi.getClasses();
    classes.value = Array.isArray(result) ? result : [];
  } catch (error) {
    const message = error instanceof Error ? error.message : '加载班级失败';
    ElMessage.error(message);
  }
};

const handleClassChange = async (classCode: string) => {
  selectedClassCode.value = classCode || '';
  selectedAssignmentId.value = '';
  assignments.value = [];
  resetCheckState();

  if (!selectedClassCode.value) return;

  loading.value = true;
  try {
    const result = await teacherApi.getAssignmentsByClass(
      selectedClassCode.value,
    );
    assignments.value = Array.isArray(result) ? result : [];
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '加载班级下的作业失败';
    ElMessage.error(message);
  } finally {
    loading.value = false;
  }
};

const handleAssignmentChange = async (assignmentId: string) => {
  selectedAssignmentId.value = assignmentId ? Number(assignmentId) : '';
  resetCheckState();

  if (selectedAssignmentId.value) {
    await loadChecks();
  }
};

const publishCheck = async () => {
  if (!selectedAssignmentId.value) {
    ElMessage.warning('请先选择作业');
    return;
  }

  loading.value = true;
  try {
    await teacherApi.publishPlagiarism(selectedAssignmentId.value as number);
    ElMessage.success('查重任务已发布');
    await loadChecks();
  } catch (error) {
    const message = error instanceof Error ? error.message : '发布查重任务失败';
    ElMessage.error(message);
  } finally {
    loading.value = false;
  }
};

const loadChecks = async () => {
  if (!selectedAssignmentId.value) {
    ElMessage.warning('请先选择作业');
    return;
  }

  loading.value = true;
  resetCheckState();
  try {
    const result = await teacherApi.getPlagiarismChecks(
      selectedAssignmentId.value as number,
    );
    checks.value = Array.isArray(result) ? result : [];

    // 自动选择第一项
    if (checks.value.length > 0) {
      const firstCheck = checks.value[0];
      if (firstCheck) {
        currentCheck.value = firstCheck;
        await loadComparisons(firstCheck);
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '加载查重任务失败';
    ElMessage.error(message);
  } finally {
    loading.value = false;
  }
};

const loadComparisons = async (row: PlagiarismChecksVO) => {
  currentCheck.value = row;
  comparisons.value = [];

  if (!row?.id) return;

  try {
    const result = await teacherApi.getPlagiarismComparisons(row.id);
    comparisons.value = Array.isArray(result) ? result : [];
  } catch (error) {
    const message = error instanceof Error ? error.message : '加载比对结果失败';
    ElMessage.error(message);
  }
};

const downloadReport = async (row: PlagiarismChecksVO) => {
  if (!row?.id) {
    ElMessage.warning('请选择要下载的查重报告');
    return;
  }

  try {
    const { blob, filename } = await teacherApi.downloadPlagiarismReport(
      row.id,
    );
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    // 优先使用后端返回的文件名，如果没有则使用默认格式
    link.download = filename || `查重报告_${row.id}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    ElMessage.success('下载报告成功');
  } catch (error) {
    const message = error instanceof Error ? error.message : '下载查重报告失败';
    ElMessage.error(message);
  }
};

loadClasses();
</script>

<template>
  <div class="page-container">
    <PageIntro
      subtitle="先选择班级，再选择作业，最后根据作业 ID 查询或发布查重任务。"
      title="查重中心"
    >
      <el-select
        :model-value="selectedClassCode"
        clearable
        filterable
        placeholder="选择班级"
        style="width: 220px"
        @change="handleClassChange"
      >
        <el-option
          v-for="item in classes"
          :key="item.classCode"
          :label="`${item.className || item.classCode} (${item.classCode})`"
          :value="String(item.classCode)"
        />
      </el-select>
      <el-select
        v-model="selectedAssignmentId"
        :disabled="!selectedClassCode"
        clearable
        filterable
        placeholder="选择作业"
        style="width: 240px"
        @change="handleAssignmentChange"
      >
        <el-option
          v-for="item in assignments"
          :key="item.id"
          :label="item.title"
          :value="item.id"
        />
      </el-select>
      <el-button
        :disabled="!selectedAssignmentId"
        :loading="loading"
        @click="loadChecks"
        >查询任务</el-button
      >
      <el-button
        :disabled="!selectedAssignmentId"
        :loading="loading"
        type="primary"
        @click="publishCheck"
        >发布查重
      </el-button>
    </PageIntro>

    <div class="page-grid grid-2">
      <section class="glass-panel page-card">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">查重任务列表</h3>
            <p class="panel-subtitle">
              {{
                selectedClass && selectedAssignment
                  ? `${selectedClass.classCode} / ${selectedAssignment.title} / assignmentId = ${selectedAssignment.id}`
                  : '请先选择班级和作业'
              }}
            </p>
          </div>
        </div>

        <el-table
          v-if="checks.length"
          :data="checks"
          highlight-current-row
          @current-change="loadComparisons"
        >
          <el-table-column label="任务 ID" prop="id" width="90" />
          <el-table-column label="作业 ID" prop="assignmentId" width="100" />
          <el-table-column label="状态编码" prop="statusValue" width="120" />
          <el-table-column
            label="错误信息"
            min-width="180"
            prop="errorMessage"
            show-overflow-tooltip
          />
          <el-table-column label="比较数" prop="totalComparisons" width="100" />
          <el-table-column label="开始时间" min-width="170" prop="startTime">
            <template #default="{ row }">{{
              formatDateTime(row.startTime)
            }}</template>
          </el-table-column>
          <el-table-column label="执行时长" prop="executionTime" width="110">
            <template #default="{ row }">{{ row.executionTime }} ms</template>
          </el-table-column>
          <el-table-column label="完成时间" min-width="170" prop="completedAt">
            <template #default="{ row }">{{
              formatDateTime(row.completedAt)
            }}</template>
          </el-table-column>
          <el-table-column fixed="right" label="操作" width="120">
            <template #default="{ row }">
              <el-button
                :disabled="!row.completedAt"
                size="small"
                type="primary"
                @click="downloadReport(row)"
              >
                下载报告
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty
          v-else
          :description="
            selectedAssignmentId
              ? '当前作业还没有查重任务'
              : '先选择班级和作业后再查询'
          "
        />
      </section>

      <section class="glass-panel page-card">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">相似性比对</h3>
            <p class="panel-subtitle">
              {{
                currentCheck ? `任务 #${currentCheck.id}` : '请先选择查重任务'
              }}
            </p>
          </div>
        </div>

        <el-table v-if="comparisons.length" :data="comparisons" stripe>
          <el-table-column
            label="提交 A"
            min-width="160"
            prop="firstSubmissionName"
          />
          <el-table-column
            label="提交 B"
            min-width="160"
            prop="secondSubmissionName"
          />
          <el-table-column
            label="平均相似度"
            prop="avgSimilarity"
            width="120"
          />
          <el-table-column
            label="最大相似度"
            prop="maxSimilarity"
            width="120"
          />
          <el-table-column label="最大长度" prop="maximumLength" width="100" />
          <el-table-column label="最长匹配" prop="longestMatch" width="110" />
        </el-table>
        <el-empty
          v-else
          :description="
            currentCheck ? '当前任务暂无比对结果' : '请先选择查重任务'
          "
        />
      </section>
    </div>
  </div>
</template>

<style scoped>
.page-card {
  padding: 24px;
}
</style>
