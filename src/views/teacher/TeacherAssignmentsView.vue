<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import PageIntro from '../../components/PageIntro.vue';
import EntityDialog from '../../components/EntityDialog.vue';
import CodeBlock from '../../components/CodeBlock.vue';
import MonacoEditor from '../../components/MonacoEditor.vue';
import { teacherApi } from '@/api/services.js';
import {
  decodeEscapedText,
  encodeEscapedText,
  formatDateTime,
} from '@/utils/helpers.js';

import type {
  ClassesVO,
  AssignmentVO,
  AssignmentsDTO,
  AssignmentsUpdateDTO,
  QuestionsBriefVO,
  QuestionsVO,
  QuestionsDTO,
  QuestionsUpdateDTO,
  TestCasesVO,
  TestCasesDTO,
  TestCasesUpdateDTO,
} from '@/types/api';

const classes = ref<ClassesVO[]>([]);
const selectedClassCode = ref('');
const assignments = ref<AssignmentVO[]>([]);
const currentAssignment = ref<AssignmentVO | null>(null);
const currentQuestion = ref<QuestionsVO | null>(null);
const questions = ref<QuestionsVO[]>([]);
const testCases = ref<TestCasesVO[]>([]);
const loading = ref(false);
const questionLoading = ref(false);

const assignmentDialog = ref(false);
const questionDialog = ref(false);
const testCaseDialog = ref(false);

const editingAssignment = ref<Partial<AssignmentVO> | null>(null);
const editingQuestion = ref<Partial<QuestionsVO> | null>(null);
const editingTestCase = ref<Partial<TestCasesVO> | null>(null);

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

const selectedClass = computed(
  () =>
    classes.value.find(
      (item) => String(item.classCode) === String(selectedClassCode.value),
    ) || null,
);

// 判断当前作业是否为草稿状态
const isDraftStatus = computed(() => {
  const statusCode = currentAssignment.value?.assignmentStatusValue;
  return statusCode === 'DRAFT' || statusCode === '草稿';
});

// 当前选中的题目标签
const selectedQuestionLabel = computed(() => {
  if (!currentQuestion.value) return '请先选择题目';
  return `${currentQuestion.value.title} (ID: ${currentQuestion.value.id})`;
});

// 作业状态选项
const assignmentStatusOptions = [
  { label: '草稿', value: 'DRAFT' },
  { label: '已发布', value: 'PUBLISHED' },
  { label: '已关闭', value: 'CLOSED' },
];

const normalizeQuestion = (
  item: QuestionsVO | (QuestionsBriefVO & Partial<QuestionsVO>),
  index = 0,
): QuestionsVO => ({
  ...item,
  questionOrder: item?.questionOrder ?? index + 1,
  maxScore: item?.maxScore ?? null,
  content: item?.content || '',
  initialCode: decodeEscapedText(item?.initialCode || ''),
});

const resetDetailState = () => {
  currentAssignment.value = null;
  currentQuestion.value = null;
  questions.value = [];
  testCases.value = [];
  questionLoading.value = false;
};

/**
 * 将后端返回的字符串数组转换为多行文本展示
 * 输入：["int[] nums = {2, 7, 11, 15}", "int target = 9"]
 * 输出：
 *   int[] nums = {2, 7, 11, 15}
 *   int target = 9
 */
const formatJsonText = (value: unknown): string => {
  if (value === undefined || value === null || value === '') return '';

  let arrayData;
  if (typeof value === 'string') {
    try {
      arrayData = JSON.parse(value);
    } catch {
      return value;
    }
  } else {
    arrayData = value;
  }

  if (!Array.isArray(arrayData)) {
    return String(value);
  }

  // 用换行符连接所有元素
  return arrayData.join('\n');
};

/**
 * 将用户输入的多行文本转换为字符串数组
 * 用户输入（多行）：
 *   int[] nums = {2, 7, 11, 15}
 *   int target = 9
 * 输出：["int[] nums = {2, 7, 11, 15}", "int target = 9"]
 */
