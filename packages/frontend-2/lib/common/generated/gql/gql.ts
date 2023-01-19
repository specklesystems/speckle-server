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
    "\n  fragment ProjectPageProjectHeader on Project {\n    id\n    name\n    description\n  }\n": types.ProjectPageProjectHeaderFragmentDoc,
    "\n  fragment ProjectUpdatableMetadata on Project {\n    id\n    name\n    description\n  }\n": types.ProjectUpdatableMetadataFragmentDoc,
    "\n  mutation UpdateProjectMetadata($update: ProjectUpdateInput!) {\n    projectMutations {\n      update(stream: $update) {\n        id\n        ...ProjectUpdatableMetadata\n      }\n    }\n  }\n": types.UpdateProjectMetadataDocument,
    "\n  fragment ProjectPageLatestItemsComments on Project {\n    id\n    commentThreadCount\n  }\n": types.ProjectPageLatestItemsCommentsFragmentDoc,
    "\n  fragment ProjectPageLatestItemsCommentItem on Comment {\n    id\n    author {\n      ...FormUsersSelectItem\n    }\n    screenshot\n    rawText\n    createdAt\n    repliesCount\n    replyAuthors(limit: 4) {\n      totalCount\n      items {\n        ...FormUsersSelectItem\n      }\n    }\n  }\n": types.ProjectPageLatestItemsCommentItemFragmentDoc,
    "\n  fragment ProjectPageLatestItemsModels on Project {\n    id\n    modelCount\n    sourceApps\n    team {\n      ...FormUsersSelectItem\n    }\n  }\n": types.ProjectPageLatestItemsModelsFragmentDoc,
    "\n  fragment ModelPreview on Model {\n    previewUrl\n  }\n": types.ModelPreviewFragmentDoc,
    "\n  fragment SingleLevelModelTreeItem on ModelsTreeItem {\n    name\n    fullName\n    model {\n      ...ProjectModelsViewModelItem\n    }\n    hasChildren\n    updatedAt\n  }\n": types.SingleLevelModelTreeItemFragmentDoc,
    "\n  fragment ProjectPageModelsView on Project {\n    id\n    modelCount\n    sourceApps\n    team {\n      ...FormUsersSelectItem\n    }\n  }\n": types.ProjectPageModelsViewFragmentDoc,
    "\n  fragment ProjectModelsViewModelItem on Model {\n    id\n    name\n    versionCount\n    commentThreadCount\n    previewUrl\n    updatedAt\n  }\n": types.ProjectModelsViewModelItemFragmentDoc,
    "\n  fragment ProjectPageStatsBlockComments on Project {\n    commentThreadCount\n  }\n": types.ProjectPageStatsBlockCommentsFragmentDoc,
    "\n  fragment ProjectPageStatsBlockModels on Project {\n    modelCount\n  }\n": types.ProjectPageStatsBlockModelsFragmentDoc,
    "\n  fragment ProjectPageStatsBlockTeam on Project {\n    role\n    team {\n      id\n      name\n      avatar\n    }\n    role\n  }\n": types.ProjectPageStatsBlockTeamFragmentDoc,
    "\n  fragment ProjectPageStatsBlockVersions on Project {\n    versionCount\n  }\n": types.ProjectPageStatsBlockVersionsFragmentDoc,
    "\n  subscription OnUserProjectsUpdate {\n    userProjectsUpdated {\n      type\n      id\n      project {\n        ...ProjectDashboardItem\n      }\n    }\n  }\n": types.OnUserProjectsUpdateDocument,
    "\n  mutation CreateOnboardingProject {\n    projectMutations {\n      createForOnboarding {\n        ...ProjectPageProject\n        ...ProjectDashboardItem\n      }\n    }\n  }\n": types.CreateOnboardingProjectDocument,
    "\n  fragment ProjectsDashboardFilled on ProjectCollection {\n    items {\n      ...ProjectDashboardItem\n    }\n  }\n": types.ProjectsDashboardFilledFragmentDoc,
    "\n  subscription OnProjectModelUpdate($id: String!) {\n    projectModelsUpdated(id: $id) {\n      id\n      type\n      model {\n        id\n        ...ProjectPageLatestItemsModelItem\n      }\n    }\n  }\n": types.OnProjectModelUpdateDocument,
    "\n  fragment LimitedUserAvatar on LimitedUser {\n    id\n    name\n    avatar\n  }\n": types.LimitedUserAvatarFragmentDoc,
    "\n  fragment ActiveUserAvatar on User {\n    id\n    name\n    avatar\n  }\n": types.ActiveUserAvatarFragmentDoc,
    "\n  fragment ViewerCommentsListItem on Comment {\n    id\n    rawText\n    author {\n      ...LimitedUserAvatar\n    }\n    createdAt\n  }\n": types.ViewerCommentsListItemFragmentDoc,
    "\n  fragment ViewerModelVersionCardItem on Version {\n    id\n    message\n    referencedObject\n    sourceApplication\n    createdAt\n    authorUser {\n      ...LimitedUserAvatar\n    }\n  }\n": types.ViewerModelVersionCardItemFragmentDoc,
    "\n  query ActiveUserMainMetadata {\n    activeUser {\n      id\n      email\n      name\n      role\n      avatar\n      isOnboardingFinished\n      createdAt\n    }\n  }\n": types.ActiveUserMainMetadataDocument,
    "\n  mutation FinishOnboarding {\n    activeUserMutations {\n      finishOnboarding\n    }\n  }\n": types.FinishOnboardingDocument,
    "\n  query AuthServerInfo {\n    serverInfo {\n      ...AuthStategiesServerInfoFragment\n      ...ServerTermsOfServicePrivacyPolicyFragment\n    }\n  }\n": types.AuthServerInfoDocument,
    "\n  query InternalTestData {\n    testNumber\n    testList {\n      foo\n      bar\n    }\n  }\n": types.InternalTestDataDocument,
    "\n  fragment ProjectDashboardItem on Project {\n    id\n    name\n    createdAt\n    updatedAt\n    role\n    team {\n      id\n      name\n      avatar\n    }\n    models(limit: 4, filter: { onlyWithVersions: true }) {\n      totalCount\n      items {\n        ...ProjectPageLatestItemsModelItem\n      }\n    }\n  }\n": types.ProjectDashboardItemFragmentDoc,
    "\n  fragment ProjectPageLatestItemsModelItem on Model {\n    id\n    name\n    displayName\n    versionCount\n    commentThreadCount\n    previewUrl\n    createdAt\n    updatedAt\n  }\n": types.ProjectPageLatestItemsModelItemFragmentDoc,
    "\n  mutation CreateModel($input: CreateModelInput!) {\n    modelMutations {\n      create(input: $input) {\n        ...ProjectPageLatestItemsModelItem\n      }\n    }\n  }\n": types.CreateModelDocument,
    "\n  query ProjectsDashboardQuery($filter: UserProjectsFilter) {\n    activeUser {\n      id\n      projects(filter: $filter) {\n        totalCount\n        items {\n          ...ProjectDashboardItem\n        }\n      }\n    }\n  }\n": types.ProjectsDashboardQueryDocument,
    "\n  query ProjectPageQuery($id: String!) {\n    project(id: $id) {\n      ...ProjectPageProject\n    }\n  }\n": types.ProjectPageQueryDocument,
    "\n  query ProjectLatestModels($projectId: String!, $filter: ProjectModelsFilter) {\n    project(id: $projectId) {\n      id\n      models(cursor: null, limit: 100, filter: $filter) {\n        totalCount\n        cursor\n        items {\n          ...ProjectPageLatestItemsModelItem\n        }\n      }\n    }\n  }\n": types.ProjectLatestModelsDocument,
    "\n  query ProjectModelsTreeTopLevel($projectId: String!) {\n    project(id: $projectId) {\n      id\n      modelsTree {\n        ...SingleLevelModelTreeItem\n      }\n    }\n  }\n": types.ProjectModelsTreeTopLevelDocument,
    "\n  query ProjectModelChildrenTree($projectId: String!, $parentName: String!) {\n    project(id: $projectId) {\n      id\n      modelChildrenTree(fullName: $parentName) {\n        ...SingleLevelModelTreeItem\n      }\n    }\n  }\n": types.ProjectModelChildrenTreeDocument,
    "\n  query ProjectLatestCommentThreads($projectId: String!) {\n    project(id: $projectId) {\n      id\n      commentThreads(cursor: null, limit: 8) {\n        totalCount\n        cursor\n        items {\n          ...ProjectPageLatestItemsCommentItem\n        }\n      }\n    }\n  }\n": types.ProjectLatestCommentThreadsDocument,
    "\n  query ProjectViewerResources($projectId: String!, $resourceUrlString: String!) {\n    project(id: $projectId) {\n      id\n      viewerResources(resourceIdString: $resourceUrlString) {\n        identifier\n        items {\n          modelId\n          versionId\n          objectId\n        }\n      }\n    }\n  }\n": types.ProjectViewerResourcesDocument,
    "\n  query ViewerLoadedResources(\n    $projectId: String!\n    $modelIds: [String!]!\n    $versionIds: [String!]\n    $resourceIdString: String!\n  ) {\n    project(id: $projectId) {\n      id\n      models(filter: { ids: $modelIds }) {\n        totalCount\n        items {\n          id\n          name\n          updatedAt\n          versions(filter: { priorityIds: $versionIds }) {\n            totalCount\n            items {\n              ...ViewerModelVersionCardItem\n            }\n          }\n        }\n      }\n      commentThreads(filter: { resourceIdString: $resourceIdString }) {\n        totalCount\n        items {\n          ...ViewerCommentsListItem\n        }\n      }\n      ...ModelPageProject\n    }\n  }\n": types.ViewerLoadedResourcesDocument,
    "\n  query GetActiveUser {\n    activeUser {\n      id\n      name\n      role\n    }\n  }\n": types.GetActiveUserDocument,
    "\n  subscription OnProjectUpdated($id: String!) {\n    projectUpdated(id: $id) {\n      id\n      type\n      project {\n        ...ProjectPageProject\n      }\n    }\n  }\n": types.OnProjectUpdatedDocument,
    "\n  fragment ProjectPageProject on Project {\n    id\n    createdAt\n    ...ProjectPageProjectHeader\n    ...ProjectPageStatsBlockTeam\n    ...ProjectPageStatsBlockVersions\n    ...ProjectPageStatsBlockModels\n    ...ProjectPageStatsBlockComments\n    ...ProjectPageLatestItemsModels\n    ...ProjectPageLatestItemsComments\n    ...ProjectPageModelsView\n  }\n": types.ProjectPageProjectFragmentDoc,
    "\n  fragment ModelPageProject on Project {\n    id\n    createdAt\n    name\n  }\n": types.ModelPageProjectFragmentDoc,
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
export function graphql(source: "\n  fragment ProjectPageProjectHeader on Project {\n    id\n    name\n    description\n  }\n"): (typeof documents)["\n  fragment ProjectPageProjectHeader on Project {\n    id\n    name\n    description\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ProjectUpdatableMetadata on Project {\n    id\n    name\n    description\n  }\n"): (typeof documents)["\n  fragment ProjectUpdatableMetadata on Project {\n    id\n    name\n    description\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateProjectMetadata($update: ProjectUpdateInput!) {\n    projectMutations {\n      update(stream: $update) {\n        id\n        ...ProjectUpdatableMetadata\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateProjectMetadata($update: ProjectUpdateInput!) {\n    projectMutations {\n      update(stream: $update) {\n        id\n        ...ProjectUpdatableMetadata\n      }\n    }\n  }\n"];
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
export function graphql(source: "\n  subscription OnUserProjectsUpdate {\n    userProjectsUpdated {\n      type\n      id\n      project {\n        ...ProjectDashboardItem\n      }\n    }\n  }\n"): (typeof documents)["\n  subscription OnUserProjectsUpdate {\n    userProjectsUpdated {\n      type\n      id\n      project {\n        ...ProjectDashboardItem\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateOnboardingProject {\n    projectMutations {\n      createForOnboarding {\n        ...ProjectPageProject\n        ...ProjectDashboardItem\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation CreateOnboardingProject {\n    projectMutations {\n      createForOnboarding {\n        ...ProjectPageProject\n        ...ProjectDashboardItem\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ProjectsDashboardFilled on ProjectCollection {\n    items {\n      ...ProjectDashboardItem\n    }\n  }\n"): (typeof documents)["\n  fragment ProjectsDashboardFilled on ProjectCollection {\n    items {\n      ...ProjectDashboardItem\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription OnProjectModelUpdate($id: String!) {\n    projectModelsUpdated(id: $id) {\n      id\n      type\n      model {\n        id\n        ...ProjectPageLatestItemsModelItem\n      }\n    }\n  }\n"): (typeof documents)["\n  subscription OnProjectModelUpdate($id: String!) {\n    projectModelsUpdated(id: $id) {\n      id\n      type\n      model {\n        id\n        ...ProjectPageLatestItemsModelItem\n      }\n    }\n  }\n"];
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
export function graphql(source: "\n  fragment ViewerCommentsListItem on Comment {\n    id\n    rawText\n    author {\n      ...LimitedUserAvatar\n    }\n    createdAt\n  }\n"): (typeof documents)["\n  fragment ViewerCommentsListItem on Comment {\n    id\n    rawText\n    author {\n      ...LimitedUserAvatar\n    }\n    createdAt\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ViewerModelVersionCardItem on Version {\n    id\n    message\n    referencedObject\n    sourceApplication\n    createdAt\n    authorUser {\n      ...LimitedUserAvatar\n    }\n  }\n"): (typeof documents)["\n  fragment ViewerModelVersionCardItem on Version {\n    id\n    message\n    referencedObject\n    sourceApplication\n    createdAt\n    authorUser {\n      ...LimitedUserAvatar\n    }\n  }\n"];
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
export function graphql(source: "\n  fragment ProjectDashboardItem on Project {\n    id\n    name\n    createdAt\n    updatedAt\n    role\n    team {\n      id\n      name\n      avatar\n    }\n    models(limit: 4, filter: { onlyWithVersions: true }) {\n      totalCount\n      items {\n        ...ProjectPageLatestItemsModelItem\n      }\n    }\n  }\n"): (typeof documents)["\n  fragment ProjectDashboardItem on Project {\n    id\n    name\n    createdAt\n    updatedAt\n    role\n    team {\n      id\n      name\n      avatar\n    }\n    models(limit: 4, filter: { onlyWithVersions: true }) {\n      totalCount\n      items {\n        ...ProjectPageLatestItemsModelItem\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ProjectPageLatestItemsModelItem on Model {\n    id\n    name\n    displayName\n    versionCount\n    commentThreadCount\n    previewUrl\n    createdAt\n    updatedAt\n  }\n"): (typeof documents)["\n  fragment ProjectPageLatestItemsModelItem on Model {\n    id\n    name\n    displayName\n    versionCount\n    commentThreadCount\n    previewUrl\n    createdAt\n    updatedAt\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateModel($input: CreateModelInput!) {\n    modelMutations {\n      create(input: $input) {\n        ...ProjectPageLatestItemsModelItem\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation CreateModel($input: CreateModelInput!) {\n    modelMutations {\n      create(input: $input) {\n        ...ProjectPageLatestItemsModelItem\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ProjectsDashboardQuery($filter: UserProjectsFilter) {\n    activeUser {\n      id\n      projects(filter: $filter) {\n        totalCount\n        items {\n          ...ProjectDashboardItem\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query ProjectsDashboardQuery($filter: UserProjectsFilter) {\n    activeUser {\n      id\n      projects(filter: $filter) {\n        totalCount\n        items {\n          ...ProjectDashboardItem\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ProjectPageQuery($id: String!) {\n    project(id: $id) {\n      ...ProjectPageProject\n    }\n  }\n"): (typeof documents)["\n  query ProjectPageQuery($id: String!) {\n    project(id: $id) {\n      ...ProjectPageProject\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ProjectLatestModels($projectId: String!, $filter: ProjectModelsFilter) {\n    project(id: $projectId) {\n      id\n      models(cursor: null, limit: 100, filter: $filter) {\n        totalCount\n        cursor\n        items {\n          ...ProjectPageLatestItemsModelItem\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query ProjectLatestModels($projectId: String!, $filter: ProjectModelsFilter) {\n    project(id: $projectId) {\n      id\n      models(cursor: null, limit: 100, filter: $filter) {\n        totalCount\n        cursor\n        items {\n          ...ProjectPageLatestItemsModelItem\n        }\n      }\n    }\n  }\n"];
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
export function graphql(source: "\n  query ProjectViewerResources($projectId: String!, $resourceUrlString: String!) {\n    project(id: $projectId) {\n      id\n      viewerResources(resourceIdString: $resourceUrlString) {\n        identifier\n        items {\n          modelId\n          versionId\n          objectId\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query ProjectViewerResources($projectId: String!, $resourceUrlString: String!) {\n    project(id: $projectId) {\n      id\n      viewerResources(resourceIdString: $resourceUrlString) {\n        identifier\n        items {\n          modelId\n          versionId\n          objectId\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ViewerLoadedResources(\n    $projectId: String!\n    $modelIds: [String!]!\n    $versionIds: [String!]\n    $resourceIdString: String!\n  ) {\n    project(id: $projectId) {\n      id\n      models(filter: { ids: $modelIds }) {\n        totalCount\n        items {\n          id\n          name\n          updatedAt\n          versions(filter: { priorityIds: $versionIds }) {\n            totalCount\n            items {\n              ...ViewerModelVersionCardItem\n            }\n          }\n        }\n      }\n      commentThreads(filter: { resourceIdString: $resourceIdString }) {\n        totalCount\n        items {\n          ...ViewerCommentsListItem\n        }\n      }\n      ...ModelPageProject\n    }\n  }\n"): (typeof documents)["\n  query ViewerLoadedResources(\n    $projectId: String!\n    $modelIds: [String!]!\n    $versionIds: [String!]\n    $resourceIdString: String!\n  ) {\n    project(id: $projectId) {\n      id\n      models(filter: { ids: $modelIds }) {\n        totalCount\n        items {\n          id\n          name\n          updatedAt\n          versions(filter: { priorityIds: $versionIds }) {\n            totalCount\n            items {\n              ...ViewerModelVersionCardItem\n            }\n          }\n        }\n      }\n      commentThreads(filter: { resourceIdString: $resourceIdString }) {\n        totalCount\n        items {\n          ...ViewerCommentsListItem\n        }\n      }\n      ...ModelPageProject\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetActiveUser {\n    activeUser {\n      id\n      name\n      role\n    }\n  }\n"): (typeof documents)["\n  query GetActiveUser {\n    activeUser {\n      id\n      name\n      role\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription OnProjectUpdated($id: String!) {\n    projectUpdated(id: $id) {\n      id\n      type\n      project {\n        ...ProjectPageProject\n      }\n    }\n  }\n"): (typeof documents)["\n  subscription OnProjectUpdated($id: String!) {\n    projectUpdated(id: $id) {\n      id\n      type\n      project {\n        ...ProjectPageProject\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ProjectPageProject on Project {\n    id\n    createdAt\n    ...ProjectPageProjectHeader\n    ...ProjectPageStatsBlockTeam\n    ...ProjectPageStatsBlockVersions\n    ...ProjectPageStatsBlockModels\n    ...ProjectPageStatsBlockComments\n    ...ProjectPageLatestItemsModels\n    ...ProjectPageLatestItemsComments\n    ...ProjectPageModelsView\n  }\n"): (typeof documents)["\n  fragment ProjectPageProject on Project {\n    id\n    createdAt\n    ...ProjectPageProjectHeader\n    ...ProjectPageStatsBlockTeam\n    ...ProjectPageStatsBlockVersions\n    ...ProjectPageStatsBlockModels\n    ...ProjectPageStatsBlockComments\n    ...ProjectPageLatestItemsModels\n    ...ProjectPageLatestItemsComments\n    ...ProjectPageModelsView\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ModelPageProject on Project {\n    id\n    createdAt\n    name\n  }\n"): (typeof documents)["\n  fragment ModelPageProject on Project {\n    id\n    createdAt\n    name\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;