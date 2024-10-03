<template>
  <div>
    <SpecklebotWindow v-show="isInputVisible" @close="hideInput" />
  </div>
</template>

<script setup lang="ts">
import { ModifierKeys, onKeyboardShortcut } from '@speckle/ui-components'
import { onKeyStroke } from '@vueuse/core'

const isInputVisible = ref(false)

const showInput = () => {
  isInputVisible.value = true
}

const hideInput = () => {
  isInputVisible.value = false
}

const toggleInput = () => {
  if (isInputVisible.value) {
    hideInput()
  } else {
    showInput()
  }
}

const shortcutModifiers: ModifierKeys[] = [ModifierKeys.CtrlOrCmd]
const shortcutKey = 'k'

const handleShortcut = () => {
  toggleInput()
}

onKeyboardShortcut(shortcutModifiers, shortcutKey, handleShortcut)

onKeyStroke('Escape', () => {
  hideInput()
})
</script>
