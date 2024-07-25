<template>
  <section>
    <div class="md:max-w-5xl md:mx-auto pb-6 md:pb-0">
      <SettingsSectionHeader title="Active users" text="Manage server members" />
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
            :model-value="bind.modelValue.value"
            v-on="on"
          />
        </div>
        <FormButton :icon-left="UserPlusIcon" @click="toggleInviteDialog">
          Invite
        </FormButton>
      </div>

      <LayoutTable
        class="mt-6 md:mt-8"
        :columns="[
          { id: 'name', header: 'Name', classes: 'col-span-3 truncate' },
          { id: 'email', header: 'Email', classes: 'col-span-3 truncate' },
          { id: 'emailState', header: 'Email state', classes: 'col-span-2' },
          { id: 'company', header: 'Company', classes: 'col-span-2 truncate' },
          { id: 'role', header: 'Role', classes: 'col-span-2' }
        ]"
        :items="users"
        :buttons="[{ icon: TrashIcon, label: 'Delete', action: openUserDeleteDialog }]"
      >
        <template #name="{ item }">
          <div class="flex items-center gap-2">
            <UserAvatar v-if="isUser(item)" :user="item" />
            <span class="truncate">
              {{ isUser(item) ? item.name : '' }}
            </span>
          </div>
        </template>

        <template #email="{ item }">
          {{ isUser(item) ? item.email : '' }}
        </template>

        <template #emailState="{ item }">
          <div class="flex items-center gap-2 select-none">
            <template v-if="isUser(item) && item.verified">
              <CheckCircleIcon class="h-4 w-4 text-primary" />
              <span>Verified</span>
            </template>
            <template v-else>
              <ExclamationCircleIcon class="h-4 w-4 text-danger" />
              <span>Not verified</span>
            </template>
          </div>
        </template>

        <template #company="{ item }">
          {{ isUser(item) ? item.company : '' }}
        </template>

        <template #role="{ item }">
          <FormSelectServerRoles
            :allow-guest="isGuestMode"
            allow-admin
            allow-archived
            :model-value="isUser(item) ? item.role : undefined"
            :disabled="isUser(item) && isCurrentUser(item)"
            fully-control-value
            @update:model-value="(newRoleValue) => isUser(item) && !isArray(newRoleValue) && newRoleValue && openChangeUserRoleDialog(item, newRoleValue as ServerRoles)"
          />
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
        :old-role="oldRole"
        :new-role="newRole"
        hide-closer
      />
      <SettingsServerUserInviteDialog v-model:open="showInviteDialog" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { isArray } from 'lodash-es'
import type { Nullable, ServerRoles, Optional } from '@speckle/shared'
import { getUsersQuery } from '~~/lib/server-management/graphql/queries'
import type { ItemType, UserItem } from '~~/lib/server-management/helpers/types'
import { isUser } from '~~/lib/server-management/helpers/utils'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import {
  MagnifyingGlassIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  TrashIcon,
  UserPlusIcon
} from '@heroicons/vue/24/outline'
import { useServerInfo } from '~~/lib/core/composables/server'
import { useDebouncedTextInput } from '@speckle/ui-components'
import { usePaginatedQuery } from '~/lib/common/composables/graphql'

const { activeUser } = useActiveUser()
const { isGuestMode } = useServerInfo()
const { on, bind, value: search } = useDebouncedTextInput()

const userToModify: Ref<Nullable<UserItem>> = ref(null)
const showUserDeleteDialog = ref(false)
const showChangeUserRoleDialog = ref(false)
const newRole = ref<ServerRoles>()
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

const oldRole = computed(() => userToModify.value?.role as Optional<ServerRoles>)
const users = computed(() => result.value?.admin.userList.items || [])

const isCurrentUser = (userItem: UserItem) => {
  return userItem.id === activeUser.value?.id
}

const openUserDeleteDialog = (item: ItemType) => {
  if (isUser(item)) {
    userToModify.value = item
    showUserDeleteDialog.value = true
  }
}

const openChangeUserRoleDialog = (user: UserItem, newRoleValue: ServerRoles) => {
  if (user.role === newRoleValue) {
    return
  }
  userToModify.value = user
  newRole.value = newRoleValue
  showChangeUserRoleDialog.value = true
}

const toggleInviteDialog = () => {
  showInviteDialog.value = true
}
</script>
