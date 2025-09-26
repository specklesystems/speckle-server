<template>
  <div class="mb-1.5">
    <div v-if="isVeryFirstLoading" class="flex justify-center">
      <CommonLoadingIcon class="m-4" />
    </div>
    <div v-else>
      <template v-if="views.length">
        <div
          v-if="views.length"
          class="flex flex-col gap-[1px] overflow-y-auto overflow-x-hidden simple-scrollbar"
        >
          <ViewerSavedViewsPanelView
            v-for="view in views"
            :key="view.id"
            :view="view"
          ></ViewerSavedViewsPanelView>
        </div>
        <InfiniteLoading
          v-if="views.length"
          :settings="{ identifier }"
          hide-when-complete
          @infinite="onInfiniteLoad"
        />
      </template>
      <template v-else>
        <span
          class="flex justify-center items-center bg-foundation-page text-body-2xs rounded-md text-foreground-2 border border-dashed border-outline-2 text-center my-2 mx-1.5 px-4 h-10"
        >
          No views in group
        </span>
      </template>
    </div>
  </div>
</template>
<script setup lang="ts">
import { omit } from 'lodash-es'
import { usePaginatedQuery } from '~/lib/common/composables/graphql'
import { graphql } from '~/lib/common/generated/gql'
import type { ViewerSavedViewsPanelViewsGroupInner_SavedViewGroupFragment } from '~/lib/common/generated/gql/graphql'
import { useInjectedViewerState } from '~/lib/viewer/composables/setup'
import { viewsTypeToFilters, type ViewsType } from '~/lib/viewer/helpers/savedViews'

graphql(`
  fragment ViewerSavedViewsPanelViewsGroupInner_SavedViewGroup on SavedViewGroup {
    id
    title
  }
`)

graphql(`
  fragment ViewerSavedViewsPanelViewsGroupInner_SavedViewGroup_Paginated on SavedViewGroup {
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
  query ViewerSavedViewsPanelViewsGroupInner_Views(
    $projectId: String!
    $groupId: ID!
    $savedViewsInput: SavedViewGroupViewsInput!
  ) {
    project(id: $projectId) {
      id
      savedViewGroup(id: $groupId) {
        id
        ...ViewerSavedViewsPanelViewsGroupInner_SavedViewGroup_Paginated
      }
    }
  }
`)

const emit = defineEmits<{
  'view-count-updated': [count: number]
}>()

const props = defineProps<{
  group: ViewerSavedViewsPanelViewsGroupInner_SavedViewGroupFragment
  viewsType: ViewsType
  search?: string
}>()

const { projectId } = useInjectedViewerState()

const {
  identifier,
  onInfiniteLoad,
  query: { result },
  isVeryFirstLoading
} = usePaginatedQuery({
  query: viewsQuery,
  baseVariables: computed(() => ({
    projectId: projectId.value,
    groupId: props.group.id,
    savedViewsInput: {
      limit: 10,
      cursor: null as null | string,
      search: props.search?.trim() || null,
      ...viewsTypeToFilters(props.viewsType)
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

watch(
  () => views.value.length,
  (newVal, oldVal) => {
    if (newVal === oldVal) return
    emit('view-count-updated', newVal)
  },
  { immediate: true }
)
</script>
