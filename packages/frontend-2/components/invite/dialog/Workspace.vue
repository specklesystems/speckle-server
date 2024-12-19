<template>
  <div>
    <InviteDialogSharedSelectUsers
      v-model:open="isSelectUsersOpen"
      title="Invite to Workspace"
      :invites="invites"
      :allowed-domains="allowedDomains"
      invite-target="workspace"
      @on-submit="onSelectUsersSubmit"
      @on-cancel="isOpen = false"
    >
      <div v-if="showBillingInfo" class="text-body-2xs text-foreground-2 leading-5">
        <p>
          Inviting users may add seats to your current billing cycle. If there are
          available seats, they will be used first. Your workspace is currently billed
          for {{ memberSeatText }}{{ hasGuestSeats ? ` and ${guestSeatText}` : '' }}.
        </p>
      </div>
    </InviteDialogSharedSelectUsers>
  </div>
</template>
<script setup lang="ts">
import { graphql } from '~/lib/common/generated/gql'
import {
  type InviteDialogWorkspace_WorkspaceFragment,
  type WorkspaceInviteCreateInput,
  type WorkspacePlans,
  WorkspacePlanStatuses
} from '~/lib/common/generated/gql/graphql'
import type { InviteGenericItem } from '~~/lib/invites/helpers/types'
import { emptyInviteGenericItem } from '~~/lib/invites/helpers/constants'
import { Roles } from '@speckle/shared'
import { useMixpanel } from '~/lib/core/composables/mp'
import { mapMainRoleToGqlWorkspaceRole } from '~/lib/workspaces/helpers/roles'
import { mapServerRoleToGqlServerRole } from '~/lib/common/helpers/roles'
import { useInviteUserToWorkspace } from '~/lib/workspaces/composables/management'
import { isPaidPlan } from '~/lib/billing/helpers/types'

graphql(`
  fragment InviteDialogWorkspace_Workspace on Workspace {
    id
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
  workspace: InviteDialogWorkspace_WorkspaceFragment
}>()
const isOpen = defineModel<boolean>('open', { required: true })

const mixpanel = useMixpanel()
const inviteToWorkspace = useInviteUserToWorkspace()

const isSelectUsersOpen = ref(false)
const invites = ref<InviteGenericItem[]>([
  {
    ...emptyInviteGenericItem,
    workspaceRole: Roles.Workspace.Member,
    serverRole: Roles.Server.User
  }
])

const allowedDomains = computed(() =>
  props.workspace.domainBasedMembershipProtectionEnabled
    ? props.workspace.domains?.map((d) => d.domain)
    : null
)
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
  if (!props.workspace?.plan) return false
  return (
    isPaidPlan(props.workspace.plan.name as unknown as WorkspacePlans) &&
    props.workspace.plan.status === WorkspacePlanStatuses.Valid
  )
})
const onSelectUsersSubmit = async (updatedInvites: InviteGenericItem[]) => {
  invites.value = updatedInvites

  const inputs: WorkspaceInviteCreateInput[] = invites.value.map((invite) => ({
    role: invite.workspaceRole
      ? mapMainRoleToGqlWorkspaceRole(invite.workspaceRole)
      : undefined,
    email: invite.email,
    serverRole: invite.serverRole
      ? mapServerRoleToGqlServerRole(invite.serverRole)
      : undefined
  }))

  if (!inputs.length) return

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
    isSelectUsersOpen.value = true
    invites.value = [
      {
        ...emptyInviteGenericItem,
        workspaceRole: Roles.Workspace.Member,
        serverRole: Roles.Server.User
      }
    ]
  }
})
</script>
