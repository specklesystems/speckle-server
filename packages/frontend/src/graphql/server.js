import gql from 'graphql-tag'

export const MAIN_SERVER_INFO_FIELDS = gql`
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

export const SERVER_INFO_ROLES_FIELDS = gql`
  fragment ServerInfoRolesFields on ServerInfo {
    roles {
      name
      description
      resourceTarget
    }
  }
`

export const SERVER_INFO_SCOPES_FIELDS = gql`
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
export const MainServerInfoQuery = gql`
  query MainServerInfo {
    serverInfo {
      ...MainServerInfoFields
    }
  }

  ${MAIN_SERVER_INFO_FIELDS}
`

export const FullServerInfoQuery = gql`
  query FullServerInfo {
    serverInfo {
      ...MainServerInfoFields
      ...ServerInfoRolesFields
      ...ServerInfoScopesFields
    }
  }

  ${MAIN_SERVER_INFO_FIELDS}
  ${SERVER_INFO_ROLES_FIELDS}
  ${SERVER_INFO_SCOPES_FIELDS}
`
