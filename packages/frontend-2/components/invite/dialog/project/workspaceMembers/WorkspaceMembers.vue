<template>
  <div>
    <h3 class="text-body-xs text-foreground font-medium mb-3">
      Add existing workspace members
    </h3>
    <ul class="flex flex-col">
      <InviteDialogProjectWorkspaceMembersRow
        v-for="member in invitableWorkspaceMembers"
        :key="member.user.id"
        :user="member"
        :workspace="props.project.workspace"
        :project-id="props.project.id"
      />
    </ul>
  </div>
</template>

<script setup lang="ts">
import { graphql } from '~/lib/common/generated/gql/gql'
import type { InviteDialogProjectWorkspaceMembers_ProjectFragment } from '~/lib/common/generated/gql/graphql'
import { useTeamInternals } from '~~/lib/projects/composables/team'

graphql(`
  fragment InviteDialogProjectWorkspaceMembers_Project on Project {
    id
    ...ProjectPageTeamInternals_Project
    workspace {
      team {
        items {
          ...InviteDialogProjectWorkspaceMembersRow_WorkspaceCollaborator
        }
      }
    }
  }
`)

const props = defineProps<{
  project: InviteDialogProjectWorkspaceMembers_ProjectFragment
}>()

const { collaboratorListItems } = useTeamInternals(computed(() => props.project))

const invitableWorkspaceMembers = computed(() => {
  const currentProjectMemberIds = new Set(
    collaboratorListItems.value.map((item) => item.user?.id)
  )

  return (
    props.project?.workspace?.team?.items.filter(
      (member) => member.user.id && !currentProjectMemberIds.has(member.user.id)
    ) || []
  )
})
</script>
