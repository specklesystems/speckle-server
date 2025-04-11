import {
  createRandomEmail,
  createRandomString
} from '@/modules/core/helpers/testHelpers'
import {
  assignToWorkspace,
  BasicTestWorkspace,
  createTestWorkspace
} from '@/modules/workspaces/tests/helpers/creation'
import { BasicTestUser, createTestUser, login } from '@/test/authHelper'
import {
  GetProjectInvitableCollaboratorsDocument,
  SetUserActiveWorkspaceDocument,
  UserActiveResourcesDocument
} from '@/test/graphql/generated/graphql'
import { testApolloServer, TestApolloServer } from '@/test/graphqlHelper'
import { beforeEachContext } from '@/test/hooks'
import { BasicTestStream, createTestStream } from '@/test/speckle-helpers/streamHelper'
import { Roles } from '@speckle/shared'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'

describe('ActiveUserMutations.setActiveWorkspace', () => {
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

describe('Project.invitableCollaborators', () => {
  it('should return invitable collaborators', async () => {
    const admin = await createTestUser({
      name: createRandomString(),
      email: createRandomEmail(),
      role: Roles.Server.User,
      verified: true
    })
    const workspace = {
      id: createRandomString(),
      name: createRandomString(),
      slug: createRandomString(),
      ownerId: admin.id
    }
    await createTestWorkspace(workspace, admin)

    const member = await createTestUser({
      name: createRandomString(),
      email: createRandomEmail(),
      role: Roles.Server.User,
      verified: true
    })
    await assignToWorkspace(workspace, member, Roles.Workspace.Member)

    // Non workspace member
    await createTestUser({
      name: createRandomString(),
      email: createRandomEmail(),
      role: Roles.Server.User,
      verified: true
    })

    const projectMember = await createTestUser({
      name: createRandomString(),
      email: createRandomEmail(),
      role: Roles.Server.User,
      verified: true
    })

    const project = {
      id: createRandomString(),
      workspaceId: workspace.id
    }
    await createTestStream(project, projectMember)

    // User in another project should still be invitable
    const otherProject = {
      id: createRandomString(),
      workspaceId: workspace.id
    }
    await createTestStream(otherProject, admin)

    const session = await login(admin)

    const res = await session.execute(GetProjectInvitableCollaboratorsDocument, {
      projectId: project.id
    })
    expect(res).not.haveGraphQLErrors()

    const invitable = res.data?.project.invitableCollaborators
    expect(invitable?.totalCount).to.eq(2)
    expect(invitable?.items).to.have.length(2)
    expect(invitable?.items).to.deep.equalInAnyOrder([
      { id: admin.id, user: { name: admin.name } },
      { id: member.id, user: { name: member.name } }
    ])
  })
})
