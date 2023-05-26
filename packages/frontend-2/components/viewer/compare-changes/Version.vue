<template>
  <div class="shadow rounded-md p-1 flex flex-col justify-center cursor-pointer">
    <div class="h-20 w-full">
      <PreviewImage :preview-url="version.previewUrl" />
    </div>
    <div
      class="bg-foundation-focus inline-block rounded-full px-2 text-xs font-bold truncate"
    >
      {{ secondVersionCreatedAtTime ? 'B' : 'A' }}: {{ time }}
    </div>
  </div>
</template>
<script setup lang="ts">
import dayjs from 'dayjs'
import { ViewerModelVersionCardItemFragment } from '~~/lib/common/generated/gql/graphql'

const props = defineProps<{
  version: ViewerModelVersionCardItemFragment
  secondVersionCreatedAtTime?: string
}>()

const timeAgoCreatedAt = computed(() => dayjs(props.version.createdAt).from(dayjs()))

const time = computed(() => {
  if (props.secondVersionCreatedAtTime) {
    // TODO
    const t0 = dayjs(props.version.createdAt)
    const t1 = dayjs(props.secondVersionCreatedAtTime)
    const isBefore = t1.isAfter(t0)
    return `${t0.to(t1, true)} ${isBefore ? 'earlier' : 'later'}`
  }
  return timeAgoCreatedAt.value
})
</script>
