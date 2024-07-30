<template>
  <div>
    <h1 class="block text-heading-lg my-4">Versions</h1>
    <div
      v-if="selectedItems.length"
      class="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center"
    >
      <div>
        {{ `${selectedItems.length} version${selectedItems.length > 1 ? 's' : ''}` }}
        selected
      </div>
      <div
        class="flex flex-wrap space-y-2 sm:items-center sm:space-x-2 sm:space-y-0 sm:flex-nowrap"
      >
        <FormButton
          color="outline"
          class="w-full sm:w-auto"
          @click="selectedItems = []"
        >
          Clear selection
        </FormButton>
        <div class="flex space-x-2 w-full sm:w-auto">
          <FormButton class="grow" @click="onBatchMoveTo">Move to</FormButton>
          <FormButton color="danger" class="grow" @click="onBatchDelete">
            Delete
          </FormButton>
        </div>
      </div>
    </div>
    <div
      v-if="items?.length && project.model"
      class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-4 relative z-10"
    >
      <!-- Decrementing z-index necessary for the actions menu to render correctly. Each card has its own stacking context because of the scale property -->
      <template v-for="(item, i) in items" :key="item.id">
        <ProjectModelPageVersionsCard
          v-if="!isPendingVersionFragment(item)"
          v-model:selected="itemsSelectedState[item.id]"
          :version="item"
          :model-id="project.model.id"
          :project-id="project.id"
          :style="`z-index: ${items.length - i};`"
          :selectable="!!selectedItems.length"
          :selection-disabled="disabledSelections[item.id]"
          @select="onSelect(item)"
          @chosen="onSingleActionChosen($event, item)"
          @embed="handleEmbed(item.id)"
        />
        <ProjectModelPageVersionsCard
          v-else
          :version="item"
          :model-id="project.model.id"
          :project-id="project.id"
          :style="`z-index: ${items.length - i};`"
        />
      </template>
    </div>
    <div v-else>
      <ProjectCardImportFileArea
        ref="importArea"
        :project-id="project.id"
        :model-name="project.model.name"
        class="h-full w-full"
      />
    </div>
    <InfiniteLoading v-if="items?.length" @infinite="infiniteLoad" />
    <ProjectModelPageDialogDelete
      v-model:open="isDeleteDialogOpen"
      :versions="deleteDialogVersions"
      :project-id="project.id"
      :model-id="modelId"
      @fully-closed="dialogState = null"
    />
    <ProjectModelPageDialogMoveTo
      v-model:open="isMoveToDialogOpen"
      :project-id="project.id"
      :versions="moveToDialogVersions"
      :model-id="modelId"
      @fully-closed="dialogState = null"
    />
    <ProjectModelPageDialogEditMessage
      v-model:open="isEditMessageDialogOpen"
      :project-id="project.id"
      :version="editMessageDialogVersion"
      @fully-closed="dialogState = null"
    />
    <ProjectModelPageDialogEmbed
      v-model:open="embedDialogOpen"
      :project="project"
      :version-id="currentVersionId"
      :model-id="project.model.id"
    />
    <div class="py-12">
      <!-- Some padding to deal with a card menu potentially opening at the bottom of the page -->
    </div>
  </div>
</template>
<script setup lang="ts">
import type { Get } from 'type-fest'
import { Roles } from '@speckle/shared'
import type { Nullable } from '@speckle/shared'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { graphql } from '~~/lib/common/generated/gql'
import type { ProjectModelPageVersionsProjectFragment } from '~~/lib/common/generated/gql/graphql'
import type { InfiniteLoaderState } from '~~/lib/global/helpers/components'
import { useModelVersions } from '~~/lib/projects/composables/versionManagement'
import { VersionActionTypes } from '~~/lib/projects/helpers/components'
import { reduce } from 'lodash-es'
import { isPendingVersionFragment } from '~~/lib/projects/helpers/models'

type SingleVersion = NonNullable<Get<typeof versions.value, 'items[0]'>>

graphql(`
  fragment ProjectModelPageVersionsPagination on Project {
    id
    visibility
    model(id: $modelId) {
      id
      versions(limit: 16, cursor: $versionsCursor) {
        cursor
        totalCount
        items {
          ...ProjectModelPageVersionsCardVersion
        }
      }
    }
    ...ProjectsModelPageEmbed_Project
  }
`)

