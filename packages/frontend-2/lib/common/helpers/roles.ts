import { Roles } from '@speckle/shared'
import type { ServerRoles, StreamRoles } from '@speckle/shared'
import { ServerRole, StreamRole } from '~~/lib/common/generated/gql/graphql'

/**
 * Map GQL StreamRole enum to the value types we use in the backend
 */
export function mapStreamRoleToValue(graphqlStreamRole: StreamRole): StreamRoles {
  switch (graphqlStreamRole) {
    case StreamRole.StreamReviewer:
      return Roles.Stream.Reviewer
    case StreamRole.StreamOwner:
      return Roles.Stream.Owner
    case StreamRole.StreamContributor:
      return Roles.Stream.Contributor
  }
}

/**
 * Map GQL ServerRole enum to the value types we use in the backend
 */
export function mapServerRoleToValue(graphqlServerRole: ServerRole): ServerRoles {
  switch (graphqlServerRole) {
    case ServerRole.ServerUser:
      return Roles.Server.User
    case ServerRole.ServerAdmin:
      return Roles.Server.Admin
    case ServerRole.ServerArchivedUser:
      return Roles.Server.ArchivedUser
    case ServerRole.ServerGuest:
      return Roles.Server.Guest
  }
}

export const mapServerRoleToGqlServerRole = (role: ServerRoles): ServerRole => {
  switch (role) {
    case Roles.Server.User:
      return ServerRole.ServerUser
    case Roles.Server.Admin:
      return ServerRole.ServerAdmin
    case Roles.Server.ArchivedUser:
      return ServerRole.ServerArchivedUser
    case Roles.Server.Guest:
      return ServerRole.ServerGuest
  }
}
