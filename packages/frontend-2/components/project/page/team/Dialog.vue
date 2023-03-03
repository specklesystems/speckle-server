<template>
  <LayoutDialog v-model:open="isOpen" max-width="md">
    <div class="flex flex-col text-foreground space-y-4">
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
      <div class="h4 font-bold">Manage your team</div>
      <div class="flex flex-col space-y-4">
        <div
          v-for="collaborator in project.team"
          :key="collaborator.user.id"
          class="flex items-center space-x-2"
        >
          <UserAvatar :user="collaborator.user" />
          <span class="grow truncate">{{ collaborator.user.name }}</span>

          <ProjectPageTeamPermissionSelect
            :model-value="collaborator.role"
            @update:model-value="onCollaboratorRoleChange(collaborator, $event)"
          />
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

const emit = defineEmits<{
  (e: 'update:open', v: boolean): void
}>()

const props = defineProps<{
  open: boolean
  project: ProjectPageStatsBlockTeamFragment
}>()

const search = ref('')
const role = ref(Roles.Stream.Contributor)

const { userSearch } = useUserSearch({
  variables: computed(() => ({
    query: search.value,
    limit: 5
  }))
})

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

const onInviteUser = (user: NonNullable<Get<typeof searchUsers.value, '[0]'>>) => void 0
const onCollaboratorRoleChange = (
  collaborator: NonNullable<Get<ProjectPageStatsBlockTeamFragment, 'team[0]'>>,
  newRole: StreamRoles
) => void 0
</script>
