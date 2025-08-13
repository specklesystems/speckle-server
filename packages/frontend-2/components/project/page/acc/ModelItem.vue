<template>
  <button
    class="group text-left relative border border-foreground-1 bg-foundation rounded p-1 hover:text-primary hover:bg-primary-muted transition cursor-pointer hover:shadow-md"
    :class="selected ? 'border border-foreground-2 bg-foundation-focus' : ''"
    :disabled="disabled"
  >
    <div class="flex items-center space-x-2 max-[275px]:space-x-0">
      <div class="max-[275px]:hidden">
        <div
          v-if="model.versionCount.totalCount === 0"
          class="h-12 w-12 bg-foundation-2 rounded flex items-center justify-center"
        >
          <CubeTransparentIcon class="w-5 h-5 text-foreground-2" />
        </div>
        <div v-else-if="previewUrl" class="h-12 w-12">
          <img
            :src="previewUrl"
            alt="preview image for model"
            class="h-12 w-12 object-cover"
          />
        </div>
        <div
          v-else
          class="h-12 w-12 bg-foundation-2 rounded flex items-center justify-center"
        >
          <CommonLoadingIcon />
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
        <div class="px-1 text-xs flex items-center">
          <div>{{ model.versionCount.totalCount }}</div>
          <ClockIcon class="ml-1 h-3" />
        </div>
        <!-- <div class="text-right">
          <SourceAppBadge v-if="sourceApp" :source-app="sourceApp" />
        </div> -->
      </div>
    </div>
  </button>
</template>

<script setup lang="ts">
import { computedAsync } from '@vueuse/core'
import type { ProjectPageLatestItemsModelItemFragment } from '~/lib/common/generated/gql/graphql'
import { useAuthManager } from '~~/lib/auth/composables/auth'
import dayjs from 'dayjs'
import { ClockIcon } from '@heroicons/vue/24/outline'
import { CubeTransparentIcon } from '@heroicons/vue/20/solid'

const props = defineProps<{
  model: ProjectPageLatestItemsModelItemFragment
  selected: boolean
  disabled: boolean
}>()

const { authToken } = useAuthManager()

const folderPath = computed(() => {
  const splitName = props.model.name.split('/')
  if (splitName.length === 1) return ' '
  const withoutLast = splitName.slice(0, -1)
  return withoutLast.join('/')
})

const previewUrl = computedAsync(async () => {
  if (props.model.previewUrl === null || !authToken.value) return
  return await usePreviewUrl(authToken.value, props.model.previewUrl)
})

const updatedAgo = computed(() => {
  return dayjs(props.model.updatedAt).from(dayjs())
})

async function usePreviewUrl(
  token: string,
  previewUrl?: string
): Promise<string | undefined> {
  if (!previewUrl) return previewUrl
  const res = await fetch(previewUrl, {
    headers: { Authorization: `Bearer ${token}` }
  })

  if (!res.ok) return previewUrl
  const blob = await res.blob()
  return URL.createObjectURL(blob)
}
</script>
