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
    "\n  fragment IntegrationStoryDemoServerInfoQueryFragment on ServerInfo {\n    blobSizeLimitBytes\n    name\n    company\n    description\n    adminContact\n    canonicalUrl\n    termsOfService\n    inviteOnly\n    version\n  }\n": types.IntegrationStoryDemoServerInfoQueryFragmentFragmentDoc,
    "\n  fragment ServerTermsOfServicePrivacyPolicyFragment on ServerInfo {\n    termsOfService\n  }\n": types.ServerTermsOfServicePrivacyPolicyFragmentFragmentDoc,
    "\n  query EmailVerificationBannerState {\n    activeUser {\n      id\n      email\n      verified\n      hasPendingVerification\n    }\n  }\n": types.EmailVerificationBannerStateDocument,
    "\n  mutation RequestVerification {\n    requestVerification\n  }\n": types.RequestVerificationDocument,
    "\n  fragment AuthStategiesServerInfoFragment on ServerInfo {\n    authStrategies {\n      id\n      name\n      url\n    }\n  }\n": types.AuthStategiesServerInfoFragmentFragmentDoc,
    "\n  fragment FormUsersSelectItem on LimitedUser {\n    id\n    name\n    avatar\n  }\n": types.FormUsersSelectItemFragmentDoc,
    "\n  query ProjectsDashboardList {\n    projects {\n      ...ProjectListItemFragment\n    }\n  }\n": types.ProjectsDashboardListDocument,
    "\n  fragment ProjectListItemFragment on Project {\n    id\n    name\n    modelCount\n    role\n    updatedAt\n    team {\n      id\n      name\n      avatar\n    }\n  }\n": types.ProjectListItemFragmentFragmentDoc,
    "\n  fragment ProjectPageProjectHeader on Project {\n    id\n    name\n    description\n  }\n": types.ProjectPageProjectHeaderFragmentDoc,
    "\n  fragment ProjectPageLatestItemsComments on Project {\n    id\n    commentThreadCount\n  }\n": types.ProjectPageLatestItemsCommentsFragmentDoc,
    "\n  fragment ProjectPageLatestItemsCommentItem on Comment {\n    id\n    author {\n      ...FormUsersSelectItem\n    }\n    screenshot\n    rawText\n    createdAt\n    repliesCount\n    replyAuthors(limit: 4) {\n      totalCount\n      items {\n        ...FormUsersSelectItem\n      }\n    }\n  }\n": types.ProjectPageLatestItemsCommentItemFragmentDoc,
    "\n  fragment ProjectPageLatestItemsModels on Project {\n    id\n    modelCount\n    sourceApps\n    team {\n      ...FormUsersSelectItem\n    }\n  }\n": types.ProjectPageLatestItemsModelsFragmentDoc,
    "\n  fragment ProjectPageLatestItemsModelItem on Model {\n    id\n    name\n    versionCount\n    commentThreadCount\n    previewUrl\n    createdAt\n    updatedAt\n  }\n": types.ProjectPageLatestItemsModelItemFragmentDoc,
    "\n  fragment ModelPreview on Model {\n    previewUrl\n  }\n": types.ModelPreviewFragmentDoc,
    "\n  fragment SingleLevelModelTreeItem on ModelsTreeItem {\n    name\n    fullName\n    model {\n      ...ProjectModelsViewModelItem\n    }\n    hasChildren\n    updatedAt\n  }\n": types.SingleLevelModelTreeItemFragmentDoc,
    "\n  fragment ProjectPageModelsView on Project {\n    id\n    modelCount\n    sourceApps\n    team {\n      ...FormUsersSelectItem\n    }\n  }\n": types.ProjectPageModelsViewFragmentDoc,
    "\n  fragment ProjectModelsViewModelItem on Model {\n    id\n    name\n    versionCount\n    commentThreadCount\n    previewUrl\n    updatedAt\n  }\n": types.ProjectModelsViewModelItemFragmentDoc,
    "\n  fragment ProjectPageStatsBlockComments on Project {\n    commentThreadCount\n  }\n": types.ProjectPageStatsBlockCommentsFragmentDoc,
    "\n  fragment ProjectPageStatsBlockModels on Project {\n    modelCount\n  }\n": types.ProjectPageStatsBlockModelsFragmentDoc,
    "\n  fragment ProjectPageStatsBlockTeam on Project {\n    role\n    team {\n      id\n      name\n      avatar\n    }\n    role\n  }\n": types.ProjectPageStatsBlockTeamFragmentDoc,
    "\n  fragment ProjectPageStatsBlockVersions on Project {\n    versionCount\n  }\n": types.ProjectPageStatsBlockVersionsFragmentDoc,
    "\n  mutation CreateOnboardingProject {\n    projectMutations {\n      createForOnboarding {\n        ...ProjectPageProject\n        ...ProjectDashboardItem\n      }\n    }\n  }\n": types.CreateOnboardingProjectDocument,
    "\n  fragment ProjectDashboardItem on Project {\n    id\n    name\n    createdAt\n    updatedAt\n    role\n    team {\n      id\n      name\n      avatar\n    }\n    models(limit: 100) {\n      totalCount\n      items {\n        id\n        name\n        author {\n          id\n          name\n          avatar\n        }\n        commentThreadCount\n        versionCount\n        updatedAt\n        createdAt\n        previewUrl\n      }\n    }\n  }\n": types.ProjectDashboardItemFragmentDoc,
    "\n  fragment ProjectsDashboardFilled on ProjectCollection {\n    items {\n      ...ProjectDashboardItem\n    }\n  }\n": types.ProjectsDashboardFilledFragmentDoc,
    "\n  fragment LimitedUserAvatar on LimitedUser {\n    id\n    name\n    avatar\n  }\n": types.LimitedUserAvatarFragmentDoc,
    "\n  fragment ActiveUserAvatar on User {\n    id\n    name\n    avatar\n  }\n": types.ActiveUserAvatarFragmentDoc,
    "\n  query ActiveUserMainMetadata {\n    activeUser {\n      id\n      email\n      name\n      role\n      avatar\n      isOnboardingFinished\n      createdAt\n    }\n  }\n": types.ActiveUserMainMetadataDocument,
    "\n  mutation FinishOnboarding {\n    activeUserMutations {\n      finishOnboarding\n    }\n  }\n": types.FinishOnboardingDocument,
    "\n  query AuthServerInfo {\n    serverInfo {\n      ...AuthStategiesServerInfoFragment\n      ...ServerTermsOfServicePrivacyPolicyFragment\n    }\n  }\n": types.AuthServerInfoDocument,
    "\n  query InternalTestData {\n    testNumber\n    testList {\n      foo\n      bar\n    }\n  }\n": types.InternalTestDataDocument,
    "\n  query ProjectsDashboardQuery {\n    activeUser {\n      id\n      projects {\n        totalCount\n        items {\n          ...ProjectDashboardItem\n        }\n      }\n    }\n  }\n": types.ProjectsDashboardQueryDocument,
    "\n  query ProjectPageQuery($id: String!) {\n    project(id: $id) {\n      ...ProjectPageProject\n    }\n  }\n": types.ProjectPageQueryDocument,
    "\n  query ModelPageProjectQuery($id: String!) {\n    project(id: $id) {\n      ...ModelPageProject\n    }\n  }\n": types.ModelPageProjectQueryDocument,
    "\n  query ProjectLatestModels($projectId: String!, $filter: ProjectModelsFilter) {\n    project(id: $projectId) {\n      id\n      models(cursor: null, limit: 8, filter: $filter) {\n        totalCount\n        cursor\n        items {\n          ...ProjectPageLatestItemsModelItem\n        }\n      }\n    }\n  }\n": types.ProjectLatestModelsDocument,
    "\n  query ProjectModelsTreeTopLevel($projectId: String!) {\n    project(id: $projectId) {\n      id\n      modelsTree {\n        ...SingleLevelModelTreeItem\n      }\n    }\n  }\n": types.ProjectModelsTreeTopLevelDocument,
    "\n  query ProjectModelChildrenTree($projectId: String!, $parentName: String!) {\n    project(id: $projectId) {\n      id\n      modelChildrenTree(fullName: $parentName) {\n        ...SingleLevelModelTreeItem\n      }\n    }\n  }\n": types.ProjectModelChildrenTreeDocument,
    "\n  query ProjectLatestCommentThreads($projectId: String!) {\n    project(id: $projectId) {\n      id\n      commentThreads(cursor: null, limit: 8) {\n        totalCount\n        cursor\n        items {\n          ...ProjectPageLatestItemsCommentItem\n        }\n      }\n    }\n  }\n": types.ProjectLatestCommentThreadsDocument,
    "\n  query ModelCard($projectId: String!, $modelId: String!) {\n    project(id: $projectId) {\n      id\n      model(id: $modelId) {\n        ...ModelCardModel\n      }\n    }\n  }\n": types.ModelCardDocument,
    "\n  query GetActiveUser {\n    activeUser {\n      id\n      name\n      role\n    }\n  }\n": types.GetActiveUserDocument,
    "\n    query ProjectLandingPage($id: String!) {\n      project(id: $id) {\n        id\n        name\n        modelCount\n        role\n        updatedAt\n        team {\n          id\n          name\n        }\n      }\n    }\n  ": types.ProjectLandingPageDocument,
    "\n  fragment ProjectPageProject on Project {\n    id\n    createdAt\n    ...ProjectPageProjectHeader\n    ...ProjectPageStatsBlockTeam\n    ...ProjectPageStatsBlockVersions\n    ...ProjectPageStatsBlockModels\n    ...ProjectPageStatsBlockComments\n    ...ProjectPageLatestItemsModels\n    ...ProjectPageLatestItemsComments\n    ...ProjectPageModelsView\n  }\n": types.ProjectPageProjectFragmentDoc,
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
export function graphql(source: "\n  fragment IntegrationStoryDemoServerInfoQueryFragment on ServerInfo {\n    blobSizeLimitBytes\n    name\n    company\n    description\n    adminContact\n    canonicalUrl\n    termsOfService\n    inviteOnly\n    version\n  }\n"): (typeof documents)["\n  fragment IntegrationStoryDemoServerInfoQueryFragment on ServerInfo {\n    blobSizeLimitBytes\n    name\n    company\n    description\n    adminContact\n    canonicalUrl\n    termsOfService\n    inviteOnly\n    version\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ServerTermsOfServicePrivacyPolicyFragment on ServerInfo {\n    termsOfService\n  }\n"): (typeof documents)["\n  fragment ServerTermsOfServicePrivacyPolicyFragment on ServerInfo {\n    termsOfService\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query EmailVerificationBannerState {\n    activeUser {\n      id\n      email\n      verified\n      hasPendingVerification\n    }\n  }\n"): (typeof documents)["\n  query EmailVerificationBannerState {\n    activeUser {\n      id\n      email\n      verified\n      hasPendingVerification\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RequestVerification {\n    requestVerification\n  }\n"): (typeof documents)["\n  mutation RequestVerification {\n    requestVerification\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment AuthStategiesServerInfoFragment on ServerInfo {\n    authStrategies {\n      id\n      name\n      url\n    }\n  }\n"): (typeof documents)["\n  fragment AuthStategiesServerInfoFragment on ServerInfo {\n    authStrategies {\n      id\n      name\n      url\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment FormUsersSelectItem on LimitedUser {\n    id\n    name\n    avatar\n  }\n"): (typeof documents)["\n  fragment FormUsersSelectItem on LimitedUser {\n    id\n    name\n    avatar\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ProjectsDashboardList {\n    projects {\n      ...ProjectListItemFragment\n    }\n  }\n"): (typeof documents)["\n  query ProjectsDashboardList {\n    projects {\n      ...ProjectListItemFragment\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ProjectListItemFragment on Project {\n    id\n    name\n    modelCount\n    role\n    updatedAt\n    team {\n      id\n      name\n      avatar\n    }\n  }\n"): (typeof documents)["\n  fragment ProjectListItemFragment on Project {\n    id\n    name\n    modelCount\n    role\n    updatedAt\n    team {\n      id\n      name\n      avatar\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ProjectPageProjectHeader on Project {\n    id\n    name\n    description\n  }\n"): (typeof documents)["\n  fragment ProjectPageProjectHeader on Project {\n    id\n    name\n    description\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ProjectPageLatestItemsComments on Project {\n    id\n    commentThreadCount\n  }\n"): (typeof documents)["\n  fragment ProjectPageLatestItemsComments on Project {\n    id\n    commentThreadCount\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ProjectPageLatestItemsCommentItem on Comment {\n    id\n    author {\n      ...FormUsersSelectItem\n    }\n    screenshot\n    rawText\n    createdAt\n    repliesCount\n    replyAuthors(limit: 4) {\n      totalCount\n      items {\n        ...FormUsersSelectItem\n      }\n    }\n  }\n"): (typeof documents)["\n  fragment ProjectPageLatestItemsCommentItem on Comment {\n    id\n    author {\n      ...FormUsersSelectItem\n    }\n    screenshot\n    rawText\n    createdAt\n    repliesCount\n    replyAuthors(limit: 4) {\n      totalCount\n      items {\n        ...FormUsersSelectItem\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ProjectPageLatestItemsModels on Project {\n    id\n    modelCount\n    sourceApps\n    team {\n      ...FormUsersSelectItem\n    }\n  }\n"): (typeof documents)["\n  fragment ProjectPageLatestItemsModels on Project {\n    id\n    modelCount\n    sourceApps\n    team {\n      ...FormUsersSelectItem\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ProjectPageLatestItemsModelItem on Model {\n    id\n    name\n    versionCount\n    commentThreadCount\n    previewUrl\n    createdAt\n    updatedAt\n  }\n"): (typeof documents)["\n  fragment ProjectPageLatestItemsModelItem on Model {\n    id\n    name\n    versionCount\n    commentThreadCount\n    previewUrl\n    createdAt\n    updatedAt\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ModelPreview on Model {\n    previewUrl\n  }\n"): (typeof documents)["\n  fragment ModelPreview on Model {\n    previewUrl\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment SingleLevelModelTreeItem on ModelsTreeItem {\n    name\n    fullName\n    model {\n      ...ProjectModelsViewModelItem\n    }\n    hasChildren\n    updatedAt\n  }\n"): (typeof documents)["\n  fragment SingleLevelModelTreeItem on ModelsTreeItem {\n    name\n    fullName\n    model {\n      ...ProjectModelsViewModelItem\n    }\n    hasChildren\n    updatedAt\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ProjectPageModelsView on Project {\n    id\n    modelCount\n    sourceApps\n    team {\n      ...FormUsersSelectItem\n    }\n  }\n"): (typeof documents)["\n  fragment ProjectPageModelsView on Project {\n    id\n    modelCount\n    sourceApps\n    team {\n      ...FormUsersSelectItem\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ProjectModelsViewModelItem on Model {\n    id\n    name\n    versionCount\n    commentThreadCount\n    previewUrl\n    updatedAt\n  }\n"): (typeof documents)["\n  fragment ProjectModelsViewModelItem on Model {\n    id\n    name\n    versionCount\n    commentThreadCount\n    previewUrl\n    updatedAt\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ProjectPageStatsBlockComments on Project {\n    commentThreadCount\n  }\n"): (typeof documents)["\n  fragment ProjectPageStatsBlockComments on Project {\n    commentThreadCount\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ProjectPageStatsBlockModels on Project {\n    modelCount\n  }\n"): (typeof documents)["\n  fragment ProjectPageStatsBlockModels on Project {\n    modelCount\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ProjectPageStatsBlockTeam on Project {\n    role\n    team {\n      id\n      name\n      avatar\n    }\n    role\n  }\n"): (typeof documents)["\n  fragment ProjectPageStatsBlockTeam on Project {\n    role\n    team {\n      id\n      name\n      avatar\n    }\n    role\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ProjectPageStatsBlockVersions on Project {\n    versionCount\n  }\n"): (typeof documents)["\n  fragment ProjectPageStatsBlockVersions on Project {\n    versionCount\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateOnboardingProject {\n    projectMutations {\n      createForOnboarding {\n        ...ProjectPageProject\n        ...ProjectDashboardItem\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation CreateOnboardingProject {\n    projectMutations {\n      createForOnboarding {\n        ...ProjectPageProject\n        ...ProjectDashboardItem\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ProjectDashboardItem on Project {\n    id\n    name\n    createdAt\n    updatedAt\n    role\n    team {\n      id\n      name\n      avatar\n    }\n    models(limit: 100) {\n      totalCount\n      items {\n        id\n        name\n        author {\n          id\n          name\n          avatar\n        }\n        commentThreadCount\n        versionCount\n        updatedAt\n        createdAt\n        previewUrl\n      }\n    }\n  }\n"): (typeof documents)["\n  fragment ProjectDashboardItem on Project {\n    id\n    name\n    createdAt\n    updatedAt\n    role\n    team {\n      id\n      name\n      avatar\n    }\n    models(limit: 100) {\n      totalCount\n      items {\n        id\n        name\n        author {\n          id\n          name\n          avatar\n        }\n        commentThreadCount\n        versionCount\n        updatedAt\n        createdAt\n        previewUrl\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ProjectsDashboardFilled on ProjectCollection {\n    items {\n      ...ProjectDashboardItem\n    }\n  }\n"): (typeof documents)["\n  fragment ProjectsDashboardFilled on ProjectCollection {\n    items {\n      ...ProjectDashboardItem\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment LimitedUserAvatar on LimitedUser {\n    id\n    name\n    avatar\n  }\n"): (typeof documents)["\n  fragment LimitedUserAvatar on LimitedUser {\n    id\n    name\n    avatar\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ActiveUserAvatar on User {\n    id\n    name\n    avatar\n  }\n"): (typeof documents)["\n  fragment ActiveUserAvatar on User {\n    id\n    name\n    avatar\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ActiveUserMainMetadata {\n    activeUser {\n      id\n      email\n      name\n      role\n      avatar\n      isOnboardingFinished\n      createdAt\n    }\n  }\n"): (typeof documents)["\n  query ActiveUserMainMetadata {\n    activeUser {\n      id\n      email\n      name\n      role\n      avatar\n      isOnboardingFinished\n      createdAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation FinishOnboarding {\n    activeUserMutations {\n      finishOnboarding\n    }\n  }\n"): (typeof documents)["\n  mutation FinishOnboarding {\n    activeUserMutations {\n      finishOnboarding\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AuthServerInfo {\n    serverInfo {\n      ...AuthStategiesServerInfoFragment\n      ...ServerTermsOfServicePrivacyPolicyFragment\n    }\n  }\n"): (typeof documents)["\n  query AuthServerInfo {\n    serverInfo {\n      ...AuthStategiesServerInfoFragment\n      ...ServerTermsOfServicePrivacyPolicyFragment\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query InternalTestData {\n    testNumber\n    testList {\n      foo\n      bar\n    }\n  }\n"): (typeof documents)["\n  query InternalTestData {\n    testNumber\n    testList {\n      foo\n      bar\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ProjectsDashboardQuery {\n    activeUser {\n      id\n      projects {\n        totalCount\n        items {\n          ...ProjectDashboardItem\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query ProjectsDashboardQuery {\n    activeUser {\n      id\n      projects {\n        totalCount\n        items {\n          ...ProjectDashboardItem\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ProjectPageQuery($id: String!) {\n    project(id: $id) {\n      ...ProjectPageProject\n    }\n  }\n"): (typeof documents)["\n  query ProjectPageQuery($id: String!) {\n    project(id: $id) {\n      ...ProjectPageProject\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ProjectLatestModels($projectId: String!, $filter: ProjectModelsFilter) {\n    project(id: $projectId) {\n      id\n      models(cursor: null, limit: 8, filter: $filter) {\n        totalCount\n        cursor\n        items {\n          ...ProjectPageLatestItemsModelItem\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query ProjectLatestModels($projectId: String!, $filter: ProjectModelsFilter) {\n    project(id: $projectId) {\n      id\n      models(cursor: null, limit: 8, filter: $filter) {\n        totalCount\n        cursor\n        items {\n          ...ProjectPageLatestItemsModelItem\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ProjectModelsTreeTopLevel($projectId: String!) {\n    project(id: $projectId) {\n      id\n      modelsTree {\n        ...SingleLevelModelTreeItem\n      }\n    }\n  }\n"): (typeof documents)["\n  query ProjectModelsTreeTopLevel($projectId: String!) {\n    project(id: $projectId) {\n      id\n      modelsTree {\n        ...SingleLevelModelTreeItem\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ProjectModelChildrenTree($projectId: String!, $parentName: String!) {\n    project(id: $projectId) {\n      id\n      modelChildrenTree(fullName: $parentName) {\n        ...SingleLevelModelTreeItem\n      }\n    }\n  }\n"): (typeof documents)["\n  query ProjectModelChildrenTree($projectId: String!, $parentName: String!) {\n    project(id: $projectId) {\n      id\n      modelChildrenTree(fullName: $parentName) {\n        ...SingleLevelModelTreeItem\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ProjectLatestCommentThreads($projectId: String!) {\n    project(id: $projectId) {\n      id\n      commentThreads(cursor: null, limit: 8) {\n        totalCount\n        cursor\n        items {\n          ...ProjectPageLatestItemsCommentItem\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query ProjectLatestCommentThreads($projectId: String!) {\n    project(id: $projectId) {\n      id\n      commentThreads(cursor: null, limit: 8) {\n        totalCount\n        cursor\n        items {\n          ...ProjectPageLatestItemsCommentItem\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetActiveUser {\n    activeUser {\n      id\n      name\n      role\n    }\n  }\n"): (typeof documents)["\n  query GetActiveUser {\n    activeUser {\n      id\n      name\n      role\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query ProjectLandingPage($id: String!) {\n      project(id: $id) {\n        id\n        name\n        modelCount\n        role\n        updatedAt\n        team {\n          id\n          name\n        }\n      }\n    }\n  "): (typeof documents)["\n    query ProjectLandingPage($id: String!) {\n      project(id: $id) {\n        id\n        name\n        modelCount\n        role\n        updatedAt\n        team {\n          id\n          name\n        }\n      }\n    }\n  "];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ProjectPageProject on Project {\n    id\n    createdAt\n    ...ProjectPageProjectHeader\n    ...ProjectPageStatsBlockTeam\n    ...ProjectPageStatsBlockVersions\n    ...ProjectPageStatsBlockModels\n    ...ProjectPageStatsBlockComments\n    ...ProjectPageLatestItemsModels\n    ...ProjectPageLatestItemsComments\n    ...ProjectPageModelsView\n  }\n"): (typeof documents)["\n  fragment ProjectPageProject on Project {\n    id\n    createdAt\n    ...ProjectPageProjectHeader\n    ...ProjectPageStatsBlockTeam\n    ...ProjectPageStatsBlockVersions\n    ...ProjectPageStatsBlockModels\n    ...ProjectPageStatsBlockComments\n    ...ProjectPageLatestItemsModels\n    ...ProjectPageLatestItemsComments\n    ...ProjectPageModelsView\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;