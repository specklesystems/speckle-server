<template>
  <div class="shadow rounded-md p-1 flex flex-col justify-center cursor-pointer">
    <div class="h-20 w-full">
      <PreviewImage :preview-url="version.previewUrl" />
    </div>
    <div
      v-tippy="formattedFullDate(createdAt)"
      class="bg-foundation-focus inline-block rounded-md px-2 text-xs font-bold truncate text-center py-1"
    >
      <span>
        {{ formattedRelativeDate(createdAt, { capitalize: true }) }}
      </span>
      <br />
      {{ isNewest ? 'New' : 'Old' }} Version
    </div>
  </div>
</template>
<script setup lang="ts">
import type { ViewerModelVersionCardItemFragment } from '~~/lib/common/generated/gql/graphql'

const props = defineProps<{
  version: ViewerModelVersionCardItemFragment
  isNewest: boolean
}>()

const createdAt = computed(() => props.version.createdAt)
</script>
