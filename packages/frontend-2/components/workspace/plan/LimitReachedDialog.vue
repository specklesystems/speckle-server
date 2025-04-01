<template>
  <LayoutDialog v-model:open="isOpen" is-transparent max-width="lg">
    <div class="flex items-stretch">
      <div class="w-1/2 bg-primary p-8">Left</div>
      <div class="w-1/2 bg-foundation px-8 py-16 flex flex-col gap-y-4">
        <h4 class="text-heading-sm text-foreground">
          Upgrade to {{ targetPlan }} plan to add more projects
        </h4>
        <p class="text-body-xs text-foreground-2">
          {{ limitMessage }}
        </p>
        <div class="flex flex-col gap-2 text-foreground-2">
          <p>You'll also get:</p>
          <ul v-if="targetPlan === 'business'" class="text-body-xs list-disc pl-6">
            <li>Domain security</li>
            <li>Single Sign-On (SSO)</li>
            <li>Custom data residency</li>
            <li>Priority support</li>
          </ul>
        </div>
        <div class="flex gap-x-2 mt-2">
          <FormButton color="outline" @click="isOpen = false">Dismiss</FormButton>
          <FormButton @click="navigateTo(settingsWorkspaceRoutes.billing)">
            Upgrade
          </FormButton>
        </div>
      </div>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import type { MaybeNullOrUndefined, WorkspacePlans } from '@speckle/shared'
import { LayoutDialog } from '@speckle/ui-components'
import { settingsWorkspaceRoutes } from '~/lib/common/helpers/route'

const isOpen = defineModel<boolean>('open', { required: true })

const props = defineProps<{
  currentPlan: MaybeNullOrUndefined<WorkspacePlans>
  limit: number
  limitType: 'project' | 'model'
}>()

const targetPlan = computed(() =>
  props.currentPlan === 'free' ? 'starter' : 'business'
)

const limitMessage = computed(() => {
  if (props.limitType === 'project') {
    return `The ${props.limit} project limit for this workspace has been reached.`
  }
  return `This project would exceed the ${props.limit} model limit for this workspace.`
})
</script>
