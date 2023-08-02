<template>
  <div>
    <template v-if="hasItems">
      <ProjectPageLatestItemsCommentsGrid
        v-if="gridOrList === GridListToggleValue.Grid"
        :threads="extraPagesResult"
      />
      <ProjectPageLatestItemsCommentsList v-else :threads="extraPagesResult" />
      <InfiniteLoading
        :settings="{ identifier: infiniteLoaderId }"
        @infinite="infiniteLoad"
      />
    </template>
    <div v-else class="mt-20">
      <ProjectPageLatestItemsCommentsIntroCard />
    </div>
  </div>
</template>
<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import { graphql } from '~~/lib/common/generated/gql'
import {
  ProjectCommentsFilter,
  ProjectDiscussionsPageResults_ProjectFragment
} from '~~/lib/common/generated/gql/graphql'
import { InfiniteLoaderState } from '~~/lib/global/helpers/components'
import { GridListToggleValue } from '~~/lib/layout/helpers/components'
import { latestCommentThreadsQuery } from '~~/lib/projects/graphql/queries'

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

const logger = useLogger()

const queryFilterVariables = computed(
  (): ProjectCommentsFilter => ({
    includeArchived: !!props.includeArchived
  })
)

const infiniteLoaderId = ref('')
const {
  result: extraPagesResult,
  fetchMore: fetchMorePages,
  variables: resultVariables,
  onResult
} = useQuery(latestCommentThreadsQuery, () => ({
  projectId: props.project.id,
  filter: queryFilterVariables.value
}))

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
  const cursor = extraPagesResult.value?.project?.commentThreads.cursor || null
  if (!moreToLoad.value || !cursor) return state.complete()

  try {
    await fetchMorePages({
      variables: {
        cursor
      }
    })
  } catch (e) {
    logger.error(e)
    state.error()
    return
  }

  state.loaded()
  if (!moreToLoad.value) {
    state.complete()
  }
}

const calculateLoaderId = () => {
  infiniteLoaderId.value = JSON.stringify(resultVariables.value?.filter || {})
}

onResult(calculateLoaderId)
</script>
