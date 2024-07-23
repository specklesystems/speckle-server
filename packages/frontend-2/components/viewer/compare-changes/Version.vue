<template>
  <div class="shadow rounded-md p-1 flex flex-col justify-center cursor-pointer">
    <div class="h-20 w-full">
      <PreviewImage :preview-url="version.previewUrl" />
    </div>
    <div
      v-tippy="createdAt.full"
      class="bg-foundation-focus inline-block rounded-md px-2 text-body-2xs font-medium truncate text-center py-1"
    >
      <span>
        {{ createdAt.relative }}
      </span>
      <br />
      {{ isNewest ? 'New' : 'Old' }} version
    </div>
  </div>
</template>
<script setup lang="ts">
import type { ViewerModelVersionCardItemFragment } from '~~/lib/common/generated/gql/graphql'

const props = defineProps<{
  version: ViewerModelVersionCardItemFragment
  isNewest: boolean
}>()

const createdAt = computed(() => {
  return {
    full: formattedFullDate(props.version.createdAt),
    relative: formattedRelativeDate(props.version.createdAt, { capitalize: true })
  }
})
</script>
