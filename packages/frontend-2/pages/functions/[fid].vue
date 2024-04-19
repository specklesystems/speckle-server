<template>
  <div class="mx-auto max-w-[864px]">
    <CommonLoadingBar :loading="loading" />
    <template v-if="!loading && fn">
      <AutomateFunctionPageHeader
        :fn="fn"
        :is-owner="isOwner"
        class="mb-12"
        @create-automation="showNewAutomationDialog = true"
        @edit="showEditDialog = true"
      />
      <AutomateFunctionPageInfo
        :fn="fn"
        @create-automation="showNewAutomationDialog = true"
      />
      <AutomateAutomationCreateDialog
        v-model:open="showNewAutomationDialog"
        :preselected-function="fn"
      />
      <AutomateFunctionEditDialog
        v-if="editModel"
        v-model:open="showEditDialog"
        :model="editModel"
        :fn-id="fn.id"
      />
    </template>
  </div>
</template>
<script setup lang="ts">
import { SourceApps, type Optional } from '@speckle/shared'
import { CommonLoadingBar } from '@speckle/ui-components'
import { useQuery, useQueryLoading } from '@vue/apollo-composable'
import type { FunctionDetailsFormValues } from '~/lib/automate/helpers/functions'
import { graphql } from '~/lib/common/generated/gql'

// TODO: 404 page

graphql(`
  fragment AutomateFunctionPage_AutomateFunction on AutomateFunction {
    id
    name
    description
    logo
    supportedSourceApps
    tags
    ...AutomateFunctionPageHeader_Function
    ...AutomateFunctionPageInfo_AutomateFunction
    ...AutomateAutomationCreateDialog_AutomateFunction
  }
`)

const pageQuery = graphql(`
  query AutomateFunctionPage($functionId: ID!) {
    automateFunction(id: $functionId) {
      ...AutomateFunctionPage_AutomateFunction
    }
  }
`)

definePageMeta({
  middleware: ['require-valid-function']
})

const { activeUser } = useActiveUser()
const route = useRoute()
const functionId = computed(() => route.params.fid as string)
const loading = useQueryLoading()
const { result } = useQuery(pageQuery, () => ({
  functionId: functionId.value
}))

const showEditDialog = ref(false)
const showNewAutomationDialog = ref(false)

const fn = computed(() => result.value?.automateFunction)
const isOwner = computed(
  () =>
    !!(
      activeUser.value?.id &&
      fn.value?.creator &&
      activeUser.value.id === fn.value.creator.id
    )
)

const editModel = computed((): Optional<FunctionDetailsFormValues> => {
  const func = fn.value
  if (!func) return undefined

  return {
    name: func.name,
    description: func.description,
    image: func.logo,
    allowedSourceApps: SourceApps.filter((app) =>
      func.supportedSourceApps.includes(app.name)
    ),
    tags: func.tags
  }
})
</script>
