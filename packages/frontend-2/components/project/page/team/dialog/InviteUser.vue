<template>
  <div class="flex flex-col space-y-4">
    <div class="h4 font-bold flex items-center space-x-2">
      <UserPlusIcon class="w-6 h-6" />
      <span>Invite</span>
    </div>
    <div class="flex flex-col space-y-4">
      <FormTextInput
        v-model="search"
        name="search"
        size="xl"
        placeholder="search by username or email"
        input-classes="pr-[100px]"
      >
        <template #input-right>
          <div class="absolute inset-y-0 right-0 flex items-center pr-2">
            <ProjectPageTeamPermissionSelect v-model="role" hide-remove />
          </div>
        </template>
      </FormTextInput>
      <div v-if="searchUsers.length || selectedEmails" class="flex flex-col space-y-4">
        <template v-if="searchUsers.length">
          <template v-for="user in searchUsers" :key="user.id">
            <div class="flex items-center space-x-2">
              <UserAvatar :user="user" />
              <span class="grow truncate">{{ user.name }}</span>
              <span
                v-tippy="
                  isOwnerSelected && user.role === Roles.Server.Guest
                    ? `Server guests can't be project owners`
                    : undefined
                "
              >
                <FormButton
                  :disabled="
                    loading || (isOwnerSelected && user.role === Roles.Server.Guest)
                  "
                  @click="onInviteUser(user)"
                >
                  Invite
                </FormButton>
              </span>
            </div>
          </template>
        </template>
        <template v-else-if="selectedEmails?.length">
          <div class="flex items-center space-x-2">
            <UserAvatar />
            <span class="grow truncate">{{ selectedEmails.join(', ') }}</span>
            <FormButton
              :disabled="loading"
              @click="() => onInviteUser(selectedEmails || [])"
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
import { Roles, StreamRoles } from '@speckle/shared'
import { Get } from 'type-fest'
import { useUserSearch } from '~~/lib/common/composables/users'
import {
  ProjectInviteCreateInput,
  ProjectPageTeamDialogFragment
} from '~~/lib/common/generated/gql/graphql'
import { SetFullyRequired } from '~~/lib/common/helpers/type'
import { isEmail } from '~~/lib/common/helpers/validation'
import { isArray, isString } from 'lodash-es'
import { useInviteUserToProject } from '~~/lib/projects/composables/projectManagement'
import { useTeamDialogInternals } from '~~/lib/projects/composables/team'
import { UserPlusIcon } from '@heroicons/vue/24/solid'
import { useMixpanel } from '~~/lib/core/composables/mp'

type InvitableUser = NonNullable<Get<typeof searchUsers.value, '[0]'>> | string

const props = defineProps<{
  project: ProjectPageTeamDialogFragment
}>()

const loading = ref(false)
const search = ref('')
const role = ref<StreamRoles>(Roles.Stream.Contributor)

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

const mp = useMixpanel()
const onInviteUser = async (user: InvitableUser | InvitableUser[]) => {
  const users = (isArray(user) ? user : [user]).filter(
    (u) => !isOwnerSelected.value || isString(u) || u.role !== Roles.Server.Guest
  )

  const inputs: ProjectInviteCreateInput[] = users
    .filter((u) => (isString(u) ? isValidEmail(u) : u))
    .map((u) => ({
      role: role.value,
      ...(isString(u)
        ? {
            email: u
          }
        : {
            userId: u.id
          })
    }))
  if (!inputs.length) return

  const isEmail = !!inputs.find((u) => !!u.email)

  // Invite email
  loading.value = true
  await createInvite(props.project.id, inputs)

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

const selectedEmails = computed(() => {
  const query = searchVariables.value?.query || ''
  if (isValidEmail(query)) return [query]

  const multipleEmails = query.split(',').map((i) => i.trim())
  const validEmails = multipleEmails.filter((e) => isValidEmail(e))
  return validEmails.length ? validEmails : null
})

const isOwnerSelected = computed(() => role.value === Roles.Stream.Owner)
</script>
