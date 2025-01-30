import { graphql } from '~~/lib/common/generated/gql'

export const createVersionMutation = graphql(`
  mutation VersionMutations($input: CreateVersionInput!) {
    versionMutations {
      create(input: $input) {
        id
      }
    }
  }
`)

export const markReceivedVersionMutation = graphql(`
  mutation MarkReceivedVersion($input: MarkReceivedVersionInput!) {
    versionMutations {
      markReceived(input: $input)
    }
  }
`)

export const createModelMutation = graphql(`
  mutation CreateModel($input: CreateModelInput!) {
    modelMutations {
      create(input: $input) {
        ...ModelListModelItem
      }
    }
  }
`)

export const createProjectMutation = graphql(`
  mutation CreateProject($input: ProjectCreateInput) {
    projectMutations {
      create(input: $input) {
        ...ProjectListProjectItem
      }
    }
  }
`)

export const createProjectInWorkspaceMutation = graphql(`
  mutation CreateProjectInWorkspace($input: WorkspaceProjectCreateInput!) {
    workspaceMutations {
      projects {
        create(input: $input) {
          ...ProjectListProjectItem
        }
      }
    }
  }
`)

export const requestProjectAccess = graphql(`
  mutation StreamAccessRequestCreate($input: String!) {
    streamAccessRequestCreate(streamId: $input) {
      id
    }
  }
`)

export const workspaceListFragment = graphql(`
  fragment WorkspaceListWorkspaceItem on Workspace {
    id
    name
    description
    createdAt
    updatedAt
    logo
    role
    readOnly
  }
`)

export const automateFunctionsListFragment = graphql(`
  fragment AutomateFunctionItem on AutomateFunction {
    name
    isFeatured
    id
    creator {
      name
    }
    releases {
      items {
        inputSchema
      }
    }
  }
`)

export const createAutomationMutation = graphql(`
  mutation CreateAutomation($projectId: ID!, $input: ProjectAutomationCreateInput!) {
    projectMutations {
      automationMutations(projectId: $projectId) {
        create(input: $input) {
          id
          name
        }
      }
    }
  }
`)

export const automateFunctionRunItemFragment = graphql(`
  fragment AutomateFunctionRunItem on AutomateFunctionRun {
    id
    status
    statusMessage
    results
    contextView
    function {
      id
      name
      logo
    }
  }
`)

export const automationRunItemFragment = graphql(`
  fragment AutomationRunItem on AutomateRun {
    id
    status
    automation {
      id
      name
    }
    functionRuns {
      ...AutomateFunctionRunItem
    }
  }
`)

export const automateStatusQuery = graphql(`
  query AutomationStatus($projectId: String!, $modelId: String!) {
    project(id: $projectId) {
      model(id: $modelId) {
        automationsStatus {
          id
          status
          automationRuns {
            ...AutomationRunItem
          }
        }
      }
    }
  }
`)

export const workspacesListQuery = graphql(`
  query WorkspaceListQuery(
    $limit: Int!
    $filter: UserWorkspacesFilter
    $cursor: String
  ) {
    activeUser {
      id
      workspaces(limit: $limit, filter: $filter, cursor: $cursor) {
        totalCount
        cursor
        items {
          ...WorkspaceListWorkspaceItem
        }
      }
    }
  }
`)

export const projectListFragment = graphql(`
  fragment ProjectListProjectItem on Project {
    id
    name
    role
    updatedAt
    workspaceId
    models {
      totalCount
    }
  }
`)

export const projectsListQuery = graphql(`
  query ProjectListQuery($limit: Int!, $filter: UserProjectsFilter, $cursor: String) {
    activeUser {
      id
      projects(limit: $limit, filter: $filter, cursor: $cursor) {
        totalCount
        cursor
        items {
          ...ProjectListProjectItem
        }
      }
    }
  }
`)

export const modelListFragment = graphql(`
  fragment ModelListModelItem on Model {
    displayName
    name
    id
    previewUrl
    updatedAt
    versions(limit: 1) {
      totalCount
      items {
        ...VersionListItem
      }
    }
  }
`)

export const projectModelsQuery = graphql(`
  query ProjectModels(
    $projectId: String!
    $cursor: String
    $limit: Int!
    $filter: ProjectModelsFilter
  ) {
    project(id: $projectId) {
      id
      models(cursor: $cursor, limit: $limit, filter: $filter) {
        totalCount
        cursor
        items {
          ...ModelListModelItem
        }
      }
    }
  }
`)

export const versionListFragment = graphql(`
  fragment VersionListItem on Version {
    id
    referencedObject
    message
    sourceApplication
    authorUser {
      avatar
      id
      name
    }
    createdAt
    previewUrl
  }
`)

export const modelVersionsQuery = graphql(`
  query ModelVersions(
    $modelId: String!
    $projectId: String!
    $limit: Int!
    $cursor: String
    $filter: ModelVersionsFilter
  ) {
    project(id: $projectId) {
      id
      model(id: $modelId) {
        id
        versions(limit: $limit, cursor: $cursor, filter: $filter) {
          totalCount
          cursor
          items {
            ...VersionListItem
          }
        }
      }
    }
  }
`)

