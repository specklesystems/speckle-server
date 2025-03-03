import { isInteger } from 'lodash-es'

export const formatPrice = (price?: { amount: number; currencySymbol: string }) => {
  if (!price) return ''
  return `${price.currencySymbol}${
    isInteger(price.amount) ? price.amount : price.amount.toFixed(2)
  }`
}
