import { db } from '@/db/knex'
import {
  createRandomEmail,
  createRandomString
} from '@/modules/core/helpers/testHelpers'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import { WorkspaceNotFoundError } from '@/modules/workspaces/errors/workspace'
import { getWorkspaceFactory } from '@/modules/workspaces/repositories/workspaces'
import { UserWithOptionalRole } from '@/modules/core/repositories/users'
import {
  CreateWorkspaceJoinRequest,
  SendWorkspaceJoinRequestApprovedEmail,
  SendWorkspaceJoinRequestDeniedEmail,
  SendWorkspaceJoinRequestReceivedEmail,
  UpdateWorkspaceJoinRequestStatus,
  UpsertWorkspaceRole
} from '@/modules/workspaces/domain/operations'
import {
  denyWorkspaceJoinRequestFactory,
  approveWorkspaceJoinRequestFactory,
  dismissWorkspaceJoinRequestFactory,
  requestToJoinWorkspaceFactory
} from '@/modules/workspaces/services/workspaceJoinRequests'
import {
  BasicTestWorkspace,
  createTestWorkspace
} from '@/modules/workspaces/tests/helpers/creation'
import { Workspace, WorkspaceJoinRequest } from '@/modules/workspacesCore/domain/types'
import { WorkspaceJoinRequests } from '@/modules/workspacesCore/helpers/db'
import { expectToThrow } from '@/test/assertionHelper'
import { BasicTestUser, createTestUser } from '@/test/authHelper'
import { Roles } from '@speckle/shared'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'
import {
  createWorkspaceJoinRequestFactory,
  updateWorkspaceJoinRequestStatusFactory
} from '@/modules/workspaces/repositories/workspaceJoinRequests'

const { FF_WORKSPACES_MODULE_ENABLED } = getFeatureFlags()

