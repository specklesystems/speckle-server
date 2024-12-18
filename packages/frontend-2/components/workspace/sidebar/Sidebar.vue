<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div>
    <!-- Mobile Toggle Button - currently not needed, but it will be -->
    <!-- <Portal to="workspace-sidebar-toggle">
      <div class="lg:hidden">
        <FormButton color="outline" @click="isOpenMobile = !isOpenMobile">
          <IconSidebar
            v-if="!isOpenMobile"
            class="h-3.5 w-3.5 -ml-2 -mr-2 text-foreground-2"
          />
          <IconSidebarClose v-else class="h-4 w-4 -ml-1 -mr-1" />
        </FormButton>
      </div>
    </Portal> -->

    <!-- Mobile Backdrop -->
    <div
      v-keyboard-clickable
      class="lg:hidden absolute inset-0 backdrop-blur-sm z-40 transition-all"
      :class="isOpenMobile ? 'opacity-100' : 'opacity-0 pointer-events-none'"
      @click="isOpenMobile = false"
    />

    <!-- Sidebar Content -->
    <div
      class="absolute right-0 z-40 lg:static h-full flex w-[17rem] shrink-0 transition-all"
      :class="isOpenMobile ? '' : 'translate-x-[17rem] lg:translate-x-0'"
    >
      <LayoutSidebar class="border-l border-outline-3 bg-foundation-page">
        <div class="flex flex-col divide-y divide-outline-3">
          <!-- Subscription Reminder -->
          <div class="p-4">
            <BillingAlert
              v-if="!isWorkspaceGuest"
              :workspace="workspaceInfo"
              :actions="billingAlertAction"
              condensed
            />
          </div>

          <div class="px-4">
            <WorkspaceSidebarAbout
              :workspace-info="workspaceInfo"
              collapsible
              @show-settings-dialog="openSettingsDialog"
            />
          </div>

          <!-- Members -->
          <div class="px-4">
            <WorkspaceSidebarMembers
              :workspace-info="workspaceInfo"
              :is-workspace-guest="isWorkspaceGuest"
              collapsible
              @show-settings-dialog="openSettingsDialog"
            />
          </div>

          <!-- Security -->
          <div v-if="!hasDomains" class="px-4">
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
    ...WorkspaceAbout_Workspace
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

const isOpenMobile = ref(false)

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
