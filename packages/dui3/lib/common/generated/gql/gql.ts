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
    "\n  query ProjectsList($query: String, $limit: Int, $cursor: String) {\n    streams(query: $query, limit: $limit, cursor: $cursor) {\n      totalCount\n      cursor\n      items {\n        id\n        name\n      }\n    }\n  }\n": types.ProjectsListDocument,
    "\n  query ProjectModels($projectId: String!, $filter: ProjectModelsFilter) {\n    project(id: $projectId) {\n      models(filter: $filter) {\n        items {\n          id\n          name\n        }\n      }\n    }\n  }\n": types.ProjectModelsDocument,
    "\n  query ModelVersions($projectId: String!, $modelId: String!) {\n    project(id: $projectId) {\n      model(id: $modelId) {\n        versions {\n          items {\n            id\n            message\n            referencedObject\n            createdAt\n            previewUrl\n            sourceApplication\n          }\n        }\n      }\n    }\n  }\n": types.ModelVersionsDocument,
    "\n  query ProjectDetails($projectId: String!) {\n    project(id: $projectId) {\n      id\n      role\n      name\n      team {\n        user {\n          avatar\n          id\n          name\n        }\n      }\n      visibility\n    }\n  }\n": types.ProjectDetailsDocument,
    "\n  query ModelDetails($modelId: String!, $projectId: String!) {\n    project(id: $projectId) {\n      id\n      model(id: $modelId) {\n        id\n        displayName\n        versions {\n          totalCount\n        }\n        author {\n          id\n          name\n          avatar\n        }\n      }\n    }\n  }\n": types.ModelDetailsDocument,
    "\n  subscription OnProjectVersionsUpdate($id: String!) {\n    projectVersionsUpdated(id: $id) {\n      id\n      modelId\n      type\n      version {\n        id\n        model {\n          id\n        }\n      }\n    }\n  }\n": types.OnProjectVersionsUpdateDocument,
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
export function graphql(source: "\n  query ProjectsList($query: String, $limit: Int, $cursor: String) {\n    streams(query: $query, limit: $limit, cursor: $cursor) {\n      totalCount\n      cursor\n      items {\n        id\n        name\n      }\n    }\n  }\n"): (typeof documents)["\n  query ProjectsList($query: String, $limit: Int, $cursor: String) {\n    streams(query: $query, limit: $limit, cursor: $cursor) {\n      totalCount\n      cursor\n      items {\n        id\n        name\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ProjectModels($projectId: String!, $filter: ProjectModelsFilter) {\n    project(id: $projectId) {\n      models(filter: $filter) {\n        items {\n          id\n          name\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query ProjectModels($projectId: String!, $filter: ProjectModelsFilter) {\n    project(id: $projectId) {\n      models(filter: $filter) {\n        items {\n          id\n          name\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ModelVersions($projectId: String!, $modelId: String!) {\n    project(id: $projectId) {\n      model(id: $modelId) {\n        versions {\n          items {\n            id\n            message\n            referencedObject\n            createdAt\n            previewUrl\n            sourceApplication\n          }\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query ModelVersions($projectId: String!, $modelId: String!) {\n    project(id: $projectId) {\n      model(id: $modelId) {\n        versions {\n          items {\n            id\n            message\n            referencedObject\n            createdAt\n            previewUrl\n            sourceApplication\n          }\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ProjectDetails($projectId: String!) {\n    project(id: $projectId) {\n      id\n      role\n      name\n      team {\n        user {\n          avatar\n          id\n          name\n        }\n      }\n      visibility\n    }\n  }\n"): (typeof documents)["\n  query ProjectDetails($projectId: String!) {\n    project(id: $projectId) {\n      id\n      role\n      name\n      team {\n        user {\n          avatar\n          id\n          name\n        }\n      }\n      visibility\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ModelDetails($modelId: String!, $projectId: String!) {\n    project(id: $projectId) {\n      id\n      model(id: $modelId) {\n        id\n        displayName\n        versions {\n          totalCount\n        }\n        author {\n          id\n          name\n          avatar\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query ModelDetails($modelId: String!, $projectId: String!) {\n    project(id: $projectId) {\n      id\n      model(id: $modelId) {\n        id\n        displayName\n        versions {\n          totalCount\n        }\n        author {\n          id\n          name\n          avatar\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription OnProjectVersionsUpdate($id: String!) {\n    projectVersionsUpdated(id: $id) {\n      id\n      modelId\n      type\n      version {\n        id\n        model {\n          id\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  subscription OnProjectVersionsUpdate($id: String!) {\n    projectVersionsUpdated(id: $id) {\n      id\n      modelId\n      type\n      version {\n        id\n        model {\n          id\n        }\n      }\n    }\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;