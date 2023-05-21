<template>
  <main
    class="h-screen w-screen flex items-center justify-center overflow-y-auto overflow-x-hidden"
  >
    <div class="absolute inset-0 pointer-events-none p-4 text-right">
      <FormButton size="xs" text class="pointer-events-auto" @click="onThemeClick">
        <Icon class="w-4 h-4" />
      </FormButton>
    </div>
    <div class="relative mt-4 mx-2">
      <slot />
    </div>
  </main>
</template>
<script setup lang="ts">
import { SunIcon, MoonIcon } from '@heroicons/vue/24/solid'
import { useTheme, AppTheme } from '~~/lib/core/composables/theme'

const { isDarkTheme, setTheme } = useTheme()
const Icon = computed(() => (isDarkTheme.value ? SunIcon : MoonIcon))
const onThemeClick = () => {
  if (isDarkTheme.value) {
    setTheme(AppTheme.Light)
  } else {
    setTheme(AppTheme.Dark)
  }
}
</script>
