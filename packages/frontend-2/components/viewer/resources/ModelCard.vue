<template>
  <div class="relative">
    <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events -->
    <div
      :class="`rounded-md border-l-4 transition  ${
        showVersions
          ? 'border-primary max-h-96 shadow-md'
          : 'hover:border-primary border-transparent'
      }`"
    >
      <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events -->
      <div
        :class="`${
          showVersions ? 'bg-primary' : 'bg-foundation hover:bg-primary-muted'
        } group sticky cursor-pointer top-0 z-20 flex h-20 min-w-0 max-w-full items-center justify-between space-x-2 p-2 transition select-none`"
        @click="showVersions = !showVersions"
      >
        <div>
          <UserAvatar :user="loadedVersion?.authorUser" />
        </div>
        <div class="flex min-w-0 flex-grow flex-col space-y-0">
          <div
            v-tippy="modelName.subheader ? model.name : null"
            :class="`${
              showVersions ? 'text-foundation' : ''
            } font-bold truncate min-w-0`"
          >
            {{ modelName.header }}
          </div>
          <div class="truncate text-xs">
            <span
              v-tippy="createdAt"
              :class="`${
                showVersions ? 'text-foundation font-semibold' : ''
              } text-xs opacity-70`"
            >
              {{ isLatest ? 'latest version' : timeAgoCreatedAt }}
            </span>
          </div>
        </div>
        <div
          v-if="!showVersions"
          class="flex flex-none items-center space-x-1 text-xs font-bold"
        >
          <span>{{ model.versions?.totalCount }}</span>
          <ArrowPathRoundedSquareIcon class="h-4 w-4" />
        </div>
        <div
          v-else
          :class="`${
            showVersions ? 'text-white' : ''
          } flex flex-none items-center space-x-2 text-xs font-bold opacity-80 transition-opacity group-hover:opacity-100`"
        >
          <ChevronUpIcon class="h-4 w-4" />
        </div>
      </div>
      <ViewerResourcesActiveVersionCard
        v-if="loadedVersion && showVersions"
        :version="loadedVersion"
      />
    </div>
    <Transition>
      <div
        v-if="showRemove"
        class="to-foundation group absolute inset-0 z-[21] flex h-full w-full items-center justify-end space-x-2 rounded bg-gradient-to-r from-blue-500/0 p-4"
      >
        <FormButton
          color="danger"
          size="xs"
          class="rounded-full"
          @click="$emit('remove', props.model.id)"
        >
          <XMarkIcon class="h-5 w-5" />
        </FormButton>
      </div>
    </Transition>
    <div
      v-show="showVersions && !showRemove"
      class="mt-2 ml-4 flex h-auto flex-col space-y-0"
    >
      <ViewerResourcesVersionCard
        v-for="(version, index) in props.model.versions.items"
        :key="version.id"
        :model-id="modelId"
        :version="version"
        :is-latest-version="version.id === latestVersionId"
        :is-loaded-version="version.id === loadedVersion?.id"
        :last="index === props.model.versions.totalCount - 1"
        :last-loaded="index === props.model.versions.items.length - 1"
        :clickable="version.id !== loadedVersion?.id"
        @change-version="handleVersionChange"
        @view-changes="handleViewChanges"
      />
      <div class="mt-4 px-2 py-2">
        <FormButton
          full-width
          text
          size="sm"
          :disabled="!showLoadMore"
          @click="onLoadMore"
        >
          {{ showLoadMore ? 'View older versions' : 'No more versions' }}
        </FormButton>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import dayjs from 'dayjs'
import { graphql } from '~~/lib/common/generated/gql'
import {
  XMarkIcon,
  ArrowPathRoundedSquareIcon,
  ChevronUpIcon
} from '@heroicons/vue/24/solid'
import {
  ViewerLoadedResourcesQuery,
  ViewerModelVersionCardItemFragment
} from '~~/lib/common/generated/gql/graphql'
import { Get } from 'type-fest'
import {
  useInjectedViewerLoadedResources,
  useInjectedViewerRequestedResources
} from '~~/lib/viewer/composables/setup'
import { useDiffUtilities } from '~~/lib/viewer/composables/ui'

type ModelItem = NonNullable<Get<ViewerLoadedResourcesQuery, 'project.models.items[0]'>>

defineEmits<{
  (e: 'remove', val: string): void
}>()

const props = defineProps<{
  model: ModelItem
  versionId: string
  showRemove: boolean
}>()

const { switchModelToVersion } = useInjectedViewerRequestedResources()
const { loadMoreVersions } = useInjectedViewerLoadedResources()
const { diffModelVersions } = useDiffUtilities()

const showVersions = ref(false)

graphql(`
  fragment ViewerModelVersionCardItem on Version {
    id
    message
    referencedObject
    sourceApplication
    createdAt
    previewUrl
    authorUser {
      ...LimitedUserAvatar
    }
  }
`)

const modelId = computed(() => props.model.id)
const versions = computed(() => [
  ...props.model.loadedVersion.items,
  ...props.model.versions.items
])
const showLoadMore = computed(() => {
  const totalCount = props.model.versions.totalCount
  const currentCount = versions.value.length
  return currentCount < totalCount
})

const loadedVersion = computed(() =>
  versions.value.find((v) => v.id === props.versionId)
)

const latestVersion = computed(() => {
  return versions.value
    .slice()
    .sort((a, b) => (dayjs(a.createdAt).isBefore(dayjs(b.createdAt)) ? 1 : -1))[0]
})

const isLatest = computed(() => loadedVersion.value?.id === latestVersion.value.id)

const timeAgoCreatedAt = computed(() =>
  dayjs(loadedVersion.value?.createdAt).from(dayjs())
)

const createdAt = computed(() => {
  return dayjs(loadedVersion.value?.createdAt).format('LLL')
})

const latestVersionId = computed(() => latestVersion.value.id)

const modelName = computed(() => {
  const parts = props.model.name.split('/')
  if (parts.length > 1) {
    const name = parts[parts.length - 1]
    parts.pop()
    return {
      subheader: parts.join('/'),
      header: name
    }
  } else {
    return {
      subheader: null,
      header: props.model.name
    }
  }
})

async function handleVersionChange(versionId: string) {
  await switchModelToVersion(props.model.id, versionId)
}

const onLoadMore = async () => {
  await loadMoreVersions(props.model.id)
}

async function handleViewChanges(version: ViewerModelVersionCardItemFragment) {
  if (!loadedVersion.value?.id) return
  await diffModelVersions(modelId.value, loadedVersion.value.id, version.id)
}
</script>
