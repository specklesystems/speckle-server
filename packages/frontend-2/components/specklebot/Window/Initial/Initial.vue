<template>
  <div class="w-full p-6 min-h-80">
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
        @click="handleCardClick(card)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  (e: 'cardClicked', cardTitle: string): void
}>()

const cards = [
  {
    title: 'Model Insights',
    description:
      'Explore and ask questions about your data, unlocking valuable information and trends.'
  },
  {
    title: 'Data Analysis',
    description:
      'Get detailed analysis of your project data, including statistics and visualizations.'
  },
  {
    title: 'Search Assistant',
    description:
      'Find specific information or elements within your projects quickly and easily.'
  },
  {
    title: 'Collaboration Helper',
    description:
      'Get assistance with team coordination, task management, and communication.'
  }
]

const handleCardClick = (card: (typeof cards)[number]) => {
  emit('cardClicked', card.title)
}
</script>
