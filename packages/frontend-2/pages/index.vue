<template>
  <div>
    <Portal to="navigation">
      <HeaderNavLink :to="homeRoute" name="Dashboard" hide-chevron :separator="false" />
    </Portal>
    <PromoBannersWrapper v-if="promoBanners.length" :banners="promoBanners" />
    <div class="flex flex-col gap-y-12">
      <section>
        <h2 class="text-heading-sm text-foreground-2">Quickstart</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-5">
          <QuickStartCard
            v-for="quickStartItem in quickStartItems"
            :key="quickStartItem.title"
            :title="quickStartItem.title"
            :description="quickStartItem.description"
            :buttons="quickStartItem.buttons"
          />
        </div>
      </section>
      <section>
        <h2 class="text-heading-sm text-foreground-2">Recently updated projects</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 pt-5">
          <template v-if="hasProjects">
            <DashboardProjectCard
              v-for="project in projects"
              :key="project.id"
              :project="project"
            />
          </template>
          <QuickStartCard
            v-else
            title="Create your first project"
            description="Projects are the place where your models and their versions live."
            :buttons="createProjectButton"
          />
        </div>
      </section>
      <section>
        <h2 class="text-heading-sm text-foreground-2">News &amp; tutorials</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-5">
          <DashboardTutorialCard
            v-for="tutorial in tutorials"
            :key="tutorial.id"
            :tutorial="tutorial"
          />
        </div>
      </section>
    </div>
  </div>
</template>
<script setup lang="ts">
import { dashboardProjectsPageQuery } from '~~/lib/dashboard/graphql/queries'
import type { QuickStartItem } from '~~/lib/dashboard/helpers/types'
import { getResizedGhostImage } from '~~/lib/dashboard/helpers/utils'
import { useQuery } from '@vue/apollo-composable'
import { useMixpanel } from '~~/lib/core/composables/mp'
import GhostContentAPI from '@tryghost/content-api'
import { docsPageUrl, forumPageUrl, homeRoute } from '~~/lib/common/helpers/route'
import type { ManagerExtension } from '~~/lib/common/utils/downloadManager'
import { downloadManager } from '~~/lib/common/utils/downloadManager'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import type { PromoBanner } from '~/lib/promo-banners/types'
import type { LayoutDialogButton } from '@speckle/ui-components'

useHead({ title: 'Dashboard' })

definePageMeta({
  middleware: ['homepage'],
  alias: ['/profile', '/dashboard']
})

const config = useRuntimeConfig()
const mixpanel = useMixpanel()
const { result: projectsResult } = useQuery(dashboardProjectsPageQuery)
const { triggerNotification } = useGlobalToast()
const { data: tutorials } = await useLazyAsyncData('tutorials', fetchTutorials, {
  server: false
})
const { isGuest } = useActiveUser()

const openNewProject = ref(false)

const ghostContentApi = new GhostContentAPI({
  url: 'https://speckle.systems',
  key: config.public.ghostApiKey,
  version: 'v5.0'
})

const quickStartItems = shallowRef<QuickStartItem[]>([
  {
    title: 'Install Speckle manager',
    description: 'Use our Manager to install and manage Connectors with ease.',
    buttons: [
      {
        text: 'Download for Windows',
        onClick: () => onDownloadManager('exe')
      },
      {
        text: 'Download for Mac',
        onClick: () => onDownloadManager('dmg')
      }
    ]
  },
  {
    title: "Don't know where to start?",
    description: "We'll walk you through some of most common usage scenarios.",
    buttons: [
      {
        text: 'Open documentation',
        props: { to: docsPageUrl }
      }
    ]
  },
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

async function fetchTutorials() {
  const posts = await ghostContentApi.posts.browse({
    limit: 8,
    filter: 'visibility:public'
  })

  return posts
    .filter((post) => post.url)
    .map((post) => ({
      id: post.id,
      readingTime: post.reading_time,
      publishedAt: post.published_at,
      url: post.url,
      title: post.title,
      featureImage: getResizedGhostImage({ url: post.feature_image, width: 600 })
    }))
}

const onDownloadManager = (extension: ManagerExtension) => {
  try {
    downloadManager(extension)

    mixpanel.track('Manager Download', {
      os: extension === 'exe' ? 'win' : 'mac'
    })
  } catch {
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Download failed'
    })
  }
}

const promoBanners = ref<PromoBanner[]>([
  {
    id: 'speckleverse',
    primaryText: 'Join our online hackathon!',
    secondaryText: 'June 7 - 9, 2024',
    url: 'https://beyond-the-speckleverse.devpost.com/',
    priority: 1,
    expiryDate: '2024-06-10'
  }
])
</script>
