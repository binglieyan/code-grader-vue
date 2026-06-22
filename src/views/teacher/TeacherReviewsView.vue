<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import PageIntro from '../../components/PageIntro.vue';
import CodeBlock from '../../components/CodeBlock.vue';
import { teacherApi } from '@/api/services.js';
import { formatDateTime } from '@/utils/helpers.js';

import type {
  ClassesVO,
  AssignmentVO,
  StudentVO,
  QuestionsBriefVO,
  SubmissionsVO,
  QuestionSubmissionsVO,
  TestCaseResultsVO,
} from '@/types/api';

const classes = ref<ClassesVO[]>([]);
const assignments = ref<AssignmentVO[]>([]);
const students = ref<StudentVO[]>([]);
const questions = ref<QuestionsBriefVO[]>([]);

const selectedClassCode = ref('');
const selectedAssignmentId = ref<number | ''>('');
const selectedStudentNumber = ref('');
const selectedQuestionId = ref<number | ''>('');

const submission = ref<SubmissionsVO | null>(null);
const questionSubmissions = ref<QuestionSubmissionsVO[]>([]);
const currentQuestionSubmission = ref<QuestionSubmissionsVO | null>(null);
const testResults = ref<TestCaseResultsVO[]>([]);
const loading = ref(false);
const saving = ref(false);

const reviewForm = reactive({
  id: 0,
  score: null as number | null,
  teacherFeedback: '',
});

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
const selectedStudent = computed(
  () =>
    students.value.find(
      (item) => String(item.userNumber) === String(selectedStudentNumber.value),
    ) || null,
);

const studentSearchText = ref('');
const filteredStudents = computed(() => {
  if (!studentSearchText.value) return students.value;
  const searchText = studentSearchText.value.toLowerCase();
  return students.value.filter(
    (item) =>
      (item.userNumber?.toLowerCase() || '').includes(searchText) ||
      (item.realName?.toLowerCase() || '').includes(searchText) ||
      (item.username?.toLowerCase() || '').includes(searchText),
  );
});

const resetSubmissionState = () => {
  submission.value = null;
  questionSubmissions.value = [];
  currentQuestionSubmission.value = null;
  testResults.value = [];
  selectedQuestionId.value = '';
  reviewForm.id = 0;
  reviewForm.score = null;
  reviewForm.teacherFeedback = '';
};

const syncReviewForm = (row: QuestionSubmissionsVO | null) => {
  reviewForm.id = row?.id ?? 0;
  reviewForm.score = row?.score ?? null;
  reviewForm.teacherFeedback = row?.teacherFeedback || '';
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

/**
 * 截断长文本，超过指定长度后显示省略号
 */
const truncateText = (text: string, maxLength = 100): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...（内容过长，已截断）';
};

const handleClassChange = async (classCode: string) => {
  selectedClassCode.value = classCode || '';
  selectedAssignmentId.value = '';
  selectedStudentNumber.value = '';
  studentSearchText.value = '';
  assignments.value = [];
  students.value = [];
  questions.value = [];
  resetSubmissionState();

  if (!selectedClassCode.value) return;

  loading.value = true;
  try {
    const [assignmentData, studentData] = await Promise.all([
      teacherApi.getAssignmentsByClass(selectedClassCode.value),
      teacherApi.getStudentsByClass(selectedClassCode.value),
    ]);
    assignments.value = Array.isArray(assignmentData) ? assignmentData : [];
    students.value = Array.isArray(studentData) ? studentData : [];
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '加载班级下的数据失败';
    ElMessage.error(message);
  } finally {
    loading.value = false;
  }
};

const handleAssignmentChange = async (assignmentId: string) => {
  selectedAssignmentId.value = assignmentId ? Number(assignmentId) : '';
  questions.value = [];
  resetSubmissionState();

  if (!selectedAssignmentId.value) return;

  loading.value = true;
  try {
    const result = await teacherApi.getQuestionsByAssignment(
      selectedAssignmentId.value as number,
    );
    questions.value = Array.isArray(result) ? result : [];
  } catch (error) {
    const message = error instanceof Error ? error.message : '加载作业题目失败';
    ElMessage.error(message);
  } finally {
    loading.value = false;
  }

  if (selectedStudentNumber.value) {
    await loadSubmission();
  }
};

