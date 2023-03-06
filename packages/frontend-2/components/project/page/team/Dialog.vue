<template>
  <LayoutDialog v-model:open="isOpen" max-width="md">
    <div class="flex flex-col text-foreground space-y-4">
      <template v-if="isOwner">
        <div class="h4 font-bold">Invite</div>
        <div class="flex flex-col space-y-4">
          <FormTextInput
            v-model="search"
            name="search"
            size="lg"
            placeholder="username or email"
            input-classes="pr-[100px]"
          >
            <template #input-right>
              <div class="absolute inset-y-0 right-0 flex items-center pr-2">
                <ProjectPageTeamPermissionSelect v-model="role" hide-remove />
              </div>
            </template>
          </FormTextInput>
          <div
            v-if="searchUsers.length || isValidEmail(searchVariables?.query || '')"
            class="flex flex-col space-y-4"
          >
            <template v-if="searchUsers.length">
              <template v-for="user in searchUsers" :key="user.id">
                <div class="flex items-center space-x-2">
                  <UserAvatar :user="user" />
                  <span class="grow truncate">{{ user.name }}</span>
                  <FormButton @click="onInviteUser(user)">Invite</FormButton>
                </div>
              </template>
            </template>
            <template v-else-if="searchVariables?.query">
              <div class="flex items-center space-x-2">
                <UserAvatar />
                <span class="grow truncate">{{ searchVariables.query }}</span>
                <FormButton
                  @click="
                    () =>
                      searchVariables?.query
                        ? onInviteUser(searchVariables.query)
                        : void 0
                  "
                >
                  Invite
                </FormButton>
              </div>
            </template>
          </div>
        </div>
      </template>
      <div class="h4 font-bold">{{ isOwner ? 'Manage your team' : 'Team' }}</div>
      <div class="flex flex-col space-y-4">
        <div
          v-for="collaborator in collaboratorListItems"
          :key="collaborator.id"
          class="flex items-center space-x-2"
        >
          <UserAvatar :user="collaborator.user" />
          <span class="grow truncate">{{ collaborator.title }}</span>

          <template v-if="!collaborator.inviteId">
            <ProjectPageTeamPermissionSelect
              v-if="isOwner && activeUser && collaborator.id !== activeUser.id"
              class="shrink-0"
              :model-value="collaborator.role"
              :disabled="roleLoadingStatuses[collaborator.id]"
              @update:model-value="onCollaboratorRoleChange(collaborator, $event)"
              @delete="onCollaboratorRoleChange(collaborator, null)"
            />
            <span v-else class="shrink-0">
              {{ roleSelectItems[collaborator.role].title }}
            </span>
          </template>
          <template v-else>
            <FormButton
              class="shrink-0"
              color="danger"
              size="sm"
              @click="
                cancelInvite({
                  projectId: project.id,
                  inviteId: collaborator.inviteId || ''
                })
              "
            >
              Cancel Invite
            </FormButton>
            <span class="shrink-0">{{ roleSelectItems[collaborator.role].title }}</span>
          </template>
        </div>
      </div>
    </div>
  </LayoutDialog>
</template>
<script setup lang="ts">
import { Get } from 'type-fest'
import { Nullable, Roles, StreamRoles } from '@speckle/shared'
import { useUserSearch } from '~~/lib/common/composables/users'
import {
  LimitedUserAvatarFragment,
  ProjectPageTeamDialogFragment
} from '~~/lib/common/generated/gql/graphql'
import { roleSelectItems } from '~~/lib/projects/helpers/permissions'
import {
  useUpdateUserRole,
  useInviteUserToProject,
  useCancelProjectInvite
} from '~~/lib/projects/composables/projectManagement'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { useApolloClient } from '@vue/apollo-composable'
import {
  CacheObjectReference,
  getCacheId,
  getObjectReference,
  modifyObjectFields
} from '~~/lib/common/helpers/graphql'
import { isEmail } from '~~/lib/common/helpers/validation'
import { isString } from 'lodash-es'
import { graphql } from '~~/lib/common/generated/gql'
import { SetFullyRequired } from '~~/lib/common/helpers/type'

