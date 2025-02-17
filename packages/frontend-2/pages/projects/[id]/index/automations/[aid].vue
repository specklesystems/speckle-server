<template>
  <div v-if="automation && project" class="flex flex-col gap-8 items-start">
    <ProjectPageAutomationHeader
      :automation="automation"
      :project="project"
      :is-editable="isEditable"
    />

    <div class="grid grid-cols-1 xl:grid-cols-4 gap-6 w-full">
      <div
        class="col-span-1 grid gap-6 mb-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-1"
      >
        <ProjectPageAutomationFunctions
          :automation="automation"
          :workspace-id="workspaceId"
          :project-id="projectId"
          :is-editable="isEditable"
        />
        <ProjectPageAutomationModels :automation="automation" :project="project" />
      </div>
      <ProjectPageAutomationRuns
        class="col-span-1 xl:col-span-3"
        :project-id="projectId"
        :automation="automation"
        :is-editable="isEditable"
      />
    </div>
  </div>
  <CommonLoadingBar v-else-if="loading" loading />
  <div v-else />
</template>
<script setup lang="ts">
import { Roles } from '@speckle/shared'
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
    workspaceId
    ...ProjectPageAutomationHeader_Project
  }
`)

const pageFetchPolicy = usePageQueryStandardFetchPolicy()
const route = useRoute()
const projectId = computed(() => route.params.id as string)
const automationId = computed(() => route.params.aid as string)

const { result, loading } = useQuery(
  projectAutomationPageQuery,
  () => ({
    projectId: projectId.value,
    automationId: automationId.value
  }),
  () => ({
    fetchPolicy: pageFetchPolicy.value
  })
)
const automation = computed(() => result.value?.project.automation || null)
const project = computed(() => result.value?.project)
const workspaceId = computed(() => project.value?.workspaceId ?? undefined)
const isEditable = computed(() => {
  const allowedRoles: string[] = [Roles.Stream.Owner]
  return allowedRoles.includes(result.value?.project.role ?? '')
})
</script>
