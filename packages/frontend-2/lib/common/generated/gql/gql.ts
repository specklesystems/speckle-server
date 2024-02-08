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
    "\n  fragment AuthRegisterPanelServerInfo on ServerInfo {\n    inviteOnly\n  }\n": types.AuthRegisterPanelServerInfoFragmentDoc,
    "\n  query RegisterPanelServerInvite($token: String!) {\n    serverInviteByToken(token: $token) {\n      id\n      email\n    }\n  }\n": types.RegisterPanelServerInviteDocument,
    "\n  fragment ServerTermsOfServicePrivacyPolicyFragment on ServerInfo {\n    termsOfService\n  }\n": types.ServerTermsOfServicePrivacyPolicyFragmentFragmentDoc,
    "\n  query EmailVerificationBannerState {\n    activeUser {\n      id\n      email\n      verified\n      hasPendingVerification\n    }\n  }\n": types.EmailVerificationBannerStateDocument,
    "\n  mutation RequestVerification {\n    requestVerification\n  }\n": types.RequestVerificationDocument,
    "\n  fragment AuthStategiesServerInfoFragment on ServerInfo {\n    authStrategies {\n      id\n      name\n      url\n    }\n  }\n": types.AuthStategiesServerInfoFragmentFragmentDoc,
    "\n  fragment CommonModelSelectorModel on Model {\n    id\n    name\n  }\n": types.CommonModelSelectorModelFragmentDoc,
    "\n  fragment FormSelectProjects_Project on Project {\n    id\n    name\n  }\n": types.FormSelectProjects_ProjectFragmentDoc,
    "\n  fragment FormUsersSelectItem on LimitedUser {\n    id\n    name\n    avatar\n  }\n": types.FormUsersSelectItemFragmentDoc,
    "\n  fragment ProjectDiscussionsPageHeader_Project on Project {\n    id\n    name\n  }\n": types.ProjectDiscussionsPageHeader_ProjectFragmentDoc,
    "\n  fragment ProjectDiscussionsPageResults_Project on Project {\n    id\n  }\n": types.ProjectDiscussionsPageResults_ProjectFragmentDoc,
    "\n  fragment ProjectModelPageHeaderProject on Project {\n    id\n    name\n    role\n    model(id: $modelId) {\n      id\n      name\n      description\n    }\n  }\n": types.ProjectModelPageHeaderProjectFragmentDoc,
    "\n  fragment ProjectModelPageVersionsPagination on Project {\n    id\n    visibility\n    model(id: $modelId) {\n      id\n      versions(limit: 16, cursor: $versionsCursor) {\n        cursor\n        totalCount\n        items {\n          ...ProjectModelPageVersionsCardVersion\n        }\n      }\n    }\n  }\n": types.ProjectModelPageVersionsPaginationFragmentDoc,
    "\n  fragment ProjectModelPageVersionsProject on Project {\n    ...ProjectPageProjectHeader\n    model(id: $modelId) {\n      id\n      name\n      pendingImportedVersions {\n        ...PendingFileUpload\n      }\n    }\n    ...ProjectModelPageVersionsPagination\n  }\n": types.ProjectModelPageVersionsProjectFragmentDoc,
    "\n  fragment ProjectModelPageDialogDeleteVersion on Version {\n    id\n    message\n  }\n": types.ProjectModelPageDialogDeleteVersionFragmentDoc,
    "\n  fragment ProjectModelPageDialogEditMessageVersion on Version {\n    id\n    message\n  }\n": types.ProjectModelPageDialogEditMessageVersionFragmentDoc,
    "\n  fragment ProjectModelPageDialogMoveToVersion on Version {\n    id\n    message\n  }\n": types.ProjectModelPageDialogMoveToVersionFragmentDoc,
    "\n  fragment ProjectModelPageVersionsCardVersion on Version {\n    id\n    message\n    authorUser {\n      ...LimitedUserAvatar\n    }\n    createdAt\n    previewUrl\n    sourceApplication\n    commentThreadCount: commentThreads(limit: 0) {\n      totalCount\n    }\n    ...ProjectModelPageDialogDeleteVersion\n    ...ProjectModelPageDialogMoveToVersion\n    ...ModelCardAutomationStatus_Version\n  }\n": types.ProjectModelPageVersionsCardVersionFragmentDoc,
    "\n  fragment ProjectModelsPageHeader_Project on Project {\n    id\n    name\n    sourceApps\n    role\n    team {\n      user {\n        ...FormUsersSelectItem\n      }\n    }\n  }\n": types.ProjectModelsPageHeader_ProjectFragmentDoc,
    "\n  fragment ProjectModelsPageResults_Project on Project {\n    ...ProjectPageLatestItemsModels\n  }\n": types.ProjectModelsPageResults_ProjectFragmentDoc,
    "\n  fragment ProjectPageProjectHeader on Project {\n    id\n    role\n    name\n    description\n    visibility\n    allowPublicComments\n  }\n": types.ProjectPageProjectHeaderFragmentDoc,
    "\n  fragment ProjectPageLatestItemsComments on Project {\n    id\n    commentThreadCount: commentThreads(limit: 0) {\n      totalCount\n    }\n  }\n": types.ProjectPageLatestItemsCommentsFragmentDoc,
    "\n  fragment ProjectPageLatestItemsCommentItem on Comment {\n    id\n    author {\n      ...FormUsersSelectItem\n    }\n    screenshot\n    rawText\n    createdAt\n    updatedAt\n    archived\n    repliesCount: replies(limit: 0) {\n      totalCount\n    }\n    replyAuthors(limit: 4) {\n      totalCount\n      items {\n        ...FormUsersSelectItem\n      }\n    }\n  }\n": types.ProjectPageLatestItemsCommentItemFragmentDoc,
    "\n  fragment ProjectPageLatestItemsModels on Project {\n    id\n    role\n    visibility\n    modelCount: models(limit: 0) {\n      totalCount\n    }\n  }\n": types.ProjectPageLatestItemsModelsFragmentDoc,
    "\n  fragment ProjectPageModelsActions on Model {\n    id\n    name\n  }\n": types.ProjectPageModelsActionsFragmentDoc,
    "\n  fragment ProjectPageModelsCardProject on Project {\n    id\n    role\n    visibility\n  }\n": types.ProjectPageModelsCardProjectFragmentDoc,
    "\n  fragment ModelPreview on Model {\n    previewUrl\n  }\n": types.ModelPreviewFragmentDoc,
    "\n  fragment SingleLevelModelTreeItem on ModelsTreeItem {\n    id\n    name\n    fullName\n    model {\n      ...ProjectPageLatestItemsModelItem\n    }\n    hasChildren\n    updatedAt\n  }\n": types.SingleLevelModelTreeItemFragmentDoc,
    "\n  fragment ModelCardAutomationStatus_AutomationsStatus on AutomationsStatus {\n    id\n    status\n    statusMessage\n    automationRuns {\n      id\n      automationId\n      automationName\n      createdAt\n      status\n      functionRuns {\n        id\n        functionId\n        functionName\n        functionLogo\n        elapsed\n        status\n        statusMessage\n        contextView\n        results\n        resultVersions {\n          id\n          model {\n            id\n            name\n          }\n        }\n      }\n    }\n  }\n": types.ModelCardAutomationStatus_AutomationsStatusFragmentDoc,
    "\n  fragment ModelCardAutomationStatus_Model on Model {\n    id\n    displayName\n    automationStatus {\n      ...ModelCardAutomationStatus_AutomationsStatus\n    }\n  }\n": types.ModelCardAutomationStatus_ModelFragmentDoc,
    "\n  fragment ModelCardAutomationStatus_Version on Version {\n    id\n    automationStatus {\n      ...ModelCardAutomationStatus_AutomationsStatus\n    }\n  }\n": types.ModelCardAutomationStatus_VersionFragmentDoc,
    "\n  fragment ProjectPageModelsCardDeleteDialog on Model {\n    id\n    name\n  }\n": types.ProjectPageModelsCardDeleteDialogFragmentDoc,
    "\n  fragment ProjectPageModelsCardRenameDialog on Model {\n    id\n    name\n    description\n  }\n": types.ProjectPageModelsCardRenameDialogFragmentDoc,
    "\n  fragment ProjectPageStatsBlockComments on Project {\n    commentThreadCount: commentThreads(limit: 0) {\n      totalCount\n    }\n  }\n": types.ProjectPageStatsBlockCommentsFragmentDoc,
    "\n  fragment ProjectPageStatsBlockModels on Project {\n    modelCount: models(limit: 0) {\n      totalCount\n    }\n  }\n": types.ProjectPageStatsBlockModelsFragmentDoc,
    "\n  fragment ProjectPageStatsBlockTeam on Project {\n    id\n    role\n    team {\n      role\n      user {\n        ...LimitedUserAvatar\n      }\n    }\n    ...ProjectPageTeamDialog\n  }\n": types.ProjectPageStatsBlockTeamFragmentDoc,
    "\n  fragment ProjectPageStatsBlockVersions on Project {\n    versionCount: versions(limit: 0) {\n      totalCount\n    }\n  }\n": types.ProjectPageStatsBlockVersionsFragmentDoc,
    "\n  fragment ProjectPageTeamDialog on Project {\n    id\n    name\n    role\n    allowPublicComments\n    visibility\n    team {\n      role\n      user {\n        ...LimitedUserAvatar\n        role\n      }\n    }\n    invitedTeam {\n      id\n      title\n      inviteId\n      role\n      user {\n        ...LimitedUserAvatar\n        role\n      }\n    }\n  }\n": types.ProjectPageTeamDialogFragmentDoc,
    "\n  subscription OnUserProjectsUpdate {\n    userProjectsUpdated {\n      type\n      id\n      project {\n        ...ProjectDashboardItem\n      }\n    }\n  }\n": types.OnUserProjectsUpdateDocument,
    "\n  fragment ProjectsDashboardFilled on ProjectCollection {\n    items {\n      ...ProjectDashboardItem\n    }\n  }\n": types.ProjectsDashboardFilledFragmentDoc,
    "\n  fragment ProjectsInviteBanner on PendingStreamCollaborator {\n    id\n    invitedBy {\n      ...LimitedUserAvatar\n    }\n    projectId\n    projectName\n    token\n  }\n": types.ProjectsInviteBannerFragmentDoc,
    "\n  fragment ProjectsInviteBanners on User {\n    projectInvites {\n      ...ProjectsInviteBanner\n    }\n  }\n": types.ProjectsInviteBannersFragmentDoc,
    "\n  fragment UserProfileEditDialogAvatar_User on User {\n    id\n    avatar\n    ...ActiveUserAvatar\n  }\n": types.UserProfileEditDialogAvatar_UserFragmentDoc,
    "\n  fragment UserProfileEditDialogBio_User on User {\n    id\n    name\n    company\n    bio\n    ...UserProfileEditDialogAvatar_User\n  }\n": types.UserProfileEditDialogBio_UserFragmentDoc,
    "\n  fragment UserProfileEditDialogDeleteAccount_User on User {\n    id\n    email\n  }\n": types.UserProfileEditDialogDeleteAccount_UserFragmentDoc,
    "\n  fragment UserProfileEditDialogNotificationPreferences_User on User {\n    id\n    notificationPreferences\n  }\n": types.UserProfileEditDialogNotificationPreferences_UserFragmentDoc,
    "\n  fragment ModelPageProject on Project {\n    id\n    createdAt\n    name\n    visibility\n  }\n": types.ModelPageProjectFragmentDoc,
    "\n  fragment ThreadCommentAttachment on Comment {\n    text {\n      attachments {\n        id\n        fileName\n        fileType\n        fileSize\n      }\n    }\n  }\n": types.ThreadCommentAttachmentFragmentDoc,
    "\n  fragment ViewerCommentsListItem on Comment {\n    id\n    rawText\n    archived\n    author {\n      ...LimitedUserAvatar\n    }\n    createdAt\n    viewedAt\n    replies {\n      totalCount\n      cursor\n      items {\n        ...ViewerCommentsReplyItem\n      }\n    }\n    replyAuthors(limit: 4) {\n      totalCount\n      items {\n        ...FormUsersSelectItem\n      }\n    }\n    resources {\n      resourceId\n      resourceType\n    }\n  }\n": types.ViewerCommentsListItemFragmentDoc,
    "\n  fragment ViewerModelVersionCardItem on Version {\n    id\n    message\n    referencedObject\n    sourceApplication\n    createdAt\n    previewUrl\n    authorUser {\n      ...LimitedUserAvatar\n    }\n  }\n": types.ViewerModelVersionCardItemFragmentDoc,
    "\n  query ActiveUserMainMetadata {\n    activeUser {\n      id\n      email\n      company\n      bio\n      name\n      role\n      avatar\n      isOnboardingFinished\n      createdAt\n      verified\n      notificationPreferences\n    }\n  }\n": types.ActiveUserMainMetadataDocument,
    "\n      mutation CreateOnboardingProject {\n        projectMutations {\n          createForOnboarding {\n            ...ProjectPageProject\n            ...ProjectDashboardItem\n          }\n        }\n      }\n    ": types.CreateOnboardingProjectDocument,
    "\n  mutation FinishOnboarding {\n    activeUserMutations {\n      finishOnboarding\n    }\n  }\n": types.FinishOnboardingDocument,
    "\n  mutation RequestVerificationByEmail($email: String!) {\n    requestVerificationByEmail(email: $email)\n  }\n": types.RequestVerificationByEmailDocument,
    "\n  query AuthServerInfo {\n    serverInfo {\n      ...AuthStategiesServerInfoFragment\n      ...ServerTermsOfServicePrivacyPolicyFragment\n      ...AuthRegisterPanelServerInfo\n    }\n  }\n": types.AuthServerInfoDocument,
    "\n  query AuthorizableAppMetadata($id: String!) {\n    app(id: $id) {\n      id\n      name\n      description\n      trustByDefault\n      redirectUrl\n      scopes {\n        name\n        description\n      }\n      author {\n        name\n        id\n        avatar\n      }\n    }\n  }\n": types.AuthorizableAppMetadataDocument,
    "\n  subscription OnModelVersionCardAutomationsStatusUpdated($projectId: String!) {\n    projectAutomationsStatusUpdated(projectId: $projectId) {\n      status {\n        ...ModelCardAutomationStatus_AutomationsStatus\n      }\n      version {\n        id\n      }\n      model {\n        id\n        versions(limit: 1) {\n          items {\n            id\n          }\n        }\n      }\n    }\n  }\n": types.OnModelVersionCardAutomationsStatusUpdatedDocument,
    "\n  query MentionsUserSearch($query: String!, $emailOnly: Boolean = false) {\n    userSearch(\n      query: $query\n      limit: 5\n      cursor: null\n      archived: false\n      emailOnly: $emailOnly\n    ) {\n      items {\n        id\n        name\n        company\n      }\n    }\n  }\n": types.MentionsUserSearchDocument,
    "\n  query UserSearch($query: String!, $limit: Int, $cursor: String, $archived: Boolean) {\n    userSearch(query: $query, limit: $limit, cursor: $cursor, archived: $archived) {\n      cursor\n      items {\n        id\n        name\n        bio\n        company\n        avatar\n        verified\n        role\n      }\n    }\n  }\n": types.UserSearchDocument,
    "\n  query ServerInfoBlobSizeLimit {\n    serverInfo {\n      blobSizeLimitBytes\n    }\n  }\n": types.ServerInfoBlobSizeLimitDocument,
    "\n  query ServerInfoAllScopes {\n    serverInfo {\n      scopes {\n        name\n        description\n      }\n    }\n  }\n": types.ServerInfoAllScopesDocument,
    "\n  query ProjectModelsSelectorValues($projectId: String!, $cursor: String) {\n    project(id: $projectId) {\n      id\n      models(limit: 100, cursor: $cursor) {\n        cursor\n        totalCount\n        items {\n          ...CommonModelSelectorModel\n        }\n      }\n    }\n  }\n": types.ProjectModelsSelectorValuesDocument,
    "\n  query MainServerInfoData {\n    serverInfo {\n      adminContact\n      blobSizeLimitBytes\n      canonicalUrl\n      company\n      description\n      guestModeEnabled\n      inviteOnly\n      name\n      termsOfService\n      version\n      automateUrl\n    }\n  }\n": types.MainServerInfoDataDocument,
    "\n  mutation DeleteAccessToken($token: String!) {\n    apiTokenRevoke(token: $token)\n  }\n": types.DeleteAccessTokenDocument,
    "\n  mutation CreateAccessToken($token: ApiTokenCreateInput!) {\n    apiTokenCreate(token: $token)\n  }\n": types.CreateAccessTokenDocument,
    "\n  mutation DeleteApplication($appId: String!) {\n    appDelete(appId: $appId)\n  }\n": types.DeleteApplicationDocument,
    "\n  mutation CreateApplication($app: AppCreateInput!) {\n    appCreate(app: $app)\n  }\n": types.CreateApplicationDocument,
    "\n  mutation EditApplication($app: AppUpdateInput!) {\n    appUpdate(app: $app)\n  }\n": types.EditApplicationDocument,
    "\n  query DeveloperSettingsAccessTokens {\n    activeUser {\n      id\n      apiTokens {\n        id\n        name\n        lastUsed\n        lastChars\n        createdAt\n        scopes\n      }\n    }\n  }\n": types.DeveloperSettingsAccessTokensDocument,
    "\n  query DeveloperSettingsApplications {\n    activeUser {\n      createdApps {\n        id\n        secret\n        name\n        description\n        redirectUrl\n        scopes {\n          name\n          description\n        }\n      }\n      id\n    }\n  }\n": types.DeveloperSettingsApplicationsDocument,
    "\n  query SearchProjects($search: String, $onlyWithRoles: [String!] = null) {\n    activeUser {\n      projects(limit: 10, filter: { search: $search, onlyWithRoles: $onlyWithRoles }) {\n        totalCount\n        items {\n          ...FormSelectProjects_Project\n        }\n      }\n    }\n  }\n": types.SearchProjectsDocument,
    "\n  fragment ProjectDashboardItemNoModels on Project {\n    id\n    name\n    createdAt\n    updatedAt\n    role\n    team {\n      user {\n        id\n        name\n        avatar\n      }\n    }\n    ...ProjectPageModelsCardProject\n  }\n": types.ProjectDashboardItemNoModelsFragmentDoc,
    "\n  fragment ProjectDashboardItem on Project {\n    id\n    ...ProjectDashboardItemNoModels\n    models(limit: 4, filter: { onlyWithVersions: true }) {\n      totalCount\n      items {\n        ...ProjectPageLatestItemsModelItem\n      }\n    }\n    pendingImportedModels(limit: 4) {\n      ...PendingFileUpload\n    }\n  }\n": types.ProjectDashboardItemFragmentDoc,
    "\n  fragment PendingFileUpload on FileUpload {\n    id\n    projectId\n    modelName\n    convertedStatus\n    convertedMessage\n    uploadDate\n    convertedLastUpdate\n    fileType\n    fileName\n  }\n": types.PendingFileUploadFragmentDoc,
    "\n  fragment ProjectPageLatestItemsModelItem on Model {\n    id\n    name\n    displayName\n    versionCount: versions(limit: 0) {\n      totalCount\n    }\n    commentThreadCount: commentThreads(limit: 0) {\n      totalCount\n    }\n    pendingImportedVersions(limit: 1) {\n      ...PendingFileUpload\n    }\n    previewUrl\n    createdAt\n    updatedAt\n    ...ProjectPageModelsCardRenameDialog\n    ...ProjectPageModelsCardDeleteDialog\n    ...ProjectPageModelsActions\n    ...ModelCardAutomationStatus_Model\n  }\n": types.ProjectPageLatestItemsModelItemFragmentDoc,
    "\n  fragment ProjectUpdatableMetadata on Project {\n    id\n    name\n    description\n    visibility\n    allowPublicComments\n  }\n": types.ProjectUpdatableMetadataFragmentDoc,
    "\n  mutation CreateModel($input: CreateModelInput!) {\n    modelMutations {\n      create(input: $input) {\n        ...ProjectPageLatestItemsModelItem\n      }\n    }\n  }\n": types.CreateModelDocument,
    "\n  mutation CreateProject($input: ProjectCreateInput) {\n    projectMutations {\n      create(input: $input) {\n        ...ProjectPageProject\n        ...ProjectDashboardItem\n      }\n    }\n  }\n": types.CreateProjectDocument,
    "\n  mutation UpdateModel($input: UpdateModelInput!) {\n    modelMutations {\n      update(input: $input) {\n        ...ProjectPageLatestItemsModelItem\n      }\n    }\n  }\n": types.UpdateModelDocument,
    "\n  mutation DeleteModel($input: DeleteModelInput!) {\n    modelMutations {\n      delete(input: $input)\n    }\n  }\n": types.DeleteModelDocument,
    "\n  mutation UpdateProjectRole($input: ProjectUpdateRoleInput!) {\n    projectMutations {\n      updateRole(input: $input) {\n        id\n        team {\n          role\n          user {\n            ...LimitedUserAvatar\n          }\n        }\n      }\n    }\n  }\n": types.UpdateProjectRoleDocument,
    "\n  mutation InviteProjectUser($projectId: ID!, $input: [ProjectInviteCreateInput!]!) {\n    projectMutations {\n      invites {\n        batchCreate(projectId: $projectId, input: $input) {\n          ...ProjectPageTeamDialog\n        }\n      }\n    }\n  }\n": types.InviteProjectUserDocument,
    "\n  mutation CancelProjectInvite($projectId: ID!, $inviteId: String!) {\n    projectMutations {\n      invites {\n        cancel(projectId: $projectId, inviteId: $inviteId) {\n          ...ProjectPageTeamDialog\n        }\n      }\n    }\n  }\n": types.CancelProjectInviteDocument,
    "\n  mutation UpdateProjectMetadata($update: ProjectUpdateInput!) {\n    projectMutations {\n      update(update: $update) {\n        id\n        ...ProjectUpdatableMetadata\n      }\n    }\n  }\n": types.UpdateProjectMetadataDocument,
    "\n  mutation DeleteProject($id: String!) {\n    projectMutations {\n      delete(id: $id)\n    }\n  }\n": types.DeleteProjectDocument,
    "\n  mutation UseProjectInvite($input: ProjectInviteUseInput!) {\n    projectMutations {\n      invites {\n        use(input: $input)\n      }\n    }\n  }\n": types.UseProjectInviteDocument,
    "\n  mutation LeaveProject($projectId: String!) {\n    projectMutations {\n      leave(id: $projectId)\n    }\n  }\n": types.LeaveProjectDocument,
    "\n  mutation DeleteVersions($input: DeleteVersionsInput!) {\n    versionMutations {\n      delete(input: $input)\n    }\n  }\n": types.DeleteVersionsDocument,
    "\n  mutation MoveVersions($input: MoveVersionsInput!) {\n    versionMutations {\n      moveToModel(input: $input) {\n        id\n      }\n    }\n  }\n": types.MoveVersionsDocument,
    "\n  mutation UpdateVersion($input: UpdateVersionInput!) {\n    versionMutations {\n      update(input: $input) {\n        id\n        message\n      }\n    }\n  }\n": types.UpdateVersionDocument,
    "\n  mutation deleteWebhook($webhook: WebhookDeleteInput!) {\n    webhookDelete(webhook: $webhook)\n  }\n": types.DeleteWebhookDocument,
    "\n  mutation createWebhook($webhook: WebhookCreateInput!) {\n    webhookCreate(webhook: $webhook)\n  }\n": types.CreateWebhookDocument,
    "\n  mutation updateWebhook($webhook: WebhookUpdateInput!) {\n    webhookUpdate(webhook: $webhook)\n  }\n": types.UpdateWebhookDocument,
    "\n  query ProjectAccessCheck($id: String!) {\n    project(id: $id) {\n      id\n    }\n  }\n": types.ProjectAccessCheckDocument,
    "\n  query ProjectsDashboardQuery($filter: UserProjectsFilter, $cursor: String) {\n    activeUser {\n      id\n      projects(filter: $filter, limit: 6, cursor: $cursor) {\n        cursor\n        totalCount\n        items {\n          ...ProjectDashboardItem\n        }\n      }\n      ...ProjectsInviteBanners\n    }\n  }\n": types.ProjectsDashboardQueryDocument,
    "\n  query ProjectPageQuery($id: String!, $token: String) {\n    project(id: $id) {\n      ...ProjectPageProject\n    }\n    projectInvite(projectId: $id, token: $token) {\n      ...ProjectsInviteBanner\n    }\n  }\n": types.ProjectPageQueryDocument,
    "\n  query ProjectLatestModels($projectId: String!, $filter: ProjectModelsFilter) {\n    project(id: $projectId) {\n      id\n      models(cursor: null, limit: 16, filter: $filter) {\n        totalCount\n        cursor\n        items {\n          ...ProjectPageLatestItemsModelItem\n        }\n      }\n      pendingImportedModels {\n        ...PendingFileUpload\n      }\n    }\n  }\n": types.ProjectLatestModelsDocument,
    "\n  query ProjectLatestModelsPagination(\n    $projectId: String!\n    $filter: ProjectModelsFilter\n    $cursor: String = null\n  ) {\n    project(id: $projectId) {\n      id\n      models(cursor: $cursor, limit: 16, filter: $filter) {\n        totalCount\n        cursor\n        items {\n          ...ProjectPageLatestItemsModelItem\n        }\n      }\n    }\n  }\n": types.ProjectLatestModelsPaginationDocument,
    "\n  query ProjectModelsTreeTopLevel(\n    $projectId: String!\n    $filter: ProjectModelsTreeFilter\n  ) {\n    project(id: $projectId) {\n      id\n      modelsTree(cursor: null, limit: 8, filter: $filter) {\n        totalCount\n        cursor\n        items {\n          ...SingleLevelModelTreeItem\n        }\n      }\n      pendingImportedModels {\n        ...PendingFileUpload\n      }\n    }\n  }\n": types.ProjectModelsTreeTopLevelDocument,
    "\n  query ProjectModelsTreeTopLevelPagination(\n    $projectId: String!\n    $filter: ProjectModelsTreeFilter\n    $cursor: String = null\n  ) {\n    project(id: $projectId) {\n      id\n      modelsTree(cursor: $cursor, limit: 8, filter: $filter) {\n        totalCount\n        cursor\n        items {\n          ...SingleLevelModelTreeItem\n        }\n      }\n    }\n  }\n": types.ProjectModelsTreeTopLevelPaginationDocument,
    "\n  query ProjectModelChildrenTree($projectId: String!, $parentName: String!) {\n    project(id: $projectId) {\n      id\n      modelChildrenTree(fullName: $parentName) {\n        ...SingleLevelModelTreeItem\n      }\n    }\n  }\n": types.ProjectModelChildrenTreeDocument,
    "\n  query ProjectLatestCommentThreads(\n    $projectId: String!\n    $cursor: String = null\n    $filter: ProjectCommentsFilter = null\n  ) {\n    project(id: $projectId) {\n      id\n      commentThreads(cursor: $cursor, limit: 8, filter: $filter) {\n        totalCount\n        cursor\n        items {\n          ...ProjectPageLatestItemsCommentItem\n        }\n      }\n    }\n  }\n": types.ProjectLatestCommentThreadsDocument,
    "\n  query ProjectInvite($projectId: String!, $token: String) {\n    projectInvite(projectId: $projectId, token: $token) {\n      ...ProjectsInviteBanner\n    }\n  }\n": types.ProjectInviteDocument,
    "\n  query ProjectModelCheck($projectId: String!, $modelId: String!) {\n    project(id: $projectId) {\n      model(id: $modelId) {\n        id\n      }\n    }\n  }\n": types.ProjectModelCheckDocument,
    "\n  query ProjectModelPage(\n    $projectId: String!\n    $modelId: String!\n    $versionsCursor: String\n  ) {\n    project(id: $projectId) {\n      ...ProjectModelPageHeaderProject\n      ...ProjectModelPageVersionsProject\n    }\n  }\n": types.ProjectModelPageDocument,
    "\n  query ProjectModelVersions(\n    $projectId: String!\n    $modelId: String!\n    $versionsCursor: String\n  ) {\n    project(id: $projectId) {\n      ...ProjectModelPageVersionsPagination\n    }\n  }\n": types.ProjectModelVersionsDocument,
    "\n  query ProjectModelsPage($projectId: String!) {\n    project(id: $projectId) {\n      ...ProjectModelsPageHeader_Project\n      ...ProjectModelsPageResults_Project\n    }\n  }\n": types.ProjectModelsPageDocument,
    "\n  query ProjectDiscussionsPage($projectId: String!) {\n    project(id: $projectId) {\n      ...ProjectDiscussionsPageHeader_Project\n      ...ProjectDiscussionsPageResults_Project\n    }\n  }\n": types.ProjectDiscussionsPageDocument,
    "\n  query ProjectWebhooks($projectId: String!) {\n    project(id: $projectId) {\n      id\n      name\n      webhooks {\n        items {\n          streamId\n          triggers\n          enabled\n          url\n          id\n          description\n          history(limit: 5) {\n            items {\n              status\n              statusInfo\n            }\n          }\n        }\n        totalCount\n      }\n    }\n  }\n": types.ProjectWebhooksDocument,
    "\n  query Blob($blobId: String!, $streamId: String!) {\n    stream(id: $streamId) {\n      blob(id: $blobId) {\n        id\n        fileName\n        fileType\n        fileSize\n        createdAt\n      }\n    }\n  }\n": types.BlobDocument,
    "\n  subscription OnProjectUpdated($id: String!) {\n    projectUpdated(id: $id) {\n      id\n      type\n      project {\n        ...ProjectPageProject\n        ...ProjectDashboardItemNoModels\n      }\n    }\n  }\n": types.OnProjectUpdatedDocument,
    "\n  subscription OnProjectModelsUpdate($id: String!) {\n    projectModelsUpdated(id: $id) {\n      id\n      type\n      model {\n        id\n        versions(limit: 1) {\n          items {\n            id\n            referencedObject\n          }\n        }\n        ...ProjectPageLatestItemsModelItem\n      }\n    }\n  }\n": types.OnProjectModelsUpdateDocument,
    "\n  subscription OnProjectVersionsUpdate($id: String!) {\n    projectVersionsUpdated(id: $id) {\n      id\n      modelId\n      type\n      version {\n        id\n        ...ViewerModelVersionCardItem\n        ...ProjectModelPageVersionsCardVersion\n        model {\n          id\n          ...ProjectPageLatestItemsModelItem\n        }\n      }\n    }\n  }\n": types.OnProjectVersionsUpdateDocument,
    "\n  subscription OnProjectVersionsPreviewGenerated($id: String!) {\n    projectVersionsPreviewGenerated(id: $id) {\n      projectId\n      objectId\n      versionId\n    }\n  }\n": types.OnProjectVersionsPreviewGeneratedDocument,
    "\n  subscription OnProjectPendingModelsUpdated($id: String!) {\n    projectPendingModelsUpdated(id: $id) {\n      id\n      type\n      model {\n        ...PendingFileUpload\n        model {\n          ...ProjectPageLatestItemsModelItem\n        }\n      }\n    }\n  }\n": types.OnProjectPendingModelsUpdatedDocument,
    "\n  subscription OnProjectPendingVersionsUpdated($id: String!) {\n    projectPendingVersionsUpdated(id: $id) {\n      id\n      type\n      version {\n        ...PendingFileUpload\n        model {\n          ...ProjectPageLatestItemsModelItem\n        }\n      }\n    }\n  }\n": types.OnProjectPendingVersionsUpdatedDocument,
    "\n  mutation ServerInfoUpdate($info: ServerInfoUpdateInput!) {\n    serverInfoUpdate(info: $info)\n  }\n": types.ServerInfoUpdateDocument,
    "\n  mutation AdminPanelDeleteUser($userConfirmation: UserDeleteInput!) {\n    adminDeleteUser(userConfirmation: $userConfirmation)\n  }\n": types.AdminPanelDeleteUserDocument,
    "\n  mutation AdminPanelDeleteProject($ids: [String!]) {\n    streamsDelete(ids: $ids)\n  }\n": types.AdminPanelDeleteProjectDocument,
    "\n  mutation AdminPanelResendInvite($inviteId: String!) {\n    inviteResend(inviteId: $inviteId)\n  }\n": types.AdminPanelResendInviteDocument,
    "\n  mutation AdminPanelDeleteInvite($inviteId: String!) {\n    inviteDelete(inviteId: $inviteId)\n  }\n": types.AdminPanelDeleteInviteDocument,
    "\n  mutation AdminChangeUseRole($userRoleInput: UserRoleInput!) {\n    userRoleChange(userRoleInput: $userRoleInput)\n  }\n": types.AdminChangeUseRoleDocument,
    "\n  query ServerManagementDataPage {\n    admin {\n      userList {\n        totalCount\n      }\n      projectList {\n        totalCount\n      }\n      inviteList {\n        totalCount\n      }\n    }\n    serverInfo {\n      name\n      version\n    }\n  }\n": types.ServerManagementDataPageDocument,
    "\n  query ServerSettingsDialogData {\n    serverInfo {\n      name\n      description\n      adminContact\n      company\n      termsOfService\n      inviteOnly\n      guestModeEnabled\n    }\n  }\n": types.ServerSettingsDialogDataDocument,
    "\n  query AdminPanelUsersList($limit: Int!, $cursor: String, $query: String) {\n    admin {\n      userList(limit: $limit, cursor: $cursor, query: $query) {\n        totalCount\n        cursor\n        items {\n          id\n          email\n          avatar\n          name\n          role\n          verified\n          company\n        }\n      }\n    }\n  }\n": types.AdminPanelUsersListDocument,
    "\n  query AdminPanelProjectsList(\n    $query: String\n    $orderBy: String\n    $limit: Int!\n    $visibility: String\n    $cursor: String\n  ) {\n    admin {\n      projectList(\n        query: $query\n        orderBy: $orderBy\n        limit: $limit\n        visibility: $visibility\n        cursor: $cursor\n      ) {\n        cursor\n        items {\n          id\n          name\n          visibility\n          createdAt\n          updatedAt\n          models {\n            totalCount\n          }\n          versions {\n            totalCount\n          }\n          team {\n            user {\n              name\n              id\n              avatar\n            }\n          }\n        }\n        totalCount\n        cursor\n      }\n    }\n  }\n": types.AdminPanelProjectsListDocument,
    "\n  query AdminPanelInvitesList($limit: Int!, $cursor: String, $query: String) {\n    admin {\n      inviteList(limit: $limit, cursor: $cursor, query: $query) {\n        cursor\n        items {\n          email\n          id\n          invitedBy {\n            id\n            name\n          }\n        }\n        totalCount\n      }\n    }\n  }\n": types.AdminPanelInvitesListDocument,
    "\n  mutation InviteServerUser($input: [ServerInviteCreateInput!]!) {\n    serverInviteBatchCreate(input: $input)\n  }\n": types.InviteServerUserDocument,
    "\n  fragment AppAuthorAvatar on AppAuthor {\n    id\n    name\n    avatar\n  }\n": types.AppAuthorAvatarFragmentDoc,
    "\n  fragment LimitedUserAvatar on LimitedUser {\n    id\n    name\n    avatar\n  }\n": types.LimitedUserAvatarFragmentDoc,
    "\n  fragment ActiveUserAvatar on User {\n    id\n    name\n    avatar\n  }\n": types.ActiveUserAvatarFragmentDoc,
    "\n  mutation UpdateUser($input: UserUpdateInput!) {\n    activeUserMutations {\n      update(user: $input) {\n        id\n        name\n        bio\n        company\n        avatar\n      }\n    }\n  }\n": types.UpdateUserDocument,
    "\n  mutation UpdateNotificationPreferences($input: JSONObject!) {\n    userNotificationPreferencesUpdate(preferences: $input)\n  }\n": types.UpdateNotificationPreferencesDocument,
    "\n  mutation DeleteAccount($input: UserDeleteInput!) {\n    userDelete(userConfirmation: $input)\n  }\n": types.DeleteAccountDocument,
    "\n  query ProfileEditDialog {\n    activeUser {\n      ...UserProfileEditDialogBio_User\n      ...UserProfileEditDialogNotificationPreferences_User\n      ...UserProfileEditDialogDeleteAccount_User\n    }\n  }\n": types.ProfileEditDialogDocument,
    "\n  fragment ViewerCommentBubblesData on Comment {\n    id\n    viewedAt\n    viewerState\n  }\n": types.ViewerCommentBubblesDataFragmentDoc,
    "\n  fragment ViewerCommentThread on Comment {\n    ...ViewerCommentsListItem\n    ...ViewerCommentBubblesData\n    ...ViewerCommentsReplyItem\n  }\n": types.ViewerCommentThreadFragmentDoc,
    "\n  fragment ViewerCommentsReplyItem on Comment {\n    id\n    archived\n    rawText\n    text {\n      doc\n    }\n    author {\n      ...LimitedUserAvatar\n    }\n    createdAt\n    ...ThreadCommentAttachment\n  }\n": types.ViewerCommentsReplyItemFragmentDoc,
    "\n  mutation BroadcastViewerUserActivity(\n    $projectId: String!\n    $resourceIdString: String!\n    $message: ViewerUserActivityMessageInput!\n  ) {\n    broadcastViewerUserActivity(\n      projectId: $projectId\n      resourceIdString: $resourceIdString\n      message: $message\n    )\n  }\n": types.BroadcastViewerUserActivityDocument,
    "\n  mutation MarkCommentViewed($threadId: String!) {\n    commentMutations {\n      markViewed(commentId: $threadId)\n    }\n  }\n": types.MarkCommentViewedDocument,
    "\n  mutation CreateCommentThread($input: CreateCommentInput!) {\n    commentMutations {\n      create(input: $input) {\n        ...ViewerCommentThread\n      }\n    }\n  }\n": types.CreateCommentThreadDocument,
    "\n  mutation CreateCommentReply($input: CreateCommentReplyInput!) {\n    commentMutations {\n      reply(input: $input) {\n        ...ViewerCommentsReplyItem\n      }\n    }\n  }\n": types.CreateCommentReplyDocument,
    "\n  mutation ArchiveComment($commentId: String!, $archived: Boolean) {\n    commentMutations {\n      archive(commentId: $commentId, archived: $archived)\n    }\n  }\n": types.ArchiveCommentDocument,
    "\n  query ProjectViewerResources($projectId: String!, $resourceUrlString: String!) {\n    project(id: $projectId) {\n      id\n      viewerResources(resourceIdString: $resourceUrlString) {\n        identifier\n        items {\n          modelId\n          versionId\n          objectId\n        }\n      }\n    }\n  }\n": types.ProjectViewerResourcesDocument,
    "\n  query ViewerLoadedResources(\n    $projectId: String!\n    $modelIds: [String!]!\n    $versionIds: [String!]\n  ) {\n    project(id: $projectId) {\n      id\n      role\n      models(filter: { ids: $modelIds }) {\n        totalCount\n        items {\n          id\n          name\n          updatedAt\n          loadedVersion: versions(\n            filter: { priorityIds: $versionIds, priorityIdsOnly: true }\n          ) {\n            items {\n              ...ViewerModelVersionCardItem\n              automationStatus {\n                id\n                status\n                statusMessage\n                automationRuns {\n                  id\n                  automationId\n                  automationName\n                  versionId\n                  createdAt\n                  updatedAt\n                  status\n                  functionRuns {\n                    id\n                    functionId\n                    functionName\n                    functionLogo\n                    resultVersions {\n                      id\n                      referencedObject\n                      model {\n                        id\n                        name\n                      }\n                    }\n                    elapsed\n                    status\n                    contextView\n                    statusMessage\n                    results\n                  }\n                }\n              }\n            }\n          }\n          versions(limit: 5) {\n            totalCount\n            cursor\n            items {\n              ...ViewerModelVersionCardItem\n            }\n          }\n        }\n      }\n      ...ProjectPageLatestItemsModels\n      ...ModelPageProject\n    }\n  }\n": types.ViewerLoadedResourcesDocument,
    "\n  query ViewerModelVersions(\n    $projectId: String!\n    $modelId: String!\n    $versionsCursor: String\n  ) {\n    project(id: $projectId) {\n      id\n      role\n      model(id: $modelId) {\n        id\n        versions(cursor: $versionsCursor, limit: 5) {\n          totalCount\n          cursor\n          items {\n            ...ViewerModelVersionCardItem\n          }\n        }\n      }\n    }\n  }\n": types.ViewerModelVersionsDocument,
    "\n  query ViewerDiffVersions(\n    $projectId: String!\n    $modelId: String!\n    $versionAId: String!\n    $versionBId: String!\n  ) {\n    project(id: $projectId) {\n      id\n      model(id: $modelId) {\n        id\n        versionA: version(id: $versionAId) {\n          ...ViewerModelVersionCardItem\n        }\n        versionB: version(id: $versionBId) {\n          ...ViewerModelVersionCardItem\n        }\n      }\n    }\n  }\n": types.ViewerDiffVersionsDocument,
    "\n  query ViewerLoadedThreads(\n    $projectId: String!\n    $filter: ProjectCommentsFilter!\n    $cursor: String\n    $limit: Int = 25\n  ) {\n    project(id: $projectId) {\n      id\n      commentThreads(filter: $filter, cursor: $cursor, limit: $limit) {\n        totalCount\n        totalArchivedCount\n        items {\n          ...ViewerCommentThread\n          ...LinkableComment\n        }\n      }\n    }\n  }\n": types.ViewerLoadedThreadsDocument,
    "\n  subscription OnViewerUserActivityBroadcasted(\n    $target: ViewerUpdateTrackingTarget!\n    $sessionId: String!\n  ) {\n    viewerUserActivityBroadcasted(target: $target, sessionId: $sessionId) {\n      userName\n      userId\n      user {\n        ...LimitedUserAvatar\n      }\n      state\n      status\n      sessionId\n    }\n  }\n": types.OnViewerUserActivityBroadcastedDocument,
    "\n  subscription OnViewerCommentsUpdated($target: ViewerUpdateTrackingTarget!) {\n    projectCommentsUpdated(target: $target) {\n      id\n      type\n      comment {\n        id\n        parent {\n          id\n        }\n        ...ViewerCommentThread\n      }\n    }\n  }\n": types.OnViewerCommentsUpdatedDocument,
    "\n  fragment LinkableComment on Comment {\n    id\n    viewerResources {\n      modelId\n      versionId\n      objectId\n    }\n  }\n": types.LinkableCommentFragmentDoc,
    "\n  query LegacyBranchRedirectMetadata($streamId: String!, $branchName: String!) {\n    stream(id: $streamId) {\n      branch(name: $branchName) {\n        id\n      }\n    }\n  }\n": types.LegacyBranchRedirectMetadataDocument,
    "\n  query LegacyViewerCommitRedirectMetadata($streamId: String!, $commitId: String!) {\n    stream(id: $streamId) {\n      commit(id: $commitId) {\n        id\n        branch {\n          id\n        }\n      }\n    }\n  }\n": types.LegacyViewerCommitRedirectMetadataDocument,
    "\n  query ResolveCommentLink($commentId: String!, $projectId: String!) {\n    comment(id: $commentId, streamId: $projectId) {\n      ...LinkableComment\n    }\n  }\n": types.ResolveCommentLinkDocument,
    "\n  fragment ProjectPageProject on Project {\n    id\n    createdAt\n    ...ProjectPageProjectHeader\n    ...ProjectPageStatsBlockTeam\n    ...ProjectPageTeamDialog\n    ...ProjectPageStatsBlockVersions\n    ...ProjectPageStatsBlockModels\n    ...ProjectPageStatsBlockComments\n    ...ProjectPageLatestItemsModels\n    ...ProjectPageLatestItemsComments\n  }\n": types.ProjectPageProjectFragmentDoc,
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
export function graphql(source: "\n  fragment AuthRegisterPanelServerInfo on ServerInfo {\n    inviteOnly\n  }\n"): (typeof documents)["\n  fragment AuthRegisterPanelServerInfo on ServerInfo {\n    inviteOnly\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query RegisterPanelServerInvite($token: String!) {\n    serverInviteByToken(token: $token) {\n      id\n      email\n    }\n  }\n"): (typeof documents)["\n  query RegisterPanelServerInvite($token: String!) {\n    serverInviteByToken(token: $token) {\n      id\n      email\n    }\n  }\n"];
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
export function graphql(source: "\n  fragment CommonModelSelectorModel on Model {\n    id\n    name\n  }\n"): (typeof documents)["\n  fragment CommonModelSelectorModel on Model {\n    id\n    name\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment FormSelectProjects_Project on Project {\n    id\n    name\n  }\n"): (typeof documents)["\n  fragment FormSelectProjects_Project on Project {\n    id\n    name\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment FormUsersSelectItem on LimitedUser {\n    id\n    name\n    avatar\n  }\n"): (typeof documents)["\n  fragment FormUsersSelectItem on LimitedUser {\n    id\n    name\n    avatar\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ProjectDiscussionsPageHeader_Project on Project {\n    id\n    name\n  }\n"): (typeof documents)["\n  fragment ProjectDiscussionsPageHeader_Project on Project {\n    id\n    name\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ProjectDiscussionsPageResults_Project on Project {\n    id\n  }\n"): (typeof documents)["\n  fragment ProjectDiscussionsPageResults_Project on Project {\n    id\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ProjectModelPageHeaderProject on Project {\n    id\n    name\n    role\n    model(id: $modelId) {\n      id\n      name\n      description\n    }\n  }\n"): (typeof documents)["\n  fragment ProjectModelPageHeaderProject on Project {\n    id\n    name\n    role\n    model(id: $modelId) {\n      id\n      name\n      description\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ProjectModelPageVersionsPagination on Project {\n    id\n    visibility\n    model(id: $modelId) {\n      id\n      versions(limit: 16, cursor: $versionsCursor) {\n        cursor\n        totalCount\n        items {\n          ...ProjectModelPageVersionsCardVersion\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  fragment ProjectModelPageVersionsPagination on Project {\n    id\n    visibility\n    model(id: $modelId) {\n      id\n      versions(limit: 16, cursor: $versionsCursor) {\n        cursor\n        totalCount\n        items {\n          ...ProjectModelPageVersionsCardVersion\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ProjectModelPageVersionsProject on Project {\n    ...ProjectPageProjectHeader\n    model(id: $modelId) {\n      id\n      name\n      pendingImportedVersions {\n        ...PendingFileUpload\n      }\n    }\n    ...ProjectModelPageVersionsPagination\n  }\n"): (typeof documents)["\n  fragment ProjectModelPageVersionsProject on Project {\n    ...ProjectPageProjectHeader\n    model(id: $modelId) {\n      id\n      name\n      pendingImportedVersions {\n        ...PendingFileUpload\n      }\n    }\n    ...ProjectModelPageVersionsPagination\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ProjectModelPageDialogDeleteVersion on Version {\n    id\n    message\n  }\n"): (typeof documents)["\n  fragment ProjectModelPageDialogDeleteVersion on Version {\n    id\n    message\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ProjectModelPageDialogEditMessageVersion on Version {\n    id\n    message\n  }\n"): (typeof documents)["\n  fragment ProjectModelPageDialogEditMessageVersion on Version {\n    id\n    message\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ProjectModelPageDialogMoveToVersion on Version {\n    id\n    message\n  }\n"): (typeof documents)["\n  fragment ProjectModelPageDialogMoveToVersion on Version {\n    id\n    message\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ProjectModelPageVersionsCardVersion on Version {\n    id\n    message\n    authorUser {\n      ...LimitedUserAvatar\n    }\n    createdAt\n    previewUrl\n    sourceApplication\n    commentThreadCount: commentThreads(limit: 0) {\n      totalCount\n    }\n    ...ProjectModelPageDialogDeleteVersion\n    ...ProjectModelPageDialogMoveToVersion\n    ...ModelCardAutomationStatus_Version\n  }\n"): (typeof documents)["\n  fragment ProjectModelPageVersionsCardVersion on Version {\n    id\n    message\n    authorUser {\n      ...LimitedUserAvatar\n    }\n    createdAt\n    previewUrl\n    sourceApplication\n    commentThreadCount: commentThreads(limit: 0) {\n      totalCount\n    }\n    ...ProjectModelPageDialogDeleteVersion\n    ...ProjectModelPageDialogMoveToVersion\n    ...ModelCardAutomationStatus_Version\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ProjectModelsPageHeader_Project on Project {\n    id\n    name\n    sourceApps\n    role\n    team {\n      user {\n        ...FormUsersSelectItem\n      }\n    }\n  }\n"): (typeof documents)["\n  fragment ProjectModelsPageHeader_Project on Project {\n    id\n    name\n    sourceApps\n    role\n    team {\n      user {\n        ...FormUsersSelectItem\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ProjectModelsPageResults_Project on Project {\n    ...ProjectPageLatestItemsModels\n  }\n"): (typeof documents)["\n  fragment ProjectModelsPageResults_Project on Project {\n    ...ProjectPageLatestItemsModels\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ProjectPageProjectHeader on Project {\n    id\n    role\n    name\n    description\n    visibility\n    allowPublicComments\n  }\n"): (typeof documents)["\n  fragment ProjectPageProjectHeader on Project {\n    id\n    role\n    name\n    description\n    visibility\n    allowPublicComments\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ProjectPageLatestItemsComments on Project {\n    id\n    commentThreadCount: commentThreads(limit: 0) {\n      totalCount\n    }\n  }\n"): (typeof documents)["\n  fragment ProjectPageLatestItemsComments on Project {\n    id\n    commentThreadCount: commentThreads(limit: 0) {\n      totalCount\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ProjectPageLatestItemsCommentItem on Comment {\n    id\n    author {\n      ...FormUsersSelectItem\n    }\n    screenshot\n    rawText\n    createdAt\n    updatedAt\n    archived\n    repliesCount: replies(limit: 0) {\n      totalCount\n    }\n    replyAuthors(limit: 4) {\n      totalCount\n      items {\n        ...FormUsersSelectItem\n      }\n    }\n  }\n"): (typeof documents)["\n  fragment ProjectPageLatestItemsCommentItem on Comment {\n    id\n    author {\n      ...FormUsersSelectItem\n    }\n    screenshot\n    rawText\n    createdAt\n    updatedAt\n    archived\n    repliesCount: replies(limit: 0) {\n      totalCount\n    }\n    replyAuthors(limit: 4) {\n      totalCount\n      items {\n        ...FormUsersSelectItem\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ProjectPageLatestItemsModels on Project {\n    id\n    role\n    visibility\n    modelCount: models(limit: 0) {\n      totalCount\n    }\n  }\n"): (typeof documents)["\n  fragment ProjectPageLatestItemsModels on Project {\n    id\n    role\n    visibility\n    modelCount: models(limit: 0) {\n      totalCount\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ProjectPageModelsActions on Model {\n    id\n    name\n  }\n"): (typeof documents)["\n  fragment ProjectPageModelsActions on Model {\n    id\n    name\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ProjectPageModelsCardProject on Project {\n    id\n    role\n    visibility\n  }\n"): (typeof documents)["\n  fragment ProjectPageModelsCardProject on Project {\n    id\n    role\n    visibility\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ModelPreview on Model {\n    previewUrl\n  }\n"): (typeof documents)["\n  fragment ModelPreview on Model {\n    previewUrl\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment SingleLevelModelTreeItem on ModelsTreeItem {\n    id\n    name\n    fullName\n    model {\n      ...ProjectPageLatestItemsModelItem\n    }\n    hasChildren\n    updatedAt\n  }\n"): (typeof documents)["\n  fragment SingleLevelModelTreeItem on ModelsTreeItem {\n    id\n    name\n    fullName\n    model {\n      ...ProjectPageLatestItemsModelItem\n    }\n    hasChildren\n    updatedAt\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ModelCardAutomationStatus_AutomationsStatus on AutomationsStatus {\n    id\n    status\n    statusMessage\n    automationRuns {\n      id\n      automationId\n      automationName\n      createdAt\n      status\n      functionRuns {\n        id\n        functionId\n        functionName\n        functionLogo\n        elapsed\n        status\n        statusMessage\n        contextView\n        results\n        resultVersions {\n          id\n          model {\n            id\n            name\n          }\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  fragment ModelCardAutomationStatus_AutomationsStatus on AutomationsStatus {\n    id\n    status\n    statusMessage\n    automationRuns {\n      id\n      automationId\n      automationName\n      createdAt\n      status\n      functionRuns {\n        id\n        functionId\n        functionName\n        functionLogo\n        elapsed\n        status\n        statusMessage\n        contextView\n        results\n        resultVersions {\n          id\n          model {\n            id\n            name\n          }\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ModelCardAutomationStatus_Model on Model {\n    id\n    displayName\n    automationStatus {\n      ...ModelCardAutomationStatus_AutomationsStatus\n    }\n  }\n"): (typeof documents)["\n  fragment ModelCardAutomationStatus_Model on Model {\n    id\n    displayName\n    automationStatus {\n      ...ModelCardAutomationStatus_AutomationsStatus\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ModelCardAutomationStatus_Version on Version {\n    id\n    automationStatus {\n      ...ModelCardAutomationStatus_AutomationsStatus\n    }\n  }\n"): (typeof documents)["\n  fragment ModelCardAutomationStatus_Version on Version {\n    id\n    automationStatus {\n      ...ModelCardAutomationStatus_AutomationsStatus\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ProjectPageModelsCardDeleteDialog on Model {\n    id\n    name\n  }\n"): (typeof documents)["\n  fragment ProjectPageModelsCardDeleteDialog on Model {\n    id\n    name\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ProjectPageModelsCardRenameDialog on Model {\n    id\n    name\n    description\n  }\n"): (typeof documents)["\n  fragment ProjectPageModelsCardRenameDialog on Model {\n    id\n    name\n    description\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ProjectPageStatsBlockComments on Project {\n    commentThreadCount: commentThreads(limit: 0) {\n      totalCount\n    }\n  }\n"): (typeof documents)["\n  fragment ProjectPageStatsBlockComments on Project {\n    commentThreadCount: commentThreads(limit: 0) {\n      totalCount\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ProjectPageStatsBlockModels on Project {\n    modelCount: models(limit: 0) {\n      totalCount\n    }\n  }\n"): (typeof documents)["\n  fragment ProjectPageStatsBlockModels on Project {\n    modelCount: models(limit: 0) {\n      totalCount\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ProjectPageStatsBlockTeam on Project {\n    id\n    role\n    team {\n      role\n      user {\n        ...LimitedUserAvatar\n      }\n    }\n    ...ProjectPageTeamDialog\n  }\n"): (typeof documents)["\n  fragment ProjectPageStatsBlockTeam on Project {\n    id\n    role\n    team {\n      role\n      user {\n        ...LimitedUserAvatar\n      }\n    }\n    ...ProjectPageTeamDialog\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ProjectPageStatsBlockVersions on Project {\n    versionCount: versions(limit: 0) {\n      totalCount\n    }\n  }\n"): (typeof documents)["\n  fragment ProjectPageStatsBlockVersions on Project {\n    versionCount: versions(limit: 0) {\n      totalCount\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ProjectPageTeamDialog on Project {\n    id\n    name\n    role\n    allowPublicComments\n    visibility\n    team {\n      role\n      user {\n        ...LimitedUserAvatar\n        role\n      }\n    }\n    invitedTeam {\n      id\n      title\n      inviteId\n      role\n      user {\n        ...LimitedUserAvatar\n        role\n      }\n    }\n  }\n"): (typeof documents)["\n  fragment ProjectPageTeamDialog on Project {\n    id\n    name\n    role\n    allowPublicComments\n    visibility\n    team {\n      role\n      user {\n        ...LimitedUserAvatar\n        role\n      }\n    }\n    invitedTeam {\n      id\n      title\n      inviteId\n      role\n      user {\n        ...LimitedUserAvatar\n        role\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription OnUserProjectsUpdate {\n    userProjectsUpdated {\n      type\n      id\n      project {\n        ...ProjectDashboardItem\n      }\n    }\n  }\n"): (typeof documents)["\n  subscription OnUserProjectsUpdate {\n    userProjectsUpdated {\n      type\n      id\n      project {\n        ...ProjectDashboardItem\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ProjectsDashboardFilled on ProjectCollection {\n    items {\n      ...ProjectDashboardItem\n    }\n  }\n"): (typeof documents)["\n  fragment ProjectsDashboardFilled on ProjectCollection {\n    items {\n      ...ProjectDashboardItem\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ProjectsInviteBanner on PendingStreamCollaborator {\n    id\n    invitedBy {\n      ...LimitedUserAvatar\n    }\n    projectId\n    projectName\n    token\n  }\n"): (typeof documents)["\n  fragment ProjectsInviteBanner on PendingStreamCollaborator {\n    id\n    invitedBy {\n      ...LimitedUserAvatar\n    }\n    projectId\n    projectName\n    token\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ProjectsInviteBanners on User {\n    projectInvites {\n      ...ProjectsInviteBanner\n    }\n  }\n"): (typeof documents)["\n  fragment ProjectsInviteBanners on User {\n    projectInvites {\n      ...ProjectsInviteBanner\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment UserProfileEditDialogAvatar_User on User {\n    id\n    avatar\n    ...ActiveUserAvatar\n  }\n"): (typeof documents)["\n  fragment UserProfileEditDialogAvatar_User on User {\n    id\n    avatar\n    ...ActiveUserAvatar\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment UserProfileEditDialogBio_User on User {\n    id\n    name\n    company\n    bio\n    ...UserProfileEditDialogAvatar_User\n  }\n"): (typeof documents)["\n  fragment UserProfileEditDialogBio_User on User {\n    id\n    name\n    company\n    bio\n    ...UserProfileEditDialogAvatar_User\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment UserProfileEditDialogDeleteAccount_User on User {\n    id\n    email\n  }\n"): (typeof documents)["\n  fragment UserProfileEditDialogDeleteAccount_User on User {\n    id\n    email\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment UserProfileEditDialogNotificationPreferences_User on User {\n    id\n    notificationPreferences\n  }\n"): (typeof documents)["\n  fragment UserProfileEditDialogNotificationPreferences_User on User {\n    id\n    notificationPreferences\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ModelPageProject on Project {\n    id\n    createdAt\n    name\n    visibility\n  }\n"): (typeof documents)["\n  fragment ModelPageProject on Project {\n    id\n    createdAt\n    name\n    visibility\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ThreadCommentAttachment on Comment {\n    text {\n      attachments {\n        id\n        fileName\n        fileType\n        fileSize\n      }\n    }\n  }\n"): (typeof documents)["\n  fragment ThreadCommentAttachment on Comment {\n    text {\n      attachments {\n        id\n        fileName\n        fileType\n        fileSize\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ViewerCommentsListItem on Comment {\n    id\n    rawText\n    archived\n    author {\n      ...LimitedUserAvatar\n    }\n    createdAt\n    viewedAt\n    replies {\n      totalCount\n      cursor\n      items {\n        ...ViewerCommentsReplyItem\n      }\n    }\n    replyAuthors(limit: 4) {\n      totalCount\n      items {\n        ...FormUsersSelectItem\n      }\n    }\n    resources {\n      resourceId\n      resourceType\n    }\n  }\n"): (typeof documents)["\n  fragment ViewerCommentsListItem on Comment {\n    id\n    rawText\n    archived\n    author {\n      ...LimitedUserAvatar\n    }\n    createdAt\n    viewedAt\n    replies {\n      totalCount\n      cursor\n      items {\n        ...ViewerCommentsReplyItem\n      }\n    }\n    replyAuthors(limit: 4) {\n      totalCount\n      items {\n        ...FormUsersSelectItem\n      }\n    }\n    resources {\n      resourceId\n      resourceType\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ViewerModelVersionCardItem on Version {\n    id\n    message\n    referencedObject\n    sourceApplication\n    createdAt\n    previewUrl\n    authorUser {\n      ...LimitedUserAvatar\n    }\n  }\n"): (typeof documents)["\n  fragment ViewerModelVersionCardItem on Version {\n    id\n    message\n    referencedObject\n    sourceApplication\n    createdAt\n    previewUrl\n    authorUser {\n      ...LimitedUserAvatar\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ActiveUserMainMetadata {\n    activeUser {\n      id\n      email\n      company\n      bio\n      name\n      role\n      avatar\n      isOnboardingFinished\n      createdAt\n      verified\n      notificationPreferences\n    }\n  }\n"): (typeof documents)["\n  query ActiveUserMainMetadata {\n    activeUser {\n      id\n      email\n      company\n      bio\n      name\n      role\n      avatar\n      isOnboardingFinished\n      createdAt\n      verified\n      notificationPreferences\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n      mutation CreateOnboardingProject {\n        projectMutations {\n          createForOnboarding {\n            ...ProjectPageProject\n            ...ProjectDashboardItem\n          }\n        }\n      }\n    "): (typeof documents)["\n      mutation CreateOnboardingProject {\n        projectMutations {\n          createForOnboarding {\n            ...ProjectPageProject\n            ...ProjectDashboardItem\n          }\n        }\n      }\n    "];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation FinishOnboarding {\n    activeUserMutations {\n      finishOnboarding\n    }\n  }\n"): (typeof documents)["\n  mutation FinishOnboarding {\n    activeUserMutations {\n      finishOnboarding\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RequestVerificationByEmail($email: String!) {\n    requestVerificationByEmail(email: $email)\n  }\n"): (typeof documents)["\n  mutation RequestVerificationByEmail($email: String!) {\n    requestVerificationByEmail(email: $email)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AuthServerInfo {\n    serverInfo {\n      ...AuthStategiesServerInfoFragment\n      ...ServerTermsOfServicePrivacyPolicyFragment\n      ...AuthRegisterPanelServerInfo\n    }\n  }\n"): (typeof documents)["\n  query AuthServerInfo {\n    serverInfo {\n      ...AuthStategiesServerInfoFragment\n      ...ServerTermsOfServicePrivacyPolicyFragment\n      ...AuthRegisterPanelServerInfo\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AuthorizableAppMetadata($id: String!) {\n    app(id: $id) {\n      id\n      name\n      description\n      trustByDefault\n      redirectUrl\n      scopes {\n        name\n        description\n      }\n      author {\n        name\n        id\n        avatar\n      }\n    }\n  }\n"): (typeof documents)["\n  query AuthorizableAppMetadata($id: String!) {\n    app(id: $id) {\n      id\n      name\n      description\n      trustByDefault\n      redirectUrl\n      scopes {\n        name\n        description\n      }\n      author {\n        name\n        id\n        avatar\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription OnModelVersionCardAutomationsStatusUpdated($projectId: String!) {\n    projectAutomationsStatusUpdated(projectId: $projectId) {\n      status {\n        ...ModelCardAutomationStatus_AutomationsStatus\n      }\n      version {\n        id\n      }\n      model {\n        id\n        versions(limit: 1) {\n          items {\n            id\n          }\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  subscription OnModelVersionCardAutomationsStatusUpdated($projectId: String!) {\n    projectAutomationsStatusUpdated(projectId: $projectId) {\n      status {\n        ...ModelCardAutomationStatus_AutomationsStatus\n      }\n      version {\n        id\n      }\n      model {\n        id\n        versions(limit: 1) {\n          items {\n            id\n          }\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query MentionsUserSearch($query: String!, $emailOnly: Boolean = false) {\n    userSearch(\n      query: $query\n      limit: 5\n      cursor: null\n      archived: false\n      emailOnly: $emailOnly\n    ) {\n      items {\n        id\n        name\n        company\n      }\n    }\n  }\n"): (typeof documents)["\n  query MentionsUserSearch($query: String!, $emailOnly: Boolean = false) {\n    userSearch(\n      query: $query\n      limit: 5\n      cursor: null\n      archived: false\n      emailOnly: $emailOnly\n    ) {\n      items {\n        id\n        name\n        company\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query UserSearch($query: String!, $limit: Int, $cursor: String, $archived: Boolean) {\n    userSearch(query: $query, limit: $limit, cursor: $cursor, archived: $archived) {\n      cursor\n      items {\n        id\n        name\n        bio\n        company\n        avatar\n        verified\n        role\n      }\n    }\n  }\n"): (typeof documents)["\n  query UserSearch($query: String!, $limit: Int, $cursor: String, $archived: Boolean) {\n    userSearch(query: $query, limit: $limit, cursor: $cursor, archived: $archived) {\n      cursor\n      items {\n        id\n        name\n        bio\n        company\n        avatar\n        verified\n        role\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ServerInfoBlobSizeLimit {\n    serverInfo {\n      blobSizeLimitBytes\n    }\n  }\n"): (typeof documents)["\n  query ServerInfoBlobSizeLimit {\n    serverInfo {\n      blobSizeLimitBytes\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ServerInfoAllScopes {\n    serverInfo {\n      scopes {\n        name\n        description\n      }\n    }\n  }\n"): (typeof documents)["\n  query ServerInfoAllScopes {\n    serverInfo {\n      scopes {\n        name\n        description\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ProjectModelsSelectorValues($projectId: String!, $cursor: String) {\n    project(id: $projectId) {\n      id\n      models(limit: 100, cursor: $cursor) {\n        cursor\n        totalCount\n        items {\n          ...CommonModelSelectorModel\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query ProjectModelsSelectorValues($projectId: String!, $cursor: String) {\n    project(id: $projectId) {\n      id\n      models(limit: 100, cursor: $cursor) {\n        cursor\n        totalCount\n        items {\n          ...CommonModelSelectorModel\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query MainServerInfoData {\n    serverInfo {\n      adminContact\n      blobSizeLimitBytes\n      canonicalUrl\n      company\n      description\n      guestModeEnabled\n      inviteOnly\n      name\n      termsOfService\n      version\n      automateUrl\n    }\n  }\n"): (typeof documents)["\n  query MainServerInfoData {\n    serverInfo {\n      adminContact\n      blobSizeLimitBytes\n      canonicalUrl\n      company\n      description\n      guestModeEnabled\n      inviteOnly\n      name\n      termsOfService\n      version\n      automateUrl\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteAccessToken($token: String!) {\n    apiTokenRevoke(token: $token)\n  }\n"): (typeof documents)["\n  mutation DeleteAccessToken($token: String!) {\n    apiTokenRevoke(token: $token)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateAccessToken($token: ApiTokenCreateInput!) {\n    apiTokenCreate(token: $token)\n  }\n"): (typeof documents)["\n  mutation CreateAccessToken($token: ApiTokenCreateInput!) {\n    apiTokenCreate(token: $token)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteApplication($appId: String!) {\n    appDelete(appId: $appId)\n  }\n"): (typeof documents)["\n  mutation DeleteApplication($appId: String!) {\n    appDelete(appId: $appId)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateApplication($app: AppCreateInput!) {\n    appCreate(app: $app)\n  }\n"): (typeof documents)["\n  mutation CreateApplication($app: AppCreateInput!) {\n    appCreate(app: $app)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation EditApplication($app: AppUpdateInput!) {\n    appUpdate(app: $app)\n  }\n"): (typeof documents)["\n  mutation EditApplication($app: AppUpdateInput!) {\n    appUpdate(app: $app)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query DeveloperSettingsAccessTokens {\n    activeUser {\n      id\n      apiTokens {\n        id\n        name\n        lastUsed\n        lastChars\n        createdAt\n        scopes\n      }\n    }\n  }\n"): (typeof documents)["\n  query DeveloperSettingsAccessTokens {\n    activeUser {\n      id\n      apiTokens {\n        id\n        name\n        lastUsed\n        lastChars\n        createdAt\n        scopes\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query DeveloperSettingsApplications {\n    activeUser {\n      createdApps {\n        id\n        secret\n        name\n        description\n        redirectUrl\n        scopes {\n          name\n          description\n        }\n      }\n      id\n    }\n  }\n"): (typeof documents)["\n  query DeveloperSettingsApplications {\n    activeUser {\n      createdApps {\n        id\n        secret\n        name\n        description\n        redirectUrl\n        scopes {\n          name\n          description\n        }\n      }\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query SearchProjects($search: String, $onlyWithRoles: [String!] = null) {\n    activeUser {\n      projects(limit: 10, filter: { search: $search, onlyWithRoles: $onlyWithRoles }) {\n        totalCount\n        items {\n          ...FormSelectProjects_Project\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query SearchProjects($search: String, $onlyWithRoles: [String!] = null) {\n    activeUser {\n      projects(limit: 10, filter: { search: $search, onlyWithRoles: $onlyWithRoles }) {\n        totalCount\n        items {\n          ...FormSelectProjects_Project\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ProjectDashboardItemNoModels on Project {\n    id\n    name\n    createdAt\n    updatedAt\n    role\n    team {\n      user {\n        id\n        name\n        avatar\n      }\n    }\n    ...ProjectPageModelsCardProject\n  }\n"): (typeof documents)["\n  fragment ProjectDashboardItemNoModels on Project {\n    id\n    name\n    createdAt\n    updatedAt\n    role\n    team {\n      user {\n        id\n        name\n        avatar\n      }\n    }\n    ...ProjectPageModelsCardProject\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ProjectDashboardItem on Project {\n    id\n    ...ProjectDashboardItemNoModels\n    models(limit: 4, filter: { onlyWithVersions: true }) {\n      totalCount\n      items {\n        ...ProjectPageLatestItemsModelItem\n      }\n    }\n    pendingImportedModels(limit: 4) {\n      ...PendingFileUpload\n    }\n  }\n"): (typeof documents)["\n  fragment ProjectDashboardItem on Project {\n    id\n    ...ProjectDashboardItemNoModels\n    models(limit: 4, filter: { onlyWithVersions: true }) {\n      totalCount\n      items {\n        ...ProjectPageLatestItemsModelItem\n      }\n    }\n    pendingImportedModels(limit: 4) {\n      ...PendingFileUpload\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment PendingFileUpload on FileUpload {\n    id\n    projectId\n    modelName\n    convertedStatus\n    convertedMessage\n    uploadDate\n    convertedLastUpdate\n    fileType\n    fileName\n  }\n"): (typeof documents)["\n  fragment PendingFileUpload on FileUpload {\n    id\n    projectId\n    modelName\n    convertedStatus\n    convertedMessage\n    uploadDate\n    convertedLastUpdate\n    fileType\n    fileName\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ProjectPageLatestItemsModelItem on Model {\n    id\n    name\n    displayName\n    versionCount: versions(limit: 0) {\n      totalCount\n    }\n    commentThreadCount: commentThreads(limit: 0) {\n      totalCount\n    }\n    pendingImportedVersions(limit: 1) {\n      ...PendingFileUpload\n    }\n    previewUrl\n    createdAt\n    updatedAt\n    ...ProjectPageModelsCardRenameDialog\n    ...ProjectPageModelsCardDeleteDialog\n    ...ProjectPageModelsActions\n    ...ModelCardAutomationStatus_Model\n  }\n"): (typeof documents)["\n  fragment ProjectPageLatestItemsModelItem on Model {\n    id\n    name\n    displayName\n    versionCount: versions(limit: 0) {\n      totalCount\n    }\n    commentThreadCount: commentThreads(limit: 0) {\n      totalCount\n    }\n    pendingImportedVersions(limit: 1) {\n      ...PendingFileUpload\n    }\n    previewUrl\n    createdAt\n    updatedAt\n    ...ProjectPageModelsCardRenameDialog\n    ...ProjectPageModelsCardDeleteDialog\n    ...ProjectPageModelsActions\n    ...ModelCardAutomationStatus_Model\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ProjectUpdatableMetadata on Project {\n    id\n    name\n    description\n    visibility\n    allowPublicComments\n  }\n"): (typeof documents)["\n  fragment ProjectUpdatableMetadata on Project {\n    id\n    name\n    description\n    visibility\n    allowPublicComments\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateModel($input: CreateModelInput!) {\n    modelMutations {\n      create(input: $input) {\n        ...ProjectPageLatestItemsModelItem\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation CreateModel($input: CreateModelInput!) {\n    modelMutations {\n      create(input: $input) {\n        ...ProjectPageLatestItemsModelItem\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateProject($input: ProjectCreateInput) {\n    projectMutations {\n      create(input: $input) {\n        ...ProjectPageProject\n        ...ProjectDashboardItem\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation CreateProject($input: ProjectCreateInput) {\n    projectMutations {\n      create(input: $input) {\n        ...ProjectPageProject\n        ...ProjectDashboardItem\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateModel($input: UpdateModelInput!) {\n    modelMutations {\n      update(input: $input) {\n        ...ProjectPageLatestItemsModelItem\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateModel($input: UpdateModelInput!) {\n    modelMutations {\n      update(input: $input) {\n        ...ProjectPageLatestItemsModelItem\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteModel($input: DeleteModelInput!) {\n    modelMutations {\n      delete(input: $input)\n    }\n  }\n"): (typeof documents)["\n  mutation DeleteModel($input: DeleteModelInput!) {\n    modelMutations {\n      delete(input: $input)\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateProjectRole($input: ProjectUpdateRoleInput!) {\n    projectMutations {\n      updateRole(input: $input) {\n        id\n        team {\n          role\n          user {\n            ...LimitedUserAvatar\n          }\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateProjectRole($input: ProjectUpdateRoleInput!) {\n    projectMutations {\n      updateRole(input: $input) {\n        id\n        team {\n          role\n          user {\n            ...LimitedUserAvatar\n          }\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation InviteProjectUser($projectId: ID!, $input: [ProjectInviteCreateInput!]!) {\n    projectMutations {\n      invites {\n        batchCreate(projectId: $projectId, input: $input) {\n          ...ProjectPageTeamDialog\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation InviteProjectUser($projectId: ID!, $input: [ProjectInviteCreateInput!]!) {\n    projectMutations {\n      invites {\n        batchCreate(projectId: $projectId, input: $input) {\n          ...ProjectPageTeamDialog\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CancelProjectInvite($projectId: ID!, $inviteId: String!) {\n    projectMutations {\n      invites {\n        cancel(projectId: $projectId, inviteId: $inviteId) {\n          ...ProjectPageTeamDialog\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation CancelProjectInvite($projectId: ID!, $inviteId: String!) {\n    projectMutations {\n      invites {\n        cancel(projectId: $projectId, inviteId: $inviteId) {\n          ...ProjectPageTeamDialog\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateProjectMetadata($update: ProjectUpdateInput!) {\n    projectMutations {\n      update(update: $update) {\n        id\n        ...ProjectUpdatableMetadata\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateProjectMetadata($update: ProjectUpdateInput!) {\n    projectMutations {\n      update(update: $update) {\n        id\n        ...ProjectUpdatableMetadata\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteProject($id: String!) {\n    projectMutations {\n      delete(id: $id)\n    }\n  }\n"): (typeof documents)["\n  mutation DeleteProject($id: String!) {\n    projectMutations {\n      delete(id: $id)\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UseProjectInvite($input: ProjectInviteUseInput!) {\n    projectMutations {\n      invites {\n        use(input: $input)\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation UseProjectInvite($input: ProjectInviteUseInput!) {\n    projectMutations {\n      invites {\n        use(input: $input)\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation LeaveProject($projectId: String!) {\n    projectMutations {\n      leave(id: $projectId)\n    }\n  }\n"): (typeof documents)["\n  mutation LeaveProject($projectId: String!) {\n    projectMutations {\n      leave(id: $projectId)\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteVersions($input: DeleteVersionsInput!) {\n    versionMutations {\n      delete(input: $input)\n    }\n  }\n"): (typeof documents)["\n  mutation DeleteVersions($input: DeleteVersionsInput!) {\n    versionMutations {\n      delete(input: $input)\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation MoveVersions($input: MoveVersionsInput!) {\n    versionMutations {\n      moveToModel(input: $input) {\n        id\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation MoveVersions($input: MoveVersionsInput!) {\n    versionMutations {\n      moveToModel(input: $input) {\n        id\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateVersion($input: UpdateVersionInput!) {\n    versionMutations {\n      update(input: $input) {\n        id\n        message\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateVersion($input: UpdateVersionInput!) {\n    versionMutations {\n      update(input: $input) {\n        id\n        message\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation deleteWebhook($webhook: WebhookDeleteInput!) {\n    webhookDelete(webhook: $webhook)\n  }\n"): (typeof documents)["\n  mutation deleteWebhook($webhook: WebhookDeleteInput!) {\n    webhookDelete(webhook: $webhook)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation createWebhook($webhook: WebhookCreateInput!) {\n    webhookCreate(webhook: $webhook)\n  }\n"): (typeof documents)["\n  mutation createWebhook($webhook: WebhookCreateInput!) {\n    webhookCreate(webhook: $webhook)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation updateWebhook($webhook: WebhookUpdateInput!) {\n    webhookUpdate(webhook: $webhook)\n  }\n"): (typeof documents)["\n  mutation updateWebhook($webhook: WebhookUpdateInput!) {\n    webhookUpdate(webhook: $webhook)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ProjectAccessCheck($id: String!) {\n    project(id: $id) {\n      id\n    }\n  }\n"): (typeof documents)["\n  query ProjectAccessCheck($id: String!) {\n    project(id: $id) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ProjectsDashboardQuery($filter: UserProjectsFilter, $cursor: String) {\n    activeUser {\n      id\n      projects(filter: $filter, limit: 6, cursor: $cursor) {\n        cursor\n        totalCount\n        items {\n          ...ProjectDashboardItem\n        }\n      }\n      ...ProjectsInviteBanners\n    }\n  }\n"): (typeof documents)["\n  query ProjectsDashboardQuery($filter: UserProjectsFilter, $cursor: String) {\n    activeUser {\n      id\n      projects(filter: $filter, limit: 6, cursor: $cursor) {\n        cursor\n        totalCount\n        items {\n          ...ProjectDashboardItem\n        }\n      }\n      ...ProjectsInviteBanners\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ProjectPageQuery($id: String!, $token: String) {\n    project(id: $id) {\n      ...ProjectPageProject\n    }\n    projectInvite(projectId: $id, token: $token) {\n      ...ProjectsInviteBanner\n    }\n  }\n"): (typeof documents)["\n  query ProjectPageQuery($id: String!, $token: String) {\n    project(id: $id) {\n      ...ProjectPageProject\n    }\n    projectInvite(projectId: $id, token: $token) {\n      ...ProjectsInviteBanner\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ProjectLatestModels($projectId: String!, $filter: ProjectModelsFilter) {\n    project(id: $projectId) {\n      id\n      models(cursor: null, limit: 16, filter: $filter) {\n        totalCount\n        cursor\n        items {\n          ...ProjectPageLatestItemsModelItem\n        }\n      }\n      pendingImportedModels {\n        ...PendingFileUpload\n      }\n    }\n  }\n"): (typeof documents)["\n  query ProjectLatestModels($projectId: String!, $filter: ProjectModelsFilter) {\n    project(id: $projectId) {\n      id\n      models(cursor: null, limit: 16, filter: $filter) {\n        totalCount\n        cursor\n        items {\n          ...ProjectPageLatestItemsModelItem\n        }\n      }\n      pendingImportedModels {\n        ...PendingFileUpload\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ProjectLatestModelsPagination(\n    $projectId: String!\n    $filter: ProjectModelsFilter\n    $cursor: String = null\n  ) {\n    project(id: $projectId) {\n      id\n      models(cursor: $cursor, limit: 16, filter: $filter) {\n        totalCount\n        cursor\n        items {\n          ...ProjectPageLatestItemsModelItem\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query ProjectLatestModelsPagination(\n    $projectId: String!\n    $filter: ProjectModelsFilter\n    $cursor: String = null\n  ) {\n    project(id: $projectId) {\n      id\n      models(cursor: $cursor, limit: 16, filter: $filter) {\n        totalCount\n        cursor\n        items {\n          ...ProjectPageLatestItemsModelItem\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ProjectModelsTreeTopLevel(\n    $projectId: String!\n    $filter: ProjectModelsTreeFilter\n  ) {\n    project(id: $projectId) {\n      id\n      modelsTree(cursor: null, limit: 8, filter: $filter) {\n        totalCount\n        cursor\n        items {\n          ...SingleLevelModelTreeItem\n        }\n      }\n      pendingImportedModels {\n        ...PendingFileUpload\n      }\n    }\n  }\n"): (typeof documents)["\n  query ProjectModelsTreeTopLevel(\n    $projectId: String!\n    $filter: ProjectModelsTreeFilter\n  ) {\n    project(id: $projectId) {\n      id\n      modelsTree(cursor: null, limit: 8, filter: $filter) {\n        totalCount\n        cursor\n        items {\n          ...SingleLevelModelTreeItem\n        }\n      }\n      pendingImportedModels {\n        ...PendingFileUpload\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ProjectModelsTreeTopLevelPagination(\n    $projectId: String!\n    $filter: ProjectModelsTreeFilter\n    $cursor: String = null\n  ) {\n    project(id: $projectId) {\n      id\n      modelsTree(cursor: $cursor, limit: 8, filter: $filter) {\n        totalCount\n        cursor\n        items {\n          ...SingleLevelModelTreeItem\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query ProjectModelsTreeTopLevelPagination(\n    $projectId: String!\n    $filter: ProjectModelsTreeFilter\n    $cursor: String = null\n  ) {\n    project(id: $projectId) {\n      id\n      modelsTree(cursor: $cursor, limit: 8, filter: $filter) {\n        totalCount\n        cursor\n        items {\n          ...SingleLevelModelTreeItem\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ProjectModelChildrenTree($projectId: String!, $parentName: String!) {\n    project(id: $projectId) {\n      id\n      modelChildrenTree(fullName: $parentName) {\n        ...SingleLevelModelTreeItem\n      }\n    }\n  }\n"): (typeof documents)["\n  query ProjectModelChildrenTree($projectId: String!, $parentName: String!) {\n    project(id: $projectId) {\n      id\n      modelChildrenTree(fullName: $parentName) {\n        ...SingleLevelModelTreeItem\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ProjectLatestCommentThreads(\n    $projectId: String!\n    $cursor: String = null\n    $filter: ProjectCommentsFilter = null\n  ) {\n    project(id: $projectId) {\n      id\n      commentThreads(cursor: $cursor, limit: 8, filter: $filter) {\n        totalCount\n        cursor\n        items {\n          ...ProjectPageLatestItemsCommentItem\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query ProjectLatestCommentThreads(\n    $projectId: String!\n    $cursor: String = null\n    $filter: ProjectCommentsFilter = null\n  ) {\n    project(id: $projectId) {\n      id\n      commentThreads(cursor: $cursor, limit: 8, filter: $filter) {\n        totalCount\n        cursor\n        items {\n          ...ProjectPageLatestItemsCommentItem\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ProjectInvite($projectId: String!, $token: String) {\n    projectInvite(projectId: $projectId, token: $token) {\n      ...ProjectsInviteBanner\n    }\n  }\n"): (typeof documents)["\n  query ProjectInvite($projectId: String!, $token: String) {\n    projectInvite(projectId: $projectId, token: $token) {\n      ...ProjectsInviteBanner\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ProjectModelCheck($projectId: String!, $modelId: String!) {\n    project(id: $projectId) {\n      model(id: $modelId) {\n        id\n      }\n    }\n  }\n"): (typeof documents)["\n  query ProjectModelCheck($projectId: String!, $modelId: String!) {\n    project(id: $projectId) {\n      model(id: $modelId) {\n        id\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ProjectModelPage(\n    $projectId: String!\n    $modelId: String!\n    $versionsCursor: String\n  ) {\n    project(id: $projectId) {\n      ...ProjectModelPageHeaderProject\n      ...ProjectModelPageVersionsProject\n    }\n  }\n"): (typeof documents)["\n  query ProjectModelPage(\n    $projectId: String!\n    $modelId: String!\n    $versionsCursor: String\n  ) {\n    project(id: $projectId) {\n      ...ProjectModelPageHeaderProject\n      ...ProjectModelPageVersionsProject\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ProjectModelVersions(\n    $projectId: String!\n    $modelId: String!\n    $versionsCursor: String\n  ) {\n    project(id: $projectId) {\n      ...ProjectModelPageVersionsPagination\n    }\n  }\n"): (typeof documents)["\n  query ProjectModelVersions(\n    $projectId: String!\n    $modelId: String!\n    $versionsCursor: String\n  ) {\n    project(id: $projectId) {\n      ...ProjectModelPageVersionsPagination\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ProjectModelsPage($projectId: String!) {\n    project(id: $projectId) {\n      ...ProjectModelsPageHeader_Project\n      ...ProjectModelsPageResults_Project\n    }\n  }\n"): (typeof documents)["\n  query ProjectModelsPage($projectId: String!) {\n    project(id: $projectId) {\n      ...ProjectModelsPageHeader_Project\n      ...ProjectModelsPageResults_Project\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ProjectDiscussionsPage($projectId: String!) {\n    project(id: $projectId) {\n      ...ProjectDiscussionsPageHeader_Project\n      ...ProjectDiscussionsPageResults_Project\n    }\n  }\n"): (typeof documents)["\n  query ProjectDiscussionsPage($projectId: String!) {\n    project(id: $projectId) {\n      ...ProjectDiscussionsPageHeader_Project\n      ...ProjectDiscussionsPageResults_Project\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ProjectWebhooks($projectId: String!) {\n    project(id: $projectId) {\n      id\n      name\n      webhooks {\n        items {\n          streamId\n          triggers\n          enabled\n          url\n          id\n          description\n          history(limit: 5) {\n            items {\n              status\n              statusInfo\n            }\n          }\n        }\n        totalCount\n      }\n    }\n  }\n"): (typeof documents)["\n  query ProjectWebhooks($projectId: String!) {\n    project(id: $projectId) {\n      id\n      name\n      webhooks {\n        items {\n          streamId\n          triggers\n          enabled\n          url\n          id\n          description\n          history(limit: 5) {\n            items {\n              status\n              statusInfo\n            }\n          }\n        }\n        totalCount\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Blob($blobId: String!, $streamId: String!) {\n    stream(id: $streamId) {\n      blob(id: $blobId) {\n        id\n        fileName\n        fileType\n        fileSize\n        createdAt\n      }\n    }\n  }\n"): (typeof documents)["\n  query Blob($blobId: String!, $streamId: String!) {\n    stream(id: $streamId) {\n      blob(id: $blobId) {\n        id\n        fileName\n        fileType\n        fileSize\n        createdAt\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription OnProjectUpdated($id: String!) {\n    projectUpdated(id: $id) {\n      id\n      type\n      project {\n        ...ProjectPageProject\n        ...ProjectDashboardItemNoModels\n      }\n    }\n  }\n"): (typeof documents)["\n  subscription OnProjectUpdated($id: String!) {\n    projectUpdated(id: $id) {\n      id\n      type\n      project {\n        ...ProjectPageProject\n        ...ProjectDashboardItemNoModels\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription OnProjectModelsUpdate($id: String!) {\n    projectModelsUpdated(id: $id) {\n      id\n      type\n      model {\n        id\n        versions(limit: 1) {\n          items {\n            id\n            referencedObject\n          }\n        }\n        ...ProjectPageLatestItemsModelItem\n      }\n    }\n  }\n"): (typeof documents)["\n  subscription OnProjectModelsUpdate($id: String!) {\n    projectModelsUpdated(id: $id) {\n      id\n      type\n      model {\n        id\n        versions(limit: 1) {\n          items {\n            id\n            referencedObject\n          }\n        }\n        ...ProjectPageLatestItemsModelItem\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription OnProjectVersionsUpdate($id: String!) {\n    projectVersionsUpdated(id: $id) {\n      id\n      modelId\n      type\n      version {\n        id\n        ...ViewerModelVersionCardItem\n        ...ProjectModelPageVersionsCardVersion\n        model {\n          id\n          ...ProjectPageLatestItemsModelItem\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  subscription OnProjectVersionsUpdate($id: String!) {\n    projectVersionsUpdated(id: $id) {\n      id\n      modelId\n      type\n      version {\n        id\n        ...ViewerModelVersionCardItem\n        ...ProjectModelPageVersionsCardVersion\n        model {\n          id\n          ...ProjectPageLatestItemsModelItem\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription OnProjectVersionsPreviewGenerated($id: String!) {\n    projectVersionsPreviewGenerated(id: $id) {\n      projectId\n      objectId\n      versionId\n    }\n  }\n"): (typeof documents)["\n  subscription OnProjectVersionsPreviewGenerated($id: String!) {\n    projectVersionsPreviewGenerated(id: $id) {\n      projectId\n      objectId\n      versionId\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription OnProjectPendingModelsUpdated($id: String!) {\n    projectPendingModelsUpdated(id: $id) {\n      id\n      type\n      model {\n        ...PendingFileUpload\n        model {\n          ...ProjectPageLatestItemsModelItem\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  subscription OnProjectPendingModelsUpdated($id: String!) {\n    projectPendingModelsUpdated(id: $id) {\n      id\n      type\n      model {\n        ...PendingFileUpload\n        model {\n          ...ProjectPageLatestItemsModelItem\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription OnProjectPendingVersionsUpdated($id: String!) {\n    projectPendingVersionsUpdated(id: $id) {\n      id\n      type\n      version {\n        ...PendingFileUpload\n        model {\n          ...ProjectPageLatestItemsModelItem\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  subscription OnProjectPendingVersionsUpdated($id: String!) {\n    projectPendingVersionsUpdated(id: $id) {\n      id\n      type\n      version {\n        ...PendingFileUpload\n        model {\n          ...ProjectPageLatestItemsModelItem\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ServerInfoUpdate($info: ServerInfoUpdateInput!) {\n    serverInfoUpdate(info: $info)\n  }\n"): (typeof documents)["\n  mutation ServerInfoUpdate($info: ServerInfoUpdateInput!) {\n    serverInfoUpdate(info: $info)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AdminPanelDeleteUser($userConfirmation: UserDeleteInput!) {\n    adminDeleteUser(userConfirmation: $userConfirmation)\n  }\n"): (typeof documents)["\n  mutation AdminPanelDeleteUser($userConfirmation: UserDeleteInput!) {\n    adminDeleteUser(userConfirmation: $userConfirmation)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AdminPanelDeleteProject($ids: [String!]) {\n    streamsDelete(ids: $ids)\n  }\n"): (typeof documents)["\n  mutation AdminPanelDeleteProject($ids: [String!]) {\n    streamsDelete(ids: $ids)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AdminPanelResendInvite($inviteId: String!) {\n    inviteResend(inviteId: $inviteId)\n  }\n"): (typeof documents)["\n  mutation AdminPanelResendInvite($inviteId: String!) {\n    inviteResend(inviteId: $inviteId)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AdminPanelDeleteInvite($inviteId: String!) {\n    inviteDelete(inviteId: $inviteId)\n  }\n"): (typeof documents)["\n  mutation AdminPanelDeleteInvite($inviteId: String!) {\n    inviteDelete(inviteId: $inviteId)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AdminChangeUseRole($userRoleInput: UserRoleInput!) {\n    userRoleChange(userRoleInput: $userRoleInput)\n  }\n"): (typeof documents)["\n  mutation AdminChangeUseRole($userRoleInput: UserRoleInput!) {\n    userRoleChange(userRoleInput: $userRoleInput)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ServerManagementDataPage {\n    admin {\n      userList {\n        totalCount\n      }\n      projectList {\n        totalCount\n      }\n      inviteList {\n        totalCount\n      }\n    }\n    serverInfo {\n      name\n      version\n    }\n  }\n"): (typeof documents)["\n  query ServerManagementDataPage {\n    admin {\n      userList {\n        totalCount\n      }\n      projectList {\n        totalCount\n      }\n      inviteList {\n        totalCount\n      }\n    }\n    serverInfo {\n      name\n      version\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ServerSettingsDialogData {\n    serverInfo {\n      name\n      description\n      adminContact\n      company\n      termsOfService\n      inviteOnly\n      guestModeEnabled\n    }\n  }\n"): (typeof documents)["\n  query ServerSettingsDialogData {\n    serverInfo {\n      name\n      description\n      adminContact\n      company\n      termsOfService\n      inviteOnly\n      guestModeEnabled\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminPanelUsersList($limit: Int!, $cursor: String, $query: String) {\n    admin {\n      userList(limit: $limit, cursor: $cursor, query: $query) {\n        totalCount\n        cursor\n        items {\n          id\n          email\n          avatar\n          name\n          role\n          verified\n          company\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query AdminPanelUsersList($limit: Int!, $cursor: String, $query: String) {\n    admin {\n      userList(limit: $limit, cursor: $cursor, query: $query) {\n        totalCount\n        cursor\n        items {\n          id\n          email\n          avatar\n          name\n          role\n          verified\n          company\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminPanelProjectsList(\n    $query: String\n    $orderBy: String\n    $limit: Int!\n    $visibility: String\n    $cursor: String\n  ) {\n    admin {\n      projectList(\n        query: $query\n        orderBy: $orderBy\n        limit: $limit\n        visibility: $visibility\n        cursor: $cursor\n      ) {\n        cursor\n        items {\n          id\n          name\n          visibility\n          createdAt\n          updatedAt\n          models {\n            totalCount\n          }\n          versions {\n            totalCount\n          }\n          team {\n            user {\n              name\n              id\n              avatar\n            }\n          }\n        }\n        totalCount\n        cursor\n      }\n    }\n  }\n"): (typeof documents)["\n  query AdminPanelProjectsList(\n    $query: String\n    $orderBy: String\n    $limit: Int!\n    $visibility: String\n    $cursor: String\n  ) {\n    admin {\n      projectList(\n        query: $query\n        orderBy: $orderBy\n        limit: $limit\n        visibility: $visibility\n        cursor: $cursor\n      ) {\n        cursor\n        items {\n          id\n          name\n          visibility\n          createdAt\n          updatedAt\n          models {\n            totalCount\n          }\n          versions {\n            totalCount\n          }\n          team {\n            user {\n              name\n              id\n              avatar\n            }\n          }\n        }\n        totalCount\n        cursor\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminPanelInvitesList($limit: Int!, $cursor: String, $query: String) {\n    admin {\n      inviteList(limit: $limit, cursor: $cursor, query: $query) {\n        cursor\n        items {\n          email\n          id\n          invitedBy {\n            id\n            name\n          }\n        }\n        totalCount\n      }\n    }\n  }\n"): (typeof documents)["\n  query AdminPanelInvitesList($limit: Int!, $cursor: String, $query: String) {\n    admin {\n      inviteList(limit: $limit, cursor: $cursor, query: $query) {\n        cursor\n        items {\n          email\n          id\n          invitedBy {\n            id\n            name\n          }\n        }\n        totalCount\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation InviteServerUser($input: [ServerInviteCreateInput!]!) {\n    serverInviteBatchCreate(input: $input)\n  }\n"): (typeof documents)["\n  mutation InviteServerUser($input: [ServerInviteCreateInput!]!) {\n    serverInviteBatchCreate(input: $input)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment AppAuthorAvatar on AppAuthor {\n    id\n    name\n    avatar\n  }\n"): (typeof documents)["\n  fragment AppAuthorAvatar on AppAuthor {\n    id\n    name\n    avatar\n  }\n"];
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
export function graphql(source: "\n  mutation UpdateUser($input: UserUpdateInput!) {\n    activeUserMutations {\n      update(user: $input) {\n        id\n        name\n        bio\n        company\n        avatar\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateUser($input: UserUpdateInput!) {\n    activeUserMutations {\n      update(user: $input) {\n        id\n        name\n        bio\n        company\n        avatar\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateNotificationPreferences($input: JSONObject!) {\n    userNotificationPreferencesUpdate(preferences: $input)\n  }\n"): (typeof documents)["\n  mutation UpdateNotificationPreferences($input: JSONObject!) {\n    userNotificationPreferencesUpdate(preferences: $input)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteAccount($input: UserDeleteInput!) {\n    userDelete(userConfirmation: $input)\n  }\n"): (typeof documents)["\n  mutation DeleteAccount($input: UserDeleteInput!) {\n    userDelete(userConfirmation: $input)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ProfileEditDialog {\n    activeUser {\n      ...UserProfileEditDialogBio_User\n      ...UserProfileEditDialogNotificationPreferences_User\n      ...UserProfileEditDialogDeleteAccount_User\n    }\n  }\n"): (typeof documents)["\n  query ProfileEditDialog {\n    activeUser {\n      ...UserProfileEditDialogBio_User\n      ...UserProfileEditDialogNotificationPreferences_User\n      ...UserProfileEditDialogDeleteAccount_User\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ViewerCommentBubblesData on Comment {\n    id\n    viewedAt\n    viewerState\n  }\n"): (typeof documents)["\n  fragment ViewerCommentBubblesData on Comment {\n    id\n    viewedAt\n    viewerState\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ViewerCommentThread on Comment {\n    ...ViewerCommentsListItem\n    ...ViewerCommentBubblesData\n    ...ViewerCommentsReplyItem\n  }\n"): (typeof documents)["\n  fragment ViewerCommentThread on Comment {\n    ...ViewerCommentsListItem\n    ...ViewerCommentBubblesData\n    ...ViewerCommentsReplyItem\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ViewerCommentsReplyItem on Comment {\n    id\n    archived\n    rawText\n    text {\n      doc\n    }\n    author {\n      ...LimitedUserAvatar\n    }\n    createdAt\n    ...ThreadCommentAttachment\n  }\n"): (typeof documents)["\n  fragment ViewerCommentsReplyItem on Comment {\n    id\n    archived\n    rawText\n    text {\n      doc\n    }\n    author {\n      ...LimitedUserAvatar\n    }\n    createdAt\n    ...ThreadCommentAttachment\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation BroadcastViewerUserActivity(\n    $projectId: String!\n    $resourceIdString: String!\n    $message: ViewerUserActivityMessageInput!\n  ) {\n    broadcastViewerUserActivity(\n      projectId: $projectId\n      resourceIdString: $resourceIdString\n      message: $message\n    )\n  }\n"): (typeof documents)["\n  mutation BroadcastViewerUserActivity(\n    $projectId: String!\n    $resourceIdString: String!\n    $message: ViewerUserActivityMessageInput!\n  ) {\n    broadcastViewerUserActivity(\n      projectId: $projectId\n      resourceIdString: $resourceIdString\n      message: $message\n    )\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation MarkCommentViewed($threadId: String!) {\n    commentMutations {\n      markViewed(commentId: $threadId)\n    }\n  }\n"): (typeof documents)["\n  mutation MarkCommentViewed($threadId: String!) {\n    commentMutations {\n      markViewed(commentId: $threadId)\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateCommentThread($input: CreateCommentInput!) {\n    commentMutations {\n      create(input: $input) {\n        ...ViewerCommentThread\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation CreateCommentThread($input: CreateCommentInput!) {\n    commentMutations {\n      create(input: $input) {\n        ...ViewerCommentThread\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateCommentReply($input: CreateCommentReplyInput!) {\n    commentMutations {\n      reply(input: $input) {\n        ...ViewerCommentsReplyItem\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation CreateCommentReply($input: CreateCommentReplyInput!) {\n    commentMutations {\n      reply(input: $input) {\n        ...ViewerCommentsReplyItem\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ArchiveComment($commentId: String!, $archived: Boolean) {\n    commentMutations {\n      archive(commentId: $commentId, archived: $archived)\n    }\n  }\n"): (typeof documents)["\n  mutation ArchiveComment($commentId: String!, $archived: Boolean) {\n    commentMutations {\n      archive(commentId: $commentId, archived: $archived)\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ProjectViewerResources($projectId: String!, $resourceUrlString: String!) {\n    project(id: $projectId) {\n      id\n      viewerResources(resourceIdString: $resourceUrlString) {\n        identifier\n        items {\n          modelId\n          versionId\n          objectId\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query ProjectViewerResources($projectId: String!, $resourceUrlString: String!) {\n    project(id: $projectId) {\n      id\n      viewerResources(resourceIdString: $resourceUrlString) {\n        identifier\n        items {\n          modelId\n          versionId\n          objectId\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ViewerLoadedResources(\n    $projectId: String!\n    $modelIds: [String!]!\n    $versionIds: [String!]\n  ) {\n    project(id: $projectId) {\n      id\n      role\n      models(filter: { ids: $modelIds }) {\n        totalCount\n        items {\n          id\n          name\n          updatedAt\n          loadedVersion: versions(\n            filter: { priorityIds: $versionIds, priorityIdsOnly: true }\n          ) {\n            items {\n              ...ViewerModelVersionCardItem\n              automationStatus {\n                id\n                status\n                statusMessage\n                automationRuns {\n                  id\n                  automationId\n                  automationName\n                  versionId\n                  createdAt\n                  updatedAt\n                  status\n                  functionRuns {\n                    id\n                    functionId\n                    functionName\n                    functionLogo\n                    resultVersions {\n                      id\n                      referencedObject\n                      model {\n                        id\n                        name\n                      }\n                    }\n                    elapsed\n                    status\n                    contextView\n                    statusMessage\n                    results\n                  }\n                }\n              }\n            }\n          }\n          versions(limit: 5) {\n            totalCount\n            cursor\n            items {\n              ...ViewerModelVersionCardItem\n            }\n          }\n        }\n      }\n      ...ProjectPageLatestItemsModels\n      ...ModelPageProject\n    }\n  }\n"): (typeof documents)["\n  query ViewerLoadedResources(\n    $projectId: String!\n    $modelIds: [String!]!\n    $versionIds: [String!]\n  ) {\n    project(id: $projectId) {\n      id\n      role\n      models(filter: { ids: $modelIds }) {\n        totalCount\n        items {\n          id\n          name\n          updatedAt\n          loadedVersion: versions(\n            filter: { priorityIds: $versionIds, priorityIdsOnly: true }\n          ) {\n            items {\n              ...ViewerModelVersionCardItem\n              automationStatus {\n                id\n                status\n                statusMessage\n                automationRuns {\n                  id\n                  automationId\n                  automationName\n                  versionId\n                  createdAt\n                  updatedAt\n                  status\n                  functionRuns {\n                    id\n                    functionId\n                    functionName\n                    functionLogo\n                    resultVersions {\n                      id\n                      referencedObject\n                      model {\n                        id\n                        name\n                      }\n                    }\n                    elapsed\n                    status\n                    contextView\n                    statusMessage\n                    results\n                  }\n                }\n              }\n            }\n          }\n          versions(limit: 5) {\n            totalCount\n            cursor\n            items {\n              ...ViewerModelVersionCardItem\n            }\n          }\n        }\n      }\n      ...ProjectPageLatestItemsModels\n      ...ModelPageProject\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ViewerModelVersions(\n    $projectId: String!\n    $modelId: String!\n    $versionsCursor: String\n  ) {\n    project(id: $projectId) {\n      id\n      role\n      model(id: $modelId) {\n        id\n        versions(cursor: $versionsCursor, limit: 5) {\n          totalCount\n          cursor\n          items {\n            ...ViewerModelVersionCardItem\n          }\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query ViewerModelVersions(\n    $projectId: String!\n    $modelId: String!\n    $versionsCursor: String\n  ) {\n    project(id: $projectId) {\n      id\n      role\n      model(id: $modelId) {\n        id\n        versions(cursor: $versionsCursor, limit: 5) {\n          totalCount\n          cursor\n          items {\n            ...ViewerModelVersionCardItem\n          }\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ViewerDiffVersions(\n    $projectId: String!\n    $modelId: String!\n    $versionAId: String!\n    $versionBId: String!\n  ) {\n    project(id: $projectId) {\n      id\n      model(id: $modelId) {\n        id\n        versionA: version(id: $versionAId) {\n          ...ViewerModelVersionCardItem\n        }\n        versionB: version(id: $versionBId) {\n          ...ViewerModelVersionCardItem\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query ViewerDiffVersions(\n    $projectId: String!\n    $modelId: String!\n    $versionAId: String!\n    $versionBId: String!\n  ) {\n    project(id: $projectId) {\n      id\n      model(id: $modelId) {\n        id\n        versionA: version(id: $versionAId) {\n          ...ViewerModelVersionCardItem\n        }\n        versionB: version(id: $versionBId) {\n          ...ViewerModelVersionCardItem\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ViewerLoadedThreads(\n    $projectId: String!\n    $filter: ProjectCommentsFilter!\n    $cursor: String\n    $limit: Int = 25\n  ) {\n    project(id: $projectId) {\n      id\n      commentThreads(filter: $filter, cursor: $cursor, limit: $limit) {\n        totalCount\n        totalArchivedCount\n        items {\n          ...ViewerCommentThread\n          ...LinkableComment\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query ViewerLoadedThreads(\n    $projectId: String!\n    $filter: ProjectCommentsFilter!\n    $cursor: String\n    $limit: Int = 25\n  ) {\n    project(id: $projectId) {\n      id\n      commentThreads(filter: $filter, cursor: $cursor, limit: $limit) {\n        totalCount\n        totalArchivedCount\n        items {\n          ...ViewerCommentThread\n          ...LinkableComment\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription OnViewerUserActivityBroadcasted(\n    $target: ViewerUpdateTrackingTarget!\n    $sessionId: String!\n  ) {\n    viewerUserActivityBroadcasted(target: $target, sessionId: $sessionId) {\n      userName\n      userId\n      user {\n        ...LimitedUserAvatar\n      }\n      state\n      status\n      sessionId\n    }\n  }\n"): (typeof documents)["\n  subscription OnViewerUserActivityBroadcasted(\n    $target: ViewerUpdateTrackingTarget!\n    $sessionId: String!\n  ) {\n    viewerUserActivityBroadcasted(target: $target, sessionId: $sessionId) {\n      userName\n      userId\n      user {\n        ...LimitedUserAvatar\n      }\n      state\n      status\n      sessionId\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription OnViewerCommentsUpdated($target: ViewerUpdateTrackingTarget!) {\n    projectCommentsUpdated(target: $target) {\n      id\n      type\n      comment {\n        id\n        parent {\n          id\n        }\n        ...ViewerCommentThread\n      }\n    }\n  }\n"): (typeof documents)["\n  subscription OnViewerCommentsUpdated($target: ViewerUpdateTrackingTarget!) {\n    projectCommentsUpdated(target: $target) {\n      id\n      type\n      comment {\n        id\n        parent {\n          id\n        }\n        ...ViewerCommentThread\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment LinkableComment on Comment {\n    id\n    viewerResources {\n      modelId\n      versionId\n      objectId\n    }\n  }\n"): (typeof documents)["\n  fragment LinkableComment on Comment {\n    id\n    viewerResources {\n      modelId\n      versionId\n      objectId\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query LegacyBranchRedirectMetadata($streamId: String!, $branchName: String!) {\n    stream(id: $streamId) {\n      branch(name: $branchName) {\n        id\n      }\n    }\n  }\n"): (typeof documents)["\n  query LegacyBranchRedirectMetadata($streamId: String!, $branchName: String!) {\n    stream(id: $streamId) {\n      branch(name: $branchName) {\n        id\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query LegacyViewerCommitRedirectMetadata($streamId: String!, $commitId: String!) {\n    stream(id: $streamId) {\n      commit(id: $commitId) {\n        id\n        branch {\n          id\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query LegacyViewerCommitRedirectMetadata($streamId: String!, $commitId: String!) {\n    stream(id: $streamId) {\n      commit(id: $commitId) {\n        id\n        branch {\n          id\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ResolveCommentLink($commentId: String!, $projectId: String!) {\n    comment(id: $commentId, streamId: $projectId) {\n      ...LinkableComment\n    }\n  }\n"): (typeof documents)["\n  query ResolveCommentLink($commentId: String!, $projectId: String!) {\n    comment(id: $commentId, streamId: $projectId) {\n      ...LinkableComment\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ProjectPageProject on Project {\n    id\n    createdAt\n    ...ProjectPageProjectHeader\n    ...ProjectPageStatsBlockTeam\n    ...ProjectPageTeamDialog\n    ...ProjectPageStatsBlockVersions\n    ...ProjectPageStatsBlockModels\n    ...ProjectPageStatsBlockComments\n    ...ProjectPageLatestItemsModels\n    ...ProjectPageLatestItemsComments\n  }\n"): (typeof documents)["\n  fragment ProjectPageProject on Project {\n    id\n    createdAt\n    ...ProjectPageProjectHeader\n    ...ProjectPageStatsBlockTeam\n    ...ProjectPageTeamDialog\n    ...ProjectPageStatsBlockVersions\n    ...ProjectPageStatsBlockModels\n    ...ProjectPageStatsBlockComments\n    ...ProjectPageLatestItemsModels\n    ...ProjectPageLatestItemsComments\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;