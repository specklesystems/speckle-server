<template>
  <LayoutDialog v-model:open="isOpen" max-width="xs" :buttons="dialogButtons">
    <template #header>Reveal application secret</template>
    <div class="flex gap-4 py-2 text-body-xs">
      <div class="text-center sm:text-right w-28">App Name:</div>
      <p class="truncate text-center sm:text-left">{{ props.application?.name }}</p>
    </div>
    <div class="flex gap-4 py-2 text-body-xs">
      <div
        class="text-center sm:text-right flex items-center justify-center sm:justify-end w-28"
      >
        App secret:
      </div>
      <div class="w-44 mx-auto sm:ml-0">
        <CommonClipboardInputWithToast
          v-if="props.application?.secret"
          class="scale-90"
          :value="props.application?.secret"
        />
      </div>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { LayoutDialog, type LayoutDialogButton } from '@speckle/ui-components'
import type { ApplicationItem } from '~~/lib/developer-settings/helpers/types'

const props = defineProps<{
  application: ApplicationItem | null
}>()

const isOpen = defineModel<boolean>('open', { required: true })

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Close',
    props: { color: 'outline' },
    onClick: () => {
      isOpen.value = false
    }
  }
])
</script>
