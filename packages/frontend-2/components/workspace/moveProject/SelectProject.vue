<template>
  <div>
    <FormTextInput
      v-bind="bind"
      label="Move projects"
      name="search"
      color="foundation"
      placeholder="Search projects..."
      show-clear
      full-width
      class="mb-2"
      v-on="on"
    />
    <div v-if="showLoading" class="py-4 flex items-center justify-center w-full h-32">
      <CommonLoadingIcon size="sm" />
    </div>
    <template v-else>
      <div
        v-if="hasMoveableProjects"
        class="flex flex-col mt-2 border rounded-md border-outline-3"
      >
        <div
          v-for="project in moveableProjects"
          :key="project.id"
          class="flex px-4 py-3 items-center space-x-2 justify-between border-b last:border-0 border-outline-3"
        >
          <div class="flex flex-col flex-1 truncate text-body-xs">
            <span class="font-medium text-foreground truncate">
              {{ project.name }}
            </span>
            <div class="flex items-center gap-x-1">
              <span class="text-foreground-3 truncate">
                {{ project.modelCount.totalCount }} model{{
                  project.modelCount.totalCount !== 1 ? 's' : ''
                }}
              </span>
            </div>
          </div>
          <div
            :key="`${project.id}-${project.permissions.canMoveToWorkspace.code}`"
            v-tippy="getProjectTooltip(project)"
          >
            <FormButton
              size="sm"
              color="outline"
              :disabled="isProjectDisabled(project)"
              @click="handleProjectClick(project)"
            >
              Move...
            </FormButton>
          </div>
        </div>
      </div>
      <p v-else-if="!search?.length" class="py-4 text-body-xs text-foreground-2">
        You don't have any projects that can be moved into this workspace. Only projects
        you own and that aren't in another workspace can be moved.
      </p>
      <p v-else class="py-4 text-body-xs text-foreground-2">
        No projects match your search.
      </p>
    </template>
    <InfiniteLoading
      v-if="!search?.length"
      :settings="{ identifier }"
      @infinite="onInfiniteLoad"
    />
    <WorkspacePlanProjectModelLimitReachedDialog
      v-model:open="showLimitDialog"
      :workspace-name="workspace?.name"
      :plan="workspace?.plan?.name"
      :workspace-role="workspace?.role"
      :workspace-slug="workspace?.slug || ''"
      location="move_project_dialog"
    />
  </div>
</template>

<script setup lang="ts">
import {
  CommonLoadingIcon,
  FormTextInput,
  useDebouncedTextInput
} from '@speckle/ui-components'
import type {
  PermissionCheckResult,
  WorkspaceMoveProjectManager_ProjectFragment,
  WorkspaceMoveProjectManager_WorkspaceFragment
} from '~~/lib/common/generated/gql/graphql'
import { usePaginatedQuery } from '~/lib/common/composables/graphql'
import { workspaceMoveProjectManagerUserQuery } from '~/lib/workspaces/graphql/queries'
import {
  ProjectNotEnoughPermissionsError,
  WorkspaceLimitsReachedError
} from '@speckle/shared/authz'

const search = defineModel<string>('search')
const { on, bind } = useDebouncedTextInput({ model: search })

const emit = defineEmits<{
  (e: 'project-selected', project: WorkspaceMoveProjectManager_ProjectFragment): void
}>()

const props = defineProps<{
  workspace?: WorkspaceMoveProjectManager_WorkspaceFragment
  projectPermissions?: PermissionCheckResult
  workspaceId?: string
}>()

const {
  query: { result, loading },
  identifier,
  onInfiniteLoad
} = usePaginatedQuery({
  query: workspaceMoveProjectManagerUserQuery,
  baseVariables: computed(() => ({
    cursor: null as string | null,
    sortBy: 'role',
    filter: {
      search: search.value?.length ? search.value : null,
      personalOnly: true
    },
    workspaceId: props.workspaceId || ''
  })),
  resolveKey: (vars) => [vars.filter?.search || ''],
  resolveCurrentResult: (res) => res?.activeUser?.projects,
  resolveNextPageVariables: (baseVars, cursor) => ({
    ...baseVars,
    cursor
  }),
  resolveCursorFromVariables: (vars) => vars.cursor
})

const showLimitDialog = ref(false)

const userProjects = computed(() => result.value?.activeUser?.projects.items || [])
const moveableProjects = computed(() => userProjects.value)
const hasMoveableProjects = computed(() => moveableProjects.value.length > 0)

const isProjectDisabled = computed(
  () => (project: WorkspaceMoveProjectManager_ProjectFragment) => {
    if (
      project.permissions.canMoveToWorkspace.authorized ||
      project.permissions.canMoveToWorkspace.code === WorkspaceLimitsReachedError.code
    ) {
      return false
    }
    return true
  }
)

const getProjectTooltip = computed(
  () => (project: WorkspaceMoveProjectManager_ProjectFragment) => {
    if (
      project.permissions.canMoveToWorkspace.authorized ||
      project.permissions.canMoveToWorkspace.code === WorkspaceLimitsReachedError.code
    ) {
      return undefined
    }
    if (
      project.permissions.canMoveToWorkspace.code ===
      ProjectNotEnoughPermissionsError.code
    ) {
      return 'Only the project owner can move this project'
    }
    return project.permissions.canMoveToWorkspace.message
  }
)

const handleProjectClick = (project: WorkspaceMoveProjectManager_ProjectFragment) => {
  const permission = project.permissions?.canMoveToWorkspace
  if (permission?.code === WorkspaceLimitsReachedError.code) {
    showLimitDialog.value = true
    return
  }

  if (permission?.authorized) {
    emit('project-selected', project)
  }
}

const showLoading = computed(() => loading.value && userProjects.value.length === 0)
</script>
