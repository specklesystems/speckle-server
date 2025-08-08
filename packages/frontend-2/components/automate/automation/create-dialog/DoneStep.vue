<template>
  <div class="flex flex-col gap-6">
    <div class="flex items-center justify-center gap-0.5">
      <CircleCheck
        :size="LucideSize.base"
        :stroke-width="1.5"
        :absolute-stroke-width="true"
        class="text-success"
      />
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
import { CircleCheck } from 'lucide-vue-next'
defineProps<{
  automationId: string
  functionName: string
}>()
</script>
