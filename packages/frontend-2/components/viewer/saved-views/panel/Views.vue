<template>
  <div v-if="isVeryFirstLoading" class="flex justify-center">
    <CommonLoadingIcon class="m-16" />
  </div>
  <div v-else>
    <ViewerSavedViewsPanelViewsEmptyState v-if="!hasGroups" :type="emptyStateType" />
    <template v-else>
      <ViewerSavedViewsPanelViewsGroup
        v-for="group in result?.project.savedViewGroups.items || []"
        :key="group.id"
      />
    </template>
  </div>
</template>
<script setup lang="ts">
import { omit } from 'lodash-es'
import { usePaginatedQuery } from '~/lib/common/composables/graphql'
import { graphql } from '~/lib/common/generated/gql'
import { useInjectedViewerState } from '~/lib/viewer/composables/setup'
import type { ViewsType } from '~/lib/viewer/helpers/savedViews'

/**
 * LOADING MECHANISM:
 * - Instead of adding to main resources query, lets load it separately only when panel is opened
 * - The actual core necessary data for view to actually load can be added to main query
 * - Also group views could also load separately only upon open. Or load small 1st page and load more on open
 */

graphql(`
  fragment ViewerSavedViewsPanelViews_Project on Project {
    id
    savedViewGroups(input: $savedViewGroupsInput) {
      totalCount
      cursor
      items {
        id
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
      ...ViewerSavedViewsPanelViews_Project
    }
  }
`)

defineProps<{
  viewsType: ViewsType
}>()

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
      limit: 10,
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
</script>
