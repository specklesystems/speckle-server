<template>
  <div class="w-full">
    <div class="w-full">
      <LayoutSidebar>
        <div class="flex flex-col divide-y divide-outline-3">
          <div v-if="!isWorkspaceGuest && isFreePlan" class="p-4">
            <div
              class="p-2 pl-3 bg-info-lighter rounded-md flex items-center justify-between gap-x-2"
            >
              <p
                class="text-primary-focus text-body-3xs font-semibold dark:text-foreground"
              >
                You're on a free plan.
              </p>
              <FormButton
                size="sm"
                @click="
                  navigateTo(settingsWorkspaceRoutes.billing.route(workspaceInfo.slug))
                "
              >
                Upgrade
              </FormButton>
            </div>
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
import { LayoutSidebar } from '@speckle/ui-components'
import type { WorkspaceProjectList_WorkspaceFragment } from '~/lib/common/generated/gql/graphql'
import { graphql } from '~~/lib/common/generated/gql'
import { settingsWorkspaceRoutes } from '~/lib/common/helpers/route'
import { useWorkspacePlan } from '~/lib/workspaces/composables/plan'

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

const { isFreePlan } = useWorkspacePlan(props.workspaceInfo.slug)

const isWorkspaceGuest = computed(
  () => props.workspaceInfo.role === Roles.Workspace.Guest
)
const isWorkspaceAdmin = computed(
  () => props.workspaceInfo.role === Roles.Workspace.Admin
)
const hasDomains = computed(() => props.workspaceInfo.domains?.length)
</script>
