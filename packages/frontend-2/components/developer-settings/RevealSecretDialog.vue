<template>
  <LayoutDialog
    v-model:open="isOpen"
    max-width="sm"
    title="Reveal Application Secret"
    :buttons="dialogButtons"
    prevent-close-on-click-outside
    max-height
  >
    <div class="grid grid-cols-2 gap-x-6 gap-y-3 py-2 text-sm">
      <div class="text-right">App Name:</div>
      <p class="truncate">{{ props.application?.name }}</p>
      <div class="text-right flex items-center justify-end">App Secret:</div>
      <div class="w-40">
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
import { ApplicationItem } from '~~/lib/developer-settings/helpers/types'

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
