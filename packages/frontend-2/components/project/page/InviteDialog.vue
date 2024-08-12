<template>
  <LayoutDialog v-model:open="isOpen" max-width="md" :buttons="dialogButtons">
    <template #header>Invite to project</template>
    <div class="flex flex-col my-2">
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
            <ProjectPageTeamPermissionSelect v-model="role" hide-remove />
          </div>
        </template>
      </FormTextInput>
      <div
        v-if="hasTargets"
        class="flex flex-col border bg-foundation border-primary-muted mt-2 rounded-md"
      >
        <template v-if="searchUsers.length">
          <ProjectPageTeamDialogInviteUserServerUserRow
            v-for="user in searchUsers"
            :key="user.id"
            :user="user"
            :stream-role="role"
            :disabled="loading"
            @invite-user="($event) => onInviteUser($event.user)"
          />
        </template>
        <ProjectPageTeamDialogInviteUserEmailsRow
          v-else-if="selectedEmails?.length"
          :selected-emails="selectedEmails"
          :stream-role="role"
          :disabled="loading"
          :is-guest-mode="isGuestMode"
          class="p-2"
          @invite-emails="($event) => onInviteUser($event.emails, $event.serverRole)"
        />
      </div>
    </div>
  </LayoutDialog>
</template>
<script setup lang="ts">
import { Roles } from '@speckle/shared'
import type { ServerRoles, StreamRoles } from '@speckle/shared'
import type { UserSearchItem } from '~~/lib/common/composables/users'
import type {
  ProjectInviteCreateInput,
  ProjectPageInviteDialog_ProjectFragment
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
    ...ProjectPageTeamInternals_Project
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

const loading = ref(false)
const search = ref('')
const role = ref<StreamRoles>(Roles.Stream.Contributor)

const { isGuestMode } = useServerInfo()
const createInvite = useInviteUserToProject()
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
  )
})

const dialogButtons = computed<LayoutDialogButton[]>(() => [
  {
    text: 'Cancel',
    props: { color: 'outline', fullWidth: true },
    onClick: () => {
      isOpen.value = false
    }
  }
])

const isOwnerSelected = computed(() => role.value === Roles.Stream.Owner)

const onInviteUser = async (
  user: InvitableUser | InvitableUser[],
  serverRole?: ServerRoles
) => {
  serverRole = serverRole || Roles.Server.User
  const users = filterInvalidInviteTargets(user, {
    isTargetResourceOwner: isOwnerSelected.value,
    emailTargetServerRole: serverRole
  })

  const inputs: ProjectInviteCreateInput[] = users.map((u) => ({
    role: role.value,
    ...(isString(u)
      ? {
          email: u,
          serverRole
        }
      : {
          userId: u.id
        })
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
</script>
