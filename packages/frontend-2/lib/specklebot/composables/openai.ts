/* eslint-disable camelcase */
import OpenAI from 'openai'
import { askAboutLoadedDataSystem } from '~/lib/specklebot/constants/system'
import { EventIterator } from 'event-iterator'

const model = 'gpt-3.5-turbo'

export const useOpenAIClient = () => {
  const {
    public: { openaiKey, openaiAssistantId }
  } = useRuntimeConfig()

  const client = new OpenAI({ apiKey: openaiKey, dangerouslyAllowBrowser: true })

  async function* askPrompt(params: {
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]
  }) {
    const { messages } = params

    const completion = await client.chat.completions.create({
      model,
      messages,
      stream: true
    })

    for await (const chunk of completion) {
      yield chunk.choices[0].delta.content
    }
  }

  async function createThread() {
    return await client.beta.threads.create()
  }

  async function addMessageToThread(params: {
    thread: OpenAI.Beta.Threads.Thread
    message: OpenAI.Beta.Threads.MessageCreateParams
  }) {
    const { thread, message } = params
    return await client.beta.threads.messages.create(thread.id, message)
  }

  async function uploadJson(params: { json: Record<string, unknown> }) {
    return await client.files.create({
      file: new File([JSON.stringify(params.json)], 'data.json'),
      purpose: 'assistants'
    })
  }

  function runAssistant(params: { thread: OpenAI.Beta.Threads.Thread }) {
    const { thread } = params
    const run = client.beta.threads.runs.stream(thread.id, {
      assistant_id: openaiAssistantId
    })

    return new EventIterator<string>((queue) => {
      run.on('textDelta', (msg) => {
        const text = msg.value || ''
        queue.push(text)
      })
      run.on('end', () => {
        queue.stop()
      })

      return () => run.abort()
    })
  }

  return {
    askPrompt,
    createThread,
    addMessageToThread,
    runAssistant,
    uploadJson
  }
}

export enum HelpCategory {
  AskAboutLoadedData = 'ask_about_loaded_data',
  Test = 'test'
}

export const useSpeckleBot = () => {
  const openAi = useOpenAIClient()
  const loading = ref(false)

  const askAboutLoadedData = (params: { loadedData: Record<string, unknown> }) => {
    const { loadedData } = params

    let thread: OpenAI.Beta.Threads.Thread
    let isInitialized = false

    const ensure = async () => {
      if (isInitialized) return
      loading.value = true

      thread = await openAi.createThread()

      // Init context
      const loadedDataUpload = await openAi.uploadJson({ json: loadedData })

      await openAi.addMessageToThread({
        thread,
        message: {
          content: [
            ...askAboutLoadedDataSystem.map((text) => ({ type: <const>'text', text })),
            {
              type: 'text',
              text: "I've attached the loaded 3D data as a JSON attachment. I will likely refer to it as a file or model."
            }
          ],
          attachments: [
            {
              tools: [{ type: 'file_search' }],
              file_id: loadedDataUpload.id
            }
          ],
          role: 'user'
        }
      })

      loading.value = false
      isInitialized = true
    }

    const ask = async function* (params: { message: string }) {
      const { message } = params
      loading.value = true

      await openAi.addMessageToThread({
        thread,
        message: {
          content: [
            {
              type: 'text',
              text: message
            }
          ],
          role: 'user'
        }
      })

      const generator = openAi.runAssistant({ thread })
      for await (const messagePart of generator) {
        yield messagePart
      }

      loading.value = false
    }

    loading.value = false
    return { ask, ensure }
  }

  return {
    askAboutLoadedData,
    loading
  }
}
