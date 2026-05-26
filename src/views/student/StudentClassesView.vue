<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import PageIntro from '../../components/PageIntro.vue';
import { studentApi } from '@/api/services.js';
import { toPageData } from '@/utils/helpers.js';
import type {
  ClassesPageQueryDTO,
  ClassesPageQueryVO,
  ClassesVO,
} from '@/types/api';

const query = reactive<ClassesPageQueryDTO>({
  classCode: '',
  className: '',
  teacherNumber: '',
  pageNum: 1,
  pageSize: 10,
});
const classPage = ref({ records: [] as ClassesPageQueryVO[], total: 0 });
const currentClass = ref<ClassesVO | null>(null);
const joinCode = ref('');

const loadClassPage = async () => {
  try {
    classPage.value = toPageData(await studentApi.getClassesPage(query));
  } catch (error) {
    const message = error instanceof Error ? error.message : '加载班级分页失败';
    ElMessage.error(message);
  }
};

const loadCurrentClass = async () => {
  try {
    currentClass.value = await studentApi.getCurrentClass();
  } catch (error) {
    const message = error instanceof Error ? error.message : '加载当前班级失败';
    ElMessage.error(message);
  }
};

const joinClass = async () => {
  if (!joinCode.value) return ElMessage.warning('请输入班级代码');
  try {
    await studentApi.joinClass(joinCode.value);
    ElMessage.success('加入班级成功');
    joinCode.value = '';
    await loadCurrentClass();
  } catch (error) {
    const message = error instanceof Error ? error.message : '加入班级失败';
    ElMessage.error(message);
  }
};

onMounted(() => {
  loadClassPage();
  loadCurrentClass();
});
</script>

<template>
  <div class="page-container">
    <PageIntro
      subtitle="查询班级列表、查看自己所在班级，并通过班级代码快速加入课程班。"
      title="我的班级"
    >
      <el-input
        v-model="joinCode"
        placeholder="输入班级代码加入"
        style="width: 200px"
      />
      <el-button type="primary" @click="joinClass">加入班级</el-button>
    </PageIntro>

    <div class="page-grid grid-2">
      <section class="glass-panel page-card">
        <div class="panel-header">
          <div><h3 class="panel-title">当前班级</h3></div>
        </div>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="班级名称">{{
            currentClass?.className || '--'
          }}</el-descriptions-item>
          <el-descriptions-item label="班级代码">{{
            currentClass?.classCode || '--'
          }}</el-descriptions-item>
          <el-descriptions-item label="教师编号">{{
            currentClass?.teacherNumber || '--'
          }}</el-descriptions-item>
        </el-descriptions>
      </section>

      <section class="glass-panel page-card">
        <div class="panel-header">
          <div><h3 class="panel-title">班级广场</h3></div>
          <el-space wrap>
            <el-input
              v-model="query.classCode"
              placeholder="班级代码"
              style="width: 140px"
            />
            <el-input
              v-model="query.className"
              placeholder="班级名称"
              style="width: 140px"
            />
            <el-input
              v-model="query.teacherNumber"
              placeholder="教师编号"
              style="width: 140px"
            />
            <el-button @click="loadClassPage">查询</el-button>
          </el-space>
        </div>
        <el-table :data="classPage.records" stripe>
          <el-table-column label="班级名称" min-width="180" prop="className" />
          <el-table-column label="班级代码" min-width="140" prop="classCode" />
          <el-table-column label="教师编号" prop="teacherNumber" width="120" />
        </el-table>
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="query.pageNum"
            v-model:page-size="query.pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="classPage.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="loadClassPage"
            @current-change="loadClassPage"
          />
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.page-card {
  padding: 24px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
  padding-top: 16px;
}
</style>
