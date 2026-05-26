<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import PageIntro from '../../components/PageIntro.vue';
import EntityDialog from '../../components/EntityDialog.vue';
import { teacherApi } from '@/api/services.js';

import type {
  ClassesVO,
  ClassesDTO,
  ClassesUpdateDTO,
  StudentVO,
} from '@/types/api';

const classes = ref<ClassesVO[]>([]);
const students = ref<StudentVO[]>([]);
const currentClassCode = ref('');
const dialogVisible = ref(false);
const editing = ref<ClassesVO | null>(null);
const search = reactive({ keyword: '' });
const studentSearchText = ref('');

const loadClasses = async () => {
  try {
    const result = await teacherApi.getClasses();
    classes.value = Array.isArray(result) ? result : [];
  } catch (error) {
    const message = error instanceof Error ? error.message : '加载班级失败';
    ElMessage.error(message);
  }
};

const loadStudents = async (classCode: string) => {
  currentClassCode.value = classCode;
  studentSearchText.value = '';
  try {
    const result = await teacherApi.getStudentsByClass(classCode);
    students.value = Array.isArray(result) ? result : [];
  } catch (error) {
    const message = error instanceof Error ? error.message : '加载学生失败';
    ElMessage.error(message);
  }
};

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

const saveClass = async (payload: Record<string, unknown>) => {
  try {
    if (editing.value) {
      const updateBody: ClassesUpdateDTO = {
        classCode: payload.classCode as string,
        className: payload.className as string,
        description: payload.description as string | undefined,
      };
      await teacherApi.updateClass(updateBody);
      ElMessage.success('班级已更新');
    } else {
      const createBody: ClassesDTO = {
        className: payload.className as string,
        classCode: payload.classCode as string,
        description: payload.description as string | undefined,
      };
      await teacherApi.createClass(createBody);
      ElMessage.success('班级已创建');
    }
    dialogVisible.value = false;
    await loadClasses();
  } catch (error) {
    const message = error instanceof Error ? error.message : '保存班级失败';
    ElMessage.error(message);
  }
};

const removeClass = async (row: ClassesVO) => {
  try {
    await ElMessageBox.confirm(
      `确认删除班级 ${row.className} 吗？`,
      '删除确认',
      { type: 'warning' },
    );
    await teacherApi.deleteClass(row.classCode);
    ElMessage.success('班级已删除');
    await loadClasses();
  } catch {}
};

const removeStudent = async (row: StudentVO) => {
  try {
    await ElMessageBox.confirm(
      `确认将 ${row.realName || row.username} 移出班级吗？`,
      '移除学生',
      { type: 'warning' },
    );
    await teacherApi.removeStudent(row.userNumber);
    ElMessage.success('学生已移除');
    if (currentClassCode.value) await loadStudents(currentClassCode.value);
  } catch {}
};

onMounted(loadClasses);
</script>

<template>
  <div class="page-container">
    <PageIntro title="班级管理">
      <el-input
        v-model="search.keyword"
        clearable
        placeholder="按班级名或代码筛选"
        style="width: 220px"
      />
      <el-button
        type="primary"
        @click="
          editing = null;
          dialogVisible = true;
        "
        >新建班级</el-button
      >
    </PageIntro>

    <div class="page-grid grid-2">
      <section class="glass-panel page-card">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">班级列表</h3>
          </div>
        </div>
        <el-table
          :data="
            classes.filter(
              (item) =>
                !search.keyword ||
                `${item.className}${item.classCode}`.includes(search.keyword),
            )
          "
          stripe
        >
          <el-table-column label="班级名称" min-width="160" prop="className" />
          <el-table-column label="班级代码" min-width="140" prop="classCode" />
          <el-table-column label="教师工号" prop="teacherNumber" width="120" />
          <el-table-column
            label="描述"
            min-width="180"
            prop="description"
            show-overflow-tooltip
          />
          <el-table-column label="操作" width="250">
            <template #default="{ row }">
              <el-space wrap>
                <el-button
                  link
                  type="primary"
                  @click="loadStudents(row.classCode)"
                  >查看学生</el-button
                >
                <el-button
                  link
                  @click="
                    editing = row;
                    dialogVisible = true;
                  "
                  >编辑</el-button
                >
                <el-button link type="danger" @click="removeClass(row)"
                  >删除</el-button
                >
              </el-space>
            </template>
          </el-table-column>
        </el-table>
      </section>

      <section class="glass-panel page-card">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">班级学生</h3>
          </div>
          <el-input
            v-model="studentSearchText"
            clearable
            placeholder="搜索学号或姓名"
            style="width: 240px"
          />
        </div>
        <el-table :data="filteredStudents" max-height="400" stripe>
          <el-table-column label="用户名" min-width="120" prop="username" />
          <el-table-column label="姓名" min-width="120" prop="realName" />
          <el-table-column label="学号" min-width="140" prop="userNumber" />
          <el-table-column label="班级代码" min-width="120" prop="classCode" />
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button link type="danger" @click="removeStudent(row)"
                >移除</el-button
              >
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-if="!filteredStudents.length" description="暂无学生数据" />
      </section>
    </div>

    <EntityDialog
      v-model="dialogVisible"
      :fields="
        editing
          ? [
              { key: 'className', label: '班级名称' },
              { key: 'classCode', label: '班级代码' },
              {
                key: 'description',
                label: '班级描述',
                type: 'textarea',
                span: 24,
              },
            ]
          : [
              { key: 'className', label: '班级名称' },
              { key: 'classCode', label: '班级代码' },
              {
                key: 'description',
                label: '班级描述',
                type: 'textarea',
                span: 24,
              },
            ]
      "
      :initial-value="editing || {}"
      :title="editing ? '编辑班级' : '新建班级'"
      @submit="saveClass"
    />
  </div>
</template>

<style scoped>
.page-card {
  padding: 24px;
}
</style>
