<template>
  <nav
    v-if="!hasNoModelCards"
    class="fixed top-0 h-10 bg-foundation max-w-full w-full shadow hover:shadow-md transition z-20"
  >
    <div class="px-2">
      <div class="flex items-center h-10 transition-all justify-between">
        <div class="flex items-center">
          <HeaderLogoBlock :active="false" minimal class="mr-0" />
          <div class="flex flex-shrink-0 items-center -ml-2 md:ml-0">
            <PortalTarget name="navigation"></PortalTarget>
          </div>
        </div>
        <div class="flex justify-between items-center">
          <!-- ONLY FOR TESTS FOR NOW-->
          <div v-if="testSettings && hasConfigBindings" class="flex justify-end">
            <FormButton
              v-tippy="'Settings'"
              class="px-1"
              text
              hide-text
              :icon-left="Cog6ToothIcon"
              @click="openConfigDialog = true"
            ></FormButton>
            <LayoutDialog v-model:open="openConfigDialog">
              <ConfigDialog @close="openConfigDialog = false" />
            </LayoutDialog>
          </div>
          <div>
            <HeaderUserMenu />
          </div>
        </div>
      </div>
    </div>
  </nav>
  <div v-else class="fixed top-1 right-2 z-100 flex items-center space-x-2">
    <FormButton
      v-tippy="isDarkTheme ? 'Switch to light theme' : 'Switch to dark theme'"
      size="xs"
      text
      @click="uiConfigStore.toggleTheme()"
    >
      <Component :is="isDarkTheme ? SunIcon : MoonIcon" class="w-4" />
    </FormButton>
    <div v-if="isDev">
      <NuxtLink
        v-tippy="'Test page'"
        to="test"
        class="text-xs text-foreground-2 hover:text-primary"
        exact-active-class="hidden"
      >
        <WrenchScrewdriverIcon class="w-4" />
      </NuxtLink>
      <NuxtLink
        v-tippy="'Home'"
        to="/"
        class="text-xs text-foreground-2 hover:text-primary"
        exact-active-class="hidden"
      >
        <HomeIcon class="w-4" />
      </NuxtLink>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useConfigStore } from '~/store/config'
import {
  Cog6ToothIcon,
  WrenchScrewdriverIcon,
  HomeIcon,
  MoonIcon,
  SunIcon
} from '@heroicons/vue/24/solid'
import { useHostAppStore } from '~/store/hostApp'
const isDev = ref(process.dev)
const openConfigDialog = ref(false)
// NOTE: make it true to test settings, it might be removed later. TBD
const testSettings = ref(false)

const uiConfigStore = useConfigStore()
const { isDarkTheme, hasConfigBindings } = storeToRefs(uiConfigStore)

const hostAppStore = useHostAppStore()
const hasNoModelCards = computed(() => hostAppStore.projectModelGroups.length === 0)
</script>
