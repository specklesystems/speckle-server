<template>
  <WorkspacePlanLimitReachedDialog v-model:open="dialogOpen" :buttons="buttons">
    <template #header>Plan limit reached</template>
    <div class="mb-2">
      The workspace
      <span class="font-bold">{{ workspaceName }}</span>
      is on a {{ formatName(plan) }} plan with a limit of
      {{ projectCount }}
      {{ projectCount === 1 ? 'project' : 'projects' }} and {{ modelCount }}
      {{ modelCount === 1 ? 'model' : 'models' }}. Upgrade the workspace to add more.
    </div>
  </WorkspacePlanLimitReachedDialog>
</template>
<script setup lang="ts">
import type { MaybeNullOrUndefined, WorkspacePlans } from '@speckle/shared'
import { Roles } from '@speckle/shared'
import type { LayoutDialogButton } from '@speckle/ui-components'
import { settingsWorkspaceRoutes } from '~/lib/common/helpers/route'
import { useWorkspaceUsage } from '~/lib/workspaces/composables/usage'
import { formatName } from '~/lib/billing/helpers/plan'

const props = defineProps<{
  workspaceSlug: string
  open?: boolean
  workspaceName?: string
  workspaceRole?: MaybeNullOrUndefined<string>
  plan?: MaybeNullOrUndefined<WorkspacePlans>
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const { modelCount, projectCount } = useWorkspaceUsage(props.workspaceSlug)

const dialogOpen = computed({
  get: () => props.open || false,
  set: (value) => emit('update:open', value)
})

const explorePlansButton: LayoutDialogButton = {
  text: 'Explore plans',
  disabled: props.workspaceRole === Roles.Workspace.Guest,
  disabledMessage: 'As a Guest you cannot access plans and billing',
  onClick: () =>
    navigateTo(settingsWorkspaceRoutes.billing.route(props.workspaceSlug || ''))
}

const cancelButton: LayoutDialogButton = {
  text: 'Cancel',
  props: {
    color: 'subtle'
  },
  onClick: () => (dialogOpen.value = false)
}

const buttons = computed((): LayoutDialogButton[] => [cancelButton, explorePlansButton])
</script>
