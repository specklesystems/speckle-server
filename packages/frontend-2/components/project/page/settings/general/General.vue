<template>
  <div class="flex flex-col gap-4">
    <ProjectPageSettingsGeneralBlockProjectInfo
      :project-name="project?.name"
      :project-description="project?.description"
      @update-project="({ name, description }) => handleUpdate({ name, description })"
    />
    <ProjectPageSettingsGeneralBlockAccess
      :current-visibility="project?.visibility"
      @update-visibility="
        (newVisibility) => handleUpdate({ visibility: newVisibility })
      "
    />
    <ProjectPageSettingsGeneralBlockDiscussions
      :current-comments-permission="project?.allowPublicComments"
      @update-comments-permission="
        (newCommentsPermission) =>
          handleUpdate({ allowPublicComments: newCommentsPermission })
      "
    />
  </div>
</template>
<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import { projectSettingsGeneralQuery } from '~~/lib/projects/graphql/queries'
import { useRoute } from 'vue-router'
import type { ProjectUpdateInput } from '~/lib/common/generated/gql/graphql'
import { useUpdateProject } from '~/lib/projects/composables/projectManagement'

const route = useRoute()
const updateProject = useUpdateProject()

const projectId = computed(() => route.params.id as string)

const { result: pageResult } = useQuery(projectSettingsGeneralQuery, () => ({
  projectId: projectId.value
}))

const project = computed(() => pageResult.value?.project)

const handleUpdate = (updates: Partial<ProjectUpdateInput>) => {
  if (!project.value) {
    return
  }

  const updatePayload: ProjectUpdateInput = {
    id: project.value.id,
    ...updates
  }

  updateProject(updatePayload)
}
</script>
