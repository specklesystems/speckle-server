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
      Your workspace has custom data residency set up. However, we currently do not
      support moving projects between data regions, so the projects you move in to the
      workspace will remain in their previous location.
    </template>
    <template v-else-if="variant === RegionStaticDataDisclaimerVariant.UploadModel">
      The workspace where the project resides has custom data residency set up. However,
      we currently do not support custom data residency for file uploads. As a result,
      the uploaded file will be stored in the default location.
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
