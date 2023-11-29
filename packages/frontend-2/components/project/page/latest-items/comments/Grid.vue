<template>
  <div class="grid grid-cols-4 gap-4">
    <template v-if="projectId">
      <ProjectPageLatestItemsCommentsGridItem
        v-for="item in items"
        :key="item.id"
        class="col-span-4 md:col-span-2 lg:col-span-1"
        :thread="item"
        :project-id="projectId"
      />
    </template>
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
const projectId = computed(() => props.threads?.project?.id)
</script>
