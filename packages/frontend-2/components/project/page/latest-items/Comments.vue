<template>
  <ProjectPageLatestItems :count="project.commentThreadCount" title="Latest Threads">
    <template #default="{ gridOrList }">
      <ProjectPageLatestItemsCommentsGrid
        v-if="gridOrList === GridListToggleValue.Grid"
        :threads="latestCommentsResult"
      />
      <ProjectPageLatestItemsCommentsList v-else :threads="latestCommentsResult" />
    </template>
  </ProjectPageLatestItems>
</template>
<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import { ProjectPageLatestItemsCommentsFragment } from '~~/lib/common/generated/gql/graphql'
import { GridListToggleValue } from '~~/lib/layout/helpers/components'
import { useQuery } from '@vue/apollo-composable'
import { latestCommentThreadsQuery } from '~~/lib/projects/graphql/queries'

graphql(`
  fragment ProjectPageLatestItemsComments on Project {
    id
    commentThreadCount
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
    repliesCount
    replyAuthors(limit: 4) {
      totalCount
      items {
        ...FormUsersSelectItem
      }
    }
  }
`)

const props = defineProps<{
  project: ProjectPageLatestItemsCommentsFragment
}>()

const { result: latestCommentsResult } = useQuery(latestCommentThreadsQuery, () => ({
  projectId: props.project?.id
}))
</script>
