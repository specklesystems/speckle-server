import { graphql } from '~~/lib/common/generated/gql'

export const promoBannersWorkspaceQuery = graphql(`
  query PromoBannersWorkspace {
    activeUser {
      ...PromoBannersWorkspace_activeUser
    }
  }
`)
