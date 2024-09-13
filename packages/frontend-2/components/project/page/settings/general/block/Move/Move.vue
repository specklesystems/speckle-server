<template>
  <div>
    <ProjectPageSettingsBlock background title="Move project to workspace">
      <p class="text-body-xs text-foreground">
        Once a project is moved to a workspace, it
        <span class="font-medium">cannot</span>
        be removed from it.
      </p>
      <ProjectsWorkspaceSelect
        v-model="selectedWorkspace"
        :items="workspaces"
        class="flex-1 mt-4"
      />

      <template #bottom-buttons>
        <FormButton
          :disabled="!selectedWorkspace"
          color="primary"
          @click="showMoveDialog = true"
        >
          Move project
        </FormButton>
      </template>
    </ProjectPageSettingsBlock>

    <ProjectPageSettingsGeneralBlockMoveDialog
      v-if="project"
      v-model:open="showMoveDialog"
      :project="project"
      :workspace="selectedWorkspace"
    />
  </div>
</template>

<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import type {
  ProjectPageSettingsGeneralBlockMove_WorkspaceFragment,
  ProjectPageSettingsGeneralBlockMove_ProjectFragment
} from '~~/lib/common/generated/gql/graphql'
import { projectWorkspaceSelectQuery } from '~/lib/projects/graphql/queries'
import { useQuery } from '@vue/apollo-composable'

graphql(`
  fragment ProjectPageSettingsGeneralBlockMove_Workspace on Workspace {
    id
    role
    name
    defaultLogoIndex
    logo
  }
`)

graphql(`
  fragment ProjectPageSettingsGeneralBlockMove_User on User {
    workspaces {
      items {
        ...ProjectPageSettingsGeneralBlockMove_Workspace
      }
    }
  }
`)

graphql(`
  fragment ProjectPageSettingsGeneralBlockMove_Project on Project {
    id
    name
    models(limit: 0) {
      totalCount
    }
    versions(limit: 0) {
      totalCount
    }
  }
`)

defineProps<{
  project?: ProjectPageSettingsGeneralBlockMove_ProjectFragment
}>()

const isWorkspacesEnabled = useIsWorkspacesEnabled()
const { result } = useQuery(projectWorkspaceSelectQuery, null, () => ({
  enabled: isWorkspacesEnabled.value
}))

const selectedWorkspace = ref<ProjectPageSettingsGeneralBlockMove_WorkspaceFragment>()
const showMoveDialog = ref(false)

const workspaces = computed(() => result.value?.activeUser?.workspaces.items ?? [])
</script>
