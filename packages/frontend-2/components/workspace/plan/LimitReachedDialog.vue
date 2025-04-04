<template>
  <LayoutDialog v-model:open="isOpen" is-transparent max-width="md" fullscreen="none">
    <div class="flex flex-col md:flex-row items-stretch">
      <div class="relative w-full md:w-1/2 bg-primary h-40 md:h-full">
        <NuxtImg
          src="/images/workspace/cubes.png"
          alt="Speckle cubes"
          class="w-full h-full object-cover"
        />

        <div class="absolute top-0 left-0 w-full h-full limit-reached-gradient" />

        <div class="absolute top-0 left-0 w-full h-full z-10">
          <div class="flex flex-col justify-between h-full px-5 py-4">
            <NuxtImg src="/images/logo.png" alt="Speckle logo" class="h-8 w-8" />
            <h3 class="text-white limit-reached-text-shadow text-base">
              <span class="capitalize">{{ props.limitType }}</span>
              limit reached.
            </h3>
          </div>
        </div>
      </div>
      <div class="w-full md:w-1/2 bg-foundation p-6 flex flex-col">
        <div class="flex flex-col gap-y-4">
          <h4 class="text-heading-sm text-foreground">Upgrade your plan</h4>
          <p class="text-foreground">
            The {{ props.limit }} {{ props.limitType }} limit for this workspace has
            been reached. Upgrade the workspace plan to create or move more projects.
          </p>
        </div>
        <div class="flex justify-end gap-x-2 mt-8 md:mt-auto">
          <FormButton color="subtle" @click="isOpen = false">Dismiss</FormButton>
          <FormButton @click="navigateTo(settingsWorkspaceRoutes.billing)">
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

<style scoped>
.limit-reached-gradient {
  background: linear-gradient(319.64deg, rgb(5 52 255 / 0%) 34.17%, #010c3d 100%);
}
</style>
