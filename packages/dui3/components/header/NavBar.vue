<template>
  <nav
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
</template>
<script setup lang="ts">
import { useConfigStore } from '~/store/config'
import { Cog6ToothIcon } from '@heroicons/vue/24/outline'

const openConfigDialog = ref(false)

// NOTE: make it true to test settings, it might be removed later. TBD
const testSettings = ref(true)

const uiConfigStore = useConfigStore()
const { hasConfigBindings } = storeToRefs(uiConfigStore)
</script>
