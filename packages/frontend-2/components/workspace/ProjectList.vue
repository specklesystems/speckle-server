<template>
  <div>
    <div v-if="workspaceInvite" class="flex justify-center">
      <WorkspaceInviteBlock :invite="workspaceInvite" />
    </div>
    <template v-else>
      <Portal to="navigation">
        <HeaderNavLink :to="workspacesRoute" name="Workspaces" :separator="false" />
        <HeaderNavLink :to="workspaceRoute(workspaceId)" :name="workspace?.name" />
      </Portal>
      <WorkspaceHeader
        v-if="workspace"
        :icon="Squares2X2Icon"
        :workspace-info="workspace"
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

      <ProjectsDashboardEmptyState
        v-if="showEmptyState"
        :is-guest="isWorkspaceGuest"
        @create-project="openNewProject = true"
      />

      <template v-else-if="projects?.items?.length">
        <ProjectsDashboardFilled :projects="projects" />
        <InfiniteLoading :settings="{ identifier }" @infinite="onInfiniteLoad" />
      </template>

      <CommonEmptySearchState v-else-if="!showLoadingBar" @clear-search="clearSearch" />

      <ProjectsAddDialog v-model:open="openNewProject" :workspace-id="workspaceId" />
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
import type {
  WorkspaceProjectList_ProjectCollectionFragment,
  WorkspaceProjectsQueryQueryVariables
} from '~~/lib/common/generated/gql/graphql'
import { skipLoggingErrorsIfOneFieldError } from '~/lib/common/helpers/graphql'
import { workspaceRoute, workspacesRoute } from '~/lib/common/helpers/route'
import { Roles } from '@speckle/shared'

graphql(`
  fragment WorkspaceProjectList_ProjectCollection on ProjectCollection {
    totalCount
    items {
      ...ProjectDashboardItem
    }
    cursor
  }
`)

const selectedRoles = ref(undefined as Optional<StreamRoles[]>)
const openNewProject = ref(false)

const areQueriesLoading = useQueryLoading()
const route = useRoute()

const props = defineProps<{
  workspaceId: string
}>()

const {
  on,
  bind,
  value: search
} = useDebouncedTextInput({
  debouncedBy: 800
})

const token = computed(() => route.query.token as Optional<string>)
const { result: initialQueryResult } = useQuery(
  workspacePageQuery,
  () => ({
    workspaceId: props.workspaceId,
    filter: {
      search: (search.value || '').trim() || null
    },
    token: token.value || null
  }),
  () => ({
    // Custom error policy so that a failing invitedTeam resolver (due to access rights)
    // doesn't kill the entire query
    errorPolicy: 'all',
    context: {
      skipLoggingErrors: skipLoggingErrorsIfOneFieldError('invitedTeam')
    }
  })
)

const { query, identifier, onInfiniteLoad } = usePaginatedQuery<
  { workspace: { projects: WorkspaceProjectList_ProjectCollectionFragment } },
  WorkspaceProjectsQueryQueryVariables
>({
  query: workspaceProjectsQuery,
  baseVariables: computed(() => ({
    workspaceId: props.workspaceId,
    filter: {
      search: (search.value || '').trim() || null
    }
  })),
  resolveKey: (vars: WorkspaceProjectsQueryQueryVariables) => ({
    workspaceId: vars.workspaceId,
    search: vars.filter?.search || ''
  }),
  resolveInitialResult: () => initialQueryResult.value?.workspace.projects,
  resolveCurrentResult: (result) => result?.workspace?.projects,
  resolveNextPageVariables: (baseVariables, newCursor) => ({
    ...baseVariables,
    cursor: newCursor
  }),
  resolveCursorFromVariables: (vars) => vars.cursor
})

const workspace = computed(() => initialQueryResult.value?.workspace)
const projects = computed(() => query.result.value?.workspace?.projects)
const workspaceInvite = computed(() => initialQueryResult.value?.workspaceInvite)

const showEmptyState = computed(() => {
  if (search.value) return false

  return projects.value && !projects.value?.items?.length
})

const showLoadingBar = computed(() => {
  return areQueriesLoading.value && (!!search.value || !projects.value?.items?.length)
})

const isWorkspaceGuest = computed(() => workspace.value?.role === Roles.Workspace.Guest)

const clearSearch = () => {
  search.value = ''
  selectedRoles.value = []
}
</script>
