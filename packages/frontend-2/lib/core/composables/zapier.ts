import { useServerInfo } from '~/lib/core/composables/server'

export function useZapier() {
  const { serverInfo } = useServerInfo()

  const sendWebhook = async (
    webhookUrl: string,
    data: Record<string, string | number>
  ) => {
    const isLatest = serverInfo.value?.canonicalUrl?.includes(
      'https://latest.speckle.systems/'
    )

    if (import.meta.dev || isLatest) return

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      mode: 'no-cors',
      body: JSON.stringify(data)
    })

    return response
  }

  return {
    sendWebhook
  }
}
