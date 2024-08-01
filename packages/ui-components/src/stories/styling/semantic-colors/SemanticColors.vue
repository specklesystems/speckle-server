<template>
  <div class="bg-foundation-page p-4 text-foreground space-y-4">
    <div class="font-semibold">
      Click on any of the color links to copy the color name to your clipboard!
    </div>
    <div
      v-for="(definition, colorBase) in colorDefinitions"
      :key="colorBase"
      class="flex flex-col space-y-4"
    >
      <span class="text-heading-xl uppercase block">{{ colorBase }}</span>
      <p class="block">{{ definition.description }}</p>
      <div class="flex flex-wrap space-x-4">
        <div
          v-for="(variation, i) in definition.variations"
          :key="i"
          class="flex flex-col items-center"
        >
          <div
            :class="['h-40 w-40', `bg-${buildColorString(colorBase, variation)}`]"
          ></div>
          <CommonTextLink
            href="javascript:void;"
            @click="onVariationClick(colorBase, variation)"
          >
            {{ buildColorString(colorBase, variation) }}
          </CommonTextLink>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { markClassesUsed } from '~~/src/helpers/tailwind'
import { useClipboard } from '@vueuse/core'
import { useGlobalToast } from '~~/src/stories/composables/toast'
import { ref } from 'vue'
import type { Ref } from 'vue'
import { ToastNotificationType } from '~~/src/helpers/global/toast'
import CommonTextLink from '~~/src/components/common/text/Link.vue'

/** Suffix on top of the color base name (e.g., focus if danger-focus) or null if no suffix (e.g., danger) */
type ColorVariation = string | null
type ColorDefinition = { description: string; variations: ColorVariation[] }

const lighterDarkerVariations: ColorVariation[] = [null, 'lighter', 'darker']

const colorDefinitions: Ref<Record<string, ColorDefinition>> = ref({
  foundation: {
    description: 'Meant to be used as page/panel background colors',
    variations: ['page', null, '2', '3', '4', '5', 'disabled', 'focus']
  },
  foreground: {
    description: 'Meant to be used as foreground (text) colors',
    variations: [null, '2', 'disabled', 'on-primary', 'primary']
  },
  primary: {
    description: 'Primary branding color of Speckle',
    variations: [null, 'focus', 'muted']
  },
  outline: {
    description: 'Outline/border/divider colors',
    variations: ['1', '2', '3', '4', '5']
  },
  highlight: {
    description: 'Used in hover states or anywhere to signal interaction',
    variations: ['1', '2', '3']
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
})

const { triggerNotification } = useGlobalToast()
const { copy } = useClipboard()

const buildColorString = (colorBase: string, variation: ColorVariation) => {
  let base = colorBase
  if (variation) {
    base += `-${variation}`
  }

  return base
}

const onVariationClick = async (colorBase: string, variation: ColorVariation) => {
  const colorString = buildColorString(colorBase, variation)
  await copy(colorString)
  triggerNotification({
    type: ToastNotificationType.Info,
    title: 'Copied!'
  })
}

markClassesUsed([
  'bg-foundation',
  'bg-foundation-page',
  'bg-foundation-2',
  'bg-foundation-3',
  'bg-foundation-4',
  'bg-foundation-5',
  'bg-foundation-focus',
  'bg-foundation-disabled',
  'bg-foreground',
  'bg-foreground-2',
  'bg-foreground-disabled',
  'bg-foreground-on-primary',
  'bg-foreground-primary',
  'bg-primary',
  'bg-primary-focus',
  'bg-primary-muted',
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
  'bg-danger-darker',
  'bg-outline-1',
  'bg-outline-2',
  'bg-outline-3',
  'bg-outline-4',
  'bg-outline-5',
  'bg-highlight-1',
  'bg-highlight-2',
  'bg-highlight-3'
])
</script>
