<template>
  <div>
    <CommonLoadingBar :loading="loading" />
    <template v-if="!loading">
      <AutomateFunctionPageHeader :fn="fn" class="mb-12" />
      <AutomateFunctionPageInfo />
    </template>
  </div>
</template>
<script setup lang="ts">
import { CommonLoadingBar, LogicError } from '@speckle/ui-components'
import { useQuery, useQueryLoading } from '@vue/apollo-composable'
import { graphql } from '~/lib/common/generated/gql'

// TODO: 404 page

const pageQuery = graphql(`
  query AutomateFunctionPage($functionId: ID!) {
    automateFunction(id: $functionId) {
      ...AutomateFunctionPageHeader_Function
    }
  }
`)

definePageMeta({
  middleware: ['require-valid-function']
})

const route = useRoute()
const functionId = computed(() => route.params.fid as string)
const loading = useQueryLoading()
const { result } = useQuery(pageQuery, () => ({
  functionId: functionId.value
}))

const fn = computed(() => {
  if (result.value?.automateFunction) return result.value.automateFunction
  throw new LogicError('Unexpectedly function not found!')
})
</script>
