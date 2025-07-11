<template>
  <div>
    <HeaderWorkspaceSwitcherHeader
      :name="workspace?.name"
      :logo="workspace?.logo"
      :to="workspaceRoute(workspace?.slug || '')"
    >
      <p class="text-body-2xs text-foreground-2 capitalize truncate">
        {{ formatName(workspace?.plan?.name) }} ·
        {{ workspace?.team?.totalCount ?? 0 }} member{{
          (workspace?.team?.totalCount ?? 0) > 1 ? 's' : ''
        }}
      </p>
      <template #actions>
        <div class="flex gap-x-2 w-full">
          <MenuItem>
            <FormButton
              color="outline"
              full-width
              size="sm"
              :to="settingsWorkspaceRoutes.general.route(workspace?.slug || '')"
            >
              Settings
            </FormButton>
          </MenuItem>
          <MenuItem v-if="!isWorkspaceGuest">
            <div v-tippy="inviteTooltipText" class="w-full">
              <FormButton
                full-width
                color="outline"
                size="sm"
                :disabled="!canInvite"
                @click="$emit('show-invite-dialog')"
              >
                Invite members
              </FormButton>
            </div>
          </MenuItem>
        </div>
      </template>
    </HeaderWorkspaceSwitcherHeader>
  </div>
</template>

<script setup lang="ts">
import { MenuItem } from '@headlessui/vue'
import { graphql } from '~/lib/common/generated/gql'
import type { HeaderWorkspaceSwitcherHeaderWorkspace_WorkspaceFragment } from '~/lib/common/generated/gql/graphql'
import { Roles, type MaybeNullOrUndefined } from '@speckle/shared'
import { workspaceRoute, settingsWorkspaceRoutes } from '~/lib/common/helpers/route'
import { formatName } from '~/lib/billing/helpers/plan'

graphql(`
  fragment HeaderWorkspaceSwitcherHeaderWorkspace_Workspace on Workspace {
    id
    name
    logo
    role
    slug
    permissions {
      canInvite {
        ...FullPermissionCheckResult
      }
    }
    plan {
      name
    }
    team {
      totalCount
    }
  }
`)

defineEmits(['show-invite-dialog'])

const props = defineProps<{
  workspace: MaybeNullOrUndefined<HeaderWorkspaceSwitcherHeaderWorkspace_WorkspaceFragment>
}>()

const isWorkspaceGuest = computed(() => props.workspace?.role === Roles.Workspace.Guest)
const canInvite = computed(() => props.workspace?.permissions.canInvite.authorized)
const inviteTooltipText = computed(() =>
  canInvite.value ? undefined : props.workspace?.permissions.canInvite.message
)
</script>
