<template>
  <ProjectPageLatestItems :count="project.commentThreadCount" title="Latest Threads">
    <template #default="{ gridOrList }">
      <ProjectPageLatestItemsCommentsGrid
        v-if="gridOrList === GridListToggleValue.Grid"
      />
      <ProjectPageLatestItemsCommentsList v-else />
    </template>
  </ProjectPageLatestItems>
</template>
<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import { ProjectPageLatestItemsCommentsFragment } from '~~/lib/common/generated/gql/graphql'
import { GridListToggleValue } from '~~/lib/layout/helpers/components'

graphql(`
  fragment ProjectPageLatestItemsComments on Project {
    commentThreadCount
  }
`)

defineProps<{
  project: ProjectPageLatestItemsCommentsFragment
}>()
</script>
