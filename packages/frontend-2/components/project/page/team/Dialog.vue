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
            input-classes="pr-20"
          >
            <template #input-right>
              <div class="absolute inset-y-0 right-0 flex items-center pr-2">
                <ProjectPageTeamPermissionSelect v-model="role" />
              </div>
            </template>
          </FormTextInput>
          <div v-if="searchUsers.length" class="flex flex-col space-y-4">
            <div
              v-for="user in searchUsers"
              :key="user.id"
              class="flex items-center space-x-2"
            >
              <UserAvatar :user="user" />
              <span class="grow truncate">{{ user.name }}</span>
              <FormButton @click="onInviteUser(user)">Invite</FormButton>
            </div>
          </div>
        </div>
      </template>
      <div class="h4 font-bold">{{ isOwner ? 'Manage your team' : 'Team' }}</div>
      <div class="flex flex-col space-y-4">
        <div
          v-for="collaborator in project.team"
          :key="collaborator.user.id"
          class="flex items-center space-x-2"
        >
          <UserAvatar :user="collaborator.user" />
          <span class="grow truncate">{{ collaborator.user.name }}</span>

          <ProjectPageTeamPermissionSelect
            v-if="isOwner && activeUser && collaborator.user.id !== activeUser.id"
            :model-value="collaborator.role"
            :disabled="roleLoadingStatuses[collaborator.user.id]"
            @update:model-value="onCollaboratorRoleChange(collaborator, $event)"
          />
          <span v-else>{{ roleSelectItems[collaborator.role].title }}</span>
        </div>
      </div>
    </div>
  </LayoutDialog>
</template>
<script setup lang="ts">
import { Get } from 'type-fest'
import { Roles, StreamRoles } from '@speckle/shared'
import { useUserSearch } from '~~/lib/common/composables/users'
import { ProjectPageStatsBlockTeamFragment } from '~~/lib/common/generated/gql/graphql'
import { roleSelectItems } from '~~/lib/projects/helpers/permissions'
import { useUpdateUserRole } from '~~/lib/projects/composables/projectManagement'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'

const emit = defineEmits<{
  (e: 'update:open', v: boolean): void
}>()

const props = defineProps<{
  open: boolean
  project: ProjectPageStatsBlockTeamFragment
}>()

const updateRole = useUpdateUserRole()
const { activeUser } = useActiveUser()

const search = ref('')
const role = ref(Roles.Stream.Contributor)
const roleLoadingStatuses = ref({} as Record<string, boolean>)

const { userSearch } = useUserSearch({
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

const teamUsers = computed(() => props.project.team.map((t) => t.user))

const searchUsers = computed(() => {
  const searchResults = userSearch.value?.userSearch.items || []
  const collaboratorIds = new Set(teamUsers.value.map((t) => t.id))
  return searchResults.filter((r) => !collaboratorIds.has(r.id))
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const onInviteUser = (user: NonNullable<Get<typeof searchUsers.value, '[0]'>>) => void 0
const onCollaboratorRoleChange = async (
  collaborator: NonNullable<Get<ProjectPageStatsBlockTeamFragment, 'team[0]'>>,
  newRole: StreamRoles
) => {
  roleLoadingStatuses.value[collaborator.user.id] = true
  await updateRole({
    projectId: props.project.id,
    userId: collaborator.user.id,
    role: newRole
  })
  roleLoadingStatuses.value[collaborator.user.id] = false
}
</script>
