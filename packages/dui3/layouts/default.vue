<template>
  <div class="relative min-h-screen flex flex-col">
    <HeaderNavBar />
    <main class="flex-1 px-1 max-[275px]:px-0" :class="hasNoModelCards ? '' : 'mt-10'">
      <slot />
    </main>
    <div
      v-if="hasNoModelCards"
      class="px-3 text-body-3xs text-foreground-2 justify-center bg-red-200/1 py-2 flex items-center w-full space-x-2"
    >
      <span>Version {{ hostApp.connectorVersion }}</span>
      <FormButton
        size="sm"
        text
        color="subtle"
        :icon-right="isDarkTheme ? SunIcon : MoonIcon"
        hide-text
        @click="toggleTheme()"
      >
        Toggle theme
      </FormButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useHostAppStore } from '~/store/hostApp'
import { useConfigStore } from '~/store/config'
import { MoonIcon, SunIcon } from '@heroicons/vue/24/outline'

const uiConfigStore = useConfigStore()
const { isDarkTheme } = storeToRefs(uiConfigStore)
const { toggleTheme } = uiConfigStore

const hostApp = useHostAppStore()
const hasNoModelCards = computed(() => hostApp.projectModelGroups.length === 0)
</script>
