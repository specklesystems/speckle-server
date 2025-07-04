import type { PreviewResultPayload } from '@speckle/shared/workers/previews'
import type { Logger } from 'pino'

export const sendResult = async ({
  jobId,
  responseUrl,
  token,
  result,
  logger
}: {
  jobId: string
  responseUrl: string
  token: string
  result: PreviewResultPayload
  logger: Logger
}) => {
  const response = await fetch(responseUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },

    body: JSON.stringify(result)
  })
  if (!response.ok) {
    const text = await response.text()
    logger.error(
      { cause: text, resultUrl: responseUrl },
      'Failed to report result for job {jobId} to {resultUrl}'
    )
    throw new Error(`Failed to report result for job ${jobId}: ${text}`)
  }
}
