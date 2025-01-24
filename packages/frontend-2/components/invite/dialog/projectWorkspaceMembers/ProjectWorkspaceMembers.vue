<template>
  <LayoutDialog v-model:open="isOpen" max-width="md" :buttons="dialogButtons">
    <template #header>Invite to project</template>
    <div class="flex flex-col gap-4">
      <div class="text-body-xs font-medium mb-1">Invite workspace members</div>
      <ul class="flex flex-col">
        <InviteDialogProjectWorkspaceMembersRow
          v-for="member in invitableWorkspaceMembers"
          :key="member.user.id"
          :user="member"
          :workspace="props.project.workspace"
          :project-id="props.project.id"
        />
      </ul>
      <p v-if="!invitableWorkspaceMembers.length" class="text-sm text-gray-500 mt-4">
        All workspace members are already in this project.
      </p>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { graphql } from '~/lib/common/generated/gql/gql'
import type { InviteDialogProjectWorkspaceMembers_ProjectFragment } from '~/lib/common/generated/gql/graphql'
import { useTeamInternals } from '~~/lib/projects/composables/team'
import type { LayoutDialogButton } from '@speckle/ui-components'

const emit = defineEmits<{
  (e: 'onCancel'): void
}>()

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

const isOpen = defineModel<boolean>('open', { required: true })

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

const dialogButtons = computed<LayoutDialogButton[]>(() => [
  {
    text: 'Cancel',
    props: { color: 'outline' },
    onClick: () => {
      isOpen.value = false
      emit('onCancel')
    }
  }
])
</script>
