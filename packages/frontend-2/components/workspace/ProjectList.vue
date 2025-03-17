<template>
  <div>
    <Portal to="right-sidebar">
      <WorkspaceSidebar
        v-if="workspace"
        :workspace-info="workspace"
        @show-invite-dialog="showInviteDialog = true"
      />
    </Portal>
    <div v-if="workspaceInvite" class="flex justify-center">
      <WorkspaceInviteBlock :invite="workspaceInvite" />
    </div>
    <template v-else>
      <Portal v-if="workspace?.name" to="navigation">
        <HeaderNavLink
          :to="workspaceRoute(workspaceSlug)"
          :name="isWorkspaceNewPlansEnabled ? 'Home' : workspace?.name"
          :separator="false"
        />
      </Portal>
      <WorkspaceHeader
        v-if="workspace"
        :icon="Squares2X2Icon"
        :workspace-info="workspace"
        @show-move-projects-dialog="showMoveProjectsDialog = true"
        @show-new-project-dialog="openNewProject = true"
        @show-invite-dialog="showInviteDialog = true"
      />
      <div v-if="showSearchBar" class="mt-2 lg:mt-4">
        <FormTextInput
          name="modelsearch"
          :show-label="false"
          :placeholder="`Search ${projects?.totalCount} ${
            projects?.totalCount === 1 ? 'project' : 'projects'
          }...`"
          :custom-icon="MagnifyingGlassIcon"
          color="foundation"
          wrapper-classes="w-full lg:w-60"
          show-clear
          v-bind="bind"
          v-on="on"
        />
      </div>

      <CommonLoadingBar :loading="showLoadingBar" class="my-2" />

      <section
        v-if="showEmptyState"
        class="bg-foundation border border-outline-2 rounded-md h-96 flex flex-col items-center justify-center gap-4"
      >
        <span class="text-body-2xs text-foreground-2 text-center">
          Workspace is empty
        </span>
        <WorkspaceHeaderAddProjectMenu
          v-if="!isWorkspaceGuest"
          button-copy="Add your first project"
          :is-workspace-admin="isWorkspaceAdmin"
          :disabled="workspace?.readOnly"
          @new-project="openNewProject = true"
          @move-project="showMoveProjectsDialog = true"
        />
      </section>

      <template v-else-if="projects?.items?.length">
        <ProjectsDashboardFilled :projects="projects" workspace-page />
        <InfiniteLoading :settings="{ identifier }" @infinite="onInfiniteLoad" />
      </template>

      <CommonEmptySearchState v-else-if="!showLoadingBar" @clear-search="clearSearch" />

      <ProjectsAddDialog v-model:open="openNewProject" :workspace-id="workspace?.id" />

      <template v-if="workspace">
        <InviteDialogWorkspace v-model:open="showInviteDialog" :workspace="workspace" />
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
import { Roles, type Nullable, type Optional, type StreamRoles } from '@speckle/shared'
import {
  workspacePageQuery,
  workspaceProjectsQuery
} from '~~/lib/workspaces/graphql/queries'
import { useDebouncedTextInput } from '@speckle/ui-components'
import { usePaginatedQuery } from '~/lib/common/composables/graphql'
import { graphql } from '~~/lib/common/generated/gql'
import type { WorkspaceProjectsQueryQueryVariables } from '~~/lib/common/generated/gql/graphql'
import { workspaceRoute } from '~/lib/common/helpers/route'
import { useBillingActions } from '~/lib/billing/composables/actions'
import { useWorkspacesWizard } from '~/lib/workspaces/composables/wizard'
import type { WorkspaceWizardState } from '~/lib/workspaces/helpers/types'

graphql(`
  fragment WorkspaceProjectList_Workspace on Workspace {
    id
    ...WorkspaceBase_Workspace
    ...WorkspaceTeam_Workspace
    ...WorkspaceSecurity_Workspace
    ...BillingAlert_Workspace
    ...MoveProjectsDialog_Workspace
    ...InviteDialogWorkspace_Workspace
    projects {
      ...WorkspaceProjectList_ProjectCollection
    }
    creationState {
      completed
      state
    }
    readOnly
  }
`)

graphql(`
  fragment WorkspaceProjectList_ProjectCollection on ProjectCollection {
    totalCount
    items {
      ...ProjectDashboardItem
    }
    cursor
  }
`)

const props = defineProps<{
  workspaceSlug: string
}>()

const { validateCheckoutSession } = useBillingActions()
const areQueriesLoading = useQueryLoading()
const route = useRoute()
const {
  on,
  bind,
  value: search
} = useDebouncedTextInput({
  debouncedBy: 800
})
const isWorkspaceNewPlansEnabled = useWorkspaceNewPlansEnabled()

const showMoveProjectsDialog = ref(false)
const selectedRoles = ref(undefined as Optional<StreamRoles[]>)
const openNewProject = ref(false)
const showInviteDialog = ref(false)

const token = computed(() => route.query.token as Optional<string>)

const pageFetchPolicy = usePageQueryStandardFetchPolicy()
const { result: initialQueryResult, onResult } = useQuery(
  workspacePageQuery,
  () => ({
    workspaceSlug: props.workspaceSlug,
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
    },
    cursor: null as Nullable<string>
  })),
  resolveKey: (vars: WorkspaceProjectsQueryQueryVariables) => ({
    workspaceSlug: vars.workspaceSlug,
    search: vars.filter?.search || ''
  }),
  resolveInitialResult: () =>
    !search.value ? initialQueryResult.value?.workspaceBySlug.projects : undefined,
  resolveCurrentResult: (result) => result?.workspaceBySlug?.projects,
  resolveNextPageVariables: (baseVariables, newCursor) => ({
    ...baseVariables,
    cursor: newCursor
  }),
  resolveCursorFromVariables: (vars) => vars.cursor
})
const { finalizeWizard } = useWorkspacesWizard()

const projects = computed(() => query.result.value?.workspaceBySlug?.projects)
const workspaceInvite = computed(() => initialQueryResult.value?.workspaceInvite)
const workspace = computed(() => initialQueryResult.value?.workspaceBySlug)
const showEmptyState = computed(() => {
  if (search.value) return false

  return projects.value && !projects.value?.items?.length
})

const isWorkspaceGuest = computed(() => workspace.value?.role === Roles.Workspace.Guest)
const isWorkspaceAdmin = computed(() => workspace.value?.role === Roles.Workspace.Admin)

const showLoadingBar = computed(() => {
  const isLoading = areQueriesLoading.value || (!!search.value && query.loading.value)

  return isLoading
})

const showSearchBar = computed(() => {
  return projects?.value?.totalCount || search.value
})

const clearSearch = () => {
  search.value = ''
  selectedRoles.value = []
}

const hasFinalized = ref(false)

onResult((queryResult) => {
  if (
    queryResult.data?.workspaceBySlug.creationState?.completed === false &&
    queryResult.data.workspaceBySlug.creationState.state
  ) {
    if (import.meta.server) return
    if (hasFinalized.value) return

    hasFinalized.value = true
    finalizeWizard(
      queryResult.data.workspaceBySlug.creationState.state as WorkspaceWizardState,
      queryResult.data.workspaceBySlug.id
    )
  }

  if (queryResult.data?.workspaceBySlug) {
    useHeadSafe({
      title: queryResult.data.workspaceBySlug.name
    })
    validateCheckoutSession(queryResult.data.workspaceBySlug)
  }
})
</script>
