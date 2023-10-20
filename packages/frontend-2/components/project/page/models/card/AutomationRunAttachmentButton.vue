<template>
  <div class="">
    <FormButton text size="xs">
      <!-- TODO: Get blob details and display file name -->
      <span class="max-w-[5rem] truncate">{{ blobId }}, {{ projectId }}</span>
      <PaperClipIcon class="w-3 h-3 text-primary" />
    </FormButton>
  </div>
</template>
<script setup lang="ts">
import { PaperClipIcon } from '@heroicons/vue/20/solid'

const projectId = inject<string>('projectId')
const modelId = inject<string>('modelId')

const props = defineProps<{
  blobId: string
}>()

// TODO: get blob, display file name, etc.
</script>
