<template>
  <LayoutDialog
    v-model:open="isOpen"
    max-width="sm"
    :buttons="dialogButtons"
    prevent-close-on-click-outside
  >
    <template #header>Reveal Application Secret</template>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 py-2 text-sm">
      <div class="text-center sm:text-right font-bold sm:font-normal">App Name:</div>
      <p class="truncate text-center sm:text-left">{{ props.application?.name }}</p>
      <div
        class="text-center sm:text-right flex items-center justify-center sm:justify-end font-bold sm:font-normal"
      >
        App Secret:
      </div>
      <div class="w-44 mx-auto sm:ml-0">
        <CommonClipboardInputWithToast
          v-if="props.application?.secret"
          :value="props.application?.secret"
        />
      </div>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { LayoutDialog } from '@speckle/ui-components'
import type { ApplicationItem } from '~~/lib/developer-settings/helpers/types'

const props = defineProps<{
  application: ApplicationItem | null
}>()

const isOpen = defineModel<boolean>('open', { required: true })

const dialogButtons = computed(() => [
  {
    text: 'Close',
    props: { color: 'primary', fullWidth: true },
    onClick: () => {
      isOpen.value = false
    }
  }
])
</script>
