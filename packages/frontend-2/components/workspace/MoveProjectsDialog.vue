<template>
  <LayoutDialog
    v-model:open="open"
    max-width="sm"
    title="Move projects to workspace"
    :buttons="buttons"
  >
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
          <span class="text-foreground-3 truncate">
            {{ project.modelCount.totalCount }} model{{
              project.modelCount.totalCount !== 1 ? 's' : ''
            }}, {{ project.versions.totalCount }} version{{
              project.versions.totalCount !== 1 ? 's' : ''
            }}
          </span>
        </div>
        <span
          v-tippy="
            project.role !== Roles.Stream.Owner &&
            'Only the project owner can move this project'
          "
        >
          <FormButton
            :disabled="project.role !== Roles.Stream.Owner"
            size="sm"
            color="outline"
            @click="onMoveClick(project)"
          >
            Move...
          </FormButton>
        </span>
      </div>
    </div>
    <p v-else class="py-4 text-body-xs text-foreground-2">
      You don't have any projects that can be moved into this workspace
    </p>

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
import type { LayoutDialogButton } from '@speckle/ui-components'
import { graphql } from '~~/lib/common/generated/gql'
import type {
  MoveProjectsDialog_WorkspaceFragment,
  ProjectsMoveToWorkspaceDialog_ProjectFragment
} from '~~/lib/common/generated/gql/graphql'
import { useQuery } from '@vue/apollo-composable'
import { moveProjectsDialogQuery } from '~~/lib/workspaces/graphql/queries'
import { Roles } from '@speckle/shared'

graphql(`
  fragment MoveProjectsDialog_Workspace on Workspace {
    id
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
    projects {
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

const open = defineModel<boolean>('open', { required: true })

const { result } = useQuery(moveProjectsDialogQuery)

const selectedProject = ref<ProjectsMoveToWorkspaceDialog_ProjectFragment | null>(null)
const showMoveToWorkspaceDialog = ref(false)

const workspaceProjects = computed(() =>
  props.workspace.projects.items.map((project) => project.id)
)
const userProjects = computed(() => result.value?.activeUser?.projects.items || [])
const projectsWithWorkspace = computed(() =>
  userProjects.value
    .filter((project) => !!project.workspace?.id)
    .map((project) => project.id)
)
const moveableProjects = computed(() =>
  userProjects.value.filter(
    (project) =>
      !workspaceProjects.value.includes(project.id) &&
      !projectsWithWorkspace.value.includes(project.id)
  )
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
