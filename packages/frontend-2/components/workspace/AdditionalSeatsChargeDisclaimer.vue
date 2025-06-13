<template>
  <LayoutDialog
    v-model:open="open"
    title="Confirm additional seats"
    max-width="sm"
    :buttons="dialogButtons"
  >
    You're inviting
    {{
      editorCount + (editorCount === 1 ? ' person as an Editor' : ' people as Editors')
    }}. You'll be charged {{ editorSeatPriceWithIntervalFormatted }} for
    {{ editorCount === 1 ? ' the' : ' each' }}
    Editor seat when they accept. We'll use any unused Editor seats from your plan
    first.
  </LayoutDialog>
</template>
<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'
import { useWorkspacePlan } from '~/lib/workspaces/composables/plan'

const emit = defineEmits<{
  cancel: []
  confirm: []
}>()

const props = defineProps<{
  workspaceSlug: string
  editorCount: number
}>()

const open = defineModel<boolean>('open', {
  required: true
})

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Cancel',
    props: { color: 'outline' },
    onClick: () => {
      emit('cancel')
      open.value = false
    }
  },
  {
    text: 'Confirm',
    onClick: () => {
      emit('confirm')
      open.value = false
    }
  }
])

const { editorSeatPriceWithIntervalFormatted } = useWorkspacePlan(
  computed(() => props.workspaceSlug)
)
</script>
