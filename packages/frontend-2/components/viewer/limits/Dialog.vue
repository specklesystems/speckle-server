<template>
  <div>
    <WorkspaceMoveProject
      v-model:open="openPersonalLimits"
      :project="project"
      :limit-type="limitType"
      show-intro
      location="viewer_limits_dialog"
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
import { useMixpanel } from '~/lib/core/composables/mp'
import type { ViewerLimitsDialogType } from '~/lib/projects/helpers/limits'

graphql(`
  fragment ViewerLimitsDialog_Project on Project {
    id
    workspaceId
    ...ViewerLimitsWorkspaceDialog_Project
    ...WorkspaceMoveProject_Project
  }
`)

const props = defineProps<{
  limitType: ViewerLimitsDialogType
  project: ViewerLimitsDialog_ProjectFragment
  resourceIdString: string
}>()

const open = defineModel<boolean>('open', {
  required: true
})
const mixpanel = useMixpanel()

const isPersonal = computed(() => props.project && !props.project.workspaceId)

const { openPersonalLimits, openWorkspaceLimits } = useMultipleDialogBranching({
  open,
  noDefault: true,
  conditions: {
    workspaceLimits: computed(() => !isPersonal.value),
    personalLimits: computed(() => isPersonal.value)
  }
})

watch(openWorkspaceLimits, (value, oldValue) => {
  if (value && !oldValue) {
    mixpanel.track('Limit Reached Dialog Viewed', {
      type: props.limitType === 'version' ? 'version' : 'model',
      location: 'viewer',
      // eslint-disable-next-line camelcase
      workspace_id: props.project.workspace?.slug,
      limitType: props.limitType
    })
  }
})

watch(openWorkspaceLimits, (value, oldValue) => {
  if (value && !oldValue) {
    mixpanel.track('Personal Limit Reached Dialog Viewed', {
      location: 'viewer',
      limitType: props.limitType
    })
  }
})
</script>
