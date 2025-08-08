<template>
  <div>
    <div v-if="showSearchBar">
      <FormTextInput
        name="modelsearch"
        :show-label="false"
        :placeholder="`Search ${projects?.totalCount} ${
          projects?.totalCount === 1 ? 'project' : 'projects'
        }...`"
        :custom-icon="Search"
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
      class="bg-foundation-page h-96 flex flex-col items-center justify-center gap-3"
    >
      <IllustrationEmptystateWorkspace />
      <h2 class="text-heading-sm text-foreground-2 text-center mb-1">
        Workspace is empty
      </h2>
      <WorkspaceAddProjectMenu
        :workspace="workspace"
        :workspace-slug="workspaceSlug"
        cta-label="Add your first project"
      />
      <FormButton
        class="flex items-center gap-1"
        color="subtle"
        @click="openExplainerVideoDialog"
      >
        <IconPlay class="h-4 w-4 text-foreground-2" />
        <span class="text-body-2xs text-foreground font-medium">
          Speckle explained in 5 minutes →
        </span>
      </FormButton>
    </section>

    <section v-else-if="projects?.items?.length">
      <ProjectsDashboardFilled :projects="projects" workspace-page />
      <InfiniteLoading :settings="{ identifier }" @infinite="onInfiniteLoad" />
    </section>

    <CommonEmptySearchState v-else-if="!showLoadingBar" @clear-search="clearSearch" />
    <WorkspaceExplainerVideoDialog v-model:open="isExplainerVideoOpen" />
  </div>
</template>

<script setup lang="ts">
import { Search } from 'lucide-vue-next'
import type { MaybeNullOrUndefined, Nullable } from '@speckle/shared'
import { workspaceProjectsQuery } from '~~/lib/workspaces/graphql/queries'
import { useDebouncedTextInput } from '@speckle/ui-components'
import { usePaginatedQuery } from '~/lib/common/composables/graphql'
import { graphql } from '~~/lib/common/generated/gql'
import type {
  WorkspaceProjectsQueryQueryVariables,
  WorkspaceDashboardProjectList_WorkspaceFragment
} from '~~/lib/common/generated/gql/graphql'
import { useMixpanel } from '~~/lib/core/composables/mp'

graphql(`
  fragment WorkspaceDashboardProjectList_ProjectCollection on ProjectCollection {
    totalCount
    items {
      ...ProjectDashboardItem
    }
    cursor
  }
`)

graphql(`
  fragment WorkspaceDashboardProjectList_Workspace on Workspace {
    ...WorkspaceAddProjectMenu_Workspace
    id
  }
`)

const props = defineProps<{
  workspaceSlug: string
  workspace: MaybeNullOrUndefined<WorkspaceDashboardProjectList_WorkspaceFragment>
}>()

const isExplainerVideoOpen = ref(false)

const {
  on,
  bind,
  value: search
} = useDebouncedTextInput({
  debouncedBy: 800
})

const mixpanel = useMixpanel()
const {
  query: projectsQuery,
  identifier,
  onInfiniteLoad
} = usePaginatedQuery({
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
  resolveCurrentResult: (result) => result?.workspaceBySlug?.projects,
  resolveNextPageVariables: (baseVariables, newCursor) => ({
    ...baseVariables,
    cursor: newCursor
  }),
  resolveCursorFromVariables: (vars) => vars.cursor
})

const projects = computed(() => projectsQuery.result.value?.workspaceBySlug?.projects)
const showSearchBar = computed(() => {
  return projects?.value?.totalCount || search.value
})
const showLoadingBar = computed(() => projectsQuery.loading.value)
const showEmptyState = computed(() =>
  search.value ? false : projects.value && !projects.value?.items?.length
)

const openExplainerVideoDialog = () => {
  isExplainerVideoOpen.value = true
  mixpanel.track('Getting Started Video Opened', {
    location: 'project_list'
  })
}

const clearSearch = () => {
  search.value = ''
}
</script>
