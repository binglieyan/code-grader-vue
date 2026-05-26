<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import PageIntro from '../../components/PageIntro.vue';
import EntityDialog from '../../components/EntityDialog.vue';
import { adminApi } from '@/api/services.js';
import { toPageData } from '@/utils/helpers.js';

import type {
  DictTypePageQueryVO,
  DictDataPageQueryVO,
  DictTypeDTO,
  DictTypeUpdateDTO,
  DictDataDTO,
  DictDataUpdateDTO,
  DictTypePageQueryDTO,
  DictDataPageQueryDTO,
} from '@/types/api';

const typeQuery = reactive<DictTypePageQueryDTO>({
  typeCode: '',
  typeName: '',
  system: undefined,
  pageNum: 1,
  pageSize: 10,
});
const dataQuery = reactive<DictDataPageQueryDTO>({
  typeCode: '',
  dataCode: '',
  dataValue: '',
  active: undefined,
  pageNum: 1,
  pageSize: 10,
});
const typePage = ref({ records: [] as DictTypePageQueryVO[], total: 0 });
const dataPage = ref({ records: [] as DictDataPageQueryVO[], total: 0 });
const typeDialog = ref(false);
const dataDialog = ref(false);
const editingType = ref<Partial<DictTypePageQueryVO> | null>(null);
const editingData = ref<Partial<DictDataPageQueryVO> | null>(null);

const loadTypeData = async () => {
  try {
    const types = await adminApi.getDictTypesPage(typeQuery);
    typePage.value = toPageData(types);
  } catch (error) {
    const message = error instanceof Error ? error.message : '加载字典类型失败';
    ElMessage.error(message);
  }
};

