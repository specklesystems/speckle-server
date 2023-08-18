<template>
  <div>
    <Portal to="navigation">
      <HeaderNavLink to="/server-management" name="Server Management"></HeaderNavLink>
      <HeaderNavLink
        to="/server-management/pending-invitations"
        name="Pending Invitations"
      ></HeaderNavLink>
    </Portal>

    <h1 class="h4 font-bold mb-4">Pending Invitations</h1>

    <FormTextInput
      size="lg"
      name="search"
      :custom-icon="MagnifyingGlassIcon"
      color="foundation"
      full-width
      search
      :show-clear="!!searchString"
      placeholder="Search Invitations"
      class="rounded-md border border-outline-3"
      @update:model-value="debounceSearchUpdate"
      @change="handleSearchChange"
    />

    <ServerManagementTable
      class="mt-8"
      :headers="[
        { id: 'email', title: 'Email' },
        { id: 'invitedBy', title: 'Invited By' },
        { id: 'resend', title: '' }
      ]"
      :items="invites"
      :buttons="[
        { icon: TrashIcon, label: 'Delete', action: openDeleteInvitationDialog }
      ]"
      :column-classes="{
        email: 'col-span-5',
        invitedBy: 'col-span-4',
        resend: 'col-span-3'
      }"
    >
      <template #email="{ item }">
        {{ isInvite(item) ? item.email : '' }}
      </template>

      <template #invitedBy="{ item }">
        <div class="flex items-center gap-2 py-1">
          <UserAvatar v-if="isInvite(item)" :user="item.invitedBy" />
          {{ isInvite(item) ? item.invitedBy.name : '' }}
        </div>
      </template>

      <template #resend="{ item }">
        <FormButton
          :link="true"
          class="font-semibold text-primary"
          :disabled="successfullyResentInvites.includes(item.id)"
          @click="resendInvitation(item as InviteItem)"
        >
          {{
            successfullyResentInvites.includes(item.id)
              ? 'Invitation Resent'
              : 'Resend Invitation'
          }}
        </FormButton>
      </template>
    </ServerManagementTable>

    <ServerManagementDeleteInvitationDialog
      v-model:open="showDeleteInvitationDialog"
      :invite="inviteToModify"
      title="Delete Invitation"
      :buttons="[
        {
          text: 'Delete',
          props: { color: 'danger', fullWidth: true },
          onClick: deleteConfirmed
        },
        {
          text: 'Cancel',
          props: { color: 'secondary', fullWidth: true, outline: true },
          onClick: closeInvitationDeleteDialog
        }
      ]"
    />

    <InfiniteLoading
      :settings="{ identifier: infiniteLoaderId }"
      class="py-4"
      @infinite="infiniteLoad"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { debounce } from 'lodash-es'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { MagnifyingGlassIcon, TrashIcon } from '@heroicons/vue/20/solid'
import { ItemType, InviteItem } from '~~/lib/server-management/helpers/types'
import { InfiniteLoaderState } from '~~/lib/global/helpers/components'
import { graphql } from '~~/lib/common/generated/gql'
import { isInvite } from '~~/lib/server-management/helpers/utils'
import { useGlobalToast, ToastNotificationType } from '~~/lib/common/composables/toast'
import {
  convertThrowIntoFetchResult,
  getCacheId,
  getFirstErrorMessage,
  updateCacheByFilter
} from '~~/lib/common/helpers/graphql'

const getInvites = graphql(`
  query AdminPanelInvitesList($limit: Int!, $cursor: String, $query: String) {
    admin {
      inviteList(limit: $limit, cursor: $cursor, query: $query) {
        cursor
        items {
          email
          id
          invitedBy {
            id
            name
          }
        }
        totalCount
      }
    }
  }
`)

const adminDeleteInvite = graphql(`
  mutation AdminPanelDeleteInvite($inviteId: String!) {
    inviteDelete(inviteId: $inviteId)
  }
`)

const adminResendInvite = graphql(`
  mutation AdminPanelResendInvite($inviteId: String!) {
    inviteResend(inviteId: $inviteId)
  }
`)

const logger = useLogger()

