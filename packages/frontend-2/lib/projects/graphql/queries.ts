import { graphql } from '~~/lib/common/generated/gql'

export const projectsDashboardQuery = graphql(`
  query ProjectsDashboardQuery {
    activeUser {
      id
      projects {
        totalCount
        ...ProjectsDashboardFilled
      }
    }
  }
`)

export const projectPageQuery = graphql(`
  query ProjectPageQuery($id: String!) {
    project(id: $id) {
      ...ProjectPageProject
    }
  }
`)

export const latestModelsQuery = graphql(`
  query ProjectLatestModels($projectId: String!, $filter: ProjectModelsFilter) {
    project(id: $projectId) {
      id
      models(cursor: null, limit: 8, filter: $filter) {
        totalCount
        cursor
        items {
          ...ProjectPageLatestItemsModelItem
        }
      }
    }
  }
`)

export const latestCommentThreadsQuery = graphql(`
  query ProjectLatestCommentThreads($projectId: String!) {
    project(id: $projectId) {
      id
      commentThreads(cursor: null, limit: 8) {
        totalCount
        cursor
        items {
          ...ProjectPageLatestItemsCommentItem
        }
      }
    }
  }
`)
