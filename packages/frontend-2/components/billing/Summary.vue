<template>
  <ul>
    <li
      v-for="(item, index) in billingItems"
      :key="item.name"
      class="text-body-xs flex"
      :class="[index === billingItems.length - 1 ? 'border-b border-outline-3' : null]"
    >
      <p
        class="text-foreground flex-1 py-2 px-3"
        :class="[index < billingItems.length - 1 ? 'border-b border-outline-3' : null]"
      >
        {{ item.label }}
        <span class="text-foreground-2">x</span>
        £{{ item.cost }}
      </p>
      <p
        class="text-right text-foreground ml-4 w-32 md:w-40 py-2 px-3"
        :class="[index < billingItems.length - 1 ? 'border-b border-outline-3' : null]"
      >
        £{{ item.count * item.cost }} / month
      </p>
    </li>
    <li class="flex justify-between text-foreground font-medium">
      <p class="flex-1 p-3">Total</p>
      <p class="text-right w-32 md:w-40 ml-4 p-3">
        £{{ workspaceCost.subTotal }} / month
      </p>
    </li>
  </ul>
</template>

<script lang="ts" setup>
import { graphql } from '~/lib/common/generated/gql'
import type { BillingSummary_WorkspaceCostFragment } from '~~/lib/common/generated/gql/graphql'

graphql(`
  fragment BillingSummary_WorkspaceCost on WorkspaceCost {
    items {
      cost
      count
      name
      label
    }
    discount {
      amount
      name
    }
    subTotal
    total
  }
`)

const props = defineProps<{
  workspaceCost: BillingSummary_WorkspaceCostFragment
}>()

const billingItems = computed(() => props.workspaceCost.items)
</script>
