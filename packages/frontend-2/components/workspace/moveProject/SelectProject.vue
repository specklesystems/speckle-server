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
    <div v-if="loading" class="py-4 flex items-center justify-center w-full h-32">
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
          <FormButton size="sm" color="outline" @click="onMoveClick(project)">
            Move...
          </FormButton>
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
  </div>
</template>

<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import {
  CommonLoadingIcon,
  FormTextInput,
  useDebouncedTextInput
} from '@speckle/ui-components'
import type { WorkspaceMoveProjectSelectProject_ProjectFragment } from '~~/lib/common/generated/gql/graphql'
import { usePaginatedQuery } from '~/lib/common/composables/graphql'
import { workspaceMoveProjectManagerUserQuery } from '~/lib/workspaces/graphql/queries'

graphql(`
  fragment WorkspaceMoveProjectSelectProject_Project on Project {
    id
    name
    modelCount: models(limit: 0) {
      totalCount
    }
    versions(limit: 0) {
      totalCount
    }
  }
`)

const search = defineModel<string>('search')
const { on, bind } = useDebouncedTextInput({ model: search })

const emit = defineEmits<{
  (
    e: 'project-selected',
    project: WorkspaceMoveProjectSelectProject_ProjectFragment
  ): void
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

const userProjects = computed(() => result.value?.activeUser?.projects.items || [])
const moveableProjects = computed(() => userProjects.value)
const hasMoveableProjects = computed(() => moveableProjects.value.length > 0)

const onMoveClick = (project: WorkspaceMoveProjectSelectProject_ProjectFragment) => {
  emit('project-selected', project)
}
</script>
