<template>
  <div v-tippy="statusLabel">
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
import { graphql } from '~/lib/common/generated/gql'
import type {
  AccSyncItemStatus,
  SyncStatusModelItem_AccSyncItemFragment
} from '~/lib/common/generated/gql/graphql'

graphql(`
  fragment SyncStatusModelItem_AccSyncItem on AccSyncItem {
    id
    status
  }
`)

const props = defineProps<{
  item: SyncStatusModelItem_AccSyncItemFragment
}>()

const status = computed(() => props.item.status)
const statusLabel = computed(
  () => status.value.charAt(0).toUpperCase() + status.value.slice(1)
)

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
