<template>
  <ProjectPageStatsBlock>
    <template #top>
      <div class="flex space-x-1.5 items-center">
        <CubeIcon class="h-5 w-5" />
        <span class="label font-bold">Total Models</span>
      </div>
    </template>
    <template #bottom>
      <span v-if="project.modelCount" class="h2 font-bold">
        {{ project.modelCount }}
      </span>
      <span v-else class="normal">There are no models yet</span>
    </template>
  </ProjectPageStatsBlock>
</template>
<script setup lang="ts">
import { CubeIcon } from '@heroicons/vue/24/solid'
import { graphql } from '~~/lib/common/generated/gql'
import { ProjectPageStatsBlockModelsFragment } from '~~/lib/common/generated/gql/graphql'

graphql(`
  fragment ProjectPageStatsBlockModels on Project {
    modelCount
  }
`)

defineProps<{
  project: ProjectPageStatsBlockModelsFragment
}>()
</script>
