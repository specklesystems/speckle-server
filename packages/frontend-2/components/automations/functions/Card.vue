<template>
  <div
    class="px-4 py-2 flex flex-col gap-3 rounded-lg border border-outline-3 bg-foundation"
  >
    <div class="flex">test</div>
  </div>
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
      ...LimitedUserAvatar
    }
  }
`)

defineProps<{
  fn: AutomationsFunctionsCard_AutomateFunctionFragment
}>()
</script>
