import { WebhookItem } from '~~/lib/projects/helpers/types'
import { has } from 'lodash-es'
import { ItemType } from '@speckle/ui-components/dist/components/layout/Table.vue'

export const isWebhook = (val: ItemType<WebhookItem>): val is WebhookItem => {
  if (has(val, 'triggerEvents')) return true
  console.log(val)
  throw new Error('Unexpectedly item is not a webhook!')
}
