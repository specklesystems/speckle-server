<template>
  <div class="w-full">
    <div class="w-full">
      <LayoutSidebar>
        <div class="flex flex-col divide-y divide-outline-3">
          <div v-if="!isWorkspaceGuest && isInTrial" class="p-4">
            <BillingAlert
              :workspace="workspaceInfo"
              :actions="billingAlertAction"
              condensed
            />
          </div>
          <div class="px-4 py-2">
            <WorkspaceSidebarAbout
              :workspace-info="workspaceInfo"
              collapsible
              :is-workspace-admin="isWorkspaceAdmin"
            />
          </div>
          <div v-if="!isWorkspaceGuest" class="px-4 py-2">
            <WorkspaceSidebarMembers
              :workspace-info="workspaceInfo"
              :is-workspace-admin="isWorkspaceAdmin"
              collapsible
              @show-invite-dialog="$emit('show-invite-dialog')"
            />
          </div>
          <div v-if="isWorkspaceAdmin && !hasDomains" class="px-4 py-2">
            <WorkspaceSidebarSecurity :workspace-info="workspaceInfo" />
          </div>
        </div>
      </LayoutSidebar>
    </div>
  </div>
</template>
<script setup lang="ts">
import { Roles } from '@speckle/shared'
import { LayoutSidebar, type AlertAction } from '@speckle/ui-components'
import {
  WorkspacePlanStatuses,
  type WorkspaceProjectList_WorkspaceFragment
} from '~/lib/common/generated/gql/graphql'
import { graphql } from '~~/lib/common/generated/gql'
import { settingsRoutes } from '~/lib/common/helpers/route'

graphql(`
  fragment WorkspaceSidebar_Workspace on Workspace {
    ...WorkspaceDashboardAbout_Workspace
    ...WorkspaceTeam_Workspace
    ...WorkspaceSecurity_Workspace
    slug
    plan {
      status
    }
  }
`)

defineEmits<{
  (e: 'show-invite-dialog'): void
  (e: 'show-move-projects-dialog'): void
}>()

const props = defineProps<{
  workspaceInfo: WorkspaceProjectList_WorkspaceFragment
}>()

const isWorkspaceGuest = computed(
  () => props.workspaceInfo.role === Roles.Workspace.Guest
)

const isWorkspaceAdmin = computed(
  () => props.workspaceInfo.role === Roles.Workspace.Admin
)

const isInTrial = computed(
  () =>
    props.workspaceInfo.plan?.status === WorkspacePlanStatuses.Trial ||
    !props.workspaceInfo.plan
)

const hasDomains = computed(() => props.workspaceInfo.domains?.length)

const billingAlertAction = computed<Array<AlertAction>>(() => {
  if (isInTrial.value && isWorkspaceAdmin.value) {
    return [
      {
        title: 'Subscribe',
        onClick: () =>
          navigateTo(settingsRoutes.workspace(props.workspaceInfo.slug).billing)
      }
    ]
  }
  return []
})
</script>
