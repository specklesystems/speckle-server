<!--
  ___       __   ________  ___  _________
|\  \     |\  \|\   __  \|\  \|\___   ___\
\ \  \    \ \  \ \  \|\  \ \  \|___ \  \_|
 \ \  \  __\ \  \ \   __  \ \  \   \ \  \
  \ \  \|\__\_\  \ \  \ \  \ \  \   \ \  \
   \ \____________\ \__\ \__\ \__\   \ \__\
    \|____________|\|__|\|__|\|__|    \|__|

This file is only meant to be used in its new shiny
home on the workspaces dashboard page! It is living
here behind a flag for testing reasons.
-->

<template>
  <div class="w-full flex flex-col gap-4">
    <div
      v-for="workspace in discoverableWorkspaces"
      :key="workspace.id"
      class="w-full p-4 flex flex-row items-center justify-between border border-outline-3 border-primary rounded-xl bg-foundation"
    >
      <div class="flex flex-row flex-shrink items-center">
        <div class="w-8 h-8 mr-4 rounded-full bg-primary"></div>
        <div class="flex flex-col justify-start">
          <div class="mb-1">
            You can join
            <b>{{ workspace.name }}</b>
          </div>
          <div class="text-xs">
            {{ workspace.description }}
          </div>
        </div>
      </div>
      <FormButton size="lg" @click="() => handleJoin(workspace.id)">Join</FormButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { graphql } from '~/lib/common/generated/gql'
import { useApolloClient, useMutation, useQuery } from '@vue/apollo-composable'
import { getCacheId, getFirstErrorMessage } from '~/lib/common/helpers/graphql'
import { dashboardJoinWorkspaceMutation } from '~/lib/dashboard/graphql/mutations'

graphql(`
  fragment DashboardDiscoverableWorkspaces_DiscoverableWorkspace on DiscoverableWorkspace {
    id
    name
    description
  }
`)

defineProps<{
  discoverableWorkspaces: DashboardDiscoverableWorkspaces_DiscoverableWorkspace[]
}>()

const { client: apollo } = useApolloClient()

const { triggerNotification } = useGlobalToast()

const { mutate: joinWorkspace } = useMutation(dashboardJoinWorkspaceMutation)

const handleJoin = async (workspaceId: string) => {
  const result = await joinWorkspace({ input: { workspaceId } })

  if (result?.data) {
    // TODO: Redirect to workspace dashboard on success
    apollo.cache.evict({
      id: getCacheId('DiscoverableWorkspace', workspaceId)
    })
    triggerNotification({
      type: ToastNotificationType.Success,
      title: 'Joined workspace',
      description: 'Successfully joined workspace'
    })
  } else {
    const errorMessage = getFirstErrorMessage(result?.errors)
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Failed to join workspace',
      description: errorMessage
    })
  }
}
</script>
