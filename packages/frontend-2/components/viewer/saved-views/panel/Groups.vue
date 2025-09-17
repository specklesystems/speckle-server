<template>
  <div v-if="isVeryFirstLoading" class="flex justify-center">
    <CommonLoadingIcon class="m-16" />
  </div>
  <div v-else class="">
    <ViewerSavedViewsPanelViewsEmptyState
      v-if="!hasGroups || !project"
      :type="emptyStateType"
    />
    <div v-else class="p-1.5 pt-2">
      <ViewerSavedViewsPanelViewsGroup
        v-for="group in groups"
        :key="group.id"
        :views-type="viewsType"
        :group="group"
        :project="project"
        :search="search"
        :open="isGroupSelected(group)"
        :rename-mode="isGroupInRenameMode(group)"
        @update:open="(value) => onIsSelectedChange(value, group)"
        @update:rename-mode="(value) => (groupBeingRenamed = value ? group : undefined)"
        @delete-group="($event) => (groupBeingDeleted = $event)"
        @rename-group="($event) => (groupBeingRenamed = $event)"
      />
      <InfiniteLoading
        v-if="groups.length"
        :settings="{ identifier }"
        hide-when-complete
        @infinite="onInfiniteLoad"
      />
    </div>
    <ViewerSavedViewsPanelViewEditDialog
      v-model:open="showEditDialog"
      :view="viewBeingEdited"
    />
    <ViewerSavedViewsPanelViewMoveDialog
      v-model:open="showMoveDialog"
      :view="viewBeingMoved"
      @success="onMoveSuccess"
    />
    <ViewerSavedViewsPanelViewDeleteDialog
      v-model:open="showDeleteDialog"
      :view="viewBeingDeleted"
    />
    <ViewerSavedViewsPanelViewsGroupDeleteDialog
      v-model:open="showGroupDeleteDialog"
      :group="groupBeingDeleted"
    />
  </div>
</template>
<script setup lang="ts">
import { omit } from 'lodash-es'
import { usePaginatedQuery } from '~/lib/common/composables/graphql'
import { graphql } from '~/lib/common/generated/gql'
import type {
  UseUpdateSavedViewGroup_SavedViewGroupFragment,
  ViewerSavedViewsPanelViewDeleteDialog_SavedViewFragment,
  ViewerSavedViewsPanelViewEditDialog_SavedViewFragment,
  ViewerSavedViewsPanelViewMoveDialog_SavedViewFragment,
  ViewerSavedViewsPanelViewsGroup_SavedViewGroupFragment,
  ViewerSavedViewsPanelViewsGroupDeleteDialog_SavedViewGroupFragment
} from '~/lib/common/generated/gql/graphql'
import { useInjectedViewerState } from '~/lib/viewer/composables/setup'
import type { ViewsType } from '~/lib/viewer/helpers/savedViews'
import { viewsTypeToFilters } from '~/lib/viewer/helpers/savedViews'

graphql(`
  fragment ViewerSavedViewsPanelGroups_Project on Project {
    id
    savedViewGroups(input: $savedViewGroupsInput) {
      totalCount
      cursor
      items {
        id
        ...ViewerSavedViewsPanelViewsGroup_SavedViewGroup
      }
    }
    ...ViewerSavedViewsPanelViewsGroup_Project
  }
`)

const paginableGroupsQuery = graphql(`
  query ViewerSavedViewsPanelGroups_SavedViewGroups(
    $projectId: String!
    $savedViewGroupsInput: SavedViewGroupsInput!
  ) {
    project(id: $projectId) {
      id
      ...ViewerSavedViewsPanelGroups_Project
    }
  }
`)

const props = defineProps<{
  viewsType: ViewsType
  search?: string
}>()

const {
  projectId,
  resources: {
    request: { resourceIdString }
  },
  ui: {
    savedViews: { openedGroupState }
  }
} = useInjectedViewerState()
const eventBus = useEventBus()

