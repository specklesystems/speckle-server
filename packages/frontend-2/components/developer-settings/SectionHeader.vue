<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-col md:flex-row gap-3 md:gap-0 justify-between">
      <h2 v-if="subheading" class="text-xl">{{ title }}</h2>
      <h1 v-else class="text-2xl font-semibold">{{ title }}</h1>
      <div class="flex flex-wrap gap-2">
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
    <p class="text-sm">
      <slot></slot>
    </p>
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
