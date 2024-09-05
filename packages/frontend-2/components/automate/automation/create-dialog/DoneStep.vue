<template>
  <div class="flex flex-col gap-6">
    <div class="flex items-center justify-center gap-0.5">
      <CheckCircleIcon class="h-9 w-9 text-success" />
      <span class="text-heading-sm">Success</span>
    </div>
    <div class="label-light text-center">
      Your automation using
      <strong>"{{ functionName }}"</strong>
      has been created
    </div>
  </div>
</template>
<script setup lang="ts">
import { CheckCircleIcon } from '@heroicons/vue/24/solid'

defineProps<{
  automationId: string
  functionName: string
}>()
</script>
