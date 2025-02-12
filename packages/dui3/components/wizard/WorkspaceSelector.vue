<template>
  <div>
    <FormSelectBase
      key="name"
      v-model="selectedWorkspace"
      clearable
      label="Workspaces"
      placeholder="Nothing selected"
      name="Workspaces"
      show-label
      :items="workspaces"
      :disabled-item-predicate="userCantCreateWorkspace"
      mount-menu-on-body
    >
      <template #something-selected="{ value }">
        <span>{{ value.name }}</span>
      </template>
      <template #option="{ item }">
        <div
          v-tippy="{
            content: item.readOnly
              ? 'This workspace is read-only.'
              : item.role === 'workspace:guest'
              ? 'You do not have write access on this workspace.'
              : undefined,
            disabled: !(item.readOnly || item.role === 'workspace:guest')
          }"
          class="flex items-center"
        >
          <span class="truncate">{{ item.name }}</span>
        </div>
      </template>
    </FormSelectBase>
    <div
      v-if="selectedWorkspace"
      class="text-xs caption rounded p-2 bg-blue-500/10 my-2"
    >
      Project will be created in the selected workspace.
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuery } from '@vue/apollo-composable'
import { workspacesListQuery } from '~/lib/graphql/mutationsAndQueries'
import type { WorkspaceListWorkspaceItemFragment } from 'lib/common/generated/gql/graphql'
import { storeToRefs } from 'pinia'
import { useAccountStore } from '~/store/accounts'

const emit = defineEmits<{
  (
    e: 'update:selectedWorkspace',
    value: WorkspaceListWorkspaceItemFragment | undefined
  ): void
}>()

const accountStore = useAccountStore()
const { activeAccount } = storeToRefs(accountStore)
const accountId = computed(() => activeAccount.value.accountInfo.id)

const searchText = ref<string>()

const { result: workspacesResult } = useQuery(
  workspacesListQuery,
  () => ({
    limit: 5,
    filter: {
      search: (searchText.value || '').trim() || null
    }
  }),
  () => ({ clientId: accountId.value, debounce: 500, fetchPolicy: 'network-only' })
)

const workspaces = computed(() => workspacesResult.value?.activeUser?.workspaces.items)
const selectedWorkspace = ref<WorkspaceListWorkspaceItemFragment>()

watch(selectedWorkspace, (newVal) => {
  emit('update:selectedWorkspace', newVal)
})

// Utility function to check if the user cannot create a workspace
const userCantCreateWorkspace = (item: WorkspaceListWorkspaceItemFragment) =>
  (!!item?.role && item.role === 'workspace:guest') || !!item.readOnly
</script>
