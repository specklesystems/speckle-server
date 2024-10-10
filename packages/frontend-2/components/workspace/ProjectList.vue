<template>
  <div>
    <div v-if="workspaceInvite" class="flex justify-center">
      <WorkspaceInviteBlock :invite="workspaceInvite" />
    </div>
    <template v-else>
      <Portal v-if="workspace?.name" to="navigation">
        <HeaderNavLink
          :to="workspaceRoute(workspaceSlug)"
          :name="workspace?.name"
          :separator="false"
        />
      </Portal>
      <WorkspaceHeader
        v-if="workspace"
        :icon="Squares2X2Icon"
        :workspace-info="workspace"
        @show-invite-dialog="showInviteDialog = true"
        @show-settings-dialog="onShowSettingsDialog"
        @show-move-projects-dialog="showMoveProjectsDialog = true"
      />
      <div class="flex flex-col gap-4 mt-4">
        <div class="flex flex-row gap-2 sm:items-center justify-between">
          <FormTextInput
            name="modelsearch"
            :show-label="false"
            placeholder="Search..."
            :custom-icon="MagnifyingGlassIcon"
            color="foundation"
            wrapper-classes="grow md:grow-0 md:w-60"
            show-clear
            v-bind="bind"
            v-on="on"
          />
          <FormButton v-if="!isWorkspaceGuest" @click="openNewProject = true">
            New project
          </FormButton>
        </div>
      </div>

      <CommonLoadingBar :loading="showLoadingBar" class="my-2" />

      <section
        v-if="showEmptyState"
        class="flex flex-col items-center justify-center py-8 md:py-16"
      >
        <h3 class="text-heading-lg text-foreground">
          Welcome to your new workspace. Let's set it up for a success...
        </h3>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-3 pt-5 mt-4 max-w-5xl">
          <CommonCard
            v-for="emptyStateItem in emptyStateItems"
            :key="emptyStateItem.title"
            :title="emptyStateItem.title"
            :description="emptyStateItem.description"
            :buttons="emptyStateItem.buttons"
          />
        </div>
      </section>

      <template v-else-if="projects?.items?.length">
        <ProjectsDashboardFilled :projects="projects" />
        <InfiniteLoading :settings="{ identifier }" @infinite="onInfiniteLoad" />
      </template>

      <CommonEmptySearchState v-else-if="!showLoadingBar" @clear-search="clearSearch" />

      <ProjectsAddDialog v-model:open="openNewProject" :workspace-id="workspace?.id" />

      <template v-if="workspace">
        <WorkspaceInviteDialog
          v-model:open="showInviteDialog"
          :workspace-id="workspace.id"
          :workspace="workspace"
        />
        <SettingsDialog
          v-model:open="showSettingsDialog"
          :target-menu-item="settingsDialogTarget"
          :target-workspace-id="workspace.id"
        />
        <WorkspaceMoveProjectsDialog
          v-model:open="showMoveProjectsDialog"
          :workspace="workspace"
        />
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { MagnifyingGlassIcon, Squares2X2Icon } from '@heroicons/vue/24/outline'
import { useQuery, useQueryLoading } from '@vue/apollo-composable'
import type { Optional, StreamRoles } from '@speckle/shared'
import {
  workspacePageQuery,
  workspaceProjectsQuery
} from '~~/lib/workspaces/graphql/queries'
import { useDebouncedTextInput } from '@speckle/ui-components'
import { usePaginatedQuery } from '~/lib/common/composables/graphql'
import { graphql } from '~~/lib/common/generated/gql'
import type { WorkspaceProjectsQueryQueryVariables } from '~~/lib/common/generated/gql/graphql'
import { workspaceRoute } from '~/lib/common/helpers/route'
import { Roles } from '@speckle/shared'
import { useWorkspacesMixpanel } from '~/lib/workspaces/composables/mixpanel'
import {
  SettingMenuKeys,
  type AvailableSettingsMenuKeys
} from '~/lib/settings/helpers/types'

graphql(`
  fragment WorkspaceProjectList_ProjectCollection on ProjectCollection {
    totalCount
    items {
      ...ProjectDashboardItem
    }
    cursor
  }
`)

