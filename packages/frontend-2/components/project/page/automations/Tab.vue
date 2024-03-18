<template>
  <div class="flex flex-col gap-8">
    <ProjectPageAutomationsHeader
      v-model:search="search"
      :has-automations="hasAutomations && isAutomateEnabled"
    />
    <template v-if="loading">
      <CommonLoadingIcon />
    </template>
    <template v-else>
      <ProjectPageAutomationsEmptyState
        v-if="!hasAutomations || !isAutomateEnabled"
        :functions="result"
        :is-automate-enabled="isAutomateEnabled"
      />
      <template v-else>
        <template v-if="!automations.length">TODO: Search empty state</template>
        <template v-else>
          <ProjectPageAutomationsRow
            v-for="a in automations"
            :key="a.id"
            :automation="a"
            :project-id="projectId"
            @view="onViewRunDetails"
          />
        </template>
      </template>
    </template>
    <ProjectPageAutomationsRunDialog
      v-model:open="runInfoOpen"
      :run="openedRun?.run"
      :model-id="openedRun?.modelId"
      :automation-id="openedRun?.automationId"
      :project-id="projectId"
    />
  </div>
</template>
<script setup lang="ts">
import { CommonLoadingIcon } from '@speckle/ui-components'
import { useQuery } from '@vue/apollo-composable'
import { graphql } from '~/lib/common/generated/gql'
import type { AutomationRunDetailsFragment } from '~/lib/common/generated/gql/graphql'

const automationsTabQuery = graphql(`
  query ProjectAutomationsTab($projectId: String!, $search: String, $cursor: String) {
    project(id: $projectId) {
      id
      automations(filter: $search, cursor: $cursor, limit: 5) {
        totalCount
        items {
          ...ProjectPageAutomationsRow_Automation
        }
      }
    }
    ...ProjectPageAutomationsEmptyState_Query
  }
`)

const route = useRoute()
const projectId = computed(() => route.params.id as string)
const search = ref('')
const isAutomateEnabled = useIsAutomateModuleEnabled()

const openedRun = ref<{
  run: AutomationRunDetailsFragment
  modelId: string
  automationId: string
}>()
const runInfoOpen = ref(false)

const { result, loading } = useQuery(
  automationsTabQuery,
  () => ({
    projectId: projectId.value,
    search: search.value,
    // TODO: Pagination & search
    cursor: null
  }),
  () => ({
    enabled: isAutomateEnabled.value
  })
)

const hasAutomations = computed(
  () => (result.value?.project?.automations.totalCount ?? 1) > 0
)
const automations = computed(() => result.value?.project?.automations.items || [])

const onViewRunDetails = (
  run: AutomationRunDetailsFragment,
  modelId: string,
  automationId: string
) => {
  openedRun.value = { run, modelId, automationId }
  runInfoOpen.value = true
}
</script>
