<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div class="w-full">
    <div v-if="loading" class="p-6">Loading...</div>
    <div
      v-if="chatHistory.length"
      class="p-6 gap-y-4 max-h-96 overflow-y-auto simple-scrollbar"
    >
      <SpecklebotWindowChatMessage
        v-for="(message, index) in chatHistory"
        :key="index"
        :is-user="message.isUser"
      >
        {{ message.content }}
      </SpecklebotWindowChatMessage>
    </div>
    <template v-else>
      <div class="p-6 min-h-80 flex flex-col justify-between">
        <div class="flex gap-3 items-center -mt-1">
          <img
            src="~/assets/images/specklebot.png"
            alt="Specklebot"
            class="w-10 h-10"
          />
          <p class="text-heading">Ask me anything about your model data</p>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <SpecklebotWindowInitialCard
            v-for="(card, index) in cards"
            :key="index"
            :description="card.description"
            @click="askQuestion(card.description)"
          />
        </div>
      </div>
    </template>
    <div
      class="flex justify-between items-center bg-foundation border-t border-outline-3"
    >
      <label for="specklebot-input" class="sr-only">Ask SpeckleBot</label>
      <input
        id="specklebot-input"
        ref="specklebotInput"
        v-model="prompt"
        :disabled="loading"
        name="query"
        :placeholder="loading ? 'LOADING' : 'Ask SpeckleBot...'"
        class="w-full h-16 px-6 focus-visible:outline-0 text-body-sm bg-foundation"
        @keydown.esc="emit('close')"
        @keydown.enter="onSubmit"
      />
      <button
        class="bg-foundation-2 hover:bg-highlight-3 p-2 rounded text-body-3xs text-foregorund-2 mr-4 select-none"
        @click="emit('close')"
      >
        <ArrowRightIcon class="h-4 w-4" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSpeckleBot } from '~/lib/specklebot/composables/openai'
import { ArrowRightIcon } from '@heroicons/vue/20/solid'

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { askAboutLoadedData, loading } = useSpeckleBot()

interface ChatMessage {
  content: string
  isUser: boolean
}

const specklebotInput = ref<HTMLInputElement | null>(null)
const prompt = ref('')
const chatHistory = ref<ChatMessage[]>([])

const cards = [
  {
    description: 'What are the key components of my current model?'
  },
  {
    description: 'Can you provide a summary of the project data statistics?'
  },
  {
    description: 'Where can I find information about the latest project updates?'
  }
]

const askQuestion = async (question: string) => {
  await ensure()

  if (loading.value) return
  chatHistory.value.push({ content: question, isUser: true })
  const generator = ask({ message: question })

  const responseMsg: ChatMessage = { content: '', isUser: false }
  chatHistory.value.push(responseMsg)
  for await (const msg of generator) {
    responseMsg.content += msg || ''
    chatHistory.value = [...chatHistory.value]
  }
}

const onSubmit = () => {
  const finalPrompt = prompt.value.trim()
  if (!finalPrompt.length) return

  askQuestion(finalPrompt)
  prompt.value = ''
}

onMounted(() => {
  nextTick(() => {
    specklebotInput.value?.focus()
  })
})

const { ask, ensure } = askAboutLoadedData({ loadedData: { a: 1, b: 2, c: 3 } })
ensure()
</script>
