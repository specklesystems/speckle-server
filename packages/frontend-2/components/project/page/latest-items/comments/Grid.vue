<template>
  <div class="grid grid-cols-12 gap-8">
    <ProjectPageLatestItemsCommentsGridItem
      v-for="item in items"
      :key="item.id"
      class="col-span-6"
      :thread="item"
    />
  </div>
</template>
<script setup lang="ts">
import { ProjectLatestCommentThreadsQuery } from '~~/lib/common/generated/gql/graphql'

const props = defineProps<{
  threads?: ProjectLatestCommentThreadsQuery
}>()

const items = computed(() =>
  (props.threads?.project?.commentThreads?.items || []).slice(0, 6)
)
</script>
