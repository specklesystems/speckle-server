<template>
  <div>
    <SpecklebotWindow v-if="open" @close="hideInput" />
  </div>
</template>

<script setup lang="ts">
import { ModifierKeys, onKeyboardShortcut } from '@speckle/ui-components'
import { onKeyStroke } from '@vueuse/core'

const open = defineModel<boolean>('open', { required: true })

const showInput = () => {
  open.value = true
}

const hideInput = () => {
  open.value = false
}

const toggleInput = () => {
  if (open.value) {
    hideInput()
  } else {
    showInput()
  }
}

const handleShortcut = () => {
  toggleInput()
}

onKeyboardShortcut([ModifierKeys.CtrlOrCmd], 'k', handleShortcut)
onKeyboardShortcut([ModifierKeys.AltOrOpt], 'k', handleShortcut)

onKeyStroke('Escape', () => {
  hideInput()
})
</script>
