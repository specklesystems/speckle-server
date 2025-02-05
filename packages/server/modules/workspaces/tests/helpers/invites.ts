import { ExecuteOperationOptions, TestApolloServer } from '@/test/graphqlHelper'

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
  UseWorkspaceProjectInviteMutationVariables
} from '@/test/graphql/generated/graphql'
import { expect } from 'chai'

import { MaybeAsync, StreamRoles, WorkspaceRoles } from '@speckle/shared'
import { expectToThrow } from '@/test/assertionHelper'

import { getWorkspaceFactory } from '@/modules/workspaces/repositories/workspaces'

import { ForbiddenError } from '@/modules/shared/errors'
import { getStreamFactory } from '@/modules/core/repositories/streams'
import { db } from '@/db/knex'

export const buildInvitesGraphqlOperations = (deps: { apollo: TestApolloServer }) => {
  const { apollo } = deps
  const getStream = getStreamFactory({ db })

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

export type TestInvitesGraphQLOperations = ReturnType<
  typeof buildInvitesGraphqlOperations
>
