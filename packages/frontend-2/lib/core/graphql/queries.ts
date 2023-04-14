import { graphql } from '~~/lib/common/generated/gql'

export const serverVersionInfoQuery = graphql(`
  query ServerVersionInfo {
    serverInfo {
      version
    }
  }
`)
