/* eslint-disable */
import * as types from './graphql';
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

const documents = {
    "\n  query IntegrationStoryDemoServerInfo {\n    serverInfo {\n      blobSizeLimitBytes\n      name\n      company\n      description\n      adminContact\n      canonicalUrl\n      termsOfService\n      inviteOnly\n      version\n    }\n  }\n": types.IntegrationStoryDemoServerInfoDocument,
    "\n  query TestData {\n    testNumber\n    testList {\n      foo\n      bar\n    }\n  }\n": types.TestDataDocument,
    "\n  query IsLoggedIn {\n    activeUser {\n      id\n    }\n  }\n": types.IsLoggedInDocument,
    "\n  query GetActiveUser {\n    activeUser {\n      id\n      name\n      role\n    }\n  }\n": types.GetActiveUserDocument,
};

export function graphql(source: "\n  query IntegrationStoryDemoServerInfo {\n    serverInfo {\n      blobSizeLimitBytes\n      name\n      company\n      description\n      adminContact\n      canonicalUrl\n      termsOfService\n      inviteOnly\n      version\n    }\n  }\n"): (typeof documents)["\n  query IntegrationStoryDemoServerInfo {\n    serverInfo {\n      blobSizeLimitBytes\n      name\n      company\n      description\n      adminContact\n      canonicalUrl\n      termsOfService\n      inviteOnly\n      version\n    }\n  }\n"];
export function graphql(source: "\n  query TestData {\n    testNumber\n    testList {\n      foo\n      bar\n    }\n  }\n"): (typeof documents)["\n  query TestData {\n    testNumber\n    testList {\n      foo\n      bar\n    }\n  }\n"];
export function graphql(source: "\n  query IsLoggedIn {\n    activeUser {\n      id\n    }\n  }\n"): (typeof documents)["\n  query IsLoggedIn {\n    activeUser {\n      id\n    }\n  }\n"];
export function graphql(source: "\n  query GetActiveUser {\n    activeUser {\n      id\n      name\n      role\n    }\n  }\n"): (typeof documents)["\n  query GetActiveUser {\n    activeUser {\n      id\n      name\n      role\n    }\n  }\n"];

export function graphql(source: string): unknown;
export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;