<template>
  <LayoutDisclosure :title="group.title" lazy-load @update:open="open = $event">
    <div v-if="isVeryFirstLoading" class="flex justify-center">
      <CommonLoadingIcon class="m-4" />
    </div>
    <div v-else>
      <div v-if="views.length">
        <ViewerSavedViewsPanelView
          v-for="view in views"
          :key="view.id"
          :view="view"
        ></ViewerSavedViewsPanelView>
      </div>
      <div v-else>
        <!-- Blank state, could add a message or illustration here -->
      </div>
      <InfiniteLoading
        v-if="views.length"
        :settings="{ identifier }"
        hide-when-complete
        @infinite="onInfiniteLoad"
      />
    </div>
  </LayoutDisclosure>
</template>
<script setup lang="ts">
import { omit } from 'lodash-es'
import { usePaginatedQuery } from '~/lib/common/composables/graphql'
import { graphql } from '~/lib/common/generated/gql'
import type { ViewerSavedViewsPanelViewsGroup_SavedViewGroupFragment } from '~/lib/common/generated/gql/graphql'
import { useInjectedViewerState } from '~/lib/viewer/composables/setup'

graphql(`
  fragment ViewerSavedViewsPanelViewsGroup_SavedViewGroup on SavedViewGroup {
    id
    title
  }
`)

graphql(`
  fragment ViewerSavedViewsPanelViewsGroup_SavedViewGroup_Paginated on SavedViewGroup {
    id
    views(input: $savedViewsInput) {
      cursor
      totalCount
      items {
        id
        ...ViewerSavedViewsPanelView_SavedView
      }
    }
  }
`)

const viewsQuery = graphql(`
  query ViewerSavedViewsPanelViewsGroup_Views(
    $projectId: String!
    $groupId: ID!
    $savedViewsInput: SavedViewGroupViewsInput!
  ) {
    project(id: $projectId) {
      id
      savedViewGroup(id: $groupId) {
        id
        ...ViewerSavedViewsPanelViewsGroup_SavedViewGroup_Paginated
      }
    }
  }
`)

const props = defineProps<{
  group: ViewerSavedViewsPanelViewsGroup_SavedViewGroupFragment
  search?: string
  onlyAuthored?: boolean
}>()

const { projectId } = useInjectedViewerState()

const open = ref(false)

const {
  identifier,
  onInfiniteLoad,
  query: { result },
  isVeryFirstLoading
} = usePaginatedQuery({
  query: viewsQuery,
  options: {
    enabled: open
  },
  baseVariables: computed(() => ({
    projectId: projectId.value,
    groupId: props.group.id,
    savedViewsInput: {
      limit: 10,
      cursor: null as null | string,
      search: props.search?.trim() || null,
      onlyAuthored: props.onlyAuthored
    }
  })),
  resolveKey: (vars) => ({
    projectId: vars.projectId,
    groupId: vars.groupId,
    savedViewsInput: omit(vars.savedViewsInput, ['cursor'])
  }),
  resolveCurrentResult: (res) => res?.project.savedViewGroup.views,
  resolveNextPageVariables: (baseVars, cursor) => ({
    ...baseVars,
    savedViewsInput: {
      ...baseVars.savedViewsInput,
      cursor
    }
  }),
  resolveCursorFromVariables: (vars) => vars.savedViewsInput.cursor
})

const views = computed(() => result.value?.project.savedViewGroup.views.items || [])
</script>
