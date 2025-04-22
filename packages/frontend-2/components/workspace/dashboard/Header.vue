<template>
  <div class="flex flex-col gap-3 lg:gap-4">
    <BillingAlert v-if="showBillingAlert" :workspace="workspace" />
    <div class="flex items-center justify-between gap-4">
      <div class="flex items-center gap-x-2">
        <h1 class="text-heading-sm md:text-heading line-clamp-2">
          Hello, {{ activeUser?.name }}
        </h1>
        <CommonBadge
          v-if="!isWorkspaceMember"
          rounded
          color-classes="bg-highlight-3 text-foreground-2"
        >
          <span class="capitalize">
            {{ workspace?.role?.split(':').reverse()[0] }}
          </span>
        </CommonBadge>
      </div>

      <div class="flex gap-1.5 md:gap-2">
        <WorkspaceAddProjectMenu
          :workspace-slug="workspaceSlug"
          :workspace="workspace"
          hide-text-on-mobile
        />
        <FormButton
          color="outline"
          :icon-left="Cog8ToothIcon"
          hide-text
          @click="navigateTo(settingsWorkspaceRoutes.general.route(workspace?.slug))"
        >
          Settings
        </FormButton>
      </div>
    </div>

    <div class="lg:hidden mb-2">
      <WorkspaceSidebarMembers
        :workspace="workspace"
        :is-workspace-admin="isWorkspaceAdmin"
        :is-workspace-guest="isWorkspaceGuest"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import type { WorkspaceDashboardHeader_WorkspaceFragment } from '~~/lib/common/generated/gql/graphql'
import { Cog8ToothIcon } from '@heroicons/vue/24/outline'
import { Roles, type MaybeNullOrUndefined } from '@speckle/shared'
import { settingsWorkspaceRoutes } from '~/lib/common/helpers/route'

graphql(`
  fragment WorkspaceDashboardHeader_Workspace on Workspace {
    ...WorkspaceSidebarMembers_Workspace
    ...WorkspaceAddProjectMenu_Workspace
    ...BillingAlert_Workspace
    id
    role
  }
`)

const props = defineProps<{
  workspaceSlug: string
  workspace: MaybeNullOrUndefined<WorkspaceDashboardHeader_WorkspaceFragment>
  showBillingAlert?: boolean
}>()

const { activeUser } = useActiveUser()

const isWorkspaceAdmin = computed(() => props.workspace?.role === Roles.Workspace.Admin)
const isWorkspaceGuest = computed(() => props.workspace?.role === Roles.Workspace.Guest)
const isWorkspaceMember = computed(
  () => props.workspace?.role === Roles.Workspace.Member
)
</script>
