import { db } from '@/db/knex'
import { createRandomString } from '@/modules/core/helpers/testHelpers'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import { WorkspaceNotFoundError } from '@/modules/workspaces/errors/workspace'
import { getWorkspaceFactory } from '@/modules/workspaces/repositories/workspaces'
import { UserWithOptionalRole } from '@/modules/core/repositories/users'
import {
  CreateWorkspaceJoinRequest,
  SendWorkspaceJoinRequestReceivedEmail
} from '@/modules/workspaces/domain/operations'
import {
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
  }
)
