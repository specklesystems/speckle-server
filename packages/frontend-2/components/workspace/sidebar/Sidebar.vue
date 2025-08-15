<template>
  <LayoutSidebar class="w-full">
    <div class="flex flex-col divide-y divide-outline-3">
      <WorkspaceSidebarFreePlanAlert
        v-if="!isWorkspaceGuest && isFreePlan"
        :slug="workspaceSlug"
      />
      <WorkspaceSidebarAbout
        :workspace="workspace"
        :is-workspace-admin="isWorkspaceAdmin"
      />
      <WorkspaceSidebarMembers
        v-if="!isWorkspaceGuest"
        :workspace="workspace"
        :is-workspace-admin="isWorkspaceAdmin"
        collapsible
      />
      <WorkspaceSidebarSecurity
        v-if="isWorkspaceAdmin && !hasDomains"
        :workspace="workspace"
      />
    </div>
  </LayoutSidebar>
</template>

<script setup lang="ts">
import { Roles, WorkspacePlans, type MaybeNullOrUndefined } from '@speckle/shared'
import { LayoutSidebar } from '@speckle/ui-components'
import { graphql } from '~~/lib/common/generated/gql'
import type { WorkspaceSidebar_WorkspaceFragment } from '~~/lib/common/generated/gql/graphql'

graphql(`
  fragment WorkspaceSidebar_Workspace on Workspace {
    ...WorkspaceSidebarMembers_Workspace
    ...WorkspaceSidebarAbout_Workspace
    ...WorkspaceSidebarSecurity_Workspace
    id
    role
    slug
    domains {
      id
    }
    plan {
      name
    }
  }
`)

const props = defineProps<{
  workspaceSlug: string
  workspace?: MaybeNullOrUndefined<WorkspaceSidebar_WorkspaceFragment>
}>()

const workspace = computed(() => props.workspace)
const isFreePlan = computed(() => workspace.value?.plan?.name === WorkspacePlans.Free)
const isWorkspaceGuest = computed(() => workspace.value?.role === Roles.Workspace.Guest)
const isWorkspaceAdmin = computed(() => workspace.value?.role === Roles.Workspace.Admin)
const hasDomains = computed(() => workspace.value?.domains?.length)
</script>
