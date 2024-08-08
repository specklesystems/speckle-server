import {
  assignToWorkspaces,
  BasicTestWorkspace,
  createTestWorkspaces,
  createWorkspaceInviteDirectly,
  unassignFromWorkspace
} from '@/modules/workspaces/tests/helpers/creation'
import { BasicTestUser, createTestUsers } from '@/test/authHelper'
import {
  createTestContext,
  ExecuteOperationOptions,
  testApolloServer,
  TestApolloServer
} from '@/test/graphqlHelper'
import { beforeEachContext, truncateTables } from '@/test/hooks'
import { describe } from 'mocha'
import { EmailSendingServiceMock } from '@/test/mocks/global'
import {
  BatchCreateWorkspaceInvitesDocument,
  BatchCreateWorkspaceInvitesMutationVariables,
  CancelWorkspaceInviteDocument,
  CancelWorkspaceInviteMutationVariables,
  CreateProjectInviteDocument,
  CreateProjectInviteMutationVariables,
  CreateWorkspaceInviteDocument,
  CreateWorkspaceInviteMutationVariables,
  CreateWorkspaceProjectInviteDocument,
  CreateWorkspaceProjectInviteMutationVariables,
  GetMyWorkspaceInvitesDocument,
  GetWorkspaceInviteDocument,
  GetWorkspaceInviteQueryVariables,
  GetWorkspaceWithTeamDocument,
  GetWorkspaceWithTeamQueryVariables,
  UseWorkspaceInviteDocument,
  UseWorkspaceInviteMutationVariables,
  UseWorkspaceProjectInviteDocument,
  UseWorkspaceProjectInviteMutationVariables,
  WorkspaceRole
} from '@/test/graphql/generated/graphql'
import { expect } from 'chai'
import {
  captureCreatedInvite,
  validateInviteExistanceFromEmail
} from '@/test/speckle-helpers/inviteHelper'
import { MaybeAsync, Roles, StreamRoles, WorkspaceRoles } from '@speckle/shared'
import { expectToThrow, itEach } from '@/test/assertionHelper'
import { ServerInvites } from '@/modules/core/dbSchema'
import { TokenResourceIdentifierType } from '@/modules/core/graph/generated/graphql'
import { times } from 'lodash'
import { findInviteFactory } from '@/modules/serverinvites/repositories/serverInvites'
import { db } from '@/db/knex'
import {
  BasicTestStream,
  createTestStreams,
  leaveStream
} from '@/test/speckle-helpers/streamHelper'
import { ForbiddenError } from 'apollo-server-express'
import { Workspaces } from '@/modules/workspaces/helpers/db'
import {
  generateRegistrationParams,
  localAuthRestApi,
  LocalAuthRestApiHelpers
} from '@/modules/auth/tests/helpers/registration'
import type { Express } from 'express'
import { AllScopes } from '@/modules/core/helpers/mainConstants'
import {
  getWorkspaceDomainsFactory,
  getWorkspaceFactory,
  storeWorkspaceDomainFactory,
  upsertWorkspaceFactory
} from '@/modules/workspaces/repositories/workspaces'
import { getStream } from '@/modules/core/repositories/streams'
import { addDomainToWorkspaceFactory } from '@/modules/workspaces/services/management'
import {
  createUserEmailFactory,
  findEmailsByUserIdFactory,
  updateUserEmailFactory
} from '@/modules/core/repositories/userEmails'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { markUserEmailAsVerifiedFactory } from '@/modules/core/services/users/emailVerification'
import { WorkspaceProtectedError } from '@/modules/workspaces/errors/workspace'
import { createRandomPassword } from '@/modules/core/helpers/testHelpers'

enum InviteByTarget {
  Email = 'email',
  Id = 'id'
}

type TestGraphQLOperations = ReturnType<typeof buildGraphqlOperations>

