<template>
  <LayoutDialog
    v-model:open="isOpen"
    :is-transparent="!condensed"
    max-width="xs"
    fullscreen="none"
    :buttons="buttons"
    :hide-closer="preventClose"
    :prevent-close-on-click-outside="preventClose"
    :title="condensed ? 'Plan limit reached' : undefined"
    closer-classes="hover:!bg-transparent !text-white hover:opacity-65"
  >
    <div class="flex flex-col">
      <div v-if="!condensed" class="relative bg-primary h-32 md:h-48 select-none">
        <NuxtImg
          src="~/assets/images/workspace/cubes.webp"
          alt="Speckle cubes"
          class="w-full object-cover h-full"
        />

        <div class="absolute top-0 left-0 w-full h-full limit-reached-gradient" />

        <div class="absolute top-0 left-0 w-full h-full z-10">
          <div class="flex flex-col justify-between h-full px-5 py-4">
            <NuxtImg src="/images/logo.png" alt="Speckle logo" class="h-8 w-8" />
            <h3 class="text-white limit-reached-text-shadow text-base">
              Plan limit reached
            </h3>
          </div>
        </div>
      </div>
      <div
        class="w-full bg-foundation-page flex flex-col"
        :class="condensed ? '' : 'p-6'"
      >
        <div class="flex flex-col gap-y-4 select-none">
          <h4 v-if="subtitle" class="text-heading-sm text-foreground">
            {{ subtitle }}
          </h4>
          <slot />
        </div>
      </div>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { LayoutDialog } from '@speckle/ui-components'
import type { LayoutDialogButton } from '@speckle/ui-components'

const isOpen = defineModel<boolean>('open', { required: true })

defineProps<{
  subtitle?: string
  buttons?: LayoutDialogButton[]
  preventClose?: boolean
  condensed?: boolean
}>()
</script>

<style scoped>
.limit-reached-gradient {
  background: linear-gradient(319.64deg, rgb(5 52 255 / 0%) 34.17%, #010c3d 100%);
}
</style>
