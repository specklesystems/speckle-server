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
  ResendWorkspaceInviteDocument,
  ResendWorkspaceInviteMutationVariables,
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
import { Workspaces } from '@/modules/workspaces/helpers/db'
import {
  generateRegistrationParams,
  localAuthRestApi,
  LocalAuthRestApiHelpers
} from '@/modules/auth/tests/helpers/registration'
import type { Express } from 'express'
import { AllScopes } from '@/modules/core/helpers/mainConstants'
import { getWorkspaceFactory } from '@/modules/workspaces/repositories/workspaces'
import {
  createUserEmailFactory,
  deleteUserEmailFactory,
  findEmailFactory,
  findVerifiedEmailsByUserIdFactory,
  updateUserEmailFactory
} from '@/modules/core/repositories/userEmails'
import { markUserEmailAsVerifiedFactory } from '@/modules/core/services/users/emailVerification'
import { createRandomPassword } from '@/modules/core/helpers/testHelpers'
import { WorkspaceProtectedError } from '@/modules/workspaces/errors/workspace'
import { ForbiddenError } from '@/modules/shared/errors'
import cryptoRandomString from 'crypto-random-string'
import {
  getStreamFactory,
  grantStreamPermissionsFactory
} from '@/modules/core/repositories/streams'
import { saveActivityFactory } from '@/modules/activitystream/repositories'
import {
  addOrUpdateStreamCollaboratorFactory,
  validateStreamAccessFactory
} from '@/modules/core/services/streams/access'
import { authorizeResolver } from '@/modules/shared'
import {
  addStreamInviteAcceptedActivityFactory,
  addStreamPermissionsAddedActivityFactory
} from '@/modules/activitystream/services/streamActivity'
import { publish } from '@/modules/shared/utils/subscriptions'
import { getUserFactory } from '@/modules/core/repositories/users'

enum InviteByTarget {
  Email = 'email',
  Id = 'id'
}

type TestGraphQLOperations = ReturnType<typeof buildGraphqlOperations>

const getStream = getStreamFactory({ db })
const saveActivity = saveActivityFactory({ db })
const validateStreamAccess = validateStreamAccessFactory({ authorizeResolver })

