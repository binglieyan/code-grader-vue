<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import PageIntro from '../../components/PageIntro.vue';
import MonacoEditor from '../../components/MonacoEditor.vue';
import { studentApi } from '@/api/services.js';
import { formatDateTime, toArray } from '@/utils/helpers.js';

import type {
  AssignmentVO,
  QuestionsBriefVO,
  SubmissionsVO,
  QuestionSubmissionsVO,
  TestCaseResultsVO,
  HiddenTestCaseResultsVO,
} from '@/types/api';

const assignments = ref<AssignmentVO[]>([]);
const questions = ref<QuestionsBriefVO[]>([]);
const submissionDetail = reactive<Partial<SubmissionsVO>>({});
const currentAssignment = reactive<Partial<AssignmentVO>>({});
const currentQuestion = reactive<Partial<QuestionsBriefVO>>({});
const questionSubmissionDetail = reactive<Partial<QuestionSubmissionsVO>>({});
const codeContent = ref('');
const testCaseResults = ref<TestCaseResultsVO[]>([]);
const hiddenTestCaseStats = reactive<Partial<HiddenTestCaseResultsVO>>({});

// 作业搜索文本
const assignmentSearchText = ref('');
const filteredAssignments = computed(() => {
  if (!assignmentSearchText.value) return assignments.value;
  const searchText = assignmentSearchText.value.toLowerCase();
  return assignments.value.filter(
    (item) =>
      (item.title?.toLowerCase() || '').includes(searchText) ||
      (item.classCode?.toLowerCase() || '').includes(searchText),
  );
});

