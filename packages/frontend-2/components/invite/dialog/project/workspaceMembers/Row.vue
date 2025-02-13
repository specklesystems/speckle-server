<template>
  <li
    class="border-outline-2 border-x border-b first:border-t first:rounded-t-lg last:rounded-b-lg p-3 pl-4 border-b-outline-3 last:border-b-outline-2 gap-x-2 flex items-center"
  >
    <p class="text-body-xs text-foreground flex-1">
      {{ user.user.name }}
    </p>
    <FormSelectProjectRoles
      v-model="selectedRole"
      label="Select role"
      :name="`projectRole-${user.user.id}`"
      class="w-40"
      mount-menu-on-body
      :allow-unset="false"
      :hidden-items="[Roles.Stream.Owner]"
      size="sm"
    />
    <FormButton color="outline" size="sm" @click="onInvite">Add</FormButton>
  </li>
</template>

<script setup lang="ts">
import { graphql } from '~/lib/common/generated/gql/gql'
import type { InviteDialogProjectWorkspaceMembersRow_WorkspaceCollaboratorFragment } from '~/lib/common/generated/gql/graphql'
import { type StreamRoles, Roles, type MaybeNullOrUndefined } from '@speckle/shared'
import { useInviteUserToProject } from '~~/lib/projects/composables/projectManagement'

graphql(`
  fragment InviteDialogProjectWorkspaceMembersRow_WorkspaceCollaborator on WorkspaceCollaborator {
    role
    id
    user {
      id
      name
      bio
      company
      avatar
      verified
      role
    }
  }
`)

const props = defineProps<{
  user: InviteDialogProjectWorkspaceMembersRow_WorkspaceCollaboratorFragment
  projectId: string
  workspaceId: MaybeNullOrUndefined<string>
}>()

const createInvite = useInviteUserToProject()

const selectedRole = ref<StreamRoles>(Roles.Stream.Contributor)

const onInvite = async () => {
  await createInvite(props.projectId, [
    {
      userId: props.user.id,
      role: selectedRole.value,
      workspaceRole: props.user.role
    }
  ])
}
</script>
