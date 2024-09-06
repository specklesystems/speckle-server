import { gql } from 'graphql-tag'

export const automateFunctionFragment = gql`
  fragment TestAutomateFunction on AutomateFunction {
    id
    name
    repo {
      id
      owner
      name
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

export const automationFragment = gql`
  fragment TestAutomation on Automation {
    id
    name
    enabled
    createdAt
    updatedAt
    runs {
      totalCount
      items {
        id
        trigger {
          ... on VersionCreatedTrigger {
            version {
              id
            }
            model {
              id
            }
          }
        }
        status
        createdAt
        updatedAt
        functionRuns {
          id
          status
          statusMessage
          contextView
          function {
            id
          }
          elapsed
          results
        }
      }
    }
    currentRevision {
      id
      triggerDefinitions {
        ... on VersionCreatedTriggerDefinition {
          type
          model {
            id
          }
        }
      }
      functions {
        parameters
        release {
          id
          function {
            id
          }
          versionTag
          createdAt
          inputSchema
          commitId
        }
      }
    }
  }
`

export const getProjectAutomationQuery = gql`
  query GetProjectAutomation($projectId: String!, $automationId: String!) {
    project(id: $projectId) {
      id
      automation(id: $automationId) {
        ...TestAutomation
      }
    }
  }
  ${automationFragment}
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
  query AutomateValidateAuthCode($payload: AutomateAuthCodePayloadTest!) {
    automateValidateAuthCode(payload: $payload)
  }
`
