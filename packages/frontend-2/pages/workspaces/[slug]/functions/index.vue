<template>
  <div>
    <div class="flex flex-col gap-4">
      <div class="flex items-center gap-2 mb-2">
        <IconBolt class="h-5 w-5" />
        <h1 class="text-heading-lg">Workspace functions</h1>
      </div>
      <AutomateFunctionsPageHeader
        v-model:search="search"
        :active-user="workspaceFunctionsResult?.activeUser"
        :server-info="workspaceFunctionsResult?.serverInfo"
        :workspace="workspace"
        class="mb-6"
      />
    </div>
    <AutomateFunctionsPageItems
      :functions="workspaceFunctions"
      :search="!!search"
      :loading="false"
      @create-automation-from="openCreateNewAutomation"
      @clear-search="search = ''"
    />
    <CommonLoadingBar :loading="workspaceFunctionsLoading" client-only class="mb-2" />
    <AutomateAutomationCreateDialog
      v-model:open="showNewAutomationDialog"
      :workspace-id="workspace?.id"
      :preselected-function="newAutomationTargetFn"
    />
  </div>
</template>
<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import type { CreateAutomationSelectableFunction } from '~/lib/automate/helpers/automations'
import { usePageQueryStandardFetchPolicy } from '~/lib/common/composables/graphql'
import { workspaceFunctionsQuery } from '~/lib/workspaces/graphql/queries'

definePageMeta({
  middleware: ['auth', 'requires-automate-enabled']
})

const route = useRoute()
const workspaceSlug = computed(() => route.params.slug as string)

const pageFetchPolicy = usePageQueryStandardFetchPolicy()

const { result: workspaceFunctionsResult, loading: workspaceFunctionsLoading } =
  useQuery(
    workspaceFunctionsQuery,
    () => ({
      workspaceSlug: workspaceSlug.value
    }),
    () => ({
      fetchPolicy: pageFetchPolicy.value
    })
  )

const workspace = computed(() => {
  const workspaceData = workspaceFunctionsResult.value?.workspaceBySlug

  return workspaceData
    ? {
        id: workspaceData.id,
        name: workspaceData.name,
        slug: workspaceSlug.value
      }
    : undefined
})

const workspaceFunctions = computed(
  () => workspaceFunctionsResult.value?.workspaceBySlug
)

const search = ref('')

const showNewAutomationDialog = ref(false)
const newAutomationTargetFn = ref<CreateAutomationSelectableFunction>()

const openCreateNewAutomation = (fn: CreateAutomationSelectableFunction) => {
  newAutomationTargetFn.value = fn
  showNewAutomationDialog.value = true
}
</script>
