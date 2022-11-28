<template>
  <div class="bg-foundation-page p-4 text-foreground space-y-4">
    <div class="font-bold">
      Click on any of the color links to copy the color name to your clipboard!
    </div>
    <div
      v-for="(definition, colorBase) in colorDefinitions"
      :key="colorBase"
      class="flex flex-col space-y-4"
    >
      <span class="h3 font-bold leading-9 uppercase block">{{ colorBase }}</span>
      <p class="block">{{ definition.description }}</p>
      <div class="flex flex-wrap gap-4">
        <div
          v-for="(variation, i) in definition.variations"
          :key="i"
          class="flex flex-col items-center"
        >
          <div
            :class="['h-40 w-40', `bg-${buildColorString(colorBase, variation)}`]"
          ></div>
          <CommonTextLink @click="onVariationClick(colorBase, variation)">
            {{ buildColorString(colorBase, variation) }}
          </CommonTextLink>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { markClassesUsed } from '~~/lib/common/helpers/tailwind'
import { useClipboard } from '@vueuse/core'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'

/** Suffix on top of the color base name (e.g., focus if danger-focus) or null if no suffix (e.g., danger) */
type ColorVariation = string | null
type ColorDefinition = { description: string; variations: ColorVariation[] }

const lighterDarkerVariations: ColorVariation[] = [null, 'lighter', 'darker']

const colorDefinitions: Record<string, ColorDefinition> = {
  foundation: {
    description: 'Meant to be used as page/panel background colors',
    variations: [null, 'page', '2', 'disabled']
  },
  foreground: {
    description: 'Meant to be used as foreground (text) colors',
    variations: [null, '2', 'disabled', 'on-primary']
  },
  primary: {
    description: 'Primary branding color of Speckle',
    variations: [null, 'focus', 'muted', 'outline', 'outline-2']
  },
  success: {
    description: 'For success messages/icons/notifications',
    variations: lighterDarkerVariations
  },
  warning: {
    description: 'For warning messages/icons/notifications',
    variations: lighterDarkerVariations
  },
  info: {
    description: 'For info messages/icons/notifications',
    variations: lighterDarkerVariations
  },
  danger: {
    description: 'For error messages/icons/notifications',
    variations: lighterDarkerVariations
  }
}

const { triggerNotification } = useGlobalToast()
const { copy } = useClipboard()

const buildColorString = (colorBase: string, variation: ColorVariation) => {
  let base = colorBase
  if (variation) {
    base += `-${variation}`
  }

  return base
}

const onVariationClick = (colorBase: string, variation: ColorVariation) => {
  const colorString = buildColorString(colorBase, variation)
  copy(colorString)
  triggerNotification({
    type: ToastNotificationType.Info,
    title: 'Copied!'
  })
}

markClassesUsed([
  'bg-foundation',
  'bg-foundation-page',
  'bg-foundation-2',
  'bg-foundation-disabled',
  'bg-foreground',
  'bg-foreground-2',
  'bg-foreground-disabled',
  'bg-foreground-on-primary',
  'bg-primary',
  'bg-primary-focus',
  'bg-primary-muted',
  'bg-primary-outline',
  'bg-primary-outline-2',
  'bg-success',
  'bg-success-lighter',
  'bg-success-darker',
  'bg-warning',
  'bg-warning-lighter',
  'bg-warning-darker',
  'bg-info',
  'bg-info-lighter',
  'bg-info-darker',
  'bg-danger',
  'bg-danger-lighter',
  'bg-danger-darker'
])
</script>
