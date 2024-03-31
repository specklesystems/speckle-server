<template>
  <div class="flex flex-col gap-4">
    <ProjectPageSettingsGeneralBlockProjectInfo
      :project-name="projectName"
      :project-description="projectDescription"
      @update-project="handleProjectUpdate"
    />
    <ProjectPageSettingsGeneralBlockAccess />
    <ProjectPageSettingsGeneralBlockDiscussions />
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { useQuery } from '@vue/apollo-composable'
import { projectSettingsGeneralQuery } from '~~/lib/projects/graphql/queries'
import { useRoute } from 'vue-router'
import type { ProjectUpdateInput } from '~/lib/common/generated/gql/graphql'
import { useUpdateProject } from '~/lib/projects/composables/projectManagement'

const route = useRoute()
const projectId = computed(() => route.params.id as string)
const { result: pageResult } = useQuery(projectSettingsGeneralQuery, () => ({
  projectId: projectId.value
}))

const project = computed(() => pageResult.value?.project)
const projectName = computed(() => pageResult.value?.project.name || '')
const projectDescription = computed(() => pageResult.value?.project.description)

const updateProject = useUpdateProject()

const handleProjectUpdate = ({
  name,
  description
}: {
  name: string
  description?: string | null
}) => {
  if (!project.value) {
    return
  }

  const update: ProjectUpdateInput = {
    id: project.value.id,
    name,
    description
  }

  updateProject(update)
}
</script>
