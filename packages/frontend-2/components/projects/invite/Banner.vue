<template>
  <InviteBanner
    :invite="invite"
    :block="block"
    :disabled="loading"
    @processed="processInvite"
  >
    <template #message>
      <span class="font-medium">{{ invite.invitedBy.name }}</span>
      has invited you to join
      <template v-if="showProjectName">
        the project
        <span class="font-medium">{{ invite.projectName }}</span>
      </template>
      <template v-else>this project</template>
    </template>
  </InviteBanner>
</template>
<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import type { ProjectsInviteBannerFragment } from '~~/lib/common/generated/gql/graphql'
import type { Optional } from '@speckle/shared'
import { useProjectInviteManager } from '~/lib/projects/composables/invites'

graphql(`
  fragment ProjectsInviteBanner on PendingStreamCollaborator {
    id
    invitedBy {
      ...LimitedUserAvatar
    }
    projectId
    projectName
    token
    user {
      id
    }
  }
`)

const emit = defineEmits<{
  (e: 'processed', val: { accepted: boolean }): void
}>()

const props = withDefaults(
  defineProps<{
    invite: ProjectsInviteBannerFragment
    showProjectName?: boolean
    /**
     * Render this as a big block, instead of a small row. Used in full-page project access error pages.
     */
    block?: boolean
  }>(),
  { showProjectName: true }
)

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
  loading.value = false
  if (!success) return
  emit('processed', { accepted: accept })
}
</script>
