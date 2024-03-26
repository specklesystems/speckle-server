<template>
  <div class="flex flex-col">
    <h2 class="h6 font-bold">Function</h2>
    <div class="text-foreground-2">
      Note: functions do not automatically update to their latest release. To do so,
      please select it manually via the edit dialog.
    </div>
    <AutomationsFunctionsCardView class="mt-2">
      <AutomationsFunctionsCard v-for="fn in functions" :key="fn.id" :fn="fn" />
    </AutomationsFunctionsCardView>
  </div>
</template>
<script setup lang="ts">
import { graphql } from '~/lib/common/generated/gql'
import type { ProjectPageAutomationFunctions_AutomationFragment } from '~/lib/common/generated/gql/graphql'

graphql(`
  fragment ProjectPageAutomationFunctions_Automation on Automation {
    id
    currentRevision {
      id
      functions {
        release {
          id
          function {
            id
            ...AutomationsFunctionsCard_AutomateFunction
          }
        }
      }
    }
  }
`)

const props = defineProps<{
  automation: ProjectPageAutomationFunctions_AutomationFragment
}>()

const functions = computed(
  () => props.automation.currentRevision?.functions.map((f) => f.release.function) || []
)
</script>
