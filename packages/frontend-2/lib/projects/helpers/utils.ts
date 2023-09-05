import { WebhookItem } from '~~/lib/projects/helpers/types'
import { has } from 'lodash-es'

export const isWebhook = (val: WebhookItem): val is WebhookItem => {
  if (has(val, 'triggerEvents')) return true
  console.log(val)
  throw new Error('Unexpectedly item is not a webhook!')
}
