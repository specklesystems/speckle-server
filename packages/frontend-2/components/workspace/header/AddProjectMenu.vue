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
    <WorkspacePlanProjectModelLimitReachedDialog
      v-model:open="showLimitDialog"
      :workspace-name="props.workspaceName"
      :plan="props.workspacePlan"
      :workspace-role="props.workspaceRole"
      :workspace-slug="props.workspaceSlug"
      location="add project menu"
      limit-type="project"
    />
  </div>
</template>

<script setup lang="ts">
import { ChevronDownIcon, PlusIcon } from '@heroicons/vue/24/outline'
import type { FullPermissionCheckResultFragment } from '~/lib/common/generated/gql/graphql'
import { HorizontalDirection } from '~~/lib/common/composables/window'
import type { LayoutMenuItem } from '~~/lib/layout/helpers/components'
import type { MaybeNullOrUndefined, WorkspacePlans } from '@speckle/shared'

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
  workspacePlan?: WorkspacePlans
  hideTextOnMobile?: boolean
  buttonCopy?: string
  canCreateProject: FullPermissionCheckResultFragment | undefined
  canMoveProjectToWorkspace: FullPermissionCheckResultFragment | undefined
  workspaceRole: MaybeNullOrUndefined<string>
}>()

const menuId = useId()
const showMenu = ref(false)
const showLimitDialog = ref(false)

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
