<template>
  <div>
    <div class="flex flex-col-reverse md:justify-between md:flex-row md:gap-x-4">
      <div class="relative w-full md:max-w-md mt-6 md:mt-0">
        <FormTextInput
          name="search"
          :custom-icon="MagnifyingGlassIcon"
          color="foundation"
          search
          placeholder="Search projects"
          v-bind="bind"
          v-on="on"
        />
      </div>
      <div v-tippy="createDisabledTooltip">
        <FormButton :disabled="isCreateDisabled" @click="openNewProject = true">
          Create
        </FormButton>
      </div>
    </div>

    <LayoutTable
      class="mt-6"
      :columns="[
        { id: 'name', header: 'Name', classes: 'col-span-3 truncate' },
        { id: 'created', header: 'Created', classes: 'col-span-2' },
        { id: 'modified', header: 'Modified', classes: 'col-span-2' },
        { id: 'models', header: 'Models', classes: 'col-span-1' },
        { id: 'versions', header: 'Versions', classes: 'col-span-1' },
        { id: 'contributors', header: 'Project members', classes: 'col-span-2 pr-8' },
        { id: 'actions', header: '', classes: 'absolute right-2 top-0.5' }
      ]"
      :items="projects"
    >
      <template #name="{ item }">
        <NuxtLink :to="projectRoute(item.id)">
          {{ isProject(item) ? item.name : '' }}
        </NuxtLink>
      </template>

      <template #created="{ item }">
        <div class="text-xs">
          {{ formattedFullDate(item.createdAt) }}
        </div>
      </template>

      <template #modified="{ item }">
        <div class="text-xs">
          {{ formattedFullDate(item.updatedAt) }}
        </div>
      </template>

      <template #models="{ item }">
        <div class="text-xs">
          {{ isProject(item) ? item.models.totalCount : '' }}
        </div>
      </template>

      <template #versions="{ item }">
        <div class="text-xs">
          {{ isProject(item) ? item.versions.totalCount : '' }}
        </div>
      </template>

      <template #contributors="{ item }">
        <div v-if="isProject(item)">
          <UserAvatarGroup :users="item.team.map((t) => t.user)" :max-count="3" />
        </div>
      </template>

      <template #actions="{ item }">
        <LayoutMenu
          v-model:open="showActionsMenu[item.id]"
          :items="actionItems[item.id]"
          mount-menu-on-body
          :menu-position="HorizontalDirection.Left"
          :menu-id="menuId"
          @chosen="({ item: actionItem }) => onActionChosen(actionItem, item)"
        >
          <FormButton
            :color="showActionsMenu[item.id] ? 'outline' : 'subtle'"
            hide-text
            :icon-right="showActionsMenu[item.id] ? XMarkIcon : EllipsisHorizontalIcon"
            @click.stop="toggleMenu(item.id)"
          />
        </LayoutMenu>
      </template>
    </LayoutTable>

    <ProjectsDeleteDialog
      v-if="projectToModify"
      v-model:open="showProjectDeleteDialog"
      :project="projectToModify"
    />

    <ProjectsAdd v-model:open="openNewProject" :workspace="workspace" />
  </div>
</template>

