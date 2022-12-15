<template>
  <div class="h-52 rounded-lg bg-foundation-2 shadow flex flex-col">
    <!-- Image -->
    <div class="grow flex">
      <ClientOnly>
        <div
          v-if="previewUrl"
          class="grow bg-contain bg-no-repeat bg-center"
          :style="{ backgroundImage: `url('${previewUrl}')` }"
        />
      </ClientOnly>
    </div>
    <!-- Footer -->
    <div class="py-3 px-2 flex justify-between items-center">
      <div class="text-foreground normal truncate pr-2">
        {{ model.name }}
      </div>
      <div class="text-foreground-2 caption inline-flex items-center space-x-2">
        <div class="inline-flex items-center space-x-1">
          <ArrowPathRoundedSquareIcon class="h-4 w-4" />
          <span>{{ model.versionCount }}</span>
        </div>
        <EllipsisVerticalIcon class="h-5 w-5" />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import {
  ArrowPathRoundedSquareIcon,
  EllipsisVerticalIcon
} from '@heroicons/vue/24/solid'
import { ProjectPageLatestItemsModelItemFragment } from '~~/lib/common/generated/gql/graphql'
import { usePreviewImageBlob } from '~~/lib/projects/composables/previewImage'

const props = defineProps<{
  model: ProjectPageLatestItemsModelItemFragment
}>()

const basePreviewUrl = computed(() => props.model.previewUrl)
const { previewUrl } = usePreviewImageBlob(basePreviewUrl)
</script>
