<template>
  <div>
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
        <FormSelectSeatType
          v-if="showSeatFilter"
          v-model="seatType"
          fully-control-value
          clearable
          class="!min-w-40"
          hide-description
        />
      </div>
      <template v-if="showInviteButton">
        <div v-if="!isWorkspaceAdmin" v-tippy="'You must be a workspace admin'">
          <FormButton :disabled="!isWorkspaceAdmin">Invite</FormButton>
        </div>
        <FormButton v-else @click="() => emit('openInviteDialog')">Invite</FormButton>
      </template>
    </div>
  </div>
</template>
<script setup lang="ts">
import { MagnifyingGlassIcon } from '@heroicons/vue/24/outline'
import { useDebouncedTextInput } from '@speckle/ui-components'
import { graphql } from '~/lib/common/generated/gql'
import { Roles, type WorkspaceRoles, type WorkspaceSeatType } from '@speckle/shared'

graphql(`
  fragment SettingsWorkspacesMembersTableHeader_Workspace on Workspace {
    id
    slug
    role
    ...InviteDialogWorkspace_Workspace
  }
`)

defineProps<{
  searchPlaceholder: string
  showRoleFilter?: boolean
  showInviteButton?: boolean
  showSeatFilter?: boolean
  isWorkspaceAdmin: boolean
}>()

const emit = defineEmits<{
  (e: 'openInviteDialog'): void
}>()

const search = defineModel<string>('search')
const role = defineModel<WorkspaceRoles>('role')
const seatType = defineModel<WorkspaceSeatType>('seatType')
const { on, bind } = useDebouncedTextInput({ model: search })
</script>
