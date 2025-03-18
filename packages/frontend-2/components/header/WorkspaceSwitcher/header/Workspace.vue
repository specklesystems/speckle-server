<template>
  <div>
    <HeaderWorkspaceSwitcherHeader
      :name="workspace?.name"
      :logo="workspace?.logo"
      :to="workspaceRoute(activeWorkspaceSlug || '')"
    >
      <p class="text-body-2xs text-foreground-2 capitalize truncate">
        {{ workspace?.plan?.name }} · {{ workspace?.team?.totalCount }} member{{
          workspace?.team?.totalCount > 1 ? 's' : ''
        }}
      </p>
      <template #actions>
        <div class="flex gap-x-2 w-full">
          <MenuItem>
            <FormButton
              color="outline"
              full-width
              size="sm"
              :to="settingsWorkspaceRoutes.general.route(activeWorkspaceSlug || '')"
            >
              Settings
            </FormButton>
          </MenuItem>
          <MenuItem>
            <FormButton
              full-width
              color="outline"
              size="sm"
              :disabled="workspace?.role !== Roles.Workspace.Admin"
              @click="showInviteDialog = true"
            >
              Invite members
            </FormButton>
          </MenuItem>
        </div>
      </template>
    </HeaderWorkspaceSwitcherHeader>

    <InviteDialogWorkspace v-model:open="showInviteDialog" :workspace="workspace" />
  </div>
</template>

<script setup lang="ts">
import { MenuItem } from '@headlessui/vue'
import { graphql } from '~/lib/common/generated/gql'
import type { HeaderWorkspaceSwitcherHeaderWorkspace_WorkspaceFragment } from '~/lib/common/generated/gql/graphql'
import { Roles, type MaybeNullOrUndefined } from '@speckle/shared'
import { workspaceRoute, settingsWorkspaceRoutes } from '~/lib/common/helpers/route'
import { useNavigation } from '~~/lib/navigation/composables/navigation'

graphql(`
  fragment HeaderWorkspaceSwitcherHeaderWorkspace_Workspace on Workspace {
    ...InviteDialogWorkspace_Workspace
    id
    name
    logo
    role
    plan {
      name
    }
    team {
      totalCount
    }
  }
`)

defineProps<{
  workspace: MaybeNullOrUndefined<HeaderWorkspaceSwitcherHeaderWorkspace_WorkspaceFragment>
}>()

const { activeWorkspaceSlug } = useNavigation()

const showInviteDialog = ref(false)
</script>