const viewBeingEdited = ref<ViewerSavedViewsPanelViewEditDialog_SavedViewFragment>()
const viewBeingMoved = ref<ViewerSavedViewsPanelViewMoveDialog_SavedViewFragment>()
const viewBeingDeleted = ref<ViewerSavedViewsPanelViewDeleteDialog_SavedViewFragment>()
const groupBeingDeleted =
  ref<ViewerSavedViewsPanelViewsGroupDeleteDialog_SavedViewGroupFragment>()
const groupBeingRenamed = ref<UseUpdateSavedViewGroup_SavedViewGroupFragment>()

const {
  identifier,
  onInfiniteLoad,
  query: { result },
  isVeryFirstLoading
} = usePaginatedQuery({
  query: paginableGroupsQuery,
  baseVariables: computed(() => ({
    projectId: projectId.value,
    savedViewGroupsInput: {
      resourceIdString: resourceIdString.value,
      cursor: null as null | string,
      search: props.search?.trim() || null,
      ...viewsTypeToFilters(props.viewsType)
    }
  })),
  resolveKey: (vars) => ({
    projectId: vars.projectId,
    savedViewGroupsInput: omit(vars.savedViewGroupsInput, ['cursor'])
  }),
  resolveCurrentResult: (res) => res?.project.savedViewGroups,
  resolveNextPageVariables: (baseVars, cursor) => ({
    ...baseVars,
    savedViewGroupsInput: {
      ...baseVars.savedViewGroupsInput,
      cursor
    }
  }),
  resolveCursorFromVariables: (vars) => vars.savedViewGroupsInput.cursor
})

const hasGroups = computed(
  () => (result.value?.project.savedViewGroups.items.length || 0) > 0
)
const isSearch = computed(() => (props.search || '').trim().length > 0)
const emptyStateType = computed(() => (isSearch.value ? 'search' : 'base'))

const project = computed(() => result.value?.project)
const groups = computed(() => project.value?.savedViewGroups.items || [])

const showEditDialog = computed({
  get: () => !!viewBeingEdited.value,
  set: (value) => {
    if (!value) {
      viewBeingEdited.value = undefined
    }
  }
})

const showMoveDialog = computed({
  get: () => !!viewBeingMoved.value,
  set: (value) => {
    if (!value) {
      viewBeingMoved.value = undefined
    }
  }
})

const showDeleteDialog = computed({
  get: () => !!viewBeingDeleted.value,
  set: (value) => {
    if (!value) {
      viewBeingDeleted.value = undefined
    }
  }
})

const showGroupDeleteDialog = computed({
  get: () => !!groupBeingDeleted.value,
  set: (value) => {
    if (!value) {
      groupBeingDeleted.value = undefined
    }
  }
})

const isGroupInRenameMode = (
  group: ViewerSavedViewsPanelViewsGroup_SavedViewGroupFragment
) => {
  return group.id === groupBeingRenamed.value?.id
}

const isGroupSelected = (
  group: ViewerSavedViewsPanelViewsGroup_SavedViewGroupFragment
) => {
  return openedGroupState.value.get(group.id)
}

const onIsSelectedChange = (
  value: boolean | undefined,
  group: ViewerSavedViewsPanelViewsGroup_SavedViewGroupFragment
) => {
  if (value) {
    openedGroupState.value.set(group.id, true)
  } else {
    openedGroupState.value.delete(group.id)
  }
}

watch(
  groups,
  (newGroups) => {
    if (newGroups.length) {
      // first group should be selected
      const selectableGroupId = newGroups[0].id
      if (selectableGroupId) {
        openedGroupState.value.set(selectableGroupId, true)
      }
    }
  },
  { immediate: true }
)

eventBus.on(ViewerEventBusKeys.MarkSavedViewForEdit, ({ type, view }) => {
  if (type === 'edit') {
    viewBeingEdited.value = view
  } else if (type === 'move') {
    viewBeingMoved.value = view
  } else if (type === 'delete') {
    viewBeingDeleted.value = view
  }
})

const onMoveSuccess = (groupId: string) => {
  openedGroupState.value.set(groupId, true)
}
</script>
