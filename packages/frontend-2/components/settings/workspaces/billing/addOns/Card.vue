<template>
  <CommonCard class="flex flex-col gap-y-4 p-6">
    <div class="flex flex-col">
      <h3 class="text-body font-medium mb-1">{{ title }}</h3>
      <p v-if="info" class="text-body-xs text-foreground-2 mb-2">
        {{ info }}
      </p>
      <p v-if="subtitle" class="text-foreground-3 text-body-sm pt-1">{{ subtitle }}</p>
      <slot name="subtitle" />
    </div>
    <div class="flex items-center gap-x-2">
      <div v-if="button" v-tippy="button.disabledMessage">
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
  button: LayoutDialogButton
  disclaimer?: string
}>()
</script>
