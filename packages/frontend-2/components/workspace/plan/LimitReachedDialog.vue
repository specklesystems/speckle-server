<template>
  <LayoutDialog v-model:open="isOpen" is-transparent max-width="lg">
    <div class="flex items-stretch min-h-96">
      <div class="w-1/2 bg-primary p-6">Left</div>
      <div class="w-1/2 bg-foundation p-6 flex flex-col justify-between gap-y-4">
        <div></div>
        <div class="flex flex-col gap-y-2">
          <h4 class="text-heading-sm text-foreground">
            You have reached your {{ props.limitType }} limit.
          </h4>
          <p class="text-foreground">
            Moving this project would exceed the
            <span class="font-medium">{{ props.limitType }}</span>
            limit of
            <span class="font-medium">{{ props.limit }}</span>
            for your current plan.
          </p>
          <p>Please upgrade to increase your {{ props.limitType }} limit.</p>
        </div>
        <div class="flex justify-end gap-x-2">
          <FormButton size="lg" color="subtle" @click="isOpen = false">
            Maybe later
          </FormButton>
          <FormButton size="lg" @click="navigateTo(settingsWorkspaceRoutes.billing)">
            Upgrade
          </FormButton>
        </div>
      </div>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { LayoutDialog } from '@speckle/ui-components'
import { settingsWorkspaceRoutes } from '~/lib/common/helpers/route'

const isOpen = defineModel<boolean>('open', { required: true })

const props = defineProps<{
  limit: number
  limitType: 'project' | 'model'
}>()
</script>
