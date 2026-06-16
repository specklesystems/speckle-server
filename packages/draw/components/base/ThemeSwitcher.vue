<template>
  <div>
    <FormButton
      size="sm"
      :icon-left="colorMode.preference === 'light' ? Moon : Sun"
      hide-text
      color="outline"
      @click="swapTheme"
    >
      click
    </FormButton>
  </div>
</template>

<script setup lang="ts">
import { Sun, Moon } from 'lucide-vue-next'
import { useColorMode } from '@vueuse/core'
const colorMode = useColorMode()
const swapTheme = () => {
  if (colorMode.preference === 'light') {
    colorMode.preference = 'dark'
  } else {
    colorMode.preference = 'light'
  }
}
</script>
