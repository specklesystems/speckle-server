import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import { GetWorkspacePlanPricesDocument } from '@/test/graphql/generated/graphql'
import { TestApolloServer, testApolloServer } from '@/test/graphqlHelper'
import { PaidWorkspacePlans, WorkspaceGuestSeatType } from '@speckle/shared'
import { expect } from 'chai'

const { FF_WORKSPACES_NEW_PLANS_ENABLED, FF_GATEKEEPER_MODULE_ENABLED } =
  getFeatureFlags()

describe('Workspace plan prices', () => {
  let apollo: TestApolloServer

  before(async () => {
    apollo = await testApolloServer()
  })

  const getPrices = () => apollo.execute(GetWorkspacePlanPricesDocument, {})

  it('returns prices', async () => {
    const res = await getPrices()

    let expectedPlans = [
      ...Object.values(PaidWorkspacePlans),
      WorkspaceGuestSeatType
    ].filter(
      (p) =>
        FF_WORKSPACES_NEW_PLANS_ENABLED ||
        (p !== PaidWorkspacePlans.Team && p !== PaidWorkspacePlans.Pro)
    )
    if (!FF_GATEKEEPER_MODULE_ENABLED) {
      expectedPlans = []
    }

    expect(res).to.not.haveGraphQLErrors()

    const prices = res.data?.serverInfo.workspaces.planPrices
    expect(prices).to.be.ok
    expect(prices).to.have.lengthOf(expectedPlans.length)
    expect(prices!.map((p) => p.id)).to.deep.equalInAnyOrder(expectedPlans)
  })
})
