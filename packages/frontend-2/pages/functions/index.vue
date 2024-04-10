<template>
  <div>
    <AutomateFunctionsPageHeader v-model:search="search" class="mb-8" />
    <CommonLoadingBar :loading="loading" />
    <AutomateFunctionsPageItems v-if="!loading" :functions="result" />
  </div>
</template>
<script setup lang="ts">
import { CommonLoadingBar } from '@speckle/ui-components'
import { useQuery, useQueryLoading } from '@vue/apollo-composable'
import { graphql } from '~/lib/common/generated/gql'

// TODO: Proper search & pagination

const pageQuery = graphql(`
  query AutomateFunctionsPage($search: String) {
    ...AutomateFunctionsPageItems_Query
  }
`)

const search = ref('')
const loading = useQueryLoading()
const { result } = useQuery(pageQuery, () => ({
  search: search.value?.length ? search.value : null
}))
</script>
