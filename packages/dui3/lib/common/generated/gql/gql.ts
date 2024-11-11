/* eslint-disable */
import * as types from './graphql';
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 */
const documents = {
    "\n  mutation VersionMutations($input: CreateVersionInput!) {\n    versionMutations {\n      create(input: $input) {\n        id\n      }\n    }\n  }\n": types.VersionMutationsDocument,
    "\n  mutation MarkReceivedVersion($input: MarkReceivedVersionInput!) {\n    versionMutations {\n      markReceived(input: $input)\n    }\n  }\n": types.MarkReceivedVersionDocument,
    "\n  mutation CreateModel($input: CreateModelInput!) {\n    modelMutations {\n      create(input: $input) {\n        ...ModelListModelItem\n      }\n    }\n  }\n": types.CreateModelDocument,
    "\n  mutation CreateProject($input: ProjectCreateInput) {\n    projectMutations {\n      create(input: $input) {\n        ...ProjectListProjectItem\n      }\n    }\n  }\n": types.CreateProjectDocument,
    "\n  mutation StreamAccessRequestCreate($input: String!) {\n    streamAccessRequestCreate(streamId: $input) {\n      id\n    }\n  }\n": types.StreamAccessRequestCreateDocument,
    "\n  fragment WorkspaceListWorkspaceItem on Workspace {\n    id\n    name\n    description\n    createdAt\n    updatedAt\n    logo\n    role\n  }\n": types.WorkspaceListWorkspaceItemFragmentDoc,
    "\n  fragment AutomateFunctionItem on AutomateFunction {\n    name\n    isFeatured\n    id\n    creator {\n      name\n    }\n    releases {\n      items {\n        inputSchema\n      }\n    }\n  }\n": types.AutomateFunctionItemFragmentDoc,
    "\n  mutation CreateAutomation($projectId: ID!, $input: ProjectAutomationCreateInput!) {\n    projectMutations {\n      automationMutations(projectId: $projectId) {\n        create(input: $input) {\n          id\n          name\n        }\n      }\n    }\n  }\n": types.CreateAutomationDocument,
    "\n  fragment AutomateFunctionRunItem on AutomateFunctionRun {\n    id\n    status\n    statusMessage\n    results\n    contextView\n    function {\n      id\n      name\n      logo\n    }\n  }\n": types.AutomateFunctionRunItemFragmentDoc,
    "\n  fragment AutomationRunItem on AutomateRun {\n    id\n    status\n    automation {\n      id\n      name\n    }\n    functionRuns {\n      ...AutomateFunctionRunItem\n    }\n  }\n": types.AutomationRunItemFragmentDoc,
    "\n  query AutomationStatus($projectId: String!, $modelId: String!) {\n    project(id: $projectId) {\n      model(id: $modelId) {\n        automationsStatus {\n          id\n          status\n          automationRuns {\n            ...AutomationRunItem\n          }\n        }\n      }\n    }\n  }\n": types.AutomationStatusDocument,
    "\n  query WorkspaceListQuery(\n    $limit: Int!\n    $filter: UserWorkspacesFilter\n    $cursor: String\n  ) {\n    activeUser {\n      id\n      workspaces(limit: $limit, filter: $filter, cursor: $cursor) {\n        totalCount\n        cursor\n        items {\n          ...WorkspaceListWorkspaceItem\n        }\n      }\n    }\n  }\n": types.WorkspaceListQueryDocument,
    "\n  fragment ProjectListProjectItem on Project {\n    id\n    name\n    role\n    updatedAt\n    workspaceId\n    models {\n      totalCount\n    }\n  }\n": types.ProjectListProjectItemFragmentDoc,
    "\n  query ProjectListQuery($limit: Int!, $filter: UserProjectsFilter, $cursor: String) {\n    activeUser {\n      id\n      projects(limit: $limit, filter: $filter, cursor: $cursor) {\n        totalCount\n        cursor\n        items {\n          ...ProjectListProjectItem\n        }\n      }\n    }\n  }\n": types.ProjectListQueryDocument,
    "\n  fragment ModelListModelItem on Model {\n    displayName\n    name\n    id\n    previewUrl\n    updatedAt\n    versions(limit: 1) {\n      totalCount\n      items {\n        ...VersionListItem\n      }\n    }\n  }\n": types.ModelListModelItemFragmentDoc,
    "\n  query ProjectModels(\n    $projectId: String!\n    $cursor: String\n    $limit: Int!\n    $filter: ProjectModelsFilter\n  ) {\n    project(id: $projectId) {\n      id\n      models(cursor: $cursor, limit: $limit, filter: $filter) {\n        totalCount\n        cursor\n        items {\n          ...ModelListModelItem\n        }\n      }\n    }\n  }\n": types.ProjectModelsDocument,
    "\n  fragment VersionListItem on Version {\n    id\n    referencedObject\n    message\n    sourceApplication\n    authorUser {\n      avatar\n      id\n      name\n    }\n    createdAt\n    previewUrl\n  }\n": types.VersionListItemFragmentDoc,
    "\n  query ModelVersions(\n    $modelId: String!\n    $projectId: String!\n    $limit: Int!\n    $cursor: String\n    $filter: ModelVersionsFilter\n  ) {\n    project(id: $projectId) {\n      id\n      model(id: $modelId) {\n        id\n        versions(limit: $limit, cursor: $cursor, filter: $filter) {\n          totalCount\n          cursor\n          items {\n            ...VersionListItem\n          }\n        }\n      }\n    }\n  }\n": types.ModelVersionsDocument,
    "\n  query ObjectQuery($projectId: String!, $objectId: String!) {\n    project(id: $projectId) {\n      object(id: $objectId) {\n        id\n        data\n      }\n    }\n  }\n": types.ObjectQueryDocument,
    "\n  query ProjectAddByUrlQueryWithVersion(\n    $projectId: String!\n    $modelId: String!\n    $versionId: String!\n  ) {\n    project(id: $projectId) {\n      ...ProjectListProjectItem\n      model(id: $modelId) {\n        ...ModelListModelItem\n        version(id: $versionId) {\n          ...VersionListItem\n        }\n      }\n    }\n  }\n": types.ProjectAddByUrlQueryWithVersionDocument,
    "\n  query ProjectAddByUrlQueryWithoutVersion($projectId: String!, $modelId: String!) {\n    project(id: $projectId) {\n      ...ProjectListProjectItem\n      model(id: $modelId) {\n        ...ModelListModelItem\n      }\n    }\n  }\n": types.ProjectAddByUrlQueryWithoutVersionDocument,
    "\n  query ProjectDetails($projectId: String!) {\n    project(id: $projectId) {\n      id\n      role\n      name\n      team {\n        user {\n          avatar\n          id\n          name\n        }\n      }\n      visibility\n    }\n  }\n": types.ProjectDetailsDocument,
    "\n  query AutomateFunctions {\n    automateFunctions {\n      items {\n        ...AutomateFunctionItem\n      }\n    }\n  }\n": types.AutomateFunctionsDocument,
    "\n  query ModelDetails($modelId: String!, $projectId: String!) {\n    project(id: $projectId) {\n      id\n      name\n      model(id: $modelId) {\n        id\n        displayName\n        name\n        versions {\n          totalCount\n          items {\n            id\n          }\n        }\n        author {\n          id\n          name\n          avatar\n        }\n      }\n    }\n  }\n": types.ModelDetailsDocument,
    "\n  query VersionDetails($projectId: String!, $versionId: String!, $modelId: String!) {\n    project(id: $projectId) {\n      id\n      name\n      model(id: $modelId) {\n        id\n        name\n        versions(limit: 1) {\n          items {\n            id\n            createdAt\n            sourceApplication\n            authorUser {\n              id\n            }\n          }\n        }\n        version(id: $versionId) {\n          id\n          referencedObject\n          message\n          sourceApplication\n          createdAt\n          previewUrl\n        }\n      }\n    }\n  }\n": types.VersionDetailsDocument,
    "\n  subscription OnProjectVersionsUpdate($projectId: String!) {\n    projectVersionsUpdated(id: $projectId) {\n      id\n      type\n      version {\n        id\n        createdAt\n        message\n        sourceApplication\n        authorUser {\n          id\n          name\n          avatar\n        }\n        model {\n          id\n          name\n          displayName\n        }\n      }\n    }\n  }\n": types.OnProjectVersionsUpdateDocument,
    "\n  subscription ProjectTriggeredAutomationsStatusUpdated($projectId: String!) {\n    projectTriggeredAutomationsStatusUpdated(projectId: $projectId) {\n      type\n      version {\n        id\n      }\n      model {\n        id\n      }\n      project {\n        id\n      }\n      run {\n        ...AutomationRunItem\n      }\n    }\n  }\n": types.ProjectTriggeredAutomationsStatusUpdatedDocument,
    "\n  subscription OnUserProjectsUpdated {\n    userProjectsUpdated {\n      id\n      project {\n        id\n        visibility\n        team {\n          id\n          role\n        }\n      }\n    }\n  }\n": types.OnUserProjectsUpdatedDocument,
    "\n  subscription ProjectUpdated($projectId: String!) {\n    projectUpdated(id: $projectId) {\n      id\n      project {\n        visibility\n      }\n    }\n  }\n": types.ProjectUpdatedDocument,
    "\n  subscription Subscription($target: ViewerUpdateTrackingTarget!) {\n    viewerUserActivityBroadcasted(target: $target) {\n      userName\n      userId\n      sessionId\n      user {\n        name\n        id\n        avatar\n      }\n      status\n    }\n  }\n": types.SubscriptionDocument,
    "\n  subscription ProjectCommentsUpdated($target: ViewerUpdateTrackingTarget!) {\n    projectCommentsUpdated(target: $target) {\n      comment {\n        author {\n          avatar\n          id\n          name\n        }\n        id\n        hasParent\n        parent {\n          id\n        }\n      }\n      type\n    }\n  }\n": types.ProjectCommentsUpdatedDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation VersionMutations($input: CreateVersionInput!) {\n    versionMutations {\n      create(input: $input) {\n        id\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation VersionMutations($input: CreateVersionInput!) {\n    versionMutations {\n      create(input: $input) {\n        id\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation MarkReceivedVersion($input: MarkReceivedVersionInput!) {\n    versionMutations {\n      markReceived(input: $input)\n    }\n  }\n"): (typeof documents)["\n  mutation MarkReceivedVersion($input: MarkReceivedVersionInput!) {\n    versionMutations {\n      markReceived(input: $input)\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateModel($input: CreateModelInput!) {\n    modelMutations {\n      create(input: $input) {\n        ...ModelListModelItem\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation CreateModel($input: CreateModelInput!) {\n    modelMutations {\n      create(input: $input) {\n        ...ModelListModelItem\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateProject($input: ProjectCreateInput) {\n    projectMutations {\n      create(input: $input) {\n        ...ProjectListProjectItem\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation CreateProject($input: ProjectCreateInput) {\n    projectMutations {\n      create(input: $input) {\n        ...ProjectListProjectItem\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation StreamAccessRequestCreate($input: String!) {\n    streamAccessRequestCreate(streamId: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation StreamAccessRequestCreate($input: String!) {\n    streamAccessRequestCreate(streamId: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment WorkspaceListWorkspaceItem on Workspace {\n    id\n    name\n    description\n    createdAt\n    updatedAt\n    logo\n    role\n  }\n"): (typeof documents)["\n  fragment WorkspaceListWorkspaceItem on Workspace {\n    id\n    name\n    description\n    createdAt\n    updatedAt\n    logo\n    role\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment AutomateFunctionItem on AutomateFunction {\n    name\n    isFeatured\n    id\n    creator {\n      name\n    }\n    releases {\n      items {\n        inputSchema\n      }\n    }\n  }\n"): (typeof documents)["\n  fragment AutomateFunctionItem on AutomateFunction {\n    name\n    isFeatured\n    id\n    creator {\n      name\n    }\n    releases {\n      items {\n        inputSchema\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateAutomation($projectId: ID!, $input: ProjectAutomationCreateInput!) {\n    projectMutations {\n      automationMutations(projectId: $projectId) {\n        create(input: $input) {\n          id\n          name\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation CreateAutomation($projectId: ID!, $input: ProjectAutomationCreateInput!) {\n    projectMutations {\n      automationMutations(projectId: $projectId) {\n        create(input: $input) {\n          id\n          name\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment AutomateFunctionRunItem on AutomateFunctionRun {\n    id\n    status\n    statusMessage\n    results\n    contextView\n    function {\n      id\n      name\n      logo\n    }\n  }\n"): (typeof documents)["\n  fragment AutomateFunctionRunItem on AutomateFunctionRun {\n    id\n    status\n    statusMessage\n    results\n    contextView\n    function {\n      id\n      name\n      logo\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment AutomationRunItem on AutomateRun {\n    id\n    status\n    automation {\n      id\n      name\n    }\n    functionRuns {\n      ...AutomateFunctionRunItem\n    }\n  }\n"): (typeof documents)["\n  fragment AutomationRunItem on AutomateRun {\n    id\n    status\n    automation {\n      id\n      name\n    }\n    functionRuns {\n      ...AutomateFunctionRunItem\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AutomationStatus($projectId: String!, $modelId: String!) {\n    project(id: $projectId) {\n      model(id: $modelId) {\n        automationsStatus {\n          id\n          status\n          automationRuns {\n            ...AutomationRunItem\n          }\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query AutomationStatus($projectId: String!, $modelId: String!) {\n    project(id: $projectId) {\n      model(id: $modelId) {\n        automationsStatus {\n          id\n          status\n          automationRuns {\n            ...AutomationRunItem\n          }\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query WorkspaceListQuery(\n    $limit: Int!\n    $filter: UserWorkspacesFilter\n    $cursor: String\n  ) {\n    activeUser {\n      id\n      workspaces(limit: $limit, filter: $filter, cursor: $cursor) {\n        totalCount\n        cursor\n        items {\n          ...WorkspaceListWorkspaceItem\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query WorkspaceListQuery(\n    $limit: Int!\n    $filter: UserWorkspacesFilter\n    $cursor: String\n  ) {\n    activeUser {\n      id\n      workspaces(limit: $limit, filter: $filter, cursor: $cursor) {\n        totalCount\n        cursor\n        items {\n          ...WorkspaceListWorkspaceItem\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ProjectListProjectItem on Project {\n    id\n    name\n    role\n    updatedAt\n    workspaceId\n    models {\n      totalCount\n    }\n  }\n"): (typeof documents)["\n  fragment ProjectListProjectItem on Project {\n    id\n    name\n    role\n    updatedAt\n    workspaceId\n    models {\n      totalCount\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ProjectListQuery($limit: Int!, $filter: UserProjectsFilter, $cursor: String) {\n    activeUser {\n      id\n      projects(limit: $limit, filter: $filter, cursor: $cursor) {\n        totalCount\n        cursor\n        items {\n          ...ProjectListProjectItem\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query ProjectListQuery($limit: Int!, $filter: UserProjectsFilter, $cursor: String) {\n    activeUser {\n      id\n      projects(limit: $limit, filter: $filter, cursor: $cursor) {\n        totalCount\n        cursor\n        items {\n          ...ProjectListProjectItem\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ModelListModelItem on Model {\n    displayName\n    name\n    id\n    previewUrl\n    updatedAt\n    versions(limit: 1) {\n      totalCount\n      items {\n        ...VersionListItem\n      }\n    }\n  }\n"): (typeof documents)["\n  fragment ModelListModelItem on Model {\n    displayName\n    name\n    id\n    previewUrl\n    updatedAt\n    versions(limit: 1) {\n      totalCount\n      items {\n        ...VersionListItem\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ProjectModels(\n    $projectId: String!\n    $cursor: String\n    $limit: Int!\n    $filter: ProjectModelsFilter\n  ) {\n    project(id: $projectId) {\n      id\n      models(cursor: $cursor, limit: $limit, filter: $filter) {\n        totalCount\n        cursor\n        items {\n          ...ModelListModelItem\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query ProjectModels(\n    $projectId: String!\n    $cursor: String\n    $limit: Int!\n    $filter: ProjectModelsFilter\n  ) {\n    project(id: $projectId) {\n      id\n      models(cursor: $cursor, limit: $limit, filter: $filter) {\n        totalCount\n        cursor\n        items {\n          ...ModelListModelItem\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment VersionListItem on Version {\n    id\n    referencedObject\n    message\n    sourceApplication\n    authorUser {\n      avatar\n      id\n      name\n    }\n    createdAt\n    previewUrl\n  }\n"): (typeof documents)["\n  fragment VersionListItem on Version {\n    id\n    referencedObject\n    message\n    sourceApplication\n    authorUser {\n      avatar\n      id\n      name\n    }\n    createdAt\n    previewUrl\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ModelVersions(\n    $modelId: String!\n    $projectId: String!\n    $limit: Int!\n    $cursor: String\n    $filter: ModelVersionsFilter\n  ) {\n    project(id: $projectId) {\n      id\n      model(id: $modelId) {\n        id\n        versions(limit: $limit, cursor: $cursor, filter: $filter) {\n          totalCount\n          cursor\n          items {\n            ...VersionListItem\n          }\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query ModelVersions(\n    $modelId: String!\n    $projectId: String!\n    $limit: Int!\n    $cursor: String\n    $filter: ModelVersionsFilter\n  ) {\n    project(id: $projectId) {\n      id\n      model(id: $modelId) {\n        id\n        versions(limit: $limit, cursor: $cursor, filter: $filter) {\n          totalCount\n          cursor\n          items {\n            ...VersionListItem\n          }\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ObjectQuery($projectId: String!, $objectId: String!) {\n    project(id: $projectId) {\n      object(id: $objectId) {\n        id\n        data\n      }\n    }\n  }\n"): (typeof documents)["\n  query ObjectQuery($projectId: String!, $objectId: String!) {\n    project(id: $projectId) {\n      object(id: $objectId) {\n        id\n        data\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ProjectAddByUrlQueryWithVersion(\n    $projectId: String!\n    $modelId: String!\n    $versionId: String!\n  ) {\n    project(id: $projectId) {\n      ...ProjectListProjectItem\n      model(id: $modelId) {\n        ...ModelListModelItem\n        version(id: $versionId) {\n          ...VersionListItem\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query ProjectAddByUrlQueryWithVersion(\n    $projectId: String!\n    $modelId: String!\n    $versionId: String!\n  ) {\n    project(id: $projectId) {\n      ...ProjectListProjectItem\n      model(id: $modelId) {\n        ...ModelListModelItem\n        version(id: $versionId) {\n          ...VersionListItem\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ProjectAddByUrlQueryWithoutVersion($projectId: String!, $modelId: String!) {\n    project(id: $projectId) {\n      ...ProjectListProjectItem\n      model(id: $modelId) {\n        ...ModelListModelItem\n      }\n    }\n  }\n"): (typeof documents)["\n  query ProjectAddByUrlQueryWithoutVersion($projectId: String!, $modelId: String!) {\n    project(id: $projectId) {\n      ...ProjectListProjectItem\n      model(id: $modelId) {\n        ...ModelListModelItem\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ProjectDetails($projectId: String!) {\n    project(id: $projectId) {\n      id\n      role\n      name\n      team {\n        user {\n          avatar\n          id\n          name\n        }\n      }\n      visibility\n    }\n  }\n"): (typeof documents)["\n  query ProjectDetails($projectId: String!) {\n    project(id: $projectId) {\n      id\n      role\n      name\n      team {\n        user {\n          avatar\n          id\n          name\n        }\n      }\n      visibility\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AutomateFunctions {\n    automateFunctions {\n      items {\n        ...AutomateFunctionItem\n      }\n    }\n  }\n"): (typeof documents)["\n  query AutomateFunctions {\n    automateFunctions {\n      items {\n        ...AutomateFunctionItem\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ModelDetails($modelId: String!, $projectId: String!) {\n    project(id: $projectId) {\n      id\n      name\n      model(id: $modelId) {\n        id\n        displayName\n        name\n        versions {\n          totalCount\n          items {\n            id\n          }\n        }\n        author {\n          id\n          name\n          avatar\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query ModelDetails($modelId: String!, $projectId: String!) {\n    project(id: $projectId) {\n      id\n      name\n      model(id: $modelId) {\n        id\n        displayName\n        name\n        versions {\n          totalCount\n          items {\n            id\n          }\n        }\n        author {\n          id\n          name\n          avatar\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query VersionDetails($projectId: String!, $versionId: String!, $modelId: String!) {\n    project(id: $projectId) {\n      id\n      name\n      model(id: $modelId) {\n        id\n        name\n        versions(limit: 1) {\n          items {\n            id\n            createdAt\n            sourceApplication\n            authorUser {\n              id\n            }\n          }\n        }\n        version(id: $versionId) {\n          id\n          referencedObject\n          message\n          sourceApplication\n          createdAt\n          previewUrl\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query VersionDetails($projectId: String!, $versionId: String!, $modelId: String!) {\n    project(id: $projectId) {\n      id\n      name\n      model(id: $modelId) {\n        id\n        name\n        versions(limit: 1) {\n          items {\n            id\n            createdAt\n            sourceApplication\n            authorUser {\n              id\n            }\n          }\n        }\n        version(id: $versionId) {\n          id\n          referencedObject\n          message\n          sourceApplication\n          createdAt\n          previewUrl\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription OnProjectVersionsUpdate($projectId: String!) {\n    projectVersionsUpdated(id: $projectId) {\n      id\n      type\n      version {\n        id\n        createdAt\n        message\n        sourceApplication\n        authorUser {\n          id\n          name\n          avatar\n        }\n        model {\n          id\n          name\n          displayName\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  subscription OnProjectVersionsUpdate($projectId: String!) {\n    projectVersionsUpdated(id: $projectId) {\n      id\n      type\n      version {\n        id\n        createdAt\n        message\n        sourceApplication\n        authorUser {\n          id\n          name\n          avatar\n        }\n        model {\n          id\n          name\n          displayName\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription ProjectTriggeredAutomationsStatusUpdated($projectId: String!) {\n    projectTriggeredAutomationsStatusUpdated(projectId: $projectId) {\n      type\n      version {\n        id\n      }\n      model {\n        id\n      }\n      project {\n        id\n      }\n      run {\n        ...AutomationRunItem\n      }\n    }\n  }\n"): (typeof documents)["\n  subscription ProjectTriggeredAutomationsStatusUpdated($projectId: String!) {\n    projectTriggeredAutomationsStatusUpdated(projectId: $projectId) {\n      type\n      version {\n        id\n      }\n      model {\n        id\n      }\n      project {\n        id\n      }\n      run {\n        ...AutomationRunItem\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription OnUserProjectsUpdated {\n    userProjectsUpdated {\n      id\n      project {\n        id\n        visibility\n        team {\n          id\n          role\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  subscription OnUserProjectsUpdated {\n    userProjectsUpdated {\n      id\n      project {\n        id\n        visibility\n        team {\n          id\n          role\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription ProjectUpdated($projectId: String!) {\n    projectUpdated(id: $projectId) {\n      id\n      project {\n        visibility\n      }\n    }\n  }\n"): (typeof documents)["\n  subscription ProjectUpdated($projectId: String!) {\n    projectUpdated(id: $projectId) {\n      id\n      project {\n        visibility\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription Subscription($target: ViewerUpdateTrackingTarget!) {\n    viewerUserActivityBroadcasted(target: $target) {\n      userName\n      userId\n      sessionId\n      user {\n        name\n        id\n        avatar\n      }\n      status\n    }\n  }\n"): (typeof documents)["\n  subscription Subscription($target: ViewerUpdateTrackingTarget!) {\n    viewerUserActivityBroadcasted(target: $target) {\n      userName\n      userId\n      sessionId\n      user {\n        name\n        id\n        avatar\n      }\n      status\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription ProjectCommentsUpdated($target: ViewerUpdateTrackingTarget!) {\n    projectCommentsUpdated(target: $target) {\n      comment {\n        author {\n          avatar\n          id\n          name\n        }\n        id\n        hasParent\n        parent {\n          id\n        }\n      }\n      type\n    }\n  }\n"): (typeof documents)["\n  subscription ProjectCommentsUpdated($target: ViewerUpdateTrackingTarget!) {\n    projectCommentsUpdated(target: $target) {\n      comment {\n        author {\n          avatar\n          id\n          name\n        }\n        id\n        hasParent\n        parent {\n          id\n        }\n      }\n      type\n    }\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;