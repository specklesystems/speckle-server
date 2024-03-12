<template>
  <div>Test</div>
</template>
<script setup lang="ts">
import { graphql } from '~/lib/common/generated/gql'
import type { AutomationsFunctionsCard_AutomateFunctionFragment } from '~/lib/common/generated/gql/graphql'

graphql(`
  fragment AutomationsFunctionsCard_AutomateFunction on AutomateFunction {
    id
    name
    isFeatured
    description
    creator {
      id
      name
    }
  }
`)

defineProps<{
  fn: AutomationsFunctionsCard_AutomateFunctionFragment
}>()
</script>
