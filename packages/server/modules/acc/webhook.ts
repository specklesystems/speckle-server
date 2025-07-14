import { isDevEnv } from '@/modules/shared/helpers/envHelper'

const tailscaleUrl = 'https://oguzhans-macbook-pro.mermaid-emperor.ts.net' // TODO ACC for dev: Get your local url from tailscale and then we will got rid of

const accWebhookCallbackUrl = `${
  isDevEnv() ? tailscaleUrl : process.env.FRONTEND_HOST
}/acc/webhook/callback`

export async function registerAccWebhook({
  accessToken,
  rootProjectId: hubUrn,
  region,
  event
}: {
  accessToken: string
  rootProjectId: string
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
        callbackUrl: `${accWebhookCallbackUrl}/${event}`,
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
