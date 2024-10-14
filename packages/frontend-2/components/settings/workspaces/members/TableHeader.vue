<template>
  <div class="flex flex-col-reverse md:justify-between md:flex-row md:gap-x-4">
    <div class="relative mt-6 md:mt-0 gap-x-4 flex justify-flex-start">
      <FormTextInput
        name="search"
        :custom-icon="MagnifyingGlassIcon"
        color="foundation"
        full-width
        search
        show-clear
        :placeholder="searchPlaceholder"
        class="rounded-md h-full lg:w-72"
        v-bind="bind"
        v-on="on"
      />
      <FormSelectWorkspaceRoles
        v-if="showRoleFilter"
        v-model="role"
        fully-control-value
        clearable
        class="!min-w-40"
        hide-description
        :hide-items="[Roles.Workspace.Guest]"
      />
    </div>
    <div v-if="!isWorkspaceAdmin" v-tippy="'You must be a workspace admin'">
      <FormButton :disabled="!isWorkspaceAdmin">Invite</FormButton>
    </div>
    <FormButton v-else @click="() => (isInviteDialogOpen = !isInviteDialogOpen)">
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
import { Roles, type WorkspaceRoles } from '@speckle/shared'

graphql(`
  fragment SettingsWorkspacesMembersTableHeader_Workspace on Workspace {
    id
    role
    ...WorkspaceInviteDialog_Workspace
  }
`)

const props = defineProps<{
  searchPlaceholder: string
  workspaceId: string
  workspace?: SettingsWorkspacesMembersTableHeader_WorkspaceFragment
  showRoleFilter?: boolean
}>()

const search = defineModel<string>('search')
const role = defineModel<WorkspaceRoles>('role')
const { on, bind } = useDebouncedTextInput({ model: search })
const isInviteDialogOpen = ref(false)

const isWorkspaceAdmin = computed(() => props.workspace?.role === Roles.Workspace.Admin)
</script>
