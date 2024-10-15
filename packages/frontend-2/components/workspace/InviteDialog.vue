<template>
  <LayoutDialog
    v-model:open="open"
    max-width="sm"
    title="Invite people to workspace"
    :buttons="buttons"
  >
    <div>
      <FormTextInput
        name="search"
        size="lg"
        placeholder="Search by email or username..."
        :disabled="disabled"
        input-classes="pr-[85px] text-sm"
        color="foundation"
        label="Add people"
        show-label
        v-bind="bind"
        v-on="on"
      >
        <template #input-right>
          <div
            class="absolute inset-y-0 right-0 flex items-center pr-2"
            :class="disabled ? 'pointer-events-none' : ''"
          >
            <WorkspacePermissionSelect v-model="role" />
          </div>
        </template>
      </FormTextInput>
      <div
        v-if="hasTargets"
        class="flex flex-col mt-2 border rounded-md border-outline-3"
      >
        <template v-if="users.length">
          <WorkspaceInviteDialogUserRow
            v-for="user in users"
            :key="user.id"
            :user="user"
            :disabled="disabled"
            :is-owner-role="isOwnerRole"
            :target-role="role"
            @invite-user="() => onInviteUser(user)"
          />
        </template>
        <WorkspaceInviteDialogEmailsRow
          v-else-if="emails.length"
          :selected-emails="emails"
          :disabled="disabled"
          :is-owner-role="isOwnerRole"
          :is-guest-mode="isGuestMode"
          :unmatching-domain-policy="unmatchingDomainPolicy"
          class="p-2"
          @invite-emails="({ serverRole }) => onInviteUser(emails, serverRole)"
        />
      </div>
    </div>
  </LayoutDialog>
</template>
<script setup lang="ts">
import {
  isNonNullable,
  Roles,
  type ServerRoles,
  type WorkspaceRoles
} from '@speckle/shared'
import { useDebouncedTextInput, type LayoutDialogButton } from '@speckle/ui-components'
import { isString } from 'lodash-es'
import { graphql } from '~/lib/common/generated/gql'
import type {
  WorkspaceInviteCreateInput,
  WorkspaceInviteDialog_WorkspaceFragment
} from '~/lib/common/generated/gql/graphql'
import { mapServerRoleToGqlServerRole } from '~/lib/common/helpers/roles'
import { useMixpanel } from '~/lib/core/composables/mp'
import { useServerInfo } from '~/lib/core/composables/server'
import { useResolveInviteTargets } from '~/lib/server/composables/invites'
import { useInviteUserToWorkspace } from '~/lib/workspaces/composables/management'
import {
  filterInvalidInviteTargets,
  type UserSearchItemOrEmail
} from '~/lib/workspaces/helpers/invites'
import { mapMainRoleToGqlWorkspaceRole } from '~/lib/workspaces/helpers/roles'

graphql(`
  fragment WorkspaceInviteDialog_Workspace on Workspace {
    domainBasedMembershipProtectionEnabled
    domains {
      domain
      id
    }
    id
    team {
      items {
        id
        user {
          id
          role
        }
      }
    }
    invitedTeam(filter: $invitesFilter) {
      title
      user {
        id
      }
    }
  }
`)

const props = defineProps<{
  workspaceId: string
  workspace?: WorkspaceInviteDialog_WorkspaceFragment
}>()

const open = defineModel<boolean>('open', { required: true })

const mp = useMixpanel()
const inviteToWorkspace = useInviteUserToWorkspace()
const { on, bind, value: search } = useDebouncedTextInput({ debouncedBy: 500 })
const { users, emails, hasTargets } = useResolveInviteTargets({
  search,
  excludeUserIds: computed(() => [
    ...(props.workspace?.team?.items.map((c) => c.user.id) || []),
    ...(props.workspace?.invitedTeam?.map((c) => c.user?.id).filter(isNonNullable) ||
      [])
  ]),
  excludeEmails: computed(() => props.workspace?.invitedTeam?.map((c) => c.title)),
  workspaceId: props.workspaceId
})
const { isGuestMode } = useServerInfo()

const disabled = ref(false)
const role = ref<WorkspaceRoles>(Roles.Workspace.Member)

const buttons = computed((): LayoutDialogButton[] => [
  {
    text: 'Done',
    props: { color: 'primary' },
    onClick: () => {
      open.value = false
    }
  }
])

const isOwnerRole = computed(() => role.value === Roles.Workspace.Admin)
const allowedDomains = computed(() => props.workspace?.domains?.map((c) => c.domain))
const unmatchingDomainPolicy = computed(() => {
  if (props.workspace?.domainBasedMembershipProtectionEnabled) {
    return role.value === Roles.Workspace.Guest
      ? false
      : !emails.value?.every((email) =>
          allowedDomains.value?.includes(email.split('@')[1])
        )
  }

  return false
})
const onInviteUser = async (
  user: UserSearchItemOrEmail | UserSearchItemOrEmail[],
  serverRole: ServerRoles = Roles.Server.User
) => {
  const users = filterInvalidInviteTargets(user, {
    isTargetResourceOwner: isOwnerRole.value,
    emailTargetServerRole: serverRole
  })

  const inputs: WorkspaceInviteCreateInput[] = users.map((u) => ({
    role: mapMainRoleToGqlWorkspaceRole(role.value),
    ...(isString(u)
      ? {
          email: u,
          serverRole: mapServerRoleToGqlServerRole(serverRole)
        }
      : {
          userId: u.id
        })
  }))
  if (!inputs.length) return

  disabled.value = true

  await inviteToWorkspace(props.workspaceId, inputs)

  const isEmail = !!inputs.find((u) => !!u.email)
  mp.track('Invite Action', {
    type: 'workspace invite',
    name: 'send',
    multiple: inputs.length !== 1,
    count: inputs.length,
    hasProject: true,
    to: isEmail ? 'email' : 'existing user',
    // eslint-disable-next-line camelcase
    workspace_id: props.workspaceId
  })

  disabled.value = false
}
</script>
