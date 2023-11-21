<template>
  <LayoutDialog
    v-model:open="isOpen"
    max-width="sm"
    :buttons="dialogButtons"
    title="Create Token"
  >
    <div class="flex flex-col gap-6 text-sm text-foreground">
      <div class="flex flex-col gap-3">
        <h6 class="h6 font-bold text-center">Your new token:</h6>
        <CommonClipboardInputWithToast :value="props.token" />
      </div>
      <div
        class="flex gap-4 items-center bg-warning dark:bg-warning-lighter border-warning-darker dark:border-warning-lighter border rounded-lg py-2 pl-4 pr-8"
      >
        <ExclamationTriangleIcon
          class="h-8 w-8 mt-0.5 text-warning-darker dark:text-warning-darker"
        />
        <div class="text-warning-darker max-w-md">
          <p>
            <strong>Note:</strong>
            This is the first and last time you will be able to see the full token.
          </p>
          <p><strong>Please copy paste it somewhere safe now.</strong></p>
        </div>
      </div>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { LayoutDialog } from '@speckle/ui-components'
import { ExclamationTriangleIcon } from '@heroicons/vue/24/outline'

const props = defineProps<{
  token: string
}>()

const isOpen = defineModel<boolean>('open', { required: true })

const dialogButtons = computed(() => [
  {
    text: 'Close',
    props: { color: 'primary', fullWidth: true },
    onClick: () => (isOpen.value = false)
  }
])
</script>
