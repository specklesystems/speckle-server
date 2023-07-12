<template>
  <OnboardingDialogBase v-model:open="openState">
    <template #header>Your First Model Upload ⬆️</template>
    <div
      class="w-full h-[351px] bg-primary rounded-xl flex items-center justify-center overflow-hidden"
    >
      <iframe
        width="560"
        height="315"
        src="https://www.youtube-nocookie.com/embed/SGnwuzieufw?rel=0&autoplay=1"
        title="YouTube video player"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        class="w-full h-full"
      ></iframe>
    </div>
    <div class="flex justify-center">
      <FormButton size="xl" class="shadow-md" @click="emit('done')">Got it!</FormButton>
    </div>
  </OnboardingDialogBase>
</template>
<script setup lang="ts">
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { CubeIcon } from '@heroicons/vue/24/solid'
const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'done'): void
}>()

const openState = computed({
  get: () => props.open,
  set: (newVal) => emit('update:open', newVal)
})
</script>
