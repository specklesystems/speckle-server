import { graphql } from '~~/lib/common/generated/gql'

export const searchProjectsQuery = graphql(`
  query SearchProjects($search: String, $onlyWithRoles: [StreamRole!] = null) {
    activeUser {
      projects(limit: 10, filter: { search: $search, onlyWithRoles: $onlyWithRoles }) {
        totalCount
        items {
          ...FormSelectProjects_Project
        }
      }
    }
  }
`)
