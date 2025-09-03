<template>
  <HeaderNavNotificationsInvite
    :invite="invite"
    :disabled="loading"
    @processed="processInvite"
  >
    <template #message>
      <span class="font-medium">{{ invite.invitedBy.name }}</span>
      has invited you to join the project
      <span class="font-medium">{{ invite.projectName }}</span>
    </template>
  </HeaderNavNotificationsInvite>
</template>

<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import type { HeaderNavNotificationsProjectInvite_PendingStreamCollaboratorFragment } from '~~/lib/common/generated/gql/graphql'
import type { Optional } from '@speckle/shared'
import { useProjectInviteManager } from '~/lib/projects/composables/invites'
import { projectRoute } from '~/lib/common/helpers/route'

graphql(`
  fragment HeaderNavNotificationsProjectInvite_PendingStreamCollaborator on PendingStreamCollaborator {
    id
    invitedBy {
      ...LimitedUserAvatar
    }
    projectId
    projectName
    token
    workspaceSlug
    user {
      id
    }
  }
`)

const props = defineProps<{
  invite: HeaderNavNotificationsProjectInvite_PendingStreamCollaboratorFragment
}>()

const { useInvite } = useProjectInviteManager()
const loading = ref(false)

const processInvite = async (accept: boolean, token: Optional<string>) => {
  if (!token) return

  loading.value = true

  const success = await useInvite({
    projectId: props.invite.projectId,
    accept,
    token,
    inviteId: props.invite.id
  })
  if (success && accept) {
    void navigateTo(projectRoute(props.invite.projectId))
  }

  loading.value = false
}
</script>
