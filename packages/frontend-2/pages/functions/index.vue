<template>
  <div>
    <AutomateFunctionsPageHeader
      v-model:search="search"
      :active-user="result?.activeUser"
      :server-info="result?.serverInfo"
      class="mb-8"
    />
    <CommonLoadingBar :loading="loading" />
    <AutomateFunctionsPageItems
      v-if="!loading"
      :functions="result"
      :search="!!search"
      @create-automation-from="openCreateNewAutomation"
      @clear-search="search = ''"
    />
    <AutomateAutomationCreateDialog
      v-model:open="showNewAutomationDialog"
      :preselected-function="newAutomationTargetFn"
    />
  </div>
</template>
<script setup lang="ts">
import { CommonLoadingBar } from '@speckle/ui-components'
import { useQuery, useQueryLoading } from '@vue/apollo-composable'
import type { CreateAutomationSelectableFunction } from '~/lib/automate/helpers/automations'
import { graphql } from '~/lib/common/generated/gql'

// TODO: Proper search & pagination

definePageMeta({
  middleware: ['requires-automate-enabled']
})

const pageQuery = graphql(`
  query AutomateFunctionsPage($search: String) {
    ...AutomateFunctionsPageItems_Query
    ...AutomateFunctionsPageHeader_Query
  }
`)

const search = ref('')
const loading = useQueryLoading()
const { result } = useQuery(pageQuery, () => ({
  search: search.value?.length ? search.value : null
}))

const showNewAutomationDialog = ref(false)
const newAutomationTargetFn = ref<CreateAutomationSelectableFunction>()

const openCreateNewAutomation = (fn: CreateAutomationSelectableFunction) => {
  newAutomationTargetFn.value = fn
  showNewAutomationDialog.value = true
}

useSeoMeta({
  title: 'All Functions',
  description: 'Select a function get started with Speckle Automate'
})
</script>
