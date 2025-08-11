<template>
  <div>
    <div class="flex flex-col-reverse md:justify-between md:flex-row md:gap-x-4">
      <div class="relative mt-6 md:mt-0 gap-x-4 flex justify-flex-start">
        <FormTextInput
          name="search"
          :custom-icon="Search"
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
      <div v-tippy="inviteTooltipText">
        <FormButton
          v-if="!isWorkspaceGuest"
          :disabled="!canInvite"
          @click="isInviteDialogOpen = !isInviteDialogOpen"
        >
          Invite
        </FormButton>
      </div>
    </div>
    <InviteDialogWorkspace
      v-if="workspace"
      v-model:open="isInviteDialogOpen"
      :workspace="workspace"
    />
  </div>
</template>
<script setup lang="ts">
import { Search } from 'lucide-vue-next'
import { useDebouncedTextInput } from '@speckle/ui-components'
import type { SettingsWorkspacesMembersTableHeader_WorkspaceFragment } from '~/lib/common/generated/gql/graphql'
import { graphql } from '~/lib/common/generated/gql'
import {
  Roles,
  type WorkspaceRoles,
  type MaybeNullOrUndefined,
  type WorkspaceSeatType
} from '@speckle/shared'

graphql(`
  fragment SettingsWorkspacesMembersTableHeader_Workspace on Workspace {
    id
    slug
    role
    ...InviteDialogWorkspace_Workspace
    permissions {
      canInvite {
        ...FullPermissionCheckResult
      }
    }
  }
`)

const props = defineProps<{
  searchPlaceholder: string
  workspace: MaybeNullOrUndefined<SettingsWorkspacesMembersTableHeader_WorkspaceFragment>
  showRoleFilter?: boolean
  showSeatFilter?: boolean
}>()

const search = defineModel<string>('search')
const role = defineModel<WorkspaceRoles>('role')
const seatType = defineModel<WorkspaceSeatType>('seatType')
const { on, bind } = useDebouncedTextInput({ model: search })

const isInviteDialogOpen = ref(false)

const isWorkspaceGuest = computed(() => props.workspace?.role === Roles.Workspace.Guest)
const canInvite = computed(() => props.workspace?.permissions.canInvite.authorized)
const inviteTooltipText = computed(() =>
  canInvite.value ? undefined : props.workspace?.permissions.canInvite.message
)
</script>
