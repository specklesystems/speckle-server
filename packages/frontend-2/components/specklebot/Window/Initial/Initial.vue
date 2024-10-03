<template>
  <div class="w-full p-6 pt-0 min-h-80">
    <div class="flex gap-3 items-center -mt-1">
      <img src="~/assets/images/specklebot.png" alt="Specklebot" class="w-10 h-10" />
      <h4 class="text-heading text-foreground mt-1.5">What can I help you with?</h4>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 p-2 mt-4">
      <SpecklebotWindowInitialCard
        v-for="(card, index) in cards"
        :key="index"
        :title="card.title"
        :description="card.description"
        @click="card.onClick"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  (e: 'chatClicked'): void
  (e: 'complianceClicked'): void
  (e: 'visualClicked'): void
  (e: 'versionClicked'): void
}>()

const cards = [
  {
    title: 'Model Insights',
    description:
      'Explore and ask questions about your data, unlocking valuable information and trends.',
    onClick: () => emit('chatClicked')
  },
  {
    title: 'Version Analysis',
    description:
      'Track changes in your project over time, identifying who made modifications and when they occurred.',
    onClick: () => emit('versionClicked')
  },
  {
    title: 'Visual Interpreter',
    description:
      'Analyze images of your models, allowing SpeckleBot to provide insights based on visual inspection.',
    onClick: () => emit('visualClicked')
  },
  {
    title: 'Compliance Inspector',
    description:
      'Upload local building specifications and check your file for compliance with regulatory standards.',
    onClick: () => emit('complianceClicked')
  }
]
</script>
