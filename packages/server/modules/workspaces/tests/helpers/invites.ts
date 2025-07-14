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
  GetProjectDocument,
  GetProjectQueryVariables,
  GetWorkspaceDocument,
  GetWorkspaceInviteDocument,
  GetWorkspaceInviteQueryVariables,
  GetWorkspaceQueryVariables,
  GetWorkspaceWithTeamDocument,
  GetWorkspaceWithTeamQueryVariables,
  ResendWorkspaceInviteDocument,
  ResendWorkspaceInviteMutationVariables,
  UseWorkspaceInviteDocument,
  UseWorkspaceInviteMutationVariables,
  UseWorkspaceProjectInviteDocument,
  UseWorkspaceProjectInviteMutationVariables
} from '@/modules/core/graph/generated/graphql'
import { expect } from 'chai'

import { MaybeAsync, StreamRoles, WorkspaceRoles } from '@speckle/shared'
import { expectToThrow } from '@/test/assertionHelper'
import { ForbiddenError } from '@/modules/shared/errors'
import { isBoolean } from 'lodash-es'
import { WorkspaceSeatType } from '@/modules/workspacesCore/domain/types'

export const buildInvitesGraphqlOperations = (deps: { apollo: TestApolloServer }) => {
  const { apollo } = deps

  const getWorkspace = async (
    args: GetWorkspaceQueryVariables,
    options?: ExecuteOperationOptions
  ) => apollo.execute(GetWorkspaceDocument, args, options)

  const getProject = async (
    args: GetProjectQueryVariables,
    options?: ExecuteOperationOptions
  ) => apollo.execute(GetProjectDocument, args, options)

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
    shouldHaveAccess: boolean | { workspace: boolean; project: boolean }
    userId: string
    workspaceId: string
    streamId?: string
    expectedWorkspaceRole?: WorkspaceRoles
    expectedWorkspaceSeatType?: WorkspaceSeatType
    expectedProjectRole?: StreamRoles
  }) => {
    const { shouldHaveAccess, userId, workspaceId, streamId } = params
    const shouldHaveWorkspaceAccess = isBoolean(shouldHaveAccess)
      ? shouldHaveAccess
      : shouldHaveAccess.workspace
    const shouldHaveProjectAccess = isBoolean(shouldHaveAccess)
      ? shouldHaveAccess
      : shouldHaveAccess.project

    const wrapAccessCheck = async (
      fn: () => MaybeAsync<unknown>,
      shouldHaveAccess: boolean
    ) => {
      if (shouldHaveAccess) {
        await fn()
      } else {
        const e = await expectToThrow(fn)
        expect(e instanceof ForbiddenError).to.be.true
      }
    }

    await wrapAccessCheck(async () => {
      const res = await getWorkspace({ workspaceId }, { authUserId: userId })
      const workspace = res.data?.workspace
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

      if (
        params.expectedWorkspaceSeatType &&
        workspace.seatType !== params.expectedWorkspaceSeatType
      ) {
        throw new ForbiddenError(
          `Unexpected workspace seat type! Expected: ${params.expectedWorkspaceSeatType}, real: ${workspace.seatType}`
        )
      }
    }, shouldHaveWorkspaceAccess)

    if (streamId?.length) {
      await wrapAccessCheck(async () => {
        const res = await getProject({ id: streamId }, { authUserId: userId })
        const project = res.data?.project

        // No need to check for project role, since it can be implicit from workspace
        if (!project?.id) {
          throw new ForbiddenError('Missing project role')
        }

        if (
          params.expectedProjectRole &&
          project?.role !== params.expectedProjectRole
        ) {
          throw new ForbiddenError(
            `Unexpected project role! Expected: ${params.expectedProjectRole}, real: ${project?.role}`
          )
        }
      }, shouldHaveProjectAccess)
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
