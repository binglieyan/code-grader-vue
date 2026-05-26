<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import MonacoEditor from './MonacoEditor.vue';

interface FieldOption {
  label: string;
  value: unknown;
}

interface Field {
  key: string;
  label: string;
  type?: string;
  span?: number;
  defaultValue?: unknown;
  placeholder?: string;
  min?: number;
  max?: number;
  options?: FieldOption[];
  height?: string;
  language?: string;
  readOnly?: boolean;
  rows?: number;
  tips?: string;
}

interface Props {
  modelValue?: boolean;
  title: string;
  fields?: Field[];
  initialValue?: Record<string, unknown>;
  width?: string;
  confirmText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  fields: () => [],
  initialValue: () => ({}),
  width: '680px',
  confirmText: '保存',
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'submit', data: Record<string, unknown>): void;
}>();

const form = reactive<Record<string, unknown>>({});

const normalizeValue = (field: Field, value: unknown) => {
  if (value !== undefined && value !== null) return value;
  if (field.type === 'boolean') return field.defaultValue ?? false;
  return field.defaultValue ?? '';
};

const resetForm = () => {
  props.fields.forEach((field) => {
    form[field.key] = normalizeValue(field, props.initialValue?.[field.key]);
  });
};

watch(
  () => [props.modelValue, props.initialValue],
  () => {
    if (props.modelValue) resetForm();
  },
  { immediate: true, deep: true },
);

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const submit = () => emit('submit', { ...form });
</script>

<template>
  <el-dialog v-model="visible" :title="title" :width="width">
    <el-form label-position="top">
      <el-row :gutter="18">
        <el-col
          v-for="field in fields"
          :key="field.key"
          :span="field.span || 12"
        >
          <el-form-item :label="field.label">
            <el-input
              v-if="!field.type || field.type === 'text'"
              v-model="form[field.key] as string"
              :placeholder="field.placeholder || `请输入${field.label}`"
            />
            <el-input-number
              v-else-if="field.type === 'number'"
              v-model="form[field.key] as number"
              :max="field.max ?? 999999"
              :min="field.min ?? 0"
              style="width: 100%"
            />
            <el-date-picker
              v-else-if="field.type === 'datetime'"
              v-model="form[field.key] as string"
              format="YYYY-MM-DD HH:mm:ss"
              style="width: 100%"
              type="datetime"
              value-format="YYYY-MM-DD HH:mm:ss"
            />
            <el-switch
              v-else-if="field.type === 'boolean'"
              v-model="form[field.key] as boolean"
              active-text="是"
              inactive-text="否"
              inline-prompt
            />
            <el-select
              v-else-if="field.type === 'select'"
              v-model="form[field.key] as any"
              :placeholder="field.placeholder || `请选择${field.label}`"
              style="width: 100%"
            >
              <el-option
                v-for="option in field.options"
                :key="option.value as any"
                :label="option.label"
                :value="option.value as any"
              />
            </el-select>
            <MonacoEditor
              v-else-if="field.type === 'code'"
              v-model="form[field.key] as string"
              :height="field.height || '260px'"
              :language="field.language || 'java'"
              :read-only="field.readOnly || false"
            />
            <el-input
              v-else
              v-model="form[field.key] as string"
              :placeholder="field.placeholder || `请输入${field.label}`"
              :rows="field.rows || 4"
              type="textarea"
            />
            <div v-if="field.tips" class="field-tips">{{ field.tips }}</div>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <div class="entity-dialog__footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" @click="submit">{{ confirmText }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.entity-dialog__footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.field-tips {
  margin-top: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
  white-space: pre-wrap;
}
</style>
