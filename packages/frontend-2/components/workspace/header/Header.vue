<template>
  <div>
    <div class="flex flex-col gap-3 lg:gap-4">
      <div class="flex items-center justify-between">
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
          <LayoutMenu
            v-model:open="showActionsMenu"
            :items="actionsItems"
            :menu-position="HorizontalDirection.Right"
            :menu-id="addNewProjectMenuId"
            class="hidden lg:block"
            @click.stop.prevent
            @chosen="onActionChosen"
          >
            <FormButton
              :color="showActionsMenu ? 'outline' : 'subtle'"
              hide-text
              :icon-right="EllipsisHorizontalIcon"
              @click="showActionsMenu = !showActionsMenu"
            />
          </LayoutMenu>
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
      <div class="lg:hidden">
        <BillingAlert
          v-if="!isWorkspaceGuest"
          :workspace="workspaceInfo"
          :actions="billingAlertAction"
          condensed
        />
        <div
          v-if="workspaceInfo.description"
          class="text-body-2xs text-foreground-2 mt-3 lg:mt-4"
        >
          {{ workspaceInfo.description }}
        </div>
        <div
          v-if="workspaceInfo.description"
          class="text-body-2xs text-foreground-2 mt-3 lg:mt-4"
        >
          {{ workspaceInfo.description }}
        </div>
      </div>
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
import {
  EllipsisHorizontalIcon,
  Cog8ToothIcon,
  ChevronDownIcon,
  PlusIcon
} from '@heroicons/vue/24/outline'
import { copyWorkspaceLink } from '~/lib/workspaces/composables/management'
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

enum ActionTypes {
  CopyLink = 'copy-link'
}

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
const addNewProjectMenuId = useId()

const showActionsMenu = ref(false)
const showAddNewProjectMenu = ref(false)

const actionsItems = computed<LayoutMenuItem[][]>(() => [
  [{ title: 'Copy Link', id: ActionTypes.CopyLink }]
])

const addNewProjectItems = computed<LayoutMenuItem[][]>(() => [
  [
    { title: 'New project', id: AddNewProjectActionTypes.NewProject },
    { title: 'Move project', id: AddNewProjectActionTypes.MoveProject }
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

const onActionChosen = (params: { item: LayoutMenuItem; event: MouseEvent }) => {
  const { item } = params

  switch (item.id) {
    case ActionTypes.CopyLink:
      copyWorkspaceLink(props.workspaceInfo.slug)
      break
  }
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
