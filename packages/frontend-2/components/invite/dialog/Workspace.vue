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
    />
  </div>
</template>
<script setup lang="ts">
import { graphql } from '~/lib/common/generated/gql'
import type {
  InviteDialogWorkspace_WorkspaceFragment,
  WorkspaceInviteCreateInput
} from '~/lib/common/generated/gql/graphql'
import type { InviteGenericItem } from '~~/lib/invites/helpers/types'
import { emptyInviteGenericItem } from '~~/lib/invites/helpers/constants'
import { Roles } from '@speckle/shared'
import { useMixpanel } from '~/lib/core/composables/mp'
import { mapMainRoleToGqlWorkspaceRole } from '~/lib/workspaces/helpers/roles'
import { mapServerRoleToGqlServerRole } from '~/lib/common/helpers/roles'
import { useInviteUserToWorkspace } from '~/lib/workspaces/composables/management'

graphql(`
  fragment InviteDialogWorkspace_Workspace on Workspace {
    id
    domainBasedMembershipProtectionEnabled
    domains {
      domain
      id
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

const onSelectUsersSubmit = async (updatedInvites: InviteGenericItem[]) => {
  invites.value = updatedInvites

  const inputs: WorkspaceInviteCreateInput[] = invites.value.map((invite) => ({
    role: mapMainRoleToGqlWorkspaceRole(invite.workspaceRole),
    email: invite.email,
    serverRole: mapServerRoleToGqlServerRole(invite.serverRole)
  }))

  if (!inputs.length) return

  await inviteToWorkspace({ workspaceId: props.workspace.id, inputs })
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
  }
})
</script>
