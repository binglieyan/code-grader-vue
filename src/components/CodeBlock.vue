<script setup lang="ts">
import { computed } from 'vue';
import MonacoEditor from './MonacoEditor.vue';
import { decodeEscapedText } from '../utils/helpers';

interface Props {
  code?: string | object | unknown[];
  language?: string;
  readOnly?: boolean;
  height?: string;
}

const props = withDefaults(defineProps<Props>(), {
  code: '',
  language: 'text',
  readOnly: true,
});

const normalize = (value: string | object | unknown[]): string => {
  if (typeof value === 'string') return decodeEscapedText(value);
  return JSON.stringify(value, null, 2);
};

const displayCode = computed(() => normalize(props.code));
</script>

<template>
  <MonacoEditor
    :height="props.height || '240px'"
    :language="props.language"
    :minimap="false"
    :model-value="displayCode"
    :read-only="props.readOnly"
    line-numbers="on"
  />
</template>
