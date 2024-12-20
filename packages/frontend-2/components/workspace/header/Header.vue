<template>
  <div class="flex flex-col gap-3 lg:gap-4">
    <div v-if="!isWorkspaceGuest && !isInTrial && !hasValidPlan">
      <BillingAlert :workspace="workspaceInfo" :actions="billingAlertAction" />
    </div>
    <div v-if="!isWorkspaceGuest && isInTrial" class="lg:hidden">
      <BillingAlert
        :workspace="workspaceInfo"
        :actions="billingAlertAction"
        condensed
      />
    </div>
    <div class="flex items-center justify-between gap-4">
      <div class="flex items-center gap-3 lg:gap-4">
        <WorkspaceAvatar
          :name="workspaceInfo.name"
          :logo="workspaceInfo.logo"
          size="lg"
          class="hidden md:block"
        />
        <WorkspaceAvatar
          class="md:hidden"
          :name="workspaceInfo.name"
          :logo="workspaceInfo.logo"
        />
        <h1 class="text-heading-sm md:text-heading line-clamp-2">
          {{ workspaceInfo.name }}
        </h1>
        <CommonBadge rounded color-classes="bg-highlight-3 text-foreground-2">
          <span class="capitalize">
            {{ workspaceInfo.role?.split(':').reverse()[0] }}
          </span>
        </CommonBadge>
      </div>

      <div class="flex gap-1.5 md:gap-2">
        <WorkspaceHeaderAddProjectMenu
          v-if="!isWorkspaceGuest"
          :is-workspace-admin="isWorkspaceAdmin"
          hide-text-on-mobile
          @new-project="$emit('show-new-project-dialog')"
          @move-project="$emit('show-move-projects-dialog')"
        />

        <FormButton
          color="outline"
          :icon-left="Cog8ToothIcon"
          hide-text
          @click="openSettingsDialog(SettingMenuKeys.Workspace.General)"
        >
          Settings
        </FormButton>
        <ClientOnly>
          <PortalTarget name="workspace-sidebar-toggle"></PortalTarget>
        </ClientOnly>
      </div>
    </div>

    <div class="lg:hidden mb-2">
      <WorkspaceSidebarMembers
        v-if="!isWorkspaceGuest"
        :workspace-info="workspaceInfo"
        :is-workspace-admin="isWorkspaceAdmin"
        @show-settings-dialog="openSettingsDialog"
        @show-invite-dialog="$emit('show-invite-dialog')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import {
  WorkspacePlanStatuses,
  type WorkspaceHeader_WorkspaceFragment
} from '~~/lib/common/generated/gql/graphql'
import { Cog8ToothIcon } from '@heroicons/vue/24/outline'
import {
  SettingMenuKeys,
  type AvailableSettingsMenuKeys
} from '~/lib/settings/helpers/types'
import { type AlertAction } from '@speckle/ui-components'
import { Roles } from '@speckle/shared'

graphql(`
  fragment WorkspaceHeader_Workspace on Workspace {
    ...WorkspaceBase_Workspace
    ...WorkspaceTeam_Workspace
    ...BillingAlert_Workspace
  }
`)

const emit = defineEmits<{
  (e: 'show-settings-dialog', v: AvailableSettingsMenuKeys): void
  (e: 'show-move-projects-dialog'): void
  (e: 'show-new-project-dialog'): void
  (e: 'show-invite-dialog'): void
}>()

const props = defineProps<{
  workspaceInfo: WorkspaceHeader_WorkspaceFragment
}>()

const isWorkspaceAdmin = computed(
  () => props.workspaceInfo.role === Roles.Workspace.Admin
)
const isInTrial = computed(
  () =>
    props.workspaceInfo.plan?.status === WorkspacePlanStatuses.Trial ||
    !props.workspaceInfo.plan
)
const hasValidPlan = computed(
  () => props.workspaceInfo.plan?.status === WorkspacePlanStatuses.Valid
)
const isWorkspaceGuest = computed(
  () => props.workspaceInfo.role === Roles.Workspace.Guest
)
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
