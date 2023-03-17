<template>
  <div class="relative">
    <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events -->
    <div
      :class="`group rounded border-l-4 transition  ${
        showVersions
          ? 'border-primary max-h-96'
          : 'hover:border-primary border-transparent'
      } cursor-pointer`"
    >
      <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events -->
      <div
        class="bg-foundation sticky top-0 z-20 flex h-20 min-w-0 max-w-full items-center justify-between space-x-2 p-2 transition"
        @click="showVersions = !showVersions"
      >
        <div>
          <UserAvatar :user="loadedVersion?.authorUser" />
        </div>
        <div class="flex min-w-0 flex-grow flex-col space-y-0">
          <div>
            <span v-tippy="modelName.subheader ? model.name : null" class="font-bold">
              {{ modelName.header }}
            </span>
          </div>
          <div class="text-foreground-2 truncate text-xs">
            <span class="text-xs font-semibold">two weeks behind latest</span>
          </div>
        </div>
        <div
          v-if="!showVersions"
          class="flex flex-none items-center space-x-1 text-xs font-bold opacity-0 transition-opacity group-hover:opacity-100"
        >
          <span>{{ model.versions?.totalCount }}</span>
          <ArrowPathRoundedSquareIcon class="h-4 w-4" />
        </div>
        <div
          v-else
          class="flex flex-none items-center space-x-2 text-xs font-bold opacity-0 transition-opacity group-hover:opacity-100"
        >
          <XMarkIcon class="h-4 w-4" />
        </div>
      </div>
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
      <ViewerResourcesVersionCard3
        v-for="version in props.model.versions.items"
        :key="version.id"
        :model-id="modelId"
        :version="version"
        :is-latest-version="version.id === latestVersionId"
        :is-loaded-version="version.id === loadedVersion?.id"
        @change-version="handleVersionChange"
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
import { XMarkIcon, ArrowPathRoundedSquareIcon } from '@heroicons/vue/24/solid'
import { ViewerLoadedResourcesQuery } from '~~/lib/common/generated/gql/graphql'
import { Get } from 'type-fest'
import {
  useInjectedViewerLoadedResources,
  useInjectedViewerRequestedResources
} from '~~/lib/viewer/composables/setup'

type ModelItem = NonNullable<Get<ViewerLoadedResourcesQuery, 'project.models.items[0]'>>

defineEmits<{
  (e: 'remove'): void
}>()

const props = defineProps<{
  model: ModelItem
  versionId: string
  showRemove: boolean
}>()

const { switchModelToVersion } = useInjectedViewerRequestedResources()
const { loadMoreVersions } = useInjectedViewerLoadedResources()

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

function handleVersionChange(versionId: string) {
  switchModelToVersion(props.model.id, versionId)
}

const onLoadMore = async () => {
  await loadMoreVersions(props.model.id)
}
</script>
