<template>
  <LayoutDialog
    v-model:open="isOpen"
    :buttons="dialogButtons"
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
    >
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
  WorkspaceInviteCreateInput
} from '~/lib/common/generated/gql/graphql'
import type { InviteWorkspaceItem } from '~~/lib/invites/helpers/types'
import { emptyInviteWorkspaceItem } from '~~/lib/invites/helpers/constants'
import { Roles, type MaybeNullOrUndefined, type WorkspaceRoles } from '@speckle/shared'
import { useMixpanel } from '~/lib/core/composables/mp'
import { mapMainRoleToGqlWorkspaceRole } from '~/lib/workspaces/helpers/roles'
import { mapServerRoleToGqlServerRole } from '~/lib/common/helpers/roles'
import { useInviteUserToWorkspace } from '~/lib/workspaces/composables/management'
import { getRoleLabel } from '~~/lib/settings/helpers/utils'
import { matchesDomainPolicy } from '~/lib/invites/helpers/validation'

graphql(`
  fragment InviteDialogWorkspace_Workspace on Workspace {
    id
    name
    domainBasedMembershipProtectionEnabled
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

const isSelectingRole = ref(true)
const selectedRole = ref<WorkspaceRoles>(Roles.Workspace.Member)
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
    return 'Members can access all projects in the workspace and act as admins. Their seat type controls whether they can create and edit projects or just view them.'
  }

  return `They don't work at ${props.workspace?.name}. They can collaborate on projects but can't create projects, invite others, add people, or be admins.`
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

  const inputs: WorkspaceInviteCreateInput[] = invites.value.map((invite) => ({
    role: canBeMember(invite.email)
      ? mapMainRoleToGqlWorkspaceRole(selectedRole.value)
      : mapMainRoleToGqlWorkspaceRole(Roles.Workspace.Guest),
    email: invite.email,
    serverRole: invite.serverRole
      ? mapServerRoleToGqlServerRole(invite.serverRole)
      : undefined
  }))

  if (!inputs.length || !props.workspace?.id) return

  await inviteToWorkspace({ workspaceId: props.workspace.id, inputs })
  isOpen.value = false
  mixpanel.track('Invite Action', {
    type: 'workspace invite',
    name: 'send',
    multiple: inputs.length !== 1,
    count: inputs.length,
    to: 'email',
    // eslint-disable-next-line camelcase
    workspace_id: props.workspace.id
  })
}

watch(isOpen, (newVal) => {
  if (newVal) {
    isSelectingRole.value = true
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
