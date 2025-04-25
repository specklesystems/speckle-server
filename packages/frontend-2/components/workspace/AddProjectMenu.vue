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
        :class="hideTextOnMobile ? 'hidden sm:block' : ''"
        @click="showMenu = !showMenu"
      >
        <div class="flex items-center gap-1">
          {{ ctaLabel || 'Add project' }}
          <ChevronDownIcon class="h-3 w-3" />
        </div>
      </FormButton>
      <FormButton
        color="outline"
        :class="hideTextOnMobile ? 'sm:hidden' : 'hidden'"
        hide-text
        :icon-left="PlusIcon"
        @click="showMenu = !showMenu"
      >
        Add project
      </FormButton>
    </LayoutMenu>
    <ProjectsAddDialog
      v-model:open="showNewProjectDialog"
      :workspace-id="workspace?.id"
    />
    <ClientOnly>
      <WorkspaceMoveProjectManager
        v-model:open="showMoveProjectDialog"
        :workspace-slug="workspaceSlug"
        :workspace-id="workspace?.id"
      />
      <WorkspacePlanProjectModelLimitReachedDialog
        v-model:open="showLimitDialog"
        :workspace-name="workspace?.name"
        :plan="workspace?.plan?.name"
        :workspace-role="workspace?.role"
        :workspace-slug="workspaceSlug"
      />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
// TODO: The ClientOnly is to avoid the dialog from being rendered on the server and have hydration sideeffects. These need to be addressed and fixed instead of the ClientOnly
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

const props = defineProps<{
  workspaceSlug: string
  workspace: MaybeNullOrUndefined<WorkspaceAddProjectMenu_WorkspaceFragment>
  hideTextOnMobile?: boolean
  ctaLabel?: string
}>()

const menuId = useId()

const showMenu = ref(false)
const showLimitDialog = ref(false)
const showMoveProjectDialog = ref(false)
const showNewProjectDialog = ref(false)

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
    showMoveProjectDialog.value = false
    showNewProjectDialog.value = false
    showLimitDialog.value = true
    return
  }

  switch (item.id) {
    case AddNewProjectActionTypes.NewProject:
      showNewProjectDialog.value = true
      break
    case AddNewProjectActionTypes.MoveProject:
      showMoveProjectDialog.value = true
      break
  }
}
</script>
