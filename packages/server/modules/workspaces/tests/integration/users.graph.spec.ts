import {
  createRandomEmail,
  createRandomString
} from '@/modules/core/helpers/testHelpers'
import {
  assignToWorkspace,
  BasicTestWorkspace,
  createTestWorkspace
} from '@/modules/workspaces/tests/helpers/creation'
import {
  BasicTestUser,
  createTestUser,
  createTestUsers,
  login
} from '@/test/authHelper'
import {
  ActiveUserUpdateMutationDocument,
  GetActiveUserDocument,
  GetProjectInvitableCollaboratorsDocument,
  SetUserActiveWorkspaceDocument,
  UserActiveResourcesDocument
} from '@/modules/core/graph/generated/graphql'
import { testApolloServer, TestApolloServer } from '@/test/graphqlHelper'
import { beforeEachContext } from '@/test/hooks'
import { BasicTestStream, createTestStream } from '@/test/speckle-helpers/streamHelper'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'

describe('ActiveUserMutations', () => {
  let apollo: TestApolloServer

  const user: BasicTestUser = {
    id: '',
    name: 'John Legacy Speckle',
    email: createRandomEmail()
  }

  const workspace: BasicTestWorkspace = {
    id: '',
    ownerId: '',
    name: 'My Workspace',
    slug: ''
  }

  const project: BasicTestStream = {
    id: '',
    ownerId: '',
    name: 'My Project',
    isPublic: true
  }

  before(async () => {
    await beforeEachContext()
    await createTestUser(user)
    await createTestWorkspace(workspace, user)
    await createTestStream(project, user)

    apollo = await testApolloServer({ authUserId: user.id })
  })

  describe('setActiveWorkspace', () => {
    it('should accurately report active workspace', async () => {
      const resA = await apollo.execute(SetUserActiveWorkspaceDocument, {
        slug: workspace.slug
      })
      expect(resA).to.not.haveGraphQLErrors()

      const resB = await apollo.execute(UserActiveResourcesDocument, {})
      expect(resB).to.not.haveGraphQLErrors()

      expect(resB?.data?.activeUser?.activeWorkspace?.id).to.equal(workspace.id)
    })

    it('should accurately report if last visited project is not a workspace project', async () => {
      const resA = await apollo.execute(SetUserActiveWorkspaceDocument, {
        slug: null,
        isProjectsActive: true
      })
      expect(resA).to.not.haveGraphQLErrors()

      const resB = await apollo.execute(UserActiveResourcesDocument, {})
      expect(resB).to.not.haveGraphQLErrors()

      expect(resB?.data?.activeUser?.isProjectsActive).to.be.true
    })

    it('should allow values to be cleared with null input', async () => {
      const resA = await apollo.execute(SetUserActiveWorkspaceDocument, {
        slug: workspace.slug
      })
      expect(resA).to.not.haveGraphQLErrors()
      const resB = await apollo.execute(SetUserActiveWorkspaceDocument, { slug: null })
      expect(resB).to.not.haveGraphQLErrors()

      const resC = await apollo.execute(UserActiveResourcesDocument, {})
      expect(resC).to.not.haveGraphQLErrors()

      expect(resC.data?.activeUser?.activeWorkspace).to.be.null
    })

    it('should return null if workspace is not found or was deleted', async () => {
      const resA = await apollo.execute(SetUserActiveWorkspaceDocument, {
        slug: cryptoRandomString({ length: 9 })
      })
      expect(resA).to.not.haveGraphQLErrors()

      const resB = await apollo.execute(UserActiveResourcesDocument, {})
      expect(resB).to.not.haveGraphQLErrors()

      expect(resB?.data?.activeUser?.activeWorkspace).to.be.null
    })
  })

  describe('update', () => {
    it('writes the desired field to the active user', async () => {
      const name = cryptoRandomString({ length: 10 })
      const bio = cryptoRandomString({ length: 10 })
      const avatar = 'data:image/jpeg;base64,/////Z'
      const company = cryptoRandomString({ length: 10 })

      const resA = await apollo.execute(ActiveUserUpdateMutationDocument, {
        user: { name, bio, avatar, company }
      })
      expect(resA).to.not.haveGraphQLErrors()

      const resB = await apollo.execute(GetActiveUserDocument, {})
      expect(resB).to.not.haveGraphQLErrors()

      expect(resB?.data?.activeUser).to.deep.include({
        name,
        bio,
        avatar,
        company
      })
    })

    it('does not unset the avatar on updates', async () => {
      const name = cryptoRandomString({ length: 10 })
      const avatar = 'data:image/jpeg;base64,/////Z'

      const resA = await apollo.execute(ActiveUserUpdateMutationDocument, {
        user: {
          name,
          avatar
        }
      })
      expect(resA).to.not.haveGraphQLErrors()

      const updatedName = name + '-updated'
      const resB = await apollo.execute(ActiveUserUpdateMutationDocument, {
        user: {
          name: updatedName,
          avatar: null
        }
      })
      expect(resB).to.not.haveGraphQLErrors()

      const resC = await apollo.execute(GetActiveUserDocument, {})
      expect(resC).to.not.haveGraphQLErrors()

      expect(resC?.data?.activeUser).to.deep.include({
        name: updatedName,
        avatar
      })
    })
  })

  it('is able to clear the avatar', async () => {
    const name = cryptoRandomString({ length: 10 })
    const avatar = 'data:image/jpeg;base64,/////Z'

    const resA = await apollo.execute(ActiveUserUpdateMutationDocument, {
      user: {
        name,
        avatar
      }
    })
    expect(resA).to.not.haveGraphQLErrors()

    const resB = await apollo.execute(ActiveUserUpdateMutationDocument, {
      user: {
        avatar: ''
      }
    })
    expect(resB).to.not.haveGraphQLErrors()

    const resC = await apollo.execute(GetActiveUserDocument, {})
    expect(resC).to.not.haveGraphQLErrors()

    expect(resC?.data?.activeUser).to.deep.include({
      name,
      avatar: null
    })
  })
})

