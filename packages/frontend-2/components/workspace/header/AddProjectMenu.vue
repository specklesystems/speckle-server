<template>
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
</template>

<script setup lang="ts">
import { ChevronDownIcon, PlusIcon } from '@heroicons/vue/24/outline'
import type { FullPermissionCheckResultFragment } from '~/lib/common/generated/gql/graphql'
import { HorizontalDirection } from '~~/lib/common/composables/window'
import type { LayoutMenuItem } from '~~/lib/layout/helpers/components'

enum AddNewProjectActionTypes {
  NewProject = 'new-project',
  MoveProject = 'move-project'
}

const emit = defineEmits<{
  (e: 'new-project'): void
  (e: 'move-project'): void
}>()

const props = defineProps<{
  hideTextOnMobile?: boolean
  buttonCopy?: string
  canCreateProject: FullPermissionCheckResultFragment | undefined
  canMoveProjectToWorkspace: FullPermissionCheckResultFragment | undefined
}>()

const menuId = useId()
const showMenu = ref(false)

const menuItems = computed<LayoutMenuItem[][]>(() => [
  [
    {
      title: 'Create new project...',
      id: AddNewProjectActionTypes.NewProject,
      disabled: !props.canCreateProject?.authorized,
      disabledTooltip: props.canCreateProject?.message
    },
    {
      title: 'Move existing project...',
      id: AddNewProjectActionTypes.MoveProject,
      disabled: !props.canMoveProjectToWorkspace?.authorized,
      disabledTooltip: props.canMoveProjectToWorkspace?.message
    }
  ]
])

const onActionChosen = (params: { item: LayoutMenuItem; event: MouseEvent }) => {
  const { item } = params

  switch (item.id) {
    case AddNewProjectActionTypes.NewProject:
      emit('new-project')
      break
    case AddNewProjectActionTypes.MoveProject:
      emit('move-project')
      break
  }
}
</script>