graphql(`
  fragment ProjectModelPageVersionsProject on Project {
    ...ProjectPageProjectHeader
    model(id: $modelId) {
      id
      name
      pendingImportedVersions {
        ...PendingFileUpload
      }
    }
    ...ProjectModelPageVersionsPagination
    ...ProjectsModelPageEmbed_Project
  }
`)

const props = defineProps<{
  project: ProjectModelPageVersionsProjectFragment
}>()

const logger = useLogger()

const modelId = computed(() => props.project.model?.id || '')

// we're not using versions off props, cause 'versions' should already have those
// from the cache (no extraneous queries should be invoked)
const { versions, loadMore, moreToLoad } = useModelVersions({
  projectId: computed(() => props.project.id),
  modelId: modelId.value
})
const { activeUser } = useActiveUser()

const realVersionItems = computed(() => versions.value?.items)

const items = computed(() => [
  ...(props.project.model?.pendingImportedVersions || []),
  ...(realVersionItems.value || [])
])

const itemsSelectedState = ref({} as Record<string, boolean>)
const dialogState = ref(
  null as Nullable<{
    type: VersionActionTypes
    items: SingleVersion[]
    closed?: boolean
  }>
)

const importArea = ref(
  null as Nullable<{
    triggerPicker: () => void
  }>
)

const currentVersionId = ref<string | undefined>(undefined)
const embedDialogOpen = ref(false)

const selectedItems = computed({
  get: () =>
    (realVersionItems.value || []).filter((i) => !!itemsSelectedState.value[i.id]),
  set: (newVal) =>
    (itemsSelectedState.value = reduce(
      newVal,
      (result, item) => {
        result[item.id] = true
        return result
      },
      {} as typeof itemsSelectedState.value
    ))
})
const disabledSelections = computed(() => {
  const results: Record<string, boolean> = {}
  if (props.project.role === Roles.Stream.Owner) return results

  for (const item of realVersionItems.value || []) {
    if (!activeUser.value || item.authorUser?.id !== activeUser.value.id) {
      results[item.id] = true
    }
  }

  return results
})

const deleteDialogVersions = computed(() =>
  dialogState.value?.type === VersionActionTypes.Delete ? dialogState.value.items : []
)
const isDeleteDialogOpen = computed({
  get: () => !!deleteDialogVersions.value?.length && !dialogState.value?.closed,
  set: (newVal) => {
    if (!newVal && dialogState.value) {
      dialogState.value.closed = true
    }
  }
})

const moveToDialogVersions = computed(() =>
  dialogState.value?.type === VersionActionTypes.MoveTo ? dialogState.value.items : []
)
const isMoveToDialogOpen = computed({
  get: () => !!(moveToDialogVersions.value?.length && !dialogState.value?.closed),
  set: (newVal) => {
    if (!newVal && dialogState.value) {
      dialogState.value.closed = true
    }
  }
})

const editMessageDialogVersion = computed(() =>
  dialogState.value?.type === VersionActionTypes.EditMessage
    ? dialogState.value.items[0]
    : null
)
const isEditMessageDialogOpen = computed({
  get: () => !!(editMessageDialogVersion.value && !dialogState.value?.closed),
  set: (newVal) => {
    if (!newVal && dialogState.value) {
      dialogState.value.closed = true
    }
  }
})

const infiniteLoad = async (state: InfiniteLoaderState) => {
  if (!moreToLoad.value) return state.complete()

  try {
    await loadMore()
  } catch (e) {
    logger.error(e)
    state.error()
    return
  }

  state.loaded()
  if (!moreToLoad.value) {
    state.complete()
  }
}

const onSelect = (item: SingleVersion) => {
  if (disabledSelections.value[item.id]) return
  itemsSelectedState.value[item.id] = true
}

const onSingleActionChosen = (action: VersionActionTypes, item: SingleVersion) => {
  dialogState.value = {
    type: action,
    items: [item]
  }
}

const onBatchMoveTo = () => {
  dialogState.value = {
    type: VersionActionTypes.MoveTo,
    items: selectedItems.value.slice()
  }
}

const onBatchDelete = () => {
  dialogState.value = {
    type: VersionActionTypes.Delete,
    items: selectedItems.value.slice()
  }
}

const handleEmbed = (versionId: string) => {
  currentVersionId.value = versionId
  embedDialogOpen.value = true
}
</script>
