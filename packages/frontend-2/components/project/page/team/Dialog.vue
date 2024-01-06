<template>
  <LayoutDialog v-model:open="isOpen" max-width="sm">
    <template #header>Manage Project</template>
    <div class="flex flex-col text-foreground">
      <ProjectPageTeamDialogManageUsers always-open :project="project" />
      <ProjectPageTeamDialogInviteUser
        v-if="isOwner && !isServerGuest"
        :project="project"
        :default-open="openSection === 'invite'"
      />
      <ProjectPageTeamDialogManagePermissions
        :project="project"
        :default-open="openSection === 'access'"
      />
      <ProjectPageTeamDialogWebhooks :project="project" />
      <ProjectPageTeamDialogDangerZones
        v-if="isOwner || canLeaveProject"
        :project="project"
      />
    </div>
  </LayoutDialog>
</template>
<script setup lang="ts">
import type { ProjectPageTeamDialogFragment } from '~~/lib/common/generated/gql/graphql'
import { graphql } from '~~/lib/common/generated/gql'
import { useTeamDialogInternals } from '~~/lib/projects/composables/team'
import type { OpenSectionType } from '~~/components/project/page/stats-block/Settings.vue'

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
  openSection?: OpenSectionType
}>()

const { isOwner, isServerGuest, canLeaveProject } = useTeamDialogInternals({
  props: toRefs(props)
})

const isOpen = computed({
  get: () => props.open,
  set: (newVal) => emit('update:open', newVal)
})
</script>
