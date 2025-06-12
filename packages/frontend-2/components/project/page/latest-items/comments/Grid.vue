<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    <template v-if="project">
      <ProjectPageLatestItemsCommentsGridItem
        v-for="item in items"
        :key="item.id"
        class="col-span-4 md:col-span-2 lg:col-span-1"
        :thread="item"
        :project-id="project.id"
        :project="project"
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
const project = computed(() => props.threads?.project)
</script>
