<template>
  <div v-if="isVeryFirstLoading" class="flex justify-center">
    <CommonLoadingIcon class="m-16" />
  </div>
  <div v-else>
    <ViewerSavedViewsPanelViewsEmptyState v-if="!hasGroups" :type="emptyStateType" />
    <div v-else class="p-2">
      <ViewerSavedViewsPanelViewsGroup
        v-for="group in groups"
        :key="group.id"
        :group="group"
        :is-selected="isGroupSelected(group)"
        :rename-mode="isGroupInRenameMode(group)"
        :only-authored="viewsType === ViewsType.My"
        @update:is-selected="(value) => (selectedGroupId = value ? group.id : null)"
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
import { ViewsType } from '~/lib/viewer/helpers/savedViews'

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

defineProps<{
  viewsType: ViewsType
}>()

const selectedGroupId = defineModel<string | null>('selectedGroupId', {
  required: true
})

const {
  projectId,
  resources: {
    request: { resourceIdString }
  }
} = useInjectedViewerState()
const eventBus = useEventBus()

const search = ref('')
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
      search: search.value?.trim() || null
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
const isSearch = computed(() => search.value?.trim().length > 0)
const emptyStateType = computed(() => (isSearch.value ? 'search' : 'base'))

const groups = computed(() => {
  return result.value?.project.savedViewGroups.items || []
})

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
  return group.id === selectedGroupId.value
}

watch(
  groups,
  (newGroups) => {
    if (newGroups.length && !selectedGroupId.value) {
      selectedGroupId.value = newGroups[0].id
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
  selectedGroupId.value = groupId
}
</script>
