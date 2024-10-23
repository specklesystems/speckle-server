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
      <FormButton @click="openNewProject = true">Create</FormButton>
    </div>

    <LayoutTable
      class="mt-6"
      :columns="[
        { id: 'name', header: 'Name', classes: 'col-span-3 truncate' },
        { id: 'type', header: 'Type', classes: 'col-span-1' },
        { id: 'created', header: 'Created', classes: 'col-span-2' },
        { id: 'modified', header: 'Modified', classes: 'col-span-2' },
        { id: 'models', header: 'Models', classes: 'col-span-1' },
        { id: 'versions', header: 'Versions', classes: 'col-span-1' },
        { id: 'contributors', header: 'Contributors', classes: 'col-span-2 pr-8' },
        { id: 'actions', header: '', classes: 'absolute right-2 top-0.5' }
      ]"
      :items="projects"
    >
      <template #name="{ item }">
        <NuxtLink :to="projectRoute(item.id)">
          {{ isProject(item) ? item.name : '' }}
        </NuxtLink>
      </template>

      <template #type="{ item }">
        <div class="capitalize">
          {{ isProject(item) ? item.visibility.toLowerCase() : '' }}
        </div>
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
          :items="actionItems"
          mount-menu-on-body
          :menu-position="HorizontalDirection.Left"
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

    <SettingsSharedProjectsDeleteDialog
      v-model:open="showProjectDeleteDialog"
      :project="projectToModify"
    />

    <ProjectsAddDialog v-model:open="openNewProject" :workspace-id="workspaceId" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { HorizontalDirection } from '~~/lib/common/composables/window'
import type { ItemType, ProjectItem } from '~~/lib/server-management/helpers/types'
import type { SettingsSharedProjects_ProjectFragment } from '~~/lib/common/generated/gql/graphql'
import {
  MagnifyingGlassIcon,
  EllipsisHorizontalIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'
import { isProject } from '~~/lib/server-management/helpers/utils'
import { useDebouncedTextInput, type LayoutMenuItem } from '@speckle/ui-components'
import { graphql } from '~/lib/common/generated/gql'
import { useRouter } from 'vue-router'
import { projectCollaboratorsRoute, projectRoute } from '~/lib/common/helpers/route'

graphql(`
  fragment SettingsSharedProjects_Project on Project {
    id
    name
    visibility
    createdAt
    updatedAt
    models {
      totalCount
    }
    versions {
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
  }
`)

defineProps<{
  projects?: SettingsSharedProjects_ProjectFragment[]
  workspaceId?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const search = defineModel<string>('search')
const { on, bind } = useDebouncedTextInput({ model: search })
const router = useRouter()

const projectToModify = ref<ProjectItem | null>(null)
const showProjectDeleteDialog = ref(false)
const openNewProject = ref(false)

const openProjectDeleteDialog = (item: ItemType) => {
  if (isProject(item)) {
    projectToModify.value = item
    showProjectDeleteDialog.value = true
  }
}

const handleProjectClick = (item: ItemType) => {
  router.push(projectRoute(item.id))
  emit('close')
}

enum ActionTypes {
  ViewProject = 'view-project',
  EditMembers = 'edit-members',
  RemoveProject = 'remove-project'
}

const showActionsMenu = ref<Record<string, boolean>>({})

const actionItems: LayoutMenuItem[][] = [
  [
    { title: 'View project', id: ActionTypes.ViewProject },
    { title: 'Edit members', id: ActionTypes.EditMembers },
    { title: 'Remove project...', id: ActionTypes.RemoveProject }
  ]
]

const onActionChosen = (actionItem: LayoutMenuItem, project: ProjectItem) => {
  if (actionItem.id === ActionTypes.EditMembers) {
    router.push(projectCollaboratorsRoute(project.id))
    emit('close')
  } else if (actionItem.id === ActionTypes.ViewProject) {
    handleProjectClick(project)
  } else if (actionItem.id === ActionTypes.RemoveProject) {
    openProjectDeleteDialog(project)
  }
}

const toggleMenu = (itemId: string) => {
  showActionsMenu.value[itemId] = !showActionsMenu.value[itemId]
}
</script>
