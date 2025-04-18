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
          {{ hasProjects ? 'Add project' : 'Add your first project' }}
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
      :workspace-name="workspace?.name"
      :plan="workspace?.plan"
      :workspace-role="workspace?.role"
      :workspace-slug="workspaceSlug"
    />
  </div>
</template>

<script setup lang="ts">
import { ChevronDownIcon, PlusIcon } from '@heroicons/vue/24/outline'
import type { WorkspaceAddProjectMenu_WorkspaceFragment } from '~/lib/common/generated/gql/graphql'
import { HorizontalDirection } from '~~/lib/common/composables/window'
import type { LayoutMenuItem } from '~~/lib/layout/helpers/components'
import type { MaybeNullOrUndefined } from '@speckle/shared'
import { graphql } from '~~/lib/common/generated/gql'

graphql(`
  fragment WorkspaceAddProjectMenu_Workspace on Workspace {
    id
    name
    slug
    role
    projects {
      totalCount
    }
    plan {
      name
    }
    permissions {
      canCreateProject {
        ...FullPermissionCheckResult
      }
      canMoveProjectToWorkspace {
        ...FullPermissionCheckResult
      }
    }
  }
`)

enum AddNewProjectActionTypes {
  NewProject = 'new-project',
  MoveProject = 'move-project'
}

const emit = defineEmits<{
  (e: 'new-project'): void
  (e: 'move-project'): void
}>()

const props = defineProps<{
  workspaceSlug: string
  workspace: MaybeNullOrUndefined<WorkspaceAddProjectMenu_WorkspaceFragment>
  hideTextOnMobile?: boolean
}>()

const menuId = useId()

const showMenu = ref(false)
const showLimitDialog = ref(false)

const isLimitReached = computed(() => {
  return (
    props.workspace?.permissions.canCreateProject?.code === 'WorkspaceLimitsReached'
  )
})

const isDisabled = computed(() => {
  return (
    !props.workspace?.permissions.canCreateProject?.authorized && !isLimitReached.value
  )
})

const hasProjects = computed(() => {
  return props.workspace?.projects?.totalCount
    ? props.workspace?.projects?.totalCount > 0
    : false
})

const menuItems = computed<LayoutMenuItem[][]>(() => [
  [
    {
      title: 'Create new project...',
      id: AddNewProjectActionTypes.NewProject,
      disabled: isDisabled.value,
      disabledTooltip: isDisabled.value
        ? props.workspace?.permissions.canCreateProject?.message
        : undefined
    },
    {
      title: 'Move existing project...',
      id: AddNewProjectActionTypes.MoveProject,
      disabled: isDisabled.value,
      disabledTooltip: isDisabled.value
        ? props.workspace?.permissions.canMoveProjectToWorkspace?.message
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
</script>
