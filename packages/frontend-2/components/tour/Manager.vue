<template>
  <div
    class="max-w-4xl w-screen h-screen flex flex-col space-y-2 items-center justify-center"
  >
    <!-- eslint-disable-next-line vuejs-accessibility/mouse-events-have-key-events -->
    <div
      class="bg-blue-500/50 border-4 border-primary-muted text-foreground-on-primary backdrop-blur shadow-lg rounded-xl p-4 space-y-4 pointer-events-auto w-full"
      @mouseenter="rotateGently(Math.random() * 2)"
      @mouseleave="rotateGently(Math.random() * 2)"
    >
      <h2 class="text-center text-2xl font-bold">Ready to send your first model?</h2>
      <!-- <p class="text-center">MANAGER TIME</p> -->
      <div class="w-full h-72 bg-primary rounded-xl flex items-center justify-center">
        <PlayIcon class="w-10 h-10 text-white" />
      </div>
      <div class="flex justify-center">
        <FormButton size="xl" class="shadow-md" :cccicon-right="CloudArrowDownIcon">
          Download Now
        </FormButton>
      </div>
    </div>
    <div class="pointer-events-auto pt-2">
      <FormButton size="sm" color="card" @click="$emit('next')">
        Let me explore first
      </FormButton>
    </div>
  </div>
</template>
<script setup lang="ts">
import { CloudArrowDownIcon, PlayIcon } from '@heroicons/vue/24/solid'
import { useInjectedViewer } from '~~/lib/viewer/composables/setup'
const { instance: viewer } = useInjectedViewer()

defineEmits(['next'])

let flip = 1
const rotateGently = (factor = 1) => {
  viewer.setView({ azimuth: (Math.PI / 12) * flip * factor, polar: 0 }, true)
  viewer.cameraHandler.controls.truck(factor * flip, factor * flip, true)
  flip *= -1
}
</script>
