<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div>
    <!-- Mobile Toggle Button -->
    <Portal to="workspace-sidebar-toggle">
      <div class="lg:hidden">
        <FormButton color="outline" @click="isOpenMobile = !isOpenMobile">
          <IconSidebar
            v-if="!isOpenMobile"
            class="h-3.5 w-3.5 -ml-2 -mr-2 text-foreground-2"
          />
          <IconSidebarClose v-else class="h-4 w-4 -ml-1 -mr-1" />
        </FormButton>
      </div>
    </Portal>

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

          <!-- About -->
          <LayoutSidebarMenuGroup
            title="About"
            collapsible
            :plus-click="() => openSettingsDialog(SettingMenuKeys.Workspace.General)"
            plus-text="Edit description"
          >
            <div
              class="flex flex-col gap-2 text-body-2xs text-foreground-2 mt-1 px-4 pb-4"
            >
              {{ workspaceInfo.description || 'No workspace description' }}
              <FormButton
                v-if="!workspaceInfo.description"
                color="outline"
                size="sm"
                @click="openSettingsDialog(SettingMenuKeys.Workspace.General)"
              >
                Add description
              </FormButton>
            </div>
          </LayoutSidebarMenuGroup>

          <!-- Members -->
          <LayoutSidebarMenuGroup
            title="Members"
            collapsible
            :plus-click="() => openSettingsDialog(SettingMenuKeys.Workspace.Members)"
            plus-text="Edit team"
            :tag="workspaceInfo.team.totalCount.toString() || undefined"
          >
            <div v-if="!isWorkspaceGuest" class="mt-2 flex flex-col gap-2 px-4 pb-4">
              <div class="flex items-center gap-1">
                <UserAvatarGroup
                  :users="team.map((teamMember) => teamMember.user)"
                  class="max-w-[104px]"
                />
                <button
                  v-if="invitedTeamCount"
                  class="text-body-3xs p-2 rounded-full border border-dashed border-outline-2 hover:bg-foundation"
                  @click="openSettingsDialog(SettingMenuKeys.Workspace.Members)"
                >
                  + {{ invitedTeamCount }} pending
                </button>
              </div>
              <FormButton
                color="outline"
                size="sm"
                @click="openSettingsDialog(SettingMenuKeys.Workspace.Security)"
              >
                Invite your team
              </FormButton>
            </div>
          </LayoutSidebarMenuGroup>

          <!-- Security -->
          <LayoutSidebarMenuGroup
            title="Security"
            collapsible
            :plus-click="() => openSettingsDialog(SettingMenuKeys.Workspace.Security)"
            plus-text="Edit security"
          >
            <div class="text-body-2xs text-foreground-2 mt-2 px-4 pb-4">
              <template v-if="workspaceInfo.domains?.length">
                <div
                  v-for="domain in workspaceInfo.domains"
                  :key="domain.id"
                  class="py-1 px-2 rounded-full border border-outline-3 max-w-max"
                >
                  {{ domain.domain }}
                </div>
              </template>
              <template v-else>
                <div class="flex flex-col gap-2">
                  Verified domains not set.
                  <FormButton
                    color="outline"
                    size="sm"
                    @click="openSettingsDialog(SettingMenuKeys.Workspace.Security)"
                  >
                    Improve security
                  </FormButton>
                </div>
              </template>
            </div>
          </LayoutSidebarMenuGroup>
        </div>
      </LayoutSidebar>
    </div>
  </div>
</template>
<script setup lang="ts">
import { Roles } from '@speckle/shared'
import {
  LayoutSidebar,
  LayoutSidebarMenuGroup,
  type AlertAction,
  FormButton
} from '@speckle/ui-components'
import {
  WorkspacePlanStatuses,
  type WorkspaceSidebar_WorkspaceFragment
} from '~/lib/common/generated/gql/graphql'
import {
  SettingMenuKeys,
  type AvailableSettingsMenuKeys
} from '~/lib/settings/helpers/types'
import { graphql } from '~~/lib/common/generated/gql'

graphql(`
  fragment WorkspaceSidebar_Workspace on Workspace {
    ...BillingAlert_Workspace
    id
    slug
    role
    name
    logo
    description
    totalProjects: projects {
      totalCount
    }
    domains {
      id
      domain
    }
    team {
      totalCount
      items {
        id
        user {
          id
          name
          ...LimitedUserAvatar
        }
      }
    }
    ...WorkspaceInviteDialog_Workspace
  }
`)

const props = defineProps<{
  workspaceInfo: WorkspaceSidebar_WorkspaceFragment
}>()

const emit = defineEmits<{
  (e: 'show-invite-dialog'): void
  (e: 'show-settings-dialog', v: AvailableSettingsMenuKeys): void
  (e: 'show-move-projects-dialog'): void
}>()

const isOpenMobile = ref(false)

const team = computed(() => props.workspaceInfo.team.items || [])

const invitedTeamCount = computed(() => props.workspaceInfo?.invitedTeam?.length ?? 0)

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
