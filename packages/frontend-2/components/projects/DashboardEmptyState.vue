<template>
  <div class="empty-state w-full min-h-[100px] rounded-2xl py-20 xl:pt-28 xl:pb-40">
    <h2 class="block h4 font-normal leading-8 text-center mb-16">
      Welcome to Speckle. What would you like to do?
    </h2>
    <div
      class="flex flex-col space-y-7 items-center md:flex-row md:space-x-7 md:space-y-0 justify-center md:items-stretch px-8"
    >
      <ProjectsDashboardEmptyStatePanel
        :icon="CubeIcon"
        :button-icon="ArrowLeftCircleIcon"
        @click="createOnboardingProject"
      >
        <template #title>Explore your first project</template>
        <template #subtitle>
          Create your first Speckle project and learn the basics
        </template>
        <template #ctaText>Explore</template>
      </ProjectsDashboardEmptyStatePanel>
      <ProjectsDashboardEmptyStatePanel
        :icon="CloudArrowUpIcon"
        :button-icon="CloudArrowDownIcon"
        :to="downloadManagerRoute"
      >
        <template #title>Already have a 3D model?</template>
        <template #subtitle>
          Install connectors from Revit, Rhino, AutoCAD, Blender and many others!
        </template>
        <template #ctaText>Download manager</template>
      </ProjectsDashboardEmptyStatePanel>
    </div>
  </div>
</template>
<script setup lang="ts">
import {
  CubeIcon,
  CloudArrowUpIcon,
  CloudArrowDownIcon,
  ArrowLeftCircleIcon
} from '@heroicons/vue/24/solid'
import { useApolloClient } from '@vue/apollo-composable'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import { graphql } from '~~/lib/common/generated/gql'
import {
  convertThrowIntoFetchResult,
  getFirstErrorMessage,
  updateCacheByFilter
} from '~~/lib/common/helpers/graphql'
import { downloadManagerRoute, useNavigateToProject } from '~~/lib/common/helpers/route'
import { projectsDashboardQuery } from '~~/lib/projects/graphql/queries'

// TOOD: Make mutation return everything needed for project page
const createOnboardingProjectMutation = graphql(`
  mutation CreateOnboardingProject {
    projectMutations {
      createForOnboarding {
        ...ProjectPageProject
        ...ProjectDashboardItem
      }
    }
  }
`)

const apollo = useApolloClient().client
const { triggerNotification } = useGlobalToast()
const goToProject = useNavigateToProject()

const createOnboardingProject = async () => {
  const { data, errors } = await apollo
    .mutate({
      mutation: createOnboardingProjectMutation,
      update: (cache, { data }) => {
        if (!data?.projectMutations.createForOnboarding.id) return

        const newProjectData = data.projectMutations.createForOnboarding

        // Update User.projects
        updateCacheByFilter(
          cache,
          { query: { query: projectsDashboardQuery } },
          (cacheData) => {
            if (!cacheData.activeUser?.projects) return
            const newItems = [...cacheData.activeUser.projects.items, newProjectData]
            return {
              ...cacheData,
              activeUser: {
                ...cacheData.activeUser,
                projects: {
                  ...cacheData.activeUser.projects,
                  items: newItems,
                  totalCount: (cacheData.activeUser.projects.totalCount || 0) + 1
                }
              }
            }
          }
        )
      }
    })
    .catch(convertThrowIntoFetchResult)

  const newId = data?.projectMutations.createForOnboarding.id
  if (!newId) {
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Project creation failed',
      description: getFirstErrorMessage(errors)
    })
    return
  }

  triggerNotification({
    type: ToastNotificationType.Success,
    title: 'Project successfully created'
  })
  goToProject({ id: newId })
}
</script>
<style scoped>
.empty-state {
  /** dashed border, source: https://kovart.github.io/dashed-border-generator/ */
  background-image: url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='16' ry='16' stroke='rgb(59 130 246 / 50%)' stroke-width='2' stroke-dasharray='14' stroke-dashoffset='0' stroke-linecap='round'/%3e%3c/svg%3e");
}
</style>
