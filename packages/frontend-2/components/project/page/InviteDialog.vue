<template>
  <LayoutDialog v-model:open="isOpen" max-width="md" :buttons="dialogButtons">
    <template #header>Invite to project</template>
    <div class="flex flex-col gap-4 mb-2">
      <div v-if="!isWorkspaceMemberAndProjectOwner" class="flex flex-col gap-4">
        <FormSelectWorkspaceRoles
          v-if="project?.workspaceId"
          v-model="workspaceRole"
          show-label
          label="Workspace role"
          size="lg"
          help="If target user does not have a role in the parent workspace, they will be assigned this role."
          :allow-unset="false"
        />
        <FormTextInput
          v-model="search"
          name="search"
          size="lg"
          placeholder="Search by email or username..."
          :disabled="disabled"
          :help="disabled ? 'You must be the project owner to invite users' : ''"
          input-classes="pr-[85px] text-sm"
          color="foundation"
          label="Add people"
          show-label
        >
          <template #input-right>
            <div
              class="absolute inset-y-0 right-0 flex items-center pr-2"
              :class="disabled ? 'pointer-events-none' : ''"
            >
              <ProjectPageTeamPermissionSelect
                v-model="role"
                mount-menu-on-body
                :show-label="false"
                :disabled-roles="isTargettingWorkspaceGuest ? [Roles.Stream.Owner] : []"
                :disabled-item-tooltip="
                  isTargettingWorkspaceGuest
                    ? 'Workspace guests cannot be project owners'
                    : ''
                "
              />
            </div>
          </template>
        </FormTextInput>

        <div
          v-if="hasTargets"
          class="flex flex-col border bg-foundation border-primary-muted rounded-md"
        >
          <template v-if="searchUsers.length">
            <ProjectPageTeamDialogInviteUserServerUserRow
              v-for="user in searchUsers"
              :key="user.id"
              :user="user"
              :stream-role="role"
              :disabled="loading"
              :target-workspace-role="workspaceRole"
              @invite-user="($event) => onInviteUser($event.user)"
            />
          </template>
          <ProjectPageTeamDialogInviteUserEmailsRow
            v-else-if="selectedEmails?.length"
            :selected-emails="selectedEmails"
            :stream-role="role"
            :disabled="loading"
            :is-guest-mode="isGuestMode"
            :unmatching-domain-policy="unmatchingDomainPolicy"
            class="p-2"
            @invite-emails="($event) => onInviteUser($event.emails, $event.serverRole)"
          />
        </div>
      </div>
      <div v-else class="flex flex-col gap-4">
        <FormSelectProjectRoles
          v-model="role"
          show-label
          label="Project role"
          size="lg"
        />
        <div>
          <div class="text-body-xs font-medium mb-1">Add users from workspace</div>
          <div
            v-if="invitableWorkspaceMembers.length"
            class="flex flex-col border bg-foundation border-primary-muted rounded-md"
          >
            <ProjectPageTeamDialogInviteUserServerUserRow
              v-for="user in invitableWorkspaceMembers"
              :key="user.user.id"
              :user="user.user"
              :stream-role="role"
              :disabled="!!(loading || disabledWorkspaceMemberRowMessage(user))"
              :disabled-message="disabledWorkspaceMemberRowMessage(user)"
              :target-workspace-role="workspaceRole"
              @invite-user="($event) => onInviteUser($event.user)"
            />
          </div>
          <p v-else class="text-sm text-gray-500 mt-4">No available users found.</p>
        </div>
      </div>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { Roles } from '@speckle/shared'
import type { ServerRoles, StreamRoles, WorkspaceRoles } from '@speckle/shared'
import type { UserSearchItem } from '~~/lib/common/composables/users'
import type {
  ProjectInviteCreateInput,
  ProjectPageInviteDialog_ProjectFragment,
  WorkspaceProjectInviteCreateInput
} from '~~/lib/common/generated/gql/graphql'
import type { SetFullyRequired } from '~~/lib/common/helpers/type'
import { isString } from 'lodash-es'
import { useInviteUserToProject } from '~~/lib/projects/composables/projectManagement'
import { useTeamInternals } from '~~/lib/projects/composables/team'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { useServerInfo } from '~~/lib/core/composables/server'
import { graphql } from '~/lib/common/generated/gql/gql'
import type { LayoutDialogButton } from '@speckle/ui-components'
import { useResolveInviteTargets } from '~/lib/server/composables/invites'
import { filterInvalidInviteTargets } from '~/lib/workspaces/helpers/invites'

graphql(`
  fragment ProjectPageInviteDialog_Project on Project {
    id
    workspaceId
    workspace {
      id
      defaultProjectRole
      team {
        items {
          role
          user {
            id
            name
            bio
            company
            avatar
            verified
            role
          }
        }
      }
    }
    ...ProjectPageTeamInternals_Project
    workspace {
      id
      domainBasedMembershipProtectionEnabled
      domains {
        domain
        id
      }
    }
  }
`)

