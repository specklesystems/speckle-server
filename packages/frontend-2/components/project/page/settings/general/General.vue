<template>
  <div class="flex flex-col gap-4 mr-4 sm:mr-8 xl:mr-0">
    <ProjectPageSettingsGeneralBlockProjectInfo
      v-if="project"
      :project="project"
      :disabled="isDisabled"
      @update-project="
        ({ name, description }) =>
          handleUpdate({ name, description }, 'Project info updated')
      "
    />
    <ProjectPageSettingsGeneralBlockAccess
      v-if="project"
      :project="project"
      :disabled="isDisabled"
      @update-visibility="
        (newVisibility) =>
          handleUpdate({ visibility: newVisibility }, 'Project access updated')
      "
    />
    <ProjectPageSettingsGeneralBlockDiscussions
      v-if="project"
      :project="project"
      :disabled="isDisabled"
      @update-comments-permission="
        (newCommentsPermission) =>
          handleUpdate(
            { allowPublicComments: newCommentsPermission },
            'Comment permissions updated'
          )
      "
    />
    <ProjectPageSettingsGeneralBlockLeave
      v-if="canLeaveProject && project"
      :project="project"
    />

    <ProjectPageSettingsGeneralBlockDelete
      v-if="project && isOwner && !isGuest"
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
import { Roles } from '@speckle/shared'
import { useQuery } from '@vue/apollo-composable'
import type { ProjectUpdateInput } from '~~/lib/common/generated/gql/graphql'
import { useUpdateProject } from '~~/lib/projects/composables/projectManagement'
import { graphql } from '~~/lib/common/generated/gql'

const projectPageSettingsGeneralQuery = graphql(`
  query ProjectPageSettingsGeneral($projectId: String!) {
    project(id: $projectId) {
      id
      team {
        role
        user {
          ...LimitedUserAvatar
          role
        }
      }
      ...ProjectPageSettingsGeneralBlockProjectInfo_Project
      ...ProjectPageSettingsGeneralBlockAccess_Project
      ...ProjectPageSettingsGeneralBlockDiscussions_Project
      ...ProjectPageSettingsGeneralBlockLeave_Project
      ...ProjectPageSettingsGeneralBlockDelete_Project
    }
  }
`)

const route = useRoute()
const updateProject = useUpdateProject()

const projectId = computed(() => route.params.id as string)

const { result: pageResult } = useQuery(
  projectPageSettingsGeneralQuery,
  () => ({
    projectId: projectId.value
  }),
  () => ({
    // Custom error policy so that a failing invitedTeam resolver (due to access rights)
    // doesn't kill the entire query
    errorPolicy: 'all',
    context: {
      skipLoggingErrors: (err) =>
        err.graphQLErrors?.length === 1 &&
        err.graphQLErrors.some((e) => !!e.path?.includes('invitedTeam'))
    }
  })
)

const project = computed(() => pageResult.value?.project)

const { activeUser, isGuest } = useActiveUser()

const canLeaveProject = computed(() => {
  if (!activeUser.value || !pageResult.value?.project.role) {
    return false
  }

  const userId = activeUser.value.id
  const owners = pageResult.value.project.team.filter(
    (t) => t.role === Roles.Stream.Owner
  )
  return owners.length !== 1 || owners[0].user.id !== userId
})

const isOwner = computed(() => project.value?.role === Roles.Stream.Owner)

const isDisabled = computed(() => !isOwner || isGuest.value)

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