const getUser = getUserFactory({ db })
const addOrUpdateStreamCollaborator = addOrUpdateStreamCollaboratorFactory({
  validateStreamAccess,
  getUser,
  grantStreamPermissions: grantStreamPermissionsFactory({ db }),
  addStreamInviteAcceptedActivity: addStreamInviteAcceptedActivityFactory({
    saveActivity,
    publish
  }),
  addStreamPermissionsAddedActivity: addStreamPermissionsAddedActivityFactory({
    saveActivity,
    publish
  })
})

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

  const resendWorkspaceInvite = (
    args: ResendWorkspaceInviteMutationVariables,
    options?: ExecuteOperationOptions
  ) => apollo.execute(ResendWorkspaceInviteDocument, args, options)

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
    createWorkspaceProjectInvite,
    resendWorkspaceInvite
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
    slug: cryptoRandomString({ length: 10 }),
    domainBasedMembershipProtectionEnabled: false
  }

  const domainProtectedWorkspace: BasicTestWorkspace = {
    name: 'My Domain protected workspace',
    id: '',
    ownerId: '',
    slug: cryptoRandomString({ length: 10 }),
    domainBasedMembershipProtectionEnabled: true
  }

  const otherGuysWorkspace: BasicTestWorkspace = {
    name: 'Other Guy Workspace',
    id: '',
    slug: cryptoRandomString({ length: 10 }),
    ownerId: ''
  }

  const workspaceDomain = 'example.org'

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
      [domainProtectedWorkspace, me, { domain: workspaceDomain }],
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
        authUserId: me.id,
        context: {
          role: Roles.Server.User
        }
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
          'Attempting to invite into a non-existant workspace'
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

      it('should throw an error when trying to invite a user as a member without email matching domain and domain protection is enabled', async () => {
        const res = await gqlHelpers.createInvite({
          workspaceId: domainProtectedWorkspace.id,
          input: {
            userId: otherGuy.id,
            role: WorkspaceRole.Member
          }
        })

        expect(res).to.haveGraphQLErrors(
          'The target user has no verified emails matching the domain policies'
        )
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
              email: `asdasasd${Math.random()}@${workspaceDomain}`,
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
        expect(emailParams.to).to.eq(otherGuy.email)
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

    describe('and inviting to project', () => {
      const myProjectInviteTargetWorkspace: BasicTestWorkspace = {
        name: 'My Project Invite Target Workspace #1',
        id: '',
        slug: cryptoRandomString({ length: 10 }),
        ownerId: ''
      }

      const myProjectInviteTargetBasicProject: BasicTestStream = {
        name: 'My Project Invite Target Basic Project #1',
        id: '',
        ownerId: '',
        isPublic: false
      }

      const myProjectInviteTargetWorkspaceProject: BasicTestStream = {
        name: 'My Project Invite Target Workspace Project #1',
        id: '',
        ownerId: '',
        isPublic: false
      }

      const workspaceMemberWithNoProjectAccess: BasicTestUser = {
        name: 'Workspace Member With No Project Access #1',
        email: 'workspaceMemberWithNoProjectAccess1@gmail.com',
        id: ''
      }

      const workspaceGuest: BasicTestUser = {
        name: 'Workspace Guest #1',
        email: 'workspaceGuest1@bababooey.com',
        id: ''
      }

      before(async () => {
        await createTestUsers([workspaceMemberWithNoProjectAccess, workspaceGuest])
        await createTestWorkspaces([[myProjectInviteTargetWorkspace, me]])
        await assignToWorkspaces([
          [myProjectInviteTargetWorkspace, myWorkspaceFriend, Roles.Workspace.Member],
          [
            myProjectInviteTargetWorkspace,
            workspaceMemberWithNoProjectAccess,
            Roles.Workspace.Member
          ],
          [myProjectInviteTargetWorkspace, workspaceGuest, Roles.Workspace.Guest]
        ])

        myProjectInviteTargetWorkspaceProject.workspaceId =
          myProjectInviteTargetWorkspace.id
        await createTestStreams([
          [myProjectInviteTargetWorkspaceProject, me],
          [myProjectInviteTargetBasicProject, me]
        ])

        // Make myworkspacefriend a project owner (but not workspace admin!)
        await addOrUpdateStreamCollaborator(
          myProjectInviteTargetWorkspaceProject.id,
          myWorkspaceFriend.id,
          Roles.Stream.Owner,
          me.id
        )

        // Remove all project access from workspaceMemberWithNoProjectAccess
        await Promise.all([
          leaveStream(
            myProjectInviteTargetWorkspaceProject,
            workspaceMemberWithNoProjectAccess
          ),
          leaveStream(
            myProjectInviteTargetBasicProject,
            workspaceMemberWithNoProjectAccess
          )
        ])
      })

      afterEach(async () => {
        await truncateTables([ServerInvites.name])
      })

      it("can't invite to workspace project through base project invite resolver", async () => {
        const res = await gqlHelpers.createDefaultProjectInvite({
          projectId: myProjectInviteTargetWorkspaceProject.id,
          input: {
            userId: otherGuy.id,
            role: Roles.Stream.Owner
          }
        })

        expect(res).to.haveGraphQLErrors('Target project belongs to a workspace')
        expect(res.data?.projectMutations.invites.create.id).to.not.be.ok
      })

      it('can invite to non-workspace project through workspace project invite resolver', async () => {
        const res = await gqlHelpers.createWorkspaceProjectInvite({
          projectId: myProjectInviteTargetBasicProject.id,
          inputs: [
            {
              userId: otherGuy.id,
              role: Roles.Stream.Owner,
              workspaceRole: Roles.Workspace.Admin // should be ignored
            }
          ]
        })

        expect(res).to.not.haveGraphQLErrors()
        expect(res.data?.projectMutations.invites.createForWorkspace.id).to.be.ok
      })

      it("can't indirectly invite to workspace if not workspace admin", async () => {
        const res = await gqlHelpers.createWorkspaceProjectInvite(
          {
            projectId: myProjectInviteTargetWorkspaceProject.id,
            inputs: [
              {
                userId: otherGuy.id,
                role: Roles.Stream.Owner
              }
            ]
          },
          {
            context: {
              userId: myWorkspaceFriend.id
            }
          }
        )

        expect(res).to.haveGraphQLErrors(
          "Inviter doesn't have admin access to the workspace"
        )
        expect(res.data?.projectMutations.invites.createForWorkspace.id).to.not.be.ok
      })

      it('can invite to workspace project even if not workspace admin, if target already belongs to workspace', async () => {
        const res = await gqlHelpers.createWorkspaceProjectInvite(
          {
            projectId: myProjectInviteTargetWorkspaceProject.id,
            inputs: [
              {
                userId: workspaceMemberWithNoProjectAccess.id,
                role: Roles.Stream.Owner
              }
            ]
          },
          {
            context: {
              userId: myWorkspaceFriend.id
            }
          }
        )

        expect(res).to.not.haveGraphQLErrors()
        expect(res.data?.projectMutations.invites.createForWorkspace.id).to.be.ok
      })

      it("can't invite a workspace guest to be a workspace project owner", async () => {
        const res = await gqlHelpers.createWorkspaceProjectInvite({
          projectId: myProjectInviteTargetWorkspaceProject.id,
          inputs: [
            {
              userId: workspaceGuest.id,
              role: Roles.Stream.Owner
            }
          ]
        })

        expect(res).to.haveGraphQLErrors(
          'Workspace guests cannot be owners of workspace projects'
        )
        expect(res.data?.projectMutations.invites.createForWorkspace.id).to.not.be.ok
      })

      it("can't invite invalid domain email to domain protected workspace project", async () => {
        const project: BasicTestStream = {
          name: 'My Project Invite Target Workspace Project #2',
          id: '',
          ownerId: '',
          isPublic: false,
          workspaceId: domainProtectedWorkspace.id
        }
        await createTestStreams([[project, me]])

        const invalidEmail = 'johnny123456@test.com'
        const res = await gqlHelpers.createWorkspaceProjectInvite({
          projectId: project.id,
          inputs: [
            {
              email: invalidEmail,
              role: Roles.Stream.Owner,
              workspaceRole: Roles.Workspace.Member
            }
          ]
        })

        expect(res).to.haveGraphQLErrors({ code: WorkspaceProtectedError.code })
      })
    })

    describe('and administrating invites', () => {
      const myAdministrationWorkspace: BasicTestWorkspace = {
        name: 'My Administration Workspace',
        id: '',
        slug: cryptoRandomString({ length: 10 }),
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
        slug: cryptoRandomString({ length: 10 }),
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

      const emailInviteEmail = 'imJustSomeRandomNewGuy@aaaaa.com'
      const adminEmailInviteEmail = 'admin-imJustSomeRandomNewGuy@aaaaa.com'

      const processableWorkspaceEmailInvite = {
        workspaceId: '',
        inviteId: '',
        token: '',
        email: emailInviteEmail
      }

      const processableWorkspaceEmailAdminInvite = {
        workspaceId: '',
        inviteId: '',
        token: '',
        email: adminEmailInviteEmail
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

        const workspaceEmailInvite = await captureCreatedInvite(async () => {
          await gqlHelpers.createInvite(
            {
              workspaceId: myInviteTargetWorkspace.id,
              input: {
                email: processableWorkspaceEmailInvite.email,
                role: WorkspaceRole.Guest
              }
            },
            { assertNoErrors: true }
          )
        })

        processableWorkspaceEmailInvite.workspaceId = myInviteTargetWorkspace.id
        processableWorkspaceEmailInvite.inviteId = workspaceEmailInvite.id
        processableWorkspaceEmailInvite.token = workspaceEmailInvite.token

        const workspaceEmailAdminInvite = await captureCreatedInvite(async () => {
          await gqlHelpers.createInvite(
            {
              workspaceId: myInviteTargetWorkspace.id,
              input: {
                email: processableWorkspaceEmailAdminInvite.email,
                role: WorkspaceRole.Admin
              }
            },
            { assertNoErrors: true }
          )
        })

        processableWorkspaceEmailAdminInvite.workspaceId = myInviteTargetWorkspace.id
        processableWorkspaceEmailAdminInvite.inviteId = workspaceEmailAdminInvite.id
        processableWorkspaceEmailAdminInvite.token = workspaceEmailAdminInvite.token

        const projectInvite = await captureCreatedInvite(
          async () =>
            await gqlHelpers.createWorkspaceProjectInvite(
              {
                projectId: myInviteTargetWorkspaceStream1.id,
                inputs: [
                  {
                    userId: otherGuy.id,
                    role: Roles.Stream.Owner
                  }
                ]
              },
              { assertNoErrors: true }
            )
        )

        processableProjectInvite.projectId = myInviteTargetWorkspaceStream1.id
        processableProjectInvite.inviteId = projectInvite.id
        processableProjectInvite.token = projectInvite.token
      })

      const deleteEmail = async (email: string) => {
        const emailEntity = await findEmailFactory({ db })({
          email
        })
        if (emailEntity) {
          await deleteUserEmailFactory({ db })({
            userId: emailEntity.userId,
            id: emailEntity.id
          })
        }
      }

      afterEach(async () => {
        // Serial execution to avoid race conditions
        await unassignFromWorkspace(myInviteTargetWorkspace, otherGuy)
        await leaveStream(myInviteTargetWorkspaceStream1, otherGuy)

        // Reset otherGuy's newly added verified email
        await Promise.all([
          deleteEmail(emailInviteEmail),
          deleteEmail(adminEmailInviteEmail)
        ])
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

      it("can't retrieve it by passing in the slug, not workspace id", async () => {
        const res = await gqlHelpers.getInvite(
          {
            workspaceId: myInviteTargetWorkspace.slug
          },
          { context: { userId: otherGuy.id } }
        )

        expect(res).to.not.haveGraphQLErrors()
        expect(res.data?.workspaceInvite).to.not.be.ok
      })

      it('can retrieve it by passing in the slug, not workspace id, if explicit about it', async () => {
        const res = await gqlHelpers.getInvite(
          {
            workspaceId: myInviteTargetWorkspace.slug,
            options: { useSlug: true }
          },
          { context: { userId: otherGuy.id } }
        )

        expect(res).to.not.haveGraphQLErrors()
        expect(res.data?.workspaceInvite).to.be.ok
        expect(res.data!.workspaceInvite?.user!.id).to.equal(otherGuy.id)
      })

      it('cant resend the invite email w/ mismatched workspaceId', async () => {
        const res = await gqlHelpers.resendWorkspaceInvite({
          input: {
            workspaceId: myFirstWorkspace.id,
            inviteId: processableWorkspaceInvite.inviteId
          }
        })

        expect(res).to.haveGraphQLErrors('Invite not found')
        expect(res.data?.workspaceMutations.invites.resend).to.not.be.ok
      })

      it('can resend the invite email', async () => {
        const sendEmailInvocations = EmailSendingServiceMock.hijackFunction(
          'sendEmail',
          async () => true
        )

        const res = await gqlHelpers.resendWorkspaceInvite({
          input: {
            workspaceId: myInviteTargetWorkspace.id,
            inviteId: processableWorkspaceInvite.inviteId
          }
        })

        expect(res).to.not.haveGraphQLErrors()
        expect(res.data?.workspaceMutations.invites.resend).to.be.ok

        expect(sendEmailInvocations.args).to.have.lengthOf(1)
        const emailParams = sendEmailInvocations.args[0][0]
        expect(emailParams).to.be.ok
        expect(emailParams.to).to.eq(otherGuy.email)
      })

      it("can't retrieve broken invite with invalid workspaceIds", async () => {
        const brokenWorkspace: BasicTestWorkspace = {
          name: 'Broken Workspace',
          id: 'a',
          slug: cryptoRandomString({ length: 10 }),
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

      it("can't accept a new email invite, if not explicitly doing so", async () => {
        const res = await gqlHelpers.useInvite(
          {
            input: {
              accept: true,
              token: processableWorkspaceEmailInvite.token
            }
          },
          {
            context: {
              userId: otherGuy.id
            }
          }
        )

        expect(res).to.haveGraphQLErrors(
          'Attempted to finalize an invite for a mismatched e-mail address'
        )
        expect(res.data?.workspaceMutations?.invites?.use).to.not.be.ok
      })

      itEach(
        [{ accept: true }, { accept: false }],
        ({ accept }) =>
          `can explicitly ${accept ? 'accept' : 'decline'} a new email invite`,
        async ({ accept }) => {
          const res = await gqlHelpers.useInvite(
            {
              input: {
                accept,
                token: processableWorkspaceEmailAdminInvite.token,
                addNewEmail: true
              }
            },
            {
              context: {
                userId: otherGuy.id
              }
            }
          )

          expect(res).to.not.haveGraphQLErrors()
          expect(res.data?.workspaceMutations.invites.use).to.be.ok

          await validateResourceAccess({ shouldHaveAccess: accept })

          const verifiedEmails = await findVerifiedEmailsByUserIdFactory({
            db
          })({
            userId: otherGuy.id
          })
          const newVerifiedEmail = verifiedEmails.find(
            (e) =>
              e.email.toLowerCase() ===
              processableWorkspaceEmailAdminInvite.email.toLowerCase()
          )

          if (accept) {
            expect(newVerifiedEmail).to.be.ok
          } else {
            expect(newVerifiedEmail).to.not.be.ok
          }
        }
      )

      itEach(
        [{ roleChanged: true }, { roleChanged: false }],
        ({ roleChanged }) =>
          `can accept an email invite, even if already a workspace member, and role ${
            roleChanged ? 'upgraded' : 'not downgraded'
          }`,
        async ({ roleChanged }) => {
          const res1 = await gqlHelpers.useInvite(
            {
              input: {
                accept: true,
                token: processableWorkspaceInvite.token
              }
            },
            {
              context: {
                userId: otherGuy.id
              }
            }
          )

          expect(res1).to.not.haveGraphQLErrors()
          expect(res1.data?.workspaceMutations.invites.use).to.be.ok

          await validateResourceAccess({
            shouldHaveAccess: true,
            expectedWorkspaceRole: Roles.Workspace.Member
          })

          const targetInvite = roleChanged
            ? processableWorkspaceEmailAdminInvite
            : processableWorkspaceEmailInvite

          const res2 = await gqlHelpers.useInvite(
            {
              input: {
                accept: true,
                token: targetInvite.token,
                addNewEmail: true
              }
            },
            {
              context: {
                userId: otherGuy.id
              }
            }
          )

          expect(res2).to.not.haveGraphQLErrors()
          expect(res2.data?.workspaceMutations.invites.use).to.be.ok

          await validateResourceAccess({
            shouldHaveAccess: true,
            expectedWorkspaceRole: roleChanged
              ? Roles.Workspace.Admin
              : Roles.Workspace.Member
          })

          const email = targetInvite.email
          const verifiedEmails = await findVerifiedEmailsByUserIdFactory({
            db
          })({
            userId: otherGuy.id
          })
          const newVerifiedEmail = verifiedEmails.find(
            (e) => e.email.toLowerCase() === email.toLowerCase()
          )
          expect(newVerifiedEmail).to.be.ok
        }
      )

      it("can't accept the invite, if it belongs to another user", async () => {
        const res = await gqlHelpers.useInvite(
          {
            input: {
              accept: true,
              token: processableWorkspaceInvite.token
            }
          },
          {
            context: {
              userId: myWorkspaceFriend.id
            }
          }
        )

        expect(res).to.haveGraphQLErrors()
        expect(res.data?.workspaceMutations?.invites?.use).to.not.be.ok
      })

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
      slug: cryptoRandomString({ length: 10 }),
      ownerId: ''
    }

    before(async () => {
      apollo = await testApolloServer()
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
          context: await createTestContext({
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
