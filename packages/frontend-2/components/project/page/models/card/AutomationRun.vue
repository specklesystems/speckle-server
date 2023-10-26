<template>
  <div class="space-y-2">
    <!-- Note: keeping for the sake of potential future layout expansions. For now it looks cleaner
    without the automation name here, and having that in combined with the functino name in the components below. -->
    <!-- <div class="text-sm text-foreground-2">{{ run.automationName }} {{ run.id }}</div> -->
    <ProjectPageModelsCardFunctionRun
      v-for="fRun in run.functionRuns"
      :key="fRun.id"
      :automation-name="run.automationName"
      :function-run="(fRun as RemoveOnceBEIsHappy)"
    />
  </div>
</template>
<script setup lang="ts">
// import dayjs from 'dayjs'
import {
  AutomationFunctionRun,
  AutomationRun
} from '~~/lib/common/generated/gql/graphql'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type RemoveOnceBEIsHappy = AutomationFunctionRun & {
  results: { values: { blobIds: string[] } }
}

/* const props =  */ defineProps<{
  run: AutomationRun
}>()
</script>
