export function useZapier() {
  const sendWebhook = async (webhookUrl: string, data: Record<string, string>) => {
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
