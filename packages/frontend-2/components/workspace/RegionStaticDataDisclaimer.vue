<template>
  <LayoutDialog
    v-model:open="open"
    max-width="xs"
    title="Data residency notice"
    :buttons="dialogButtons"
  >
    <template
      v-if="variant === RegionStaticDataDisclaimerVariant.MoveProjectIntoWorkspace"
    >
      The selected workspace has a custom data residency setup. However, we currently do
      not support moving projects between regions; therefore, the project data will
      remain in its previous location.
    </template>
    <template v-else-if="variant === RegionStaticDataDisclaimerVariant.UploadModel">
      The selected workspace has a custom data residency setup. However, we currently do
      not support custom data residency for file uploads; therefore, the uploaded file
      will be stored in the default location.
    </template>
  </LayoutDialog>
</template>
<script lang="ts" setup>
import type { LayoutDialogButton } from '@speckle/ui-components'
import { RegionStaticDataDisclaimerVariant } from '~/lib/workspaces/composables/region'

const emit = defineEmits<{
  cancel: []
  confirm: []
}>()

defineProps<{
  variant: RegionStaticDataDisclaimerVariant
}>()

const open = defineModel<boolean>('open', { required: true })

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Cancel',
    props: { color: 'outline' },
    onClick: () => {
      open.value = false
      emit('cancel')
    }
  },
  {
    text: 'I Understand',
    onClick: () => {
      open.value = false
      emit('confirm')
    }
  }
])
</script>
