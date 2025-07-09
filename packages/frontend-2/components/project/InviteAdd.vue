<template>
  <div>
    <template v-if="project">
      <InviteDialogProject v-model:open="openDefault" :project="project" />
      <WorkspaceMoveProject
        v-model:open="openPersonalProjectsLimited"
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
import { useMultipleDialogBranching } from '~/lib/common/composables/dialog'
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

const { openDefault, openPersonalProjectsLimited } = useMultipleDialogBranching({
  open,
  conditions: {
    personalProjectsLimited: computed(
      () =>
        canInviteToProject.cantClickInviteCode.value ===
        PersonalProjectsLimitedError.code
    )
  }
})
</script>
