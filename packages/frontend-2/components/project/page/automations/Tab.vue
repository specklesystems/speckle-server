<template>
  <div>
    <ProjectPageAutomationsHeader :has-automations="hasAutomations" class="mb-8" />
    <ProjectPageAutomationsEmptyState v-if="!hasAutomations" :functions="result" />
  </div>
</template>
<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import { graphql } from '~/lib/common/generated/gql'

const automationsTabQuery = graphql(`
  query ProjectAutomationsTab($projectId: String!) {
    project(id: $projectId) {
      id
      automations {
        totalCount
      }
    }
    ...ProjectPageAutomationsEmptyState_Query
  }
`)

const route = useRoute()
const projectId = computed(() => route.params.id as string)
const { result } = useQuery(automationsTabQuery, () => ({ projectId: projectId.value }))

const hasAutomations = computed(
  () => (result.value?.project.automations.totalCount || 0) > 0
)
</script>
