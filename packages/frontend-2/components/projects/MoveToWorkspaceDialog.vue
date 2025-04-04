<template>
  <div>
    <LayoutDialog v-model:open="open" max-width="sm" :buttons="dialogButtons">
      <template #header>Move project to workspace</template>
      <div class="flex flex-col space-y-4">
        <template v-if="!workspace">
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
            <p class="text-body-xs text-foreground font-medium">
              You're not a member of any workspaces.
            </p>
            <FormButton :to="workspaceCreateRoute">Learn about workspaces</FormButton>
          </div>
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
              The project, including models and versions, will be moved to the
              workspace, where all existing members and admins will have access.
              <span class="pt-2 block">
                The project's collaborators will become workspace members and keep their
                project roles.
              </span>
            </p>
          </div>
        </div>
      </div>
      <WorkspaceRegionStaticDataDisclaimer
        v-if="showRegionStaticDataDisclaimer"
        v-model:open="showRegionStaticDataDisclaimer"
        :variant="RegionStaticDataDisclaimerVariant.MoveProjectIntoWorkspace"
        @confirm="onConfirmHandler"
      />
    </LayoutDialog>
    <WorkspacePlanLimitReachedDialog
      v-if="activeLimit"
      v-model:open="showLimitReachedDialog"
      :limit="activeLimit"
      :limit-type="limitType"
    />
  </div>
</template>

<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import type {
  ProjectsMoveToWorkspaceDialog_WorkspaceFragment,
  ProjectsMoveToWorkspaceDialog_ProjectFragment
} from '~~/lib/common/generated/gql/graphql'
import { useMutationLoading, useQuery } from '@vue/apollo-composable'
import type { LayoutDialogButton } from '@speckle/ui-components'
import { useMoveProjectToWorkspace } from '~/lib/projects/composables/projectManagement'
import { Roles } from '@speckle/shared'
import { workspaceCreateRoute } from '~/lib/common/helpers/route'
import {
  useWorkspaceCustomDataResidencyDisclaimer,
  RegionStaticDataDisclaimerVariant
} from '~/lib/workspaces/composables/region'
import { useWorkspaceLimits } from '~/lib/workspaces/composables/limits'

graphql(`
  fragment ProjectsMoveToWorkspaceDialog_Workspace on Workspace {
    id
    role
    name
    logo
    slug
    ...WorkspaceHasCustomDataResidency_Workspace
    ...ProjectsWorkspaceSelect_Workspace
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

const query = graphql(`
  query ProjectsMoveToWorkspaceDialog {
    activeUser {
      id
      ...ProjectsMoveToWorkspaceDialog_User
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
const { result } = useQuery(query, null, () => ({
  enabled: isWorkspacesEnabled.value
}))
const loading = useMutationLoading()
const moveProject = useMoveProjectToWorkspace()

const selectedWorkspace = ref<ProjectsMoveToWorkspaceDialog_WorkspaceFragment>()

const activeWorkspaceSlug = computed(
  () => selectedWorkspace.value?.slug || props.workspace?.slug || ''
)

// Get workspace limits
const { canAddProject, canAddModels, limits } = useWorkspaceLimits(
  activeWorkspaceSlug.value
)

const showLimitReachedDialog = ref(false)

const workspaces = computed(() => result.value?.activeUser?.workspaces.items ?? [])
const hasWorkspaces = computed(() => workspaces.value.length > 0)
const modelText = computed(() =>
  props.project.modelCount.totalCount === 1 ? 'model' : 'models'
)
const versionsText = computed(() =>
  props.project.versions.totalCount === 1 ? 'version' : 'versions'
)

// Determine which limit type is hit
const limitType = computed((): 'project' | 'model' | null => {
  if (!canAddProject.value) return 'project'

  const projectModelCount = props.project.modelCount.totalCount
  if (!canAddModels(projectModelCount)) return 'model'

  return null
})

// Get the value of the limit that's hit
const activeLimit = computed(() => {
  if (limitType.value === 'project') return limits.value.projectCount ?? 0
  if (limitType.value === 'model') return limits.value.modelCount ?? 0
  return 0
})

const dialogButtons = computed<LayoutDialogButton[]>(() => {
  return hasWorkspaces.value
    ? [
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
            disabled: (!selectedWorkspace.value && !props.workspace) || loading.value
          },
          onClick: () => onMoveClick()
        }
      ]
    : [
        {
          text: 'Close',
          props: { color: 'outline' },
          onClick: () => {
            open.value = false
          }
        }
      ]
})

const onMoveProject = async () => {
  const workspaceId = selectedWorkspace.value?.id ?? props.workspace?.id
  const workspaceName = selectedWorkspace.value?.name ?? props.workspace?.name
  if (!workspaceId || !workspaceName) return

  const res = await moveProject({
    projectId: props.project.id,
    workspaceId,
    workspaceName,
    eventSource: props.eventSource
  })
  if (res?.id) {
    open.value = false
  }
}

const { showRegionStaticDataDisclaimer, triggerAction, onConfirmHandler } =
  useWorkspaceCustomDataResidencyDisclaimer({
    workspace: computed(() => selectedWorkspace.value ?? props.workspace),
    onConfirmAction: onMoveProject
  })

watch(
  () => open.value,
  (isOpen, oldIsOpen) => {
    if (isOpen && isOpen !== oldIsOpen) {
      selectedWorkspace.value = undefined
      showRegionStaticDataDisclaimer.value = false
    }
  }
)

const onMoveClick = () => {
  const projectModelCount = props.project.modelCount.totalCount

  // Check if we can add this project to the workspace
  if (!canAddProject.value || !canAddModels(projectModelCount)) {
    open.value = false
    showLimitReachedDialog.value = true
  } else {
    triggerAction()
  }
}
</script>
