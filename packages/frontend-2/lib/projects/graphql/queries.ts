import { graphql } from '~~/lib/common/generated/gql'

export const projectAccessCheckQuery = graphql(`
  query ProjectAccessCheck($id: String!) {
    project(id: $id) {
      id
    }
  }
`)

export const projectsDashboardQuery = graphql(`
  query ProjectsDashboardQuery($filter: UserProjectsFilter, $cursor: String) {
    activeUser {
      id
      projects(filter: $filter, limit: 6, cursor: $cursor) {
        cursor
        totalCount
        items {
          ...ProjectDashboardItem
        }
      }
      ...ProjectsInviteBanners
    }
  }
`)

export const projectPageQuery = graphql(`
  query ProjectPageQuery($id: String!, $token: String) {
    project(id: $id) {
      ...ProjectPageProject
    }
    projectInvite(projectId: $id, token: $token) {
      ...ProjectsInviteBanner
    }
  }
`)

export const latestModelsQuery = graphql(`
  query ProjectLatestModels($projectId: String!, $filter: ProjectModelsFilter) {
    project(id: $projectId) {
      id
      models(cursor: null, limit: 16, filter: $filter) {
        totalCount
        cursor
        items {
          ...ProjectPageLatestItemsModelItem
        }
      }
      pendingImportedModels {
        ...PendingFileUpload
      }
    }
  }
`)

export const latestModelsPaginationQuery = graphql(`
  query ProjectLatestModelsPagination(
    $projectId: String!
    $filter: ProjectModelsFilter
    $cursor: String = null
  ) {
    project(id: $projectId) {
      id
      models(cursor: $cursor, limit: 16, filter: $filter) {
        totalCount
        cursor
        items {
          ...ProjectPageLatestItemsModelItem
        }
      }
    }
  }
`)

export const projectModelsTreeTopLevelQuery = graphql(`
  query ProjectModelsTreeTopLevel(
    $projectId: String!
    $filter: ProjectModelsTreeFilter
  ) {
    project(id: $projectId) {
      id
      modelsTree(cursor: null, limit: 8, filter: $filter) {
        totalCount
        cursor
        items {
          ...SingleLevelModelTreeItem
        }
      }
      pendingImportedModels {
        ...PendingFileUpload
      }
    }
  }
`)

export const projectModelsTreeTopLevelPaginationQuery = graphql(`
  query ProjectModelsTreeTopLevelPagination(
    $projectId: String!
    $filter: ProjectModelsTreeFilter
    $cursor: String = null
  ) {
    project(id: $projectId) {
      id
      modelsTree(cursor: $cursor, limit: 8, filter: $filter) {
        totalCount
        cursor
        items {
          ...SingleLevelModelTreeItem
        }
      }
    }
  }
`)

export const projectModelChildrenTreeQuery = graphql(`
  query ProjectModelChildrenTree($projectId: String!, $parentName: String!) {
    project(id: $projectId) {
      id
      modelChildrenTree(fullName: $parentName) {
        ...SingleLevelModelTreeItem
      }
    }
  }
`)

export const latestCommentThreadsQuery = graphql(`
  query ProjectLatestCommentThreads(
    $projectId: String!
    $cursor: String = null
    $filter: ProjectCommentsFilter = null
  ) {
    project(id: $projectId) {
      id
      commentThreads(cursor: $cursor, limit: 8, filter: $filter) {
        totalCount
        cursor
        items {
          ...ProjectPageLatestItemsCommentItem
        }
      }
    }
  }
`)

export const projectInviteQuery = graphql(`
  query ProjectInvite($projectId: String!, $token: String) {
    projectInvite(projectId: $projectId, token: $token) {
      ...ProjectsInviteBanner
    }
  }
`)

export const projectModelCheckQuery = graphql(`
  query ProjectModelCheck($projectId: String!, $modelId: String!) {
    project(id: $projectId) {
      model(id: $modelId) {
        id
      }
    }
  }
`)

export const projectModelPageQuery = graphql(`
  query ProjectModelPage(
    $projectId: String!
    $modelId: String!
    $versionsCursor: String
  ) {
    project(id: $projectId) {
      ...ProjectModelPageHeaderProject
      ...ProjectModelPageVersionsProject
    }
  }
`)

export const projectModelVersionsQuery = graphql(`
  query ProjectModelVersions(
    $projectId: String!
    $modelId: String!
    $versionsCursor: String
  ) {
    project(id: $projectId) {
      ...ProjectModelPageVersionsPagination
    }
  }
`)

export const projectModelsPageQuery = graphql(`
  query ProjectModelsPage($projectId: String!) {
    project(id: $projectId) {
      ...ProjectModelsPageHeader_Project
      ...ProjectModelsPageResults_Project
    }
  }
`)

export const projectDiscussionsPageQuery = graphql(`
  query ProjectDiscussionsPage($projectId: String!) {
    project(id: $projectId) {
      ...ProjectDiscussionsPageHeader_Project
      ...ProjectDiscussionsPageResults_Project
    }
  }
`)
