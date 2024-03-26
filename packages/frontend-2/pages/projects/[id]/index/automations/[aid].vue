<template>
  <div v-if="automation" class="flex flex-col gap-8 items-start">
    <ProjectPageAutomationHeader :automation="automation" :project-id="projectId" />
  </div>
  <CommonLoadingBar v-else-if="loading" loading />
  <div v-else />
</template>
<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import { graphql } from '~/lib/common/generated/gql'
import { projectAutomationPageQuery } from '~/lib/projects/graphql/queries'

// TODO: 404 middleware

graphql(`
  fragment ProjectPageAutomationPage_Automation on Automation {
    id
    ...ProjectPageAutomationHeader_Automation
  }
`)

const route = useRoute()
const projectId = computed(() => route.params.id as string)
const automationId = computed(() => route.params.aid as string)

const { result, loading } = useQuery(projectAutomationPageQuery, () => ({
  projectId: projectId.value,
  automationId: automationId.value
}))
const automation = computed(() => result.value?.project.automation || null)
</script>
