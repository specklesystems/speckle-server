<template>
  <div>
    <WorkspaceMoveProject
      v-model:open="openPersonalLimits"
      :project="project"
      show-intro
      location="viewer_limits_dialog"
      prevent-close
      @done="open = false"
    />
    <ViewerLimitsWorkspaceDialog
      v-model:open="openWorkspaceLimits"
      :limit-type="limitType"
      :project="project"
      :resource-id-string="resourceIdString"
    />
  </div>
</template>
<script setup lang="ts">
import { useMultipleDialogBranching } from '~/lib/common/composables/dialog'
import { graphql } from '~/lib/common/generated/gql'
import type { ViewerLimitsDialog_ProjectFragment } from '~/lib/common/generated/gql/graphql'

type LimitType = 'version' | 'comment' | 'federated'

graphql(`
  fragment ViewerLimitsDialog_Project on Project {
    id
    workspaceId
    ...ViewerLimitsWorkspaceDialog_Project
    ...WorkspaceMoveProject_Project
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

const { openPersonalLimits, openWorkspaceLimits } = useMultipleDialogBranching({
  open,
  noDefault: true,
  conditions: {
    workspaceLimits: computed(() => !isPersonal.value),
    personalLimits: computed(() => isPersonal.value)
  }
})
</script>
