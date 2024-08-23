<template>
  <main class="flex items-center justify-center">
    <div class="absolute inset-0 pointer-events-none p-4 text-right">
      <FormButton size="sm" text class="pointer-events-auto" @click="toggleTheme">
        <Icon class="w-4 h-4" />
      </FormButton>
    </div>
    <div class="relative mt-24 mx-4 mb-8 w-full max-w-sm">
      <slot />
    </div>
  </main>
</template>
<script setup lang="ts">
import { SunIcon, MoonIcon } from '@heroicons/vue/24/solid'
import { useTheme } from '~~/lib/core/composables/theme'

const { isDarkTheme, toggleTheme } = useTheme()
const Icon = computed(() => (isDarkTheme.value ? SunIcon : MoonIcon))
</script>
