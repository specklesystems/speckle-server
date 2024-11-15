<template>
  <ProjectEmptyState :small="small" title="No discussions, yet." :text="text">
    <template #cta>
      <div v-if="showButton" class="mt-3">
        <FormButton :icon-left="PlusIcon" @click="() => $emit('new-discussion')">
          New discussion
        </FormButton>
      </div>
    </template>
  </ProjectEmptyState>
</template>
<script setup lang="ts">
import { PlusIcon } from '@heroicons/vue/24/solid'

defineEmits<{
  (e: 'new-discussion'): void
}>()

defineProps<{
  small?: boolean
  showButton?: boolean
  text?: string
}>()
</script>
