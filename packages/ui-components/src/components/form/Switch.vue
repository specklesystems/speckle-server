<template>
  <div class="flex items-center">
    <HeadlessSwitch
      v-model="enabled"
      class="relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
      :class="{ 'bg-primary': enabled, 'bg-primary-muted': !enabled }"
    >
      <div class="absolute inset-0 flex items-center gap-2 px-1 text-white">
        <CheckIcon
          class="h-5 w-5 drop-shadow-md"
          :class="icons ? 'opacity-100' : 'opacity-0'"
        />
        <XMarkIcon
          class="h-5 w-5 drop-shadow-md"
          :class="icons ? 'opacity-100' : 'opacity-0'"
        />
      </div>
      <span
        class="scale-95 pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200"
        :class="{ 'translate-x-5': enabled, 'translate-x-0': !enabled }"
      ></span>
    </HeadlessSwitch>
  </div>
</template>

<script setup lang="ts">
import { Switch as HeadlessSwitch } from '@headlessui/vue'
import { CheckIcon, XMarkIcon } from '@heroicons/vue/24/solid'

defineProps<{
  icons?: boolean
}>()

const enabled = defineModel<boolean>()
</script>
