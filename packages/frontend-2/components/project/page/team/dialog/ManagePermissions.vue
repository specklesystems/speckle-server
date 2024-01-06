<template>
  <LayoutDialogSection
    allow-overflow
    border-b
    title="Access"
    :guided-open="defaultOpen"
  >
    <template #icon>
      <LockOpenIcon
        v-if="project.visibility === ProjectVisibility.Public"
        class="h-full w-full"
      />
      <LinkIcon
        v-else-if="project.visibility === ProjectVisibility.Unlisted"
        class="h-full w-full"
      />
      <LockClosedIcon v-else class="h-full w-full" />
    </template>
    <div class="flex flex-col space-y-2">
      <!-- <div class="text-foreground-2 text-sm">Project Access</div> -->
      <ProjectVisibilitySelect
        :model-value="project.visibility"
        :disabled="isDisabled"
        mount-menu-on-body
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
        mount-menu-on-body
        @update:model-value="onChangeCommentPermissions"
      />
    </div>
  </LayoutDialogSection>
</template>
<script setup lang="ts">
import { ProjectVisibility } from '~~/lib/common/generated/gql/graphql'
import type { ProjectPageTeamDialogFragment } from '~~/lib/common/generated/gql/graphql'
import { LayoutDialogSection } from '@speckle/ui-components'
import { CommentPermissions } from '~~/lib/projects/helpers/components'
import { useUpdateProject } from '~~/lib/projects/composables/projectManagement'
import { useTeamDialogInternals } from '~~/lib/projects/composables/team'
import { LockClosedIcon, LockOpenIcon, LinkIcon } from '@heroicons/vue/24/outline'
import { useMixpanel } from '~~/lib/core/composables/mp'

const props = defineProps<{
  project: ProjectPageTeamDialogFragment
  defaultOpen: boolean
}>()

const { isOwner, isServerGuest } = useTeamDialogInternals({
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
