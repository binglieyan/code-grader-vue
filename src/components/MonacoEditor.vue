<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import * as monaco from 'monaco-editor';

self.MonacoEnvironment = {};

interface Props {
  modelValue?: string;
  language?: string;
  height?: string;
  readOnly?: boolean;
  minimap?: boolean;
  lineNumbers?:
    | 'on'
    | 'off'
    | 'relative'
    | 'interval'
    | ((lineNumber: number) => string);
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  language: 'java',
  height: '280px',
  readOnly: false,
  minimap: false,
  lineNumbers: 'on',
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'ready', editor: monaco.editor.IStandaloneCodeEditor): void;
}>();

const containerRef = ref<HTMLElement | null>(null);
let editor: monaco.editor.IStandaloneCodeEditor | null = null;
let model: monaco.editor.ITextModel | null = null;
let syncing = false;

const createEditor = () => {
  if (!containerRef.value) return;

  model = monaco.editor.createModel(props.modelValue || '', props.language);
  editor = monaco.editor.create(containerRef.value, {
    model,
    theme: 'vs',
    automaticLayout: true,
    readOnly: props.readOnly,
    minimap: { enabled: props.minimap },
    lineNumbers: props.lineNumbers,
    scrollBeyondLastLine: false,
    tabSize: 2,
    wordWrap: 'on',
    wrappingIndent: 'indent',
    fontSize: 13,
    fontFamily: 'Cascadia Code, Consolas, monospace',
    padding: { top: 12, bottom: 12 },
    renderLineHighlight: props.readOnly ? 'none' : 'line',
    guides: {
      indentation: true,
    },
    // 只读时不显示任何提示
    domReadOnly: props.readOnly,
    readOnlyMessage: undefined,
  });

  editor.onDidChangeModelContent(() => {
    if (syncing || !editor) return;
    emit('update:modelValue', editor.getValue());
  });

  emit('ready', editor);
};

onMounted(() => createEditor());

watch(
  () => props.modelValue,
  (value) => {
    if (!editor) return;
    const current = editor.getValue();
    if ((value || '') === current) return;
    syncing = true;
    editor.setValue(value || '');
    syncing = false;
  },
);

watch(
  () => props.language,
  (value) => {
    if (model) monaco.editor.setModelLanguage(model, value);
  },
);

watch(
  () => props.readOnly,
  (value) => {
    if (editor)
      editor.updateOptions({
        readOnly: value,
        renderLineHighlight: value ? 'none' : 'line',
      });
  },
);

onBeforeUnmount(() => {
  if (editor) editor.dispose();
  if (model) model.dispose();
});
</script>

<template>
  <div
    ref="containerRef"
    :class="{ 'monaco-editor-read-only': props.readOnly }"
    :style="{ height: props.height }"
    class="monaco-editor-shell"
  />
</template>

<style scoped>
.monaco-editor-shell {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 18px;
  overflow: hidden;
  background: #ffffff;
}

/* 隐藏只读提示信息 */
</style>
