<template>
  <div>
    <template v-if="!hasWorkspace || isWorkspaceAdmin">
      <InviteDialogSharedSelectUsers
        v-model:open="isSelectUsersOpen"
        title="Invite to project"
        :invites="invites"
        :allowed-domains="allowedDomains"
        invite-target="project"
        @on-submit="onSelectUsersSubmit"
        @on-cancel="isOpen = false"
      />
      <InviteDialogSharedSelectPermissions
        v-model:open="isWorkspacePermissionsOpen"
        :invites="workspaceInvites"
        :allowed-domains="allowedDomains"
        invite-target="workspace"
        @on-submit="onWorkspacePermissionsSubmit"
        @on-back="onWorkspacePermissionsBack"
      />
      <InviteDialogSharedSelectPermissions
        v-model:open="isServerPermissionsOpen"
        :invites="serverInvites"
        invite-target="server"
        @on-submit="onServerPermissionsSubmit"
        @on-back="onServerPermissionsBack"
      />
    </template>
    <InviteDialogProjectWorkspaceMembers
      v-else
      :open="isSelectUsersOpen"
      :project="props.project"
    />
  </div>
</template>
<script setup lang="ts">
import { useApolloClient } from '@vue/apollo-composable'
import { graphql } from '~/lib/common/generated/gql'
import type {
  InviteDialogProject_ProjectFragment,
  ProjectInviteCreateInput,
  WorkspaceProjectInviteCreateInput
} from '~/lib/common/generated/gql/graphql'
import type { InviteGenericItem } from '~~/lib/invites/helpers/types'
import { emptyInviteGenericItem } from '~~/lib/invites/helpers/constants'
import { Roles, type ServerRoles } from '@speckle/shared'
// import { useMixpanel } from '~/lib/core/composables/mp'
import { matchesDomainPolicy } from '~/lib/invites/helpers/validation'
import { getUsersByEmailQuery } from '~/lib/invites/graphql/queries'
import { useInviteUserToProject } from '~~/lib/projects/composables/projectManagement'

graphql(`
  fragment InviteDialogProject_Project on Project {
    id
    name
    ...InviteDialogProjectWorkspaceMembers_Project
    workspace {
      id
      name
      defaultProjectRole
      role
      domainBasedMembershipProtectionEnabled
      domains {
        domain
        id
      }
    }
  }
`)

const props = defineProps<{
  project: InviteDialogProject_ProjectFragment
}>()
const isOpen = defineModel<boolean>('open', { required: true })

// const mixpanel = useMixpanel()
const apollo = useApolloClient().client
const { isAdmin } = useActiveUser()
const createInvite = useInviteUserToProject()

const isSelectUsersOpen = ref(false)
const isWorkspacePermissionsOpen = ref(false)
const isServerPermissionsOpen = ref(false)
const invites = ref<InviteGenericItem[]>([])

const hasWorkspace = computed(() => !!props.project.workspace)
const isWorkspaceAdmin = computed(
  () => hasWorkspace.value && props.project.workspace?.role === Roles.Workspace.Admin
)
const allowedDomains = computed(() =>
  hasWorkspace.value && props.project.workspace?.domainBasedMembershipProtectionEnabled
    ? props.project.workspace.domains?.map((d) => d.domain)
    : null
)
const workspaceInvites = computed(() =>
  invites.value.filter((invite) => invite.needsWorkspaceRole)
)
const serverInvites = computed(() =>
  invites.value.filter((invite) => invite.needsServerRole)
)

const onWorkspacePermissionsBack = () => {
  isWorkspacePermissionsOpen.value = false
  isSelectUsersOpen.value = true
}

const onServerPermissionsBack = () => {
  isServerPermissionsOpen.value = false
  if (props.project.workspace) {
    isWorkspacePermissionsOpen.value = true
  } else {
    isSelectUsersOpen.value = true
  }
}

const onSelectUsersSubmit = async (updatedInvites: InviteGenericItem[]) => {
  const { data } = await apollo.query({
    query: getUsersByEmailQuery,
    variables: {
      input: {
        emails: updatedInvites.map((invite) => invite.email)
      },
      workspaceId: props.project.workspace?.id
    }
  })

  if (data.usersByEmail) {
    invites.value = updatedInvites.map((invite, index) => ({
      ...invite,
      needsWorkspaceRole: invite.needsWorkspaceRole ?? !invite.workspaceRole,
      needsServerRole: invite.needsServerRole ?? !invite.serverRole,
      userId: data.usersByEmail[index]?.id,
      serverRole: (data.usersByEmail[index]?.role as ServerRoles) ?? Roles.Server.User,
      workspaceRole:
        invite.workspaceRole ||
        (matchesDomainPolicy(invite.email, allowedDomains.value)
          ? Roles.Workspace.Member
          : Roles.Workspace.Guest)
    }))
  }

  isSelectUsersOpen.value = false

  if (props.project.workspace && workspaceInvites.value.length) {
    isWorkspacePermissionsOpen.value = true
    return
  }

  if (serverInvites.value.length) {
    if (isAdmin.value) {
      isServerPermissionsOpen.value = true
      return
    } else {
      invites.value = invites.value.map((invite) => ({
        ...invite,
        serverRole: invite.serverRole ?? Roles.Server.User
      }))
    }
  }

  sendInvites()
}

const onWorkspacePermissionsSubmit = (updatedInvites: InviteGenericItem[]) => {
  invites.value = updatedInvites
  isWorkspacePermissionsOpen.value = false

  if (serverInvites.value.length) {
    if (isAdmin.value) {
      isServerPermissionsOpen.value = true
    } else {
      sendInvites()
    }
  } else {
    sendInvites()
  }
}

const onServerPermissionsSubmit = (updatedInvites: InviteGenericItem[]) => {
  invites.value = updatedInvites
  isServerPermissionsOpen.value = false
  sendInvites()
}

const sendInvites = async () => {
  const inputs: ProjectInviteCreateInput[] | WorkspaceProjectInviteCreateInput[] =
    invites.value.map((invite) => ({
      role: invite.projectRole,
      ...(invite.userId
        ? {
            userId: invite.userId
          }
        : {
            email: invite.email,
            serverRole: invite.serverRole
          }),
      ...(props.project.workspace?.id
        ? {
            workspaceRole: invite.workspaceRole
          }
        : {})
    }))

  await createInvite(props.project.id, inputs)
  isOpen.value = false
}

watch(isOpen, (newVal) => {
  if (newVal) {
    isSelectUsersOpen.value = true
    invites.value = [
      { ...emptyInviteGenericItem, projectRole: Roles.Stream.Contributor }
    ]
  }
})
</script>