const loadDataData = async () => {
  try {
    const data = await adminApi.getDictDataPage(dataQuery);
    dataPage.value = toPageData(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : '加载字典数据失败';
    ElMessage.error(message);
  }
};

const loadData = async () => {
  await Promise.all([loadTypeData(), loadDataData()]);
};

const saveType = async (payload: Record<string, unknown>) => {
  try {
    const basePayload = {
      typeCode: String(payload.typeCode ?? ''),
      typeName: String(payload.typeName ?? ''),
      description: String(payload.description ?? ''),
      system: Boolean(payload.system),
    };

    if (editingType.value) {
      const updatePayload: DictTypeUpdateDTO = {
        id: editingType.value.id as number,
        ...basePayload,
      };
      await adminApi.updateDictType(updatePayload);
      ElMessage.success('字典类型已更新');
    } else {
      const createPayload: DictTypeDTO = basePayload;
      await adminApi.createDictType(createPayload);
      ElMessage.success('字典类型已新增');
    }
    typeDialog.value = false;
    await loadData();
  } catch (error) {
    const message = error instanceof Error ? error.message : '保存字典类型失败';
    ElMessage.error(message);
  }
};

const saveData = async (payload: Record<string, unknown>) => {
  try {
    if (editingData.value) {
      await adminApi.updateDictData({
        ...editingData.value,
        ...payload,
      } as unknown as DictDataUpdateDTO);
      ElMessage.success('字典数据已更新');
    } else {
      await adminApi.createDictData(payload as unknown as DictDataDTO);
      ElMessage.success('字典数据已新增');
    }
    dataDialog.value = false;
    await loadData();
  } catch (error) {
    const message = error instanceof Error ? error.message : '保存字典数据失败';
    ElMessage.error(message);
  }
};

onMounted(loadData);
</script>

<template>
  <div class="page-container">
    <PageIntro title="字典管理">
      <el-input
        v-model="typeQuery.typeCode"
        placeholder="类型编码"
        style="width: 140px"
      />
      <el-input
        v-model="typeQuery.typeName"
        placeholder="类型名称"
        style="width: 140px"
      />
      <el-select
        v-model="typeQuery.system"
        clearable
        placeholder="系统字典"
        style="width: 120px"
      >
        <el-option label="是" :value="true" />
        <el-option label="否" :value="false" />
      </el-select>
      <el-button @click="loadTypeData">查询类型</el-button>
      <el-button
        plain
        type="primary"
        @click="
          editingType = null;
          typeDialog = true;
        "
        >新增类型</el-button
      >
      <el-divider direction="vertical" />
      <el-input
        v-model="dataQuery.typeCode"
        placeholder="类型编码"
        style="width: 140px"
      />
      <el-input
        v-model="dataQuery.dataCode"
        placeholder="数据编码"
        style="width: 140px"
      />
      <el-input
        v-model="dataQuery.dataValue"
        placeholder="数据值"
        style="width: 140px"
      />
      <el-select
        v-model="dataQuery.active"
        clearable
        placeholder="启用状态"
        style="width: 120px"
      >
        <el-option label="启用" :value="true" />
        <el-option label="禁用" :value="false" />
      </el-select>
      <el-button @click="loadDataData">查询数据</el-button>
      <el-button
        type="primary"
        @click="
          editingData = null;
          dataDialog = true;
        "
        >新增数据</el-button
      >
    </PageIntro>

    <div class="page-grid grid-2">
      <section class="glass-panel page-card">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">字典类型</h3>
          </div>
        </div>
        <el-table :data="typePage.records" stripe>
          <el-table-column label="类型编码" min-width="140" prop="typeCode" />
          <el-table-column label="类型名称" min-width="160" prop="typeName" />
          <el-table-column
            label="描述"
            min-width="180"
            prop="description"
            show-overflow-tooltip
          />
          <el-table-column label="系统" width="90">
            <template #default="{ row }">{{
              row.system ? '是' : '否'
            }}</template>
          </el-table-column>
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button
                link
                @click="
                  editingType = row;
                  typeDialog = true;
                "
                >编辑</el-button
              >
            </template>
          </el-table-column>
        </el-table>
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="typeQuery.pageNum"
            v-model:page-size="typeQuery.pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="typePage.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="loadTypeData"
            @current-change="loadTypeData"
          />
        </div>
      </section>

      <section class="glass-panel page-card">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">字典数据</h3>
          </div>
        </div>
        <el-table :data="dataPage.records" stripe>
          <el-table-column label="类型编码" min-width="120" prop="typeCode" />
          <el-table-column label="数据编码" min-width="120" prop="dataCode" />
          <el-table-column label="数据值" min-width="160" prop="dataValue" />
          <el-table-column label="排序" prop="sortOrder" width="80" />
          <el-table-column label="启用" width="90">
            <template #default="{ row }">{{
              row.active ? '是' : '否'
            }}</template>
          </el-table-column>
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button
                link
                @click="
                  editingData = row;
                  dataDialog = true;
                "
                >编辑</el-button
              >
            </template>
          </el-table-column>
        </el-table>
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="dataQuery.pageNum"
            v-model:page-size="dataQuery.pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="dataPage.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="loadDataData"
            @current-change="loadDataData"
          />
        </div>
      </section>
    </div>

    <EntityDialog
      v-model="typeDialog"
      :fields="[
        { key: 'typeCode', label: '类型编码' },
        { key: 'typeName', label: '类型名称' },
        { key: 'description', label: '描述', type: 'textarea', span: 24 },
        {
          key: 'system',
          label: '系统字典',
          type: 'boolean',
          defaultValue: false,
          span: 24,
        },
      ]"
      :initial-value="editingType || {}"
      :title="editingType ? '编辑字典类型' : '新增字典类型'"
      @submit="saveType"
    />
    <EntityDialog
      v-model="dataDialog"
      :fields="[
        { key: 'typeCode', label: '类型编码' },
        { key: 'dataCode', label: '数据编码' },
        { key: 'dataValue', label: '数据值' },
        { key: 'sortOrder', label: '排序', type: 'number' },
        { key: 'description', label: '描述', type: 'textarea', span: 24 },
        {
          key: 'active',
          label: '启用',
          type: 'boolean',
          defaultValue: true,
          span: 24,
        },
      ]"
      :initial-value="editingData || {}"
      :title="editingData ? '编辑字典数据' : '新增字典数据'"
      @submit="saveData"
    />
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
