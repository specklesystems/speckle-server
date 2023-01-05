<template>
  <div class="text-2xl mt-14">
    This is a model
    <b>VERSIONS</b>
    page for model: {{ route.params.modelId }}
  </div>
</template>
<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import { useQuery, useQueryLoading } from '@vue/apollo-composable'
const route = useRoute()
</script>
