import { BasicTestUser, createTestUser } from '@/test/authHelper'
import {
  GetLegacyProjectsExplainerCollapsedDocument,
  GetNewWorkspaceExplainerDismissedDocument,
  GetSpeckleConBannerDismissedDocument,
  SetLegacyProjectsExplainerCollapsedDocument,
  SetNewWorkspaceExplainerDismissedDocument,
  SetSpeckleConBannerDismissedDocument
} from '@/modules/core/graph/generated/graphql'
import { testApolloServer, TestApolloServer } from '@/test/graphqlHelper'
import { beforeEachContext } from '@/test/hooks'
import { expect } from 'chai'

describe('UserMeta GraphQL', () => {
  const me: BasicTestUser = {
    id: '',
    email: '',
    name: 'Some User meta guy'
  }

  let apollo: TestApolloServer

  before(async () => {
    await beforeEachContext()
    await createTestUser(me)
    apollo = await testApolloServer({ authUserId: me.id })
  })

  it('newWorkspaceExplainerDismissed get/set works', async () => {
    const getRes = await apollo.execute(GetNewWorkspaceExplainerDismissedDocument, {})
    expect(getRes).to.not.haveGraphQLErrors()
    expect(getRes.data?.activeUser?.meta.newWorkspaceExplainerDismissed).to.be.false

    const setRes = await apollo.execute(SetNewWorkspaceExplainerDismissedDocument, {
      input: true
    })
    expect(setRes).to.not.haveGraphQLErrors()
    expect(setRes.data?.activeUserMutations?.meta.setNewWorkspaceExplainerDismissed).to
      .be.true

    const getRes2 = await apollo.execute(GetNewWorkspaceExplainerDismissedDocument, {})
    expect(getRes2).to.not.haveGraphQLErrors()
    expect(getRes2.data?.activeUser?.meta.newWorkspaceExplainerDismissed).to.be.true
  })

  it('speckleConBannerDismissed get/set works', async () => {
    const getRes = await apollo.execute(GetSpeckleConBannerDismissedDocument, {})
    expect(getRes).to.not.haveGraphQLErrors()
    expect(getRes.data?.activeUser?.meta.speckleConBannerDismissed).to.be.false

    const setRes = await apollo.execute(SetSpeckleConBannerDismissedDocument, {
      input: true
    })
    expect(setRes).to.not.haveGraphQLErrors()
    expect(setRes.data?.activeUserMutations?.meta.setSpeckleConBannerDismissed).to.be
      .true

    const getRes2 = await apollo.execute(GetSpeckleConBannerDismissedDocument, {})
    expect(getRes2).to.not.haveGraphQLErrors()
    expect(getRes2.data?.activeUser?.meta.speckleConBannerDismissed).to.be.true
  })

  it('setLegacyProjectsExplainerCollapsed get/set works', async () => {
    const getRes = await apollo.execute(GetLegacyProjectsExplainerCollapsedDocument, {})
    expect(getRes).to.not.haveGraphQLErrors()
    expect(getRes.data?.activeUser?.meta.legacyProjectsExplainerCollapsed).to.be.false

    const setRes = await apollo.execute(SetLegacyProjectsExplainerCollapsedDocument, {
      input: true
    })
    expect(setRes).to.not.haveGraphQLErrors()
    expect(setRes.data?.activeUserMutations?.meta.setLegacyProjectsExplainerCollapsed)
      .to.be.true

    const getRes2 = await apollo.execute(
      GetLegacyProjectsExplainerCollapsedDocument,
      {}
    )
    expect(getRes2).to.not.haveGraphQLErrors()
    expect(getRes2.data?.activeUser?.meta.legacyProjectsExplainerCollapsed).to.be.true
  })
})
