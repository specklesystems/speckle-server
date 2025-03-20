<template>
  <button
    class="group text-left relative bg-foundation-2 rounded p-1 hover:text-primary hover:bg-primary-muted transition cursor-pointer hover:shadow-md"
  >
    <div class="flex items-center space-x-2 max-[275px]:space-x-0">
      <div class="max-[275px]:hidden">
        <div v-if="model.previewUrl" class="h-12 w-12">
          <img
            :src="model.previewUrl"
            alt="preview image for model"
            class="h-12 w-12 object-cover"
          />
        </div>
        <div
          v-else
          class="h-12 w-12 bg-blue-500/10 rounded flex items-center justify-center"
        >
          <CubeTransparentIcon class="w-5 h-5 text-foreground-2" />
        </div>
      </div>
      <div class="min-w-0 w-full">
        <div class="text-body-3xs text-foreground-2 truncate" :title="model.name">
          {{ folderPath }}
        </div>

        <div class="flex items-center justify-around space-x-2">
          <div class="text-heading-sm grow truncate text-ellipsis">
            {{ model.displayName }}
          </div>
        </div>

        <div class="text-body-3xs text-foreground-2 truncate flex space-x-2">
          <div>updated {{ updatedAgo }}</div>
        </div>
      </div>
      <div class="space-y-2 max-[275px]:hidden">
        <div class="rounded-full px-1 text-xs truncate shrink flex">
          <div>{{ model.versions.totalCount }}</div>
          <ClockIcon class="ml-1 w-3" />
        </div>
        <div class="text-right">
          <SourceAppBadge v-if="sourceApp" :source-app="sourceApp" />
        </div>
      </div>
    </div>
  </button>
</template>
<script setup lang="ts">
import dayjs from 'dayjs'
import { CubeTransparentIcon } from '@heroicons/vue/20/solid'
import { ClockIcon } from '@heroicons/vue/24/outline'
import type { SourceAppName } from '@speckle/shared'
import { SourceApps } from '@speckle/shared'
import type { ModelListModelItemFragment } from '~/lib/common/generated/gql/graphql'

const props = defineProps<{
  model: ModelListModelItemFragment
}>()

const folderPath = computed(() => {
  const splitName = props.model.name.split('/')
  if (splitName.length === 1) return ' '
  const withoutLast = splitName.slice(0, -1)
  return withoutLast.join('/')
})

const updatedAgo = computed(() => {
  return dayjs(props.model.updatedAt).from(dayjs())
})

const sourceApp = computed(() => {
  if (props.model.versions.items.length === 0) return
  const version = props.model.versions.items[0]

  return (
    SourceApps.find((sapp) =>
      version.sourceApplication?.toLowerCase()?.includes(sapp.searchKey.toLowerCase())
    ) || {
      searchKey: '',
      name: version.sourceApplication as SourceAppName,
      short: version.sourceApplication?.substring(0, 3) as string,
      bgColor: '#000'
    }
  )
})
</script>
