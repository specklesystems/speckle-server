<template>
  <div>
    <LayoutDialog v-model:open="open" max-width="sm" prevent-close-on-click-outside>
      <template #header>Ready to move your project?</template>
      <div class="flex flex-col space-y-4">
        <template v-if="!workspace">
          <div v-if="hasWorkspaces">
            <p class="mb-4">Select an existing workspaces or create a new one.</p>
            <div class="flex flex-col gap-2">
              <button
                v-for="ws in workspaces"
                :key="ws.id"
                class="w-full"
                @click="handleWorkspaceClick(ws)"
              >
                <WorkspaceCard
                  :logo="ws.logo ?? ''"
                  :name="ws.name"
                  :clickable="ws.role === Roles.Workspace.Admin"
                >
                  <template #text>
                    <div class="flex flex-col gap-2">
                      <p>
                        {{ ws.projects.totalCount }} projects,
                        {{ ws.projects.totalCount }} models
                      </p>
                      <UserAvatarGroup
                        :users="ws.team.items.map((t) => t.user)"
                        :max-count="6"
                      />
                    </div>
                  </template>
                  <template #actions>
                    <CommonBadge color="secondary" class="capitalize" rounded>
                      {{ ws.plan?.name }}
                    </CommonBadge>
                  </template>
                </WorkspaceCard>
              </button>
            </div>
          </div>
          <p v-else class="text-body-xs text-foreground">
            Looks like you haven't created any workspaces yet. Workspaces help you
            easily organise and control your digital projects. Create one to move your
            project into.
          </p>
        </template>

        <div v-if="project && workspace" class="text-body-xs">
          <div class="text-body-xs text-foreground flex flex-col gap-y-4">
            <div class="rounded border bg-foundation-2 border-outline-3 py-2 px-4">
              <p>
                Move
                <span class="font-medium">{{ project.name }}</span>
                to
                <span class="font-medium">{{ workspace.name }}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
      <template #buttons>
        <FormButton
          color="outline"
          class="-my-2"
          full-width
          @click="navigateTo(workspaceCreateRoute())"
        >
          Create a new workspace
        </FormButton>
      </template>
    </LayoutDialog>

    <ProjectsConfirmMoveDialog
      v-if="project && selectedWorkspace"
      v-model:open="showConfirmDialog"
      :project="project"
      :workspace="selectedWorkspace"
      :event-source="eventSource"
    />

    <WorkspacePlanLimitReachedDialog
      v-model:open="showLimitReachedDialog"
      :title="dialogTitle"
    >
      The {{ activeLimit }} {{ limitType }} limit for this workspace has been reached.
      Upgrade the workspace plan to create or move more projects.
    </WorkspacePlanLimitReachedDialog>
  </div>
</template>

<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import type {
  ProjectsMoveToWorkspaceDialog_WorkspaceFragment,
  ProjectsMoveToWorkspaceDialog_ProjectFragment
} from '~~/lib/common/generated/gql/graphql'
import { useQuery } from '@vue/apollo-composable'
import { UserAvatarGroup } from '@speckle/ui-components'
import { useWorkspaceLimits } from '~/lib/workspaces/composables/limits'
import { Roles } from '@speckle/shared'
import { workspaceCreateRoute } from '~/lib/common/helpers/route'
import { useWorkspacePlan } from '~/lib/workspaces/composables/plan'

graphql(`
  fragment ProjectsMoveToWorkspaceDialog_Workspace on Workspace {
    id
    role
    name
    logo
    slug
    plan {
      name
    }
    projects {
      totalCount
    }
    team {
      items {
        user {
          id
          name
          avatar
        }
      }
    }
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
  project?: ProjectsMoveToWorkspaceDialog_ProjectFragment
  workspace?: ProjectsMoveToWorkspaceDialog_WorkspaceFragment
  eventSource?: string // Used for mixpanel tracking
}>()

const open = defineModel<boolean>('open', { required: true })

const isWorkspacesEnabled = useIsWorkspacesEnabled()
const { result } = useQuery(query, null, () => ({
  enabled: isWorkspacesEnabled.value
}))

const selectedWorkspace = ref<ProjectsMoveToWorkspaceDialog_WorkspaceFragment>()

const activeWorkspaceSlug = computed(() => selectedWorkspace.value?.slug || '')

const dialogTitle = computed(() => {
  if (limitType.value === 'project') return 'Project limit reached'
  if (limitType.value === 'model') return 'Model limit reached'
  return 'Limit reached'
})

// Get workspace limits
const { canAddProject, canAddModels, limits } = useWorkspaceLimits(
  activeWorkspaceSlug.value
)

const { plan } = useWorkspacePlan(activeWorkspaceSlug.value)

const showLimitReachedDialog = ref(false)

const workspaces = computed(() => result.value?.activeUser?.workspaces.items ?? [])
const hasWorkspaces = computed(() => workspaces.value.length > 0)

// Determine which limit type is hit
const limitType = computed((): 'project' | 'model' | null => {
  if (!selectedWorkspace.value) return null
  if (!canAddProject.value) return 'project'

  const projectModelCount = props.project?.modelCount.totalCount
  if (!canAddModels(projectModelCount)) return 'model'

  // Check free plan project limit
  const currentProjectCount = plan.value?.usage?.projectCount || 0
  if (plan.value?.name === 'free' && currentProjectCount >= 3) return 'project'

  return null
})

// Get the value of the limit that's hit
const activeLimit = computed(() => {
  if (!selectedWorkspace.value) return 0
  if (limitType.value === 'project') {
    // For free plan, show the actual limit
    if (plan.value?.name === 'free') return 3
    return limits.value.projectCount ?? 0
  }
  if (limitType.value === 'model') return limits.value.modelCount ?? 0
  return 0
})

const showConfirmDialog = ref(false)

const handleWorkspaceClick = (ws: ProjectsMoveToWorkspaceDialog_WorkspaceFragment) => {
  selectedWorkspace.value = ws

  const hasReachedProjectLimit = computed(() => {
    return false
  })

  if (hasReachedProjectLimit.value) {
    showLimitReachedDialog.value = true
  } else {
    showConfirmDialog.value = true
  }
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