const buildGraphqlOperations = (deps: { apollo: TestApolloServer }) => {
  const { apollo } = deps

  const useInvite = async (
    args: UseWorkspaceInviteMutationVariables,
    options?: ExecuteOperationOptions
  ) => apollo.execute(UseWorkspaceInviteDocument, args, options)

  const getInvite = async (
    args: GetWorkspaceInviteQueryVariables,
    options?: ExecuteOperationOptions
  ) => apollo.execute(GetWorkspaceInviteDocument, args, options)

  const getMyInvites = async (options?: ExecuteOperationOptions) =>
    apollo.execute(GetMyWorkspaceInvitesDocument, {}, options)

  const createDefaultProjectInvite = (
    args: CreateProjectInviteMutationVariables,
    options?: ExecuteOperationOptions
  ) => apollo.execute(CreateProjectInviteDocument, args, options)

  const createWorkspaceProjectInvite = (
    args: CreateWorkspaceProjectInviteMutationVariables,
    options?: ExecuteOperationOptions
  ) => apollo.execute(CreateWorkspaceProjectInviteDocument, args, options)

  const useProjectInvite = async (
    args: UseWorkspaceProjectInviteMutationVariables,
    options?: ExecuteOperationOptions
  ) => apollo.execute(UseWorkspaceProjectInviteDocument, args, options)

  const validateResourceAccess = async (params: {
    shouldHaveAccess: boolean
    userId: string
    workspaceId: string
    streamId?: string
    expectedWorkspaceRole?: WorkspaceRoles
    expectedProjectRole?: StreamRoles
  }) => {
    const { shouldHaveAccess, userId, workspaceId, streamId } = params

    const wrapAccessCheck = async (fn: () => MaybeAsync<unknown>) => {
      if (shouldHaveAccess) {
        await fn()
      } else {
        const e = await expectToThrow(fn)
        expect(e instanceof ForbiddenError).to.be.true
      }
    }

    await wrapAccessCheck(async () => {
      const workspace = await getWorkspaceFactory({ db })({ workspaceId, userId })
      if (!workspace?.role) {
        throw new ForbiddenError('Missing workspace role')
      }

      if (
        params.expectedWorkspaceRole &&
        workspace.role !== params.expectedWorkspaceRole
      ) {
        throw new ForbiddenError(
          `Unexpected workspace role! Expected: ${params.expectedWorkspaceRole}, real: ${workspace.role}`
        )
      }
    })

    if (streamId?.length) {
      await wrapAccessCheck(async () => {
        const project = await getStream({ streamId, userId })
        if (!project?.role) {
          throw new ForbiddenError('Missing project role')
        }

        if (params.expectedProjectRole && project.role !== params.expectedProjectRole) {
          throw new ForbiddenError(
            `Unexpected project role! Expected: ${params.expectedProjectRole}, real: ${project.role}`
          )
        }
      })
    }
  }

  const createInvite = (
    args: CreateWorkspaceInviteMutationVariables,
    options?: ExecuteOperationOptions
  ) => apollo.execute(CreateWorkspaceInviteDocument, args, options)

  const batchCreateInvites = async (
    args: BatchCreateWorkspaceInvitesMutationVariables,
    options?: ExecuteOperationOptions
  ) => apollo.execute(BatchCreateWorkspaceInvitesDocument, args, options)

  const cancelInvite = async (
    args: CancelWorkspaceInviteMutationVariables,
    options?: ExecuteOperationOptions
  ) => apollo.execute(CancelWorkspaceInviteDocument, args, options)

  const getWorkspaceWithTeam = async (
    args: GetWorkspaceWithTeamQueryVariables,
    options?: ExecuteOperationOptions
  ) => apollo.execute(GetWorkspaceWithTeamDocument, args, options)

  return {
    useInvite,
    getMyInvites,
    useProjectInvite,
    validateResourceAccess,
    getInvite,
    createInvite,
    batchCreateInvites,
    cancelInvite,
    getWorkspaceWithTeam,
    createDefaultProjectInvite,
    createWorkspaceProjectInvite
  }
}

