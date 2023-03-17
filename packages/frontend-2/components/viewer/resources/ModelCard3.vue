<template>
  <div class="relative">
    <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events -->
    <div
      :class="`rounded group border-l-4 transition  ${
        showVersions
          ? 'max-h-96 border-primary'
          : 'hover:border-primary border-transparent'
      } cursor-pointer`"
    >
      <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events -->
      <div
        class="p-2 min-w-0 h-20 max-w-full transition flex items-center space-x-2 bg-foundation justify-between z-20 sticky top-0"
        @click="showVersions = !showVersions"
      >
        <div>
          <UserAvatar :user="loadedVersion?.authorUser" />
        </div>
        <div class="flex flex-col flex-grow space-y-0 min-w-0">
          <div>
            <span v-tippy="modelName.subheader ? model.name : null" class="font-bold">
              {{ modelName.header }}
            </span>
          </div>
          <div class="text-xs text-foreground-2 truncate">
            <span class="text-xs font-semibold">two weeks behind latest</span>
          </div>
        </div>
        <div
          v-if="!showVersions"
          class="opacity-0 group-hover:opacity-100 transition-opacity flex text-xs font-bold items-center space-x-1 flex-none"
        >
          <span>{{ model.versions?.totalCount }}</span>
          <ArrowPathRoundedSquareIcon class="w-4 h-4" />
        </div>
        <div
          v-else
          class="opacity-0 group-hover:opacity-100 transition-opacity flex text-xs font-bold items-center space-x-2 flex-none"
        >
          <XMarkIcon class="w-4 h-4" />
        </div>
      </div>
    </div>
    <Transition>
      <div
        v-if="showRemove"
        class="group absolute inset-0 w-full h-full bg-gradient-to-r from-blue-500/0 to-foundation z-[21] flex items-center justify-end rounded p-4 space-x-2"
      >
        <FormButton
          color="danger"
          size="xs"
          class="rounded-full"
          @click="$emit('remove', props.model.id)"
        >
          <XMarkIcon class="w-5 h-5" />
        </FormButton>
      </div>
    </Transition>
    <div
      v-show="showVersions && !showRemove"
      class="flex flex-col space-y-0 mt-2 ml-4 h-auto"
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
