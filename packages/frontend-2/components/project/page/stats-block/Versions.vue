<template>
  <ProjectPageStatsBlock>
    <template #top>
      <div class="flex flex-col sm:flex-row gap-x-1.5 sm:items-center">
        <ArrowPathRoundedSquareIcon class="h-5 w-5" />
        <span class="text-xs sm:text-sm">Versions</span>
      </div>
    </template>
    <template #bottom>
      <span v-if="project.versionCount.totalCount" class="h2 font-bold">
        {{ project.versionCount.totalCount }}
      </span>
      <span v-else class="h2 font-bold text-slate-400 dark:text-neutral-700">0</span>
    </template>
  </ProjectPageStatsBlock>
</template>
<script setup lang="ts">
import { ArrowPathRoundedSquareIcon } from '@heroicons/vue/24/outline'
import { graphql } from '~~/lib/common/generated/gql'
import type { ProjectPageStatsBlockVersionsFragment } from '~~/lib/common/generated/gql/graphql'

graphql(`
  fragment ProjectPageStatsBlockVersions on Project {
    versionCount: versions(limit: 0) {
      totalCount
    }
  }
`)

defineProps<{
  project: ProjectPageStatsBlockVersionsFragment
}>()
</script>
