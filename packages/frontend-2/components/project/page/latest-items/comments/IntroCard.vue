<template>
  <div
    :class="[
      'p-4',
      'flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:space-x-6 sm:items-center'
    ]"
  >
    <div class="w-42 h-42 group transition-[margin-right] mr-0 hover:mr-12">
      <template v-if="!isDarkTheme">
        <img
          src="~~/assets/images/discussions/d-w-1.png"
          class="opacity-80 w-36 h-auto shadow-md relative transition grayscale blur-none group-hover:blur-sm group-hover:grayscale-0 group-hover:-translate-x-10 group-hover:-translate-y-3 group-hover:scale-105"
          alt="discussions image"
        />
        <img
          src="~~/assets/images/discussions/d-w-2.png"
          class="w-36 shadow-md relative ml-10 -mt-20 transition grayscale group-hover:grayscale-0 group-hover:translate-x-5 group-hover:scale-150 group-hover:shadow-xl"
          alt="discussions image"
        />
      </template>
      <template v-else>
        <img
          src="~~/assets/images/discussions/d-d-1.png"
          class="opacity-80 w-36 h-auto shadow-md relative transition grayscale blur-none group-hover:blur-sm group-hover:grayscale-0 group-hover:-translate-x-10 group-hover:-translate-y-3 group-hover:scale-105"
          alt="discussions image"
        />
        <img
          src="~~/assets/images/discussions/d-d-2.png"
          class="w-36 shadow-md relative ml-10 -mt-20 transition grayscale group-hover:grayscale-0 group-hover:translate-x-5 group-hover:scale-150 group-hover:shadow-xl"
          alt="discussions image"
        />
      </template>
    </div>
    <div class="text-foreground">
      <div>Speckle allows for real time discussions straight in your 3D model.</div>
      <div class="text-xs text-foreground-2">
        Head over to a model and start coordinating right away!
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useTheme } from '~~/lib/core/composables/theme'
const { isDarkTheme } = useTheme()
</script>
