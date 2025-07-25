<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<template>
  <div class="relative border-b border-outline-3">
    <div
      :class="showVersions ? 'max-h-96 shadow-md' : ''"
      @mouseenter="highlightObject"
      @mouseleave="unhighlightObject"
      @focusin="highlightObject"
      @focusout="unhighlightObject"
    >
      <!-- Model Header -->
      <div
        class="group sticky cursor-pointer top-0 z-20 flex min-w-0 max-w-full items-center justify-between gap-3 pl-1 pr-4 py-2 select-none"
        :class="showVersions ? 'bg-primary' : 'bg-foundation hover:bg-foundation-2'"
        @click="showVersions = !showVersions"
      >
        <div class="h-12 w-12 rounded-md overflow-hidden border border-outline-3">
          <NuxtImg
            :src="loadedVersion?.previewUrl"
            class="object-cover h-full w-full"
          />
        </div>
        <div class="flex min-w-0 flex-grow flex-col">
          <div
            v-tippy="modelName.subheader ? model.name : null"
            :class="`${
              showVersions ? 'text-foundation' : ''
            } text-body-xs truncate min-w-0`"
          >
            {{ modelName.header }}
          </div>
          <div class="truncate -mt-1.5">
            <span
              v-tippy="createdAtFormatted.full"
              :class="`${
                showVersions ? 'text-foundation' : 'text-foreground-2'
              } text-body-3xs`"
            >
              {{ isLatest ? 'Latest version' : createdAtFormatted.relative }}
            </span>
          </div>
        </div>
        <span v-if="!showVersions" class="text-foreground-2 text-body-2xs font-medium">
          {{ model.versions?.totalCount }}
        </span>
        <div
          v-else
          :class="`${
            showVersions ? 'text-white' : ''
          } flex flex-none items-center space-x-2 text-xs font-medium opacity-80 transition-opacity group-hover:opacity-100`"
        >
          <ChevronUpIcon class="h-4 w-4" />
        </div>
      </div>

      <!-- Active Version Card (when expanded but no scene data) -->
      <ViewerResourcesActiveVersionCard
        v-if="loadedVersion && showVersions"
        :version="loadedVersion"
      />
    </div>

    <!-- Remove Overlay -->
    <Transition>
      <div
        v-if="showRemove"
        class="to-foundation group absolute inset-0 z-[21] flex h-full w-full items-center justify-end space-x-2 rounded bg-gradient-to-r from-blue-500/0 p-4"
      >
        <FormButton
          color="danger"
          size="sm"
          hide-text
          :icon-left="XMarkIcon"
          @click="$emit('remove', props.model.id)"
        />
      </div>
    </Transition>

    <!-- Version List (when expanded and not in remove mode) -->
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
        <FormButton full-width text :disabled="!showLoadMore" @click="onLoadMore">
          {{ showLoadMore ? 'View older versions' : 'No more versions' }}
        </FormButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { graphql } from '~~/lib/common/generated/gql'
import { XMarkIcon, ChevronUpIcon } from '@heroicons/vue/24/solid'
import type {
  ViewerLoadedResourcesQuery,
  ViewerModelVersionCardItemFragment
} from '~~/lib/common/generated/gql/graphql'
import type { Get } from 'type-fest'
import {
  useInjectedViewerLoadedResources,
  useInjectedViewerRequestedResources
} from '~~/lib/viewer/composables/setup'
import {
  useDiffUtilities,
  useHighlightedObjectsUtilities
} from '~~/lib/viewer/composables/ui'

type ModelItem = NonNullable<Get<ViewerLoadedResourcesQuery, 'project.models.items[0]'>>

defineEmits<{
  (e: 'remove', val: string): void
}>()

const props = defineProps<{
  model: ModelItem
  versionId: string
  showRemove: boolean
  last: boolean
}>()

const { switchModelToVersion } = useInjectedViewerRequestedResources()
const { loadMoreVersions } = useInjectedViewerLoadedResources()
const { diffModelVersions } = useDiffUtilities()
const { highlightObjects, unhighlightObjects } = useHighlightedObjectsUtilities()

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

const createdAt = computed(() => loadedVersion.value?.createdAt)

const createdAtFormatted = computed(() => {
  return {
    full: formattedFullDate(createdAt.value),
    relative: formattedRelativeDate(createdAt.value, { capitalize: true })
  }
})

const latestVersion = computed(() => {
  return versions.value
    .slice()
    .sort((a, b) => (dayjs(a.createdAt).isBefore(dayjs(b.createdAt)) ? 1 : -1))[0]
})

const isLatest = computed(() => loadedVersion.value?.id === latestVersion.value.id)

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

const highlightObject = () => {
  const refObject = props.model.loadedVersion.items[0]?.referencedObject
  if (refObject) highlightObjects([refObject])
}

const unhighlightObject = () => {
  const refObject = props.model.loadedVersion.items[0]?.referencedObject
  if (refObject) unhighlightObjects([refObject])
}
</script>
