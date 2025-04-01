import type { WorkspaceRoles } from '@speckle/shared'
import { Authz } from '@speckle/shared'
import type { AuthCheckContextLoaders } from '@speckle/shared/authz'
import dayjs from 'dayjs'
import { ActiveUserId, type AuthLoaderFactory } from '~/lib/auth/helpers/authPolicies'
import { graphql } from '~/lib/common/generated/gql'
import { hasErrorWith } from '~/lib/common/helpers/graphql'
import { WorkspaceSsoErrorCodes } from '~/lib/workspaces/helpers/types'

const WorkspaceErrorCodes = <const>{
  NotFound: 'WORKSPACE_NOT_FOUND_ERROR',
  Forbidden: 'FORBIDDEN',
  SsoSessionError: WorkspaceSsoErrorCodes.SESSION_MISSING_OR_EXPIRED
}

const authzWorkspaceMetadataQuery = graphql(`
  query AuthzWorkspaceMetadata($id: String!) {
    workspace(id: $id) {
      id
      ...AuthzGetWorkspace_Workspace
      ...AuthzGetWorkspaceRole_Workspace
      ...AuthzGetWorkspaceSsoProviderSession_Workspace
    }
  }
`)

graphql(`
  fragment AuthzGetWorkspace_Workspace on Workspace {
    id
    slug
  }
`)

export const getWorkspaceFactory: AuthLoaderFactory<
  AuthCheckContextLoaders['getWorkspace']
> = (deps) => {
  return async ({ workspaceId }) => {
    const { data, errors } = await deps
      .query({
        query: authzWorkspaceMetadataQuery,
        variables: { id: workspaceId }
      })
      .catch(convertThrowIntoFetchResult)

    const isSsoSessionError = hasErrorWith({
      errors,
      code: WorkspaceErrorCodes.SsoSessionError
    })
    if (isSsoSessionError)
      throw new Error(
        new Authz.WorkspaceSsoSessionNoAccessError({
          payload: {
            workspaceSlug: isSsoSessionError.message
          }
        }).message
      )

    const isNotFound = hasErrorWith({ errors, code: WorkspaceErrorCodes.NotFound })
    if (isNotFound)
      throw new Error(
        new Authz.WorkspaceNoAccessError({ message: 'Workspace not found.' }).message
      )

    const isForbidden = hasErrorWith({
      errors,
      code: WorkspaceErrorCodes.Forbidden
    })
    if (isForbidden) throw new Error(new Authz.WorkspaceNoAccessError().message)

    if (data?.workspace.id) return data.workspace

    throw new Error('Unexpectedly failed to load workspace')
  }
}

graphql(`
  fragment AuthzGetWorkspaceRole_Workspace on Workspace {
    id
    role
  }
`)

export const getWorkspaceRoleFactory: AuthLoaderFactory<
  AuthCheckContextLoaders['getWorkspaceRole']
> = (deps) => {
  const { userId: activeUserId } = useActiveUser()

  return async ({ workspaceId, userId }) => {
    if (userId !== activeUserId.value && userId !== ActiveUserId) {
      throw new Error('Checking workspace role for another user is not supported')
    }

    const { data, errors } = await deps
      .query({
        query: authzWorkspaceMetadataQuery,
        variables: { id: workspaceId }
      })
      .catch(convertThrowIntoFetchResult)

    const hasExpectedNotFoundErrors = hasErrorWith({
      errors,
      codes: [
        WorkspaceErrorCodes.NotFound,
        WorkspaceErrorCodes.Forbidden,
        WorkspaceErrorCodes.SsoSessionError
      ]
    })
    if (hasExpectedNotFoundErrors) throw new Error('Workspace role not found')
    if (data?.workspace.role) {
      return data.workspace.role as WorkspaceRoles
    }

    throw new Error("Couldn't retrieve project role due to unexpected error")
  }
}

graphql(`
  fragment AuthzGetWorkspaceSsoProviderSession_Workspace on Workspace {
    id
    sso {
      provider {
        id
      }
      session {
        validUntil
      }
    }
  }
`)

export const getWorkspaceSsoProviderFactory: AuthLoaderFactory<
  AuthCheckContextLoaders['getWorkspaceSsoProvider']
> = (deps) => {
  return async ({ workspaceId }) => {
    const { data, errors } = await deps
      .query({
        query: authzWorkspaceMetadataQuery,
        variables: { id: workspaceId }
      })
      .catch(convertThrowIntoFetchResult)

    const hasExpectedNotFoundErrors = hasErrorWith({
      errors,
      codes: [
        WorkspaceErrorCodes.NotFound,
        WorkspaceErrorCodes.Forbidden,
        WorkspaceErrorCodes.SsoSessionError
      ]
    })
    if (hasExpectedNotFoundErrors) throw new Error('SSO provider not found')
    if (errors?.length) {
      throw new Error("Couldn't retrieve project role due to unexpected error")
    }

    return data?.workspace.sso?.provider
      ? { providerId: data.workspace.sso.provider.id }
      : null
  }
}

export const getWorkspaceSsoSessionFactory: AuthLoaderFactory<
  AuthCheckContextLoaders['getWorkspaceSsoSession']
> = (deps) => {
  const { userId: activeUserId } = useActiveUser()

  return async ({ workspaceId, userId }) => {
    if (userId !== activeUserId.value && userId !== ActiveUserId) {
      throw new Error('Checking workspace session for another user is not supported')
    }
    if (!activeUserId.value) throw new Error('SSO session not found')

    const { data, errors } = await deps
      .query({
        query: authzWorkspaceMetadataQuery,
        variables: { id: workspaceId }
      })
      .catch(convertThrowIntoFetchResult)

    const hasExpectedNotFoundErrors = hasErrorWith({
      errors,
      codes: [
        WorkspaceErrorCodes.NotFound,
        WorkspaceErrorCodes.Forbidden,
        WorkspaceErrorCodes.SsoSessionError
      ]
    })
    if (hasExpectedNotFoundErrors) throw new Error('SSO session not found')
    if (errors?.length) {
      throw new Error("Couldn't retrieve project role due to unexpected error")
    }

    return data?.workspace.sso?.session && data.workspace.sso.provider
      ? {
          providerId: data.workspace.sso.provider.id,
          userId: activeUserId.value,
          validUntil: dayjs(data.workspace.sso.session.validUntil).toDate()
        }
      : null
  }
}
