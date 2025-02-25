<template>
  <div>
    <LayoutTable
      class="mt-2 mb-12"
      :columns="[
        { id: 'name', header: 'Name', classes: 'col-span-3' },
        { id: 'createdAt', header: 'Requested at', classes: 'col-span-3' },
        { id: 'status', header: 'Status', classes: 'col-span-3' },
        {
          id: 'actions',
          header: '',
          classes: 'col-span-3 flex items-center justify-end'
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
      <template #status="{ item }">
        <span class="truncate text-body-xs text-foreground capitalize">
          {{ item.status }}
        </span>
      </template>
      <template #actions="{ item }">
        <div
          v-if="item.status === WorkspaceJoinRequestStatus.Pending"
          class="flex items-center gap-x-2"
        >
          <FormButton color="outline" size="sm" @click="onApprove(item)">
            Approve
          </FormButton>
          <FormButton color="outline" size="sm" @click="onDeny(item)">Deny</FormButton>
        </div>
      </template>
    </LayoutTable>

    <WorkspaceJoinRequestApproveDialog
      v-model:open="showApproveJoinRequestDialog"
      :join-request="requestToApprove"
    />
  </div>
</template>

<script setup lang="ts">
import { orderBy } from 'lodash-es'
import dayjs from 'dayjs'
import type { MaybeNullOrUndefined } from '@speckle/shared'
import {
  type SettingsWorkspacesMembersRequestsTable_WorkspaceFragment,
  type WorkspaceJoinRequestApproveDialog_WorkspaceJoinRequestFragment,
  WorkspaceJoinRequestStatus
} from '~~/lib/common/generated/gql/graphql'
import { graphql } from '~/lib/common/generated/gql'
import { useWorkspaceJoinRequest } from '~/lib/workspaces/composables/joinRequests'

graphql(`
  fragment SettingsWorkspacesMembersRequestsTable_Workspace on Workspace {
    ...SettingsWorkspacesMembersTableHeader_Workspace
    id
    adminWorkspacesJoinRequests(filter: $joinRequestsFilter) {
      totalCount
      items {
        ...WorkspaceJoinRequestApproveDialog_WorkspaceJoinRequest
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

const { deny } = useWorkspaceJoinRequest()

const showApproveJoinRequestDialog = ref(false)
const requestToApprove =
  ref<WorkspaceJoinRequestApproveDialog_WorkspaceJoinRequestFragment>()

const joinRequests = computed(() => {
  const thirtyDaysAgo = dayjs().subtract(30, 'days')

  const filtered =
    props.workspace?.adminWorkspacesJoinRequests?.items.filter((request) => {
      if (request.status === WorkspaceJoinRequestStatus.Pending) return true
      return dayjs(request.createdAt).isAfter(thirtyDaysAgo)
    }) ?? []

  return orderBy(
    filtered,
    [
      (request) => (request.status === WorkspaceJoinRequestStatus.Pending ? 0 : 1),
      'createdAt'
    ],
    ['asc', 'desc']
  )
})

const onApprove = (
  request: WorkspaceJoinRequestApproveDialog_WorkspaceJoinRequestFragment
) => {
  requestToApprove.value = request
  showApproveJoinRequestDialog.value = true
}

const onDeny = async (
  request: WorkspaceJoinRequestApproveDialog_WorkspaceJoinRequestFragment
) => {
  if (!props.workspace?.id) return
  await deny(
    {
      workspaceId: props.workspace?.id,
      userId: request.user.id
    },
    request.id
  )
}
</script>
