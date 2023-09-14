import { WebhookItem } from '~~/lib/projects/helpers/types'
import { has } from 'lodash-es'
import { TableItemType } from '@speckle/ui-components'

export const isWebhook = (
  val: TableItemType<WebhookItem>
): val is TableItemType<WebhookItem> => {
  if (has(val, 'triggers')) return true
  throw new Error('Unexpectedly item is not a webhook!')
}
