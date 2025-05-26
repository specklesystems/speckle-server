<template>
  <div>
    <template v-if="project">
      <InviteDialogProject v-model:open="openInviteDialog" :project="project" />
      <WorkspaceMoveProject
        v-model:open="openMoveProjectDialog"
        :project="project"
        location="invite_add"
        show-intro
        @done="open = false"
      />
    </template>
  </div>
</template>
<script setup lang="ts">
import { PersonalProjectsLimitedError } from '@speckle/shared/authz'
import { graphql } from '~/lib/common/generated/gql'
import type { ProjectInviteAdd_ProjectFragment } from '~/lib/common/generated/gql/graphql'
import { useCanInviteToProject } from '~/lib/projects/composables/permissions'

graphql(`
  fragment ProjectInviteAdd_Project on Project {
    id
    ...InviteDialogProject_Project
    ...UseCanInviteToProject_Project
    ...WorkspaceMoveProject_Project
  }
`)

const props = defineProps<{
  project: ProjectInviteAdd_ProjectFragment
}>()
const open = defineModel<boolean>('open', { required: true })
const canInviteToProject = useCanInviteToProject({
  project: computed(() => props.project)
})

const openInviteDialog = computed({
  get: () => {
    if (!canInviteToProject.canActuallyInvite.value) return false
    return open.value
  },
  set: (value) => {
    if (!value) return (open.value = false)
    if (!canInviteToProject.canActuallyInvite.value) return false
    open.value = value
  }
})

const openMoveProjectDialog = computed({
  get: () => {
    if (
      canInviteToProject.cantClickInviteCode.value !== PersonalProjectsLimitedError.code
    )
      return false

    return open.value
  },
  set: (newVal) => {
    if (!newVal) return (open.value = false)
    if (
      canInviteToProject.cantClickInviteCode.value !== PersonalProjectsLimitedError.code
    )
      return false

    open.value = newVal
  }
})
</script>
