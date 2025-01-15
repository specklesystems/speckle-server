<template>
  <LayoutDialog
    v-model:open="open"
    max-width="sm"
    title="Move projects to workspace"
    :buttons="buttons"
  >
    <template v-if="result?.activeUser?.projects?.totalCount">
      <div class="flex flex-col mt-2 border rounded-md border-outline-3">
        <div
          v-for="project in result?.activeUser?.projects?.items"
          :key="project.id"
          class="flex px-4 py-3 items-center space-x-2 justify-between border-b last:border-0 border-outline-3"
        >
          <div class="flex flex-col flex-1 truncate text-body-xs">
            <span class="font-medium text-foreground truncate">
              {{ project.name }}
            </span>
            <span class="text-foreground-3 truncate">
              {{ project.modelCount.totalCount }} model{{
                project.modelCount.totalCount !== 1 ? 's' : ''
              }}, {{ project.versions.totalCount }} version{{
                project.versions.totalCount !== 1 ? 's' : ''
              }}
            </span>
          </div>
          <span
            v-tippy="
              project.role !== Roles.Stream.Owner &&
              'Only the project owner can move this project'
            "
          >
            <FormButton
              :disabled="project.role !== Roles.Stream.Owner"
              size="sm"
              color="outline"
              @click="onMoveClick(project)"
            >
              Move...
            </FormButton>
          </span>
        </div>
      </div>

      <InfiniteLoading :settings="{ identifier }" @infinite="onInfiniteLoad" />
    </template>

    <p v-else class="py-4 text-body-xs text-foreground-2">
      You don't have any projects that can be moved into this workspace. Only projects
      you own and that aren't in another workspace can be moved.
    </p>

    <ProjectsMoveToWorkspaceDialog
      v-if="selectedProject"
      v-model:open="showMoveToWorkspaceDialog"
      :project="selectedProject"
      event-source="move-projects-dialog"
    />
  </LayoutDialog>
</template>
<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'
import { graphql } from '~~/lib/common/generated/gql'
import type {
  ProjectsMoveToWorkspaceDialog_ProjectFragment,
  MoveProjectsDialogQuery
} from '~~/lib/common/generated/gql/graphql'
import { moveProjectsDialogQuery } from '~~/lib/workspaces/graphql/queries'
import { usePaginatedQuery } from '~/lib/common/composables/graphql'
import { Roles, type Nullable } from '@speckle/shared'

graphql(`
  fragment MoveProjectsDialog_User on User {
    projects(limit: $limit, cursor: $cursor, filter: $filter) {
      totalCount
      items {
        ...ProjectsMoveToWorkspaceDialog_Project
        role
      }
    }
  }
`)

const open = defineModel<boolean>('open', { required: true })

const {
  query: { result },
  identifier,
  onInfiniteLoad
} = usePaginatedQuery({
  query: moveProjectsDialogQuery,
  baseVariables: computed(() => ({
    filter: {
      workspaceId: null,
      onlyWithRoles: [Roles.Stream.Owner]
    },
    cursor: null as Nullable<string>,
    limit: 10
  })),
  resolveKey: () => 'move-projects-dialog',
  resolveCurrentResult: (result: MoveProjectsDialogQuery | undefined) =>
    result?.activeUser?.projects,
  resolveNextPageVariables: (baseVariables, newCursor) => ({
    ...baseVariables,
    cursor: newCursor
  }),
  resolveCursorFromVariables: (vars) => vars.cursor
})

const selectedProject = ref<ProjectsMoveToWorkspaceDialog_ProjectFragment | null>(null)
const showMoveToWorkspaceDialog = ref(false)

const buttons = computed((): LayoutDialogButton[] => [
  {
    text: 'Done',
    props: { color: 'primary' },
    onClick: () => {
      open.value = false
    }
  }
])

const onMoveClick = (project: ProjectsMoveToWorkspaceDialog_ProjectFragment) => {
  selectedProject.value = project
  showMoveToWorkspaceDialog.value = true
}
</script>
