<template>
  <CommonAlert color="info">
    <template #title>Upgrade your workspace</template>
    <template #description>
      {{ description }}
    </template>
  </CommonAlert>
</template>

<script setup lang="ts">
import { WorkspacePlans, type MaybeNullOrUndefined } from '@speckle/shared'

const props = defineProps<{
  planName: MaybeNullOrUndefined<WorkspacePlans>
}>()

const description = computed(() => {
  if (!props.planName) return ''

  if (props.planName === WorkspacePlans.Team)
    return 'Your workspace has reached a usage limit. Upgrade to the Business plan to keep using Speckle.'
  if (props.planName === WorkspacePlans.Pro)
    return 'Your workspace has reached a usage limit. Buy the Unlimited projects and models add-on to keep using Speckle.'

  return 'Your workspace has reached a usage limit. To keep using Speckle, you should upgrade your workspace to the Starter or Business plan.'
})
</script>
