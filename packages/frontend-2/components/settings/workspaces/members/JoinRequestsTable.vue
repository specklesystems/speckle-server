<template>
  <div>
    <LayoutTable
      class="mt-2 mb-12"
      :columns="[
        { id: 'name', header: 'Name', classes: 'col-span-3' },
        { id: 'createdAt', header: 'Requested at', classes: 'col-span-3' },
        {
          id: 'actions',
          header: '',
          classes: 'col-span-6 flex items-center justify-end'
        }
      ]"
      :items="joinRequests"
      empty-message="There are no pending join requests"
    >
      <template #name="{ item }">
        <div class="flex items-center gap-2">
          <UserAvatar hide-tooltip :user="item.user" />
          <span class="truncate text-body-xs text-foreground">
            {{ item.user.name }}
          </span>
        </div>
      </template>
      <template #createdAt="{ item }">
        <p class="text-body-xs text-foreground">
          {{ formattedFullDate(item.createdAt) }}
        </p>
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
            @click="toggleMenu(item.id)"
          />
        </LayoutMenu>
      </template>
    </LayoutTable>

    <WorkspaceJoinRequestApproveDialog
      v-model:open="showApproveJoinRequestDialog"
      :name="userToApprove?.user.name"
      :workspace-id="props.workspace?.id"
      :user-id="userToApprove?.id"
    />
  </div>
</template>

<script setup lang="ts">
import { type MaybeNullOrUndefined } from '@speckle/shared'
import type { SettingsWorkspacesMembersRequestsTable_WorkspaceFragment } from '~~/lib/common/generated/gql/graphql'
import { graphql } from '~/lib/common/generated/gql'
import { EllipsisHorizontalIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import type { LayoutMenuItem } from '~~/lib/layout/helpers/components'
import { HorizontalDirection } from '~~/lib/common/composables/window'
import { useWorkspaceJoinRequest } from '~/lib/workspaces/composables/joinRequests'

type UserItem = (typeof joinRequests)['value'][0]

enum ActionTypes {
  Approve = 'approve',
  Deny = 'deny'
}

graphql(`
  fragment SettingsWorkspacesMembersRequestsTable_Workspace on Workspace {
    ...SettingsWorkspacesMembersTableHeader_Workspace
    id
    adminWorkspacesJoinRequests(filter: $joinRequestsFilter) {
      totalCount
      items {
        id
        createdAt
        status
        user {
          id
          avatar
          name
        }
      }
    }
  }
`)

const props = defineProps<{
  workspace: MaybeNullOrUndefined<SettingsWorkspacesMembersRequestsTable_WorkspaceFragment>
}>()

const showApproveJoinRequestDialog = ref(false)
const userToApprove = ref<UserItem>()
const showActionsMenu = ref<Record<string, boolean>>({})
const { deny } = useWorkspaceJoinRequest()

const joinRequests = computed(() =>
  (props.workspace?.adminWorkspacesJoinRequests?.items || []).map((item) => ({
    ...item,
    id: item.user.id
  }))
)

const actionItems = computed((): LayoutMenuItem[][] => [
  [{ title: 'Approve...', id: ActionTypes.Approve }],
  [{ title: 'Deny', id: ActionTypes.Deny }]
])

const onApprove = (user: UserItem) => {
  userToApprove.value = user
  showApproveJoinRequestDialog.value = true
}

const onDeny = async (user: UserItem) => {
  if (!props.workspace?.id) return
  await deny({
    workspaceId: props.workspace?.id,
    userId: user.id
  })
}

const onActionChosen = (actionItem: LayoutMenuItem, user: UserItem) => {
  switch (actionItem.id) {
    case ActionTypes.Approve:
      onApprove(user)
      break
    case ActionTypes.Deny:
      onDeny(user)
      break
  }
}

const toggleMenu = (itemId: string) => {
  showActionsMenu.value[itemId] = !showActionsMenu.value[itemId]
}
</script>
