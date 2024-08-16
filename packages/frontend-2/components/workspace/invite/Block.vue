<template>
  <div class="space-y-8 max-w-96">
    <h1 class="text-heading-xl text-center">Join workspace</h1>
    <div class="p-4 border border-outline-2 rounded text-body-xs">
      You're accepting an invitation to join
      <span class="font-semibold">{{ invite.workspaceName }}</span>
      <template v-if="!isCurrentUserTarget">
        <template v-if="targetUser">
          however the invitation was sent to
          <span class="inline-flex items-center font-semibold">
            <UserAvatar :user="targetUser" size="sm" class="mr-1" />
            {{ targetUser.name }}
          </span>
          . You have to sign out from the current account to proceed.
        </template>
        <template v-else>
          using the
          <span class="font-semibold">{{ invite.email }}</span>
          email address.
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
          @click="accept"
        >
          Accept
        </FormButton>
        <FormButton
          color="outline"
          size="lg"
          full-width
          :disabled="loading"
          @click="decline"
        >
          Decline
        </FormButton>
      </template>
      <template v-else>
        <template v-if="targetUser">
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
        <template v-else>
          <FormButton
            color="outline"
            size="lg"
            full-width
            :disabled="loading"
            @click="signOutGoToRegister"
          >
            Create new account
          </FormButton>
          <FormButton
            color="primary"
            size="lg"
            full-width
            :disabled="loading"
            @click="acceptAndAddEmail"
          >
            Add new email to existing account
          </FormButton>
        </template>
      </template>
    </div>
  </div>
</template>
<script setup lang="ts">
import { RelativeURL } from '@speckle/shared'
import { useAuthManager } from '~/lib/auth/composables/auth'
import { usePostAuthRedirect } from '~/lib/auth/composables/postAuthRedirect'
import { graphql } from '~/lib/common/generated/gql'
import type { WorkspaceInviteBlock_PendingWorkspaceCollaboratorFragment } from '~/lib/common/generated/gql/graphql'
import {
  useNavigateToLogin,
  useNavigateToRegistration
} from '~/lib/common/helpers/route'
import { useWorkspaceInviteManager } from '~/lib/workspaces/composables/management'

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
    ...UseWorkspaceInviteManager_PendingWorkspaceCollaborator
  }
`)

const props = defineProps<{
  invite: WorkspaceInviteBlock_PendingWorkspaceCollaboratorFragment
}>()

const route = useRoute()
const postAuthRedirect = usePostAuthRedirect()
const { logout } = useAuthManager()
const goToLogin = useNavigateToLogin()
const goToRegister = useNavigateToRegistration()
const { loading, accept, decline, token, isCurrentUserTarget, targetUser } =
  useWorkspaceInviteManager({
    invite: computed(() => props.invite)
  })

const signOutGoToLogin = async () => {
  await logout({ skipRedirect: true })
  postAuthRedirect.setCurrentRoute(true)
  await goToLogin({
    query: {
      token: token.value
    }
  })
}

/**
 * Go to register and set post-auth redirect to accepting the invite
 * and adding the target email to the account
 */
const signOutGoToRegister = async () => {
  const currentRoute = new RelativeURL(route.fullPath)
  currentRoute.searchParams.set('addNewEmail', 'true')
  currentRoute.searchParams.set('token', token.value || '')
  currentRoute.searchParams.set('accept', 'true')

  await logout({ skipRedirect: true })
  postAuthRedirect.set(currentRoute.toString(), true)
  await goToRegister({
    query: {
      token: token.value
    }
  })
}

const acceptAndAddEmail = () => accept({ addNewEmail: true })
</script>
