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
import type { AccSyncItemStatus } from '~/lib/common/generated/gql/graphql'

defineProps<{
  status: AccSyncItemStatus
}>()

const runStatusClasses = (run: AccSyncItemStatus) => {
  const classParts = ['w-24 justify-center']

  switch (run) {
    case 'SYNCING':
      classParts.push('bg-info-lighter')
      break
    case 'PENDING':
      classParts.push('bg-warning-lighter')
      break
    case 'PAUSED':
      classParts.push('bg-warning-lighter')
      break
    case 'FAILED':
      classParts.push('bg-danger-lighter')
      break
    case 'SUCCEEDED':
      classParts.push('bg-success-lighter')
      break
  }

  return classParts.join(' ')
}
</script>
