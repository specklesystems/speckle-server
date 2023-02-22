<template>
  <ProjectPageStatsBlock>
    <template #top>
      <div class="flex space-x-1.5 items-center">
        <ArrowPathRoundedSquareIcon class="h-5 w-5" />
        <span class="text-xs">Versions</span>
      </div>
    </template>
    <template #bottom>
      <span v-if="project.versionCount" class="h2 font-bold">
        {{ project.versionCount }}
      </span>
      <span v-else class="h2 font-bold text-slate-400 dark:text-neutral-700">0</span>
    </template>
  </ProjectPageStatsBlock>
</template>
<script setup lang="ts">
import { ArrowPathRoundedSquareIcon } from '@heroicons/vue/24/solid'
import { graphql } from '~~/lib/common/generated/gql'
import { ProjectPageStatsBlockVersionsFragment } from '~~/lib/common/generated/gql/graphql'

graphql(`
  fragment ProjectPageStatsBlockVersions on Project {
    versionCount
  }
`)

defineProps<{
  project: ProjectPageStatsBlockVersionsFragment
}>()
</script>
