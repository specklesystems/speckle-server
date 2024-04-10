<template>
  <ProjectEmptyState
    :small="small"
    title="No webhooks, yet."
    :text="small ? undefined : 'Click create to get started'"
  >
    <template #image>
      <IconWebhooks class="h-24 w-24 mt-6 ml-9" />
    </template>
    <template #cta>
      <div v-if="small" class="mt-3">
        <FormButton
          size="sm"
          :icon-left="PlusIcon"
          @click="() => $emit('new-discussion')"
        >
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
}>()
</script>
