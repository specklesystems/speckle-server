import {
  ServerRoleNotFoundError,
  type AuthCheckContextLoaders
} from '@speckle/shared/authz'
import type { ServerRoles } from '@speckle/shared'
import { err, ok } from 'true-myth/result'
import { graphql } from '~/lib/common/generated/gql'
import { ActiveUserId, type AuthLoaderFactory } from '~/lib/auth/helpers/authPolicies'

const authzServerMetadataQuery = graphql(`
  query AuthzServerMetadata($userId: String!) {
    activeUser {
      id
      ...AuthzGetServerRole_User
    }
  }
`)

graphql(`
  fragment AuthzGetServerRole_User on User {
    id
    role
  }
`)

export const getServerRoleFactory: AuthLoaderFactory<
  AuthCheckContextLoaders['getServerRole']
> = (deps) => {
  const {
    $apollo: { default: apollo }
  } = deps.nuxtApp
  if (!apollo) {
    throw new Error('Apollo client not found')
  }
  const { userId: activeUserId } = useActiveUser()

  return async ({ userId }) => {
    if (userId !== activeUserId.value && userId !== ActiveUserId) {
      throw new Error('Checking server role for another user is not supported')
    }

    const { data, errors } = await apollo.query({
      query: authzServerMetadataQuery,
      fetchPolicy: deps.fetchPolicy
    })
    if (errors?.length) {
      throw new Error('Failed to load server role')
    }

    return data.activeUser?.role
      ? ok(data.activeUser.role as ServerRoles)
      : err(new ServerRoleNotFoundError())
  }
}
