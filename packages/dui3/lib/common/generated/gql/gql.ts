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
 * Therefore it is highly recommended to use the babel-plugin for production.
 */
const documents = {
    "\n  mutation CommitCreate($commit: CommitCreateInput!) {\n    commitCreate(commit: $commit)\n  }\n": types.CommitCreateDocument,
    "\n  mutation CreateVersion($input: VersionCreateInput!) {\n    versionMutations {\n      create(input: $input) {\n        id\n        message\n        referencedObject\n      }\n    }\n  }\n": types.CreateVersionDocument,
    "\n  mutation CreateModel($input: CreateModelInput!) {\n    modelMutations {\n      create(input: $input) {\n        id\n        name\n      }\n    }\n  }\n": types.CreateModelDocument,
    "\n  mutation CreateProject($input: ProjectCreateInput) {\n    projectMutations {\n      create(input: $input) {\n        id\n        name\n      }\n    }\n  }\n": types.CreateProjectDocument,
    "\n  fragment ProjectListProjectItem on Project {\n    id\n    name\n    role\n    updatedAt\n    models {\n      totalCount\n    }\n  }\n": types.ProjectListProjectItemFragmentDoc,
    "\n  query ProjectListQuery($limit: Int!, $filter: UserProjectsFilter, $cursor: String) {\n    activeUser {\n      projects(limit: $limit, filter: $filter, cursor: $cursor) {\n        totalCount\n        cursor\n        items {\n          ...ProjectListProjectItem\n        }\n      }\n    }\n  }\n": types.ProjectListQueryDocument,
    "\n  fragment ModelListModelItem on Model {\n    displayName\n    name\n    id\n    previewUrl\n    updatedAt\n    versions {\n      totalCount\n    }\n  }\n": types.ModelListModelItemFragmentDoc,
    "\n  query ProjectModels(\n    $projectId: String!\n    $cursor: String\n    $limit: Int!\n    $filter: ProjectModelsFilter\n  ) {\n    project(id: $projectId) {\n      id\n      models(cursor: $cursor, limit: $limit, filter: $filter) {\n        totalCount\n        items {\n          ...ModelListModelItem\n        }\n      }\n    }\n  }\n": types.ProjectModelsDocument,
    "\n  fragment VersionListItem on Version {\n    id\n    referencedObject\n    message\n    sourceApplication\n    authorUser {\n      avatar\n      id\n      name\n    }\n    createdAt\n    previewUrl\n  }\n": types.VersionListItemFragmentDoc,
    "\n  query ModelVersions(\n    $modelId: String!\n    $projectId: String!\n    $limit: Int!\n    $cursor: String\n  ) {\n    project(id: $projectId) {\n      id\n      model(id: $modelId) {\n        id\n        versions(limit: $limit, cursor: $cursor) {\n          totalCount\n          cursor\n          items {\n            ...VersionListItem\n          }\n        }\n      }\n    }\n  }\n": types.ModelVersionsDocument,
    "\n  query ProjectDetails($projectId: String!) {\n    project(id: $projectId) {\n      id\n      role\n      name\n      team {\n        user {\n          avatar\n          id\n          name\n        }\n      }\n      visibility\n    }\n  }\n": types.ProjectDetailsDocument,
    "\n  query ModelDetails($modelId: String!, $projectId: String!) {\n    project(id: $projectId) {\n      id\n      name\n      model(id: $modelId) {\n        id\n        displayName\n        versions {\n          totalCount\n        }\n        author {\n          id\n          name\n          avatar\n        }\n      }\n    }\n  }\n": types.ModelDetailsDocument,
    "\n  query VersionDetails($projectId: String!, $versionId: String!, $modelId: String!) {\n    project(id: $projectId) {\n      id\n      name\n      model(id: $modelId) {\n        id\n        name\n        versions(limit: 1) {\n          items {\n            id\n            createdAt\n          }\n        }\n        version(id: $versionId) {\n          id\n          referencedObject\n          message\n          sourceApplication\n          createdAt\n          previewUrl\n        }\n      }\n    }\n  }\n": types.VersionDetailsDocument,
    "\n  subscription OnProjectVersionsUpdate($projectId: String!) {\n    projectVersionsUpdated(id: $projectId) {\n      id\n      type\n      version {\n        id\n        createdAt\n        message\n        sourceApplication\n        authorUser {\n          id\n          name\n          avatar\n        }\n        model {\n          id\n          name\n          displayName\n        }\n      }\n    }\n  }\n": types.OnProjectVersionsUpdateDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = gql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
**/
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CommitCreate($commit: CommitCreateInput!) {\n    commitCreate(commit: $commit)\n  }\n"): (typeof documents)["\n  mutation CommitCreate($commit: CommitCreateInput!) {\n    commitCreate(commit: $commit)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateVersion($input: VersionCreateInput!) {\n    versionMutations {\n      create(input: $input) {\n        id\n        message\n        referencedObject\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation CreateVersion($input: VersionCreateInput!) {\n    versionMutations {\n      create(input: $input) {\n        id\n        message\n        referencedObject\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateModel($input: CreateModelInput!) {\n    modelMutations {\n      create(input: $input) {\n        id\n        name\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation CreateModel($input: CreateModelInput!) {\n    modelMutations {\n      create(input: $input) {\n        id\n        name\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateProject($input: ProjectCreateInput) {\n    projectMutations {\n      create(input: $input) {\n        id\n        name\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation CreateProject($input: ProjectCreateInput) {\n    projectMutations {\n      create(input: $input) {\n        id\n        name\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ProjectListProjectItem on Project {\n    id\n    name\n    role\n    updatedAt\n    models {\n      totalCount\n    }\n  }\n"): (typeof documents)["\n  fragment ProjectListProjectItem on Project {\n    id\n    name\n    role\n    updatedAt\n    models {\n      totalCount\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ProjectListQuery($limit: Int!, $filter: UserProjectsFilter, $cursor: String) {\n    activeUser {\n      projects(limit: $limit, filter: $filter, cursor: $cursor) {\n        totalCount\n        cursor\n        items {\n          ...ProjectListProjectItem\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query ProjectListQuery($limit: Int!, $filter: UserProjectsFilter, $cursor: String) {\n    activeUser {\n      projects(limit: $limit, filter: $filter, cursor: $cursor) {\n        totalCount\n        cursor\n        items {\n          ...ProjectListProjectItem\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ModelListModelItem on Model {\n    displayName\n    name\n    id\n    previewUrl\n    updatedAt\n    versions {\n      totalCount\n    }\n  }\n"): (typeof documents)["\n  fragment ModelListModelItem on Model {\n    displayName\n    name\n    id\n    previewUrl\n    updatedAt\n    versions {\n      totalCount\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ProjectModels(\n    $projectId: String!\n    $cursor: String\n    $limit: Int!\n    $filter: ProjectModelsFilter\n  ) {\n    project(id: $projectId) {\n      id\n      models(cursor: $cursor, limit: $limit, filter: $filter) {\n        totalCount\n        items {\n          ...ModelListModelItem\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query ProjectModels(\n    $projectId: String!\n    $cursor: String\n    $limit: Int!\n    $filter: ProjectModelsFilter\n  ) {\n    project(id: $projectId) {\n      id\n      models(cursor: $cursor, limit: $limit, filter: $filter) {\n        totalCount\n        items {\n          ...ModelListModelItem\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment VersionListItem on Version {\n    id\n    referencedObject\n    message\n    sourceApplication\n    authorUser {\n      avatar\n      id\n      name\n    }\n    createdAt\n    previewUrl\n  }\n"): (typeof documents)["\n  fragment VersionListItem on Version {\n    id\n    referencedObject\n    message\n    sourceApplication\n    authorUser {\n      avatar\n      id\n      name\n    }\n    createdAt\n    previewUrl\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ModelVersions(\n    $modelId: String!\n    $projectId: String!\n    $limit: Int!\n    $cursor: String\n  ) {\n    project(id: $projectId) {\n      id\n      model(id: $modelId) {\n        id\n        versions(limit: $limit, cursor: $cursor) {\n          totalCount\n          cursor\n          items {\n            ...VersionListItem\n          }\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query ModelVersions(\n    $modelId: String!\n    $projectId: String!\n    $limit: Int!\n    $cursor: String\n  ) {\n    project(id: $projectId) {\n      id\n      model(id: $modelId) {\n        id\n        versions(limit: $limit, cursor: $cursor) {\n          totalCount\n          cursor\n          items {\n            ...VersionListItem\n          }\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ProjectDetails($projectId: String!) {\n    project(id: $projectId) {\n      id\n      role\n      name\n      team {\n        user {\n          avatar\n          id\n          name\n        }\n      }\n      visibility\n    }\n  }\n"): (typeof documents)["\n  query ProjectDetails($projectId: String!) {\n    project(id: $projectId) {\n      id\n      role\n      name\n      team {\n        user {\n          avatar\n          id\n          name\n        }\n      }\n      visibility\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ModelDetails($modelId: String!, $projectId: String!) {\n    project(id: $projectId) {\n      id\n      name\n      model(id: $modelId) {\n        id\n        displayName\n        versions {\n          totalCount\n        }\n        author {\n          id\n          name\n          avatar\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query ModelDetails($modelId: String!, $projectId: String!) {\n    project(id: $projectId) {\n      id\n      name\n      model(id: $modelId) {\n        id\n        displayName\n        versions {\n          totalCount\n        }\n        author {\n          id\n          name\n          avatar\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query VersionDetails($projectId: String!, $versionId: String!, $modelId: String!) {\n    project(id: $projectId) {\n      id\n      name\n      model(id: $modelId) {\n        id\n        name\n        versions(limit: 1) {\n          items {\n            id\n            createdAt\n          }\n        }\n        version(id: $versionId) {\n          id\n          referencedObject\n          message\n          sourceApplication\n          createdAt\n          previewUrl\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query VersionDetails($projectId: String!, $versionId: String!, $modelId: String!) {\n    project(id: $projectId) {\n      id\n      name\n      model(id: $modelId) {\n        id\n        name\n        versions(limit: 1) {\n          items {\n            id\n            createdAt\n          }\n        }\n        version(id: $versionId) {\n          id\n          referencedObject\n          message\n          sourceApplication\n          createdAt\n          previewUrl\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription OnProjectVersionsUpdate($projectId: String!) {\n    projectVersionsUpdated(id: $projectId) {\n      id\n      type\n      version {\n        id\n        createdAt\n        message\n        sourceApplication\n        authorUser {\n          id\n          name\n          avatar\n        }\n        model {\n          id\n          name\n          displayName\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  subscription OnProjectVersionsUpdate($projectId: String!) {\n    projectVersionsUpdated(id: $projectId) {\n      id\n      type\n      version {\n        id\n        createdAt\n        message\n        sourceApplication\n        authorUser {\n          id\n          name\n          avatar\n        }\n        model {\n          id\n          name\n          displayName\n        }\n      }\n    }\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;