const parseInputDataPayload = (text: string): string[] => {
  const source = String(text || '').trim();
  if (!source) return [];

  // 按行分割，每行作为一个独立的字符串元素
  return source
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
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

const loadAssignmentsByClass = async (keepSelection = false) => {
  if (!selectedClassCode.value) {
    assignments.value = [];
    resetDetailState();
    return;
  }

  loading.value = true;
  try {
    const result = await teacherApi.getAssignmentsByClass(
      selectedClassCode.value,
    );
    assignments.value = Array.isArray(result) ? result : [];

    if (!keepSelection || !currentAssignment.value) {
      resetDetailState();
    }

    if (!assignments.value.length) {
      resetDetailState();
      return;
    }

    const matchedCurrent = keepSelection
      ? assignments.value.find(
          (item) => item.id === currentAssignment.value?.id,
        )
      : null;

    const assignmentToSelect = matchedCurrent || assignments.value[0];
    if (assignmentToSelect) {
      await selectAssignment(assignmentToSelect);
    }
  } catch (error) {
    assignments.value = [];
    resetDetailState();
    const message = error instanceof Error ? error.message : '加载作业失败';
    ElMessage.error(message);
  } finally {
    loading.value = false;
  }
};

const handleClassChange = async (value: string) => {
  selectedClassCode.value = value || '';
  assignmentSearchText.value = '';
  await loadAssignmentsByClass(false);
};

const openQuestionDialog = (question: QuestionsVO | null = null) => {
  editingQuestion.value = question;
  questionDialog.value = true;
};

const selectAssignment = async (row: AssignmentVO) => {
  if (!row?.id) return;

  currentAssignment.value = row;

  try {
    const result = await teacherApi.getQuestionsByAssignment(row.id);
    questions.value = (Array.isArray(result) ? result : [])
      .map((item, index) => normalizeQuestion(item, index))
      .sort(
        (left, right) => (left.questionOrder ?? 0) - (right.questionOrder ?? 0),
      );

    if (!questions.value.length) {
      currentQuestion.value = null;
      testCases.value = [];
      return;
    }

    const firstQuestion = questions.value[0];
    if (firstQuestion) {
      await selectQuestion(firstQuestion);
    }
  } catch (error) {
    questions.value = [];
    currentQuestion.value = null;
    testCases.value = [];
    const message = error instanceof Error ? error.message : '加载题目失败';
    ElMessage.error(message);
  }
};

const selectQuestion = async (row: QuestionsVO) => {
  if (!row?.id) return;

  questionLoading.value = true;
  try {
    const [casesResult, detail] = await Promise.all([
      teacherApi.getTestCasesByQuestion(row.id),
      // 只在必要时才加载详情（缺少 content 或 initialCode 时）
      !row.content || !row.initialCode
        ? teacherApi.getQuestionById(row.id)
        : null,
    ]);

    // 如果有详情数据则使用，否则直接使用当前的 row
    if (detail) {
      currentQuestion.value = normalizeQuestion(
        Array.isArray(detail) ? detail[0] : detail,
      );
    } else {
      currentQuestion.value = row;
    }
    testCases.value = Array.isArray(casesResult) ? casesResult : [];
  } catch (error) {
    currentQuestion.value = row;
    testCases.value = [];
    const message =
      error instanceof Error ? error.message : '加载题目详情或测试用例失败';
    ElMessage.error(message);
  } finally {
    questionLoading.value = false;
  }
};

// 打开编辑对话框 - 直接加载完整题目详情
const editQuestion = async (row: QuestionsVO) => {
  if (!isDraftStatus.value) {
    ElMessage.warning('当前作业不是草稿状态，无法编辑题目');
    return;
  }

  if (!row?.id) {
    openQuestionDialog(null);
    return;
  }

  questionLoading.value = true;
  try {
    // 直接从接口获取完整数据
    const detail = await teacherApi.getQuestionById(row.id);
    const fullQuestion = normalizeQuestion(
      Array.isArray(detail) ? detail[0] : detail,
    );
    openQuestionDialog(fullQuestion);
  } catch (error) {
    const message = error instanceof Error ? error.message : '加载题目详情失败';
    ElMessage.error(message);
    openQuestionDialog(normalizeQuestion(row));
  } finally {
    questionLoading.value = false;
  }
};

const saveAssignment = async (payload: Record<string, unknown>) => {
  if (!selectedClass.value?.classCode) {
    ElMessage.warning('请先选择班级');
    return;
  }

  try {
    const body: AssignmentsDTO = {
      title: payload.title as string,
      totalScore: payload.totalScore as number,
      classCode: selectedClass.value.classCode,
      startTime: payload.startTime as string,
      deadline: payload.deadline as string,
    };

    if (editingAssignment.value) {
      // 构建更新对象，确保 id 存在并映射正确的状态字段
      const updateData: AssignmentsUpdateDTO = {
        id: editingAssignment.value.id as number,
      };

      // 只添加有值的字段
      if (body.title) updateData.title = body.title;
      if (body.totalScore) updateData.totalScore = body.totalScore;
      if (body.classCode) updateData.classCode = body.classCode;
      if (body.startTime) updateData.startTime = body.startTime;
      if (body.deadline) updateData.deadline = body.deadline;

      // 映射状态字段：assignmentStatusValue -> assignmentStatusCode
      if (payload.assignmentStatusCode) {
        updateData.assignmentStatusCode =
          payload.assignmentStatusCode as string;
      }

      await teacherApi.updateAssignment(updateData);
      ElMessage.success('作业已更新');
    } else {
      await teacherApi.createAssignment(body);
      ElMessage.success('作业已创建');
    }

    assignmentDialog.value = false;
    await loadAssignmentsByClass(true);
  } catch (error) {
    const message = error instanceof Error ? error.message : '保存作业失败';
    ElMessage.error(message);
  }
};

const saveQuestion = async (payload: Record<string, unknown>) => {
  if (!isDraftStatus.value) {
    ElMessage.warning('当前作业不是草稿状态，无法保存题目');
    return;
  }

  try {
    const body: QuestionsDTO = {
      assignmentId: currentAssignment.value?.id as number,
      questionOrder: payload.questionOrder as number,
      title: payload.title as string,
      content: payload.content as string,
      initialCode: encodeEscapedText((payload.initialCode as string) || ''),
      maxScore: payload.maxScore as number,
    };

    if (editingQuestion.value) {
      // 构建更新对象，确保 id 存在且不包含 assignmentId
      const updateData: QuestionsUpdateDTO = {
        id: editingQuestion.value.id as number,
      };

      // 只添加有值的字段
      if (body.questionOrder) updateData.questionOrder = body.questionOrder;
      if (body.title) updateData.title = body.title;
      if (body.content) updateData.content = body.content;
      if (body.initialCode) updateData.initialCode = body.initialCode;
      if (body.maxScore) updateData.maxScore = body.maxScore;

      await teacherApi.updateQuestion(updateData);
      ElMessage.success('题目已更新');
    } else {
      await teacherApi.createQuestion(body);
      ElMessage.success('题目已创建');
    }

    questionDialog.value = false;
    if (currentAssignment.value)
      await selectAssignment(currentAssignment.value);
  } catch (error) {
    const message = error instanceof Error ? error.message : '保存题目失败';
    ElMessage.error(message);
  }
};

const saveTestCase = async (
  payload: Record<string, unknown> & { inputDataText?: string },
) => {
  if (!isDraftStatus.value) {
    ElMessage.warning('当前作业不是草稿状态，无法保存测试用例');
    return;
  }

  try {
    const body: TestCasesDTO = {
      questionId: currentQuestion.value?.id as number,
      caseOrder: payload.caseOrder as number,
      inputData: parseInputDataPayload(payload.inputDataText || ''),
      expectedOutput: payload.expectedOutput as string,
      hidden: payload.hidden as boolean,
    };

    if (editingTestCase.value) {
      // 构建更新对象，确保 id 存在
      const updateData: TestCasesUpdateDTO = {
        id: editingTestCase.value.id as number,
      };

      // 只添加有值的字段
      if (body.questionId) updateData.questionId = body.questionId;
      if (body.caseOrder) updateData.caseOrder = body.caseOrder;
      if (body.inputData && body.inputData.length > 0) {
        updateData.inputData = body.inputData;
      }
      if (body.expectedOutput) updateData.expectedOutput = body.expectedOutput;
      if (body.hidden !== undefined) updateData.hidden = body.hidden;

      await teacherApi.updateTestCase(updateData);
      ElMessage.success('测试用例已更新');
    } else {
      await teacherApi.createTestCase(body);
      ElMessage.success('测试用例已创建');
    }

    testCaseDialog.value = false;
    if (currentQuestion.value) await selectQuestion(currentQuestion.value);
  } catch (error) {
    const message = error instanceof Error ? error.message : '保存测试用例失败';
    ElMessage.error(message);
  }
};

const removeAssignment = async (row: AssignmentVO) => {
  try {
    await ElMessageBox.confirm(`确认删除作业 ${row.title} 吗？`, '删除作业', {
      type: 'warning',
    });
    await teacherApi.deleteAssignment(row.id);
    ElMessage.success('作业已删除');
    await loadAssignmentsByClass(false);
  } catch {}
};

const removeQuestion = async (row: QuestionsVO) => {
  if (!isDraftStatus.value) {
    ElMessage.warning('当前作业不是草稿状态，无法删除题目');
    return;
  }

  try {
    await ElMessageBox.confirm(`确认删除题目 ${row.title} 吗？`, '删除题目', {
      type: 'warning',
    });
    await teacherApi.deleteQuestion(row.id);
    ElMessage.success('题目已删除');
    if (currentAssignment.value)
      await selectAssignment(currentAssignment.value);
  } catch {}
};

const removeTestCase = async (row: TestCasesVO) => {
  if (!isDraftStatus.value) {
    ElMessage.warning('当前作业不是草稿状态，无法删除测试用例');
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确认删除测试用例 #${row.caseOrder} 吗？`,
      '删除用例',
      { type: 'warning' },
    );
    await teacherApi.deleteTestCase(row.id);
    ElMessage.success('测试用例已删除');
    if (currentQuestion.value) await selectQuestion(currentQuestion.value);
  } catch {}
};

