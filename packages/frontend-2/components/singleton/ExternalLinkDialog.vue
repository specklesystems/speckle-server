<template>
  <LayoutDialog v-model:open="state.open" max-width="xs" :buttons="buttons">
    <template #header>Leaving Speckle</template>
    <p class="mb-2">You're about to open the link below in a new tab:</p>
    <div class="p-3 bg-highlight-2 rounded-md font-mono break-all">
      {{ state.url }}
    </div>
    <p class="mt-2 mb-4">
      This is an external website. Speckle is not responsible for its content or
      security.
    </p>
    <p class="font-medium">Do you want to continue?</p>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { useGlobalExternalLinkDialog } from '~/lib/common/composables/externalLinkDialog'
import type { LayoutDialogButton } from '@speckle/ui-components'

const { state } = useGlobalExternalLinkDialog()
const buttons = computed((): LayoutDialogButton[] => [
  {
    text: 'Cancel',
    onClick: () => {
      state.value.open = false
      state.value._resolver?.(false)
    }
  },
  {
    text: 'Continue',
    props: { color: 'danger' },
    onClick: () => {
      window.open(state.value.url, '_blank', 'noopener,noreferrer')
      state.value.open = false
      state.value._resolver?.(true)
    }
  }
])
</script>
