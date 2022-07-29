import { gql } from '@apollo/client/core'

export const mainServerInfoFieldsFragment = gql`
  fragment MainServerInfoFields on ServerInfo {
    name
    company
    description
    adminContact
    canonicalUrl
    termsOfService
    inviteOnly
    version
  }
`

export const serverInfoRolesFieldsFragment = gql`
  fragment ServerInfoRolesFields on ServerInfo {
    roles {
      name
      description
      resourceTarget
    }
  }
`

export const serverInfoScopesFieldsFragment = gql`
  fragment ServerInfoScopesFields on ServerInfo {
    scopes {
      name
      description
    }
  }
`

/**
 * Get main server info
 */
export const mainServerInfoQuery = gql`
  query MainServerInfo {
    serverInfo {
      ...MainServerInfoFields
    }
  }

  ${mainServerInfoFieldsFragment}
`

export const fullServerInfoQuery = gql`
  query FullServerInfo {
    serverInfo {
      ...MainServerInfoFields
      ...ServerInfoRolesFields
      ...ServerInfoScopesFields
    }
  }

  ${mainServerInfoFieldsFragment}
  ${serverInfoRolesFieldsFragment}
  ${serverInfoScopesFieldsFragment}
`
