<template>
  <div v-if="automation && project" class="flex flex-col gap-8 items-start">
    <ProjectPageAutomationHeader :automation="automation" :project="project" />

    <div class="lg:grid xl:grid-cols-4 gap-6 w-full">
      <div
        class="grid gap-6 mb-6 md:grid-cols-2 lg:grid-cols-3 xl:flex xl:flex-col xl:col-span-1"
      >
        <ProjectPageAutomationFunctions
          :automation="automation"
          :project-id="projectId"
        />
        <ProjectPageAutomationModels :automation="automation" :project="project" />
      </div>
      <ProjectPageAutomationRuns
        class="xl:col-span-3"
        :project-id="projectId"
        :automation="automation"
      />
    </div>
  </div>
  <CommonLoadingBar v-else-if="loading" loading />
  <div v-else />
</template>
<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import { graphql } from '~/lib/common/generated/gql'
import { projectAutomationPageQuery } from '~/lib/projects/graphql/queries'

graphql(`
  fragment ProjectPageAutomationPage_Automation on Automation {
    id
    ...ProjectPageAutomationHeader_Automation
    ...ProjectPageAutomationFunctions_Automation
    ...ProjectPageAutomationRuns_Automation
  }
`)

graphql(`
  fragment ProjectPageAutomationPage_Project on Project {
    id
    ...ProjectPageAutomationHeader_Project
  }
`)

definePageMeta({
  middleware: ['require-valid-automation']
})

const route = useRoute()
const projectId = computed(() => route.params.id as string)
const automationId = computed(() => route.params.aid as string)

const { result, loading } = useQuery(projectAutomationPageQuery, () => ({
  projectId: projectId.value,
  automationId: automationId.value
}))
const automation = computed(() => result.value?.project.automation || null)
const project = computed(() => result.value?.project)
</script>
