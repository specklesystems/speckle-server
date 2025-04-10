<template>
  <div class="flex flex-col gap-3 lg:gap-4">
    <div v-if="!isWorkspaceGuest">
      <BillingAlert :workspace="workspaceInfo" :actions="billingAlertAction" />
    </div>
    <div class="flex items-center justify-between gap-4">
      <div class="flex items-center gap-3 lg:gap-4">
        <template v-if="isWorkspaceNewPlansEnabled">
          <h1 class="text-heading-sm md:text-heading line-clamp-2">
            Hello, {{ activeUser?.name }}
          </h1>
        </template>
        <template v-else>
          <WorkspaceAvatar
            v-tippy="workspaceInfo.logo ? undefined : 'Add a workspace icon'"
            :name="workspaceInfo.name"
            :logo="workspaceInfo.logo"
            size="lg"
            class="hidden md:block"
            :class="{ 'cursor-pointer': !workspaceInfo.logo }"
            is-button
            @click="
              workspaceInfo.logo
                ? undefined
                : navigateTo(settingsWorkspaceRoutes.general.route(workspaceInfo.slug))
            "
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
        </template>
      </div>

      <div class="flex gap-1.5 md:gap-2">
        <WorkspaceHeaderAddProjectMenu
          hide-text-on-mobile
          :can-create-project="canCreateProject"
          :can-move-project="canMoveProject"
          @new-project="$emit('show-new-project-dialog')"
          @move-project="$emit('show-move-projects-dialog')"
        />

        <FormButton
          color="outline"
          :icon-left="Cog8ToothIcon"
          hide-text
          @click="navigateTo(settingsWorkspaceRoutes.general.route(workspaceInfo.slug))"
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
        :is-workspace-guest="isWorkspaceGuest"
        @show-invite-dialog="$emit('show-invite-dialog')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import {
  WorkspacePlanStatuses,
  type FullPermissionCheckResultFragment,
  type WorkspaceHeader_WorkspaceFragment
} from '~~/lib/common/generated/gql/graphql'
import { Cog8ToothIcon } from '@heroicons/vue/24/outline'
import type { AlertAction } from '@speckle/ui-components'
import { Roles } from '@speckle/shared'
import { settingsWorkspaceRoutes } from '~/lib/common/helpers/route'

graphql(`
  fragment WorkspaceHeader_Workspace on Workspace {
    ...WorkspaceBase_Workspace
    ...WorkspaceTeam_Workspace
    ...BillingAlert_Workspace
    slug
    readOnly
    permissions {
      canCreateProject {
        ...FullPermissionCheckResult
      }
    }
  }
`)

defineEmits<{
  (e: 'show-move-projects-dialog'): void
  (e: 'show-new-project-dialog'): void
  (e: 'show-invite-dialog'): void
}>()

const props = defineProps<{
  workspaceInfo: WorkspaceHeader_WorkspaceFragment
}>()

const isWorkspaceNewPlansEnabled = useWorkspaceNewPlansEnabled()
const { activeUser } = useActiveUser()

const isWorkspaceAdmin = computed(
  () => props.workspaceInfo.role === Roles.Workspace.Admin
)
const isWorkspaceGuest = computed(
  () => props.workspaceInfo.role === Roles.Workspace.Guest
)

const canCreateProject = computed(
  () => props.workspaceInfo.permissions.canCreateProject
)
const canMoveProject = computed((): FullPermissionCheckResultFragment => {
  // TODO: Until we have a real resolver
  return {
    authorized: isWorkspaceAdmin.value,
    message: isWorkspaceAdmin.value ? 'OK' : 'You must be a workspace admin',
    code: isWorkspaceAdmin.value ? 'OK' : 'FORBIDDEN'
  }
})

const billingAlertAction = computed<Array<AlertAction>>(() => {
  if (
    isWorkspaceAdmin.value ||
    props.workspaceInfo.plan?.status === WorkspacePlanStatuses.Expired
  ) {
    return [
      {
        title: 'Subscribe',
        onClick: () =>
          navigateTo(settingsWorkspaceRoutes.billing.route(props.workspaceInfo.slug))
      }
    ]
  }

  return []
})
</script>
