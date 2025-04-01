<template>
  <LayoutDialog v-model:open="isOpen" is-transparent max-width="lg">
    <div class="flex items-stretch">
      <div class="w-1/2 bg-primary p-6">Left</div>
      <div class="w-1/2 bg-foundation p-6 flex flex-col gap-y-10">
        <div class="flex flex-col gap-y-2 mt-6 px-4">
          <h4 class="text-heading-sm text-foreground">Upgrade your plan</h4>
          <p class="text-foreground">
            The {{ props.limit }} {{ props.limitType }} limit for this workspace has
            been reached. Upgrade the workspace plan to create or move more projects.
          </p>
        </div>
        <div class="flex justify-end gap-x-2">
          <FormButton size="lg" color="subtle" @click="isOpen = false">
            Maybe later
          </FormButton>
          <FormButton size="lg" @click="navigateTo(settingsWorkspaceRoutes.billing)">
            See plans
          </FormButton>
        </div>
      </div>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import type { Nullable } from '@speckle/shared'
import { LayoutDialog } from '@speckle/ui-components'
import { settingsWorkspaceRoutes } from '~/lib/common/helpers/route'

const isOpen = defineModel<boolean>('open', { required: true })

const props = defineProps<{
  limit: number
  limitType: Nullable<'project' | 'model'>
}>()
</script>
