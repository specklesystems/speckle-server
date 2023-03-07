<template>
  <div class="flex flex-col space-y-4">
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
              <FormButton :disabled="loading" @click="onInviteUser(user)">
                Invite
              </FormButton>
            </div>
          </template>
        </template>
        <template v-else-if="searchVariables?.query">
          <div class="flex items-center space-x-2">
            <UserAvatar />
            <span class="grow truncate">{{ searchVariables.query }}</span>
            <FormButton
              :disabled="loading"
              @click="
                () =>
                  searchVariables?.query ? onInviteUser(searchVariables.query) : void 0
              "
            >
              Invite
            </FormButton>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { Roles } from '@speckle/shared'
import { Get } from 'type-fest'
import { useUserSearch } from '~~/lib/common/composables/users'
import { ProjectPageTeamDialogFragment } from '~~/lib/common/generated/gql/graphql'
import { SetFullyRequired } from '~~/lib/common/helpers/type'
import { isEmail } from '~~/lib/common/helpers/validation'
import { isString } from 'lodash-es'
import { useInviteUserToProject } from '~~/lib/projects/composables/projectManagement'
import { useTeamDialogInternals } from '~~/lib/projects/composables/team'

type InvitableUser = NonNullable<Get<typeof searchUsers.value, '[0]'>> | string

const props = defineProps<{
  project: ProjectPageTeamDialogFragment
}>()

const loading = ref(false)
const search = ref('')
const role = ref(Roles.Stream.Contributor)

const createInvite = useInviteUserToProject()
const { userSearch, searchVariables } = useUserSearch({
  variables: computed(() => ({
    query: search.value,
    limit: 5
  }))
})
const { collaboratorListItems } = useTeamDialogInternals({
  props: toRefs(props)
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

const isValidEmail = (val: string) =>
  isEmail(val || '', {
    field: '',
    value: '',
    form: {}
  }) === true
    ? true
    : false

const onInviteUser = async (user: InvitableUser) => {
  if (isString(user)) {
    if (!isValidEmail(user)) return
    // Invite email
    loading.value = true
    await createInvite({
      email: user,
      role: role.value,
      projectId: props.project.id
    })
    loading.value = false
  } else {
    // Invite existing user
    loading.value = true
    await createInvite({
      userId: user.id,
      role: role.value,
      projectId: props.project.id
    })
    loading.value = false
  }
}
</script>
