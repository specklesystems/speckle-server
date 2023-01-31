import { graphql } from '~~/lib/common/generated/gql'

export const projectDashboardItemNoModelsFragment = graphql(`
  fragment ProjectDashboardItemNoModels on Project {
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
  }
`)

export const projectDashboardItemFragment = graphql(`
  fragment ProjectDashboardItem on Project {
    id
    ...ProjectDashboardItemNoModels
    models(limit: 4, filter: { onlyWithVersions: true }) {
      totalCount
      items {
        ...ProjectPageLatestItemsModelItem
      }
    }
  }
`)

export const projectPageLatestItemsModelItemFragment = graphql(`
  fragment ProjectPageLatestItemsModelItem on Model {
    id
    name
    displayName
    versionCount
    commentThreadCount
    previewUrl
    createdAt
    updatedAt
  }
`)
