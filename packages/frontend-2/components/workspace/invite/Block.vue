<template>
  <div class="space-y-8 max-w-96">
    <h1 class="text-heading-xl text-center">Join workspace</h1>
    <div class="p-4 border border-outline-2 rounded text-body-xs">
      You're accepting an invitation to join
      <span class="font-medium">{{ invite.workspaceName }}</span>
      <template v-if="isCurrentUserTarget">.</template>
      <template v-else>
        <template v-if="targetUser">
          <!-- prettier-ignore -->
          <template v-if="activeUser">
            however the invitation was sent to
            <span class="inline-flex items-center font-medium">
              <UserAvatar :user="targetUser" size="sm" class="mr-1" />
              {{ targetUser.name }}
            </span>. You have to sign out from the current account to proceed.
          </template>
          <template v-else>. Please sign in to proceed.</template>
        </template>
        <template v-else>
          using the
          <span class="font-medium">{{ invite.email }}</span>
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
          @click="() => accept()"
        >
          Accept
        </FormButton>
        <FormButton
          color="outline"
          size="lg"
          full-width
          :disabled="loading"
          @click="() => decline()"
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
            @click="() => signOutGoToLogin()"
          >
            {{ activeUser ? 'Sign out to continue' : 'Sign in to continue' }}
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
            @click="
              () =>
                activeUser
                  ? acceptAndAddEmail()
                  : signOutGoToLogin({ addNewEmail: true })
            "
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
import { useWorkspacePublicSsoCheck } from '~/lib/workspaces/composables/sso'

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

const { activeUser } = useActiveUser()
const route = useRoute()
const router = useRouter()
const logger = useLogger()
const postAuthRedirect = usePostAuthRedirect()
const { logout } = useAuthManager()
const goToLogin = useNavigateToLogin()
const goToRegister = useNavigateToRegistration()
const { loading, accept, decline, token, isCurrentUserTarget, targetUser } =
  useWorkspaceInviteManager({
    invite: computed(() => props.invite)
  })

const workspaceSlug = computed(() => props.invite.workspaceSlug ?? '')
const { hasSsoEnabled } = useWorkspacePublicSsoCheck(workspaceSlug)

const buildPostAuthRedirectUrl = (params: {
  autoAccept?: boolean
  addNewEmail?: boolean
}) => {
  const currentRoute = new RelativeURL(route.fullPath)
  if (params.addNewEmail) {
    currentRoute.searchParams.set('addNewEmail', 'true')
  }
  if (params.autoAccept) {
    currentRoute.searchParams.set('accept', 'true')
  }
  if (token.value) {
    currentRoute.searchParams.set('token', token.value)
  }

  return currentRoute.toString()
}

const signOutGoToLogin = async (params?: { addNewEmail?: boolean }) => {
  const postAuthRedirectUrl = buildPostAuthRedirectUrl({
    addNewEmail: params?.addNewEmail || false,
    autoAccept: true
  })

  await logout({ skipRedirect: true })
  postAuthRedirect.set(postAuthRedirectUrl, true)
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
  try {
    if (!props.invite.workspaceSlug) {
      logger.warn(
        'No workspace slug found in invite, falling back to regular registration'
      )
      goToRegister({ query: { token: token.value } })
      return
    }

    const postAuthRedirectUrl = buildPostAuthRedirectUrl({
      addNewEmail: true,
      autoAccept: true
    })

    await logout({ skipRedirect: true })
    postAuthRedirect.set(postAuthRedirectUrl, true)

    if (hasSsoEnabled.value) {
      router.push({
        path: `/workspaces/${props.invite.workspaceSlug}/sso/register`,
        query: {
          token: token.value,
          register: 'true'
        }
      })
    } else {
      goToRegister({ query: { token: token.value } })
    }
  } catch (error) {
    logger.error('Error during SSO check:', error)
    goToRegister({ query: { token: token.value } })
  }
}

const acceptAndAddEmail = () => accept({ addNewEmail: true })
</script>
