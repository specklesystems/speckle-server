<template>
  <div class="hidden layout-container rounded-2xl md:flex justify-between items-center">
    <div class="flex py-5 space-x-2 items-center">
      <!-- <div class="text-sm text-foreground flex items-center">Quick Setup</div> -->
      <div class="text-sm text-foreground flex items-center">
        <span
          class="mt-[2px] w-4 h-4 bg-foundation rounded-full text-foreground-2 text-xs flex items-center justify-center font-bold mr-2"
        >
          1
        </span>
        <span>Install Connectors</span>
      </div>
      <ChevronRightIcon class="w-3 h-3 mt-[2px]" />
      <div
        class="transition text-sm flex space-x-2 items-center p-2 bg-foundation rounded-lg cursor-pointer hover:shadow-lg"
      >
        <!-- <CheckCircleIcon class="mr-2 w-4 h-4" /> -->
        <span class="text-primary font-bold">Link Account</span>
        <span class="text-xs text-foreground">
          Authorise your application connectors to send data to Speckle.
        </span>
      </div>
      <ChevronRightIcon class="w-3 h-3 mt-[2px]" />
      <div class="text-sm text-foreground-2 flex items-center">
        <!-- <CheckCircleIcon class="mr-2 w-4 h-4 mt-[2px]" /> -->
        Send Your First Model
      </div>
    </div>
    <div>
      <FormButton text size="sm">Dismiss Checklist</FormButton>
    </div>
  </div>
</template>
<script setup lang="ts">
import { CheckCircleIcon, ChevronRightIcon } from '@heroicons/vue/24/solid'
</script>
