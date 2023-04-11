<template>
  <ProjectPageLatestItems
    :count="project.commentThreadCount.totalCount"
    :hide-filters="showCommentsIntro"
    :see-all-url="projectDiscussionsRoute(project.id)"
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
import { ProjectPageLatestItemsCommentsFragment } from '~~/lib/common/generated/gql/graphql'
import { GridListToggleValue } from '~~/lib/layout/helpers/components'
import { useQuery } from '@vue/apollo-composable'
import { latestCommentThreadsQuery } from '~~/lib/projects/graphql/queries'
import { projectDiscussionsRoute } from '~~/lib/common/helpers/route'

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
  project: ProjectPageLatestItemsCommentsFragment
}>()

const { result: latestCommentsResult } = useQuery(latestCommentThreadsQuery, () => ({
  projectId: props.project?.id
}))

const showCommentsIntro = computed(
  () => props.project.commentThreadCount.totalCount < 1
)
</script>
