<template>
  <LayoutPanel>
    <div
      class="flex flex-col space-y-2 sm:space-y-0 sm:space-x-2 sm:items-center sm:flex-row"
    >
      <div class="flex space-x-2 items-center grow">
        <UserAvatar :user="invite.invitedBy" />
        <div class="text-foreground">
          <span class="font-bold">{{ invite.invitedBy.name }}</span>
          has invited you to become a bollaborator on
          <template v-if="showStreamName">
            the project
            <CommonTextLink
              :to="projectRoute(invite.projectId)"
              @click.prevent="onProjectNameClick"
            >
              {{ invite.projectName }}
            </CommonTextLink>
          </template>
          <template v-else>this stream</template>
        </div>
      </div>
      <div class="flex space-x-2 w-full sm:w-auto shrink-0">
        <template v-if="isLoggedIn">
          <FormButton full-width @click="useInvite(true)">Accept</FormButton>
          <FormButton
            v-tippy="'Dismiss'"
            full-width
            text
            color="danger"
            @click="useInvite(false)"
          >
            <XMarkIcon class="w-5 h-5" />
          </FormButton>
        </template>
        <template v-else>
          <FormButton full-width @click.stop.prevent="onLoginClick">Log In</FormButton>
        </template>
      </div>
    </div>
  </LayoutPanel>
</template>
<script setup lang="ts">
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { graphql } from '~~/lib/common/generated/gql'
import { ProjectsInviteBannerFragment } from '~~/lib/common/generated/gql/graphql'
import {
  projectRoute,
  useNavigateToLogin,
  useNavigateToProject
} from '~~/lib/common/helpers/route'
import { useProcessProjectInvite } from '~~/lib/projects/composables/projectManagement'
import { XMarkIcon } from '@heroicons/vue/24/solid'
import { usePostAuthRedirect } from '~~/lib/auth/composables/postAuthRedirect'
import { ensureError, Optional } from '@speckle/shared'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'

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
    invite: ProjectsInviteBannerFragment
    showStreamName?: boolean
  }>(),
  { showStreamName: true }
)

const { triggerNotification } = useGlobalToast()
const route = useRoute()
const { isLoggedIn } = useActiveUser()
const processInvite = useProcessProjectInvite()
const postAuthRedirect = usePostAuthRedirect()
const goToLogin = useNavigateToLogin()
const goToProject = useNavigateToProject()

const loading = ref(false)

const token = computed(
  () => props.invite.token || (route.query.token as Optional<string>)
)

const useInvite = async (accept: boolean) => {
  if (!token.value) return

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

  if (success) {
    emit('processed', { accepted: accept })
  }
}

const onLoginClick = () => {
  postAuthRedirect.setCurrentRoute()
  goToLogin({
    query: {
      token: token.value || undefined
    }
  })
}

const onProjectNameClick = async () => {
  try {
    await goToProject({ id: props.invite.projectId })
  } catch (e) {
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: ensureError(e).message
    })
  }
}
</script>
