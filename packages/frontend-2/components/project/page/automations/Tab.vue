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
        <ProjectPageAutomationsRow
          v-for="a in automations"
          :key="a.id"
          :automation="a"
          :project-id="projectId"
        />
      </template>
    </template>
    <AutomateAutomationCreateDialog
      v-model:open="showNewAutomationDialog"
      :preselected-project="project"
      :preselected-function="newAutomationTargetFn"
    />
  </div>
</template>
<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import { projectAutomationsTabQuery } from '~/lib/projects/graphql/queries'
import type { CreateAutomationSelectableFunction } from '~/lib/automate/helpers/automations'

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
const newAutomationTargetFn = ref<CreateAutomationSelectableFunction>()

const project = computed(() => result.value?.project)
const hasAutomations = computed(
  () => (result.value?.project?.automations.totalCount ?? 1) > 0
)
const automations = computed(() => result.value?.project?.automations.items || [])

const onNewAutomation = (fn?: CreateAutomationSelectableFunction) => {
  newAutomationTargetFn.value = fn
  showNewAutomationDialog.value = true
}
</script>
