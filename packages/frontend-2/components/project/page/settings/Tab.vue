<template>
  <div class="container max-w-4xl mx-auto flex flex-col gap-2 pt-4">
    <ProjectPageSettingsManageUsers
      always-open
      :project="project"
      @invite="emit('invite')"
    />
    <ProjectPageSettingsManagePermissions :project="project" default-open condensed />
    <ProjectPageSettingsWebhooks :project="project" />
    <ProjectPageSettingsDangerZones :project="project" />
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
