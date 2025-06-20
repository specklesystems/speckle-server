<template>
  <LayoutDialog v-model:open="open" :title="title" :buttons="buttons">
    <p class="text-foreground-2 mt-2">
      The following file uploads failed. You can retry them by re-uploading the files.
    </p>
    <div v-for="job in failedJobs" :key="job.id" class="flex items-center gap-2">
      <CommonBadge color-classes="bg-danger text-foundation">Failed</CommonBadge>
      <span class="text-foreground">{{ job.fileName }}</span>
    </div>
  </LayoutDialog>
</template>
<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'
import { useGlobalFileImportErrorManager } from '~/lib/core/composables/fileImport'

const { clear, failedJobs } = useGlobalFileImportErrorManager()

const open = computed({
  get: () => failedJobs.value.length > 0,
  set: (value) => {
    if (!value) {
      clear()
    }
  }
})
const title = computed(
  () => `File upload${failedJobs.value.length > 1 ? 's' : ''} failed`
)

const buttons = computed((): LayoutDialogButton[] => [
  {
    text: 'Dismiss',
    onClick: () => {
      open.value = false
    }
  }
])

watch(failedJobs, (newJobs) => {
  if (newJobs.length > 0) {
    open.value = true
  }
})
</script>
