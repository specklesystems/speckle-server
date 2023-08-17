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

    <Table
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
          <Avatar v-if="isInvite(item)" :user="item.invitedBy" />
          {{ isInvite(item) ? item.invitedBy.name : '' }}
        </div>
      </template>

      <template #resend="{ item }">
        <FormButton
          :link="true"
          class="font-semibold text-primary"
          @click="resendInvitation(item)"
        >
          Resend Invitation
        </FormButton>
      </template>
    </Table>

    <DeleteInvitationDialog
      v-model:open="showDeleteInvitationDialog"
      :user="user ?? userToModify"
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
          onClick: closeDeleteInvitationDialog
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
import { useQuery } from '@vue/apollo-composable'
import { debounce } from 'lodash-es'
import Table from '~~/components/server-management/Table.vue'
import Avatar from '~~/components/user/Avatar.vue'
import { ItemType, InviteItem } from '~~/lib/server-management/helpers/types'
import { InfiniteLoaderState } from '~~/lib/global/helpers/components'
import { graphql } from '~~/lib/common/generated/gql'
import { MagnifyingGlassIcon, TrashIcon } from '@heroicons/vue/20/solid'
import { isInvite } from '~~/lib/server-management/helpers/utils'

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

const logger = useLogger()

definePageMeta({
  middleware: ['admin']
})

const inviteToModify = ref<InviteItem | null>(null)
const searchString = ref('')
const showDeleteInvitationDialog = ref(false)
const infiniteLoaderId = ref('')

const moreToLoad = computed(
  () =>
    !extraPagesResult.value?.admin?.inviteList ||
    extraPagesResult.value.admin.inviteList.items.length <
      extraPagesResult.value.admin.inviteList.totalCount
)

const invites = computed(() => extraPagesResult.value?.admin.inviteList.items || [])

const openDeleteInvitationDialog = (item: ItemType) => {
  console.log('Trying to open the modal')
  if (isInvite(item)) {
    inviteToModify.value = item
    showDeleteInvitationDialog.value = true
    console.log('Modal should now be open')
  }
}

const handleSearchChange = (newSearchString: string) => {
  searchUpdateHandler(newSearchString)
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
