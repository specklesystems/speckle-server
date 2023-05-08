<template>
  <OnboardingDialogBase @close="emit('close')" @cancel="emit('cancel')">
    <template #header>How to do a first model upload</template>
    <div class="w-full h-72 bg-primary rounded-xl flex items-center justify-center">
      <PlayIcon class="w-10 h-10 text-white" />
      <span class="text-xs">How to do a first model upload</span>
    </div>
    <div class="flex justify-center">
      <FormButton size="xl" class="shadow-md" @click="emit('done')">Got it!</FormButton>
    </div>
  </OnboardingDialogBase>
</template>
<script setup lang="ts">
import { PlayIcon } from '@heroicons/vue/24/solid'

const emit = defineEmits(['done', 'close', 'cancel'])
</script>
