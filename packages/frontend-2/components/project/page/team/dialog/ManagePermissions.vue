<template>
  <div class="flex flex-col space-y-4">
    <!-- <hr class="border border-outline-3" /> -->
    <!-- <div class="h4 font-bold">Project Permissions</div> -->
    <div class="h5 font-bold flex items-center space-x-2 mt-5">
      <LockOpenIcon
        v-if="project.visibility === ProjectVisibility.Public"
        class="w-6 h-6"
      />
      <LinkIcon
        v-if="project.visibility === ProjectVisibility.Unlisted"
        class="w-6 h-6"
      />
      <LockClosedIcon
        v-if="project.visibility === ProjectVisibility.Private"
        class="w-6 h-6"
      />
      <span>Access</span>
    </div>
    <div class="flex flex-col space-y-2">
      <!-- <div class="text-foreground-2 text-sm">Project Access</div> -->
      <ProjectVisibilitySelect
        :model-value="project.visibility"
        :disabled="isDisabled"
        @update:model-value="onChangeVisibility"
      />
      <!-- <div class="text-foreground-2 text-sm">Comments</div> -->
      <ProjectCommentPermissionsSelect
        :model-value="
          project.allowPublicComments
            ? CommentPermissions.Anyone
            : CommentPermissions.TeamMembersOnly
        "
        :disabled="isDisabled"
        @update:model-value="onChangeCommentPermissions"
      />
      <!-- <hr class="border border-outline-3" /> -->
    </div>
    <ProjectPageTeamDialogDangerZones
      v-if="isOwner || canLeaveProject"
      :project="project"
    />
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
import { LockClosedIcon, LockOpenIcon, LinkIcon } from '@heroicons/vue/24/solid'
import { useMixpanel } from '~~/lib/core/composables/mp'

const props = defineProps<{
  project: ProjectPageTeamDialogFragment
}>()

const { isOwner, canLeaveProject, isServerGuest } = useTeamDialogInternals({
  props: toRefs(props)
})
const updateProject = useUpdateProject()

const loading = ref(false)
const mp = useMixpanel()

const isDisabled = computed(
  () => !isOwner.value || loading.value || isServerGuest.value
)

const onChangeVisibility = async (visibility: ProjectVisibility) => {
  loading.value = true
  await updateProject({ visibility, id: props.project.id })
  loading.value = false
  mp.track('Stream Action', {
    type: 'action',
    name: 'update',
    action: 'project-access',
    to: visibility
  })
}

const onChangeCommentPermissions = async (newVal: CommentPermissions) => {
  loading.value = true
  await updateProject({
    id: props.project.id,
    allowPublicComments: newVal === CommentPermissions.Anyone
  })
  mp.track('Stream Action', {
    type: 'action',
    name: 'update',
    action: 'comment-access',
    to: newVal
  })
  loading.value = false
}
</script>
