<template>
  <button
    :class="`block text-left shadow rounded-md bg-foundation-2 hover:bg-primary-muted overflow-hidden transition ${
      index === 0 || (latestVersionId === version.id && !fromWizard)
        ? 'outline outline-2 outline-primary'
        : ''
    }`"
    :disabled="selectedVersionId === version.id && !fromWizard"
  >
    <!-- Warning identifier -->
    <div v-if="!objectVersion" class="bottom-0 left-0">
      <div
        class="rounded-bl-lg rounded-tr-[5px] text-body-2xs px-2 bg-warning text-foreground-on-primary"
      >
        Outdated
      </div>
    </div>

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
      <span v-if="!fromWizard">
        Currently loaded version {{ latestVersionId === version.id ? '(latest)' : '' }}
      </span>
      <span v-else>Load this version</span>
    </div>
  </button>
</template>
<script setup lang="ts">
import dayjs from 'dayjs'
import type { SourceAppName } from '@speckle/shared'
import { SourceApps } from '@speckle/shared'
import type { VersionListItemFragment } from '~/lib/common/generated/gql/graphql'
import { objectQuery } from '~/lib/graphql/mutationsAndQueries'
import { useQuery } from '@vue/apollo-composable'

const props = defineProps<{
  version: VersionListItemFragment
  index: number
  latestVersionId: string
  accountId: string
  projectId: string
  referencedObjectId: string
  selectedVersionId?: string
  fromWizard?: boolean
}>()

const createdAgo = computed(() => {
  return dayjs(props.version.createdAt).from(dayjs())
})

const { result: objectQueryResult } = useQuery(
  objectQuery,
  () => ({ projectId: props.projectId, objectId: props.referencedObjectId }),
  () => ({ clientId: props.accountId })
)

type Data = {
  version?: number
}
const objectVersion = computed(() => {
  const data = objectQueryResult.value?.project?.object?.data as Data | undefined
  return data?.version
})
</script>
