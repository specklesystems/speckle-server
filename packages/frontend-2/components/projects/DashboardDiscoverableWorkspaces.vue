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
      <FormButton size="lg">Join</FormButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import { dashboardDiscoverableWorkspacesQuery } from '~/lib/dashboard/graphql/queries'

const { result } = useQuery(dashboardDiscoverableWorkspacesQuery)
const discoverableWorkspaces = computed(() => {
  return result.value?.activeUser?.discoverableWorkspaces ?? []
})
</script>
