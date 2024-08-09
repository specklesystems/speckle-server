<template>
  <div class="flex flex-col-reverse md:justify-between md:flex-row md:gap-x-4">
    <div class="relative w-full md:max-w-sm mt-6 md:mt-0">
      <FormTextInput
        name="search"
        :custom-icon="MagnifyingGlassIcon"
        color="foundation"
        full-width
        search
        show-clear
        :placeholder="searchPlaceholder"
        class="rounded-md border border-outline-3"
        v-bind="bind"
        v-on="on"
      />
    </div>
    <FormButton @click="() => (isInviteDialogOpen = !isInviteDialogOpen)">
      Invite
    </FormButton>
    <WorkspaceInviteDialog
      v-model:open="isInviteDialogOpen"
      :workspace-id="workspaceId"
      :workspace="workspace"
    />
  </div>
</template>
<script setup lang="ts">
import { MagnifyingGlassIcon } from '@heroicons/vue/24/outline'
import { useDebouncedTextInput } from '@speckle/ui-components'
import type { SettingsWorkspacesMembersTableHeader_WorkspaceFragment } from '~/lib/common/generated/gql/graphql'
import { graphql } from '~/lib/common/generated/gql'

graphql(`
  fragment SettingsWorkspacesMembersTableHeader_Workspace on Workspace {
    id
    ...WorkspaceInviteDialog_Workspace
  }
`)

defineProps<{
  searchPlaceholder: string
  workspaceId: string
  workspace?: SettingsWorkspacesMembersTableHeader_WorkspaceFragment
}>()

const search = defineModel<string>('search')
const { on, bind } = useDebouncedTextInput({ model: search })
const isInviteDialogOpen = ref(false)
</script>
