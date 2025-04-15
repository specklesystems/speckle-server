<template>
  <LayoutDialog
    v-model:open="isOpen"
    is-transparent
    max-width="sm"
    fullscreen="none"
    hide-closer
  >
    <div class="flex flex-col rounded-t-xl overflow-hidden">
      <div
        class="relative bg-primary h-28 sm:h-40 select-none border border-outline-3 border-b-0 rounded-t-xl overflow-hidden"
      >
        <NuxtImg
          src="/images/workspace/announcement-dark.png"
          alt="Speckle cubes"
          class="hidden dark:block w-full h-full object-cover"
        />
        <NuxtImg
          src="/images/workspace/announcement-light.png"
          alt="Speckle cubes"
          class="dark:hidden w-full h-full object-cover"
        />
      </div>
      <div class="w-full bg-foundation-page flex flex-col p-4 sm:p-6">
        <div class="flex flex-col gap-y-3 sm:gap-y-4 select-none">
          <h4 class="text-heading-sm sm:text-heading text-foreground mt-1">
            Free plan limits and workspaces announcement
          </h4>
          <p class="text-body-2xs sm:text-body-xs text-foreground-2 mb-2 sm:mb-0">
            We’ve made big changes to how you work in Speckle. New navigation, new
            limits and pricing, and workspaces are now the default.
          </p>
        </div>
      </div>
    </div>
    <template #buttons>
      <div class="flex gap-2 justify-end">
        <FormButton color="subtle" @click="isOpen = false">Dismiss</FormButton>
        <!-- TODO: Add link to announcement -->
        <FormButton color="primary">Read announcement</FormButton>
      </div>
    </template>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { LayoutDialog } from '@speckle/ui-components'

const isOpen = defineModel<boolean>('open', { required: true })
</script>
