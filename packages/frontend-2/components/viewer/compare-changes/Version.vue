<template>
  <div class="shadow rounded-md p-1 flex flex-col justify-center cursor-pointer">
    <div class="h-20 w-full">
      <PreviewImage :preview-url="version.previewUrl" />
    </div>
    <div
      class="bg-foundation-focus inline-block rounded-md px-2 text-xs font-bold truncate text-center py-1"
      v-tippy="createdAt"
    >
      {{ timeAgoCreatedAt }}
      <br />
      {{ isNewest ? 'New' : 'Old' }} Version
    </div>
  </div>
</template>
<script setup lang="ts">
import dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import { ViewerModelVersionCardItemFragment } from '~~/lib/common/generated/gql/graphql'

dayjs.extend(localizedFormat)

const props = defineProps<{
  version: ViewerModelVersionCardItemFragment
  isNewest: Boolean
}>()

const timeAgoCreatedAt = computed(() => dayjs(props.version.createdAt).from(dayjs()))

const createdAt = computed(() => {
  return dayjs(props.version.createdAt).format('LLL')
})
</script>