export const objectQuery = graphql(`
  query ObjectQuery($projectId: String!, $objectId: String!) {
    project(id: $projectId) {
      object(id: $objectId) {
        id
        data
      }
    }
  }
`)

export const commentThreadsFragment = graphql(`
  fragment CommentThreadsItem on Comment {
    id
    rawText
    createdAt
    viewerState
    replyAuthors {
      totalCount
      items {
        id
        avatar
      }
    }
    author {
      id
      avatar
      name
    }
    replies {
      totalCount
      items {
        ...CommentRepliesItem
      }
    }
  }
`)

export const commentRepliesFragment = graphql(`
  fragment CommentRepliesItem on Comment {
    id
    rawText
    author {
      id
      avatar
      name
    }
    createdAt
  }
`)

export const commentsQuery = graphql(`
  query CommentsQuery($projectId: String!, $modelId: String!) {
    project(id: $projectId) {
      model(id: $modelId) {
        commentThreads {
          items {
            ...CommentThreadsItem
          }
        }
      }
    }
  }
`)

export const projectAddByUrlQueryWithVersion = graphql(`
  query ProjectAddByUrlQueryWithVersion(
    $projectId: String!
    $modelId: String!
    $versionId: String!
  ) {
    project(id: $projectId) {
      ...ProjectListProjectItem
      model(id: $modelId) {
        ...ModelListModelItem
        version(id: $versionId) {
          ...VersionListItem
        }
      }
    }
  }
`)

export const projectAddByUrlQueryWithoutVersion = graphql(`
  query ProjectAddByUrlQueryWithoutVersion($projectId: String!, $modelId: String!) {
    project(id: $projectId) {
      ...ProjectListProjectItem
      model(id: $modelId) {
        ...ModelListModelItem
      }
    }
  }
`)

export const projectDetailsQuery = graphql(`
  query ProjectDetails($projectId: String!) {
    project(id: $projectId) {
      id
      role
      name
      workspace {
        slug
        readOnly
      }
      team {
        user {
          avatar
          id
          name
        }
      }
      visibility
    }
  }
`)

export const automateFunctionsQuery = graphql(`
  query AutomateFunctions {
    automateFunctions {
      items {
        ...AutomateFunctionItem
      }
    }
  }
`)

export const modelDetailsQuery = graphql(`
  query ModelDetails($modelId: String!, $projectId: String!) {
    project(id: $projectId) {
      id
      name
      model(id: $modelId) {
        id
        displayName
        name
        versions {
          totalCount
          items {
            id
          }
        }
        author {
          id
          name
          avatar
        }
      }
    }
  }
`)

export const versionDetailsQuery = graphql(`
  query VersionDetails($projectId: String!, $versionId: String!, $modelId: String!) {
    project(id: $projectId) {
      id
      name
      model(id: $modelId) {
        id
        name
        versions(limit: 1) {
          items {
            id
            createdAt
            sourceApplication
            authorUser {
              id
            }
          }
        }
        version(id: $versionId) {
          id
          referencedObject
          message
          sourceApplication
          createdAt
          previewUrl
        }
      }
    }
  }
`)

export const serverInfoQuery = graphql(`
  query ServerInfo {
    serverInfo {
      workspaces {
        workspacesEnabled
      }
    }
  }
`)

export const versionCreatedSubscription = graphql(`
  subscription OnProjectVersionsUpdate($projectId: String!) {
    projectVersionsUpdated(id: $projectId) {
      id
      type
      version {
        id
        createdAt
        message
        sourceApplication
        authorUser {
          id
          name
          avatar
        }
        model {
          id
          name
          displayName
        }
      }
    }
  }
`)

export const automateRunsSubscription = graphql(`
  subscription ProjectTriggeredAutomationsStatusUpdated($projectId: String!) {
    projectTriggeredAutomationsStatusUpdated(projectId: $projectId) {
      type
      version {
        id
      }
      model {
        id
      }
      project {
        id
      }
      run {
        ...AutomationRunItem
      }
    }
  }
`)

export const userProjectsUpdatedSubscription = graphql(`
  subscription OnUserProjectsUpdated {
    userProjectsUpdated {
      id
      project {
        id
        visibility
        team {
          id
          role
        }
      }
    }
  }
`)

export const projectUpdatedSubscription = graphql(`
  subscription ProjectUpdated($projectId: String!) {
    projectUpdated(id: $projectId) {
      id
      project {
        visibility
      }
    }
  }
`)

export const modelViewingSubscription = graphql(`
  subscription Subscription($target: ViewerUpdateTrackingTarget!) {
    viewerUserActivityBroadcasted(target: $target) {
      userName
      userId
      sessionId
      user {
        name
        id
        avatar
      }
      status
    }
  }
`)

export const modelCommentCreatedSubscription = graphql(`
  subscription ProjectCommentsUpdated($target: ViewerUpdateTrackingTarget!) {
    projectCommentsUpdated(target: $target) {
      comment {
        author {
          avatar
          id
          name
        }
        id
        hasParent
        parent {
          id
        }
      }
      type
    }
  }
`)
