<template>
  <div class="mt-2">
    <div class="flex flex-col-reverse md:justify-between md:flex-row md:gap-x-4">
      <div class="relative w-full md:max-w-md mt-6 md:mt-0">
        <FormTextInput
          name="search"
          :custom-icon="MagnifyingGlassIcon"
          color="foundation"
          full-width
          search
          :show-clear="!!search"
          placeholder="Search users"
          class="rounded-md border border-outline-3"
          v-bind="bind"
          v-on="on"
        />
      </div>
      <FormButton @click="toggleInviteDialog">Invite</FormButton>
    </div>

    <LayoutTable
      class="mt-6"
      :columns="[
        { id: 'name', header: 'Name', classes: 'col-span-3 truncate' },
        { id: 'email', header: 'Email', classes: 'col-span-3 truncate' },
        { id: 'company', header: 'Company', classes: 'col-span-2 truncate' },
        { id: 'role', header: 'Role', classes: 'col-span-2' },
        { id: 'emailState', header: 'Email state', classes: 'col-span-2' },
        { id: 'actions', header: '', classes: 'absolute right-2 top-0.5' }
      ]"
      :items="users"
    >
      <template #name="{ item }">
        <div class="flex items-center gap-2">
          <UserAvatar v-if="isUser(item)" hide-tooltip :user="item" />
          <span class="truncate">
            {{ isUser(item) ? item.name : '' }}
          </span>
        </div>
      </template>

      <template #email="{ item }">
        {{ isUser(item) ? item.email : '' }}
      </template>

      <template #emailState="{ item }">
        <div class="flex items-center gap-2 select-none text-foreground-2">
          <template v-if="isUser(item) && item.verified">
            <span>Verified</span>
          </template>
          <template v-else>
            <span>Not verified</span>
          </template>
        </div>
      </template>

      <template #company="{ item }">
        {{ isUser(item) ? (item.company ? item.company : '-') : '' }}
      </template>

      <template #role="{ item }">
        {{ isUser(item) ? getRoleLabel(item.role) : '' }}
      </template>

      <template #actions="{ item }">
        <LayoutMenu
          v-model:open="showActionsMenu[item.id]"
          :items="actionItems"
          mount-menu-on-body
          :menu-position="HorizontalDirection.Left"
          @chosen="({ item: actionItem }) => onActionChosen(actionItem, item)"
        >
          <FormButton
            :color="showActionsMenu[item.id] ? 'outline' : 'subtle'"
            hide-text
            :icon-right="showActionsMenu[item.id] ? XMarkIcon : EllipsisHorizontalIcon"
            :disabled="isCurrentUser(item)"
            @click.stop="toggleMenu(item.id)"
          />
        </LayoutMenu>
      </template>
    </LayoutTable>

    <InfiniteLoading
      v-if="users?.length"
      :settings="{ identifier }"
      class="py-4"
      @infinite="onInfiniteLoad"
    />

    <SettingsServerUserDeleteDialog
      v-model:open="showUserDeleteDialog"
      :user="userToModify"
    />

    <SettingsServerUserChangeRoleDialog
      v-model:open="showChangeUserRoleDialog"
      :user="userToModify"
    />

    <SettingsServerUserInviteDialog v-model:open="showInviteDialog" />
  </div>
</template>

<script setup lang="ts">
import type { Nullable } from '@speckle/shared'
import { getUsersQuery } from '~~/lib/server-management/graphql/queries'
import type { ItemType, UserItem } from '~~/lib/server-management/helpers/types'
import { isUser, getRoleLabel } from '~~/lib/server-management/helpers/utils'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import {
  MagnifyingGlassIcon,
  EllipsisHorizontalIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'
import { useDebouncedTextInput } from '@speckle/ui-components'
import { usePaginatedQuery } from '~/lib/common/composables/graphql'
import { HorizontalDirection } from '~~/lib/common/composables/window'
import type { LayoutMenuItem } from '~~/lib/layout/helpers/components'

const { activeUser } = useActiveUser()
const { on, bind, value: search } = useDebouncedTextInput()

const userToModify: Ref<Nullable<UserItem>> = ref(null)
const showUserDeleteDialog = ref(false)
const showChangeUserRoleDialog = ref(false)
const showInviteDialog = ref(false)

const {
  identifier,
  onInfiniteLoad,
  query: { result }
} = usePaginatedQuery({
  query: getUsersQuery,
  baseVariables: computed(() => ({
    query: search.value?.length ? search.value : null,
    limit: 50
  })),
  resolveKey: (vars) => [vars.query || ''],
  resolveCurrentResult: (res) => res?.admin.userList,
  resolveNextPageVariables: (baseVars, cursor) => ({
    ...baseVars,
    cursor
  }),
  resolveCursorFromVariables: (vars) => vars.cursor
})

const users = computed(() => result.value?.admin.userList.items || [])

const isCurrentUser = (userItem: UserItem) => {
  return userItem.id === activeUser.value?.id
}

enum ActionTypes {
  ChangeRole = 'change-role',
  RemoveUser = 'remove-user'
}

const showActionsMenu = ref<Record<string, boolean>>({})

const actionItems: LayoutMenuItem[][] = [
  [
    {
      title: 'Change role...',
      id: ActionTypes.ChangeRole
    },
    {
      title: 'Remove user...',
      id: ActionTypes.RemoveUser
    }
  ]
]

const onActionChosen = (actionItem: LayoutMenuItem, user: UserItem) => {
  if (actionItem.id === ActionTypes.ChangeRole) {
    openChangeUserRoleDialog(user)
  } else if (actionItem.id === ActionTypes.RemoveUser) {
    openUserDeleteDialog(user)
  }
}

const toggleMenu = (itemId: string) => {
  showActionsMenu.value[itemId] = !showActionsMenu.value[itemId]
}

const openUserDeleteDialog = (item: ItemType) => {
  if (isUser(item)) {
    userToModify.value = item
    showUserDeleteDialog.value = true
  }
}

const openChangeUserRoleDialog = (user: UserItem) => {
  userToModify.value = user
  showChangeUserRoleDialog.value = true
}

const toggleInviteDialog = () => {
  showInviteDialog.value = true
}
</script>