const handleStudentChange = async (studentNumber: string) => {
  selectedStudentNumber.value = studentNumber || '';
  resetSubmissionState();

  if (selectedAssignmentId.value && selectedStudentNumber.value) {
    await loadSubmission();
  }
};

const handleSelectStudent = (row: StudentVO | null) => {
  if (row) selectStudent(row);
};

const selectStudent = async (row: StudentVO) => {
  const studentNumber = row?.userNumber || '';
  if (studentNumber === selectedStudentNumber.value) return;

  await handleStudentChange(studentNumber);
};

const handleQuestionChange = async (questionId: string) => {
  selectedQuestionId.value = questionId ? Number(questionId) : '';
  questionSubmissions.value = [];
  currentQuestionSubmission.value = null;
  testResults.value = [];
  syncReviewForm(null);

  if (selectedQuestionId.value && selectedStudentNumber.value) {
    await loadQuestionSubmission();
  }
};

const handleSelectQuestion = (row: QuestionsBriefVO | null) => {
  if (row) selectQuestion(row);
};

const selectQuestion = async (row: QuestionsBriefVO) => {
  const questionId = row?.id ?? '';
  if (questionId === selectedQuestionId.value) return;

  await handleQuestionChange(String(questionId));
};

const loadSubmission = async () => {
  if (!selectedAssignmentId.value || !selectedStudentNumber.value) {
    return;
  }

  loading.value = true;
  try {
    submission.value = await teacherApi.getAssignmentSubmission(
      selectedAssignmentId.value as number,
      selectedStudentNumber.value,
    );
  } catch (error) {
    submission.value = null;
    const message = error instanceof Error ? error.message : '加载作业提交失败';
    ElMessage.error(message);
  } finally {
    loading.value = false;
  }
};

const handleSelectQuestionSubmission = (row: QuestionSubmissionsVO | null) => {
  selectQuestionSubmission(row);
};

const selectQuestionSubmission = async (row: QuestionSubmissionsVO | null) => {
  currentQuestionSubmission.value = row;
  syncReviewForm(row);

  if (!row?.id) {
    testResults.value = [];
    return;
  }

  try {
    const result = await teacherApi.getTestCaseResults(row.id);
    testResults.value = Array.isArray(result) ? result : [];
  } catch (error) {
    testResults.value = [];
    const message = error instanceof Error ? error.message : '加载测试结果失败';
    ElMessage.error(message);
  }
};

const loadQuestionSubmission = async () => {
  if (!selectedQuestionId.value || !selectedStudentNumber.value) {
    return;
  }

  loading.value = true;
  try {
    const data = await teacherApi.getQuestionSubmissionDetail(
      selectedQuestionId.value as number,
      selectedStudentNumber.value,
    );
    questionSubmissions.value = Array.isArray(data) ? data : [];
    const firstSubmission = questionSubmissions.value[0];
    currentQuestionSubmission.value = firstSubmission || null;
    syncReviewForm(currentQuestionSubmission.value);

    if (currentQuestionSubmission.value) {
      await selectQuestionSubmission(currentQuestionSubmission.value);
    } else {
      testResults.value = [];
    }
  } catch (error) {
    questionSubmissions.value = [];
    currentQuestionSubmission.value = null;
    testResults.value = [];
    syncReviewForm(null);
    const message = error instanceof Error ? error.message : '加载题目提交失败';
    ElMessage.error(message);
  } finally {
    loading.value = false;
  }
};

const saveManualScore = async () => {
  if (!reviewForm.id) {
    ElMessage.warning('请先选择题目提交记录');
    return;
  }

  // 验证分数是否有效
  if (reviewForm.score === null || reviewForm.score === undefined) {
    ElMessage.warning('请输入题目得分');
    return;
  }

  saving.value = true;
  try {
    await teacherApi.updateQuestionSubmissionScore({
      id: reviewForm.id,
      score: reviewForm.score,
      teacherFeedback: reviewForm.teacherFeedback,
    });
    ElMessage.success('评分结果已保存');
    // 刷新题目提交数据和作业提交概览（因为总分可能变化）
    await loadQuestionSubmission();
    await loadSubmission();
  } catch (error) {
    const message = error instanceof Error ? error.message : '保存评分结果失败';
    ElMessage.error(message);
  } finally {
    saving.value = false;
  }
};

loadClasses();
</script>

