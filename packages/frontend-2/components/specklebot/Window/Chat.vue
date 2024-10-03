<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div class="w-full">
    <label for="specklebot-input" class="sr-only">Ask SpeckleBot</label>
    <div class="flex justify-between items-center">
      <input
        id="specklebot-input"
        ref="specklebotInput"
        v-model="prompt"
        :readonly="loading"
        name="query"
        placeholder="Ask SpeckleBot..."
        class="w-full h-16 px-6 focus-visible:outline-0 text-body-sm"
        @keydown.esc="emit('close')"
        @keydown.enter="onSubmit"
      />
      <button
        class="bg-highlight-2 hover:bg-highlight-3 p-2 rounded text-body-3xs text-foregorund-2 mr-2 select-none"
        @click="emit('close')"
      >
        ESC
      </button>
    </div>

    <div v-if="loading || response.length" class="p-6">
      {{ response }}
    </div>
    <template v-else>
      <!-- Saved questions -->
      <div
        v-if="savedQuestions.length > 0"
        class="flex flex-col border-t border-outline-3 divide-y divide-outline-3 w-full"
      >
        <h6 class="p-6 pb-3 font-medium text-sm">Saved questions</h6>
        <SpecklebotWindowQuestion
          v-for="(question, index) in savedQuestions"
          :key="index"
          :question="question"
          @toggle-favorite="toggleFavorite"
        />
      </div>

      <!-- Suggested questions -->
      <div
        class="flex flex-col border-t border-outline-3 divide-y divide-outline-3 w-full"
      >
        <h6 class="p-6 pb-3 font-medium text-sm">Suggested questions</h6>
        <SpecklebotWindowQuestion
          v-for="(question, index) in suggestedQuestions"
          :key="index"
          :question="question"
          @toggle-favorite="toggleFavorite"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useOpenAIClient } from '~/lib/specklebot/composables/openai'
import type Question from './Question.vue'

const emit = defineEmits<{
  (e: 'close'): void
}>()

interface Question {
  text: string
  favorite: boolean
}

const { askPrompt } = useOpenAIClient()

const savedQuestions = ref<Question[]>([])

const suggestedQuestions = ref<Question[]>([
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
const prompt = ref('')
const loading = ref(false)
const response = ref('')

const toggleFavorite = (question: Question) => {
  question.favorite = !question.favorite
  if (question.favorite) {
    savedQuestions.value.push(question)
    suggestedQuestions.value = suggestedQuestions.value.filter((q) => q !== question)
  } else {
    savedQuestions.value = savedQuestions.value.filter((q) => q !== question)
    suggestedQuestions.value.push(question)
  }
}

const onSubmit = async () => {
  const finalPrompt = prompt.value.trim()
  if (!finalPrompt.length) return

  prompt.value = ''
  loading.value = true

  for await (const message of askPrompt({ prompt: finalPrompt })) {
    response.value += message || ''
  }

  loading.value = false
}

onMounted(() => {
  nextTick(() => {
    specklebotInput.value?.focus()
  })
})
</script>
