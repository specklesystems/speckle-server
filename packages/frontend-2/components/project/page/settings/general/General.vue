<template>
  <div class="flex flex-col gap-4 mr-4 sm:mr-8 xl:mr-0">
    <ProjectPageSettingsGeneralBlockProjectInfo
      v-if="project"
      :project="project"
      @update-project="
        ({ name, description }) =>
          handleUpdate({ name, description }, 'Project info updated')
      "
    />
    <ProjectPageSettingsGeneralBlockAccess
      :current-visibility="project?.visibility"
      @update-visibility="
        (newVisibility) =>
          handleUpdate({ visibility: newVisibility }, 'Project access updated')
      "
    />
    <ProjectPageSettingsGeneralBlockDiscussions
      :current-comments-permission="project?.allowPublicComments"
      :current-visibility="project?.visibility"
      @update-comments-permission="
        (newCommentsPermission) =>
          handleUpdate(
            { allowPublicComments: newCommentsPermission },
            'Comment permissions updated'
          )
      "
    />
    <ProjectPageSettingsGeneralBlockLeave v-if="canLeaveProject" :project="project" />

    <ProjectPageSettingsGeneralBlockDelete
      v-if="isOwner && !isServerGuest"
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
</template>
<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import { projectSettingsQuery } from '~~/lib/projects/graphql/queries'
import type { ProjectUpdateInput } from '~~/lib/common/generated/gql/graphql'
import { useUpdateProject } from '~~/lib/projects/composables/projectManagement'
import { useTeamInternals } from '~~/lib/projects/composables/team'

const route = useRoute()
const updateProject = useUpdateProject()

const projectId = computed(() => route.params.id as string)

const { result: pageResult } = useQuery(projectSettingsQuery, () => ({
  projectId: projectId.value
}))

const project = computed(() => pageResult.value?.project)

const { canLeaveProject, isOwner, isServerGuest } = useTeamInternals(project)

const handleUpdate = (
  updates: Partial<ProjectUpdateInput>,
  customSuccessMessage?: string
) => {
  if (!project.value) {
    return
  }

  const updatePayload: ProjectUpdateInput = {
    id: project.value.id,
    ...updates
  }

  updateProject(updatePayload, customSuccessMessage)
}
</script>
