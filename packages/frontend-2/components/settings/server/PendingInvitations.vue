<template>
  <section>
    <div class="md:max-w-5xl md:mx-auto pb-6 md:pb-0">
      <SettingsSectionHeader
        title="Pending invitations"
        text="And overview of all your pending invititations"
      />
      <div class="flex flex-col-reverse md:justify-between md:flex-row md:gap-x-4">
        <div class="relative w-full md:max-w-md mt-6 md:mt-0">
          <FormTextInput
            name="search"
            :custom-icon="MagnifyingGlassIcon"
            color="foundation"
            full-width
            search
            :show-clear="!!search"
            placeholder="Search invitations"
            class="rounded-md border border-outline-3"
            v-bind="bind"
            v-on="on"
          />
        </div>
        <FormButton @click="toggleInviteDialog">Invite</FormButton>
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
            color="outline"
            size="sm"
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
      />

      <InfiniteLoading
        v-if="invites?.length"
        :settings="{ identifier }"
        class="py-4"
        @infinite="onInfiniteLoad"
      />

      <SettingsServerUserInviteDialog v-model:open="showInviteDialog" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useMutation } from '@vue/apollo-composable'
import { MagnifyingGlassIcon, TrashIcon } from '@heroicons/vue/24/outline'
import type { ItemType, InviteItem } from '~~/lib/server-management/helpers/types'
import { adminResendInviteMutation } from '~~/lib/server-management/graphql/mutations'
import { isInvite } from '~~/lib/server-management/helpers/utils'
import { useGlobalToast, ToastNotificationType } from '~~/lib/common/composables/toast'
import {
  convertThrowIntoFetchResult,
  getFirstErrorMessage
} from '~~/lib/common/helpers/graphql'
import { useDebouncedTextInput } from '@speckle/ui-components'
import { usePaginatedQuery } from '~/lib/common/composables/graphql'
import { getInvitesQuery } from '~~/lib/server-management/graphql/queries'

const { triggerNotification } = useGlobalToast()
const { mutate: resendInvitationMutation } = useMutation(adminResendInviteMutation)
const { on, bind, value: search } = useDebouncedTextInput()

const inviteToModify = ref<InviteItem | null>(null)
const showDeleteInvitationDialog = ref(false)
const successfullyResentInvites = ref<string[]>([])
const showInviteDialog = ref(false)

const {
  identifier,
  onInfiniteLoad,
  query: { result }
} = usePaginatedQuery({
  query: getInvitesQuery,
  baseVariables: computed(() => ({
    query: search.value?.length ? search.value : null,
    limit: 50
  })),
  resolveKey: (vars) => [vars.query || ''],
  resolveCurrentResult: (res) => res?.admin.inviteList,
  resolveNextPageVariables: (baseVars, cursor) => ({
    ...baseVars,
    cursor
  }),
  resolveCursorFromVariables: (vars) => vars.cursor
})

const invites = computed(() => result.value?.admin.inviteList.items || [])

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
      title: 'Invitation resent',
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

const toggleInviteDialog = () => {
  showInviteDialog.value = true
}
</script>
