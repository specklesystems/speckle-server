import { gql } from 'apollo-server-express'

export const automateFunctionFragment = gql`
  fragment TestAutomateFunction on AutomateFunction {
    id
    name
    repoUrl
    creator {
      id
    }
    isFeatured
    description
    logo
    releases(limit: 5) {
      totalCount
      items {
        id
        versionTag
        createdAt
        inputSchema
        commitId
      }
    }
    automationCount
    supportedSourceApps
    tags
  }
`

export const getAutomateFunctionsQuery = gql`
  query GetAutomateFunctions(
    $cursor: String
    $limit: Int!
    $filter: AutomateFunctionsFilter
  ) {
    automateFunctions(cursor: $cursor, limit: $limit, filter: $filter) {
      cursor
      totalCount
      items {
        ...TestAutomateFunction
      }
    }
  }
  ${automateFunctionFragment}
`

export const automateValidateAuthCodeQuery = gql`
  query AutomateValidateAuthCode($code: String!) {
    automateValidateAuthCode(code: $code)
  }
`
