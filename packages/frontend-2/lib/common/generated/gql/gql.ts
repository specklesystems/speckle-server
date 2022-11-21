/* eslint-disable */
import * as types from './graphql';
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

const documents = {
    "\n  fragment IntegrationStoryDemoServerInfoQueryFragment on ServerInfo {\n    blobSizeLimitBytes\n    name\n    company\n    description\n    adminContact\n    canonicalUrl\n    termsOfService\n    inviteOnly\n    version\n  }\n": types.IntegrationStoryDemoServerInfoQueryFragmentFragmentDoc,
    "\n  query LoginServerInfo {\n    serverInfo {\n      ...AuthStategiesServerInfoFragment\n    }\n  }\n": types.LoginServerInfoDocument,
    "\n  query EmailVerificationBannerState {\n    activeUser {\n      id\n      email\n      verified\n      hasPendingVerification\n    }\n  }\n": types.EmailVerificationBannerStateDocument,
    "\n  mutation RequestVerification {\n    requestVerification\n  }\n": types.RequestVerificationDocument,
    "\n  fragment AuthStategiesServerInfoFragment on ServerInfo {\n    authStrategies {\n      id\n      name\n      url\n    }\n  }\n": types.AuthStategiesServerInfoFragmentFragmentDoc,
    "\n  query ProjectsDashboardList {\n    projects {\n      ...ProjectListItemFragment\n    }\n  }\n": types.ProjectsDashboardListDocument,
    "\n  fragment ProjectListItemFragment on Project {\n    id\n    name\n    modelCount\n    role\n    editedAt\n    team {\n      id\n      name\n      avatar\n    }\n  }\n": types.ProjectListItemFragmentFragmentDoc,
    "\n  query ActiveUserMainMetadata {\n    activeUser {\n      id\n      email\n      name\n      role\n      avatar\n    }\n  }\n": types.ActiveUserMainMetadataDocument,
    "\n  query InternalTestData {\n    testNumber\n    testList {\n      foo\n      bar\n    }\n  }\n": types.InternalTestDataDocument,
    "\n  query GetActiveUser {\n    activeUser {\n      id\n      name\n      role\n    }\n  }\n": types.GetActiveUserDocument,
    "\n    query ProjectLandingPage($id: String!) {\n      project(id: $id) {\n        id\n        name\n        modelCount\n        role\n        editedAt\n        team {\n          id\n          name\n        }\n      }\n    }\n  ": types.ProjectLandingPageDocument,
};

export function graphql(source: "\n  fragment IntegrationStoryDemoServerInfoQueryFragment on ServerInfo {\n    blobSizeLimitBytes\n    name\n    company\n    description\n    adminContact\n    canonicalUrl\n    termsOfService\n    inviteOnly\n    version\n  }\n"): (typeof documents)["\n  fragment IntegrationStoryDemoServerInfoQueryFragment on ServerInfo {\n    blobSizeLimitBytes\n    name\n    company\n    description\n    adminContact\n    canonicalUrl\n    termsOfService\n    inviteOnly\n    version\n  }\n"];
export function graphql(source: "\n  query LoginServerInfo {\n    serverInfo {\n      ...AuthStategiesServerInfoFragment\n    }\n  }\n"): (typeof documents)["\n  query LoginServerInfo {\n    serverInfo {\n      ...AuthStategiesServerInfoFragment\n    }\n  }\n"];
export function graphql(source: "\n  query EmailVerificationBannerState {\n    activeUser {\n      id\n      email\n      verified\n      hasPendingVerification\n    }\n  }\n"): (typeof documents)["\n  query EmailVerificationBannerState {\n    activeUser {\n      id\n      email\n      verified\n      hasPendingVerification\n    }\n  }\n"];
export function graphql(source: "\n  mutation RequestVerification {\n    requestVerification\n  }\n"): (typeof documents)["\n  mutation RequestVerification {\n    requestVerification\n  }\n"];
export function graphql(source: "\n  fragment AuthStategiesServerInfoFragment on ServerInfo {\n    authStrategies {\n      id\n      name\n      url\n    }\n  }\n"): (typeof documents)["\n  fragment AuthStategiesServerInfoFragment on ServerInfo {\n    authStrategies {\n      id\n      name\n      url\n    }\n  }\n"];
export function graphql(source: "\n  query ProjectsDashboardList {\n    projects {\n      ...ProjectListItemFragment\n    }\n  }\n"): (typeof documents)["\n  query ProjectsDashboardList {\n    projects {\n      ...ProjectListItemFragment\n    }\n  }\n"];
export function graphql(source: "\n  fragment ProjectListItemFragment on Project {\n    id\n    name\n    modelCount\n    role\n    editedAt\n    team {\n      id\n      name\n      avatar\n    }\n  }\n"): (typeof documents)["\n  fragment ProjectListItemFragment on Project {\n    id\n    name\n    modelCount\n    role\n    editedAt\n    team {\n      id\n      name\n      avatar\n    }\n  }\n"];
export function graphql(source: "\n  query ActiveUserMainMetadata {\n    activeUser {\n      id\n      email\n      name\n      role\n      avatar\n    }\n  }\n"): (typeof documents)["\n  query ActiveUserMainMetadata {\n    activeUser {\n      id\n      email\n      name\n      role\n      avatar\n    }\n  }\n"];
export function graphql(source: "\n  query InternalTestData {\n    testNumber\n    testList {\n      foo\n      bar\n    }\n  }\n"): (typeof documents)["\n  query InternalTestData {\n    testNumber\n    testList {\n      foo\n      bar\n    }\n  }\n"];
export function graphql(source: "\n  query GetActiveUser {\n    activeUser {\n      id\n      name\n      role\n    }\n  }\n"): (typeof documents)["\n  query GetActiveUser {\n    activeUser {\n      id\n      name\n      role\n    }\n  }\n"];
export function graphql(source: "\n    query ProjectLandingPage($id: String!) {\n      project(id: $id) {\n        id\n        name\n        modelCount\n        role\n        editedAt\n        team {\n          id\n          name\n        }\n      }\n    }\n  "): (typeof documents)["\n    query ProjectLandingPage($id: String!) {\n      project(id: $id) {\n        id\n        name\n        modelCount\n        role\n        editedAt\n        team {\n          id\n          name\n        }\n      }\n    }\n  "];

export function graphql(source: string): unknown;
export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;