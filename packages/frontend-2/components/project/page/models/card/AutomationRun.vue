<template>
  <div class="space-y-2">
    <!-- <div class="text-sm text-foreground-2">{{ run.automationName }} {{ run.id }}</div> -->
    <ProjectPageModelsCardFunctionRun
      v-for="fRun in run.functionRuns"
      :key="fRun.id"
      :automation-name="run.automationName"
      :function-run="fRun"
    />
  </div>
</template>
<script setup lang="ts">
import dayjs from 'dayjs'
import { AutomationRun } from '~~/lib/common/generated/gql/graphql'

const props = defineProps<{
  run: AutomationRun
}>()
</script>