<script setup lang="ts">
import { HorizontalDirection } from '~~/lib/common/composables/window'
import type {
  SettingsSharedProjects_ProjectFragment,
  ProjectsDeleteDialog_ProjectFragment,
  SettingsSharedProjects_WorkspaceFragment
} from '~~/lib/common/generated/gql/graphql'
import {
  MagnifyingGlassIcon,
  EllipsisHorizontalIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'
import { isProject } from '~~/lib/server-management/helpers/utils'
import { useDebouncedTextInput, type LayoutMenuItem } from '@speckle/ui-components'
import { graphql } from '~/lib/common/generated/gql'
import { useRouter } from 'vue-router'
import { projectRoute } from '~/lib/common/helpers/route'
import { useCanCreatePersonalProject } from '~/lib/projects/composables/permissions'
import { useCanCreateWorkspaceProject } from '~/lib/workspaces/composables/projects/permissions'
import type { MaybeNullOrUndefined } from '@speckle/shared'

graphql(`
  fragment SettingsSharedProjects_Project on Project {
    ...ProjectsDeleteDialog_Project
    id
    name
    visibility
    createdAt
    updatedAt
    models(limit: 0) {
      totalCount
    }
    versions(limit: 0) {
      totalCount
    }
    team {
      id
      user {
        name
        id
        avatar
      }
    }
    permissions {
      canDelete {
        ...FullPermissionCheckResult
      }
      canReadSettings {
        ...FullPermissionCheckResult
      }
      canRead {
        ...FullPermissionCheckResult
      }
    }
  }
`)

graphql(`
  fragment SettingsSharedProjects_Workspace on Workspace {
    id
    ...ProjectsAdd_Workspace
  }
`)

const props = defineProps<{
  workspaceId: MaybeNullOrUndefined<string>
  projects: MaybeNullOrUndefined<SettingsSharedProjects_ProjectFragment[]>
  workspace: MaybeNullOrUndefined<SettingsSharedProjects_WorkspaceFragment>
}>()

const { formattedFullDate } = useDateFormatters()
const { activeUser } = useActiveUser()
const canCreatePersonal = useCanCreatePersonalProject({
  activeUser: computed(() => activeUser.value)
})

const canCreateWorkspace = useCanCreateWorkspaceProject({
  workspace: computed(() => props.workspace)
})

const isCreateDisabled = computed(() => {
  if (props.workspaceId) {
    return !canCreateWorkspace.canClickCreate.value
  }

  return !canCreatePersonal.canClickCreate.value
})
const createDisabledTooltip = computed(() => {
  if (props.workspaceId) {
    return canCreateWorkspace.cantClickCreateReason.value
  }

  return canCreatePersonal.cantClickCreateReason.value
})

const search = defineModel<string>('search')
const { on, bind } = useDebouncedTextInput({ model: search })
const router = useRouter()
const menuId = useId()

const projectToModify = ref<ProjectsDeleteDialog_ProjectFragment | null>(null)
const showProjectDeleteDialog = ref(false)
const openNewProject = ref(false)

const openProjectDeleteDialog = (item: ProjectsDeleteDialog_ProjectFragment) => {
  projectToModify.value = item
  showProjectDeleteDialog.value = true
}

const handleProjectClick = (id: string) => {
  router.push(projectRoute(id))
}

enum ActionTypes {
  ViewProject = 'view-project',
  EditMembers = 'edit-members',
  DeleteProject = 'delete-project'
}

const showActionsMenu = ref<Record<string, boolean>>({})

const actionItems = computed((): { [projectId: string]: LayoutMenuItem[][] } =>
  (props.projects || []).reduce((ret, project) => {
    const canRead = project.permissions.canRead
    const canDelete = project.permissions.canDelete
    const canReadSettings = project.permissions.canReadSettings

    ret[project.id] = [
      [
        {
          title: 'View project',
          id: ActionTypes.ViewProject,
          disabled: !canRead?.authorized,
          disabledTooltip: canRead?.message
        },
        {
          title: 'Edit members',
          id: ActionTypes.EditMembers,
          disabled: !canReadSettings?.authorized,
          disabledTooltip: canReadSettings?.message
        },
        {
          title: 'Delete project...',
          id: ActionTypes.DeleteProject,
          disabled: !canDelete?.authorized,
          disabledTooltip: canDelete?.message
        }
      ]
    ]
    return ret
  }, {} as { [projectId: string]: LayoutMenuItem[][] })
)

const onActionChosen = (
  actionItem: LayoutMenuItem,
  project: ProjectsDeleteDialog_ProjectFragment
) => {
  if (actionItem.id === ActionTypes.EditMembers) {
    router.push(projectRoute(project.id, 'collaborators'))
  } else if (actionItem.id === ActionTypes.ViewProject) {
    handleProjectClick(project.id)
  } else if (actionItem.id === ActionTypes.DeleteProject) {
    openProjectDeleteDialog(project)
  }
}

const toggleMenu = (itemId: string) => {
  showActionsMenu.value[itemId] = !showActionsMenu.value[itemId]
}
</script>
