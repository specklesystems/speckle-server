<template>
  <div class="flex flex-col items-center gap-2 w-full max-w-lg mx-auto">
    <h1 v-if="showHeader" class="text-heading-xl text-forefround mb-2 font-normal mt-4">
      {{ title }}
    </h1>
    <p v-if="showHeader" class="text-center text-body-sm text-foreground-2 mb-8">
      {{ displayDescription }}
    </p>
    <CommonCard
      v-for="workspace in allWorkspaces"
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
            <p class="text-body-2xs text-foreground-2">
              {{ workspace.team?.totalCount }}
              {{ workspace.team?.totalCount === 1 ? 'member' : 'members' }}
            </p>
          </div>
          <FormButton
            v-if="workspace.status !== 'Request to join'"
            color="outline"
            size="sm"
            disabled
            class="capitalize"
            @click="() => processRequest(true, workspace.id)"
          >
            {{ workspace.status }}
          </FormButton>
          <FormButton
            v-else
            color="outline"
            size="sm"
            @click="() => processRequest(true, workspace.id)"
          >
            {{ workspace.status }}
          </FormButton>
        </div>
      </div>
    </CommonCard>
    <div class="mt-2 w-full">
      <FormButton
        size="lg"
        full-width
        color="outline"
        @click="navigateTo(workspaceCreateRoute())"
      >
        Create a new workspace
      </FormButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { workspaceCreateRoute } from '~~/lib/common/helpers/route'
import { useDiscoverableWorkspaces } from '~/lib/workspaces/composables/discoverableWorkspaces'

const props = withDefaults(
  defineProps<{
    title?: string
    description?: string
    showHeader?: boolean
  }>(),
  {
    title: 'Join teammates',
    showHeader: true
  }
)

const { discoverableWorkspaces, workspaceJoinRequests, processRequest } =
  useDiscoverableWorkspaces()

const defaultDescription = computed(() => {
  const count = discoverableWorkspaces.value.length
  if (count === 0) return 'No workspaces found matching your email domain'
  if (count === 1) return 'We found a workspace that matches your email domain'
  return `We found ${count} workspaces that match your email domain`
})

const displayDescription = computed(() => props.description ?? defaultDescription.value)

const allWorkspaces = computed(() => {
  const requested = (
    'items' in workspaceJoinRequests.value ? workspaceJoinRequests.value.items : []
  ).map((request) => ({
    ...request.workspace,
    status: request.status
  }))

  const discoverable = discoverableWorkspaces.value.map((workspace) => ({
    ...workspace,
    status: 'Request to join'
  }))

  return [...requested, ...discoverable]
})
</script>
