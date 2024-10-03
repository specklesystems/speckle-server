import OpenAI from 'openai'
import { testPromptSystem } from '~/lib/specklebot/constants/system'

export const useOpenAIClient = () => {
  const {
    public: { openaiKey }
  } = useRuntimeConfig()

  const client = new OpenAI({ apiKey: openaiKey, dangerouslyAllowBrowser: true })

  async function* askPrompt(params: { prompt: string }) {
    const { prompt } = params

    const completion = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        ...testPromptSystem.map((content) => ({ role: <const>'system', content })),
        { role: 'user', content: prompt }
      ],
      stream: true
    })

    for await (const chunk of completion) {
      yield chunk.choices[0].delta.content
    }
  }

  return {
    askPrompt
  }
}

export const useSpeckleBot = () => {
  const { askPrompt } = useOpenAIClient()

  const response = ref('')
  const loading = ref(false)

  const ask = async (params: { prompt: string }) => {
    const { prompt } = params

    response.value = ''
    loading.value = true
    try {
      const generator = askPrompt({ prompt })
      for await (const chunk of generator) {
        response.value += chunk || ''
      }
    } finally {
      loading.value = false
    }
  }

  return {
    ask,
    response,
    loading
  }
}
