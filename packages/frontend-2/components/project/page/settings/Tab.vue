<template>
  <div class="flex gap-8 pt-4">
    <div class="w-3/12">12345</div>
    <div class="w-9/12">
      <ProjectPageSettingsManageUsers
        always-open
        :project="project"
        @invite="emit('invite')"
      />
      <ProjectPageSettingsManagePermissions :project="project" default-open condensed />
      <ProjectPageSettingsWebhooks :project="project" />
      <ProjectPageSettingsDangerZones :project="project" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ProjectPageSettingsFragment } from '~~/lib/common/generated/gql/graphql'
import { graphql } from '~~/lib/common/generated/gql'

graphql(`
  fragment ProjectPageSettings on Project {
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
    ...ProjectsPageTeamDialogManagePermissions_Project
  }
`)

defineProps<{
  project: ProjectPageSettingsFragment
}>()

const emit = defineEmits(['invite'])
</script>
