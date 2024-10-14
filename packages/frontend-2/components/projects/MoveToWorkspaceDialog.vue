<template>
  <LayoutDialog v-model:open="open" max-width="sm" :buttons="dialogButtons">
    <template #header>Move project to workspace</template>
    <div class="flex flex-col space-y-4">
      <template v-if="!workspace">
        <template v-if="!isCreatingWorkspace">
          <ProjectsWorkspaceSelect
            v-if="hasWorkspaces"
            v-model="selectedWorkspace"
            :items="workspaces"
            :disabled-roles="[Roles.Workspace.Member, Roles.Workspace.Guest]"
            disabled-item-tooltip="Only workspace admins can move projects into a workspace."
            label="Select a workspace"
            help="Once a project is moved to a workspace, it cannot be moved out from it."
            show-label
          />
          <div v-else class="flex flex-col gap-y-2">
            <FormButton color="outline" @click="isCreatingWorkspace = true">
              New workspace
            </FormButton>
            <p class="text-body-2xs text-foreground-2">
              Once a project is moved to a workspace, it cannot be moved out from it.
            </p>
          </div>
        </template>
        <ProjectsNewWorkspace
          v-else
          mixpanel-event-source="move-to-workspace-modal"
          @cancel="isCreatingWorkspace = false"
          @workspace-created="onWorkspaceCreated"
        />
      </template>

      <div v-if="project && (selectedWorkspace || workspace)" class="text-body-xs">
        <div class="text-body-xs text-foreground flex flex-col gap-y-4">
          <div class="rounded border bg-foundation-2 border-outline-3 py-2 px-4">
            <p>
              Move
              <span class="font-medium">{{ project.name }}</span>
              to
              <span class="font-medium">
                {{ selectedWorkspace?.name ?? workspace?.name }}
              </span>
            </p>
            <p class="text-foreground-3">
              {{ project.modelCount.totalCount }} {{ modelText }},
              {{ project.versions.totalCount }} {{ versionsText }}
            </p>
          </div>
          <p class="text-body-2xs text-foreground-2">
            The project, including models and versions, will be moved to the workspace,
            where all existing members and admins will have access.
            <span class="pt-2 block">
              The project's collaborators will become workspace members and keep their
              project roles.
            </span>
          </p>
        </div>
      </div>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import type {
  ProjectsMoveToWorkspaceDialog_WorkspaceFragment,
  ProjectsMoveToWorkspaceDialog_ProjectFragment
} from '~~/lib/common/generated/gql/graphql'
import { projectWorkspaceSelectQuery } from '~/lib/projects/graphql/queries'
import { useQuery } from '@vue/apollo-composable'
import { type LayoutDialogButton } from '@speckle/ui-components'
import { useMoveProjectToWorkspace } from '~/lib/projects/composables/projectManagement'
import { Roles } from '@speckle/shared'

graphql(`
  fragment ProjectsMoveToWorkspaceDialog_Workspace on Workspace {
    id
    role
    name
    defaultLogoIndex
    logo
  }
`)

graphql(`
  fragment ProjectsMoveToWorkspaceDialog_User on User {
    workspaces {
      items {
        ...ProjectsMoveToWorkspaceDialog_Workspace
      }
    }
  }
`)

graphql(`
  fragment ProjectsMoveToWorkspaceDialog_Project on Project {
    id
    name
    modelCount: models(limit: 0) {
      totalCount
    }
    versions(limit: 0) {
      totalCount
    }
  }
`)

const props = defineProps<{
  project: ProjectsMoveToWorkspaceDialog_ProjectFragment
  workspace?: ProjectsMoveToWorkspaceDialog_WorkspaceFragment
  eventSource?: string // Used for mixpanel tracking
}>()
const open = defineModel<boolean>('open', { required: true })

const isWorkspacesEnabled = useIsWorkspacesEnabled()
const { result } = useQuery(projectWorkspaceSelectQuery, null, () => ({
  enabled: isWorkspacesEnabled.value
}))
const moveProject = useMoveProjectToWorkspace()

const selectedWorkspace = ref<ProjectsMoveToWorkspaceDialog_WorkspaceFragment>()
const isCreatingWorkspace = ref<boolean>(false)

const workspaces = computed(() => result.value?.activeUser?.workspaces.items ?? [])
const hasWorkspaces = computed(() => workspaces.value.length > 0)
const modelText = computed(() =>
  props.project.modelCount.totalCount === 1 ? 'model' : 'models'
)
const versionsText = computed(() =>
  props.project.versions.totalCount === 1 ? 'version' : 'versions'
)
const dialogButtons = computed<LayoutDialogButton[]>(() => {
  if (isCreatingWorkspace.value) return []

  return [
    {
      text: 'Cancel',
      props: { color: 'outline' },
      onClick: () => {
        open.value = false
      }
    },
    {
      text: 'Move',
      props: {
        color: 'primary',
        disabled: !selectedWorkspace.value && !props.workspace
      },
      onClick: () => {
        if (props.project && (selectedWorkspace.value || props.workspace)) {
          const workspaceId = (selectedWorkspace.value?.id ||
            props.workspace?.id) as string
          const workspaceName =
            selectedWorkspace.value?.name || (props.workspace?.name as string)

          moveProject({
            projectId: props.project.id,
            workspaceId,
            workspaceName,
            eventSource: props.eventSource
          })

          open.value = false
        }
      }
    }
  ]
})

const onWorkspaceCreated = (
  workspace: ProjectsMoveToWorkspaceDialog_WorkspaceFragment
) => {
  isCreatingWorkspace.value = false
  selectedWorkspace.value = workspace
}

watch(
  () => open.value,
  (isOpen, oldIsOpen) => {
    if (isOpen && isOpen !== oldIsOpen) {
      selectedWorkspace.value = undefined
    }
  }
)
</script>
