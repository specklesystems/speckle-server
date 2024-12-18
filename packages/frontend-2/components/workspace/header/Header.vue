<template>
  <div class="flex flex-col gap-3 lg:gap-4">
    <div v-if="!isWorkspaceGuest && !isInTrial">
      <BillingAlert :workspace="workspaceInfo" :actions="billingAlertAction" />
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
        <LayoutMenu
          v-model:open="showAddNewProjectMenu"
          :items="addNewProjectItems"
          :menu-position="HorizontalDirection.Left"
          :menu-id="menuId"
          @click.stop.prevent
          @chosen="onAddNewProjectActionChosen"
        >
          <FormButton
            color="outline"
            class="hidden md:block"
            @click="showAddNewProjectMenu = !showAddNewProjectMenu"
          >
            <div class="flex items-center gap-1">
              Add project
              <ChevronDownIcon class="h-3 w-3" />
            </div>
          </FormButton>
          <FormButton
            color="outline"
            class="md:hidden"
            hide-text
            :icon-left="PlusIcon"
            @click="showAddNewProjectMenu = !showAddNewProjectMenu"
          >
            Add project
          </FormButton>
        </LayoutMenu>

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

    <!-- Mobile header elements -->
    <div class="flex flex-col gap-2 lg:hidden mb-2">
      <BillingAlert
        v-if="!isWorkspaceGuest && isInTrial"
        :workspace="workspaceInfo"
        :actions="billingAlertAction"
        condensed
      />
      <WorkspaceSidebarAbout
        v-if="workspaceInfo.description"
        :workspace-info="workspaceInfo"
        @show-settings-dialog="openSettingsDialog"
      />
      <WorkspaceSidebarMembers
        :workspace-info="workspaceInfo"
        :is-workspace-guest="isWorkspaceGuest"
        @show-settings-dialog="openSettingsDialog"
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
import type { LayoutMenuItem } from '~~/lib/layout/helpers/components'
import { Cog8ToothIcon, ChevronDownIcon, PlusIcon } from '@heroicons/vue/24/outline'
import { HorizontalDirection } from '~~/lib/common/composables/window'
import {
  SettingMenuKeys,
  type AvailableSettingsMenuKeys
} from '~/lib/settings/helpers/types'
import { LayoutMenu, type AlertAction } from '@speckle/ui-components'
import { Roles } from '@speckle/shared'

graphql(`
  fragment WorkspaceHeader_Workspace on Workspace {
    ...WorkspaceBase_Workspace
    ...WorkspaceTeam_Workspace
    ...BillingAlert_Workspace
  }
`)

enum AddNewProjectActionTypes {
  NewProject = 'new-project',
  MoveProject = 'move-project'
}

const emit = defineEmits<{
  (e: 'show-settings-dialog', v: AvailableSettingsMenuKeys): void
  (e: 'show-move-projects-dialog'): void
  (e: 'show-new-project-dialog'): void
}>()

const props = defineProps<{
  workspaceInfo: WorkspaceHeader_WorkspaceFragment
}>()

const menuId = useId()

const showAddNewProjectMenu = ref(false)

const addNewProjectItems = computed<LayoutMenuItem[][]>(() => [
  [
    { title: 'New project...', id: AddNewProjectActionTypes.NewProject },
    { title: 'Move project...', id: AddNewProjectActionTypes.MoveProject }
  ]
])

const isWorkspaceAdmin = computed(
  () => props.workspaceInfo.role === Roles.Workspace.Admin
)

const isInTrial = computed(
  () =>
    props.workspaceInfo.plan?.status === WorkspacePlanStatuses.Trial ||
    !props.workspaceInfo.plan
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

const onAddNewProjectActionChosen = (params: {
  item: LayoutMenuItem
  event: MouseEvent
}) => {
  const { item } = params

  switch (item.id) {
    case AddNewProjectActionTypes.NewProject:
      emit('show-new-project-dialog')
      break
    case AddNewProjectActionTypes.MoveProject:
      emit('show-move-projects-dialog')
      break
  }
}
</script>
