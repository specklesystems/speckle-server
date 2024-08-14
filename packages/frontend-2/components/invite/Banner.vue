<template>
  <div :class="mainClasses">
    <div :class="mainInfoBlockClasses">
      <UserAvatar :user="invite.invitedBy" :size="avatarSize" />
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
          @click="$emit('processed', false, token)"
        >
          Decline
        </FormButton>
        <FormButton
          :full-width="block"
          :size="buttonSize"
          color="outline"
          class="px-4"
          :icon-left="CheckIcon"
          :disabled="loading"
          @click="$emit('processed', true, token)"
        >
          Accept
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

defineEmits<{
  processed: [accept: boolean, token: Optional<string>]
}>()

type GenericInviteItem = {
  invitedBy: AvatarUserType
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

const token = computed(
  () => props.invite?.token || (route.query.token as Optional<string>)
)
const mainClasses = computed(() => {
  const classParts = ['flex flex-col space-y-4 px-4 py-5 transition ']

  if (props.block) {
    classParts.push('')
  } else {
    classParts.push('hover:bg-primary-muted')
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
</script>
