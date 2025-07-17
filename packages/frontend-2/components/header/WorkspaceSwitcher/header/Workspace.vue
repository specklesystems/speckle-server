<template>
  <div>
    <div v-if="isLoading" class="px-4 flex justify-center h-[6.25rem] items-center">
      <CommonLoadingIcon />
    </div>
    <HeaderWorkspaceSwitcherHeader
      v-else
      :name="workspace?.name"
      :logo="workspace?.logo"
      :to="workspaceRoute(activeWorkspaceSlug)"
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
              :to="settingsWorkspaceRoutes.general.route(activeWorkspaceSlug)"
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
                @click="isInviteDialogOpen = true"
              >
                Invite members
              </FormButton>
            </div>
          </MenuItem>
        </div>
      </template>
    </HeaderWorkspaceSwitcherHeader>

    <InviteDialogWorkspace v-model:open="isInviteDialogOpen" :workspace="workspace" />
  </div>
</template>

<script setup lang="ts">
import { MenuItem } from '@headlessui/vue'
import { graphql } from '~/lib/common/generated/gql'
import { Roles, type MaybeNullOrUndefined } from '@speckle/shared'
import { workspaceRoute, settingsWorkspaceRoutes } from '~/lib/common/helpers/route'
import { formatName } from '~/lib/billing/helpers/plan'
import { workspaceSwitcherHeaderWorkspaceQuery } from '~/lib/navigation/graphql/queries'
import { useQuery } from '@vue/apollo-composable'

graphql(`
  fragment HeaderWorkspaceSwitcherHeaderWorkspace_Workspace on Workspace {
    ...InviteDialogWorkspace_Workspace
    id
    logo
    name
    role
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

const props = defineProps<{
  activeWorkspaceSlug: MaybeNullOrUndefined<string>
}>()

const { result, loading: isLoading } = useQuery(
  workspaceSwitcherHeaderWorkspaceQuery,
  () => ({
    slug: props.activeWorkspaceSlug || ''
  }),
  {
    enabled: !!props.activeWorkspaceSlug
  }
)

const isInviteDialogOpen = ref(false)

const workspace = computed(() => result.value?.workspaceBySlug)
const isWorkspaceGuest = computed(() => workspace.value?.role === Roles.Workspace.Guest)
const canInvite = computed(() => workspace.value?.permissions.canInvite.authorized)
const inviteTooltipText = computed(() =>
  canInvite.value ? undefined : workspace.value?.permissions.canInvite.message
)
</script>
