<template>
  <div :class="mainClasses">
    <div :class="mainInfoBlockClasses">
      <UserAvatar v-if="invite.invitedBy" :user="invite.invitedBy" :size="avatarSize" />
      <WorkspaceAvatar
        v-if="invite.workspace"
        :logo="invite.workspace.logo"
        :default-logo-index="invite.workspace.defaultLogoIndex"
      />
      <div class="text-foreground">
        <slot name="message" />
      </div>
    </div>
    <div class="flex space-x-2 w-full sm:w-auto shrink-0">
      <div v-if="isLoggedIn" class="flex items-center justify-end w-full space-x-2">
        <FormButton
          :size="buttonSize"
          color="subtle"
          text
          :full-width="block"
          :disabled="loading"
          @click="onDeclineClick(token)"
        >
          {{ declineMessage }}
        </FormButton>
        <FormButton
          :full-width="block"
          :size="buttonSize"
          color="outline"
          class="px-4"
          :icon-left="CheckIcon"
          :disabled="loading"
          @click="onAcceptClick(token)"
        >
          {{ acceptMessage }}
        </FormButton>
      </div>
      <template v-else>
        <FormButton
          :size="buttonSize"
          color="outline"
          full-width
          :disabled="loading"
          @click.stop.prevent="onLoginSignupClick"
        >
          {{ isForRegisteredUser ? 'Log in' : 'Sign up' }}
        </FormButton>
      </template>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { MaybeNullOrUndefined, Optional } from '@speckle/shared'
import type { AvatarUserType } from '~/lib/user/composables/avatar'
import { CheckIcon } from '@heroicons/vue/24/solid'
import { usePostAuthRedirect } from '~/lib/auth/composables/postAuthRedirect'
import {
  useNavigateToLogin,
  useNavigateToRegistration
} from '~/lib/common/helpers/route'
import { useMixpanel } from '~~/lib/core/composables/mp'

const emit = defineEmits<{
  processed: [accept: boolean, token: Optional<string>]
}>()

type GenericInviteItem = {
  invitedBy?: AvatarUserType
  workspace?: {
    id: string
    logo?: string
    defaultLogoIndex: number
  }
  user?: MaybeNullOrUndefined<{
    id: string
  }>
  token?: MaybeNullOrUndefined<string>
}

const props = defineProps<{
  invite: GenericInviteItem
  /**
   * Render this as a big block, instead of a small row. Used in full-page project access error pages.
   */
  block?: boolean
  loading?: boolean
}>()

const route = useRoute()
const { isLoggedIn } = useActiveUser()
const postAuthRedirect = usePostAuthRedirect()
const goToLogin = useNavigateToLogin()
const goToSignUp = useNavigateToRegistration()
const mixpanel = useMixpanel()

const token = computed(
  () => props.invite?.token || (route.query.token as Optional<string>)
)
const mainClasses = computed(() => {
  const classParts = [
    'flex flex-col space-y-4 px-4 py-5 transition bg-foundation border-x border-b border-outline-2 first:border-t first:rounded-t-lg last:rounded-b-lg'
  ]

  if (props.block) {
    classParts.push('')
  } else {
    classParts.push('sm:space-y-0 sm:space-x-2 sm:items-center sm:flex-row sm:py-2')
  }

  return classParts.join(' ')
})

const mainInfoBlockClasses = computed(() => {
  const classParts = ['flex grow items-center']

  if (props.block) {
    classParts.push('flex-col space-y-2')
  } else {
    classParts.push('flex-row space-x-2 text-body-xs')
  }

  return classParts.join(' ')
})

const avatarSize = computed(() => (props.block ? 'xxl' : 'base'))
const buttonSize = computed(() => (props.block ? 'lg' : 'sm'))
const isForRegisteredUser = computed(() => !!props.invite.user?.id)
const acceptMessage = computed(() => (props.invite.workspace ? 'Join' : 'Accept'))
const declineMessage = computed(() => (props.invite.workspace ? 'Dismiss' : 'Decline'))

const onLoginSignupClick = async () => {
  postAuthRedirect.setCurrentRoute()
  const query = {
    token: token.value || undefined
  }

  if (isForRegisteredUser.value) {
    await goToLogin({
      query
    })
  } else {
    await goToSignUp({ query })
  }
}

const onDeclineClick = (token?: string) => {
  emit('processed', false, token)
  if (props.invite.workspace) {
    mixpanel.track('Invite Action', {
      accepted: false,
      type: 'workspace invite',
      location: 'invite banner',
      // eslint-disable-next-line camelcase
      workspace_id: props.invite.workspace.id
    })
  }
}

const onAcceptClick = (token?: string) => {
  emit('processed', true, token)
  if (props.invite.workspace) {
    mixpanel.track('Workspace Joined', {
      location: 'invite banner',
      // eslint-disable-next-line camelcase
      workspace_id: props.invite.workspace.id
    })

    mixpanel.track('Invite Action', {
      accepted: true,
      type: 'workspace invite',
      // eslint-disable-next-line camelcase
      workspace_id: props.invite.workspace.id
    })
  }
}
</script>
