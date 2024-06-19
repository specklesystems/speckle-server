<template>
  <div>
    <div
      class="absolute z-50 top-0 md:left-0 md:relative h-full flex flex-col justify-between w-64 sm:w-80 bg-foundation border-r border-outline-3 overflow-x-visible p-4 transition-all duration-200 shadow-md md:shadow-none"
      :class="isOpen ? 'left-0' : '-left-64 '"
    >
      <button
        class="md:hidden absolute top-4 -right-12 bg-foundation p-2 rounded border border-outline-3 shadow"
        @click="isOpen = !isOpen"
      >
        <Bars3Icon v-if="!isOpen" class="h-4 w-4" />
        <XMarkIcon v-else class="h-4 w-4" />
      </button>
      <SidebarMenu />
      <div class="flex flex-col gap-5">
        <SidebarCallout />
        <SidebarLowerMenu />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Bars3Icon, XMarkIcon } from '@heroicons/vue/24/solid'

const isOpen = ref(false)
</script>