const loadAssignments = async () => {
  try {
    const result = await studentApi.getAssignments();
    assignments.value = Array.isArray(result) ? result : [];
    if (assignments.value.length) {
      // 如果已有选中的作业，重新加载该作业的详情
      if (currentAssignment.id) {
        const currentId = currentAssignment.id;
        Object.assign(currentAssignment, {});
        const assignment = assignments.value.find(
          (item) => item.id === currentId,
        );
        if (assignment) {
          await selectAssignment(assignment);
        } else {
          const firstAssignment = assignments.value[0];
          if (firstAssignment) {
            await selectAssignment(firstAssignment);
          }
        }
      } else {
        // 否则选择第一个作业
        const firstAssignment = assignments.value[0];
        if (firstAssignment) {
          await selectAssignment(firstAssignment);
        }
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '加载作业列表失败';
    ElMessage.error(message);
  }
};

const handleAssignmentChange = (row: AssignmentVO | null) => {
  if (row) selectAssignment(row);
};

const selectAssignment = async (row: AssignmentVO) => {
  if (!row?.id) return;

  Object.assign(currentAssignment, row);
  questions.value = [];
  // 重置为初始状态
  Object.assign(submissionDetail, {});
  Object.assign(currentQuestion, {});
  Object.assign(questionSubmissionDetail, {});
  codeContent.value = '';

  try {
    // 获取作业提交详情
    const detail = await studentApi.getSubmissionDetail(row.id);
    Object.assign(submissionDetail, detail || {});
  } catch (error) {
    Object.assign(submissionDetail, {});
    // 显示后端返回的异常信息
    const message =
      error instanceof Error ? error.message : '加载作业提交详情失败';
    ElMessage.error(message);
  }

  try {
    // 获取题目列表
    const result = await studentApi.getQuestionsByAssignment(row.id);
    questions.value = Array.isArray(result) ? result : [];

    // 如果有题目，默认选择第一个并加载提交详情
    if (questions.value.length) {
      const firstQuestion = questions.value[0];
      if (firstQuestion) {
        await selectQuestion(firstQuestion);
      }
    }
  } catch (error) {
    questions.value = [];
    const message = error instanceof Error ? error.message : '加载题目列表失败';
    ElMessage.error(message);
  }
};

const handleQuestionChange = (row: QuestionsBriefVO | null) => {
  if (row) selectQuestion(row);
};

const selectQuestion = async (row: QuestionsBriefVO) => {
  if (!row?.id) {
    Object.assign(currentQuestion, row || {});
    Object.assign(questionSubmissionDetail, {});
    codeContent.value = '';
    testCaseResults.value = [];
    Object.assign(hiddenTestCaseStats, {});
    return;
  }

  Object.assign(currentQuestion, row);
  Object.assign(questionSubmissionDetail, {});
  codeContent.value = '';
  testCaseResults.value = [];
  Object.assign(hiddenTestCaseStats, {});

  try {
    // 获取题目提交详情（返回的是数组）
    const result = await studentApi.getQuestionSubmission(row.id);
    console.log('题目提交详情:', result);
    // 取第一个提交记录（通常只有一个）
    const detail = toArray(result)?.[0] || null;
    Object.assign(questionSubmissionDetail, detail || {});
    // 单独设置代码内容，确保编辑器能正确响应
    codeContent.value = questionSubmissionDetail.studentAnswerCode || '';

    // 如果有提交记录，加载测试用例结果
    if (questionSubmissionDetail.id) {
      await loadTestCaseResults(questionSubmissionDetail.id);
    }
  } catch (error) {
    console.error('获取题目提交详情失败:', error);
    Object.assign(questionSubmissionDetail, {});
    codeContent.value = '';
    const message =
      error instanceof Error ? error.message : '加载题目提交详情失败';
    ElMessage.error(message);
  }
};

const loadTestCaseResults = async (questionSubmissionId: number) => {
  try {
    // 获取测试用例结果
    const results = await studentApi.getTestCaseResults(questionSubmissionId);
    testCaseResults.value = Array.isArray(results) ? results : [];
  } catch (error) {
    console.error('获取测试用例结果失败:', error);
    testCaseResults.value = [];
    const message =
      error instanceof Error ? error.message : '加载测试用例结果失败';
    ElMessage.error(message);
  }

  try {
    // 获取隐藏测试用例通过情况
    const stats =
      await studentApi.getHiddenTestCaseResults(questionSubmissionId);
    Object.assign(hiddenTestCaseStats, stats || {});
  } catch (error) {
    console.error('获取隐藏测试用例结果失败:', error);
    Object.assign(hiddenTestCaseStats, {});
    const message =
      error instanceof Error ? error.message : '加载隐藏测试用例统计失败';
    ElMessage.error(message);
  }
};

const calculatePassRate = (stats: Partial<HiddenTestCaseResultsVO>) => {
  if (!stats || !stats.totalCount || stats.totalCount === 0) return 0;
  const passed = stats.passedCount || 0;
  return Math.round((passed / stats.totalCount) * 100);
};

onMounted(() => loadAssignments());
</script>

<template>
  <div class="page-container">
    <PageIntro subtitle="查看各作业的提交情况和成绩详情" title="成绩查看">
      <el-button plain @click="loadAssignments">刷新成绩</el-button>
    </PageIntro>

    <div class="page-grid grade-layout">
      <!-- 左侧：作业列表 -->
      <section class="glass-panel page-card">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">作业列表</h3>
            <p class="panel-subtitle">选择作业查看详细成绩</p>
          </div>
          <el-input
            v-model="assignmentSearchText"
            clearable
            placeholder="搜索标题或班级"
            style="width: 240px"
          />
        </div>
        <el-table
          :data="filteredAssignments"
          highlight-current-row
          @current-change="handleAssignmentChange"
        >
          <el-table-column label="作业标题" min-width="120" prop="title" />
          <el-table-column label="班级" prop="classCode" width="80" />
          <el-table-column label="作业总分值" width="100">
            <template #default="{ row }">{{ row.totalScore ?? '--' }}</template>
          </el-table-column>
          <el-table-column label="开始时间" min-width="160" prop="startTime">
            <template #default="{ row }">{{
              formatDateTime(row.startTime)
            }}</template>
          </el-table-column>
          <el-table-column label="截止时间" min-width="160" prop="deadline">
            <template #default="{ row }">{{
              formatDateTime(row.deadline)
            }}</template>
          </el-table-column>
        </el-table>
      </section>

      <!-- 右侧：作业提交记录 -->
      <section class="glass-panel page-card">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">作业提交记录</h3>
            <p class="panel-subtitle">
              {{ currentAssignment?.title || '请先选择作业' }}
            </p>
          </div>
          <div></div>
        </div>
        <el-descriptions
          v-if="submissionDetail && submissionDetail.title"
          :column="2"
          border
        >
          <el-descriptions-item label="作业标题">{{
            submissionDetail.title
          }}</el-descriptions-item>
          <el-descriptions-item label="作业总得分">{{
            submissionDetail.totalScore
          }}</el-descriptions-item>
          <el-descriptions-item label="提交时间"
            >{{ formatDateTime(submissionDetail.submittedAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="批改时间"
            >{{ formatDateTime(submissionDetail.gradingCompletedAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag
              :type="
                submissionDetail.submissionStatusValue === '已批改'
                  ? 'success'
                  : 'warning'
              "
              size="small"
            >
              {{ submissionDetail.submissionStatusValue || '--' }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
        <el-empty v-else description="该作业尚未提交，请先创建提交记录" />
      </section>
    </div>

    <!-- 第二行：题目列表 -->
    <section class="glass-panel page-card grade-questions-card">
      <div class="panel-header">
        <div>
          <h3 class="panel-title">题目列表</h3>
          <p class="panel-subtitle">
            {{ currentAssignment?.title || '请先选择作业' }}
          </p>
        </div>
        <div></div>
      </div>
      <el-table
        :data="questions"
        highlight-current-row
        @current-change="handleQuestionChange"
      >
        <el-table-column label="顺序" prop="questionOrder" width="80" />
        <el-table-column label="题目标题" min-width="180" prop="title" />
        <el-table-column label="题目分值" prop="maxScore" width="180" />
      </el-table>
    </section>

    <!-- 第三行：题目提交详情 -->
    <section
      v-if="currentQuestion"
      class="glass-panel page-card grade-questions-card"
    >
      <div class="panel-header">
        <div>
          <h3 class="panel-title">题目提交详情</h3>
          <p class="panel-subtitle">{{ currentQuestion?.title || '' }}</p>
        </div>
        <div></div>
      </div>
      <el-descriptions v-if="questionSubmissionDetail" :column="2" border>
        <el-descriptions-item label="题目得分">{{
          questionSubmissionDetail.score ?? '--'
        }}</el-descriptions-item>
        <el-descriptions-item
          v-if="questionSubmissionDetail.gradingCompletedAt"
          label="批改完成时间"
        >
          {{ formatDateTime(questionSubmissionDetail.gradingCompletedAt) }}
        </el-descriptions-item>
        <el-descriptions-item label="批改教师"
          >{{ questionSubmissionDetail.gradedByName || '--' }}
        </el-descriptions-item>
        <el-descriptions-item
          v-if="questionSubmissionDetail.teacherFeedback"
          label="教师反馈"
        >
          {{ questionSubmissionDetail.teacherFeedback }}
        </el-descriptions-item>
      </el-descriptions>

      <!-- 代码答案展示 -->
      <div
        v-if="questionSubmissionDetail?.studentAnswerCode"
        class="code-editor-container"
      >
        <div class="code-editor-title">学生答案</div>
        <MonacoEditor
          v-model="codeContent"
          :read-only="true"
          height="400px"
          language="java"
        />
      </div>

      <!-- 测试用例结果 -->
      <div v-if="testCaseResults.length" class="test-results-container">
        <div class="test-results-title">可见测试用例结果</div>
        <el-table :data="testCaseResults" style="width: 100%">
          <el-table-column label="用例 ID" prop="testCaseId" width="100" />
          <el-table-column label="是否通过" width="100">
            <template #default="{ row }">
              <el-tag :type="row.passed ? 'success' : 'danger'" size="small">
                {{ row.passed ? '通过' : '未通过' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            label="执行时间 (ms)"
            prop="executionTime"
            width="120"
          />
          <el-table-column label="实际输出" min-width="250">
            <template #default="{ row }">
              <div class="test-case-editor-small">
                <MonacoEditor
                  :line-numbers="'off'"
                  :model-value="row.actualOutput || '--'"
                  :read-only="true"
                  height="45px"
                  language="java"
                />
              </div>
            </template>
          </el-table-column>
          <el-table-column label="错误信息" min-width="200">
            <template #default="{ row }">
              <div v-if="row.errorMessage" class="error-message">
                {{ row.errorMessage }}
              </div>
              <span v-else>--</span>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 隐藏测试用例通过情况 -->
      <div v-if="hiddenTestCaseStats" class="hidden-test-stats-container">
        <div class="hidden-test-stats-title">隐藏测试用例通过情况</div>
        <el-descriptions :column="3" border>
          <el-descriptions-item label="总隐藏用例数">
            {{ hiddenTestCaseStats.totalCount ?? '--' }}
          </el-descriptions-item>
          <el-descriptions-item label="通过数量">
            <el-tag size="small" type="success">
              {{ hiddenTestCaseStats.passedCount ?? 0 }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="通过率">
            <el-progress
              :percentage="calculatePassRate(hiddenTestCaseStats)"
              :status="
                calculatePassRate(hiddenTestCaseStats) >= 80
                  ? 'success'
                  : 'warning'
              "
              :stroke-width="18"
              :text-inside="true"
            />
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </section>
  </div>
</template>

<style scoped>
.grade-layout {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
  align-items: start;
}

.page-card {
  padding: 24px;
}

.grade-questions-card {
  margin-top: 20px;
}

.code-editor-container {
  margin-top: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
}

.code-editor-title {
  padding: 12px 16px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
  font-weight: 500;
  color: #606266;
}

.test-results-container,
.hidden-test-stats-container {
  margin-top: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
}

.test-results-title,
.hidden-test-stats-title {
  padding: 12px 16px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
  font-weight: 500;
  color: #606266;
}

.test-case-editor-small {
  height: 50px;
  border-radius: 4px;
  overflow: hidden;
}

.error-message {
  color: #f56c6c;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

@media (max-width: 1360px) {
  .grade-layout {
    grid-template-columns: 1fr;
  }
}
</style>
