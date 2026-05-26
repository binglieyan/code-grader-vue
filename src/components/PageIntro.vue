<script setup lang="ts">
interface Props {
  title: string;
  subtitle?: string;
  actionsAlign?: string;
}

const props = defineProps<Props>();
</script>

<template>
  <div class="page-intro glass-panel">
    <div class="page-intro__content">
      <div>
        <h1 class="section-title">{{ props.title }}</h1>
        <p class="section-subtitle">{{ props.subtitle }}</p>
      </div>
      <div
        :style="{ justifyContent: props.actionsAlign }"
        class="page-intro__actions"
      >
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-intro {
  padding: 24px 28px;
}

.page-intro__content {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.page-intro__actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

@media (max-width: 900px) {
  .page-intro__content {
    flex-direction: column;
  }
}
</style>