<template>
  <div class="page-container">
    <PageIntro
      subtitle="先选班级，再选作业和学生，最后选择题目查看提交与批改结果。"
      title="提交批改"
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
        style="width: 220px"
        @change="handleAssignmentChange"
      >
        <el-option
          v-for="item in assignments"
          :key="item.id"
          :label="item.title"
          :value="item.id"
        />
      </el-select>
    </PageIntro>

    <div class="page-grid review-layout">
      <section class="glass-panel page-card student-table-card">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">学生列表</h3>
            <p class="panel-subtitle">
              {{
                selectedClass && selectedAssignment
                  ? `${selectedClass.classCode} / ${selectedAssignment.title}`
                  : '请先选择班级和作业'
              }}
            </p>
          </div>
          <el-input
            v-model="studentSearchText"
            clearable
            placeholder="搜索学号或姓名"
            style="width: 240px"
          />
        </div>
        <div class="card-content">
          <template v-if="selectedClass && selectedAssignment">
            <el-table
              :current-row-key="selectedStudentNumber"
              :data="filteredStudents"
              highlight-current-row
              max-height="400"
              @current-change="handleSelectStudent"
            >
              <el-table-column label="学号" prop="userNumber" width="140" />
              <el-table-column label="姓名" prop="realName" width="120" />
              <el-table-column label="用户名" min-width="160" prop="username" />
            </el-table>
            <el-empty
              v-if="!filteredStudents.length"
              description="暂无学生数据"
            />
          </template>
          <el-empty v-else description="暂无数据" />
        </div>
      </section>

      <section class="glass-panel page-card submission-summary-card">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">作业提交记录</h3>
            <p class="panel-subtitle">
              {{
                selectedStudent
                  ? `学生：${selectedStudent.realName || selectedStudent.username}`
                  : '请先选择学生'
              }}
            </p>
          </div>
          <div></div>
        </div>
        <template v-if="selectedStudent">
          <el-descriptions v-if="submission" :column="2" border>
            <el-descriptions-item label="作业标题">{{
              submission.title
            }}</el-descriptions-item>
            <el-descriptions-item label="作业总得分">{{
              submission.totalScore ?? '--'
            }}</el-descriptions-item>
            <el-descriptions-item label="提交时间">
              {{ formatDateTime(submission.submittedAt) }}
            </el-descriptions-item>
            <el-descriptions-item label="批改时间">
              {{ formatDateTime(submission.gradingCompletedAt) }}
            </el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag
                :type="
                  submission.submissionStatusValue === '已批改'
                    ? 'success'
                    : 'warning'
                "
                size="small"
              >
                {{ submission.submissionStatusValue || '--' }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
          <el-empty v-else description="该学生尚未提交作业" />
        </template>
        <el-empty v-else description="请先选择学生查看提交记录" />
      </section>

      <section class="glass-panel page-card question-table-card">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">题目列表</h3>
            <p class="panel-subtitle">
              {{
                selectedClass &&
                selectedAssignment &&
                selectedStudent &&
                submission
                  ? `${selectedAssignment.title} / ${selectedStudent.userNumber}`
                  : '请先选择班级、作业和已提交的学生'
              }}
            </p>
          </div>
        </div>
        <div class="card-content">
          <template v-if="submission">
            <el-table
              :current-row-key="selectedQuestionId"
              :data="questions"
              highlight-current-row
              @current-change="handleSelectQuestion"
            >
              <el-table-column label="顺序" prop="questionOrder" width="90" />
              <el-table-column label="题目标题" min-width="200" prop="title" />
              <el-table-column label="题目分值" prop="maxScore" width="90" />
            </el-table>
            <el-empty v-if="!questions.length" description="暂无题目数据" />
          </template>
          <el-empty v-else description="学生未提交作业，无题目可批改" />
        </div>
      </section>

      <section class="glass-panel page-card review-detail-card">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">题目批改</h3>
            <p class="panel-subtitle">
              {{
                selectedQuestionId
                  ? `questionId = ${selectedQuestionId}`
                  : '请选择题目查看提交记录'
              }}
            </p>
          </div>
        </div>
        <div class="card-content">
          <el-table
            v-if="questionSubmissions.length"
            :data="questionSubmissions"
            highlight-current-row
            @current-change="handleSelectQuestionSubmission"
          >
            <el-table-column label="提交 ID" prop="id" width="100" />
            <el-table-column label="题目 ID" prop="questionId" width="100" />
            <el-table-column
              label="学生学号"
              min-width="140"
              prop="studentNumber"
            />
            <el-table-column label="题目得分" prop="score" width="90" />
            <el-table-column
              label="批改时间"
              min-width="180"
              prop="gradingCompletedAt"
            >
              <template #default="{ row }">{{
                formatDateTime(row.gradingCompletedAt)
              }}</template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="当前题目暂无提交记录" />

          <template v-if="currentQuestionSubmission">
            <div class="submission-detail">
              <el-descriptions :column="2" border>
                <el-descriptions-item label="批改教师"
                  >{{ currentQuestionSubmission.gradedByName || '--' }}
                </el-descriptions-item>
                <el-descriptions-item label="当前得分"
                  >{{ currentQuestionSubmission.score ?? '--' }}
                </el-descriptions-item>
                <el-descriptions-item :span="2" label="教师反馈">
                  {{ currentQuestionSubmission.teacherFeedback || '暂无反馈' }}
                </el-descriptions-item>
                <el-descriptions-item :span="2" label="学生答案">
                  <CodeBlock
                    :code="
                      currentQuestionSubmission.studentAnswerCode ||
                      '// 学生未提交代码'
                    "
                    language="java"
                  />
                </el-descriptions-item>
              </el-descriptions>
            </div>

            <div class="manual-score-card">
              <div class="panel-header manual-score-header">
                <div>
                  <h3 class="panel-title">手动评分</h3>
                </div>
                <el-button
                  :loading="saving"
                  type="primary"
                  @click="saveManualScore"
                  >保存评分</el-button
                >
              </div>

              <el-form label-position="top">
                <el-form-item label="题目得分">
                  <el-input-number
                    v-model="reviewForm.score"
                    :max="999999"
                    :min="0"
                    style="width: 100%"
                  />
                </el-form-item>
                <el-form-item label="教师反馈">
                  <el-input
                    v-model="reviewForm.teacherFeedback"
                    :rows="5"
                    placeholder="请输入教师反馈"
                    type="textarea"
                  />
                </el-form-item>
              </el-form>
            </div>
          </template>
        </div>
      </section>
    </div>

    <section class="glass-panel page-card review-results-card">
      <div class="panel-header">
        <div>
          <h3 class="panel-title">测试用例结果</h3>
          <p class="panel-subtitle">按当前选中的题目提交记录读取测试结果。</p>
        </div>
      </div>
      <div class="card-content">
        <el-table :data="testResults" stripe>
          <el-table-column label="用例 ID" prop="testCaseId" width="100" />
          <el-table-column label="是否通过" prop="passed" width="100">
            <template #default="{ row }">
              <span :class="['status-chip', row.passed ? '' : 'danger-chip']">{{
                row.passed ? '通过' : '失败'
              }}</span>
            </template>
          </el-table-column>
          <el-table-column label="执行时长" prop="executionTime" width="120">
            <template #default="{ row }">{{ row.executionTime }} ms</template>
          </el-table-column>
          <el-table-column
            label="实际输出"
            min-width="220"
            prop="actualOutput"
            show-overflow-tooltip
          />
          <el-table-column label="错误信息" min-width="220" prop="errorMessage">
            <template #default="{ row }">
              {{ truncateText(row.errorMessage, 100) }}
            </template>
          </el-table-column>
        </el-table>
      </div>
    </section>
  </div>
</template>

<style scoped>
.review-layout {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: start;
}

.page-card {
  padding: 24px;
  display: flex;
  flex-direction: column;
}

.card-content {
  flex: 1;
  min-height: 0;
}

.student-table-card {
  margin-bottom: 0;
}

.submission-summary-card {
  margin-top: 0;
}

.question-table-card {
  margin-top: 0;
}

.review-detail-card {
  grid-column: span 3;
  min-width: 0;
}

.review-results-card {
  margin-top: 24px;
}

.submission-summary-card {
  padding: 24px;
}

.submission-detail {
  margin-top: 20px;
}

.manual-score-card {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--border);
}

.manual-score-header {
  margin-bottom: 12px;
}

@media (max-width: 1360px) {
  .review-layout {
    grid-template-columns: 1fr;
  }
}
</style>
