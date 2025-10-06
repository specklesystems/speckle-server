<template>
  <CommonBadge
    v-tippy="statusTooltip"
    class="bg-"
    :color-classes="
      [runStatusClasses(status), 'shrink-0 grow-0 text-foreground'].join(' ')
    "
  >
    ACC
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

const { formattedRelativeDate } = useDateFormatters()

const status = computed(() => props.item.status)
const statusTooltip = computed(
  () =>
    `V${props.item.accFileVersionIndex} ${getStatusDescription(
      props.item.status
    )} ${formattedRelativeDate(props.item.updatedAt)}`
)

const getStatusDescription = (status: AccSyncItemStatus): string => {
  switch (status) {
    case 'failed':
      return 'failed to sync'
    case 'pending':
      return 'scheduled for sync'
    case 'paused':
      return 'sync paused'
    case 'succeeded':
      return 'updated'
    case 'syncing':
      return 'processing since'
    default:
      return ''
  }
}

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
