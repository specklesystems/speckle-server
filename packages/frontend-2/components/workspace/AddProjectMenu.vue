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

    <ProjectsAdd
      v-model:open="showNewProjectDialog"
      :workspace="workspace"
      :workspace-slug="workspaceSlug"
      location="add-project-menu"
    />
    <WorkspaceMoveProject
      v-model:open="showMoveProjectDialog"
      :workspace="workspace"
      location="add-project-menu"
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
import {
  useCanCreateWorkspaceProject,
  useCanMoveProjectIntoWorkspace
} from '~/lib/workspaces/composables/projects/permissions'

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
    ...ProjectsAdd_Workspace
    ...WorkspaceMoveProject_Workspace
    ...UseCanCreateWorkspaceProject_Workspace
    ...UseCanMoveProjectIntoWorkspace_Workspace
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
const showMoveProjectDialog = ref(false)
const showNewProjectDialog = ref(false)

const canCreateProject = useCanCreateWorkspaceProject({
  workspace: computed(() => props.workspace)
})

const canMoveProject = useCanMoveProjectIntoWorkspace({
  workspace: computed(() => props.workspace)
})

const menuItems = computed<LayoutMenuItem[][]>(() => [
  [
    {
      title: 'Create new project...',
      id: AddNewProjectActionTypes.NewProject,
      disabled: !canCreateProject.canClickCreate.value,
      disabledTooltip: !canCreateProject.canClickCreate.value
        ? canCreateProject.cantClickCreateReason.value
        : undefined
    },
    {
      title: 'Move existing project...',
      id: AddNewProjectActionTypes.MoveProject,
      disabled: !canMoveProject.canClickMove.value,
      disabledTooltip: !canMoveProject.canClickMove.value
        ? canMoveProject.cantClickMoveReason.value
        : undefined
    }
  ]
])

const onActionChosen = (params: { item: LayoutMenuItem; event: MouseEvent }) => {
  const { item } = params

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