onMounted(loadClasses);
</script>

<template>
  <div class="page-container">
    <PageIntro
      subtitle="先选择自己负责的班级，再查看和维护该班级下的作业。"
      title="创建作业"
    >
      <el-select
        :model-value="selectedClassCode"
        clearable
        filterable
        placeholder="请选择班级"
        style="width: 240px"
        @change="handleClassChange"
      >
        <el-option
          v-for="item in classes"
          :key="item.classCode"
          :label="`${item.className || item.classCode} (${item.classCode})`"
          :value="String(item.classCode)"
        />
      </el-select>
      <el-button
        :disabled="!selectedClassCode"
        :loading="loading"
        @click="loadAssignmentsByClass(false)"
        >查询作业
      </el-button>
      <el-button
        :disabled="!selectedClass"
        type="primary"
        @click="
          editingAssignment = null;
          assignmentDialog = true;
        "
      >
        新建作业
      </el-button>
    </PageIntro>

    <section class="glass-panel page-card assignment-context">
      <div class="assignment-context__header">
        <div>
          <h3 class="panel-title">当前班级</h3>
          <p class="panel-subtitle">
            {{
              selectedClass
                ? `${selectedClass.className} (${selectedClass.classCode})`
                : '请先选择班级后再查询作业'
            }}
          </p>
        </div>
      </div>
      <el-descriptions v-if="selectedClass" :column="4" border>
        <el-descriptions-item label="班级名称">{{
          selectedClass.className || '--'
        }}</el-descriptions-item>
        <el-descriptions-item label="班级代码">{{
          selectedClass.classCode || '--'
        }}</el-descriptions-item>
        <el-descriptions-item label="作业数">{{
          assignments.length
        }}</el-descriptions-item>
      </el-descriptions>
      <el-empty
        v-else
        description="先选择自己旗下的班级，再查询该班级的作业。"
      />
    </section>

    <div class="page-grid question-layout">
      <section class="glass-panel page-card">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">作业列表</h3>
            <p class="panel-subtitle">
              {{
                selectedClass
                  ? `按班级代码 = ${selectedClass.classCode} 查询`
                  : '尚未选择班级'
              }}
            </p>
          </div>
          <el-input
            v-model="assignmentSearchText"
            clearable
            placeholder="搜索标题、班级或状态"
            style="width: 240px"
          />
        </div>
        <el-table
          :current-row-key="currentAssignment?.id"
          :data="filteredAssignments"
          highlight-current-row
          row-key="id"
          @current-change="selectAssignment"
        >
          <el-table-column label="标题" min-width="120" prop="title" />
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
          <el-table-column
            label="状态"
            prop="assignmentStatusValue"
            width="80"
          />
          <el-table-column label="操作" width="140">
            <template #default="{ row }">
              <el-space>
                <el-button
                  link
                  @click="
                    editingAssignment = row;
                    assignmentDialog = true;
                  "
                  >编辑</el-button
                >
                <el-button link type="danger" @click="removeAssignment(row)"
                  >删除</el-button
                >
              </el-space>
            </template>
          </el-table-column>
        </el-table>
        <el-empty
          v-if="selectedClass && !filteredAssignments.length && !loading"
          description="暂无数据"
        />
      </section>

      <section class="glass-panel page-card">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">当前作业下的题目</h3>
            <p class="panel-subtitle">
              {{
                currentAssignment
                  ? `assignmentId = ${currentAssignment.id}`
                  : '请先选择作业'
              }}
            </p>
          </div>
          <el-tooltip
            :disabled="isDraftStatus"
            content="仅草稿状态的作业可以编辑题目"
            placement="top"
          >
            <span>
              <el-button
                :disabled="!currentAssignment || !isDraftStatus"
                plain
                type="primary"
                @click="
                  editingQuestion = null;
                  questionDialog = true;
                "
              >
                新建题目
              </el-button>
            </span>
          </el-tooltip>
        </div>
        <el-table
          :current-row-key="currentQuestion?.id"
          :data="questions"
          highlight-current-row
          row-key="id"
          @current-change="selectQuestion"
        >
          <el-table-column label="顺序" prop="questionOrder" width="90" />
          <el-table-column label="题目标题" min-width="180" prop="title" />
          <el-table-column label="题目分值" width="90">
            <template #default="{ row }">{{ row.maxScore ?? '--' }}</template>
          </el-table-column>
          <el-table-column label="操作" width="140">
            <template #default="{ row }">
              <el-space>
                <el-tooltip
                  :disabled="isDraftStatus"
                  content="仅草稿状态的作业可以编辑题目"
                  placement="top"
                >
                  <span>
                    <el-button
                      :disabled="!isDraftStatus"
                      link
                      @click="editQuestion(row)"
                    >
                      编辑
                    </el-button>
                  </span>
                </el-tooltip>
                <el-tooltip
                  :disabled="isDraftStatus"
                  content="仅草稿状态的作业可以删除题目"
                  placement="top"
                >
                  <span>
                    <el-button
                      :disabled="!isDraftStatus"
                      link
                      type="danger"
                      @click="removeQuestion(row)"
                    >
                      删除
                    </el-button>
                  </span>
                </el-tooltip>
              </el-space>
            </template>
          </el-table-column>
        </el-table>
        <el-empty
          v-if="currentAssignment && !questions.length"
          description="当前作业还没有题目"
        />
      </section>

      <section class="glass-panel page-card question-detail-card">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">题目详情与测试用例</h3>
            <p class="panel-subtitle">{{ selectedQuestionLabel }}</p>
          </div>
          <el-tooltip
            :disabled="isDraftStatus"
            content="仅草稿状态的作业可以编辑测试用例"
            placement="top"
          >
            <span>
              <el-button
                :disabled="!currentQuestion || !isDraftStatus"
                plain
                type="primary"
                @click="
                  editingTestCase = null;
                  testCaseDialog = true;
                "
              >
                新建用例
              </el-button>
            </span>
          </el-tooltip>
        </div>
        <el-skeleton v-if="questionLoading" :rows="8" animated />
        <template v-else-if="currentQuestion">
          <el-descriptions
            :column="3"
            :label-width="96"
            border
            class="question-detail"
          >
            <el-descriptions-item label="题目顺序">{{
              currentQuestion.questionOrder ?? '--'
            }}</el-descriptions-item>
            <el-descriptions-item label="题目标题">{{
              currentQuestion.title
            }}</el-descriptions-item>
            <el-descriptions-item label="题目满分">{{
              currentQuestion.maxScore ?? '--'
            }}</el-descriptions-item>
            <el-descriptions-item :span="3" label="题目内容">
              {{ currentQuestion.content || '暂无题目内容' }}
            </el-descriptions-item>
            <el-descriptions-item :span="3" label="初始代码">
              <CodeBlock
                :code="currentQuestion.initialCode || '// 暂无初始代码'"
                language="java"
                read-only
              />
            </el-descriptions-item>
          </el-descriptions>

          <div class="test-case-list">
            <el-table
              v-if="testCases.length"
              :data="testCases"
              row-key="id"
              stripe
            >
              <el-table-column label="顺序" prop="caseOrder" width="90" />
              <el-table-column label="输入数据" min-width="200">
                <template #default="{ row }">
                  <div class="test-case-editor">
                    <MonacoEditor
                      :line-numbers="'off'"
                      :model-value="formatJsonText(row.inputData)"
                      :read-only="true"
                      height="120px"
                      language="java"
                    />
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="期望输出" min-width="200">
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
              <el-table-column label="隐藏" width="90">
                <template #default="{ row }">{{
                  row.hidden ? '是' : '否'
                }}</template>
              </el-table-column>
              <el-table-column label="操作" width="140">
                <template #default="{ row }">
                  <el-space>
                    <el-tooltip
                      :disabled="isDraftStatus"
                      content="仅草稿状态的作业可以编辑测试用例"
                      placement="top"
                    >
                      <span>
                        <el-button
                          :disabled="!isDraftStatus"
                          link
                          @click="
                            editingTestCase = {
                              ...row,
                              inputDataText: formatJsonText(row.inputData),
                            };
                            testCaseDialog = true;
                          "
                        >
                          编辑
                        </el-button>
                      </span>
                    </el-tooltip>
                    <el-tooltip
                      :disabled="isDraftStatus"
                      content="仅草稿状态的作业可以删除测试用例"
                      placement="top"
                    >
                      <span>
                        <el-button
                          :disabled="!isDraftStatus"
                          link
                          type="danger"
                          @click="removeTestCase(row)"
                        >
                          删除
                        </el-button>
                      </span>
                    </el-tooltip>
                  </el-space>
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-else description="当前题目还没有测试用例" />
          </div>
        </template>
        <el-empty v-else description="先选择作业，再查看题目详情与测试用例。" />
      </section>
    </div>

    <EntityDialog
      v-model="assignmentDialog"
      :fields="editingAssignment ? [
        { key: 'title', label: '作业标题', span: 24 },
        {
          key: 'totalScore',
          label: '作业总分',
          type: 'number',
          defaultValue: 100,
        },
        { key: 'startTime', label: '开始时间', type: 'datetime' },
        { key: 'deadline', label: '截止时间', type: 'datetime' },
        {
          key: 'assignmentStatusCode',
          label: '作业状态',
          type: 'select',
          options: assignmentStatusOptions,
          defaultValue: 'DRAFT',
        },
      ] : [
        { key: 'title', label: '作业标题', span: 24 },
        {
          key: 'totalScore',
          label: '作业总分',
          type: 'number',
          defaultValue: 100,
        },
        { key: 'startTime', label: '开始时间', type: 'datetime' },
        { key: 'deadline', label: '截止时间', type: 'datetime' },
      ]"
      :initial-value="editingAssignment || {}"
      :title="editingAssignment ? '编辑作业' : '新建作业'"
      width="760px"
      @submit="saveAssignment"
    />
    <EntityDialog
      v-model="questionDialog"
      :fields="[
        { key: 'questionOrder', label: '题目顺序', type: 'number' },
        { key: 'maxScore', label: '题目满分', type: 'number' },
        { key: 'title', label: '题目标题', span: 24 },
        { key: 'content', label: '题目内容', type: 'textarea', span: 24 },
        {
          key: 'initialCode',
          label: '初始代码',
          type: 'code',
          language: 'java',
          height: '300px',
          span: 24,
        },
      ]"
      :initial-value="editingQuestion ?? {}"
      :title="editingQuestion ? '编辑题目' : '新建题目'"
      width="820px"
      @submit="saveQuestion"
    />
    <EntityDialog
      v-model="testCaseDialog"
      :fields="[
        { key: 'caseOrder', label: '用例顺序', type: 'number' },
        {
          key: 'inputDataText',
          label: '输入数据',
          type: 'code',
          language: 'java',
          height: '220px',
          span: 24,
          placeholder: '请按行输入测试数据，每行一个独立的参数',
          tips: '每行会被作为一个独立的字符串元素存储，多行之间用换行符分割。\n示例 1:\nint[] nums = {2, 7, 11, 15}\nint target = 9\n\n示例 2:\nString[] strs = {\'eat\', \'tea\', \'tan\', \'ate\', \'nat\', \'bat\'}',
        },
        {
          key: 'expectedOutput',
          label: '期望输出',
          type: 'code',
          language: 'java',
          height: '220px',
          span: 24,
        },
        {
          key: 'hidden',
          label: '隐藏用例',
          type: 'boolean',
          defaultValue: false,
          span: 24,
        },
      ]"
      :initial-value="editingTestCase || {}"
      :title="editingTestCase ? '编辑用例' : '新建用例'"
      width="760px"
      @submit="saveTestCase"
    />
  </div>
</template>

<style scoped>
.question-layout {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: start;
}

.page-card {
  padding: 24px;
}

.question-detail-card {
  grid-column: span 2;
}

.assignment-context__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.test-case-list {
  margin-top: 24px;
}

.test-case-editor {
  height: 120px;
  border-radius: 4px;
  overflow: hidden;
}

.question-detail {
  margin-bottom: 0;
}

@media (max-width: 1360px) {
  .question-layout {
    grid-template-columns: 1fr;
  }
}
</style>
