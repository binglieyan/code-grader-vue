<script setup lang="ts">
interface Props {
  title: string;
  value: string | number;
  caption?: string;
  tone?: string;
}

const props = defineProps<Props>();
</script>

<template>
  <div :class="`metric-card--${props.tone}`" class="metric-card glass-panel">
    <div class="metric-value">{{ props.value }}</div>
    <div class="metric-label">{{ props.title }}</div>
    <div v-if="props.caption" class="metric-caption">{{ props.caption }}</div>
  </div>
</template>

<style scoped>
.metric-caption {
  margin-top: 10px;
  color: var(--text-soft);
  font-size: 12px;
}
</style>
