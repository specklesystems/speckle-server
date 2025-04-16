<template>
  <div>
    <LayoutMenu
      v-model:open="showMenu"
      :items="menuItems"
      :menu-position="HorizontalDirection.Left"
      :menu-id="menuId"
      @click.stop.prevent
      @chosen="onActionChosen"
    >
      <FormButton
        color="outline"
        :class="hideTextOnMobile ? 'hidden md:block' : ''"
        @click="showMenu = !showMenu"
      >
        <div class="flex items-center gap-1">
          {{ buttonCopy || 'Add project' }}
          <ChevronDownIcon class="h-3 w-3" />
        </div>
      </FormButton>
      <FormButton
        color="outline"
        :class="hideTextOnMobile ? 'md:hidden' : 'hidden'"
        hide-text
        :icon-left="PlusIcon"
        @click="showMenu = !showMenu"
      >
        Add project
      </FormButton>
    </LayoutMenu>
    <WorkspacePlanLimitReachedDialog
      v-model:open="showLimitDialog"
      subtitle="Upgrade your plan to move project"
    >
      <template v-if="limitReachedWorkspace">
        <p class="text-body-xs text-foreground-2">
          The workspace
          <span class="font-bold">{{ limitReachedWorkspace.name }}</span>
          is on a {{ formatName(limitReachedWorkspace.plan?.name) }} plan with a limit
          of 1 project and 5 models. Upgrade the workspace to add more projects.
        </p>
        <div class="flex justify-end gap-1">
          <FormButton color="subtle" @click="showLimitDialog = false">
            Cancel
          </FormButton>
          <FormButton
            @click="
              navigateTo(settingsWorkspaceRoutes.billing.route(props.workspaceSlug))
            "
          >
            See plans
          </FormButton>
        </div>
      </template>
    </WorkspacePlanLimitReachedDialog>
  </div>
</template>

<script setup lang="ts">
import { ChevronDownIcon, PlusIcon } from '@heroicons/vue/24/outline'
import type {
  FullPermissionCheckResultFragment,
  WorkspaceMoveProjectManager_WorkspaceFragment
} from '~/lib/common/generated/gql/graphql'
import { HorizontalDirection } from '~~/lib/common/composables/window'
import type { LayoutMenuItem } from '~~/lib/layout/helpers/components'
import { formatName } from '~/lib/billing/helpers/plan'
import { settingsWorkspaceRoutes } from '~/lib/common/helpers/route'

enum AddNewProjectActionTypes {
  NewProject = 'new-project',
  MoveProject = 'move-project'
}

const emit = defineEmits<{
  (e: 'new-project'): void
  (e: 'move-project'): void
}>()

const props = defineProps<{
  workspaceName: string
  workspaceSlug: string
  workspacePlan: string
  hideTextOnMobile?: boolean
  buttonCopy?: string
  canCreateProject: FullPermissionCheckResultFragment | undefined
  canMoveProjectToWorkspace: FullPermissionCheckResultFragment | undefined
}>()

const menuId = useId()
const showMenu = ref(false)
const showLimitDialog = ref(false)
const limitReachedWorkspace = ref<WorkspaceMoveProjectManager_WorkspaceFragment | null>(
  null
)

const menuItems = computed<LayoutMenuItem[][]>(() => [
  [
    {
      title: 'Create new project...',
      id: AddNewProjectActionTypes.NewProject,
      disabled: isDisabled.value,
      disabledTooltip: isDisabled.value ? props.canCreateProject?.message : undefined
    },
    {
      title: 'Move existing project...',
      id: AddNewProjectActionTypes.MoveProject,
      disabled: isDisabled.value,
      disabledTooltip: isDisabled.value
        ? props.canMoveProjectToWorkspace?.message
        : undefined
    }
  ]
])

const onActionChosen = (params: { item: LayoutMenuItem; event: MouseEvent }) => {
  const { item } = params

  if (isLimitReached.value) {
    limitReachedWorkspace.value = {
      name: props.workspaceName
    } as WorkspaceMoveProjectManager_WorkspaceFragment
    showLimitDialog.value = true
    return
  }

  switch (item.id) {
    case AddNewProjectActionTypes.NewProject:
      emit('new-project')
      break
    case AddNewProjectActionTypes.MoveProject:
      emit('move-project')
      break
  }
}

const isLimitReached = computed(() => {
  return props.canCreateProject?.code === 'WorkspaceLimitsReached'
})

const isDisabled = computed(() => {
  return !props.canCreateProject?.authorized && !isLimitReached.value
})
</script>
