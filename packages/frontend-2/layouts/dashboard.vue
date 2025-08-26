<template>
  <div>
    <HeaderNavBar>
      <template #secondary-actions>
        <FormButton
          v-tippy="'Toggle fullscreen'"
          size="sm"
          color="outline"
          :icon-right="Fullscreen"
          hide-text
          @click="toggleFullScreen()"
        >
          Fullscreen
        </FormButton>
      </template>
    </HeaderNavBar>
    <div class="h-dvh w-dvh overflow-hidden flex flex-col">
      <!-- Static Spacer to allow for absolutely positioned HeaderNavBar  -->
      <div class="h-12 w-full shrink-0"></div>

      <div class="relative flex h-[calc(100dvh-3rem)]">
        <main class="w-full h-full overflow-y-auto simple-scrollbar">
          <div class="container w-full">
            <slot />
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Fullscreen } from 'lucide-vue-next'

const logger = useLogger()

const toggleFullScreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch((err) => {
      logger.warn(`Error attempting to enable fullscreen: ${err.message}`)
    })
  } else {
    document.exitFullscreen().catch((err) => {
      logger.warn(`Error attempting to exit fullscreen: ${err.message}`)
    })
  }
}
</script>
