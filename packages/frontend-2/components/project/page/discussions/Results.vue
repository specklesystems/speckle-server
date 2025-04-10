<template>
  <div>
    <template v-if="hasItems">
      <ProjectPageLatestItemsCommentsGrid :threads="result" />
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
import { latestCommentThreadsQuery } from '~~/lib/projects/graphql/queries'
import { usePaginatedQuery } from '~/lib/common/composables/graphql'
import type { Nullable } from '@speckle/shared'

graphql(`
  fragment ProjectDiscussionsPageResults_Project on Project {
    id
  }
`)

const props = defineProps<{
  project: ProjectDiscussionsPageResults_ProjectFragment
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
    filter: { includeArchived: !!props.includeArchived },
    cursor: null as Nullable<string>
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
