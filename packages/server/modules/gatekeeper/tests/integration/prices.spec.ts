import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import { GetWorkspacePlanPricesDocument } from '@/modules/core/graph/generated/graphql'
import { TestApolloServer, testApolloServer } from '@/test/graphqlHelper'
import { PaidWorkspacePlans } from '@speckle/shared'
import { expect } from 'chai'
import { Currency } from '@/modules/gatekeeper/domain/billing'

const { FF_BILLING_INTEGRATION_ENABLED } = getFeatureFlags()

;(FF_BILLING_INTEGRATION_ENABLED ? describe : describe.skip)(
  'Workspace plan prices',
  () => {
    let apollo: TestApolloServer

    before(async () => {
      apollo = await testApolloServer()
    })

    const getPrices = () => apollo.execute(GetWorkspacePlanPricesDocument, {})

    it('returns prices', async () => {
      const res = await getPrices()

      const expectedPlans = [...Object.values(PaidWorkspacePlans)]

      expect(res).to.not.haveGraphQLErrors()

      const prices = res.data?.serverInfo.workspaces.planPrices
      expect(prices).to.not.be.null
      if (!prices) throw new Error('This cannot be')
      for (const currency of Object.values(Currency)) {
        const p = prices[currency]
        expect(Object.keys(p)).to.have.lengthOf(expectedPlans.length)
        expect(Object.keys(p)).to.deep.equalInAnyOrder(expectedPlans)
      }
    })
  }
)
