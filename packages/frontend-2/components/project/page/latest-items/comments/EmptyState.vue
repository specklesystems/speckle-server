<template>
  <ProjectEmptyState :small="small" title="No discussions, yet." :text="text">
    <template #illustration>
      <IllustrationEmptystateDiscussionTab />
    </template>
    <template #cta>
      <div v-if="showButton" class="mt-3">
        <FormButton :icon-left="Plus" @click="() => $emit('new-discussion')">
          New discussion
        </FormButton>
      </div>
    </template>
  </ProjectEmptyState>
</template>
<script setup lang="ts">
import { Plus } from 'lucide-vue-next'

defineEmits<{
  (e: 'new-discussion'): void
}>()

defineProps<{
  small?: boolean
  showButton?: boolean
  text?: string
}>()
</script>
