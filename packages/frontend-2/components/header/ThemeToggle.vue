<template>
  <button
    type="button"
    class="rounded-full bg-background p-1 text-foreground-3 hover:text-foreground-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
    @click="onClick"
  >
    <span class="sr-only">Toggle dark mode</span>
    <Icon class="h-6 w-6" aria-hidden="true" />
  </button>
</template>
<script setup lang="ts">
import { SunIcon, MoonIcon } from '@heroicons/vue/24/solid'
import { useTheme, AppTheme } from '~~/lib/core/composables/theme'

const { isDarkTheme, setTheme } = useTheme()
const Icon = computed(() => (isDarkTheme.value ? SunIcon : MoonIcon))

const onClick = () => {
  if (isDarkTheme.value) {
    setTheme(AppTheme.Light)
  } else {
    setTheme(AppTheme.Dark)
  }
}
</script>