const { workspaceMixpanelUpdateGroup } = useWorkspacesMixpanel()
const areQueriesLoading = useQueryLoading()
const route = useRoute()
const {
  on,
  bind,
  value: search
} = useDebouncedTextInput({
  debouncedBy: 800
})

const props = defineProps<{
  workspaceSlug: string
}>()

const showMoveProjectsDialog = ref(false)
const selectedRoles = ref(undefined as Optional<StreamRoles[]>)
const openNewProject = ref(false)
const showInviteDialog = ref(false)
const showSettingsDialog = ref(false)
const settingsDialogTarget = ref<AvailableSettingsMenuKeys>(
  SettingMenuKeys.Workspace.General
)

const token = computed(() => route.query.token as Optional<string>)

const pageFetchPolicy = usePageQueryStandardFetchPolicy()

const { result: initialQueryResult, onResult } = useQuery(
  workspacePageQuery,
  () => ({
    workspaceSlug: props.workspaceSlug,
    filter: {
      search: (search.value || '').trim() || null
    },
    token: token.value || null
  }),
  () => ({
    fetchPolicy: pageFetchPolicy.value
  })
)

const { query, identifier, onInfiniteLoad } = usePaginatedQuery({
  query: workspaceProjectsQuery,
  baseVariables: computed(() => ({
    workspaceSlug: props.workspaceSlug,
    filter: {
      search: (search.value || '').trim() || null
    }
  })),
  resolveKey: (vars: WorkspaceProjectsQueryQueryVariables) => ({
    workspaceSlug: vars.workspaceSlug,
    search: vars.filter?.search || ''
  }),
  resolveInitialResult: () => initialQueryResult.value?.workspaceBySlug.projects,
  resolveCurrentResult: (result) => result?.workspaceBySlug?.projects,
  resolveNextPageVariables: (baseVariables, newCursor) => ({
    ...baseVariables,
    cursor: newCursor
  }),
  resolveCursorFromVariables: (vars) => vars.cursor
})

const projects = computed(() => query.result.value?.workspaceBySlug?.projects)
const workspaceInvite = computed(() => initialQueryResult.value?.workspaceInvite)
const workspace = computed(() => initialQueryResult.value?.workspaceBySlug)
const isWorkspaceGuest = computed(() => workspace.value?.role === Roles.Workspace.Guest)
const showEmptyState = computed(() => {
  if (search.value) return false

  return projects.value && !projects.value?.items?.length
})

const showLoadingBar = computed(() => {
  const isLoading =
    areQueriesLoading.value || (!!search.value && !projects.value?.items?.length)

  return isLoading
})

const emptyStateItems = computed(() => [
  {
    title: 'Set up verified domains',
    description:
      'Manage your team and allow them to join your workspace automatically based on email domain policies.',
    buttons: [
      {
        text: 'Manage domains',
        onClick: () => onShowSettingsDialog(SettingMenuKeys.Workspace.Security),
        disabled: workspace.value?.role !== Roles.Workspace.Admin
      }
    ]
  },
  {
    title: 'Make it a space for your entire team',
    description:
      'Nothing great is made alone. Safely collaborate with your entire team and manage guests.',
    buttons: [
      {
        text: 'Invite members & guests',
        onClick: () => (showInviteDialog.value = true),
        disabled: isWorkspaceGuest.value
      }
    ]
  },
  {
    title: 'Add your first project',
    description:
      'Projects are the place where your models and their versions live. Add one and start creating.',
    buttons: [
      {
        text: 'New project',
        onClick: () => (openNewProject.value = true),
        disabled: isWorkspaceGuest.value
      }
    ]
  }
])

const clearSearch = () => {
  search.value = ''
  selectedRoles.value = []
}

const onShowSettingsDialog = (target: AvailableSettingsMenuKeys) => {
  showSettingsDialog.value = true
  settingsDialogTarget.value = target
}

onResult((queryResult) => {
  if (queryResult.data?.workspaceBySlug) {
    workspaceMixpanelUpdateGroup(queryResult.data.workspaceBySlug)
  }
})
</script>
