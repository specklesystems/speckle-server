import { graphql } from '~~/lib/common/generated/gql'

export const projectsDashboardQuery = graphql(`
  query ProjectsDashboardQuery {
    activeUser {
      id
      projects {
        totalCount
        items {
          ...ProjectDashboardItem
        }
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

export const modelPageProjectQuery = graphql(`
  query ModelPageProjectQuery($id: String!) {
    project(id: $id) {
      ...ModelPageProject
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

// This does feel rather stupid :D
export const structuredModelsQuery = graphql(`
  query ProjectStructuredModels($projectId: String!) {
    project(id: $projectId) {
      id
      name
      structuredModels {
        structure {
          ...StructuredModelFragment
          children {
            ...StructuredModelFragment
            children {
              ...StructuredModelFragment
              children {
                ...StructuredModelFragment
                children {
                  ...StructuredModelFragment
                  children {
                    ...StructuredModelFragment
                    children {
                      ...StructuredModelFragment
                      children {
                        ...StructuredModelFragment
                        children {
                          ...StructuredModelFragment
                          children {
                            ...StructuredModelFragment
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
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

export const modelCardQuery = graphql(`
  query ModelCard($projectId: String!, $modelId: String!) {
    project(id: $projectId) {
      id
      model(id: $modelId) {
        ...ModelCardModel
      }
    }
  }
`)
