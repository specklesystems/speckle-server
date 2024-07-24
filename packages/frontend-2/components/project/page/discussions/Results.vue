<template>
  <div>
    <template v-if="hasItems">
      <ProjectPageLatestItemsCommentsGrid
        v-if="gridOrList === GridListToggleValue.Grid"
        :threads="result"
      />
      <ProjectPageLatestItemsCommentsList v-else :threads="result" />
      <InfiniteLoading :settings="{ identifier }" @infinite="onInfiniteLoad" />
    </template>

    <div v-else class="mt-8">
      <ProjectPageLatestItemsCommentsEmptyState />
    </div>
  </div>
</template>
<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import type { ProjectDiscussionsPageResults_ProjectFragment } from '~~/lib/common/generated/gql/graphql'
import { GridListToggleValue } from '~~/lib/layout/helpers/components'
import { latestCommentThreadsQuery } from '~~/lib/projects/graphql/queries'
import { usePaginatedQuery } from '~/lib/common/composables/graphql'

graphql(`
  fragment ProjectDiscussionsPageResults_Project on Project {
    id
  }
`)

const props = defineProps<{
  project: ProjectDiscussionsPageResults_ProjectFragment
  gridOrList: GridListToggleValue
  includeArchived: boolean
}>()

const {
  identifier,
  onInfiniteLoad,
  query: { result }
} = usePaginatedQuery({
  query: latestCommentThreadsQuery,
  baseVariables: computed(() => ({
    projectId: props.project.id,
    filter: { includeArchived: !!props.includeArchived }
  })),
  resolveKey: (vars) => {
    return { projectId: vars.projectId, ...vars.filter }
  },
  resolveCurrentResult: (res) => res?.project.commentThreads,
  resolveNextPageVariables: (baseVars, cursor) => ({
    ...baseVars,
    cursor
  }),
  resolveCursorFromVariables: (vars) => vars.cursor
})

const hasItems = computed(
  () => !!(result.value?.project?.commentThreads.items || []).length
)
</script>