describe('Project.invitableCollaborators', () => {
  const adminUser: BasicTestUser = {
    id: '',
    name: createRandomString(),
    email: createRandomEmail()
  }
  const workspaceMemberA: BasicTestUser = {
    id: '',
    name: createRandomString() + 'foo',
    email: 'baz' + createRandomEmail()
  }
  const workspaceMemberB: BasicTestUser = {
    id: '',
    name: createRandomString() + 'baz',
    email: 'bar' + createRandomEmail()
  }
  const nonWorkspaceMember: BasicTestUser = {
    id: '',
    name: createRandomString(),
    email: createRandomEmail()
  }

  const testWorkspace: BasicTestWorkspace = {
    id: createRandomString(),
    name: createRandomString(),
    slug: createRandomString(),
    ownerId: ''
  }

  // The project we will run the test suite search against
  const testProject: BasicTestStream = {
    id: '',
    ownerId: '',
    name: createRandomString(),
    isPublic: true,
    workspaceId: ''
  }
  // An extra project for test comprehensiveness
  const testOtherProject: BasicTestStream = {
    id: '',
    ownerId: '',
    name: createRandomString(),
    isPublic: true,
    workspaceId: ''
  }

  before(async () => {
    await createTestUser(adminUser)
    await createTestUsers([workspaceMemberA, workspaceMemberB, nonWorkspaceMember])

    await createTestWorkspace(testWorkspace, adminUser, {
      addPlan: {
        name: 'unlimited',
        status: 'valid'
      }
    })
    await assignToWorkspace(testWorkspace, workspaceMemberA)
    await assignToWorkspace(testWorkspace, workspaceMemberB)

    testProject.workspaceId = testWorkspace.id
    testOtherProject.workspaceId = testWorkspace.id

    await createTestStream(testProject, adminUser)
    await createTestStream(testOtherProject, workspaceMemberA)
  })

  it('should return invitable collaborators', async () => {
    const session = await login(adminUser)

    const res = await session.execute(GetProjectInvitableCollaboratorsDocument, {
      projectId: testProject.id
    })
    expect(res).not.haveGraphQLErrors()

    const invitable = res.data?.project.invitableCollaborators
    expect(invitable?.totalCount).to.eq(2)
    expect(invitable?.items).to.have.length(2)
    expect(invitable?.items).to.deep.equalInAnyOrder([
      { id: workspaceMemberA.id, user: { name: workspaceMemberA.name } },
      { id: workspaceMemberB.id, user: { name: workspaceMemberB.name } }
    ])
  })
})
