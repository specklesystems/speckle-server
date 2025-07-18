import { useQuery } from '@vue/apollo-composable'
import { graphql } from '~/lib/common/generated/gql'
import type { CurrencyBasedPrices, Price } from '~/lib/common/generated/gql/graphql'
import { useActiveWorkspaceSlug } from '~/lib/user/composables/activeWorkspace'

graphql(`
  fragment PricesPrice on Price {
    amount
    currencySymbol
    currency
  }
`)

graphql(`
  fragment PricesWorkspacePlanPrice on WorkspacePlanPrice {
    monthly {
      ...PricesPrice
    }
    yearly {
      ...PricesPrice
    }
  }
`)

graphql(`
  fragment PricesWorkspacePaidPlanPrices on WorkspacePaidPlanPrices {
    team {
      ...PricesWorkspacePlanPrice
    }
    teamUnlimited {
      ...PricesWorkspacePlanPrice
    }
    pro {
      ...PricesWorkspacePlanPrice
    }
    proUnlimited {
      ...PricesWorkspacePlanPrice
    }
  }
`)

graphql(`
  fragment PricesCurrencyBasedPrices on CurrencyBasedPrices {
    gbp {
      ...PricesWorkspacePaidPlanPrices
    }
    usd {
      ...PricesWorkspacePaidPlanPrices
    }
  }
`)

const workspacePlanPricesQuery = graphql(`
  query UseWorkspacePlanPrices {
    serverInfo {
      workspaces {
        planPrices {
          ...PricesCurrencyBasedPrices
        }
      }
    }
  }
`)

const activeWorkspacePlanPricesQuery = graphql(`
  query UseActiveWorkspacePlanPrices($slug: String!) {
    workspaceBySlug(slug: $slug) {
      id
      planPrices {
        ...PricesWorkspacePaidPlanPrices
      }
    }
  }
`)

export const useWorkspacePlanPrices = () => {
  const isBillingEnabled = useIsBillingIntegrationEnabled()
  const { result } = useQuery(workspacePlanPricesQuery, undefined, () => ({
    enabled: isBillingEnabled.value
  }))

  const prices = computed(() => result.value?.serverInfo?.workspaces?.planPrices)

  return { prices }
}

export const useActiveWorkspacePlanPrices = () => {
  const isBillingEnabled = useIsBillingIntegrationEnabled()
  const activeWorkspaceSlug = useActiveWorkspaceSlug()

  const { result } = useQuery(
    activeWorkspacePlanPricesQuery,
    () => ({
      slug: activeWorkspaceSlug.value || ''
    }),
    () => ({
      enabled: isBillingEnabled.value && !!activeWorkspaceSlug.value
    })
  )

  const prices = computed(() => result.value?.workspaceBySlug?.planPrices)

  return { prices }
}

export const useWorkspaceAddonPrices = () => {
  const { prices } = useWorkspacePlanPrices()
  const isBillingEnabled = useIsBillingIntegrationEnabled()

  const calculateAddonPrice = (unlimitedPrice: Price, basePrice: Price): Price => ({
    amount: unlimitedPrice.amount - basePrice.amount,
    currency: unlimitedPrice.currency,
    currencySymbol: unlimitedPrice.currencySymbol
  })

  const addonPrices = computed(() => {
    if (!prices.value || !isBillingEnabled.value) return undefined

    const gbpTeam = {
      monthly: calculateAddonPrice(
        prices.value.gbp?.teamUnlimited?.monthly,
        prices.value.gbp?.team?.monthly
      ),
      yearly: calculateAddonPrice(
        prices.value.gbp?.teamUnlimited?.yearly,
        prices.value.gbp?.team?.yearly
      )
    }

    const gbpPro = {
      monthly: calculateAddonPrice(
        prices.value.gbp?.proUnlimited?.monthly,
        prices.value.gbp?.pro?.monthly
      ),
      yearly: calculateAddonPrice(
        prices.value.gbp?.proUnlimited?.yearly,
        prices.value.gbp?.pro?.yearly
      )
    }

    const usdTeam = {
      monthly: calculateAddonPrice(
        prices.value.usd?.teamUnlimited?.monthly,
        prices.value.usd?.team?.monthly
      ),
      yearly: calculateAddonPrice(
        prices.value.usd?.teamUnlimited?.yearly,
        prices.value.usd?.team?.yearly
      )
    }

    const usdPro = {
      monthly: calculateAddonPrice(
        prices.value.usd?.proUnlimited?.monthly,
        prices.value.usd?.pro?.monthly
      ),
      yearly: calculateAddonPrice(
        prices.value.usd?.proUnlimited?.yearly,
        prices.value.usd?.pro?.yearly
      )
    }

    return {
      gbp: {
        free: gbpTeam,
        team: gbpTeam,
        teamUnlimited: gbpTeam,
        pro: gbpPro,
        proUnlimited: gbpPro
      },
      usd: {
        free: usdTeam,
        team: usdTeam,
        teamUnlimited: usdTeam,
        pro: usdPro,
        proUnlimited: usdPro
      }
    } as CurrencyBasedPrices
  })

  return { addonPrices }
}
