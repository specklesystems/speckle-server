<template>
  <CommonCard class="flex flex-col gap-y-4 p-6">
    <div class="flex flex-col">
      <h3 class="text-body font-medium">{{ title }}</h3>
      <p v-if="subtitle" class="text-foreground-3 text-body-sm pt-1">{{ subtitle }}</p>
      <slot name="subtitle" />
    </div>
    <p class="flex-1 mb-3">
      <span v-if="info" class="text-foreground-2 text-body-xs">{{ info }}</span>
      <slot name="info" />
    </p>
    <div class="flex items-center gap-x-2">
      <div
        v-for="(button, index) in buttons"
        :key="button.id || index"
        v-tippy="button.disabledMessage"
      >
        <FormButton
          v-bind="button.props || {}"
          :disabled="button.props?.disabled || button.disabled"
          size="sm"
          color="outline"
          @click="($event) => button.onClick?.($event)"
        >
          {{ button.text }}
        </FormButton>
      </div>
      <p v-if="disclaimer" class="font-medium text-foreground-2 text-body-2xs">
        {{ disclaimer }}
      </p>
    </div>
  </CommonCard>
</template>

<script lang="ts" setup>
import type { LayoutDialogButton } from '@speckle/ui-components'

defineProps<{
  title: string
  subtitle?: string
  info?: string
  buttons?: LayoutDialogButton[]
  disclaimer?: string
}>()
</script>
