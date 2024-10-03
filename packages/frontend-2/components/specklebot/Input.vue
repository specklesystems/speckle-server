<template>
  <div class="absolute inset-0 h-dvh w-dvh">
    <div class="absolute inset-0 bg-foundation opacity-20 backdrop-blur" />
    <div class="absolute inset-0 z-10 flex items-center justify-center">
      <div
        class="max-w-2xl bg-foundation-3 w-full border border-outline-2 rounded-lg shadow-xl overflow-hidden"
      >
        <label for="specklebot-input" class="sr-only">Ask SpeckleBot</label>
        <input
          id="specklebot-input"
          ref="specklebotInput"
          name="query"
          placeholder="Ask SpeckleBot..."
          class="w-full h-16 px-6 focus-visible:outline-0 text-sm"
        />
        <div
          class="flex flex-col border-t border-outline-3 divide-y divide-outline-3 w-full"
        >
          <h6 class="p-6 pb-3 font-medium text-sm">Suggested questions</h6>
          <div
            v-for="(question, index) in suggestedQuestions"
            :key="index"
            class="group flex items-center justify-between w-full hover:bg-highlight-1 text-sm"
          >
            <button class="flex flex-1 justify-start py-4 px-6 text-foreground">
              {{ question.text }}
            </button>
            <button
              class="text-foreground-2 hover:text-foreground focus:outline-none pr-6"
              @click="toggleFavorite(index)"
            >
              <StarIconOutline v-if="!question.favorite" class="w-5 h-5" />
              <StarIconSolid v-else class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { StarIcon as StarIconOutline } from '@heroicons/vue/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/vue/24/solid'
import { ref, onMounted, nextTick } from 'vue'

const suggestedQuestions = ref([
  {
    text: 'What are the most recently updated projects in my workspaces?',
    favorite: false
  },
  {
    text: "Show me all models related to 'Urban Planning' across all projects.",
    favorite: false
  },
  {
    text: "Which projects am I collaborating on in the 'Design Team' workspace?",
    favorite: false
  },
  {
    text: "List all projects that haven't been updated in the last month.",
    favorite: false
  },
  {
    text: 'Who are the team members working on Project Alpha, and what are their roles?',
    favorite: false
  }
])

const specklebotInput = ref<HTMLInputElement | null>(null)

const toggleFavorite = (index: number) => {
  suggestedQuestions.value[index].favorite = !suggestedQuestions.value[index].favorite
}

onMounted(() => {
  nextTick(() => {
    specklebotInput.value?.focus()
  })
})
</script>
