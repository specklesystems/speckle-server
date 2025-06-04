<template>
  <LayoutDialog
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
      <p class="text-body-2xs text-foreground-2 leading-5">
        {{ infoText }}
      </p>
    </InviteDialogSharedSelectUsers>
  </LayoutDialog>
</template>

<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'
import { graphql } from '~/lib/common/generated/gql'
import type {
  InviteDialogWorkspace_WorkspaceFragment,
  WorkspaceInviteCreateInput,
  ProjectInviteCreateInput,
  FormSelectProjects_ProjectFragment
} from '~/lib/common/generated/gql/graphql'
import type { InviteWorkspaceItem } from '~~/lib/invites/helpers/types'
import { emptyInviteWorkspaceItem } from '~~/lib/invites/helpers/constants'
import { Roles, type MaybeNullOrUndefined, type WorkspaceRoles } from '@speckle/shared'
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
const { isSelfServePlan } = useWorkspacePlan(workspaceSlug.value)

const isSelectingRole = ref(true)
const selectedRole = ref<WorkspaceRoles>(Roles.Workspace.Member)
const project = ref<FormSelectProjects_ProjectFragment>()
const invites = ref<InviteWorkspaceItem[]>([
  {
    ...emptyInviteWorkspaceItem,
    workspaceRole: selectedRole.value,
    serverRole: Roles.Server.User
  }
])
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
const infoText = computed(() => {
  if (selectedRole.value === Roles.Workspace.Member) {
    if (props.workspace?.defaultSeatType === 'editor') {
      if (isSelfServePlan.value) {
        return `Members join your workspace on an Editor seat by default. Editor seats may incur charges based on your workspace plan. You can change their seat type to Viewer after they join if they only need to view and comment.`
      }
      return `Members join your workspace on an Editor seat by default. Editor seats have additional permissions compared to Viewer seats. You can change their seat type to Viewer after they join if they only need to view and comment.`
    }
    return `Inviting is free. Members join your workspace on a free Viewer seat. You can give them an Editor seat later if they need to contribute to projects beyond viewing and commenting.`
  }

  if (props.workspace?.defaultSeatType === 'editor') {
    if (isSelfServePlan.value) {
      return `Guests join your workspace on an Editor seat by default. Editor seats may incur charges based on your workspace plan. You can change their seat type to Viewer after they join if they only need to view and comment.`
    }
    return `Guests join your workspace on an Editor seat by default. Editor seats have additional permissions compared to Viewer seats. You can change their seat type to Viewer after they join if they only need to view and comment.`
  }
  return `Inviting is free. Guests join your workspace on a free Viewer seat. You can give them an Editor seat later if they need to contribute to a project beyond viewing and commenting.`
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
    const invites = await selectUsers.value?.submitForm()
    if (invites?.length) {
      onSelectUsersSubmit(invites)
    }
  }
}

const canBeMember = (email: string) => matchesDomainPolicy(email, allowedDomains.value)

const onSelectUsersSubmit = async (updatedInvites: InviteWorkspaceItem[]) => {
  invites.value = updatedInvites

  if (!invites.value.length || !props.workspace?.id) return

  if (selectedRole.value === Roles.Workspace.Guest && project.value) {
    const inputs: ProjectInviteCreateInput[] = invites.value.map((invite) => ({
      role: Roles.Stream.Reviewer,
      email: invite.email,
      workspaceRole: selectedRole.value
    }))

    await inviteToProject(project.value.id, inputs)
  } else {
    const inputs: WorkspaceInviteCreateInput[] = invites.value.map((invite) => ({
      role: canBeMember(invite.email)
        ? mapMainRoleToGqlWorkspaceRole(selectedRole.value)
        : mapMainRoleToGqlWorkspaceRole(Roles.Workspace.Guest),
      email: invite.email
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

watch(isOpen, (newVal) => {
  if (newVal) {
    isSelectingRole.value = true
    selectedRole.value = Roles.Workspace.Member
    project.value = undefined
    invites.value = [
      {
        ...emptyInviteWorkspaceItem,
        workspaceRole: Roles.Workspace.Member,
        serverRole: Roles.Server.User
      }
    ]
  }
})
</script>