graphql(`
  fragment ProjectPageTeamDialog on Project {
    id
    role
    team {
      role
      user {
        ...LimitedUserAvatar
      }
    }
    invitedTeam {
      id
      title
      inviteId
      role
      user {
        ...LimitedUserAvatar
      }
    }
  }
`)

type CollaboratorListItem = {
  id: string
  title: string
  user: Nullable<LimitedUserAvatarFragment>
  role: string
  inviteId: Nullable<string>
}

type InvitableUser = NonNullable<Get<typeof searchUsers.value, '[0]'>> | string

const emit = defineEmits<{
  (e: 'update:open', v: boolean): void
}>()

const props = defineProps<{
  open: boolean
  project: ProjectPageTeamDialogFragment
}>()

const apollo = useApolloClient().client
const updateRole = useUpdateUserRole()
const createInvite = useInviteUserToProject()
const cancelInvite = useCancelProjectInvite()
const { activeUser } = useActiveUser()

const search = ref('')
const role = ref(Roles.Stream.Contributor)
const roleLoadingStatuses = ref({} as Record<string, boolean>)

const { userSearch, searchVariables } = useUserSearch({
  variables: computed(() => ({
    query: search.value,
    limit: 5
  }))
})

const isOwner = computed(() => props.project.role === Roles.Stream.Owner)

const isOpen = computed({
  get: () => props.open,
  set: (newVal) => emit('update:open', newVal)
})

const collaboratorListItems = computed((): CollaboratorListItem[] => {
  const results: CollaboratorListItem[] = []

  for (const invitedUser of props.project.invitedTeam || []) {
    results.push({
      id: invitedUser.id,
      title: invitedUser.title,
      user: invitedUser.user || null,
      role: invitedUser.role,
      inviteId: invitedUser.inviteId
    })
  }

  for (const collaborator of props.project.team) {
    results.push({
      id: collaborator.user.id,
      title: collaborator.user.name,
      user: collaborator.user,
      role: collaborator.role,
      inviteId: null
    })
  }

  return results
})

const searchUsers = computed(() => {
  const searchResults = userSearch.value?.userSearch.items || []
  const collaboratorIds = new Set(
    collaboratorListItems.value
      .filter((i): i is SetFullyRequired<typeof i, 'user'> => !!i.user?.id)
      .map((t) => t.user.id)
  )
  return searchResults.filter((r) => !collaboratorIds.has(r.id))
})

const onInviteUser = async (user: InvitableUser) => {
  if (isString(user)) {
    if (!isValidEmail(user)) return
    // Invite email
    await createInvite({
      email: user,
      role: role.value,
      projectId: props.project.id
    })
  } else {
    // Invite existing user
    await createInvite({
      userId: user.id,
      role: role.value,
      projectId: props.project.id
    })
  }
}

const onCollaboratorRoleChange = async (
  collaborator: CollaboratorListItem,
  newRole: Nullable<StreamRoles>
) => {
  if (collaborator.inviteId) return

  roleLoadingStatuses.value[collaborator.id] = true
  await updateRole({
    projectId: props.project.id,
    userId: collaborator.id,
    role: newRole
  })
  roleLoadingStatuses.value[collaborator.id] = false

  if (!newRole) {
    // Remove from team
    modifyObjectFields<undefined, Array<{ role: string; user: CacheObjectReference }>>(
      apollo.cache,
      getCacheId('Project', props.project.id),
      (fieldName, _variables, value) => {
        if (fieldName !== 'team') return
        return value.filter(
          (t) =>
            t.user.__ref !== getObjectReference('LimitedUser', collaborator.id).__ref
        )
      }
    )
  }
}

const isValidEmail = (val: string) =>
  isEmail(val || '', {
    field: '',
    value: '',
    form: {}
  }) === true
    ? true
    : false
</script>
