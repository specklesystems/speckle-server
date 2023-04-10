import { graphql } from '~~/lib/common/generated/gql'

export const searchProjectsQuery = graphql(`
  query SearchProjects($search: String, $ownedOnly: Boolean = false) {
    activeUser {
      projects(limit: 10, filter: { search: $search, ownedOnly: $ownedOnly }) {
        totalCount
        items {
          ...FormSelectProjects_Project
        }
      }
    }
  }
`)
