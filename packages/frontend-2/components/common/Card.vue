<template>
  <div class="border border-outline-3 rounded-lg p-5 py-4">
    <div v-if="$slots.icon" class="mb-4">
      <slot name="icon" />
    </div>

    <p v-if="title" class="text-heading-sm text-foreground">{{ title }}</p>
    <p v-if="description" class="text-body-xs text-foreground-2 pt-1">
      {{ description }}
    </p>

    <slot />

    <div
      v-if="buttons"
      class="flex flex-col flex-wrap md:flex-row gap-y-2 md:gap-x-2 gap-y-0 mt-3"
    >
      <FormButton
        v-for="(button, index) in buttons"
        :key="button.id || index"
        v-bind="button.props || {}"
        :disabled="button.props?.disabled || button.disabled"
        :submit="button.props?.submit || button.submit"
        target="_blank"
        external
        size="sm"
        color="outline"
        @click="($event) => button.onClick?.($event)"
      >
        {{ button.text }}
      </FormButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { type LayoutDialogButton } from '@speckle/ui-components'

defineProps<{
  title: string
  description: string
  buttons?: LayoutDialogButton[]
}>()
</script>
