<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import PageIntro from '../../components/PageIntro.vue';
import MonacoEditor from '../../components/MonacoEditor.vue';
import { studentApi } from '@/api/services.js';
import { decodeEscapedText, formatDateTime } from '@/utils/helpers.js';

import type {
  AssignmentVO,
  QuestionsBriefVO,
  QuestionsVO,
  TestCasesVO,
} from '@/types/api';

const assignments = ref<AssignmentVO[]>([]);
const questions = ref<QuestionsVO[]>([]);
const visibleCases = ref<TestCasesVO[]>([]);
const currentAssignment = ref<AssignmentVO | null>(null);
const currentQuestion = ref<QuestionsVO | null>(null);
const answerForm = reactive({
  questionId: 0,
  studentAnswer: '',
  file: null as File | null,
});


// 作业搜索文本
const assignmentSearchText = ref('');
const filteredAssignments = computed(() => {
  if (!assignmentSearchText.value) return assignments.value;
  const searchText = assignmentSearchText.value.toLowerCase();
  return assignments.value.filter(
    (item) =>
      (item.title?.toLowerCase() || '').includes(searchText) ||
      (item.classCode?.toLowerCase() || '').includes(searchText) ||
      (item.assignmentStatusValue?.toLowerCase() || '').includes(searchText),
  );
});

const normalizeQuestion = (
  item: QuestionsBriefVO & Partial<QuestionsVO>,
  index = 0,
): QuestionsVO => ({
  ...item,
  questionOrder: item?.questionOrder ?? index + 1,
  maxScore: item?.maxScore ?? null,
  content: item?.content || '',
  initialCode: decodeEscapedText(item?.initialCode || ''),
});

