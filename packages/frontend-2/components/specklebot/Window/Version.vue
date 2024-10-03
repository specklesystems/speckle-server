<!-- eslint-disable vue/no-v-html -->
<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div class="w-full">
    <div
      v-if="chatHistory.length"
      ref="chatContainer"
      class="p-6 gap-y-4 max-h-96 overflow-y-auto simple-scrollbar flex flex-col-reverse"
    >
      <div class="flex flex-col gap-5">
        <SpecklebotWindowChatMessage
          v-for="(message, index) in chatHistory"
          :key="index"
          :is-user="message.isUser"
          :loading="!message.isUser && message.content.length === 0"
        >
          <template v-if="message.isHtml">
            <span :class="proseClasses" v-html="message.content" />
          </template>
          <template v-else>
            {{ message.content }}
          </template>
        </SpecklebotWindowChatMessage>
      </div>
    </div>
    <template v-else>
      <div class="p-6 pt-3 min-h-80 flex flex-col justify-between">
        <div class="flex gap-3 items-center -mt-1">
          <img
            src="~/assets/images/specklebot.png"
            alt="Specklebot"
            class="w-10 h-10"
          />
          <p class="text-heading">Let's explore your project's evolution</p>
        </div>
        <div>
          <h6 class="text-body-xs font-medium text-foreground-2 mb-1 opacity-80">
            Suggested questions
          </h6>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <SpecklebotWindowInitialCard
              v-for="(card, index) in cards"
              :key="index"
              :description="card.description"
              @click="askQuestion(card.description)"
            />
          </div>
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
        placeholder="Ask SpeckleBot..."
        class="w-full h-16 px-6 focus-visible:outline-0 text-body-sm bg-foundation"
        @keydown.enter="onSubmit"
      />
      <button
        class="bg-foundation-2 hover:bg-highlight-3 p-2 rounded text-body-3xs text-foregorund-2 mr-4 select-none"
        @click="onSubmit"
      >
        <ArrowRightIcon class="h-4 w-4" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSpeckleBot } from '~/lib/specklebot/composables/openai'
import { ArrowRightIcon } from '@heroicons/vue/20/solid'
import { useGetLoadedData } from '~/lib/specklebot/composables/viewer'
import { proseClasses } from '~/lib/common/composables/markdown'

const { askAboutLoadedData, loading } = useSpeckleBot()
const { getLoadedData } = useGetLoadedData()

interface ChatMessage {
  content: string
  isUser: boolean
  isHtml?: boolean
}

const specklebotInput = ref<HTMLInputElement | null>(null)
const prompt = ref('')
const chatHistory = ref<ChatMessage[]>([])

const cards = [
  {
    description: 'Who made the most recent changes to the structural elements?'
  },
  {
    description: "When was the last modification to the building's facade made?"
  },
  {
    description: 'Show the main differences between the current version & the original.'
  }
]

const askQuestion = async (question: string) => {
  await ensure()

  if (loading.value) return
  chatHistory.value.push({ content: question, isUser: true })
  const generator = ask({ message: question })

  const responseMsg: ChatMessage = { content: '', isUser: false, isHtml: true }
  chatHistory.value.push(responseMsg)
  for await (const messageHtml of generator) {
    responseMsg.content = messageHtml
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

const { ask, ensure } = askAboutLoadedData({ getLoadedData })
ensure()

const chatContainer = ref<HTMLElement | null>(null)

const scrollToBottom = () => {
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}

watch(
  () => chatHistory.value,
  () => {
    nextTick(() => {
      scrollToBottom()
    })
  },
  { deep: true }
)
</script>
