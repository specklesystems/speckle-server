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
        :is-selected="group.id === selectedGroupId"
        :only-authored="viewsType === ViewsType.My"
      />
      <InfiniteLoading
        v-if="groups.length"
        :settings="{ identifier }"
        hide-when-complete
        @infinite="onInfiniteLoad"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import { omit } from 'lodash-es'
import { usePaginatedQuery } from '~/lib/common/composables/graphql'
import { graphql } from '~/lib/common/generated/gql'
import { useInjectedViewerState } from '~/lib/viewer/composables/setup'
import { ViewsType } from '~/lib/viewer/helpers/savedViews'

graphql(`
  fragment ViewerSavedViewsPanelViews_Project on Project {
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
  query ViewerSavedViewsPanelViews_Groups(
    $projectId: String!
    $savedViewGroupsInput: SavedViewGroupsInput!
  ) {
    project(id: $projectId) {
      id
      ...ViewerSavedViewsPanelViews_Project
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

const search = ref('')

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
      limit: 1,
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

watch(
  groups,
  (newGroups) => {
    if (newGroups.length && !selectedGroupId.value) {
      selectedGroupId.value = newGroups[0].id
    }
  },
  { immediate: true }
)
</script>