const loadAssignments = async () => {
  try {
    const result = await studentApi.getAssignments();
    assignments.value = Array.isArray(result) ? result : [];
    if (assignments.value.length) {
      // 如果已有选中的作业，重新加载该作业的详情
      if (currentAssignment.value?.id) {
        const currentId = currentAssignment.value.id;
        currentAssignment.value = null;
        const matchedAssignment = assignments.value.find(
          (item) => item.id === currentId,
        );
        if (matchedAssignment) {
          await selectAssignment(matchedAssignment);
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
    const message = error instanceof Error ? error.message : '加载作业失败';
    ElMessage.error(message);
  }
};

const handleAssignmentChange = (row: AssignmentVO | null) => {
  if (row) selectAssignment(row);
};

const selectAssignment = async (row: AssignmentVO) => {
  if (!row?.id) return;

  currentAssignment.value = row;
  currentQuestion.value = null;
  visibleCases.value = [];
  answerForm.questionId = 0;
  answerForm.studentAnswer = '';
  answerForm.file = null;

  try {
    const result = await studentApi.getQuestionsByAssignment(row.id);
    questions.value = (Array.isArray(result) ? result : [])
      .map((item, index) => normalizeQuestion(item, index))
      .sort(
        (left, right) => (left.questionOrder ?? 0) - (right.questionOrder ?? 0),
      );

    if (!questions.value.length) {
      currentQuestion.value = null;
      visibleCases.value = [];
      return;
    }

    const firstQuestion = questions.value[0];
    if (firstQuestion) {
      await selectQuestion(firstQuestion);
    }
  } catch (error) {
    questions.value = [];
    currentQuestion.value = null;
    visibleCases.value = [];
    const message = error instanceof Error ? error.message : '加载题目列表失败';
    ElMessage.error(message);
  }
};
const handleQuestionChange = (row: QuestionsVO | null) => {
  if (row) selectQuestion(row);
};

const selectQuestion = async (row: QuestionsVO) => {
  if (!row?.id) return;

  try {
    // 获取题目详情（包含 content 和 initialCode）
    const detail = await studentApi.getQuestionById(row.id);

    // 合并列表数据和详情数据，保留 questionOrder 字段
    currentQuestion.value = {
      ...row, // 包含 questionOrder
      ...detail, // 包含 content 和 initialCode
      questionOrder: row.questionOrder ?? detail.questionOrder,
      initialCode: decodeEscapedText(detail.initialCode || ''),
    };

    answerForm.questionId = row.id;
    answerForm.studentAnswer = currentQuestion.value.initialCode || '';
    answerForm.file = null;

    try {
      const result = await studentApi.getVisibleTestCases(row.id);
      visibleCases.value = Array.isArray(result) ? result : [];
    } catch (error) {
      visibleCases.value = [];
      const message =
        error instanceof Error ? error.message : '加载测试用例失败';
      ElMessage.error(message);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '加载题目详情失败';
    ElMessage.error(message);
  }
};

const createSubmission = async () => {
  if (!currentAssignment.value) {
    ElMessage.warning('请先选择作业');
    return;
  }

  try {
    await studentApi.createSubmission(currentAssignment.value.id);
    ElMessage.success('作业提交成功，系统将在后台自动判题');
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : '作业提交失败';
    ElMessage.error(message);
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const onFileChange = (file: any) => {
  if (file.raw) {
    answerForm.file = file.raw;
  }
};

const submitAnswer = async () => {
  if (!answerForm.questionId) {
    ElMessage.warning('请先选择题目');
    return;
  }
  if (!answerForm.file) {
    ElMessage.warning('请先选择源码文件');
    return;
  }

  const formData = new FormData();
  formData.append('file', answerForm.file);

  try {
    await studentApi.uploadQuestionAnswer(answerForm.questionId, formData);
    ElMessage.success('文件上传成功');
    if (currentQuestion.value) {
      await selectQuestion(currentQuestion.value);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '上传文件失败';
    ElMessage.error(message);
  }
};

onMounted(() => loadAssignments());
</script>

<template>
  <div class="page-container">
    <PageIntro title="作业提交">
      <el-button plain @click="loadAssignments">刷新作业</el-button>
    </PageIntro>

    <div class="page-grid workspace-layout">
      <!-- 第一行：作业列表和题目列表 -->
      <section class="glass-panel page-card">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">作业列表</h3>
            <p class="panel-subtitle">选择作业后查看题目</p>
          </div>
          <el-input
            v-model="assignmentSearchText"
            clearable
            placeholder="搜索标题、班级或状态"
            style="width: 240px"
          />
        </div>
        <el-table
          :data="filteredAssignments"
          highlight-current-row
          @current-change="handleAssignmentChange"
        >
          <el-table-column label="作业标题" min-width="120" prop="title" />
          <el-table-column label="班级代码" prop="classCode" width="80" />
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
          <el-table-column
            label="状态"
            prop="assignmentStatusValue"
            width="120"
          />
        </el-table>
      </section>

      <section class="glass-panel page-card">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">题目列表</h3>
            <p class="panel-subtitle">
              {{ currentAssignment?.title || '请先选择作业' }}
            </p>
          </div>
        </div>
        <el-table
          :data="questions"
          highlight-current-row
          @current-change="handleQuestionChange"
        >
          <el-table-column label="序号" prop="questionOrder" width="80" />
          <el-table-column label="题目标题" min-width="180" prop="title" />
          <el-table-column label="题目分值" prop="maxScore" width="180" />
        </el-table>
      </section>
    </div>

    <!-- 第二行：答题区和测试用例 -->
    <div class="page-grid workspace-bottom-grid">
      <!-- 答题区 -->
      <section class="glass-panel page-card workspace-editor-card">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">答题区</h3>
            <p class="panel-subtitle">
              {{ currentQuestion?.title || '请选择题目' }}
            </p>
          </div>
        </div>
        <div v-if="currentQuestion" class="workspace-editor">
          <el-form label-position="top">
            <el-form-item label="题目内容">
              <div class="question-content">
                {{ currentQuestion.content || '暂无题目内容' }}
              </div>
            </el-form-item>
            <el-form-item label="初始代码">
              <MonacoEditor
                v-model="answerForm.studentAnswer"
                height="360px"
                language="java"
              />
            </el-form-item>
            <el-form-item label="源码文件">
              <div class="file-upload-row">
                <el-upload
                  :auto-upload="false"
                  :limit="1"
                  :on-change="onFileChange"
                >
                  <el-button plain>选择文件</el-button>
                </el-upload>
                <el-button type="primary" @click="submitAnswer"
                  >文件上传</el-button
                >
              </div>
            </el-form-item>
            <div class="upload-hint soft-text">
              提交时仅上传所选源码文件，编辑区内容仅作为本地草稿。
            </div>
            <el-space>
              <el-button
                type="primary"
                @click="createSubmission"
                >提交作业</el-button
              >
            </el-space>
          </el-form>
        </div>
      </section>

      <!-- 测试用例 -->
      <section
        v-if="visibleCases.length"
        class="glass-panel page-card test-cases-card"
      >
        <div class="panel-header">
          <div>
            <h3 class="panel-title">可见测试用例</h3>
            <p class="panel-subtitle">{{ currentQuestion?.title || '' }}</p>
          </div>
        </div>
        <el-table :data="visibleCases" style="width: 100%">
          <el-table-column label="顺序" prop="caseOrder" width="80" />
          <el-table-column label="输入" min-width="250">
            <template #default="{ row }">
              <div class="test-case-editor">
                <MonacoEditor
                  :line-numbers="'off'"
                  :model-value="
                    Array.isArray(row.inputData)
                      ? row.inputData.join('\n')
                      : row.inputData || ''
                  "
                  :read-only="true"
                  height="120px"
                  language="java"
                />
              </div>
            </template>
          </el-table-column>
          <el-table-column label="期望输出" min-width="250">
            <template #default="{ row }">
              <div class="test-case-editor">
                <MonacoEditor
                  :line-numbers="'off'"
                  :model-value="row.expectedOutput || ''"
                  :read-only="true"
                  height="120px"
                  language="java"
                />
              </div>
            </template>
          </el-table-column>
        </el-table>
      </section>
    </div>

  </div>
</template>

<style scoped>
.workspace-layout {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: start;
}

.workspace-bottom-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
  margin-top: 20px;
}

.workspace-editor-card {
  display: flex;
  flex-direction: column;
}

.test-cases-card {
  display: flex;
  flex-direction: column;
}

.page-card {
  padding: 24px;
}

.workspace-editor {
  margin-top: 20px;
}

.question-content {
  padding: 16px;
  background: var(--el-fill-color-light);
  border-radius: 4px;
  line-height: 1.8;
  white-space: pre-wrap;
}

.upload-hint {
  margin: -4px 0 16px;
  font-size: 13px;
}

.file-upload-row {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.test-case-editor {
  height: 120px;
  border-radius: 4px;
  overflow: hidden;
}

@media (max-width: 1360px) {
  .workspace-layout,
  .workspace-bottom-grid {
    grid-template-columns: 1fr;
  }
}
</style>
