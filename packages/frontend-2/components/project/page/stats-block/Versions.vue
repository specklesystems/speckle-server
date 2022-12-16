<template>
  <ProjectPageStatsBlock>
    <template #top>
      <div class="flex space-x-1.5 items-center">
        <ArrowPathRoundedSquareIcon class="h-5 w-5" />
        <span class="label font-bold">Versions</span>
      </div>
    </template>
    <template #bottom>
      <span v-if="project.versionCount" class="h2 font-bold">
        {{ project.versionCount }}
      </span>
      <span v-else class="normal">There are no versions yet</span>
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
