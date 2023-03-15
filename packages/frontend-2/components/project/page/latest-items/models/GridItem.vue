<template>
  <div
    class="group h-72 rounded-lg bg-foundation shadow hover:shadow-lg flex flex-col text-foreground hover:bg-primary-muted xxxhover:text-foreground-on-primary hover:scale-105 transition"
  >
    <!-- Image -->
    <div class="grow flex">
      <ClientOnly>
        <div
          v-if="previewUrl && model.versionCount.totalCount > 0"
          class="grow bg-contain bg-no-repeat bg-center"
          :style="{ backgroundImage: `url('${previewUrl}')` }"
        />
        <div v-else class="grow flex flex-col items-center justify-center caption">
          <div>No Versions</div>
          <div>TODO: empty state</div>
        </div>
      </ClientOnly>
    </div>
    <!-- Footer -->
    <div class="pb-2 px-3 flex justify-between items-center">
      <div class="normal truncate pr-2 font-bold">
        {{ model.name }}
      </div>
      <div
        class="text-foreground-2 xxxgroup-hover:text-foreground-on-primary caption inline-flex items-center space-x-1.5"
      >
        <div class="invisible group-hover:visible inline-flex items-center transition">
          <ArrowPathRoundedSquareIcon class="h-4 w-4" />
          <span class="ml-1">{{ model.versionCount.totalCount }}</span>
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
// const basePreviewUrl360 = computed(() => props.model.previewUrl + '/all')
const { previewUrl } = usePreviewImageBlob(basePreviewUrl)
</script>
