<template>
  <div>
    <Portal to="navigation">
      <HeaderNavLink :to="homeRoute" name="Dashboard" hide-chevron :separator="false" />
    </Portal>
    <PromoBannersWrapper
      v-if="promoBanners && promoBanners.length"
      :banners="promoBanners"
    />
    <ProjectsDashboardHeader
      :projects-invites="projectsResult?.activeUser || undefined"
      :workspaces-invites="workspacesResult?.activeUser || undefined"
    />
    <div class="flex flex-col gap-y-12">
      <div class="flex flex-col-reverse lg:flex-col gap-y-12">
        <section>
          <h2 class="text-heading-sm text-foreground-2">Quickstart</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-5">
            <CommonCard
              v-for="quickStartItem in quickStartItems"
              :key="quickStartItem.title"
              :title="quickStartItem.title"
              :description="quickStartItem.description"
              :buttons="quickStartItem.buttons"
              :is-external-route="quickStartItem.isExternalRoute"
            />
          </div>
          <div class="pt-5">
            <CommonCard title="Use cases and workflows">
              <!-- <h2 class="text-heading-sm text-foreground-2">
              Get started with these use cases
            </h2> -->
              <div
                class="grid md:grid-cols-2 md:gap-y-6 lg:grid-cols-4 gap-3 mt-4 lg:divide-x divide-outline-2 -ml-3"
              >
                <div
                  v-for="useCase in useCaseItems"
                  :key="useCase.title"
                  :title="useCase.title"
                  :description="useCase.description"
                  class="pl-4 flex flex-col justify-between"
                >
                  <div>
                    <p class="text-heading-sm text-foreground-2">{{ useCase.title }}</p>
                    <p class="text-body-xs text-foreground-2 py-2">
                      {{ useCase.description }}
                    </p>
                  </div>
                  <div class="">
                    <FormButton
                      :to="useCase.url"
                      target="_blank"
                      external
                      color="outline"
                      size="sm"
                    >
                      Open documentation
                    </FormButton>
                  </div>
                </div>
              </div>
            </CommonCard>
          </div>
        </section>
        <!-- <section>
          <h2 class="text-heading-sm text-foreground-2">Connectors</h2>

        </section> -->
        <section>
          <div class="flex items-center justify-between">
            <h2 class="text-heading-sm text-foreground-2">Recently updated projects</h2>
            <FormButton
              color="outline"
              size="sm"
              @click.stop="router.push(projectsRoute)"
            >
              View all
            </FormButton>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3 pt-5">
            <template v-if="hasProjects">
              <DashboardProjectCard
                v-for="project in projects"
                :key="project.id"
                :project="project"
              />
            </template>
            <CommonCard
              v-else
              title="Create your first project"
              description="Projects are the place where your models and their versions live."
              :buttons="createProjectButton"
            />
          </div>
        </section>
      </div>
      <section>
        <div class="flex items-center justify-between">
          <h2 class="text-heading-sm text-foreground-2">Tutorials</h2>
          <FormButton color="outline" size="sm" :to="tutorialsRoute">
            View more
          </FormButton>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-5">
          <TutorialsCard
            v-for="tutorialItem in tutorialItems.slice(0, 4)"
            :key="tutorialItem.title"
            :tutorial-item="tutorialItem"
            source="dashboard"
          />
        </div>
      </section>
    </div>

    <ProjectsAddDialog v-model:open="openNewProject" />
  </div>
</template>
<script setup lang="ts">
import {
  dashboardProjectsPageQuery,
  dashboardProjectsPageWorkspacesQuery
} from '~~/lib/dashboard/graphql/queries'
import type { QuickStartItem } from '~~/lib/dashboard/helpers/types'
import { useQuery } from '@vue/apollo-composable'
// import { useMixpanel } from '~~/lib/core/composables/mp'
import {
  forumPageUrl,
  homeRoute,
  connectorsRoute,
  projectsRoute,
  tutorialsRoute
} from '~~/lib/common/helpers/route'
// import type { ManagerExtension } from '~~/lib/common/utils/downloadManager'
// import { downloadManager } from '~~/lib/common/utils/downloadManager'
// import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import type { LayoutDialogButton } from '@speckle/ui-components'
import type { PromoBanner } from '~/lib/promo-banners/types'
import { tutorialItems } from '~/lib/dashboard/helpers/tutorials'
import { useUserProjectsUpdatedTracking } from '~~/lib/user/composables/projectUpdates'

