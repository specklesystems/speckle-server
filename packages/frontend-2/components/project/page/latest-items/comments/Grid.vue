<template>
  <div class="grid grid-cols-12 space-y-8 sm:space-y-0 sm:gap-8">
    <ProjectPageLatestItemsCommentsGridItem
      v-for="item in items"
      :key="item.id"
      :class="gridItemWidthClasses"
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

const gridItemWidthClasses = computed(() => 'col-span-12 md:col-span-6')
</script>
