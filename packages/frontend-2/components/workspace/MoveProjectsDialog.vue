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
    <div v-if="isWorkspaceNewPlansEnabled" class="text-body-2xs py-2">
      You can move up to
      <span class="font-medium">{{ remainingProjects }} projects</span>
      and
      <span class="font-medium">{{ remainingModels }} models</span>
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
    <WorkspacePlanLimitReachedDialog
      v-if="activeLimit"
      v-model:open="showLimitReachedDialog"
      :limit="activeLimit"
      :limit-type="limitType"
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
import {
  useWorkspacePlanLimits,
  useGetWorkspacePlanUsage
} from '~/lib/workspaces/composables/plan'

graphql(`
  fragment MoveProjectsDialog_Workspace on Workspace {
    id
    plan {
      name
    }
    ...ProjectsMoveToWorkspaceDialog_Workspace
    projects {
      items {
        id
        modelCount: models(limit: 0) {
          totalCount
        }
        versions(limit: 0) {
          totalCount
        }
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
        role
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

const isWorkspaceNewPlansEnabled = useWorkspaceNewPlansEnabled()

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
const showLimitReachedDialog = ref(false)

const { projectCount, modelCount } = useGetWorkspacePlanUsage(props.workspace.slug)

const { remainingProjects, remainingModels, limitType, activeLimit } =
  useWorkspacePlanLimits(projectCount, modelCount)

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
  if (!limitType.value) {
    showMoveToWorkspaceDialog.value = true
  } else {
    showLimitReachedDialog.value = true
  }
}
</script>
