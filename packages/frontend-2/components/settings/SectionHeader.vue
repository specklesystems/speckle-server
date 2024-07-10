<template>
  <div class="flex flex-col">
    <div class="flex flex-col md:flex-row gap-3 md:gap-0 justify-between">
      <h2 v-if="subheading" class="text-xl">{{ title }}</h2>
      <h1 v-else class="text-2xl font-semibold font-semibold hidden md:block">
        {{ title }}
      </h1>
      <div v-if="!!buttons" class="flex flex-wrap gap-2">
        <FormButton
          v-for="(button, index) in buttons"
          :key="index"
          v-bind="button.props"
          class="shrink-0 whitespace-nowrap"
          @click="($event) => button.onClick?.($event)"
        >
          {{ button.label }}
        </FormButton>
      </div>
    </div>
    <p v-if="text" class="text-sm pt-6 md:pt-4 text-secondary-2">
      {{ text }}
    </p>
    <hr v-if="!subheading" class="my-6 md:my-10" />
    <slot />
  </div>
</template>

<script lang="ts" setup>
import type { FormButton } from '@speckle/ui-components'

type FormButtonProps = InstanceType<typeof FormButton>['$props']

interface Button {
  label: string
  props: Record<string, unknown> & FormButtonProps
  onClick?: (e: MouseEvent) => void
}

withDefaults(
  defineProps<{
    title: string
    text?: string
    buttons?: Button[]
    subheading?: boolean
  }>(),
  {
    buttons: () => []
  }
)
</script>
