<template>
  <FormClipboardInput :value="value" v-bind="$attrs" @copy="handleCopy" />
</template>

<script setup lang="ts">
import { FormClipboardInput } from '@speckle/ui-components'
import { useClipboard } from '~~/composables/browser'

const { copy } = useClipboard()

defineProps({
  value: {
    type: String,
    required: true
  }
})

const handleCopy = async (value: string) => {
  await copy(value, {
    successMessage: 'Value copied to clipboard',
    failureMessage: 'Failed to copy value to clipboard'
  })
}
</script>
