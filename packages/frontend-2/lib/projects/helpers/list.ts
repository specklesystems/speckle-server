import { graphql } from '~~/lib/common/generated/gql'

export const projectFragment = graphql(`
  fragment ProjectListItemFragment on Project {
    id
    name
    modelCount
    role
    editedAt
    team {
      id
      name
      avatar
    }
  }
`)
