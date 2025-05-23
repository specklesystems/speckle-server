<template>
  <div v-if="project" class="flex flex-col gap-4">
    <ProjectPageSettingsGeneralBlockProjectInfo
      :project="project"
      @update-project="
        ({ name, description, onComplete }) =>
          handleUpdate({ name, description }, 'Project info updated', onComplete)
      "
    />

    <ProjectPageSettingsGeneralBlockAccess
      :project="project"
      @update-visibility="
        (newVisibility) =>
          handleUpdate({ visibility: newVisibility }, 'Project access updated')
      "
    />
    <ProjectPageSettingsGeneralBlockDiscussions
      :project="project"
      @update-comments-permission="
        (newCommentsPermission) =>
          handleUpdate(
            { allowPublicComments: newCommentsPermission },
            'Comment permissions updated'
          )
      "
    />
    <ProjectPageSettingsGeneralBlockLeave :project="project" />

    <ProjectPageSettingsGeneralBlockDelete
      :project="project"
      @update-comments-permission="
        (newCommentsPermission) =>
          handleUpdate(
            { allowPublicComments: newCommentsPermission },
            'Comment permissions updated'
          )
      "
    />
  </div>
  <div v-else></div>
</template>
<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import type { ProjectUpdateInput } from '~~/lib/common/generated/gql/graphql'
import { useUpdateProject } from '~~/lib/projects/composables/projectManagement'
import { graphql } from '~~/lib/common/generated/gql'

const projectPageSettingsGeneralQuery = graphql(`
  query ProjectPageSettingsGeneral($projectId: String!) {
    project(id: $projectId) {
      id
      ...ProjectPageSettingsGeneralBlockProjectInfo_Project
      ...ProjectPageSettingsGeneralBlockAccess_Project
      ...ProjectPageSettingsGeneralBlockDiscussions_Project
      ...ProjectPageSettingsGeneralBlockLeave_Project
      ...ProjectPageSettingsGeneralBlockDelete_Project
      ...ProjectPageTeamInternals_Project
    }
  }
`)

const route = useRoute()
const updateProject = useUpdateProject()

const projectId = computed(() => route.params.id as string)

const { result: pageResult } = useQuery(projectPageSettingsGeneralQuery, () => ({
  projectId: projectId.value
}))

const project = computed(() => pageResult.value?.project)
const logger = useLogger()

const handleUpdate = async (
  updates: Partial<ProjectUpdateInput>,
  customSuccessMessage?: string,
  onComplete?: () => void
) => {
  if (!project.value) {
    return
  }

  const updatePayload: ProjectUpdateInput = {
    id: project.value.id,
    ...updates
  }

  const options = customSuccessMessage ? { customSuccessMessage } : {}

  try {
    const result = await updateProject(updatePayload, options)
    if (result && result.id) {
      if (onComplete) {
        onComplete()
      }
    }
  } catch (error) {
    logger.error('Failed to update project:', error)
  }
}
</script>
