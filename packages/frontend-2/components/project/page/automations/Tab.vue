<template>
  <div class="flex flex-col gap-8">
    <ProjectPageAutomationsHeader
      v-model:search="search"
      :has-automations="hasAutomations && isAutomateEnabled"
      @new-automation="onNewAutomation"
    />
    <template v-if="loading">
      <CommonLoadingBar loading />
    </template>
    <template v-else>
      <ProjectPageAutomationsEmptyState
        v-if="!hasAutomations || !isAutomateEnabled"
        :functions="result"
        :is-automate-enabled="isAutomateEnabled"
        @new-automation="onNewAutomation"
      />
      <template v-else>
        <template v-if="!automations.length">TODO: Search empty state</template>
        <template v-else>
          <ProjectPageAutomationsRow
            v-for="a in automations"
            :key="a.id"
            :automation="a"
            :project-id="projectId"
          />
        </template>
      </template>
    </template>
    <AutomateAutomationCreateDialog
      v-model:open="showNewAutomationDialog"
      :project-id="projectId"
      :selected-function-id="newAutomationTargetFnId"
    />
  </div>
</template>
<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import { projectAutomationsTabQuery } from '~/lib/projects/graphql/queries'

const route = useRoute()
const projectId = computed(() => route.params.id as string)
const search = ref('')
const isAutomateEnabled = useIsAutomateModuleEnabled()

const { result, loading } = useQuery(
  projectAutomationsTabQuery,
  () => ({
    projectId: projectId.value,
    search: search.value?.length ? search.value : null,
    // TODO: Pagination & search
    cursor: null
  }),
  () => ({
    enabled: isAutomateEnabled.value
  })
)

const showNewAutomationDialog = ref(false)
const newAutomationTargetFnId = ref<string>()

const hasAutomations = computed(
  () => (result.value?.project?.automations.totalCount ?? 1) > 0
)
const automations = computed(() => result.value?.project?.automations.items || [])

const onNewAutomation = (fnId?: string) => {
  newAutomationTargetFnId.value = fnId
  showNewAutomationDialog.value = true
}
</script>
