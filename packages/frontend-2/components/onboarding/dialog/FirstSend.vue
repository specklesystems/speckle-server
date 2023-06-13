<template>
  <OnboardingDialogBase>
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
const emit = defineEmits(['done', 'close', 'cancel'])
</script>
