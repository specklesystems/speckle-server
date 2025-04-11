import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import { GetWorkspacePlanPricesDocument } from '@/test/graphql/generated/graphql'
import { TestApolloServer, testApolloServer } from '@/test/graphqlHelper'
import { PaidWorkspacePlans, WorkspaceGuestSeatType } from '@speckle/shared'
import { expect } from 'chai'

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

      const expectedPlans = [
        ...Object.values(PaidWorkspacePlans),
        WorkspaceGuestSeatType
      ]

      expect(res).to.not.haveGraphQLErrors()

      const prices = res.data?.serverInfo.workspaces.planPrices
      expect(prices).to.be.ok
      expect(prices).to.have.lengthOf(expectedPlans.length)
      expect(prices!.map((p) => p.id)).to.deep.equalInAnyOrder(expectedPlans)
    })
  }
)
