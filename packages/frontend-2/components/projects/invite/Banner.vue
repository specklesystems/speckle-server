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
            the stream
            <CommonTextLink :to="projectRoute(invite.projectId)">
              {{ invite.projectName }}
            </CommonTextLink>
          </template>
          <template v-else>this stream</template>
        </div>
      </div>
      <div class="flex space-x-2 w-full sm:w-auto">
        <template v-if="isLoggedIn">
          <FormButton full-width>Accept</FormButton>
          <FormButton full-width color="danger">Decline</FormButton>
        </template>
        <template v-else>
          <FormButton>Log In</FormButton>
        </template>
      </div>
    </div>
  </LayoutPanel>
</template>
<script setup lang="ts">
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { graphql } from '~~/lib/common/generated/gql'
import { ProjectsInviteBannerFragment } from '~~/lib/common/generated/gql/graphql'
import { projectRoute } from '~~/lib/common/helpers/route'

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

withDefaults(
  defineProps<{
    invite: ProjectsInviteBannerFragment
    showStreamName?: boolean
  }>(),
  { showStreamName: true }
)

const { isLoggedIn } = useActiveUser()
</script>
