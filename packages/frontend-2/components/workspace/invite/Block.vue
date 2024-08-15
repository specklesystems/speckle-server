<template>
  <div class="space-y-8 max-w-96">
    <h1 class="text-heading-xl text-center">Join workspace</h1>
    <div class="p-4 border border-outline-2 rounded text-body-xs">
      You're accepting an invitation to join
      <span class="font-semibold">{{ invite.workspaceName }}</span>
    </div>
    <div class="flex flex-col space-y-4">
      <FormButton
        color="primary"
        size="lg"
        full-width
        :disabled="loading"
        @click="() => processInvite(true)"
      >
        Accept
      </FormButton>
      <FormButton
        color="outline"
        size="lg"
        full-width
        :disabled="loading"
        @click="() => processInvite(false)"
      >
        Decline
      </FormButton>
    </div>
  </div>
</template>
<script setup lang="ts">
import { waitForever, type Optional } from '@speckle/shared'
import { graphql } from '~/lib/common/generated/gql'
import type { WorkspaceInviteBlock_PendingWorkspaceCollaboratorFragment } from '~/lib/common/generated/gql/graphql'
import { useNavigateToHome, workspaceRoute } from '~/lib/common/helpers/route'
import { useProcessWorkspaceInvite } from '~/lib/workspaces/composables/management'

graphql(`
  fragment WorkspaceInviteBlock_PendingWorkspaceCollaborator on PendingWorkspaceCollaborator {
    id
    workspaceId
    workspaceName
    token
    user {
      id
    }
    title
  }
`)

const props = defineProps<{
  invite: WorkspaceInviteBlock_PendingWorkspaceCollaboratorFragment
}>()

const goHome = useNavigateToHome()
const route = useRoute()
const useInvite = useProcessWorkspaceInvite()
// const { activeUser } = useActiveUser()

const loading = ref(false)

const token = computed(
  () => (route.query.token as Optional<string>) || props.invite.token
)
const workspaceId = computed(() => route.params.id as Optional<string>)

// const email = computed(() => (!props.invite.user ? props.invite.title : undefined))
// const isCurrentUserTarget = computed(
//   () =>
//     activeUser.value &&
//     props.invite.user &&
//     activeUser.value.id === props.invite.user.id
// )

const processInvite = async (accept: boolean) => {
  if (!token.value) return

  loading.value = true
  await useInvite(
    {
      workspaceId: props.invite.workspaceId,
      input: {
        accept,
        token: token.value
      },
      inviteId: props.invite.id
    },
    {
      callback: async () => {
        // Redirect
        if (accept) {
          if (workspaceId.value) {
            window.location.href = workspaceRoute(workspaceId.value)
          } else {
            window.location.reload()
          }
          await waitForever() // to prevent UI changes while reload is happening
        } else {
          await goHome()
        }
      }
    }
  )
  loading.value = false
}
</script>
