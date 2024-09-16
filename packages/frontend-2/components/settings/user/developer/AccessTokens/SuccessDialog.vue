<template>
  <LayoutDialog
    v-model:open="isOpen"
    max-width="sm"
    :buttons="dialogButtons"
    title="Create Token"
  >
    <div class="flex flex-col gap-4 text-body-xs text-foreground">
      <div class="flex flex-col gap-1">
        <h6 class="font-medium">Your new token:</h6>
        <CommonClipboardInputWithToast :value="props.token" />
      </div>
      <div
        class="flex gap-4 items-center bg-foundation-2 border border-outline-3 rounded-lg p-3 text-foreground-2 mb-2"
      >
        <div class="max-w-md text-body-2xs">
          <p>
            <span class="font-medium">Note:</span>
            This is the first and last time you will be able to see the full token.
          </p>
          <p class="font-medium">Please copy paste it somewhere safe now.</p>
        </div>
      </div>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { LayoutDialog, type LayoutDialogButton } from '@speckle/ui-components'

const props = defineProps<{
  token: string
}>()

const isOpen = defineModel<boolean>('open', { required: true })

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Close',
    props: {},
    onClick: () => (isOpen.value = false)
  }
])
</script>
