<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div class="w-full">
    <!-- Sidebar Content -->
    <div class="w-full">
      <LayoutSidebar>
        <div class="flex flex-col divide-y divide-outline-3">
          <!-- Subscription Reminder -->
          <div v-if="!isWorkspaceGuest && isInTrial" class="p-4 pt-2">
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
              @show-settings-dialog="openSettingsDialog"
            />
          </div>

          <!-- Members -->
          <div v-if="!isWorkspaceGuest" class="px-4 py-2">
            <WorkspaceSidebarMembers
              :workspace-info="workspaceInfo"
              :is-workspace-admin="isWorkspaceAdmin"
              collapsible
              @show-settings-dialog="openSettingsDialog"
              @show-invite-dialog="$emit('show-invite-dialog')"
            />
          </div>

          <!-- Security -->
          <div v-if="isWorkspaceAdmin && !hasDomains" class="px-4 py-2">
            <WorkspaceSidebarSecurity
              :workspace-info="workspaceInfo"
              @show-settings-dialog="openSettingsDialog"
            />
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
import {
  SettingMenuKeys,
  type AvailableSettingsMenuKeys
} from '~/lib/settings/helpers/types'
import { graphql } from '~~/lib/common/generated/gql'

graphql(`
  fragment WorkspaceSidebar_Workspace on Workspace {
    ...WorkspaceDashboardAbout_Workspace
    ...WorkspaceTeam_Workspace
    ...WorkspaceSecurity_Workspace
    plan {
      status
    }
  }
`)

const props = defineProps<{
  workspaceInfo: WorkspaceProjectList_WorkspaceFragment
}>()

const emit = defineEmits<{
  (e: 'show-invite-dialog'): void
  (e: 'show-settings-dialog', v: AvailableSettingsMenuKeys): void
  (e: 'show-move-projects-dialog'): void
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
        onClick: () => openSettingsDialog(SettingMenuKeys.Workspace.Billing)
      }
    ]
  }
  return []
})

const openSettingsDialog = (target: AvailableSettingsMenuKeys) => {
  emit('show-settings-dialog', target)
}
</script>
