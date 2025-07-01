<template>
  <div>
    <LayoutDialog
      v-if="workspace"
      v-model:open="isOpen"
      :buttons="dialogButtons"
      prevent-close-on-click-outside
      max-width="md"
      @update:open="isOpen = false"
    >
      <template #header>{{ title }}</template>
      <InviteDialogWorkspaceSelectRole
        v-if="isSelectingRole"
        v-model:selected-role="selectedRole"
        :workspace-name="workspace?.name || ''"
      />
      <InviteDialogSharedSelectUsers
        v-else
        ref="selectUsers"
        :invites="invites"
        :allowed-domains="allowedDomains"
        :target-role="selectedRole"
        :workspace="workspace"
      >
        <template #project>
          <FormSelectProjects
            v-if="selectedRole === Roles.Workspace.Guest"
            v-model="project"
            label="Project (optional)"
            show-label
            mount-menu-on-body
            allow-unset
            :workspace-id="workspace?.id"
            class="mb-4"
          />
        </template>
      </InviteDialogSharedSelectUsers>
    </LayoutDialog>
    <WorkspaceAdditionalSeatsChargeDisclaimer
      v-model:open="showAdditionalSeatsDisclaimer"
      :editor-count="purchasableEditorCount"
      :workspace-slug="workspace?.slug || ''"
      @confirm="onSelectUsersSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'
import { graphql } from '~/lib/common/generated/gql'
import type {
  InviteDialogWorkspace_WorkspaceFragment,
  WorkspaceInviteCreateInput,
  FormSelectProjects_ProjectFragment,
  WorkspaceProjectInviteCreateInput
} from '~/lib/common/generated/gql/graphql'
import type { InviteWorkspaceItem } from '~~/lib/invites/helpers/types'
import { emptyInviteWorkspaceItem } from '~~/lib/invites/helpers/constants'
import {
  Roles,
  SeatTypes,
  type MaybeNullOrUndefined,
  type WorkspaceRoles
} from '@speckle/shared'
import { useMixpanel } from '~/lib/core/composables/mp'
import { mapMainRoleToGqlWorkspaceRole } from '~/lib/workspaces/helpers/roles'
import { useInviteUserToWorkspace } from '~/lib/workspaces/composables/management'
import { getRoleLabel } from '~~/lib/settings/helpers/utils'
import { matchesDomainPolicy } from '~/lib/invites/helpers/validation'
import { useInviteUserToProject } from '~~/lib/projects/composables/projectManagement'
import { useWorkspacePlan } from '~/lib/workspaces/composables/plan'

graphql(`
  fragment InviteDialogWorkspace_Workspace on Workspace {
    id
    name
    slug
    domainBasedMembershipProtectionEnabled
    defaultSeatType
    domains {
      domain
      id
    }
    seats {
      editors {
        available
      }
    }
    ...InviteDialogSharedSelectUsers_Workspace
    ...WorkspacesPlan_Workspace
  }
`)

const props = defineProps<{
  workspace?: MaybeNullOrUndefined<InviteDialogWorkspace_WorkspaceFragment>
}>()
const isOpen = defineModel<boolean>('open', { required: true })

const mixpanel = useMixpanel()
const inviteToWorkspace = useInviteUserToWorkspace()
const inviteToProject = useInviteUserToProject()

const workspaceSlug = computed(() => props.workspace?.slug || '')
const { isPaidPlan } = useWorkspacePlan(workspaceSlug)

const showAdditionalSeatsDisclaimer = ref(false)
const isSelectingRole = ref(true)
const selectedRole = ref<WorkspaceRoles>(Roles.Workspace.Member)
const project = ref<FormSelectProjects_ProjectFragment>()
const invites = ref<InviteWorkspaceItem[]>([])
const selectUsers = ref<{
  submitForm: () => Promise<InviteWorkspaceItem[]>
}>()

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: backButtonText.value,
    props: { color: 'outline' },
    onClick: () => onBack()
  },
  {
    text: nextButtonText.value,
    onClick: () => onSubmit()
  }
])

const title = computed(() =>
  isSelectingRole.value
    ? 'Who are you inviting to the workspace?'
    : `Invite ${getRoleLabel(selectedRole.value).title.toLowerCase()}s to the workspace`
)

const backButtonText = computed(() => (isSelectingRole.value ? 'Cancel' : 'Back'))
const nextButtonText = computed(() => (isSelectingRole.value ? 'Continue' : 'Invite'))
const allowedDomains = computed(() =>
  props.workspace?.domainBasedMembershipProtectionEnabled
    ? props.workspace.domains?.map((d) => d.domain)
    : null
)

const purchasableEditorCount = computed(() => {
  if (!isPaidPlan.value) return 0
  const seatsAvailable = props.workspace?.seats?.editors?.available || 0
  const editorSeatsToAdd = invites.value.filter(
    (i) => i.seatType === SeatTypes.Editor
  ).length
  return Math.max(0, editorSeatsToAdd - seatsAvailable)
})

const onBack = () => {
  if (isSelectingRole.value) {
    isOpen.value = false
  } else {
    isSelectingRole.value = true
  }
}

const onSubmit = async () => {
  if (isSelectingRole.value) {
    isSelectingRole.value = false
  } else {
    const newInvites = await selectUsers.value?.submitForm()
    if (newInvites?.length) {
      invites.value = newInvites

      if (purchasableEditorCount.value > 0) {
        showAdditionalSeatsDisclaimer.value = true
      } else {
        onSelectUsersSubmit()
      }
    }
  }
}

const canBeMember = (email: string) => matchesDomainPolicy(email, allowedDomains.value)

const onSelectUsersSubmit = async () => {
  if (!invites.value.length || !props.workspace?.id) return

  if (selectedRole.value === Roles.Workspace.Guest && project.value) {
    const inputs: WorkspaceProjectInviteCreateInput[] = invites.value.map((invite) => ({
      role:
        invite.seatType === SeatTypes.Editor
          ? Roles.Stream.Contributor
          : Roles.Stream.Reviewer,
      email: invite.email,
      workspaceRole: selectedRole.value,
      seatType: invite.seatType
    }))

    await inviteToProject(project.value.id, inputs)
  } else {
    const inputs: WorkspaceInviteCreateInput[] = invites.value.map((invite) => ({
      role: canBeMember(invite.email)
        ? mapMainRoleToGqlWorkspaceRole(selectedRole.value)
        : mapMainRoleToGqlWorkspaceRole(Roles.Workspace.Guest),
      email: invite.email,
      seatType: invite.seatType
    }))

    await inviteToWorkspace({ workspaceId: props.workspace.id, inputs })
  }

  isOpen.value = false
  mixpanel.track('Invite Action', {
    type: 'workspace invite',
    name: 'send',
    multiple: invites.value.length !== 1,
    count: invites.value.length,
    to: 'email',
    hasProject: !!project.value,
    workspaceRole: selectedRole.value,
    // eslint-disable-next-line camelcase
    workspace_id: props.workspace.id
  })
}

const initInvites = () => {
  invites.value = [
    {
      ...emptyInviteWorkspaceItem,
      seatType: props.workspace?.defaultSeatType || SeatTypes.Viewer,
      workspaceRole: selectedRole.value,
      serverRole: Roles.Server.User
    }
  ]
}

watch(isOpen, (newVal) => {
  if (newVal) {
    isSelectingRole.value = true
    selectedRole.value = Roles.Workspace.Member
    project.value = undefined
    initInvites()
  }
})

watch(
  () => props.workspace,
  (newVal) => {
    if (newVal) {
      initInvites()
    }
  }
)
</script>
