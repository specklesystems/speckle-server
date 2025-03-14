<template>
  <button
    :class="`relative block text-left shadow rounded-md bg-foundation-2 hover:bg-primary-muted overflow-hidden transition `"
    :disabled="selectedVersionId === version.id && !fromWizard"
  >
    <div class="mb-2">
      <img :src="version.previewUrl" alt="version preview" />
    </div>
    <UserAvatar
      v-tippy="`Authored by ${version.authorUser?.name}`"
      :user="version.authorUser"
      size="sm"
      class="absolute inset-1"
    />
    <div class="mt-1 p-2 border-t dark:border-gray-700">
      <div class="flex space-x-2 items-center min-w-0">
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
        <span class="text-body-2xs text-foreground-2 truncate">{{ createdAgo }}</span>
      </div>
    </div>
    <CommonBadge
      v-if="latestVersionId === version.id && selectedVersionId !== latestVersionId"
      dot
      dot-icon-color-classes="animate-ping"
      class="absolute top-1 right-1 shadow"
    >
      Latest
    </CommonBadge>
    <CommonBadge
      v-if="selectedVersionId === version.id"
      dot
      color-classes="bg-foundation"
      class="absolute top-1 right-1 shadow"
    >
      Current
    </CommonBadge>
    <!-- Warning if obj is coming from the v2 side -->
    <!-- <div v-if="!objectVersion" class="bottom-0 left-0">
      <div
        class="text-body-2xs px-2 bg-blue-500/5 py-2 text-foreground-2 flex items-center space-x-1 justify-center"
      >
        <div>Compatibility warning:</div>
        <FormButton size="sm" text @click.stop="showCompatWarning = true">
          read more
        </FormButton>
        <CommonDialog
          v-model:open="showCompatWarning"
          title="Compatibility warning"
          fullscreen="none"
        >
          This version might not receive as expected.
          <br />
          <br />
          As we progress with the new Speckle, there are a few things that won’t work as
          expected. We recommend you send this model again using next connectors if
          available.
          <br />
          <br />
          We will do our best to convert, but, for example, Instances (Blocks), Render
          Materials, Parameters and others will not work from the previous version of
          the connectors.
          <div class="mt-4 flex justify-end items-center space-x-2">
            <FormButton size="sm" @click="showCompatWarning = false">
              Understood
            </FormButton>
          </div>
        </CommonDialog>
      </div>
    </div> -->
  </button>
</template>
<script setup lang="ts">
import dayjs from 'dayjs'
import type { SourceAppName } from '@speckle/shared'
import { SourceApps } from '@speckle/shared'
import type { VersionListItemFragment } from '~/lib/common/generated/gql/graphql'
// import { objectQuery } from '~/lib/graphql/mutationsAndQueries'
// import { useQuery } from '@vue/apollo-composable'

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

// NOTE!!!: This logic somehow caused regression on versionList fetchMore, but we do not know exactly why yet.
// const { result: objectQueryResult } = useQuery(
//   objectQuery,
//   () => ({ projectId: props.projectId, objectId: props.referencedObjectId }),
//   () => ({ clientId: props.accountId })
// )

// type Data = {
//   version?: number
// }
// const objectVersion = computed(() => {
//   const data = objectQueryResult.value?.project?.object?.data as Data | undefined
//   return data?.version
// })

// const showCompatWarning = ref(false)
</script>
