<template>
  <div
    class="flex flex-col items-center justify-center h-[calc(100vh-16rem)] px-4 space-y-2"
  >
    <FormButton :icon-left="CloudArrowUpIcon" size="lg" to="/onboarding/send">
      Send
    </FormButton>
    <FormButton :icon-left="CloudArrowDownIcon" size="lg" to="/onboarding/receive">
      Receive
    </FormButton>
  </div>
</template>
<script setup lang="ts">
import { CloudArrowUpIcon, CloudArrowDownIcon } from '@heroicons/vue/20/solid'
</script>