type InvitableUser = UserSearchItem | string

const props = defineProps<{
  projectId: string
  project?: ProjectPageInviteDialog_ProjectFragment
  disabled?: boolean
}>()

const isOpen = defineModel<boolean>('open', { required: true })
const mp = useMixpanel()

const projectId = computed(() => props.projectId as string)
const projectData = computed(() => props.project)
const { collaboratorListItems } = useTeamInternals(projectData)

const workspaceMembers = computed(() => {
  return props.project?.workspace?.team?.items || []
})

const invitableWorkspaceMembers = computed(() => {
  const currentProjectMemberIds = new Set(
    collaboratorListItems.value.map((item) => item.user?.id)
  )

  return workspaceMembers.value.filter((member) => {
    if (!member.user.id || currentProjectMemberIds.has(member.user.id)) return false

    return true
  })
})

const loading = ref(false)
const search = ref('')
const role = ref<StreamRoles>(Roles.Stream.Contributor)
const workspaceRole = ref<WorkspaceRoles>(Roles.Workspace.Guest)

const { isGuestMode } = useServerInfo()
const createInvite = useInviteUserToProject()

const { activeUser } = useActiveUser()

const {
  users: searchUsers,
  emails: selectedEmails,
  hasTargets
} = useResolveInviteTargets({
  search,
  excludeUserIds: computed(() =>
    collaboratorListItems.value
      .filter((i): i is SetFullyRequired<typeof i, 'user'> => !!i.user?.id)
      .map((t) => t.user.id)
  ),
  workspaceId: props.project?.workspaceId
})

const isWorkspaceMemberAndProjectOwner = computed(() => {
  const userIsWorkspaceMember =
    workspaceMembers.value.some(
      (item) =>
        item.user?.id === activeUser.value?.id && item.role === Roles.Workspace.Member
    ) ?? false

  const userIsProjectOwner = projectData.value?.role === Roles.Stream.Owner

  return userIsWorkspaceMember && userIsProjectOwner
})

const dialogButtons = computed<LayoutDialogButton[]>(() => [
  {
    text: 'Cancel',
    props: { color: 'outline' },
    onClick: () => {
      isOpen.value = false
    }
  }
])

const isOwnerSelected = computed(() => role.value === Roles.Stream.Owner)
const allowedDomains = computed(() =>
  props.project?.workspace?.domains?.map((c) => c.domain)
)
const unmatchingDomainPolicy = computed(() => {
  if (props.project?.workspace?.domainBasedMembershipProtectionEnabled) {
    return workspaceRole.value === Roles.Workspace.Guest
      ? false
      : !selectedEmails.value?.every((email) =>
          allowedDomains.value?.includes(email.split('@')[1])
        )
  }

  return false
})
const isTargettingWorkspaceGuest = computed(
  () => workspaceRole.value === Roles.Workspace.Guest
)

const onInviteUser = async (
  user: InvitableUser | InvitableUser[],
  serverRole?: ServerRoles
) => {
  serverRole = serverRole || Roles.Server.User
  const users = filterInvalidInviteTargets(user, {
    isTargetResourceOwner: isOwnerSelected.value,
    emailTargetServerRole: serverRole
  })

  const inputs: ProjectInviteCreateInput[] | WorkspaceProjectInviteCreateInput[] =
    users.map((u) => ({
      role: role.value,
      ...(isString(u)
        ? {
            email: u,
            serverRole
          }
        : {
            userId: u.id
          }),
      ...(props.project?.workspaceId
        ? {
            workspaceRole: workspaceRole.value
          }
        : {})
    }))
  if (!inputs.length) return

  const isEmail = !!inputs.find((u) => !!u.email)

  // Invite email
  loading.value = true
  await createInvite(projectId.value, inputs)

  mp.track('Invite Action', {
    type: 'project invite',
    name: 'send',
    multiple: inputs.length !== 1,
    count: inputs.length,
    hasProject: true,
    to: isEmail ? 'email' : 'existing user'
  })

  loading.value = false
}

const disabledWorkspaceMemberRowMessage = (
  item: (typeof invitableWorkspaceMembers.value)[0]
) => {
  return item.role === Roles.Workspace.Guest && role.value === Roles.Stream.Owner
    ? 'You cannot invite a workspace guest as a project owner.'
    : undefined
}

watch(
  () => props.project?.workspace?.defaultProjectRole,
  (newRole, oldRole) => {
    if (newRole && newRole !== oldRole) {
      role.value = newRole as StreamRoles
    }
  },
  { immediate: true }
)

watch(workspaceRole, (newRole, oldRole) => {
  if (newRole === oldRole) return

  if (newRole === Roles.Workspace.Guest && role.value === Roles.Stream.Owner) {
    role.value = Roles.Stream.Reviewer
  }
})
</script>
