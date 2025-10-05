<template>
  <CommonBadge
    class="bg-"
    :color-classes="
      [runStatusClasses(status), 'shrink-0 grow-0 text-foreground'].join(' ')
    "
  >
    {{ statusLabel }}
  </CommonBadge>
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
    updatedAt
    accFileVersionIndex
  }
`)

const props = defineProps<{
  item: SyncStatusModelItem_AccSyncItemFragment
}>()

const status = computed(() => props.item.status)
const statusLabel = computed(() => `V${props.item.accFileVersionIndex}`)

const runStatusClasses = (run: AccSyncItemStatus) => {
  const classParts = ['w-12 justify-center']

  switch (run) {
    case 'syncing':
      classParts.push('bg-info-lighter')
      break
    case 'pending':
    case 'paused':
      classParts.push('bg-warning-lighter')
      break
    case 'failed':
      classParts.push('bg-danger-lighter')
      break
    case 'succeeded':
      classParts.push('bg-foundation-2')
      break
  }

  return classParts.join(' ')
}
</script>
