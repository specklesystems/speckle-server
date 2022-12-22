<template>
  <ProjectPageStatsBlock>
    <template #top>
      <div class="flex space-x-1.5 items-center">
        <ChatBubbleOvalLeftIcon class="h-5 w-5" />
        <span class="text-sm">Threads</span>
      </div>
    </template>
    <template #bottom>
      <span v-if="project.commentThreadCount" class="h2 font-bold">
        {{ project.commentThreadCount }}
      </span>
      <span v-else class="h2 font-bold text-slate-400 dark:text-neutral-700">0</span>
    </template>
  </ProjectPageStatsBlock>
</template>
<script setup lang="ts">
import { ChatBubbleOvalLeftIcon } from '@heroicons/vue/24/solid'
import { graphql } from '~~/lib/common/generated/gql'
import { ProjectPageStatsBlockCommentsFragment } from '~~/lib/common/generated/gql/graphql'

graphql(`
  fragment ProjectPageStatsBlockComments on Project {
    commentThreadCount
  }
`)

defineProps<{
  project: ProjectPageStatsBlockCommentsFragment
}>()
</script>
