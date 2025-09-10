<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<template>
  <div class="relative" :class="showVersions ? 'border-b border-outline-3' : ''">
    <!-- Model Header - Sticky -->
    <div
      class="group sticky top-0 z-20 bg-foundation cursor-pointer flex items-center h-16 pr-0.5 border-b border-outline-3 hover:bg-highlight-1"
      @click="showVersions = !showVersions"
      @mouseenter="highlightObject"
      @mouseleave="unhighlightObject"
      @focusin="highlightObject"
      @focusout="unhighlightObject"
    >
      <ViewerExpansionTriangle
        class="h-8"
        :is-expanded="showVersions"
        @click="showVersions = !showVersions"
      />
      <div
        class="h-12 w-12 rounded-md overflow-hidden border border-outline-3 mr-3 shrink-0"
      >
        <PreviewImage
          v-if="loadedVersion?.previewUrl"
          :preview-url="loadedVersion?.previewUrl"
        />
      </div>
      <div class="flex flex-col">
        <span
          v-tippy="modelName.subheader ? model.name : null"
          class="text-foreground text-body-2xs font-medium"
        >
          {{ modelName.header }}
        </span>
        <span v-if="isLatest" class="text-body-3xs text-foreground">
          Latest version
        </span>
        <span v-tippy="createdAtFormatted.full" class="text-body-3xs text-foreground-2">
          {{ createdAtFormatted.relative }}
        </span>
      </div>
      <span class="text-foreground-2 text-body-3xs font-medium ml-auto pr-3">
        {{ model.versions?.totalCount }}
      </span>
    </div>

    <!-- Version List -->
    <div v-show="showVersions" class="flex-col">
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
        :total-versions="props.model.versions.totalCount"
        @change-version="handleVersionChange"
        @view-changes="handleViewChanges"
        @remove-version="handleRemoveVersion"
      />
      <div v-if="showLoadMore" class="mt-4 pr-2 py-2 -ml-3">
        <FormButton
          full-width
          size="sm"
          text
          color="subtle"
          :disabled="!showLoadMore"
          @click="onLoadMore"
        >
          View older versions
        </FormButton>
      </div>
    </div>

    <!-- Version Delete Dialog -->
    <ProjectModelPageDialogDelete
      v-if="project?.id"
      v-model:open="showDeleteDialog"
      :project-id="project.id"
      :model-id="model.id"
      :versions="versionsToDelete"
      @deleted="onVersionDeleted"
    />
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { graphql } from '~~/lib/common/generated/gql'
import type {
  ViewerLoadedResourcesQuery,
  ViewerModelVersionCardItemFragment
} from '~~/lib/common/generated/gql/graphql'
import type { Get } from 'type-fest'
import {
  useInjectedViewerLoadedResources,
  useInjectedViewerRequestedResources,
  useInjectedViewerState
} from '~~/lib/viewer/composables/setup'
import {
  useDiffUtilities,
  useHighlightedObjectsUtilities
} from '~~/lib/viewer/composables/ui'

type ModelItem = NonNullable<Get<ViewerLoadedResourcesQuery, 'project.models.items[0]'>>

const props = defineProps<{
  model: ModelItem
  versionId: string
  last: boolean
  initiallyExpanded?: boolean
}>()

const { switchModelToVersion } = useInjectedViewerRequestedResources()
const { loadMoreVersions } = useInjectedViewerLoadedResources()
const { diffModelVersions } = useDiffUtilities()
const { highlightObjects, unhighlightObjects } = useHighlightedObjectsUtilities()
const {
  resources: {
    response: { project }
  }
} = useInjectedViewerState()
const { formattedRelativeDate, formattedFullDate } = useDateFormatters()

const showVersions = ref(!!props.initiallyExpanded)
const showDeleteDialog = ref(false)
const versionsToDelete = ref<{ id: string; message?: string | null }[]>([])

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
  return {
    subheader: parts.length > 1 ? parts.slice(0, -1).join('/') : null,
    header: parts[parts.length - 1]
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
  if (refObject && typeof refObject === 'string') highlightObjects([refObject])
}

const unhighlightObject = () => {
  const refObject = props.model.loadedVersion.items[0]?.referencedObject
  if (refObject && typeof refObject === 'string') unhighlightObjects([refObject])
}

const handleRemoveVersion = (versionId: string) => {
  // Find the version to delete
  const versionToDelete = versions.value.find((v) => v.id === versionId)
  if (versionToDelete) {
    versionsToDelete.value = [
      { id: versionToDelete.id, message: versionToDelete.message }
    ]
    showDeleteDialog.value = true
  }
}

const onVersionDeleted = () => {
  // Refresh the versions list after successful deletion
  loadMoreVersions(props.model.id)
}

watch(showDeleteDialog, (isOpen) => {
  if (!isOpen) {
    versionsToDelete.value = []
  }
})
</script>
