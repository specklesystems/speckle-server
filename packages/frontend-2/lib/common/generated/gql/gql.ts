/* eslint-disable */
import * as types from './graphql';
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

const documents = {
    "\n  query TestData {\n    testNumber\n    testList {\n      foo\n      bar\n    }\n  }\n": types.TestDataDocument,
    "\n  query ProjectsDashboardList {\n    projects {\n      ...ProjectListItemFragment\n    }\n  }\n": types.ProjectsDashboardListDocument,
    "\n  query IsLoggedIn {\n    activeUser {\n      id\n    }\n  }\n": types.IsLoggedInDocument,
    "\n  fragment ProjectListItemFragment on Project {\n    id\n    name\n    modelCount\n    role\n    editedAt\n    team {\n      id\n      name\n      avatar\n    }\n  }\n": types.ProjectListItemFragmentFragmentDoc,
    "\n  query GetActiveUser {\n    activeUser {\n      id\n      name\n      role\n    }\n  }\n": types.GetActiveUserDocument,
    "\n    query ProjectLandingPage($id: String!) {\n      project(id: $id) {\n        id\n        name\n        modelCount\n        role\n        editedAt\n        team {\n          id\n          name\n        }\n      }\n    }\n  ": types.ProjectLandingPageDocument,
};

export function graphql(source: "\n  query TestData {\n    testNumber\n    testList {\n      foo\n      bar\n    }\n  }\n"): (typeof documents)["\n  query TestData {\n    testNumber\n    testList {\n      foo\n      bar\n    }\n  }\n"];
export function graphql(source: "\n  query ProjectsDashboardList {\n    projects {\n      ...ProjectListItemFragment\n    }\n  }\n"): (typeof documents)["\n  query ProjectsDashboardList {\n    projects {\n      ...ProjectListItemFragment\n    }\n  }\n"];
export function graphql(source: "\n  query IsLoggedIn {\n    activeUser {\n      id\n    }\n  }\n"): (typeof documents)["\n  query IsLoggedIn {\n    activeUser {\n      id\n    }\n  }\n"];
export function graphql(source: "\n  fragment ProjectListItemFragment on Project {\n    id\n    name\n    modelCount\n    role\n    editedAt\n    team {\n      id\n      name\n      avatar\n    }\n  }\n"): (typeof documents)["\n  fragment ProjectListItemFragment on Project {\n    id\n    name\n    modelCount\n    role\n    editedAt\n    team {\n      id\n      name\n      avatar\n    }\n  }\n"];
export function graphql(source: "\n  query GetActiveUser {\n    activeUser {\n      id\n      name\n      role\n    }\n  }\n"): (typeof documents)["\n  query GetActiveUser {\n    activeUser {\n      id\n      name\n      role\n    }\n  }\n"];
export function graphql(source: "\n    query ProjectLandingPage($id: String!) {\n      project(id: $id) {\n        id\n        name\n        modelCount\n        role\n        editedAt\n        team {\n          id\n          name\n        }\n      }\n    }\n  "): (typeof documents)["\n    query ProjectLandingPage($id: String!) {\n      project(id: $id) {\n        id\n        name\n        modelCount\n        role\n        editedAt\n        team {\n          id\n          name\n        }\n      }\n    }\n  "];

export function graphql(source: string): unknown;
export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;