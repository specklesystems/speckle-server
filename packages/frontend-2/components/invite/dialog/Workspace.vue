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
import type { InviteDialogWorkspace_WorkspaceFragment } from '~/lib/common/generated/gql/graphql'
import type { InviteGenericItem } from '~~/lib/invites/helpers/types'
import { emptyInviteGenericItem } from '~~/lib/invites/helpers/constants'
import { Roles } from '@speckle/shared'

const isOpen = defineModel<boolean>('open', { required: true })

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

const isSelectUsersOpen = ref(false)
const invites = ref<InviteGenericItem[]>([
  {
    ...emptyInviteGenericItem,
    workspaceRole: Roles.Workspace.Member
  }
])

const allowedDomains = computed(() => props.workspace.domains?.map((d) => d.domain))

const onSelectUsersSubmit = (updatedInvites: InviteGenericItem[]) => {
  invites.value = updatedInvites
}

watch(isOpen, (newVal) => {
  if (newVal) {
    isSelectUsersOpen.value = true
  }
})
</script>
