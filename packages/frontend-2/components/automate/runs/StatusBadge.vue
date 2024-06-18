<template>
  <CommonBadge :color-classes="[runStatusClasses(run), 'shrink-0 grow-0'].join(' ')">
    {{ run.status.toUpperCase() }}
  </CommonBadge>
</template>
<script setup lang="ts">
import { useAutomationRunDetailsFns } from '~/lib/automate/composables/runs'
import type { AutomationRunDetailsFragment } from '~/lib/common/generated/gql/graphql'

defineProps<{
  run: AutomationRunDetailsFragment
}>()

const { runStatusClasses } = useAutomationRunDetailsFns()
</script>