;(FF_WORKSPACES_MODULE_ENABLED ? describe : describe.skip)(
  'workspaceJoinRequests services',
  () => {
    describe('dismissWorkspaceJoinRequestFactory, returns a function that ', () => {
      it('throws an error if the workspace does not exists', async () => {
        const err = await expectToThrow(() =>
          dismissWorkspaceJoinRequestFactory({
            getWorkspace: getWorkspaceFactory({ db }),
            updateWorkspaceJoinRequestStatus: updateWorkspaceJoinRequestStatusFactory({
              db
            })
          })({ workspaceId: createRandomString(), userId: createRandomString() })
        )
        expect(err.message).to.equal(WorkspaceNotFoundError.defaultMessage)
      })
      it('creates the request with the dismissed status', async () => {
        const user: BasicTestUser = {
          id: '',
          name: 'John Speckle',
          email: 'john-speckle@example.org',
          role: Roles.Server.Admin,
          verified: true
        }

        await createTestUser(user)

        const workspace: BasicTestWorkspace = {
          id: '',
          slug: '',
          ownerId: '',
          name: cryptoRandomString({ length: 6 }),
          description: cryptoRandomString({ length: 12 })
        }
        await createTestWorkspace(workspace, user)

        expect(
          await dismissWorkspaceJoinRequestFactory({
            getWorkspace: getWorkspaceFactory({ db }),
            updateWorkspaceJoinRequestStatus: updateWorkspaceJoinRequestStatusFactory({
              db
            })
          })({ workspaceId: workspace.id, userId: user.id })
        ).to.equal(true)

        expect(
          await db(WorkspaceJoinRequests.name)
            .where({ workspaceId: workspace.id, userId: user.id })
            .select('status')
            .first()
        ).to.deep.equal({ status: 'dismissed' })
      })
    })

    describe('requestToJoinWorkspaceFactory, returns a function that ', () => {
      it('throws a NotFoundError if the user does not exists', async () => {
        const err = await expectToThrow(() =>
          requestToJoinWorkspaceFactory({
            createWorkspaceJoinRequest: (async () =>
              Promise.resolve()) as unknown as CreateWorkspaceJoinRequest,
            sendWorkspaceJoinRequestReceivedEmail: async () => Promise.resolve(),
            getUserById: async () => null,
            getWorkspace: async () => null
          })({ workspaceId: createRandomString(), userId: createRandomString() })
        )

        expect(err.message).to.equal('User not found')
      })
      it('throws a WorkspaceNotFoundError if the workspace does not exists', async () => {
        const user = await createTestUser({})
        const err = await expectToThrow(() =>
          requestToJoinWorkspaceFactory({
            createWorkspaceJoinRequest: (async () =>
              Promise.resolve()) as unknown as CreateWorkspaceJoinRequest,
            sendWorkspaceJoinRequestReceivedEmail: async () => Promise.resolve(),
            getUserById: async () => user as unknown as UserWithOptionalRole,
            getWorkspace: async () => null
          })({ workspaceId: createRandomString(), userId: createRandomString() })
        )

        expect(err.message).to.equal(WorkspaceNotFoundError.defaultMessage)
      })
      it('creates a join request and sends an email to all admins', async () => {
        const createWorkspaceJoinRequest = createWorkspaceJoinRequestFactory({ db })

        const sendWorkspaceJoinRequestReceivedEmailCalls: Parameters<SendWorkspaceJoinRequestReceivedEmail>[number][] =
          []
        const sendWorkspaceJoinRequestReceivedEmail = async (
          args: Parameters<SendWorkspaceJoinRequestReceivedEmail>[number]
        ) => sendWorkspaceJoinRequestReceivedEmailCalls.push(args)

        const user: BasicTestUser = {
          id: '',
          name: 'John Speckle',
          email: createRandomEmail(),
          role: Roles.Server.Admin,
          verified: true
        }

        await createTestUser(user)

        const workspace: BasicTestWorkspace = {
          id: '',
          slug: '',
          ownerId: '',
          name: cryptoRandomString({ length: 6 }),
          description: cryptoRandomString({ length: 12 })
        }
        await createTestWorkspace(workspace, user)

        expect(
          await requestToJoinWorkspaceFactory({
            createWorkspaceJoinRequest,
            sendWorkspaceJoinRequestReceivedEmail:
              sendWorkspaceJoinRequestReceivedEmail as unknown as SendWorkspaceJoinRequestReceivedEmail,
            getUserById: async () => user as unknown as UserWithOptionalRole,
            getWorkspace: async () => workspace as unknown as Workspace
          })({ workspaceId: workspace.id, userId: user.id })
        ).to.equal(true)

        expect(
          (await db<WorkspaceJoinRequest>(WorkspaceJoinRequests.name)
            .where({
              workspaceId: workspace.id,
              userId: user.id
            })
            .select('status')
            .first())!.status
        ).to.equal('pending')

        expect(sendWorkspaceJoinRequestReceivedEmailCalls).to.have.length(1)
        expect(sendWorkspaceJoinRequestReceivedEmailCalls[0].workspace).to.equal(
          workspace
        )
        expect(sendWorkspaceJoinRequestReceivedEmailCalls[0].requester).to.equal(user)
      })
    })

    describe('approveWorkspaceJoinRequestFactory, returns a function that ', () => {
      it('throws a NotFoundError if the user does not exists', async () => {
        const err = await expectToThrow(() =>
          approveWorkspaceJoinRequestFactory({
            updateWorkspaceJoinRequestStatus: (async () =>
              Promise.resolve()) as unknown as UpdateWorkspaceJoinRequestStatus,
            sendWorkspaceJoinRequestApprovedEmail: async () => Promise.resolve(),
            getUserById: async () => null,
            getWorkspace: async () => null,
            getWorkspaceJoinRequest: async () => undefined,
            upsertWorkspaceRole: async () => Promise.resolve()
          })({ workspaceId: createRandomString(), userId: createRandomString() })
        )

        expect(err.message).to.equal('User not found')
      })
      it('throws a WorkspaceNotFoundError if the workspace does not exists', async () => {
        const user = await createTestUser({})
        const err = await expectToThrow(() =>
          approveWorkspaceJoinRequestFactory({
            updateWorkspaceJoinRequestStatus: (async () =>
              Promise.resolve()) as unknown as UpdateWorkspaceJoinRequestStatus,
            sendWorkspaceJoinRequestApprovedEmail: async () => Promise.resolve(),
            getUserById: async () => user as unknown as UserWithOptionalRole,
            getWorkspace: async () => null,
            getWorkspaceJoinRequest: async () => undefined,
            upsertWorkspaceRole: async () => Promise.resolve()
          })({ workspaceId: createRandomString(), userId: createRandomString() })
        )

        expect(err.message).to.equal(WorkspaceNotFoundError.defaultMessage)
      })
      it('throws a NotFoundError if the request does not exists in the pending status', async () => {
        const user = await createTestUser({})
        const workspace: BasicTestWorkspace = {
          id: '',
          slug: '',
          ownerId: '',
          name: cryptoRandomString({ length: 6 }),
          description: cryptoRandomString({ length: 12 })
        }
        await createTestWorkspace(workspace, user)
        const err = await expectToThrow(() =>
          approveWorkspaceJoinRequestFactory({
            updateWorkspaceJoinRequestStatus: (async () =>
              Promise.resolve()) as unknown as UpdateWorkspaceJoinRequestStatus,
            sendWorkspaceJoinRequestApprovedEmail: async () => Promise.resolve(),
            getUserById: async () => user as unknown as UserWithOptionalRole,
            getWorkspace: async () => workspace as unknown as Workspace,
            getWorkspaceJoinRequest: async () => undefined,
            upsertWorkspaceRole: async () => Promise.resolve()
          })({ workspaceId: createRandomString(), userId: createRandomString() })
        )

        expect(err.message).to.equal('Workspace join request not found')
      })
      it('marks the request as approved and send an email to the requester', async () => {
        const sendWorkspaceJoinRequestApprovedEmailCalls: Parameters<SendWorkspaceJoinRequestApprovedEmail>[number][] =
          []
        const sendWorkspaceJoinRequestApprovedEmail = async (
          args: Parameters<SendWorkspaceJoinRequestApprovedEmail>[number]
        ) => sendWorkspaceJoinRequestApprovedEmailCalls.push(args)

        const upsertWorkspaceRoleCalls: Parameters<UpsertWorkspaceRole>[number][] = []
        const upsertWorkspaceRole = async (
          args: Parameters<UpsertWorkspaceRole>[number]
        ) => {
          upsertWorkspaceRoleCalls.push(args)
        }

        const user: BasicTestUser = {
          id: '',
          name: 'John Speckle',
          email: createRandomEmail(),
          role: Roles.Server.Admin,
          verified: true
        }

        await createTestUser(user)

        const workspace: BasicTestWorkspace = {
          id: '',
          slug: '',
          ownerId: '',
          name: cryptoRandomString({ length: 6 }),
          description: cryptoRandomString({ length: 12 })
        }
        await createTestWorkspace(workspace, user)

        const request = await createWorkspaceJoinRequestFactory({ db })({
          workspaceJoinRequest: {
            workspaceId: workspace.id,
            userId: user.id,
            status: 'pending'
          }
        })

        const updateWorkspaceJoinRequestStatus =
          updateWorkspaceJoinRequestStatusFactory({ db })

        expect(
          await approveWorkspaceJoinRequestFactory({
            updateWorkspaceJoinRequestStatus,
            sendWorkspaceJoinRequestApprovedEmail:
              sendWorkspaceJoinRequestApprovedEmail as unknown as SendWorkspaceJoinRequestApprovedEmail,
            getUserById: async () => user as unknown as UserWithOptionalRole,
            getWorkspace: async () => workspace as unknown as Workspace,
            getWorkspaceJoinRequest: async () => request,
            upsertWorkspaceRole
          })({ workspaceId: workspace.id, userId: user.id })
        ).to.equal(true)

        expect(
          (await db<WorkspaceJoinRequest>(WorkspaceJoinRequests.name)
            .where({
              workspaceId: workspace.id,
              userId: user.id
            })
            .select('status')
            .first())!.status
        ).to.equal('approved')

        expect(upsertWorkspaceRoleCalls).to.have.length(1)
        expect(upsertWorkspaceRoleCalls[0].workspaceId).to.equal(workspace.id)
        expect(upsertWorkspaceRoleCalls[0].userId).to.equal(user.id)
        expect(upsertWorkspaceRoleCalls[0].role).to.equal(Roles.Workspace.Member)

        expect(sendWorkspaceJoinRequestApprovedEmailCalls).to.have.length(1)
        expect(sendWorkspaceJoinRequestApprovedEmailCalls[0].workspace).to.equal(
          workspace
        )
        expect(sendWorkspaceJoinRequestApprovedEmailCalls[0].requester).to.equal(user)
      })
    })
    describe('denyWorkspaceJoinRequestFactory, returns a function that ', () => {
      it('throws a NotFoundError if the user does not exists', async () => {
        const err = await expectToThrow(() =>
          denyWorkspaceJoinRequestFactory({
            updateWorkspaceJoinRequestStatus: (async () =>
              Promise.resolve()) as unknown as UpdateWorkspaceJoinRequestStatus,
            sendWorkspaceJoinRequestDeniedEmail: async () => Promise.resolve(),
            getUserById: async () => null,
            getWorkspace: async () => null,
            getWorkspaceJoinRequest: async () => undefined
          })({ workspaceId: createRandomString(), userId: createRandomString() })
        )

        expect(err.message).to.equal('User not found')
      })
      it('throws a WorkspaceNotFoundError if the workspace does not exists', async () => {
        const user = await createTestUser({})
        const err = await expectToThrow(() =>
          denyWorkspaceJoinRequestFactory({
            updateWorkspaceJoinRequestStatus: (async () =>
              Promise.resolve()) as unknown as UpdateWorkspaceJoinRequestStatus,
            sendWorkspaceJoinRequestDeniedEmail: async () => Promise.resolve(),
            getUserById: async () => user as unknown as UserWithOptionalRole,
            getWorkspace: async () => null,
            getWorkspaceJoinRequest: async () => undefined
          })({ workspaceId: createRandomString(), userId: createRandomString() })
        )

        expect(err.message).to.equal(WorkspaceNotFoundError.defaultMessage)
      })
      it('throws a NotFoundError if the request does not exists in the pending status', async () => {
        const user = await createTestUser({})
        const workspace: BasicTestWorkspace = {
          id: '',
          slug: '',
          ownerId: '',
          name: cryptoRandomString({ length: 6 }),
          description: cryptoRandomString({ length: 12 })
        }
        await createTestWorkspace(workspace, user)
        const err = await expectToThrow(() =>
          denyWorkspaceJoinRequestFactory({
            updateWorkspaceJoinRequestStatus: (async () =>
              Promise.resolve()) as unknown as UpdateWorkspaceJoinRequestStatus,
            sendWorkspaceJoinRequestDeniedEmail: async () => Promise.resolve(),
            getUserById: async () => user as unknown as UserWithOptionalRole,
            getWorkspace: async () => workspace as unknown as Workspace,
            getWorkspaceJoinRequest: async () => undefined
          })({ workspaceId: createRandomString(), userId: createRandomString() })
        )

        expect(err.message).to.equal('Workspace join request not found')
      })
      it('marks the request as denied and send an email to the requester', async () => {
        const sendWorkspaceJoinRequestDeniedEmailCalls: Parameters<SendWorkspaceJoinRequestDeniedEmail>[number][] =
          []
        const sendWorkspaceJoinRequestDeniedEmail = async (
          args: Parameters<SendWorkspaceJoinRequestDeniedEmail>[number]
        ) => sendWorkspaceJoinRequestDeniedEmailCalls.push(args)

        const user: BasicTestUser = {
          id: '',
          name: 'John Speckle',
          email: createRandomEmail(),
          role: Roles.Server.Admin,
          verified: true
        }

        await createTestUser(user)

        const workspace: BasicTestWorkspace = {
          id: '',
          slug: '',
          ownerId: '',
          name: cryptoRandomString({ length: 6 }),
          description: cryptoRandomString({ length: 12 })
        }
        await createTestWorkspace(workspace, user)

        const request = await createWorkspaceJoinRequestFactory({ db })({
          workspaceJoinRequest: {
            workspaceId: workspace.id,
            userId: user.id,
            status: 'pending'
          }
        })

        const updateWorkspaceJoinRequestStatus =
          updateWorkspaceJoinRequestStatusFactory({ db })

        expect(
          await denyWorkspaceJoinRequestFactory({
            updateWorkspaceJoinRequestStatus,
            sendWorkspaceJoinRequestDeniedEmail:
              sendWorkspaceJoinRequestDeniedEmail as unknown as SendWorkspaceJoinRequestApprovedEmail,
            getUserById: async () => user as unknown as UserWithOptionalRole,
            getWorkspace: async () => workspace as unknown as Workspace,
            getWorkspaceJoinRequest: async () => request
          })({ workspaceId: workspace.id, userId: user.id })
        ).to.equal(true)

        expect(
          (await db<WorkspaceJoinRequest>(WorkspaceJoinRequests.name)
            .where({
              workspaceId: workspace.id,
              userId: user.id
            })
            .select('status')
            .first())!.status
        ).to.equal('denied')

        expect(sendWorkspaceJoinRequestDeniedEmailCalls).to.have.length(1)
        expect(sendWorkspaceJoinRequestDeniedEmailCalls[0].workspace).to.equal(
          workspace
        )
        expect(sendWorkspaceJoinRequestDeniedEmailCalls[0].requester).to.equal(user)
      })
    })
  }
)
