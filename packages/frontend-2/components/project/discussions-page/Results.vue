<template>
  <div>
    <template v-if="hasItems">
      <ProjectPageLatestItemsCommentsGrid
        v-if="gridOrList === GridListToggleValue.Grid"
        :threads="extraPagesResult"
      />
      <ProjectPageLatestItemsCommentsList v-else :threads="extraPagesResult" />
      <InfiniteLoading @infinite="infiniteLoad" />
    </template>
    <div v-else>TODO: No threads</div>
  </div>
</template>
<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import { graphql } from '~~/lib/common/generated/gql'
import { ProjectDiscussionsPageResults_ProjectFragment } from '~~/lib/common/generated/gql/graphql'
import { InfiniteLoaderState } from '~~/lib/global/helpers/components'
import { GridListToggleValue } from '~~/lib/layout/helpers/components'
import { latestCommentThreadsQuery } from '~~/lib/projects/graphql/queries'

graphql(`
  fragment ProjectDiscussionsPageResults_Project on Project {
    id
    commentThreads(cursor: null, limit: 8) {
      totalCount
      cursor
      items {
        ...ProjectPageLatestItemsCommentItem
      }
    }
  }
`)

const props = defineProps<{
  project: ProjectDiscussionsPageResults_ProjectFragment
  gridOrList: GridListToggleValue
}>()

const { result: extraPagesResult, fetchMore: fetchMorePages } = useQuery(
  latestCommentThreadsQuery,
  () => ({
    projectId: props.project.id
  })
)

const hasItems = computed(
  () => !!(extraPagesResult.value?.project?.commentThreads.items || []).length
)

const moreToLoad = computed(
  () =>
    !extraPagesResult.value?.project ||
    extraPagesResult.value.project.commentThreads.items.length <
      extraPagesResult.value.project.commentThreads.totalCount
)

const infiniteLoad = async (state: InfiniteLoaderState) => {
  const cursor =
    extraPagesResult.value?.project?.commentThreads.cursor ||
    props.project.commentThreads.cursor ||
    null
  if (!moreToLoad.value || !cursor) return state.complete()

  try {
    await fetchMorePages({
      variables: {
        cursor
      }
    })
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
</script>
