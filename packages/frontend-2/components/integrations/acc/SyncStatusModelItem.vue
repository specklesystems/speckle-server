<template>
  <div v-tippy="status.charAt(0).toUpperCase() + status.slice(1)">
    <CommonBadge
      :color-classes="
        [runStatusClasses(status), 'shrink-0 grow-0 text-foreground'].join(' ')
      "
    >
      ACC
    </CommonBadge>
  </div>
</template>

<script setup lang="ts">
import type { AccSyncItemStatus } from '~/lib/common/generated/gql/graphql'

defineProps<{
  status: AccSyncItemStatus
}>()

const runStatusClasses = (run: AccSyncItemStatus) => {
  const classParts = ['w-24 justify-center']

  switch (run) {
    case 'syncing':
      classParts.push('bg-info-lighter')
      break
    case 'pending':
      classParts.push('bg-warning-lighter')
      break
    case 'paused':
      classParts.push('bg-warning-lighter')
      break
    case 'failed':
      classParts.push('bg-danger-lighter')
      break
    case 'succeeded':
      classParts.push('bg-success-lighter')
      break
  }

  return classParts.join(' ')
}
</script>
