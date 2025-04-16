import { WorkspacePlans } from '@speckle/shared'

export const formatPrice = (price?: { amount: number; currency: string }) => {
  if (!price) return ''

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: price.currency,
    maximumFractionDigits: 0,
    minimumFractionDigits: 0
  })
  return formatter.format(price.amount)
}

// Internal plan names dont match the names we use in the product
export const formatName = (plan?: WorkspacePlans) => {
  if (!plan) return ''

  const formattedPlanNames: Record<WorkspacePlans, string> = {
    [WorkspacePlans.Unlimited]: 'Unlimited',
    [WorkspacePlans.Academia]: 'Academia',
    [WorkspacePlans.StarterInvoiced]: 'Starter',
    [WorkspacePlans.PlusInvoiced]: 'Plus (Invoiced)',
    [WorkspacePlans.BusinessInvoiced]: 'Business (Invoiced)',
    [WorkspacePlans.Starter]: 'Starter',
    [WorkspacePlans.Plus]: 'Plus',
    [WorkspacePlans.Business]: 'Business',
    [WorkspacePlans.Free]: 'Free',
    [WorkspacePlans.Team]: 'Starter',
    [WorkspacePlans.TeamUnlimited]: 'Starter',
    [WorkspacePlans.TeamUnlimitedInvoiced]: 'Starter (Invoiced)',
    [WorkspacePlans.Pro]: 'Business',
    [WorkspacePlans.ProUnlimited]: 'Business',
    [WorkspacePlans.ProUnlimitedInvoiced]: 'Business (Invoiced)'
  }
  return formattedPlanNames[plan]
}
