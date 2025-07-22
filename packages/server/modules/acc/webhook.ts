import { isDevEnv } from '@/modules/shared/helpers/envHelper'
import { logger } from '@/observability/logging'

const tailscaleUrl = 'https://oguzhans-macbook-pro.mermaid-emperor.ts.net' // TODO ACC for dev: Get your local url from tailscale and then we will got rid of

const accWebhookCallbackUrl = `${
  isDevEnv() ? tailscaleUrl : process.env.FRONTEND_HOST
}/acc/webhook/callback`

export async function tryRegisterAccWebhook({
  accessToken,
  rootProjectId,
  region,
  event
}: {
  accessToken: string
  rootProjectId: string
  region: string
  event: string
}) {
  const body = {
    callbackUrl: accWebhookCallbackUrl,
    scope: {
      folder: rootProjectId
    }
  }
  logger.info(body)
  logger.info(accessToken)
  const response = await fetch(
    `https://developer.api.autodesk.com/webhooks/v1/systems/data/events/${event}/hooks`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'x-ads-region': region
      },
      body: JSON.stringify(body)
    }
  )

  if (!response.ok) {
    const errJson = await response.json().catch(() => null)

    const isConflict =
      response.status === 409 &&
      errJson?.code === 'CONFLICT_ERROR' &&
      errJson?.detail?.includes('Failed to save duplicate webhooks scope')

    if (isConflict) {
      logger.warn('Webhook already exists. Skipping registration.')
      return null // Swallow and return
    }

    throw new Error(`Webhook registration failed: ${JSON.stringify(errJson, null, 2)}`)
  }

  const res = await response.json()
  console.log(res)

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return res
}
