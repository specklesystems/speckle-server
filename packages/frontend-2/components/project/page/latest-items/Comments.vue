<template>
  <ProjectPageLatestItems
    :count="project?.commentThreadCount.totalCount || 0"
    :hide-filters="showCommentsIntro"
    :see-all-url="projectDiscussionsRoute(projectId)"
    title="Discussions"
  >
    <template #default="{ gridOrList }">
      <template v-if="!showCommentsIntro">
        <ProjectPageLatestItemsCommentsGrid
          v-if="gridOrList === GridListToggleValue.Grid"
          :threads="latestCommentsResult"
          disable-pagination
        />
        <ProjectPageLatestItemsCommentsList
          v-else
          :threads="latestCommentsResult"
          disable-pagination
        />
      </template>
      <template v-else>
        <ProjectPageLatestItemsCommentsIntroCard />
      </template>
    </template>
  </ProjectPageLatestItems>
</template>
<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import type { ProjectPageLatestItemsCommentsFragment } from '~~/lib/common/generated/gql/graphql'
import { GridListToggleValue } from '~~/lib/layout/helpers/components'
import { useQuery } from '@vue/apollo-composable'
import { latestCommentThreadsQuery } from '~~/lib/projects/graphql/queries'
import { projectDiscussionsRoute } from '~~/lib/common/helpers/route'
import type { Optional } from '@speckle/shared'

graphql(`
  fragment ProjectPageLatestItemsComments on Project {
    id
    commentThreadCount: commentThreads(limit: 0) {
      totalCount
    }
  }
`)

graphql(`
  fragment ProjectPageLatestItemsCommentItem on Comment {
    id
    author {
      ...FormUsersSelectItem
    }
    screenshot
    rawText
    createdAt
    updatedAt
    archived
    repliesCount: replies(limit: 0) {
      totalCount
    }
    replyAuthors(limit: 4) {
      totalCount
      items {
        ...FormUsersSelectItem
      }
    }
    ...LinkableComment
  }
`)

const props = defineProps<{
  projectId: string
  project: Optional<ProjectPageLatestItemsCommentsFragment>
}>()

const { result: latestCommentsResult } = useQuery(latestCommentThreadsQuery, () => ({
  projectId: props.projectId
}))

const showCommentsIntro = computed(() =>
  props.project ? props.project.commentThreadCount.totalCount < 1 : false
)
</script>
