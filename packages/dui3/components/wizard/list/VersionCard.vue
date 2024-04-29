<template>
  <button
    :class="`block text-left shadow rounded-md bg-foundation-2 hover:bg-primary-muted overflow-hidden transition ${
      index === 0 || latestVersionId === version.id
        ? 'outline outline-2 outline-primary'
        : ''
    }`"
    :disabled="selectedVersionId === version.id"
  >
    <div class="mb-2">
      <img :src="version.previewUrl" alt="version preview" />
    </div>
    <div class="mt-1 p-2 border-t dark:border-gray-700">
      <div class="flex space-x-2 items-center min-w-0">
        <UserAvatar :user="version.authorUser" size="sm" />
        <SourceAppBadge
          :source-app="
                SourceApps.find((sapp) =>
                  version.sourceApplication?.toLowerCase()?.includes(sapp.searchKey.toLowerCase())
                ) || {
                  searchKey: '',
                  name: version.sourceApplication as SourceAppName,
                  short: version.sourceApplication?.substring(0, 3) as string,
                  bgColor: '#000'
                }
              "
        />
        <span class="text-xs truncate">Created {{ createdAgo }}</span>
      </div>
      <div class="text-xs text-foreground-2 mt-1 line-clamp-1 hover:line-clamp-5">
        <span>
          {{ version.message || 'No message' }}
        </span>
      </div>
    </div>
    <div
      v-if="latestVersionId === version.id && selectedVersionId !== latestVersionId"
      class="w-full py-1 flex items-center text-xs justify-center bg-primary text-foreground-on-primary font-semibold"
    >
      Load latest version
    </div>
    <div
      v-if="selectedVersionId === version.id"
      class="w-full py-1 flex items-center text-xs justify-center bg-primary-muted text-primary font-semibold"
    >
      Currently loaded version
      {{ latestVersionId === version.id ? '(latest)' : '' }}
    </div>
  </button>
</template>
<script setup lang="ts">
import dayjs from 'dayjs'
import { SourceApps, SourceAppName } from '@speckle/shared'
import { VersionListItemFragment } from '~/lib/common/generated/gql/graphql'

const props = defineProps<{
  version: VersionListItemFragment
  index: number
  latestVersionId: string
  selectedVersionId?: string
}>()

const createdAgo = computed(() => {
  return dayjs(props.version.createdAt).from(dayjs())
})
</script>
