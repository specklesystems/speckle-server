<template>
  <div v-if="invite" :class="mainClasses">
    <div :class="mainInfoBlockClasses">
      <UserAvatar :user="invite.invitedBy" :size="avatarSize" />
      <div class="text-foreground">
        <span class="font-bold">{{ invite.invitedBy.name }}</span>
        has invited you to be part of the team from
        <template v-if="showStreamName">the project {{ invite.projectName }}.</template>
        <template v-else>this project.</template>
      </div>
    </div>
    <div class="flex space-x-2 w-full sm:w-auto shrink-0">
      <div v-if="isLoggedIn" class="flex items-center justify-end w-full space-x-2">
        <FormButton
          :size="buttonSize"
          color="danger"
          text
          :full-width="block"
          @click="useInvite(false)"
        >
          Decline
        </FormButton>
        <FormButton
          :full-width="block"
          :size="buttonSize"
          class="px-4"
          :icon-left="CheckIcon"
          @click="useInvite(true)"
        >
          Accept
        </FormButton>
      </div>
      <template v-else>
        <FormButton
          :size="buttonSize"
          full-width
          @click.stop.prevent="onLoginSignupClick"
        >
          {{ isForRegisteredUser ? 'Log In' : 'Sign Up' }}
        </FormButton>
      </template>
    </div>
  </div>
  <div v-else class="hidden" />
</template>
<script setup lang="ts">
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { graphql } from '~~/lib/common/generated/gql'
import type { ProjectsInviteBannerFragment } from '~~/lib/common/generated/gql/graphql'
import {
  useNavigateToLogin,
  useNavigateToRegistration
} from '~~/lib/common/helpers/route'
import { useProcessProjectInvite } from '~~/lib/projects/composables/projectManagement'
import { usePostAuthRedirect } from '~~/lib/auth/composables/postAuthRedirect'
import type { Optional } from '@speckle/shared'
import { CheckIcon } from '@heroicons/vue/24/solid'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { ToastNotificationType, useGlobalToast } from '~/lib/common/composables/toast'

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
    invite?: ProjectsInviteBannerFragment
    showStreamName?: boolean
    autoAccept?: boolean
    /**
     * Render this as a big block, instead of a small row. Used in full-page project access error pages.
     */
    block?: boolean
  }>(),
  { showStreamName: true }
)

const route = useRoute()
const { isLoggedIn } = useActiveUser()
const processInvite = useProcessProjectInvite()
const postAuthRedirect = usePostAuthRedirect()
const goToLogin = useNavigateToLogin()
const goToSignUp = useNavigateToRegistration()
const { triggerNotification } = useGlobalToast()

const loading = ref(false)
const mp = useMixpanel()
const token = computed(
  () => props.invite?.token || (route.query.token as Optional<string>)
)
const isForRegisteredUser = computed(() => !!props.invite?.user?.id)
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
    classParts.push('flex-row space-x-2 text-sm')
  }

  return classParts.join(' ')
})
const buttonSize = computed(() => (props.block ? 'lg' : 'sm'))
const avatarSize = computed(() => (props.block ? 'xxl' : 'base'))

const useInvite = async (accept: boolean) => {
  if (!token.value || !props.invite) return

  loading.value = true
  const success = await processInvite(
    {
      projectId: props.invite.projectId,
      accept,
      token: token.value
    },
    { inviteId: props.invite.id }
  )
  loading.value = false

  if (!success) return

  emit('processed', { accepted: accept })
  if (accept) {
    triggerNotification({
      type: ToastNotificationType.Success,
      title: "You've joined the project!"
    })
  }

  mp.track('Invite Action', {
    type: 'project invite',
    accepted: accept
  })
}

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

if (import.meta.client) {
  watch(
    () => props.autoAccept,
    async (newVal, oldVal) => {
      if (newVal && !oldVal) {
        await useInvite(true)
      }
    },
    { immediate: true }
  )
}
</script>
