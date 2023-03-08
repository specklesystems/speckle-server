<template>
  <div class="flex flex-col space-y-4">
    <div class="h4 font-bold">Project permissions</div>
    <div class="flex flex-col space-y-4">
      <ProjectVisibilitySelect
        :model-value="project.visibility"
        :disabled="!isOwner || loading"
        @update:model-value="onChangeVisibility"
      />
      <ProjectCommentPermissionsSelect
        :model-value="
          project.allowPublicComments
            ? CommentPermissions.Anyone
            : CommentPermissions.TeamMembersOnly
        "
        :disabled="!isOwner || loading"
        @update:model-value="onChangeCommentPermissions"
      />
      <ProjectPageTeamDialogDangerZone
        v-if="isOwner || canLeaveProject"
        :project="project"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import {
  ProjectPageTeamDialogFragment,
  ProjectVisibility
} from '~~/lib/common/generated/gql/graphql'
import { CommentPermissions } from '~~/lib/projects/helpers/components'
import { useUpdateProject } from '~~/lib/projects/composables/projectManagement'
import { useTeamDialogInternals } from '~~/lib/projects/composables/team'

const props = defineProps<{
  project: ProjectPageTeamDialogFragment
}>()

const { isOwner, canLeaveProject } = useTeamDialogInternals({ props: toRefs(props) })
const updateProject = useUpdateProject()

const loading = ref(false)

const onChangeVisibility = async (visibility: ProjectVisibility) => {
  loading.value = true
  await updateProject({ visibility, id: props.project.id })
  loading.value = false
}

const onChangeCommentPermissions = async (newVal: CommentPermissions) => {
  loading.value = true
  await updateProject({
    id: props.project.id,
    allowPublicComments: newVal === CommentPermissions.Anyone
  })
  loading.value = false
}
</script>
