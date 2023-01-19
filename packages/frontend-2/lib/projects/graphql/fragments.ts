import { graphql } from '~~/lib/common/generated/gql'

export const projectDashboardItemFragment = graphql(`
  fragment ProjectDashboardItem on Project {
    id
    name
    createdAt
    updatedAt
    role
    team {
      id
      name
      avatar
    }
    models(limit: 4, filter: { onlyWithVersions: true }) {
      totalCount
      items {
        ...ProjectPageLatestItemsModelItem
      }
    }
  }
`)