describe('Workspaces Invites GQL', () => {
  let app: Express

  const me: BasicTestUser = {
    name: 'Authenticated server invites guy',
    email: 'serverinvitesguy@gmail.com',
    id: ''
  }

  const otherGuy: BasicTestUser = {
    name: 'Some Other DUde',
    email: 'otherguy111@gmail.com',
    id: ''
  }

  const myWorkspaceFriend: BasicTestUser = {
    name: 'My Workspace Friend',
    email: 'myworkspacefriend@asdasd.com',
    id: ''
  }

  const myFirstWorkspace: BasicTestWorkspace = {
    name: 'My First Workspace',
    id: '',
    ownerId: '',
    domainBasedMembershipProtectionEnabled: true
  }

  const otherGuysWorkspace: BasicTestWorkspace = {
    name: 'Other Guy Workspace',
    id: '',
    ownerId: ''
  }

  before(async () => {
    const ctx = await beforeEachContext()
    app = ctx.app

    await createTestUsers([me, otherGuy, myWorkspaceFriend])

    const email = 'something@example.org'
    await createUserEmailFactory({ db })({
      userEmail: {
        email,
        primary: false,
        userId: me.id
      }
    })
    await markUserEmailAsVerifiedFactory({
      updateUserEmail: updateUserEmailFactory({ db })
    })({ email })
    await createTestWorkspaces([
      [myFirstWorkspace, me],
      [otherGuysWorkspace, otherGuy]
    ])
    await assignToWorkspaces([
      [otherGuysWorkspace, me, Roles.Workspace.Member],
      [myFirstWorkspace, myWorkspaceFriend, Roles.Workspace.Member]
    ])
  })

  afterEach(() => {
    EmailSendingServiceMock.resetMockedFunctions()
  })

  describe('when authenticated', () => {
    let apollo: TestApolloServer
    let gqlHelpers: TestGraphQLOperations

    before(async () => {
      apollo = await testApolloServer({
        authUserId: me.id
      })
      gqlHelpers = buildGraphqlOperations({ apollo })
    })

    describe('and inviting to workspace', () => {
      afterEach(async () => {
        await truncateTables([ServerInvites.name])
      })

      it("doesn't work when inviting user to workspace that doesn't exist", async () => {
        const res = await gqlHelpers.createInvite({
          workspaceId: 'a',
          input: {
            userId: otherGuy.id,
            role: WorkspaceRole.Member
          }
        })

        expect(res).to.haveGraphQLErrors(
          'You are not authorized to access this resource'
        )
        expect(res.data?.workspaceMutations?.invites?.create).to.not.be.ok
      })

      it("doesn't work when inviting nonexistant user ID", async () => {
        const res = await gqlHelpers.createInvite({
          workspaceId: myFirstWorkspace.id,
          input: {
            userId: 'a',
            role: WorkspaceRole.Member
          }
        })

        expect(res).to.haveGraphQLErrors('Attempting to invite an invalid user')
        expect(res.data?.workspaceMutations?.invites?.create).to.not.be.ok
      })

      it("doesn't work if neither email nor user id specified", async () => {
        const res = await gqlHelpers.createInvite({
          workspaceId: myFirstWorkspace.id,
          input: {
            role: WorkspaceRole.Member
          }
        })

        expect(res).to.haveGraphQLErrors('Either email or userId must be specified')
        expect(res.data?.workspaceMutations?.invites?.create).to.not.be.ok
      })

      it("doesn't work if not workspace admin", async () => {
        const res = await gqlHelpers.createInvite({
          workspaceId: otherGuysWorkspace.id,
          input: {
            userId: myWorkspaceFriend.id,
            role: WorkspaceRole.Member
          }
        })

        expect(res).to.haveGraphQLErrors('You are not authorized')
        expect(res.data?.workspaceMutations?.invites?.create).to.not.be.ok
      })

      it('should throw an error when trying to invite a user as a memeber without email matching domain and domain protection is enabled', async () => {
        await addDomainToWorkspaceFactory({
          findEmailsByUserId: findEmailsByUserIdFactory({ db }),
          storeWorkspaceDomain: storeWorkspaceDomainFactory({ db }),
          getWorkspace: getWorkspaceFactory({ db }),
          upsertWorkspace: upsertWorkspaceFactory({ db }),
          emitWorkspaceEvent: getEventBus().emit,
          getDomains: getWorkspaceDomainsFactory({ db })
        })({ userId: me.id, workspaceId: myFirstWorkspace.id, domain: 'example.org' })

        const res = await gqlHelpers.createInvite({
          workspaceId: myFirstWorkspace.id,
          input: {
            userId: otherGuy.id,
            role: WorkspaceRole.Member
          }
        })

        expect(res).to.haveGraphQLErrors(new WorkspaceProtectedError().message)
        expect(res.data?.workspaceMutations?.invites?.create).to.not.be.ok
      })

      it('batch inviting fails if more than 10 invites', async () => {
        const res = await gqlHelpers.batchCreateInvites({
          workspaceId: myFirstWorkspace.id,
          input: times(11, () => ({
            email: `asdasasd${Math.random()}@gmail.com`,
            role: WorkspaceRole.Member
          }))
        })

        expect(res).to.haveGraphQLErrors(
          'Maximum 10 invites can be sent at once by non admins'
        )
        expect(res.data?.workspaceMutations?.invites?.batchCreate).to.not.be.ok
      })

      it('batch inviting fails if not workspace admin', async () => {
        const res = await gqlHelpers.batchCreateInvites({
          workspaceId: otherGuysWorkspace.id,
          input: times(10, () => ({
            email: `asdasasd${Math.random()}@gmail.com`,
            role: WorkspaceRole.Member
          }))
        })

        expect(res).to.haveGraphQLErrors('You are not authorized')
        expect(res.data?.workspaceMutations?.invites?.batchCreate).to.not.be.ok
      })

      it('batch inviting fails if resourceAccessRules prevent workspace access', async () => {
        const res = await gqlHelpers.batchCreateInvites(
          {
            workspaceId: myFirstWorkspace.id,
            input: times(10, () => ({
              email: `asdasasd${Math.random()}@gmail.com`,
              role: WorkspaceRole.Member
            }))
          },
          {
            context: {
              resourceAccessRules: [
                {
                  id: otherGuysWorkspace.id,
                  type: TokenResourceIdentifierType.Workspace
                }
              ]
            }
          }
        )

        expect(res).to.haveGraphQLErrors(
          'You are not authorized to access this resource'
        )
        expect(res.data?.workspaceMutations?.invites?.batchCreate).to.not.be.ok
      })

      it('batch inviting works', async () => {
        const count = 10

        const sendEmailInvocations = EmailSendingServiceMock.hijackFunction(
          'sendEmail',
          async () => true,
          { times: count }
        )

        const res = await gqlHelpers.batchCreateInvites({
          workspaceId: myFirstWorkspace.id,
          input: times(count, () => ({
            email: `asdasasd${Math.random()}@gmail.com`,
            role: WorkspaceRole.Member
          }))
        })

        expect(res).to.not.haveGraphQLErrors()
        expect(res.data?.workspaceMutations?.invites?.batchCreate).to.be.ok
        expect(
          res.data?.workspaceMutations?.invites?.batchCreate?.invitedTeam
        ).to.have.length(count)

        expect(sendEmailInvocations.args).to.have.lengthOf(count)
      })

      it('works when inviting user by id', async () => {
        const sendEmailInvocations = EmailSendingServiceMock.hijackFunction(
          'sendEmail',
          async () => true
        )

        const randomUnregisteredEmail = `${createRandomPassword()}@example.org`
        await createUserEmailFactory({ db })({
          userEmail: {
            userId: otherGuy.id,
            email: randomUnregisteredEmail
          }
        })
        await markUserEmailAsVerifiedFactory({
          updateUserEmail: updateUserEmailFactory({ db })
        })({
          email: randomUnregisteredEmail
        })

        const res = await gqlHelpers.createInvite({
          workspaceId: myFirstWorkspace.id,
          input: {
            userId: otherGuy.id,
            role: WorkspaceRole.Member
          }
        })

        expect(res).to.not.haveGraphQLErrors()
        expect(res.data?.workspaceMutations?.invites?.create).to.be.ok

        const workspace = res.data!.workspaceMutations!.invites!.create
        expect(workspace.invitedTeam).to.have.length(1)
        expect(workspace.invitedTeam![0].invitedBy.id).to.equal(me.id)
        expect(workspace.invitedTeam![0].token).to.be.not.ok

        expect(workspace.invitedTeam![0].user?.id).to.equal(otherGuy.id)

        expect(sendEmailInvocations.args).to.have.lengthOf(1)
        const emailParams = sendEmailInvocations.args[0][0]
        expect(emailParams).to.be.ok
        expect(emailParams.to).to.eq(randomUnregisteredEmail)
        expect(emailParams.subject).to.be.ok

        // Validate that invite exists
        await validateInviteExistanceFromEmail(emailParams)
      })
      it('works when inviting user by email', async () => {
        const sendEmailInvocations = EmailSendingServiceMock.hijackFunction(
          'sendEmail',
          async () => true
        )

        const randomUnregisteredEmail = `${createRandomPassword()}@example.org`

        const res = await gqlHelpers.createInvite({
          workspaceId: myFirstWorkspace.id,
          input: {
            email: randomUnregisteredEmail,
            role: WorkspaceRole.Member
          }
        })

        expect(res).to.not.haveGraphQLErrors()
        expect(res.data?.workspaceMutations?.invites?.create).to.be.ok

        const workspace = res.data!.workspaceMutations!.invites!.create
        expect(workspace.invitedTeam).to.have.length(1)
        expect(workspace.invitedTeam![0].invitedBy.id).to.equal(me.id)
        expect(workspace.invitedTeam![0].token).to.be.not.ok

        expect(workspace.invitedTeam![0].user).to.be.not.ok
        expect(workspace.invitedTeam![0].title).to.equal(randomUnregisteredEmail)

        expect(sendEmailInvocations.args).to.have.lengthOf(1)
        const emailParams = sendEmailInvocations.args[0][0]
        expect(emailParams).to.be.ok
        expect(emailParams.to).to.eq(randomUnregisteredEmail)
        expect(emailParams.subject).to.be.ok

        // Validate that invite exists
        await validateInviteExistanceFromEmail(emailParams)
      })

      it("doesn't work if inviting to a workspace that the token doesn't have access to", async () => {
        const res = await gqlHelpers.createInvite(
          {
            workspaceId: myFirstWorkspace.id,
            input: {
              userId: otherGuy.id,
              role: WorkspaceRole.Member
            }
          },
          {
            context: {
              resourceAccessRules: [
                {
                  id: otherGuysWorkspace.id,
                  type: TokenResourceIdentifierType.Workspace
                }
              ]
            }
          }
        )

        expect(res).to.haveGraphQLErrors(
          'You are not authorized to access this resource'
        )
        expect(res.data?.workspaceMutations?.invites?.create).to.not.be.ok
      })

      itEach(
        [InviteByTarget.Email, InviteByTarget.Id],
        (type) => `fails when inviting user by ${type} that already has a role`,
        async (type) => {
          const res = await gqlHelpers.createInvite({
            workspaceId: myFirstWorkspace.id,
            input: {
              ...(type === InviteByTarget.Email
                ? { email: myWorkspaceFriend.email }
                : {}),
              ...(type === InviteByTarget.Id ? { userId: myWorkspaceFriend.id } : {}),
              role: WorkspaceRole.Member
            }
          })

          expect(res).to.haveGraphQLErrors(
            'The target user is already a member of the specified workspace'
          )
          expect(res.data?.workspaceMutations?.invites?.create).to.not.be.ok
        }
      )
    })

    describe('and administrating invites', () => {
      const myAdministrationWorkspace: BasicTestWorkspace = {
        name: 'My Administration Workspace',
        id: '',
        ownerId: ''
      }

      const cancelableInvite = {
        workspaceId: '',
        inviteId: ''
      }

      before(async () => {
        await createTestWorkspaces([[myAdministrationWorkspace, me]])
        await assignToWorkspaces([
          [myAdministrationWorkspace, myWorkspaceFriend, Roles.Workspace.Guest]
        ])
        await gqlHelpers.batchCreateInvites(
          {
            workspaceId: myAdministrationWorkspace.id,
            input: times(10, () => ({
              email: `aszzzdasasd${Math.random()}@gmail.com`,
              role: WorkspaceRole.Member
            }))
          },
          { assertNoErrors: true }
        )
      })

      beforeEach(async () => {
        const inviteData = await captureCreatedInvite(
          async () =>
            await gqlHelpers.createInvite(
              {
                workspaceId: myAdministrationWorkspace.id,
                input: {
                  email: 'someRandomCancelableInviteGuy@asdasd.com',
                  role: WorkspaceRole.Member
                }
              },
              { assertNoErrors: true }
            )
        )

        cancelableInvite.workspaceId = myAdministrationWorkspace.id
        cancelableInvite.inviteId = inviteData.id
      })

      it("can't list invites, if not admin", async () => {
        const res = await gqlHelpers.getWorkspaceWithTeam(
          {
            workspaceId: myAdministrationWorkspace.id
          },
          {
            context: {
              userId: myWorkspaceFriend.id
            }
          }
        )

        expect(res).to.haveGraphQLErrors('You are not authorized')
        expect(res.data?.workspace).to.be.ok
        expect(res.data?.workspace.invitedTeam).to.be.not.ok
      })

      it('can list invites, if admin', async () => {
        const res = await gqlHelpers.getWorkspaceWithTeam({
          workspaceId: myAdministrationWorkspace.id
        })

        expect(res).to.not.haveGraphQLErrors()
        expect(res.data?.workspace).to.be.ok
        expect(res.data?.workspace.invitedTeam).to.have.length(11)
      })

      it("can't cancel invite, if not admin", async () => {
        const res = await gqlHelpers.cancelInvite(cancelableInvite, {
          context: {
            userId: myWorkspaceFriend.id
          }
        })

        expect(res).to.haveGraphQLErrors('You are not authorized')
        expect(res.data?.workspaceMutations?.invites?.cancel).to.not.be.ok

        const invite = await findInviteFactory({ db })({
          inviteId: cancelableInvite.inviteId
        })
        expect(invite).to.be.ok
      })

      it('can cancel invite, if admin', async () => {
        const res = await gqlHelpers.cancelInvite(cancelableInvite)

        expect(res).to.not.haveGraphQLErrors()
        expect(res.data?.workspaceMutations?.invites?.cancel).to.be.ok

        const invite = await findInviteFactory({ db })({
          inviteId: cancelableInvite.inviteId
        })
        expect(invite).to.be.not.ok
      })

      it("can't cancel invite if resourceAccessRules prevent it", async () => {
        const res = await gqlHelpers.cancelInvite(cancelableInvite, {
          context: {
            resourceAccessRules: [
              {
                id: otherGuysWorkspace.id,
                type: TokenResourceIdentifierType.Workspace
              }
            ]
          }
        })

        expect(res).to.haveGraphQLErrors('You are not authorized')
        expect(res.data?.workspaceMutations?.invites?.cancel).to.not.be.ok

        const invite = await findInviteFactory({ db })({
          inviteId: cancelableInvite.inviteId
        })
        expect(invite).to.be.ok
      })
    })

    describe('and looking at a specific invite', () => {
      const myInviteTargetWorkspace: BasicTestWorkspace = {
        name: 'My Invite Target Workspace',
        id: '',
        ownerId: ''
      }
      const myInviteTargetWorkspaceStream1: BasicTestStream = {
        name: 'My Invite Target Workspace Stream 1',
        id: '',
        ownerId: '',
        isPublic: false
      }

      const processableWorkspaceInvite = {
        workspaceId: '',
        inviteId: '',
        token: ''
      }

      const processableProjectInvite = {
        projectId: '',
        inviteId: '',
        token: ''
      }

      const validateResourceAccess = async (params: {
        shouldHaveAccess: boolean
        expectedWorkspaceRole?: WorkspaceRoles
        expectedProjectRole?: StreamRoles
      }) => {
        return gqlHelpers.validateResourceAccess({
          ...params,
          userId: otherGuy.id,
          workspaceId: myInviteTargetWorkspace.id,
          streamId: myInviteTargetWorkspaceStream1.id
        })
      }

      before(async () => {
        await truncateTables([ServerInvites.name])
        await createTestWorkspaces([[myInviteTargetWorkspace, me]])

        myInviteTargetWorkspaceStream1.workspaceId = myInviteTargetWorkspace.id
        await createTestStreams([[myInviteTargetWorkspaceStream1, me]])
      })

      beforeEach(async () => {
        const workspaceInvite = await captureCreatedInvite(async () => {
          await gqlHelpers.createInvite(
            {
              workspaceId: myInviteTargetWorkspace.id,
              input: {
                userId: otherGuy.id,
                role: WorkspaceRole.Member
              }
            },
            { assertNoErrors: true }
          )
        })

        processableWorkspaceInvite.workspaceId = myInviteTargetWorkspace.id
        processableWorkspaceInvite.inviteId = workspaceInvite.id
        processableWorkspaceInvite.token = workspaceInvite.token

        const projectInvite = await captureCreatedInvite(
          async () =>
            await gqlHelpers.createDefaultProjectInvite(
              {
                projectId: myInviteTargetWorkspaceStream1.id,
                input: {
                  userId: otherGuy.id,
                  role: Roles.Stream.Owner
                }
              },
              { assertNoErrors: true }
            )
        )

        processableProjectInvite.projectId = myInviteTargetWorkspaceStream1.id
        processableProjectInvite.inviteId = projectInvite.id
        processableProjectInvite.token = projectInvite.token
      })

      afterEach(async () => {
        // Serial execution to avoid race conditions
        await unassignFromWorkspace(myInviteTargetWorkspace, otherGuy)
        await leaveStream(myInviteTargetWorkspaceStream1, otherGuy)
      })

      it("can't retrieve it if not the invitee and no token specified", async () => {
        const res = await gqlHelpers.getInvite({
          workspaceId: myInviteTargetWorkspace.id
        })

        expect(res).to.not.haveGraphQLErrors()
        expect(res.data?.workspaceInvite).to.be.not.ok
      })

      it('can retrieve it even if not the invitee, as long as the token is valid', async () => {
        const res = await gqlHelpers.getInvite({
          workspaceId: myInviteTargetWorkspace.id,
          token: processableWorkspaceInvite.token
        })

        expect(res).to.not.haveGraphQLErrors()
        expect(res.data?.workspaceInvite).to.be.ok
        expect(res.data!.workspaceInvite?.user!.id).to.equal(otherGuy.id)
      })

      it("can't retrieve broken invite with invalid workspaceIds", async () => {
        const brokenWorkspace: BasicTestWorkspace = {
          name: 'Broken Workspace',
          id: 'a',
          ownerId: ''
        }
        await createTestWorkspaces([[brokenWorkspace, me]])

        // Doing direct invite to avoid workspace id validation checks
        const brokenInvite = await createWorkspaceInviteDirectly(
          {
            workspaceId: brokenWorkspace.id,
            input: {
              userId: otherGuy.id,
              role: WorkspaceRole.Member
            }
          },
          me.id
        )
        expect(brokenInvite.inviteId).to.be.ok

        // Db query directly, cause this isn't a supported use case
        await Workspaces.knex()
          .where({ [Workspaces.col.id]: brokenWorkspace.id })
          .del()

        const res1 = await gqlHelpers.getInvite(
          {
            workspaceId: brokenWorkspace.id
          },
          {
            context: {
              userId: otherGuy.id
            }
          }
        )

        expect(res1).to.not.haveGraphQLErrors('')
        expect(res1.data?.workspaceInvite).to.eq(null)

        const res2 = await gqlHelpers.getMyInvites({
          context: {
            userId: otherGuy.id
          }
        })

        expect(res2).to.not.haveGraphQLErrors()
        expect(res2.data?.activeUser?.workspaceInvites).to.be.ok
        expect(
          res2.data!.activeUser!.workspaceInvites.find(
            (i) => i.workspaceId === brokenWorkspace.id
          )
        ).to.not.be.ok
      })

      itEach(
        [{ withToken: true }, { withToken: false }],
        (test) =>
          `can retrieve it if the invitee ${
            test.withToken ? 'and specifying token' : 'and omitting token'
          }`,
        async (test) => {
          const res = await gqlHelpers.getInvite(
            {
              workspaceId: myInviteTargetWorkspace.id,
              token: test.withToken ? processableWorkspaceInvite.token : undefined
            },
            {
              context: {
                userId: otherGuy.id
              }
            }
          )

          expect(res).to.not.haveGraphQLErrors('')
          expect(res.data?.workspaceInvite).to.be.ok
          expect(res.data!.workspaceInvite!.inviteId).to.equal(
            processableWorkspaceInvite.inviteId
          )
          expect(res.data!.workspaceInvite!.workspaceId).to.equal(
            myInviteTargetWorkspace.id
          )
          expect(res.data!.workspaceInvite!.token).to.equal(
            processableWorkspaceInvite.token
          )
        }
      )

      itEach(
        [{ hasSome: true }, { hasSome: false }],
        (test) =>
          `can get all of my invites ${
            test.hasSome ? 'when there are some' : 'when there are none'
          }`,
        async (test) => {
          const res = await gqlHelpers.getMyInvites({
            context: {
              userId: test.hasSome ? otherGuy.id : me.id
            }
          })

          expect(res).to.not.haveGraphQLErrors()
          expect(res.data?.activeUser?.workspaceInvites).to.be.ok

          if (test.hasSome) {
            expect(res.data?.activeUser?.workspaceInvites).to.have.length(1)
            expect(res.data?.activeUser?.workspaceInvites![0].inviteId).to.equal(
              processableWorkspaceInvite.inviteId
            )
            expect(res.data?.activeUser?.workspaceInvites![0].workspaceId).to.equal(
              myInviteTargetWorkspace.id
            )
          } else {
            expect(res.data?.activeUser?.workspaceInvites).to.have.length(0)
          }
        }
      )

      itEach(
        [{ accept: true }, { accept: false }],
        ({ accept }) => `can ${accept ? 'accept' : 'decline'} the invite`,
        async ({ accept }) => {
          const res = await gqlHelpers.useInvite(
            {
              input: {
                accept,
                token: processableWorkspaceInvite.token
              }
            },
            {
              context: {
                userId: otherGuy.id
              }
            }
          )

          expect(res).to.not.haveGraphQLErrors()
          expect(res.data?.workspaceMutations?.invites?.use).to.be.ok

          const invite = await findInviteFactory({ db })({
            inviteId: processableWorkspaceInvite.inviteId
          })
          expect(invite).to.be.not.ok

          await validateResourceAccess({ shouldHaveAccess: accept })
        }
      )

      it("can't accept invite, if token resource access rules prevent it", async () => {
        const res = await gqlHelpers.useInvite(
          {
            input: {
              accept: true,
              token: processableWorkspaceInvite.token
            }
          },
          {
            context: {
              userId: otherGuy.id,
              resourceAccessRules: [
                {
                  id: otherGuysWorkspace.id,
                  type: TokenResourceIdentifierType.Workspace
                }
              ]
            }
          }
        )

        expect(res).to.haveGraphQLErrors(
          'You are not allowed to process an invite for this workspace'
        )
        expect(res.data?.workspaceMutations?.invites?.use).to.not.be.ok

        const invite = await findInviteFactory({ db })({
          inviteId: processableWorkspaceInvite.inviteId
        })
        expect(invite).to.be.ok
      })

      it('accepting workspace project invite also adds user to workspace w/ guest role', async () => {
        const res = await gqlHelpers.useProjectInvite(
          {
            input: {
              token: processableProjectInvite.token,
              accept: true,
              projectId: processableProjectInvite.projectId
            }
          },
          {
            context: {
              userId: otherGuy.id
            }
          }
        )

        expect(res).to.not.haveGraphQLErrors()
        expect(res.data?.projectMutations?.invites?.use).to.be.ok

        const invite = await findInviteFactory({ db })({
          inviteId: processableProjectInvite.inviteId
        })
        expect(invite).to.be.not.ok

        await validateResourceAccess({
          shouldHaveAccess: true,
          expectedWorkspaceRole: Roles.Workspace.Guest,
          expectedProjectRole: Roles.Stream.Owner
        })
      })

      itEach(
        [{ withRole: true }, { withRole: false }],
        ({ withRole }) =>
          `accepting workspace project invite created w/ createForWorkspace also adds user to workspace w/ ${
            withRole ? 'selected' : 'default (guest)'
          } role`,
        async ({ withRole }) => {
          const inviteData = await captureCreatedInvite(
            async () =>
              await gqlHelpers.createWorkspaceProjectInvite(
                {
                  projectId: myInviteTargetWorkspaceStream1.id,
                  inputs: [
                    {
                      userId: otherGuy.id,
                      role: Roles.Stream.Owner,
                      workspaceRole: withRole ? Roles.Workspace.Admin : undefined
                    }
                  ]
                },
                { assertNoErrors: true }
              )
          )

          const res = await gqlHelpers.useProjectInvite(
            {
              input: {
                token: inviteData.token,
                accept: true,
                projectId: myInviteTargetWorkspaceStream1.id
              }
            },
            {
              context: {
                userId: otherGuy.id
              }
            }
          )

          expect(res).to.not.haveGraphQLErrors()
          expect(res.data?.projectMutations?.invites?.use).to.be.ok

          const invite = await findInviteFactory({ db })({
            inviteId: processableProjectInvite.inviteId
          })
          expect(invite).to.be.not.ok

          await validateResourceAccess({
            shouldHaveAccess: true,
            expectedWorkspaceRole: withRole
              ? Roles.Workspace.Admin
              : Roles.Workspace.Guest,
            expectedProjectRole: Roles.Stream.Owner
          })
        }
      )
    })
  })

  describe('when unauthenticated', () => {
    let registrationRestApi: LocalAuthRestApiHelpers
    let apollo: TestApolloServer
    let gqlHelpers: TestGraphQLOperations

    const otherWorkspaceOwner: BasicTestUser = {
      name: 'Other Workspace Owner',
      email: 'otherworkspaceowner@gmail.com',
      id: ''
    }

    const otherWorkspace: BasicTestWorkspace = {
      name: 'Other Workspace',
      id: '',
      ownerId: ''
    }

    before(async () => {
      apollo = await testApolloServer({ context: createTestContext() })
      registrationRestApi = localAuthRestApi({ express: app })
      gqlHelpers = buildGraphqlOperations({ apollo })

      await createTestUsers([otherWorkspaceOwner])
      await createTestWorkspaces([[otherWorkspace, otherWorkspaceOwner]])
    })

    it('can register with workspace invite and join workspace afterwards', async () => {
      const params = generateRegistrationParams()

      const invite = await createWorkspaceInviteDirectly(
        {
          workspaceId: otherWorkspace.id,
          input: {
            email: params.user.email,
            role: WorkspaceRole.Member
          }
        },
        otherWorkspaceOwner.id
      )
      expect(invite.token).to.be.ok

      params.inviteToken = invite.token

      const newUser = await registrationRestApi.register(params)

      const res = await gqlHelpers.useInvite(
        {
          input: {
            accept: true,
            token: invite.token
          }
        },
        {
          context: createTestContext({
            userId: newUser.id,
            auth: true,
            role: Roles.Server.User,
            token: 'asd',
            scopes: AllScopes
          })
        }
      )

      expect(res).to.not.haveGraphQLErrors()
      expect(res.data?.workspaceMutations.invites.use).to.be.ok
      expect(await findInviteFactory({ db })({ inviteId: invite.inviteId })).to.be.not
        .ok

      await gqlHelpers.validateResourceAccess({
        shouldHaveAccess: true,
        userId: newUser.id,
        workspaceId: otherWorkspace.id
      })
    })
  })
})
