<template>
  <button
    class="transition p-1 text-heading-sm rounded-md hover:bg-highlight-2 text-foreground-3 hover:text-foreground h-full"
    @click="toggleTheme"
  >
    <span class="sr-only">Toggle dark mode</span>
    <Icon class="h-4 w-4" aria-hidden="true" />
  </button>
</template>
<script setup lang="ts">
import { SunIcon, MoonIcon } from '@heroicons/vue/24/solid'
import { useLocalStorage } from '@vueuse/core'

const theme = useLocalStorage('dark-theme', { isDarkTheme: false })

const Icon = computed(() => (theme.value.isDarkTheme ? SunIcon : MoonIcon))

const toggleTheme = () => {
  theme.value.isDarkTheme = !theme.value.isDarkTheme
}
</script>
