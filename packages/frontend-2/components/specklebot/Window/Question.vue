<template>
  <div
    class="group flex items-center justify-between w-full hover:bg-highlight-1 text-sm"
  >
    <button
      class="flex flex-1 justify-start py-4 px-6 text-foreground"
      @click="$emit('ask', question.text)"
    >
      {{ question.text }}
    </button>
    <button
      class="text-foreground-2 hover:text-foreground focus:outline-none pr-6"
      @click="$emit('toggleFavorite', question)"
    >
      <component
        :is="question.favorite ? StarIconSolid : StarIconOutline"
        class="w-5 h-5"
      />
    </button>
  </div>
</template>

<script setup lang="ts">
import { StarIcon as StarIconOutline } from '@heroicons/vue/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/vue/24/solid'

interface Question {
  text: string
  favorite: boolean
}

defineProps<{
  question: Question
}>()

defineEmits<{
  (e: 'ask', text: string): void
  (e: 'toggleFavorite', question: Question): void
}>()
</script>
