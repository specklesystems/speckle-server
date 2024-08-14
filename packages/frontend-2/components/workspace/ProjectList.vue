<template>
  <div>
    <WorkspaceHeader
      v-if="workspace"
      :icon="Squares2X2Icon"
      :workspace-info="workspace"
    />
    <div class="flex flex-col gap-4 mt-4">
      <div class="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
        <div class="flex flex-col sm:flex-row gap-2">
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
          ></FormTextInput>
        </div>
        <FormButton v-if="!isGuest" @click="openNewProject = true">
          New project
        </FormButton>
      </div>
    </div>

    <CommonLoadingBar :loading="showLoadingBar" class="my-2" />

    <ProjectsDashboardEmptyState
      v-if="showEmptyState"
      @create-project="openNewProject = true"
    />

    <template v-else-if="projects?.items?.length">
      <ProjectsDashboardFilled :projects="projects" />
      <InfiniteLoading
        :settings="{ identifier: infiniteLoaderId }"
        @infinite="onInfiniteLoad"
      />
    </template>

    <CommonEmptySearchState v-else-if="!showLoadingBar" @clear-search="clearSearch" />

    <ProjectsAddDialog v-model:open="openNewProject" :workspace-id="workspaceId" />
  </div>
</template>

<script setup lang="ts">
import { MagnifyingGlassIcon, Squares2X2Icon } from '@heroicons/vue/24/outline'
import { useQuery, useQueryLoading } from '@vue/apollo-composable'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
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

graphql(`
  fragment WorkspaceProjectList_ProjectCollection on ProjectCollection {
    totalCount
    items {
      ...ProjectDashboardItem
    }
    cursor
  }
`)

const infiniteLoaderId = ref('')
const selectedRoles = ref(undefined as Optional<StreamRoles[]>)
const openNewProject = ref(false)

const { isGuest } = useActiveUser()
const areQueriesLoading = useQueryLoading()

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

const { result: initialQueryResult } = useQuery(workspacePageQuery, {
  workspaceId: props.workspaceId,
  filter: {
    search: (search.value || '').trim() || null
  }
})

const { query, onInfiniteLoad } = usePaginatedQuery<
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
  resolveCurrentResult: (result) => result?.workspace?.projects,
  resolveInitialResult: () => workspace.value?.projects,
  resolveNextPageVariables: (baseVariables, newCursor) => ({
    ...baseVariables,
    cursor: newCursor
  }),
  resolveCursorFromVariables: (vars) => vars.cursor
})

const workspace = computed(() => initialQueryResult.value?.workspace)
const projects = computed(() => query.result.value?.workspace?.projects)
const showEmptyState = computed(() => !projects.value?.items?.length)
const showLoadingBar = computed(() => {
  return areQueriesLoading.value && (!!search.value || !projects.value?.items?.length)
})

const clearSearch = () => {
  search.value = ''
  selectedRoles.value = []
}
</script>
