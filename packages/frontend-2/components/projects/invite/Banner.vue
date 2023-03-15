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
            <CommonTextLink :to="projectRoute(invite.projectId)">
              {{ invite.projectName }}
            </CommonTextLink>
          </template>
          <template v-else>this stream</template>
        </div>
      </div>
      <div class="flex space-x-2 w-full sm:w-auto">
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
          <FormButton :to="loginRoute">Log In</FormButton>
        </template>
      </div>
    </div>
  </LayoutPanel>
</template>
<script setup lang="ts">
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { graphql } from '~~/lib/common/generated/gql'
import { ProjectsInviteBannerFragment } from '~~/lib/common/generated/gql/graphql'
import { projectRoute, loginRoute } from '~~/lib/common/helpers/route'
import { useProcessProjectInvite } from '~~/lib/projects/composables/projectManagement'
import { XMarkIcon } from '@heroicons/vue/24/solid'

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

const props = withDefaults(
  defineProps<{
    invite: ProjectsInviteBannerFragment
    showStreamName?: boolean
  }>(),
  { showStreamName: true }
)

const { isLoggedIn } = useActiveUser()
const processInvite = useProcessProjectInvite()

const loading = ref(false)

const useInvite = async (accept: boolean) => {
  if (!props.invite.token) return

  loading.value = true
  await processInvite(
    {
      projectId: props.invite.projectId,
      accept,
      token: props.invite.token
    },
    { inviteId: props.invite.id }
  )
  loading.value = false
}
</script>
