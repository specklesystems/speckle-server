<template>
  <CommonBadge
    :color-classes="
      [runStatusClasses(status), 'shrink-0 grow-0 text-foreground'].join(' ')
    "
  >
    {{ status.toUpperCase() }}
  </CommonBadge>
</template>

<script setup lang="ts">
import type { AccSyncItemStatus } from '~/lib/acc/types'

defineProps<{
  status: AccSyncItemStatus
}>()

const runStatusClasses = (run: AccSyncItemStatus) => {
  const classParts = ['w-24 justify-center']

  switch (run) {
    case 'syncing':
      classParts.push('bg-info-lighter')
      break
    case 'paused':
      classParts.push('bg-warning-lighter')
      break
    case 'failed':
      classParts.push('bg-danger-lighter')
      break
    case 'sync':
      classParts.push('bg-success-lighter')
      break
  }

  return classParts.join(' ')
}
</script>
