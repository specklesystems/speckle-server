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
      :show-workspace-roles="!isWorkspaceNewPlansEnabled"
    >
      <div v-if="showBillingInfo" class="text-body-2xs text-foreground-2 leading-5">
        <p>
          Inviting users may add seats to your current billing cycle. If there are
          available seats, they will be used first. Your workspace is currently billed
          for {{ memberSeatText }}{{ hasGuestSeats ? ` and ${guestSeatText}` : '' }}.
        </p>
      </div>
    </InviteDialogSharedSelectUsers>
  </LayoutDialog>
</template>

<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'
import { graphql } from '~/lib/common/generated/gql'
import {
  type InviteDialogWorkspace_WorkspaceFragment,
  type WorkspaceInviteCreateInput,
  type WorkspacePlans,
  WorkspacePlanStatuses
} from '~/lib/common/generated/gql/graphql'
import type { InviteWorkspaceItem } from '~~/lib/invites/helpers/types'
import { emptyInviteWorkspaceItem } from '~~/lib/invites/helpers/constants'
import { Roles, type MaybeNullOrUndefined, type WorkspaceRoles } from '@speckle/shared'
import { useMixpanel } from '~/lib/core/composables/mp'
import { mapMainRoleToGqlWorkspaceRole } from '~/lib/workspaces/helpers/roles'
import { mapServerRoleToGqlServerRole } from '~/lib/common/helpers/roles'
import { useInviteUserToWorkspace } from '~/lib/workspaces/composables/management'
import { isPaidPlan } from '~/lib/billing/helpers/types'
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
    plan {
      status
      name
    }
    subscription {
      seats {
        guest
        plan
      }
    }
  }
`)

const props = defineProps<{
  workspace?: MaybeNullOrUndefined<InviteDialogWorkspace_WorkspaceFragment>
}>()
const isOpen = defineModel<boolean>('open', { required: true })

const mixpanel = useMixpanel()
const inviteToWorkspace = useInviteUserToWorkspace()
const isWorkspaceNewPlansEnabled = useWorkspaceNewPlansEnabled()

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

const title = computed(() => {
  if (isWorkspaceNewPlansEnabled.value) {
    return isSelectingRole.value
      ? 'Who are you inviting to the workspace?'
      : `Invite ${getRoleLabel(
          selectedRole.value
        ).title.toLowerCase()}s to the workspace`
  }
  return 'Invite to Workspace'
})

const backButtonText = computed(() =>
  isWorkspaceNewPlansEnabled.value && !isSelectingRole.value ? 'Back' : 'Cancel'
)
const nextButtonText = computed(() =>
  isWorkspaceNewPlansEnabled.value && isSelectingRole.value ? 'Continue' : 'Invite'
)
const allowedDomains = computed(() =>
  props.workspace?.domainBasedMembershipProtectionEnabled
    ? props.workspace.domains?.map((d) => d.domain)
    : null
)
// TODO: All of these billing info will not be used in the new flow, needs to be removed post-release
const memberSeatText = computed(() => {
  if (!props.workspace?.subscription) return ''
  return `${props.workspace.subscription.seats.plan} member ${
    props.workspace.subscription.seats.plan === 1 ? 'seat' : 'seats'
  }`
})
const guestSeatText = computed(() => {
  if (!props.workspace?.subscription) return ''
  return `${props.workspace.subscription.seats.guest} guest ${
    props.workspace.subscription.seats.guest === 1 ? 'seat' : 'seats'
  }`
})
const hasGuestSeats = computed(() => {
  return (
    props.workspace?.subscription?.seats.guest &&
    props.workspace.subscription.seats.guest > 0
  )
})
const showBillingInfo = computed(() => {
  if (
    !props.workspace?.plan ||
    !props.workspace?.subscription ||
    isWorkspaceNewPlansEnabled.value
  )
    return false
  return (
    isPaidPlan(props.workspace.plan.name as unknown as WorkspacePlans) &&
    props.workspace.plan.status === WorkspacePlanStatuses.Valid
  )
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
    role: isWorkspaceNewPlansEnabled.value
      ? canBeMember(invite.email)
        ? mapMainRoleToGqlWorkspaceRole(selectedRole.value)
        : mapMainRoleToGqlWorkspaceRole(Roles.Workspace.Guest)
      : invite.workspaceRole
      ? mapMainRoleToGqlWorkspaceRole(invite.workspaceRole)
      : undefined,
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
    // Only show the first step for new plans
    isSelectingRole.value = isWorkspaceNewPlansEnabled.value
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
