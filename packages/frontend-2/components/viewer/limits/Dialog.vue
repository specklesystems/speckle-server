<template>
  <div>
    <div v-if="isPersonal" />
    <ViewerLimitsWorkspaceDialog
      v-else
      v-model:open="open"
      :limit-type="limitType"
      :project="project"
      :resource-id-string="resourceIdString"
    />
  </div>
</template>
<script setup lang="ts">
import { graphql } from '~/lib/common/generated/gql'
import type { ViewerLimitsDialog_ProjectFragment } from '~/lib/common/generated/gql/graphql'

type LimitType = 'version' | 'comment' | 'federated'

graphql(`
  fragment ViewerLimitsDialog_Project on Project {
    id
    workspaceId
    ...ViewerLimitsWorkspaceDialog_Project
  }
`)

const props = defineProps<{
  limitType: LimitType
  project: ViewerLimitsDialog_ProjectFragment
  resourceIdString: string
}>()

const open = defineModel<boolean>('open', {
  required: true
})

const isPersonal = computed(() => props.project && !props.project.workspaceId)
</script>
