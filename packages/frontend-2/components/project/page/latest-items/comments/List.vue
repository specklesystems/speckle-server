<template>
  <div class="flex flex-col w-full space-y-4">
    <ProjectPageLatestItemsCommentsListItem
      v-for="item in items"
      :key="item.id"
      :project-id="projectId"
      :thread="item"
    />
  </div>
</template>
<script setup lang="ts">
import type { ProjectLatestCommentThreadsQuery } from '~~/lib/common/generated/gql/graphql'

const props = defineProps<{
  threads?: ProjectLatestCommentThreadsQuery
  disablePagination?: boolean
}>()

const items = computed(() =>
  (props.threads?.project?.commentThreads?.items || []).slice(
    0,
    props.disablePagination ? 8 : undefined
  )
)
const projectId = computed(() => props.threads?.project?.id as string)
</script>