definePageMeta({
  middleware: ['admin']
})

const inviteToModify = ref<InviteItem | null>(null)
const searchString = ref('')
const showDeleteInvitationDialog = ref(false)
const infiniteLoaderId = ref('')
const successfullyResentInvites = ref<string[]>([])

const moreToLoad = computed(
  () =>
    !extraPagesResult.value?.admin?.inviteList ||
    extraPagesResult.value.admin.inviteList.items.length <
      extraPagesResult.value.admin.inviteList.totalCount
)

const invites = computed(() => extraPagesResult.value?.admin.inviteList.items || [])
const { triggerNotification } = useGlobalToast()

const { mutate: adminDeleteMutation } = useMutation(adminDeleteInvite)
const { mutate: resendInvitationMutation } = useMutation(adminResendInvite)

const openDeleteInvitationDialog = (item: ItemType) => {
  if (isInvite(item)) {
    inviteToModify.value = item
    showDeleteInvitationDialog.value = true
  }
}

const closeInvitationDeleteDialog = () => {
  showDeleteInvitationDialog.value = false
}

const handleSearchChange = (newSearchString: string) => {
  searchUpdateHandler(newSearchString)
}

const deleteConfirmed = async () => {
  const inviteId = inviteToModify.value?.id
  if (!inviteId) {
    return
  }

  const result = await adminDeleteMutation(
    {
      inviteId
    },
    {
      update: (cache, { data }) => {
        if (data?.inviteDelete) {
          // Remove invite from cache
          cache.evict({
            id: getCacheId('AdminUserListItem', inviteId)
          })
          // Update list in cache
          updateCacheByFilter(
            cache,
            { query: { query: getInvites, variables: resultVariables.value } },
            (data) => {
              const newItems = data.admin.inviteList.items.filter(
                (item) => item.id !== inviteId
              )
              return {
                ...data,
                admin: {
                  ...data.admin,
                  inviteList: {
                    ...data.admin.inviteList,
                    items: newItems,
                    totalCount: Math.max(0, data.admin.inviteList.totalCount - 1)
                  }
                }
              }
            }
          )
        }
      }
    }
  ).catch(convertThrowIntoFetchResult)

  if (result?.data?.inviteDelete) {
    closeInvitationDeleteDialog()
    triggerNotification({
      type: ToastNotificationType.Success,
      title: 'Invitation deleted',
      description: 'The invitation has been successfully deleted'
    })
  } else {
    const errorMessage = getFirstErrorMessage(result?.errors)
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Failed to delete invitation',
      description: errorMessage
    })
  }
}

const resendInvitation = async (item: InviteItem) => {
  const inviteId = item.id
  if (!inviteId) return

  const result = await resendInvitationMutation({ inviteId }).catch(
    convertThrowIntoFetchResult
  )

  if (result?.data?.inviteResend) {
    successfullyResentInvites.value.push(inviteId)
    triggerNotification({
      type: ToastNotificationType.Success,
      title: 'Invitation Resent',
      description: 'The invitation has been successfully resent'
    })
  } else {
    const errorMessage = getFirstErrorMessage(result?.errors)
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Failed to resend invitation',
      description: errorMessage
    })
  }
}

const {
  result: extraPagesResult,
  fetchMore: fetchMorePages,
  variables: resultVariables,
  onResult
} = useQuery(getInvites, () => ({
  limit: 50,
  query: searchString.value
}))

const infiniteLoad = async (state: InfiniteLoaderState) => {
  const cursor = extraPagesResult.value?.admin?.inviteList.cursor || null
  if (!moreToLoad.value || !cursor) return state.complete()

  try {
    await fetchMorePages({
      variables: {
        cursor
      }
    })
  } catch (e) {
    logger.error(e)
    state.error()
    return
  }

  state.loaded()
  if (!moreToLoad.value) {
    state.complete()
  }
}

const searchUpdateHandler = (value: string) => {
  searchString.value = value
}

const debounceSearchUpdate = debounce(searchUpdateHandler, 500)

const calculateLoaderId = () => {
  infiniteLoaderId.value = resultVariables.value?.query || ''
}

onResult(calculateLoaderId)
</script>
