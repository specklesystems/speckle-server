<template>
  <LayoutDialog
    v-model:open="isOpen"
    max-width="sm"
    :title="`Invite to ${props.project.name}`"
    :buttons="[
      {
        text: 'Cancel',
        props: { color: 'secondary', fullWidth: true },
        onClick: () => {
          isOpen = false
        }
      }
    ]"
  >
    <div class="flex flex-col text-foreground">
      <ProjectPageInviteDialogInviteUser
        v-if="isOwner && !isServerGuest"
        :project="project"
        default-open
      />
    </div>
  </LayoutDialog>
</template>
<script setup lang="ts">
import type { ProjectPageTeamDialogFragment } from '~~/lib/common/generated/gql/graphql'
import { graphql } from '~~/lib/common/generated/gql'
import { useTeamDialogInternals } from '~~/lib/projects/composables/team'
import { OpenSectionType } from '~~/lib/projects/helpers/components'

graphql(`
  fragment ProjectPageTeamDialog on Project {
    id
    name
    role
    allowPublicComments
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
    ...ProjectsPageTeamDialogManagePermissions_Project
  }
`)

const emit = defineEmits<{
  (e: 'update:open', v: boolean): void
}>()

const props = defineProps<{
  open: boolean
  project: ProjectPageTeamDialogFragment
  openSection?: OpenSectionType
}>()

const { isOwner, isServerGuest } = useTeamDialogInternals({
  props: toRefs(props)
})

const isOpen = computed({
  get: () => props.open,
  set: (newVal) => emit('update:open', newVal)
})
</script>
