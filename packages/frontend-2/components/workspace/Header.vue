<template>
  <div v-if="workspaceInfo" class="flex justify-between items-center">
    <div class="flex gap-2 mb-3 mt-2">
      <Component
        :is="workspaceInfo.logo"
        v-if="workspaceInfo.logo"
        class="w-5 h-5 mt-0.5"
      />
      <div class="flex flex-col">
        <h1 class="text-heading-lg">{{ workspaceInfo.name }}</h1>
        <div class="text-body-xs text-foreground-2">
          {{ workspaceInfo.description || 'No workspace description' }}
        </div>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <div
        class="text-body-3xs bg-foundation-2 text-foreground-2 rounded px-3 py-1 font-medium select-none"
      >
        {{ workspaceInfo.projects.totalCount || 0 }} Project{{
          workspaceInfo.projects.totalCount === 1 ? '' : 's'
        }}
      </div>
      <UserAvatarGroup
        :users="workspaceInfo.team.map((teamMember) => teamMember.user)"
        class="max-w-[104px]"
      />
      <FormButton color="outline">Invite</FormButton>
      <FormButton color="subtle" :icon-left="EllipsisHorizontalIcon" hide-text>
        Invite
      </FormButton>
    </div>
  </div>
  <div v-else-if="loading">Loading...</div>
  <div v-else-if="error">Error loading workspace data.</div>
</template>

<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import { EllipsisHorizontalIcon } from '@heroicons/vue/24/outline'
import { workspacePageQuery } from '~~/lib/workspaces/graphql/queries'

const props = defineProps<{
  workspaceId: string
}>()

const {
  result: workspaceInfoResult,
  loading,
  error
} = useQuery(workspacePageQuery, () => ({
  workspaceId: props.workspaceId
}))

const workspaceInfo = computed(() => {
  if (workspaceInfoResult.value) {
    return workspaceInfoResult.value.workspace
  }
  return null
})
</script>
