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
        class="flex gap-4 items-center bg-highlight-1 border border-outline-3 rounded-lg py-2 pl-4 pr-8 text-foreground-2"
      >
        <ExclamationTriangleIcon class="h-8 w-8 mt-0.5" />
        <div class="max-w-md text-body-xs">
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
import { ExclamationTriangleIcon } from '@heroicons/vue/24/outline'

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
