<template>
  <LayoutDialog v-model:open="isOpen" max-width="md">
    <div class="flex flex-col text-foreground space-y-4">
      <ProjectPageTeamDialogInviteUser
        v-if="isOwner && !isServerGuest"
        :project="project"
      />
      <ProjectPageTeamDialogManageUsers :project="project" />
      <ProjectPageTeamDialogManagePermissions :project="project" />
    </div>
  </LayoutDialog>
</template>
<script setup lang="ts">
import { ProjectPageTeamDialogFragment } from '~~/lib/common/generated/gql/graphql'
import { graphql } from '~~/lib/common/generated/gql'
import { useTeamDialogInternals } from '~~/lib/projects/composables/team'

graphql(`
  fragment ProjectPageTeamDialog on Project {
    id
    name
    role
    allowPublicComments
    visibility
    team {
      role
      user {
        ...LimitedUserAvatar
        role
      }
    }
    invitedTeam {
      id
      title
      inviteId
      role
      user {
        ...LimitedUserAvatar
        role
      }
    }
  }
`)

const emit = defineEmits<{
  (e: 'update:open', v: boolean): void
}>()

const props = defineProps<{
  open: boolean
  project: ProjectPageTeamDialogFragment
}>()

const { isOwner, isServerGuest } = useTeamDialogInternals({ props: toRefs(props) })

const isOpen = computed({
  get: () => props.open,
  set: (newVal) => emit('update:open', newVal)
})
</script>
