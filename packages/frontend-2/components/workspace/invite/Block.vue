<template>
  <div class="space-y-8 max-w-96">
    <h1 class="text-heading-xl text-center">Join workspace</h1>
    <div class="p-4 border border-outline-2 rounded text-body-xs">
      You're accepting an invitation to join
      <span class="font-semibold">{{ invite.workspaceName }}</span>
      <template v-if="!isCurrentUserTarget">
        <template v-if="invite.user">
          however the invitation was sent to
          <span class="inline-flex items-center font-semibold">
            <UserAvatar :user="invite.user" size="sm" class="mr-1" />
            {{ invite.user.name }}
          </span>
          . You have to sign out from the current account to proceed.
        </template>
      </template>
    </div>
    <div class="flex flex-col space-y-4">
      <template v-if="isCurrentUserTarget">
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
      </template>
      <template v-else>
        <template v-if="invite.user">
          <FormButton
            color="primary"
            size="lg"
            full-width
            :disabled="loading"
            @click="signOutGoToLogin"
          >
            Sign out to continue
          </FormButton>
        </template>
      </template>
    </div>
  </div>
</template>
<script setup lang="ts">
import { waitForever, type Optional } from '@speckle/shared'
import { useAuthManager } from '~/lib/auth/composables/auth'
import { usePostAuthRedirect } from '~/lib/auth/composables/postAuthRedirect'
import { graphql } from '~/lib/common/generated/gql'
import type { WorkspaceInviteBlock_PendingWorkspaceCollaboratorFragment } from '~/lib/common/generated/gql/graphql'
import {
  useNavigateToHome,
  useNavigateToLogin,
  workspaceRoute
} from '~/lib/common/helpers/route'
import { useProcessWorkspaceInvite } from '~/lib/workspaces/composables/management'

graphql(`
  fragment WorkspaceInviteBlock_PendingWorkspaceCollaborator on PendingWorkspaceCollaborator {
    id
    workspaceId
    workspaceName
    token
    user {
      id
      name
      ...LimitedUserAvatar
    }
    title
    email
  }
`)

const props = defineProps<{
  invite: WorkspaceInviteBlock_PendingWorkspaceCollaboratorFragment
}>()

const postAuthRedirect = usePostAuthRedirect()
const { logout } = useAuthManager()
const goHome = useNavigateToHome()
const goToLogin = useNavigateToLogin()
const route = useRoute()
const useInvite = useProcessWorkspaceInvite()
const { activeUser } = useActiveUser()

const loading = ref(false)

const token = computed(
  () => (route.query.token as Optional<string>) || props.invite.token
)
const workspaceId = computed(() => route.params.id as Optional<string>)
const isCurrentUserTarget = computed(
  () =>
    activeUser.value &&
    props.invite.user &&
    activeUser.value.id === props.invite.user.id
)

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

const signOutGoToLogin = async () => {
  await logout()
  postAuthRedirect.setCurrentRoute(true)
  await goToLogin({
    query: {
      token: token.value
    }
  })
}
</script>
