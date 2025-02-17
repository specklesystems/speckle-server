<template>
  <main class="flex items-center justify-center">
    <div class="absolute inset-0 pointer-events-none px-4 py-3">
      <div class="flex justify-between">
        <LogoBlock />
        <FormButton size="sm" text class="pointer-events-auto" @click="toggleTheme">
          <Icon class="w-4 h-4" />
        </FormButton>
      </div>
    </div>
    <div class="relative my-12 mx-4 w-full max-w-sm">
      <slot />
    </div>
  </main>
</template>
<script setup lang="ts">
import { SunIcon, MoonIcon } from '@heroicons/vue/24/solid'
import LogoBlock from '~/components/header/LogoBlock.vue'
import { useTheme } from '~~/lib/core/composables/theme'

const { isDarkTheme, toggleTheme } = useTheme()
const Icon = computed(() => (isDarkTheme.value ? SunIcon : MoonIcon))
</script>
