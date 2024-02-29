<template>
  <div>
    <template v-if="project">
      <div>
        <ProjectsInviteBanner
          :invite="invite"
          :show-stream-name="false"
          :auto-accept="shouldAutoAcceptInvite"
          @processed="onInviteAccepted"
        />
        <div class="flex flex-col sm:flex-row gap-6 justify-between mt-6 mb-8 sm:mb-12">
          <ProjectPageHeader :project="project" />
          <ProjectPageTeamBlock :project="project" @invite="inviteDialogOpen = true" />
        </div>
      </div>
      <ProjectPageInviteDialog v-model:open="inviteDialogOpen" :project="project" />
    </template>

    <LayoutPageTabs v-show="project" v-slot="{ activeItem }" :items="pageTabItems">
      <ProjectModelsTab
        v-if="activeItem.id === 'models'"
        :project="project"
        :project-id="projectId"
      />
      <ProjectDiscussionsTab
        v-if="activeItem.id === 'discussions'"
        :project="project"
        :project-id="projectId"
      />
      <ProjectPageSettingsTab
        v-if="project && activeItem.id === 'settings'"
        :project="project"
        @invite="inviteDialogOpen = true"
      />
    </LayoutPageTabs>
  </div>
</template>
<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import { graphql } from '~~/lib/common/generated/gql'
import { projectPageQuery } from '~~/lib/projects/graphql/queries'
import { useGeneralProjectPageUpdateTracking } from '~~/lib/projects/composables/projectPages'
import type { LayoutPageTabItem } from '@speckle/ui-components/dist/helpers/layout/components'
import { LayoutPageTabs } from '@speckle/ui-components'
import {
  CubeIcon,
  Cog6ToothIcon,
  BoltIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/vue/24/outline'
import type { Optional } from '@speckle/shared'

graphql(`
  fragment ProjectPageProject on Project {
    id
    createdAt
    ...ProjectPageProjectHeader
    ...ProjectPageStatsBlockTeam
    ...ProjectPageTeamDialog
    ...ProjectPageStatsBlockVersions
    ...ProjectPageStatsBlockModels
    ...ProjectPageStatsBlockComments
    ...ProjectPageLatestItemsModels
    ...ProjectPageLatestItemsComments
  }
`)

definePageMeta({
  middleware: ['require-valid-project']
})

const route = useRoute()
const router = useRouter()

const inviteDialogOpen = ref(false)

const projectId = computed(() => route.params.id as string)
const shouldAutoAcceptInvite = computed(() => route.query.accept === 'true')
const token = computed(() => route.query.token as Optional<string>)

useGeneralProjectPageUpdateTracking({ projectId }, { notifyOnProjectUpdate: true })
const { result: projectPageResult } = useQuery(
  projectPageQuery,
  () => ({
    id: projectId.value,
    token: token.value
  }),
  () => ({
    // Custom error policy so that a failing invitedTeam resolver (due to access rights)
    // doesn't kill the entire query
    errorPolicy: 'all',
    context: {
      skipLoggingErrors: (err) =>
        err.graphQLErrors?.length === 1 &&
        err.graphQLErrors.some((e) => !!e.path?.includes('invitedTeam'))
    }
  })
)

const project = computed(() => projectPageResult.value?.project)
const invite = computed(() => projectPageResult.value?.projectInvite || undefined)
const projectName = computed(() =>
  project.value?.name.length ? project.value.name : ''
)

useHead({
  title: projectName
})

const onInviteAccepted = async (params: { accepted: boolean }) => {
  if (params.accepted) {
    await router.replace({
      query: { ...route.query, accept: undefined, token: undefined }
    })
  }
}

const pageTabItems: LayoutPageTabItem[] = [
  {
    title: 'Models',
    id: 'models',
    icon: CubeIcon,
    count: project.value?.modelCount.totalCount
  },
  {
    title: 'Discussions',
    id: 'discussions',
    icon: ChatBubbleLeftRightIcon,
    count: project.value?.commentThreadCount.totalCount
  },
  {
    title: 'Automations',
    id: 'automations',
    icon: BoltIcon,
    tag: 'New'
  },
  { title: 'Settings', id: 'settings', icon: Cog6ToothIcon }
]
</script>
