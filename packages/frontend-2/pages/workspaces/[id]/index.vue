<template>
  <div>
    <WorkspaceProjectList :workspace-id="workspaceId" />
  </div>
</template>
<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import { useRoute } from 'vue-router'
import { useWorkspacesMixpanel } from '~/lib/workspaces/composables/mixpanel'
import { workspaceMixpanelUpdateGroupQuery } from '~/lib/workspaces/graphql/queries'

const route = useRoute()
const workspaceId = computed(() => route.params.id as string)
const { workspaceMixpanelUpdateGroup } = useWorkspacesMixpanel()
const pageFetchPolicy = usePageQueryStandardFetchPolicy()

definePageMeta({
  middleware: ['requires-workspaces-enabled', 'require-valid-workspace']
})

const { result } = useQuery(
  workspaceMixpanelUpdateGroupQuery,
  () => ({
    workspaceId: workspaceId.value
  }),
  () => ({
    fetchPolicy: pageFetchPolicy.value
  })
)

watch(
  () => result.value,
  (newVal, oldVal) => {
    if (newVal?.workspace && newVal.workspace.id !== oldVal?.workspace.id) {
      workspaceMixpanelUpdateGroup(newVal.workspace)
    }
  },
  { deep: true }
)
</script>
