<template>
  <HeaderWithEmptyPage empty-header>
    <template #header-left>
      <HeaderLogoBlock :active="false" class="min-w-40 cursor-pointer" no-link />
    </template>
    <template #header-right>
      <FormButton color="outline" @click="() => logout({ skipRedirect: false })">
        Sign out
      </FormButton>
    </template>

    <div class="flex flex-col items-center gap-2 w-full max-w-lg mx-auto">
      <h1 class="text-heading-xl text-forefround mb-2 font-normal mt-4">
        Join teammates
      </h1>
      <p class="text-center text-body-sm text-foreground-2 mb-8">
        We found a workspace that matches your email domain
      </p>
      <CommonCard
        v-for="workspace in discoverableWorkspaces"
        :key="workspace.id"
        class="w-full bg-foundation"
      >
        <div class="flex gap-4">
          <div>
            <WorkspaceAvatar :name="workspace.name" :logo="workspace.logo" size="xl" />
          </div>
          <div class="flex flex-col sm:flex-row gap-4 justify-between flex-1">
            <div class="flex flex-col flex-1">
              <h6 class="text-heading-sm">{{ workspace.name }}</h6>
              <p class="text-body-2xs text-foreground-2">{{ workspace.description }}</p>
            </div>
            <FormButton
              color="outline"
              size="sm"
              :loading="loadingStates[workspace.id]"
              :disabled="requestedWorkspaces.includes(workspace.id)"
              @click="() => processRequest(true, workspace.id)"
            >
              {{
                requestedWorkspaces.includes(workspace.id)
                  ? 'Requested'
                  : 'Request to join'
              }}
            </FormButton>
          </div>
        </div>
      </CommonCard>
      <div class="mt-2 w-full">
        <FormButton size="lg" full-width @click="$emit('next')">Continue</FormButton>
      </div>
    </div>
  </HeaderWithEmptyPage>
</template>

<script setup lang="ts">
import { dashboardRequestToJoinWorkspaceMutation } from '~~/lib/dashboard/graphql/mutations'
import {
  convertThrowIntoFetchResult,
  getFirstErrorMessage
} from '~~/lib/common/helpers/graphql'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { useMutation, useQuery } from '@vue/apollo-composable'
import { useAuthManager } from '~/lib/auth/composables/auth'
import { graphql } from '~/lib/common/generated/gql'
import { discoverableWorkspacesQuery } from '~~/lib/workspaces/graphql/queries'
graphql(`
  fragment WorkspaceJoinPage_DiscoverableWorkspaces on User {
    discoverableWorkspaces {
      id
      name
      logo
      description
      slug
    }
  }
`)

defineEmits(['next'])

const mixpanel = useMixpanel()
const { triggerNotification } = useGlobalToast()
const { logout } = useAuthManager()
const { result } = useQuery(discoverableWorkspacesQuery)
const { mutate: requestToJoin } = useMutation(dashboardRequestToJoinWorkspaceMutation)

const loadingStates = ref<Record<string, boolean>>({})

const requestedWorkspaces = ref<string[]>([])

const discoverableWorkspaces = computed(
  () => result.value?.activeUser?.discoverableWorkspaces || []
)

const processRequest = async (accept: boolean, workspaceId: string) => {
  if (accept) {
    loadingStates.value[workspaceId] = true

    try {
      const result = await requestToJoin({
        input: { workspaceId }
      }).catch(convertThrowIntoFetchResult)

      if (result?.data) {
        requestedWorkspaces.value.push(workspaceId)
        mixpanel.track('Workspace Join Request Sent', {
          workspaceId,
          location: 'onboarding',
          // eslint-disable-next-line camelcase
          workspace_id: workspaceId
        })

        triggerNotification({
          title: 'Request sent',
          description: 'Your request to join the workspace has been sent.',
          type: ToastNotificationType.Success
        })
      } else {
        const errorMessage = getFirstErrorMessage(result?.errors)
        triggerNotification({
          title: 'Failed to send request',
          description: errorMessage,
          type: ToastNotificationType.Danger
        })
      }
    } finally {
      loadingStates.value[workspaceId] = false
    }
  }
}
</script>
