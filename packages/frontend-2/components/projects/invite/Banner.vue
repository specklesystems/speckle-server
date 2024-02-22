<template>
  <div
    v-if="invite"
    class="flex flex-col space-y-4 sm:space-y-0 sm:space-x-2 sm:items-center sm:flex-row px-4 py-5 sm:py-2 transition hover:bg-primary-muted"
  >
    <div class="flex space-x-2 items-center grow text-sm">
      <UserAvatar :user="invite.invitedBy" />
      <div class="text-foreground">
        <span class="font-bold">{{ invite.invitedBy.name }}</span>
        has invited you to be part of the team from
        <template v-if="showStreamName">the project {{ invite.projectName }}.</template>
        <template v-else>this project.</template>
      </div>
    </div>
    <div class="flex space-x-2 w-full sm:w-auto shrink-0">
      <div v-if="isLoggedIn" class="flex items-center justify-end w-full space-x-2">
        <FormButton size="sm" color="danger" text @click="useInvite(false)">
          Decline
        </FormButton>
        <FormButton
          size="sm"
          class="px-4"
          :icon-left="CheckIcon"
          @click="useInvite(true)"
        >
          Accept
        </FormButton>
      </div>
      <template v-else>
        <FormButton size="sm" full-width @click.stop.prevent="onLoginClick">
          Log In
        </FormButton>
      </template>
    </div>
  </div>
  <div v-else />
</template>
<script setup lang="ts">
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { graphql } from '~~/lib/common/generated/gql'
import type { ProjectsInviteBannerFragment } from '~~/lib/common/generated/gql/graphql'
import { useNavigateToLogin } from '~~/lib/common/helpers/route'
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
  }>(),
  { showStreamName: true }
)

const route = useRoute()
const { isLoggedIn } = useActiveUser()
const processInvite = useProcessProjectInvite()
const postAuthRedirect = usePostAuthRedirect()
const goToLogin = useNavigateToLogin()
const { triggerNotification } = useGlobalToast()

const loading = ref(false)
const mp = useMixpanel()
const token = computed(
  () => props.invite?.token || (route.query.token as Optional<string>)
)

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

const onLoginClick = () => {
  postAuthRedirect.setCurrentRoute()
  goToLogin({
    query: {
      token: token.value || undefined
    }
  })
}

if (process.client) {
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
