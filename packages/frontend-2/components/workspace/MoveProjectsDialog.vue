<template>
  <LayoutDialog
    v-model:open="open"
    max-width="sm"
    title="Move projects to workspace"
    :buttons="buttons"
  >
    <FormTextInput
      v-bind="bind"
      label="Move projects"
      name="search"
      color="foundation"
      placeholder="Search projects..."
      show-clear
      full-width
      class="mb-2"
      v-on="on"
    />
    <div class="text-body-2xs py-2">
      You can move up to
      <span class="font-medium">
        {{ Math.max(0, remainingProjectCount) }}
        {{ remainingProjectCount === 1 ? 'project' : 'projects' }}
      </span>
      and
      <span class="font-medium">
        {{ Math.max(0, remainingModelCount) }}
        {{ remainingModelCount === 1 ? 'model' : 'models' }}
      </span>
      in total.
    </div>
    <div
      v-if="hasMoveableProjects"
      class="flex flex-col mt-2 border rounded-md border-outline-3"
    >
      <div
        v-for="project in moveableProjects"
        :key="project.id"
        class="flex px-4 py-3 items-center space-x-2 justify-between border-b last:border-0 border-outline-3"
      >
        <div class="flex flex-col flex-1 truncate text-body-xs">
          <span class="font-medium text-foreground truncate">
            {{ project.name }}
          </span>
          <div class="flex items-center gap-x-1">
            <span class="text-foreground-3 truncate">
              {{ project.modelCount.totalCount }} model{{
                project.modelCount.totalCount !== 1 ? 's' : ''
              }}
            </span>
          </div>
        </div>
        <FormButton size="sm" color="outline" @click="onMoveClick(project)">
          Move...
        </FormButton>
      </div>
    </div>
    <p v-else class="py-4 text-body-xs text-foreground-2">
      You don't have any projects that can be moved into this workspace. Only projects
      you own and that aren't in another workspace can be moved.
    </p>
    <InfiniteLoading
      v-if="moveableProjects?.length && !search?.length"
      :settings="{ identifier }"
      class="py-4"
      @infinite="onInfiniteLoad"
    />

    <ProjectsMoveToWorkspaceDialog
      v-if="selectedProject"
      v-model:open="showMoveToWorkspaceDialog"
      :workspace="workspace"
      :project="selectedProject"
      event-source="move-projects-dialog"
    />
  </LayoutDialog>
</template>
<script setup lang="ts">
import {
  FormTextInput,
  type LayoutDialogButton,
  useDebouncedTextInput
} from '@speckle/ui-components'
import { graphql } from '~~/lib/common/generated/gql'
import type {
  MoveProjectsDialog_WorkspaceFragment,
  ProjectsMoveToWorkspaceDialog_ProjectFragment
} from '~~/lib/common/generated/gql/graphql'
import { usePaginatedQuery } from '~/lib/common/composables/graphql'
import { moveProjectsDialogQuery } from '~~/lib/workspaces/graphql/queries'
import { Roles } from '@speckle/shared'
import { useWorkspaceLimits } from '~/lib/workspaces/composables/limits'

graphql(`
  fragment MoveProjectsDialog_Workspace on Workspace {
    id
    ...ProjectsMoveToWorkspaceDialog_Workspace
    projects {
      items {
        id
      }
    }
  }
`)

graphql(`
  fragment MoveProjectsDialog_User on User {
    projects(cursor: $cursor, filter: $filter, limit: 10) {
      totalCount
      cursor
      items {
        ...ProjectsMoveToWorkspaceDialog_Project
        workspace {
          id
        }
      }
    }
  }
`)

const props = defineProps<{
  workspace: MoveProjectsDialog_WorkspaceFragment
}>()

const open = defineModel<boolean>('open', { required: true })
const search = defineModel<string>('search')
const { on, bind } = useDebouncedTextInput({ model: search })

const {
  query: { result },
  identifier,
  onInfiniteLoad
} = usePaginatedQuery({
  query: moveProjectsDialogQuery,
  baseVariables: computed(() => ({
    cursor: null as string | null,
    filter: {
      search: search.value?.length ? search.value : null,
      workspaceId: null,
      onlyWithRoles: [Roles.Stream.Owner]
    }
  })),
  resolveKey: (vars) => [vars.filter?.search || ''],
  resolveCurrentResult: (res) => res?.activeUser?.projects,
  resolveNextPageVariables: (baseVars, cursor) => ({
    ...baseVars,
    cursor
  }),
  resolveCursorFromVariables: (vars) => vars.cursor
})

const selectedProject = ref<ProjectsMoveToWorkspaceDialog_ProjectFragment | null>(null)
const showMoveToWorkspaceDialog = ref(false)

const { remainingModelCount, remainingProjectCount } = useWorkspaceLimits(
  props.workspace.slug
)

const workspaceProjects = computed(() =>
  props.workspace.projects.items.map((project) => project.id)
)
const userProjects = computed(() => result.value?.activeUser?.projects.items || [])

const moveableProjects = computed(() =>
  userProjects.value.filter((project) => !workspaceProjects.value.includes(project.id))
)
const hasMoveableProjects = computed(() => moveableProjects.value.length > 0)

const buttons = computed((): LayoutDialogButton[] => [
  {
    text: 'Done',
    props: { color: 'primary' },
    onClick: () => {
      open.value = false
    }
  }
])

const onMoveClick = (project: ProjectsMoveToWorkspaceDialog_ProjectFragment) => {
  selectedProject.value = project
  showMoveToWorkspaceDialog.value = true
}
</script>