// const mixpanel = useMixpanel()
const isWorkspacesEnabled = useIsWorkspacesEnabled()
const { result: projectsResult } = useQuery(dashboardProjectsPageQuery)
const { result: workspacesResult } = useQuery(
  dashboardProjectsPageWorkspacesQuery,
  undefined,
  () => ({
    enabled: isWorkspacesEnabled.value
  })
)
// const { triggerNotification } = useGlobalToast()
const { isGuest } = useActiveUser()
const router = useRouter()
useUserProjectsUpdatedTracking()

const promoBanners = ref<PromoBanner[]>()
const openNewProject = ref(false)

const useCaseItems = shallowRef([
  {
    title: 'Design Coordination',
    url: 'https://www.speckle.systems/use-cases/design-coordination',
    imgSrc:
      'https://cdn.prod.website-files.com/66c31b5a50432200dc753cc4/67c0302b6d2fda823c50d927_design%20coordination%20header%20image.png',
    description:
      'The smoothest design coordination for AEC! Ditch files. Share only what’s needed and catch changes instantly.'
  },
  {
    title: 'Business Intelligence',
    url: 'https://www.speckle.systems/use-cases/business-intelligence',
    imgSrc:
      'https://cdn.prod.website-files.com/66c31b5a50432200dc753cc4/67c822c3139c3aba5c8c3003_Header%20final%20BI.png',
    description:
      'Get from boring BIM data to insightful dashboards! Swap guesswork for informed decisions.'
  },
  {
    title: 'Online Collaboration',
    url: 'https://www.speckle.systems/use-cases/online-collaboration',
    imgSrc:
      'https://cdn.prod.website-files.com/66c31b5a50432200dc753cc4/67c574e6ef8841d296e989cc_viwer%20header.png',
    description:
      'View, share, and brainstorm on 3D models online! Share with anyone—no desktop apps, no licenses, no hassle.'
  },
  {
    title: 'Automation',
    url: 'https://www.speckle.systems/use-cases/automate',
    imgSrc:
      'https://cdn.prod.website-files.com/66c31b5a50432200dc753cc4/67c0302b6d2fda823c50d927_design%20coordination%20header%20image.png',
    description:
      'Goodbye, repetitive tasks! Kick into high gear with pre-built automations for your workflows.'
  }
])

const quickStartItems = shallowRef<QuickStartItem[]>([
  {
    title: 'Install Connectors',
    description:
      'Extract and exchange data in real time between the most popular AEC applications using our tailored connectors.',
    buttons: [
      {
        text: 'Install connectors',
        props: { to: connectorsRoute }
      }
    ],
    isExternalRoute: false
  },
  // {
  //   title: "Don't know where to start?",
  //   description: "We'll walk you through some of most common usage scenarios.",
  //   buttons: [
  //     {
  //       text: 'Open documentation',
  //       props: { to: docsPageUrl }
  //     }
  //   ]
  // },
  {
    title: 'Have a question you need answered?',
    description: 'Submit your question on the forum and get help from the community.',
    buttons: [
      {
        text: 'Ask a question',
        props: { to: forumPageUrl }
      }
    ]
  }
])

const createProjectButton = shallowRef<LayoutDialogButton[]>([
  {
    text: 'Create a project',
    props: { disabled: isGuest.value },
    onClick: () => (openNewProject.value = true)
  }
])

const projects = computed(() => projectsResult.value?.activeUser?.projects.items)
const hasProjects = computed(() => (projects.value ? projects.value.length > 0 : false))
</script>
