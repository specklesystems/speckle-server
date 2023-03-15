<template>
  <ProjectPageStatsBlock>
    <template #top>
      <div class="flex space-x-1.5 items-center">
        <CubeIcon class="h-5 w-5" />
        <span class="text-sm">Models</span>
      </div>
    </template>
    <template #bottom>
      <span v-if="project.modelCount.totalCount" class="h2 font-bold">
        {{ project.modelCount.totalCount }}
      </span>
      <span v-else class="h2 font-bold text-slate-400 dark:text-neutral-700">0</span>
    </template>
  </ProjectPageStatsBlock>
</template>
<script setup lang="ts">
import { CubeIcon } from '@heroicons/vue/24/solid'
import { graphql } from '~~/lib/common/generated/gql'
import { ProjectPageStatsBlockModelsFragment } from '~~/lib/common/generated/gql/graphql'

graphql(`
  fragment ProjectPageStatsBlockModels on Project {
    modelCount: models(limit: 0) {
      totalCount
    }
  }
`)

defineProps<{
  project: ProjectPageStatsBlockModelsFragment
}>()
</script>
