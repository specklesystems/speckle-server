<template>
  <div class="space-y-2">
    <AutomateFunctionRunRow
      v-for="fRun in runs"
      :key="fRun.id"
      :model-card="modelCard"
      :automation-name="automationName"
      :function-run="fRun"
      :project-id="projectId"
      :model-id="modelId"
      :version-id="versionId"
    />
  </div>
</template>
<script setup lang="ts">
import type { IModelCard } from '~/lib/models/card'
import type { AutomateFunctionRunItemFragment } from '~/lib/common/generated/gql/graphql'

defineProps<{
  runs: AutomateFunctionRunItemFragment[]
  modelCard: IModelCard
  automationName: string
  projectId: string
  modelId: string
  versionId?: string
}>()
</script>
