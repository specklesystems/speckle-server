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
            :key="`${project.id}-${project.workspace?.permissions?.canMoveProjectToWorkspace?.code}`"
            v-tippy="getProjectTooltip(project)"
          >
            <FormButton
              size="sm"
              color="outline"
              :disabled="isProjectDisabled(project)"
              @click="onMoveClick(project)"
            >
              Move...
            </FormButton>
          </div>
        </div>
      </div>
      <p v-else class="py-4 text-body-xs text-foreground-2">
        You don't have any projects that can be moved into this workspace. Only projects
        you own and that aren't in another workspace can be moved.
      </p>
    </template>
    <InfiniteLoading
      v-if="moveableProjects?.length && !search?.length"
      :settings="{ identifier }"
      class="py-4"
      @infinite="onInfiniteLoad"
    />
    <WorkspacePlanLimitReachedDialog
      v-model:open="showLimitDialog"
      subtitle="Upgrade your plan to move project"
    ></WorkspacePlanLimitReachedDialog>
  </div>
</template>

<script setup lang="ts">
import {
  CommonLoadingIcon,
  FormTextInput,
  useDebouncedTextInput
} from '@speckle/ui-components'
import type {
  FullPermissionCheckResultFragment,
  WorkspaceMoveProjectManager_ProjectFragment
} from '~~/lib/common/generated/gql/graphql'
import { usePaginatedQuery } from '~/lib/common/composables/graphql'
import { workspaceMoveProjectManagerUserQuery } from '~/lib/workspaces/graphql/queries'

const search = defineModel<string>('search')
const { on, bind } = useDebouncedTextInput({ model: search })

const emit = defineEmits<{
  (e: 'project-selected', project: WorkspaceMoveProjectManager_ProjectFragment): void
}>()

const props = defineProps<{
  workspaceSlug?: string
  canMoveToWorkspace: (permission: FullPermissionCheckResultFragment) => boolean
  isLimitReached: (permission: FullPermissionCheckResultFragment) => boolean
  isSsoRequired: (permission: FullPermissionCheckResultFragment) => boolean
  getDisabledTooltip: (
    permission: FullPermissionCheckResultFragment
  ) => string | undefined
}>()

const {
  query: { result, loading },
  identifier,
  onInfiniteLoad
} = usePaginatedQuery({
  query: workspaceMoveProjectManagerUserQuery,
  baseVariables: computed(() => ({
    cursor: null as string | null,
    filter: {
      search: search.value?.length ? search.value : null,
      workspaceId: null
    }
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
    if (!props.workspaceSlug) {
      return false
    }

    return !canMoveProject.value(project) && !isProjectLimitReached.value(project)
  }
)

const onMoveClick = (project: WorkspaceMoveProjectManager_ProjectFragment) => {
  if (props.workspaceSlug && isProjectLimitReached.value(project)) {
    showLimitDialog.value = true
    return
  }

  emit('project-selected', project)
}

const showLoading = computed(() => loading.value && userProjects.value.length === 0)

const getProjectPermission = (project: WorkspaceMoveProjectManager_ProjectFragment) => {
  return (
    project.workspace?.permissions?.canMoveProjectToWorkspace || {
      authorized: false,
      code: '',
      message: ''
    }
  )
}

const canMoveProject = computed(
  () => (project: WorkspaceMoveProjectManager_ProjectFragment) => {
    const permission = getProjectPermission(project)
    return props.canMoveToWorkspace(permission)
  }
)

const isProjectLimitReached = computed(
  () => (project: WorkspaceMoveProjectManager_ProjectFragment) => {
    const permission = getProjectPermission(project)
    return props.isLimitReached(permission)
  }
)

const getProjectTooltip = computed(
  () => (project: WorkspaceMoveProjectManager_ProjectFragment) => {
    const permission = getProjectPermission(project)
    if (props.isLimitReached(permission)) {
      return undefined
    }
    return props.getDisabledTooltip(permission)
  }
)
</script>
