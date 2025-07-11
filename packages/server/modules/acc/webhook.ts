const accWebhookCallbackUrl =
  'https://oguzhans-macbook-pro.mermaid-emperor.ts.net//acc/webhook/callback'

export async function registerAccWebhook({
  accessToken,
  hubUrn,
  region,
  event = 'dm.lineage.updated'
}: {
  accessToken: string
  hubUrn: string
  region: string
  event: string
}) {
  const response = await fetch(
    `https://developer.api.autodesk.com/webhooks/v1/systems/data/events/${event}/hooks`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'x-ads-region': `${region}`
      },
      body: JSON.stringify({
        callbackUrl: accWebhookCallbackUrl,
        scope: {
          folder: {
            hubUrn
          }
        }
      })
    }
  )

  if (!response.ok) {
    throw new Error(`Webhook registration failed: ${await response.text()}`)
  }

  const res = await response.json()
  console.log(res)

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return res
}
