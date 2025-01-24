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
      class="sm:w-44"
      mount-menu-on-body
      :allow-unset="false"
      :disabled-items="disabledItems"
      disabled-item-tooltip="This ueser does not match the set domain policy, and can only be invited as a guest"
      size="sm"
    />
    <FormButton color="outline" size="sm" :disabled="disableButton" @click="onInvite">
      Invite
    </FormButton>
  </li>
</template>

<script setup lang="ts">
import { graphql } from '~/lib/common/generated/gql/gql'
import type { InviteDialogProjectWorkspaceMembersRow_WorkspaceCollaboratorFragment } from '~/lib/common/generated/gql/graphql'
import { type StreamRoles, Roles } from '@speckle/shared'
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
      workspaceDomainPolicyCompliant
    }
  }
`)

const props = defineProps<{
  user: InviteDialogProjectWorkspaceMembersRow_WorkspaceCollaboratorFragment
  projectId: string
}>()

const createInvite = useInviteUserToProject()

const selectedRole = ref<StreamRoles>(Roles.Stream.Contributor)

const disabledItems = computed(() => {
  return props.user.user.workspaceDomainPolicyCompliant === false
    ? [Roles.Stream.Owner]
    : []
})
const disableButton = computed(() => {
  return (
    props.user.user.workspaceDomainPolicyCompliant === false &&
    selectedRole.value === Roles.Stream.Owner
  )
})

const onInvite = async () => {
  await createInvite(props.projectId, [
    {
      userId: props.user.user.id,
      role: Roles.Stream.Contributor
    }
  ])
}
</script>
