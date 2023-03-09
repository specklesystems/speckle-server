<template>
  <div>
    <h1 class="block h4 font-bold mb-4">Versions</h1>
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
        <FormButton outlined class="w-full sm:w-auto" @click="selectedItems = []">
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
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-4"
    >
      <!-- Decrementing z-index necessary for the actions menu to render correctly. Each card has its own stacking context because of the scale property -->
      <ProjectModelPageVersionsCard
        v-for="(item, i) in items"
        :key="item.id"
        v-model:selected="itemsSelectedState[item.id]"
        :version="item"
        :model-id="project.model.id"
        :project-id="project.id"
        :style="`z-index: ${items.length - i};`"
        :selectable="!!selectedItems.length"
        :selection-disabled="disabledSelections[item.id]"
        @select="onSelect(item)"
        @chosen="onSingleActionChosen($event, item)"
      />
    </div>
    <div v-else>TODO: Versions Empty state</div>
    <InfiniteLoading v-if="items?.length" @infinite="infiniteLoad" />
    <ProjectModelPageDialogDelete
      v-model:open="isDeleteDialogOpen"
      :versions="deleteDialogVersions"
      @fully-closed="dialogState = null"
    />
    <ProjectModelPageDialogMoveTo
      v-model:open="isMoveToDialogOpen"
      :project-id="project.id"
      :versions="moveToDialogVersions"
      @fully-closed="dialogState = null"
    />
  </div>
</template>
<script setup lang="ts">
import { Get } from 'type-fest'
import { Nullable, Roles } from '@speckle/shared'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { graphql } from '~~/lib/common/generated/gql'
import { ProjectModelPageVersionsProjectFragment } from '~~/lib/common/generated/gql/graphql'
import { InfiniteLoaderState } from '~~/lib/global/helpers/components'
import { useModelVersions } from '~~/lib/projects/composables/versionManagement'
import { VersionActionTypes } from '~~/lib/projects/helpers/components'
import { reduce } from 'lodash-es'

type SingleVersion = NonNullable<Get<typeof versions.value, 'items[0]'>>

graphql(`
  fragment ProjectModelPageVersionsProject on Project {
    id
    role
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
  }
`)

const props = defineProps<{
  project: ProjectModelPageVersionsProjectFragment
}>()

// we're not using versions off props, cause 'versions' should already have those
// from the cache (no extraneous queries should be invoked)
const { versions, loadMore, moreToLoad } = useModelVersions({
  projectId: computed(() => props.project.id),
  modelId: computed(() => props.project.model?.id || '')
})
const { activeUser } = useActiveUser()

const items = computed(() => versions.value?.items)
const itemsSelectedState = ref({} as Record<string, boolean>)
const dialogState = ref(
  null as Nullable<{
    type: VersionActionTypes
    items: SingleVersion[]
    closed?: boolean
  }>
)

const selectedItems = computed({
  get: () => (items.value || []).filter((i) => !!itemsSelectedState.value[i.id]),
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

  for (const item of items.value || []) {
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
  get: () => !!moveToDialogVersions.value?.length && !dialogState.value?.closed,
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
    console.error(e)
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
</script>
