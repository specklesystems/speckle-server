import {
  ProjectNoAccessError,
  ProjectNotFoundError,
  ProjectRoleNotFoundError,
  WorkspaceSsoSessionNoAccessError,
  type AuthCheckContextLoaders
} from '@speckle/shared/authz'
import { err, ok } from 'true-myth/result'
import { graphql } from '~/lib/common/generated/gql'
import { SimpleProjectVisibility } from '~/lib/common/generated/gql/graphql'
import { hasErrorWith } from '~/lib/common/helpers/graphql'
import { WorkspaceSsoErrorCodes } from '~/lib/workspaces/helpers/types'
import type { StreamRoles } from '@speckle/shared'
import { ActiveUserId, type AuthLoaderFactory } from '~/lib/auth/helpers/authPolicies'

const ProjectErrorCodes = <const>{
  NotFound: 'STREAM_NOT_FOUND',
  Forbidden: 'FORBIDDEN',
  SsoSessionError: WorkspaceSsoErrorCodes.SESSION_MISSING_OR_EXPIRED
}

// Re-using same query for multiple checks for optimal performance
const authzProjectMetadataQuery = graphql(`
  query AuthzProjectMetadata($id: String!) {
    project(id: $id) {
      id
      ...AuthzGetProject_Project
      ...AuthzGetProjectRole_Project
    }
  }
`)

graphql(`
  fragment AuthzGetProject_Project on Project {
    id
    visibility
    workspace {
      id
    }
  }
`)

export const getProjectFactory: AuthLoaderFactory<
  AuthCheckContextLoaders['getProject']
> = (deps) => {
  const apollo = deps.nuxtApp['$apollo'].default
  if (!apollo) {
    throw new Error('Apollo client not found')
  }

  return async ({ projectId }) => {
    const { data, errors } = await apollo.query({
      query: authzProjectMetadataQuery,
      variables: { id: projectId },
      fetchPolicy: deps.fetchPolicy
    })

    const isSsoSessionError = hasErrorWith({
      errors,
      code: ProjectErrorCodes.SsoSessionError
    })
    if (isSsoSessionError)
      return err(
        new WorkspaceSsoSessionNoAccessError({
          payload: {
            workspaceSlug: isSsoSessionError.message
          }
        })
      )

    const isNotFound = hasErrorWith({ errors, code: ProjectErrorCodes.NotFound })
    if (isNotFound) return err(new ProjectNotFoundError())

    const isForbidden = hasErrorWith({
      errors,
      code: ProjectErrorCodes.Forbidden
    })
    if (isForbidden) return err(new ProjectNoAccessError())

    if (data.project.id)
      return ok({
        id: data.project.id,
        isDiscoverable: false,
        isPublic: data.project.visibility === SimpleProjectVisibility.Unlisted,
        workspaceId: data.project.workspace?.id || null
      })

    throw new Error("Couldn't retrieve project due to unexpected error")
  }
}

graphql(`
  fragment AuthzGetProjectRole_Project on Project {
    id
    role
  }
`)

export const getProjectRoleFactory: AuthLoaderFactory<
  AuthCheckContextLoaders['getProjectRole']
> = (deps) => {
  const apollo = deps.nuxtApp['$apollo'].default
  if (!apollo) {
    throw new Error('Apollo client not found')
  }
  const { userId: activeUserId } = useActiveUser()

  return async ({ projectId, userId }) => {
    if (userId !== activeUserId.value && userId !== ActiveUserId) {
      throw new Error('Checking project role for a different user is not supported')
    }

    const { data, errors } = await apollo.query({
      query: authzProjectMetadataQuery,
      variables: { id: projectId },
      fetchPolicy: deps.fetchPolicy
    })

    const hasExpectedNotFoundErrors = hasErrorWith({
      errors,
      codes: [
        ProjectErrorCodes.NotFound,
        ProjectErrorCodes.Forbidden,
        ProjectErrorCodes.SsoSessionError
      ]
    })
    if (hasExpectedNotFoundErrors) return err(new ProjectRoleNotFoundError())

    if (data.project.id) {
      return data.project.role
        ? ok(data.project.role as StreamRoles)
        : err(new ProjectRoleNotFoundError())
    }

    throw new Error("Couldn't retrieve project role due to unexpected error")
  }
}
