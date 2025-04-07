<template>
  <div>
    <div v-if="project">
      <ProjectPageDiscussionsHeader
        v-model:include-archived="includeArchived"
        :project="project"
      />
      <ProjectPageDiscussionsResults
        :project="project"
        :include-archived="!!includeArchived"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import type { Optional } from '@speckle/shared'
import { projectDiscussionsPageQuery } from '~~/lib/projects/graphql/queries'

const includeArchived = ref(undefined as Optional<true>)

const route = useRoute()
const projectId = computed(() => route.params.id as string)
const { result } = useQuery(projectDiscussionsPageQuery, () => ({
  projectId: projectId.value
}))

const project = computed(() => result.value?.project)
</script>
