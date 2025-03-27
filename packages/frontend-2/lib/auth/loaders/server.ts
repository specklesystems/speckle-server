import {
  ServerRoleNotFoundError,
  type AuthCheckContextLoaders
} from '@speckle/shared/authz'
import type { ServerRoles } from '@speckle/shared'
import { err, ok } from 'true-myth/result'
import { graphql } from '~/lib/common/generated/gql'
import { ActiveUserId, type AuthLoaderFactory } from '~/lib/auth/helpers/authPolicies'

const authzServerMetadataQuery = graphql(`
  query AuthzServerMetadata {
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
  const { userId: activeUserId } = useActiveUser()

  return async ({ userId }) => {
    if (userId !== activeUserId.value && userId !== ActiveUserId) {
      throw new Error('Checking server role for another user is not supported')
    }

    const { data, errors } = await deps
      .query({
        query: authzServerMetadataQuery,
        // We're fine with always using the cache for this, it's very unlikely that user's role will change
        // and if it does it's definitely gonna cause a problem elsewhere
        fetchPolicy: 'cache-first'
      })
      .catch(convertThrowIntoFetchResult)
    if (errors?.length) {
      throw new Error('Failed to load server role')
    }

    return data?.activeUser?.role
      ? ok(data.activeUser.role as ServerRoles)
      : err(new ServerRoleNotFoundError())
  }
}
