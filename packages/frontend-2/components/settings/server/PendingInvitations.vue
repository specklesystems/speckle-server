<template>
  <div class="md:max-w-5xl md:mx-auto">
    <SettingsSectionHeader
      title="Pending invitations"
      text="And overview of all your pending invititations"
    />
    <div class="flex flex-col-reverse md:flex-row">
      <FormTextInput
        name="search"
        :custom-icon="MagnifyingGlassIcon"
        color="foundation"
        full-width
        search
        :show-clear="!!searchString"
        placeholder="Search invitations"
        class="rounded-md border border-outline-3 md:max-w-md mt-6 md:mt-0"
        @update:model-value="debounceSearchUpdate"
        @change="($event) => searchUpdateHandler($event.value)"
      />
      <FormButton :icon-left="UserPlusIcon" @click="toggleInviteDialog">
        Invite
      </FormButton>
    </div>

    <LayoutTable
      class="mt-6 md:mt-8"
      :columns="[
        { id: 'email', header: 'Email', classes: 'col-span-5 truncate' },
        { id: 'invitedBy', header: 'Invited by', classes: 'col-span-4' },
        { id: 'resend', header: 'Resend', classes: 'col-span-3' }
      ]"
      :items="invites"
      :buttons="[
        { icon: TrashIcon, label: 'Delete', action: openDeleteInvitationDialog }
      ]"
    >
      <template #email="{ item }">
        {{ isInvite(item) ? item.email : '' }}
      </template>

      <template #invitedBy="{ item }">
        <div class="flex items-center gap-2 py-1">
          <UserAvatar v-if="isInvite(item)" :user="item.invitedBy" />
          <span class="truncate">
            {{ isInvite(item) ? item.invitedBy.name : '' }}
          </span>
        </div>
      </template>

      <template #resend="{ item }">
        <FormButton
          :link="true"
          :class="{
            'font-semibold': true,
            'text-primary': !successfullyResentInvites.includes(item.id),
            'text-foreground': successfullyResentInvites.includes(item.id)
          }"
          :disabled="successfullyResentInvites.includes(item.id)"
          @click="resendInvitation(item as InviteItem)"
        >
          {{
            successfullyResentInvites.includes(item.id)
              ? 'Invitation resent'
              : 'Resend invitation'
          }}
        </FormButton>
      </template>
    </LayoutTable>

    <SettingsServerPendingInvitationsDeleteDialog
      v-model:open="showDeleteInvitationDialog"
      :invite="inviteToModify"
      :result-variables="resultVariables"
    />

    <CommonLoadingBar v-if="loading && !invites?.length" loading />

    <InfiniteLoading
      v-if="invites?.length"
      :settings="{ identifier: infiniteLoaderId }"
      class="py-4"
      @infinite="infiniteLoad"
    />
    <SettingsServerUserInviteDialog v-model:open="showInviteDialog" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { debounce } from 'lodash-es'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { MagnifyingGlassIcon, TrashIcon, UserPlusIcon } from '@heroicons/vue/24/outline'
import type { ItemType, InviteItem } from '~~/lib/server-management/helpers/types'
import type { InfiniteLoaderState } from '~~/lib/global/helpers/components'
import { getInvitesQuery } from '~~/lib/server-management/graphql/queries'
import { adminResendInviteMutation } from '~~/lib/server-management/graphql/mutations'
import { isInvite } from '~~/lib/server-management/helpers/utils'
import { useGlobalToast, ToastNotificationType } from '~~/lib/common/composables/toast'
import {
  convertThrowIntoFetchResult,
  getFirstErrorMessage
} from '~~/lib/common/helpers/graphql'

const logger = useLogger()
const { triggerNotification } = useGlobalToast()
const { mutate: resendInvitationMutation } = useMutation(adminResendInviteMutation)

const inviteToModify = ref<InviteItem | null>(null)
const searchString = ref('')
const showDeleteInvitationDialog = ref(false)
const infiniteLoaderId = ref('')
const successfullyResentInvites = ref<string[]>([])
const showInviteDialog = ref(false)

const {
  result: extraPagesResult,
  fetchMore: fetchMorePages,
  variables: resultVariables,
  onResult,
  loading
} = useQuery(getInvitesQuery, () => ({
  limit: 50,
  query: searchString.value
}))

const moreToLoad = computed(
  () =>
    !extraPagesResult.value?.admin?.inviteList ||
    extraPagesResult.value.admin.inviteList.items.length <
      extraPagesResult.value.admin.inviteList.totalCount
)

const invites = computed(() => extraPagesResult.value?.admin.inviteList.items || [])

const openDeleteInvitationDialog = (item: ItemType) => {
  if (isInvite(item)) {
    inviteToModify.value = item
    showDeleteInvitationDialog.value = true
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

const toggleInviteDialog = () => {
  showInviteDialog.value = true
}

onResult(calculateLoaderId)
</script>
