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
    "\n  fragment AuthRegisterPanelServerInfo on ServerInfo {\n    inviteOnly\n  }\n": types.AuthRegisterPanelServerInfoFragmentDoc,
    "\n  fragment ServerTermsOfServicePrivacyPolicyFragment on ServerInfo {\n    termsOfService\n  }\n": types.ServerTermsOfServicePrivacyPolicyFragmentFragmentDoc,
    "\n  query EmailVerificationBannerState {\n    activeUser {\n      id\n      email\n      verified\n      hasPendingVerification\n    }\n  }\n": types.EmailVerificationBannerStateDocument,
    "\n  mutation RequestVerification {\n    requestVerification\n  }\n": types.RequestVerificationDocument,
    "\n  fragment AuthStategiesServerInfoFragment on ServerInfo {\n    authStrategies {\n      id\n      name\n      url\n    }\n  }\n": types.AuthStategiesServerInfoFragmentFragmentDoc,
    "\n  fragment CommonModelSelectorModel on Model {\n    id\n    name\n  }\n": types.CommonModelSelectorModelFragmentDoc,
    "\n  fragment FormUsersSelectItem on LimitedUser {\n    id\n    name\n    avatar\n  }\n": types.FormUsersSelectItemFragmentDoc,
    "\n  fragment ProjectModelPageHeaderProject on Project {\n    id\n    name\n    model(id: $modelId) {\n      id\n      name\n    }\n  }\n": types.ProjectModelPageHeaderProjectFragmentDoc,
    "\n  fragment ProjectModelPageVersionsPagination on Project {\n    id\n    model(id: $modelId) {\n      id\n      versions(limit: 16, cursor: $versionsCursor) {\n        cursor\n        totalCount\n        items {\n          ...ProjectModelPageVersionsCardVersion\n        }\n      }\n    }\n  }\n": types.ProjectModelPageVersionsPaginationFragmentDoc,
    "\n  fragment ProjectModelPageVersionsProject on Project {\n    id\n    role\n    model(id: $modelId) {\n      id\n      pendingImportedVersions {\n        ...PendingFileUpload\n      }\n    }\n    ...ProjectModelPageVersionsPagination\n  }\n": types.ProjectModelPageVersionsProjectFragmentDoc,
    "\n  fragment ProjectModelPageDialogDeleteVersion on Version {\n    id\n    message\n  }\n": types.ProjectModelPageDialogDeleteVersionFragmentDoc,
    "\n  fragment ProjectModelPageDialogEditMessageVersion on Version {\n    id\n    message\n  }\n": types.ProjectModelPageDialogEditMessageVersionFragmentDoc,
    "\n  fragment ProjectModelPageDialogMoveToVersion on Version {\n    id\n    message\n  }\n": types.ProjectModelPageDialogMoveToVersionFragmentDoc,
    "\n  fragment ProjectModelPageVersionsCardVersion on Version {\n    id\n    message\n    authorUser {\n      ...LimitedUserAvatar\n    }\n    createdAt\n    previewUrl\n    sourceApplication\n    commentThreadCount: commentThreads(limit: 0) {\n      totalCount\n    }\n    ...ProjectModelPageDialogDeleteVersion\n    ...ProjectModelPageDialogMoveToVersion\n  }\n": types.ProjectModelPageVersionsCardVersionFragmentDoc,
    "\n  fragment ProjectModelsPageHeader_Project on Project {\n    id\n    name\n    sourceApps\n    team {\n      user {\n        ...FormUsersSelectItem\n      }\n    }\n  }\n": types.ProjectModelsPageHeader_ProjectFragmentDoc,
    "\n  fragment ProjectModelsPageResults_Project on Project {\n    ...ProjectPageLatestItemsModels\n  }\n": types.ProjectModelsPageResults_ProjectFragmentDoc,
    "\n  fragment ProjectPageProjectHeader on Project {\n    id\n    role\n    name\n    description\n    visibility\n    allowPublicComments\n  }\n": types.ProjectPageProjectHeaderFragmentDoc,
    "\n  fragment ProjectPageLatestItemsComments on Project {\n    id\n    commentThreadCount: commentThreads(limit: 0) {\n      totalCount\n    }\n  }\n": types.ProjectPageLatestItemsCommentsFragmentDoc,
    "\n  fragment ProjectPageLatestItemsCommentItem on Comment {\n    id\n    author {\n      ...FormUsersSelectItem\n    }\n    screenshot\n    rawText\n    createdAt\n    updatedAt\n    repliesCount: replies(limit: 0) {\n      totalCount\n    }\n    replyAuthors(limit: 4) {\n      totalCount\n      items {\n        ...FormUsersSelectItem\n      }\n    }\n    ...LinkableComment\n  }\n": types.ProjectPageLatestItemsCommentItemFragmentDoc,
    "\n  fragment ProjectPageLatestItemsModels on Project {\n    id\n    role\n    modelCount: models(limit: 0) {\n      totalCount\n    }\n  }\n": types.ProjectPageLatestItemsModelsFragmentDoc,
    "\n  fragment ProjectPageModelsActions on Model {\n    id\n    name\n  }\n": types.ProjectPageModelsActionsFragmentDoc,
    "\n  fragment ProjectPageModelsCardProject on Project {\n    id\n    role\n  }\n": types.ProjectPageModelsCardProjectFragmentDoc,
    "\n  fragment ModelPreview on Model {\n    previewUrl\n  }\n": types.ModelPreviewFragmentDoc,
    "\n  fragment SingleLevelModelTreeItem on ModelsTreeItem {\n    id\n    name\n    fullName\n    model {\n      ...ProjectPageLatestItemsModelItem\n    }\n    pendingModel {\n      ...PendingFileUpload\n    }\n    hasChildren\n    updatedAt\n  }\n": types.SingleLevelModelTreeItemFragmentDoc,
    "\n  fragment ProjectPageModelsCardDeleteDialog on Model {\n    id\n    name\n  }\n": types.ProjectPageModelsCardDeleteDialogFragmentDoc,
    "\n  fragment ProjectPageModelsCardRenameDialog on Model {\n    id\n    name\n  }\n": types.ProjectPageModelsCardRenameDialogFragmentDoc,
    "\n  fragment ProjectPageStatsBlockComments on Project {\n    commentThreadCount: commentThreads(limit: 0) {\n      totalCount\n    }\n  }\n": types.ProjectPageStatsBlockCommentsFragmentDoc,
    "\n  fragment ProjectPageStatsBlockModels on Project {\n    modelCount: models(limit: 0) {\n      totalCount\n    }\n  }\n": types.ProjectPageStatsBlockModelsFragmentDoc,
    "\n  fragment ProjectPageStatsBlockTeam on Project {\n    id\n    role\n    team {\n      role\n      user {\n        ...LimitedUserAvatar\n      }\n    }\n    ...ProjectPageTeamDialog\n  }\n": types.ProjectPageStatsBlockTeamFragmentDoc,
    "\n  fragment ProjectPageStatsBlockVersions on Project {\n    versionCount: versions(limit: 0) {\n      totalCount\n    }\n  }\n": types.ProjectPageStatsBlockVersionsFragmentDoc,
    "\n  fragment ProjectPageTeamDialog on Project {\n    id\n    name\n    role\n    allowPublicComments\n    visibility\n    team {\n      role\n      user {\n        ...LimitedUserAvatar\n      }\n    }\n    invitedTeam {\n      id\n      title\n      inviteId\n      role\n      user {\n        ...LimitedUserAvatar\n      }\n    }\n  }\n": types.ProjectPageTeamDialogFragmentDoc,
    "\n  subscription OnUserProjectsUpdate {\n    userProjectsUpdated {\n      type\n      id\n      project {\n        ...ProjectDashboardItem\n      }\n    }\n  }\n": types.OnUserProjectsUpdateDocument,
    "\n  mutation CreateOnboardingProject {\n    projectMutations {\n      createForOnboarding {\n        ...ProjectPageProject\n        ...ProjectDashboardItem\n      }\n    }\n  }\n": types.CreateOnboardingProjectDocument,
    "\n  fragment ProjectsDashboardFilled on ProjectCollection {\n    items {\n      ...ProjectDashboardItem\n    }\n  }\n": types.ProjectsDashboardFilledFragmentDoc,
    "\n  fragment ProjectsInviteBanner on PendingStreamCollaborator {\n    id\n    invitedBy {\n      ...LimitedUserAvatar\n    }\n    projectId\n    projectName\n    token\n  }\n": types.ProjectsInviteBannerFragmentDoc,
    "\n  fragment ProjectsInviteBanners on User {\n    projectInvites {\n      ...ProjectsInviteBanner\n    }\n  }\n": types.ProjectsInviteBannersFragmentDoc,
    "\n  fragment AppAuthorAvatar on AppAuthor {\n    id\n    name\n    avatar\n  }\n": types.AppAuthorAvatarFragmentDoc,
    "\n  fragment LimitedUserAvatar on LimitedUser {\n    id\n    name\n    avatar\n  }\n": types.LimitedUserAvatarFragmentDoc,
    "\n  fragment ActiveUserAvatar on User {\n    id\n    name\n    avatar\n  }\n": types.ActiveUserAvatarFragmentDoc,
    "\n  fragment ThreadCommentAttachment on Comment {\n    text {\n      attachments {\n        id\n        fileName\n        fileType\n        fileSize\n      }\n    }\n  }\n": types.ThreadCommentAttachmentFragmentDoc,
    "\n  fragment ViewerCommentsListItem on Comment {\n    id\n    rawText\n    archived\n    author {\n      ...LimitedUserAvatar\n    }\n    createdAt\n    viewedAt\n    replies {\n      totalCount\n      cursor\n      items {\n        ...ViewerCommentsReplyItem\n      }\n    }\n    replyAuthors(limit: 4) {\n      totalCount\n      items {\n        ...FormUsersSelectItem\n      }\n    }\n    resources {\n      resourceId\n      resourceType\n    }\n  }\n": types.ViewerCommentsListItemFragmentDoc,
    "\n  fragment ViewerModelVersionCardItem on Version {\n    id\n    message\n    referencedObject\n    sourceApplication\n    createdAt\n    previewUrl\n    authorUser {\n      ...LimitedUserAvatar\n    }\n  }\n": types.ViewerModelVersionCardItemFragmentDoc,
    "\n  query ActiveUserMainMetadata {\n    activeUser {\n      id\n      email\n      name\n      role\n      avatar\n      isOnboardingFinished\n      createdAt\n      verified\n    }\n  }\n": types.ActiveUserMainMetadataDocument,
    "\n      mutation CreateOnboardingProject {\n        projectMutations {\n          createForOnboarding {\n            ...ProjectPageProject\n            ...ProjectDashboardItem\n          }\n        }\n      }\n    ": types.CreateOnboardingProjectDocument,
    "\n  mutation FinishOnboarding {\n    activeUserMutations {\n      finishOnboarding\n    }\n  }\n": types.FinishOnboardingDocument,
    "\n  query AuthServerInfo {\n    serverInfo {\n      ...AuthStategiesServerInfoFragment\n      ...ServerTermsOfServicePrivacyPolicyFragment\n      ...AuthRegisterPanelServerInfo\n    }\n  }\n": types.AuthServerInfoDocument,
    "\n  query AuthorizableAppMetadata($id: String!) {\n    app(id: $id) {\n      id\n      name\n      description\n      trustByDefault\n      redirectUrl\n      scopes {\n        name\n        description\n      }\n      author {\n        name\n        id\n        avatar\n      }\n    }\n  }\n": types.AuthorizableAppMetadataDocument,
    "\n  query MentionsUserSearch($query: String!, $emailOnly: Boolean = false) {\n    userSearch(\n      query: $query\n      limit: 5\n      cursor: null\n      archived: false\n      emailOnly: $emailOnly\n    ) {\n      items {\n        id\n        name\n        company\n      }\n    }\n  }\n": types.MentionsUserSearchDocument,
    "\n  query UserSearch($query: String!, $limit: Int, $cursor: String, $archived: Boolean) {\n    userSearch(query: $query, limit: $limit, cursor: $cursor, archived: $archived) {\n      cursor\n      items {\n        id\n        name\n        bio\n        company\n        avatar\n        verified\n      }\n    }\n  }\n": types.UserSearchDocument,
    "\n  query ServerInfoBlobSizeLimit {\n    serverInfo {\n      blobSizeLimitBytes\n    }\n  }\n": types.ServerInfoBlobSizeLimitDocument,
    "\n  query ProjectModelsSelectorValues($projectId: String!, $cursor: String) {\n    project(id: $projectId) {\n      id\n      models(limit: 100, cursor: $cursor) {\n        cursor\n        totalCount\n        items {\n          ...CommonModelSelectorModel\n        }\n      }\n    }\n  }\n": types.ProjectModelsSelectorValuesDocument,
    "\n  query ServerVersionInfo {\n    serverInfo {\n      version\n    }\n  }\n": types.ServerVersionInfoDocument,
    "\n  query InternalTestData {\n    testNumber\n    testList {\n      foo\n      bar\n    }\n  }\n": types.InternalTestDataDocument,
    "\n  fragment ProjectDashboardItemNoModels on Project {\n    id\n    name\n    createdAt\n    updatedAt\n    role\n    team {\n      user {\n        id\n        name\n        avatar\n      }\n    }\n    ...ProjectPageModelsCardProject\n  }\n": types.ProjectDashboardItemNoModelsFragmentDoc,
    "\n  fragment ProjectDashboardItem on Project {\n    id\n    ...ProjectDashboardItemNoModels\n    models(limit: 4, filter: { onlyWithVersions: true }) {\n      totalCount\n      items {\n        ...ProjectPageLatestItemsModelItem\n      }\n    }\n    pendingImportedModels(limit: 4) {\n      ...PendingFileUpload\n    }\n  }\n": types.ProjectDashboardItemFragmentDoc,
    "\n  fragment PendingFileUpload on FileUpload {\n    id\n    projectId\n    modelName\n    convertedStatus\n    convertedMessage\n    uploadDate\n    convertedLastUpdate\n    fileType\n    fileName\n  }\n": types.PendingFileUploadFragmentDoc,
    "\n  fragment ProjectPageLatestItemsModelItem on Model {\n    id\n    name\n    displayName\n    versionCount: versions(limit: 0) {\n      totalCount\n    }\n    commentThreadCount: commentThreads(limit: 0) {\n      totalCount\n    }\n    pendingImportedVersions(limit: 1) {\n      ...PendingFileUpload\n    }\n    previewUrl\n    createdAt\n    updatedAt\n    ...ProjectPageModelsCardRenameDialog\n    ...ProjectPageModelsCardDeleteDialog\n    ...ProjectPageModelsActions\n  }\n": types.ProjectPageLatestItemsModelItemFragmentDoc,
    "\n  fragment ProjectUpdatableMetadata on Project {\n    id\n    name\n    description\n    visibility\n    allowPublicComments\n  }\n": types.ProjectUpdatableMetadataFragmentDoc,
    "\n  mutation CreateModel($input: CreateModelInput!) {\n    modelMutations {\n      create(input: $input) {\n        ...ProjectPageLatestItemsModelItem\n      }\n    }\n  }\n": types.CreateModelDocument,
    "\n  mutation CreateProject($input: ProjectCreateInput) {\n    projectMutations {\n      create(input: $input) {\n        ...ProjectPageProject\n        ...ProjectDashboardItem\n      }\n    }\n  }\n": types.CreateProjectDocument,
    "\n  mutation UpdateModel($input: UpdateModelInput!) {\n    modelMutations {\n      update(input: $input) {\n        ...ProjectPageLatestItemsModelItem\n      }\n    }\n  }\n": types.UpdateModelDocument,
    "\n  mutation DeleteModel($input: DeleteModelInput!) {\n    modelMutations {\n      delete(input: $input)\n    }\n  }\n": types.DeleteModelDocument,
    "\n  mutation UpdateProjectRole($input: ProjectUpdateRoleInput!) {\n    projectMutations {\n      updateRole(input: $input) {\n        id\n        team {\n          role\n          user {\n            ...LimitedUserAvatar\n          }\n        }\n      }\n    }\n  }\n": types.UpdateProjectRoleDocument,
    "\n  mutation InviteProjectUser($input: ProjectInviteCreateInput!) {\n    projectMutations {\n      invites {\n        create(input: $input) {\n          ...ProjectPageTeamDialog\n        }\n      }\n    }\n  }\n": types.InviteProjectUserDocument,
    "\n  mutation CancelProjectInvite($projectId: ID!, $inviteId: String!) {\n    projectMutations {\n      invites {\n        cancel(projectId: $projectId, inviteId: $inviteId) {\n          ...ProjectPageTeamDialog\n        }\n      }\n    }\n  }\n": types.CancelProjectInviteDocument,
    "\n  mutation UpdateProjectMetadata($update: ProjectUpdateInput!) {\n    projectMutations {\n      update(update: $update) {\n        id\n        ...ProjectUpdatableMetadata\n      }\n    }\n  }\n": types.UpdateProjectMetadataDocument,
    "\n  mutation DeleteProject($id: String!) {\n    projectMutations {\n      delete(id: $id)\n    }\n  }\n": types.DeleteProjectDocument,
    "\n  mutation UseProjectInvite($input: ProjectInviteUseInput!) {\n    projectMutations {\n      invites {\n        use(input: $input)\n      }\n    }\n  }\n": types.UseProjectInviteDocument,
    "\n  mutation LeaveProject($projectId: String!) {\n    projectMutations {\n      leave(id: $projectId)\n    }\n  }\n": types.LeaveProjectDocument,
    "\n  mutation DeleteVersions($input: DeleteVersionsInput!) {\n    versionMutations {\n      delete(input: $input)\n    }\n  }\n": types.DeleteVersionsDocument,
    "\n  mutation MoveVersions($input: MoveVersionsInput!) {\n    versionMutations {\n      moveToModel(input: $input) {\n        id\n      }\n    }\n  }\n": types.MoveVersionsDocument,
    "\n  mutation UpdateVersion($input: UpdateVersionInput!) {\n    versionMutations {\n      update(input: $input) {\n        id\n        message\n      }\n    }\n  }\n": types.UpdateVersionDocument,
    "\n  query ProjectAccessCheck($id: String!) {\n    project(id: $id) {\n      id\n    }\n  }\n": types.ProjectAccessCheckDocument,
    "\n  query ProjectsDashboardQuery($filter: UserProjectsFilter, $cursor: String) {\n    activeUser {\n      id\n      projects(filter: $filter, limit: 6, cursor: $cursor) {\n        cursor\n        totalCount\n        items {\n          ...ProjectDashboardItem\n        }\n      }\n      ...ProjectsInviteBanners\n    }\n  }\n": types.ProjectsDashboardQueryDocument,
    "\n  query ProjectPageQuery($id: String!, $token: String) {\n    project(id: $id) {\n      ...ProjectPageProject\n    }\n    projectInvite(projectId: $id, token: $token) {\n      ...ProjectsInviteBanner\n    }\n  }\n": types.ProjectPageQueryDocument,
    "\n  query ProjectLatestModels(\n    $projectId: String!\n    $filter: ProjectModelsFilter\n    $cursor: String = null\n  ) {\n    project(id: $projectId) {\n      id\n      models(cursor: $cursor, limit: 16, filter: $filter) {\n        totalCount\n        cursor\n        items {\n          ...ProjectPageLatestItemsModelItem\n        }\n      }\n      pendingImportedModels(limit: 16) {\n        ...PendingFileUpload\n      }\n    }\n  }\n": types.ProjectLatestModelsDocument,
    "\n  query ProjectModelsTreeTopLevel(\n    $projectId: String!\n    $filter: ProjectModelsTreeFilter\n  ) {\n    project(id: $projectId) {\n      id\n      modelsTree(filter: $filter) {\n        ...SingleLevelModelTreeItem\n      }\n    }\n  }\n": types.ProjectModelsTreeTopLevelDocument,
    "\n  query ProjectModelChildrenTree($projectId: String!, $parentName: String!) {\n    project(id: $projectId) {\n      id\n      modelChildrenTree(fullName: $parentName) {\n        ...SingleLevelModelTreeItem\n      }\n    }\n  }\n": types.ProjectModelChildrenTreeDocument,
    "\n  query ProjectLatestCommentThreads($projectId: String!) {\n    project(id: $projectId) {\n      id\n      commentThreads(cursor: null, limit: 8) {\n        totalCount\n        cursor\n        items {\n          ...ProjectPageLatestItemsCommentItem\n        }\n      }\n    }\n  }\n": types.ProjectLatestCommentThreadsDocument,
    "\n  query ProjectInvite($projectId: String!, $token: String) {\n    projectInvite(projectId: $projectId, token: $token) {\n      ...ProjectsInviteBanner\n    }\n  }\n": types.ProjectInviteDocument,
    "\n  query ProjectModelCheck($projectId: String!, $modelId: String!) {\n    project(id: $projectId) {\n      model(id: $modelId) {\n        id\n      }\n    }\n  }\n": types.ProjectModelCheckDocument,
    "\n  query ProjectModelPage(\n    $projectId: String!\n    $modelId: String!\n    $versionsCursor: String\n  ) {\n    project(id: $projectId) {\n      ...ProjectModelPageHeaderProject\n      ...ProjectModelPageVersionsProject\n    }\n  }\n": types.ProjectModelPageDocument,
    "\n  query ProjectModelVersions(\n    $projectId: String!\n    $modelId: String!\n    $versionsCursor: String\n  ) {\n    project(id: $projectId) {\n      ...ProjectModelPageVersionsPagination\n    }\n  }\n": types.ProjectModelVersionsDocument,
    "\n  query ProjectModelsPage($projectId: String!) {\n    project(id: $projectId) {\n      ...ProjectModelsPageHeader_Project\n      ...ProjectModelsPageResults_Project\n    }\n  }\n": types.ProjectModelsPageDocument,
    "\n  subscription OnProjectUpdated($id: String!) {\n    projectUpdated(id: $id) {\n      id\n      type\n      project {\n        ...ProjectPageProject\n        ...ProjectDashboardItemNoModels\n      }\n    }\n  }\n": types.OnProjectUpdatedDocument,
    "\n  subscription OnProjectModelsUpdate($id: String!) {\n    projectModelsUpdated(id: $id) {\n      id\n      type\n      model {\n        id\n        versions(limit: 1) {\n          items {\n            id\n            referencedObject\n          }\n        }\n        ...ProjectPageLatestItemsModelItem\n      }\n    }\n  }\n": types.OnProjectModelsUpdateDocument,
    "\n  subscription OnProjectVersionsUpdate($id: String!) {\n    projectVersionsUpdated(id: $id) {\n      id\n      modelId\n      type\n      version {\n        id\n        ...ViewerModelVersionCardItem\n        ...ProjectModelPageVersionsCardVersion\n        model {\n          id\n          ...ProjectPageLatestItemsModelItem\n        }\n      }\n    }\n  }\n": types.OnProjectVersionsUpdateDocument,
    "\n  subscription OnProjectVersionsPreviewGenerated($id: String!) {\n    projectVersionsPreviewGenerated(id: $id) {\n      projectId\n      objectId\n      versionId\n    }\n  }\n": types.OnProjectVersionsPreviewGeneratedDocument,
    "\n  subscription OnProjectPendingModelsUpdated($id: String!) {\n    projectPendingModelsUpdated(id: $id) {\n      id\n      type\n      model {\n        ...PendingFileUpload\n        model {\n          ...ProjectPageLatestItemsModelItem\n        }\n      }\n    }\n  }\n": types.OnProjectPendingModelsUpdatedDocument,
    "\n  subscription OnProjectPendingVersionsUpdated($id: String!) {\n    projectPendingVersionsUpdated(id: $id) {\n      id\n      type\n      version {\n        ...PendingFileUpload\n        model {\n          ...ProjectPageLatestItemsModelItem\n        }\n      }\n    }\n  }\n": types.OnProjectPendingVersionsUpdatedDocument,
    "\n  mutation InviteServerUser($input: ServerInviteCreateInput!) {\n    serverInviteCreate(input: $input)\n  }\n": types.InviteServerUserDocument,
    "\n  fragment ViewerCommentBubblesData on Comment {\n    id\n    viewedAt\n    data {\n      location\n      camPos\n      sectionBox\n      selection\n      filters {\n        hiddenIds\n        isolatedIds\n        propertyInfoKey\n        passMax\n        passMin\n        sectionBox\n      }\n    }\n  }\n": types.ViewerCommentBubblesDataFragmentDoc,
    "\n  fragment ViewerCommentThread on Comment {\n    ...ViewerCommentsListItem\n    ...ViewerCommentBubblesData\n    ...ViewerCommentsReplyItem\n  }\n": types.ViewerCommentThreadFragmentDoc,
    "\n  fragment ViewerCommentsReplyItem on Comment {\n    id\n    archived\n    rawText\n    text {\n      doc\n    }\n    author {\n      ...LimitedUserAvatar\n    }\n    createdAt\n    ...ThreadCommentAttachment\n  }\n": types.ViewerCommentsReplyItemFragmentDoc,
    "\n  mutation BroadcastViewerUserActivity(\n    $projectId: String!\n    $resourceIdString: String!\n    $message: ViewerUserActivityMessageInput!\n  ) {\n    broadcastViewerUserActivity(\n      projectId: $projectId\n      resourceIdString: $resourceIdString\n      message: $message\n    )\n  }\n": types.BroadcastViewerUserActivityDocument,
    "\n  mutation MarkCommentViewed($threadId: String!) {\n    commentMutations {\n      markViewed(commentId: $threadId)\n    }\n  }\n": types.MarkCommentViewedDocument,
    "\n  mutation CreateCommentThread($input: CreateCommentInput!) {\n    commentMutations {\n      create(input: $input) {\n        ...ViewerCommentThread\n      }\n    }\n  }\n": types.CreateCommentThreadDocument,
    "\n  mutation CreateCommentReply($input: CreateCommentReplyInput!) {\n    commentMutations {\n      reply(input: $input) {\n        ...ViewerCommentsReplyItem\n      }\n    }\n  }\n": types.CreateCommentReplyDocument,
    "\n  mutation ArchiveComment($commentId: String!, $archived: Boolean) {\n    commentMutations {\n      archive(commentId: $commentId, archived: $archived)\n    }\n  }\n": types.ArchiveCommentDocument,
    "\n  query ProjectViewerResources($projectId: String!, $resourceUrlString: String!) {\n    project(id: $projectId) {\n      id\n      viewerResources(resourceIdString: $resourceUrlString) {\n        identifier\n        items {\n          modelId\n          versionId\n          objectId\n        }\n      }\n    }\n  }\n": types.ProjectViewerResourcesDocument,
    "\n  query ViewerLoadedResources(\n    $projectId: String!\n    $modelIds: [String!]!\n    $versionIds: [String!]\n  ) {\n    project(id: $projectId) {\n      id\n      role\n      models(filter: { ids: $modelIds }) {\n        totalCount\n        items {\n          id\n          name\n          updatedAt\n          loadedVersion: versions(filter: { priorityIds: $versionIds }, limit: 1) {\n            items {\n              ...ViewerModelVersionCardItem\n            }\n          }\n          versions(limit: 5) {\n            totalCount\n            cursor\n            items {\n              ...ViewerModelVersionCardItem\n            }\n          }\n        }\n      }\n      ...ProjectPageLatestItemsModels\n      ...ModelPageProject\n    }\n  }\n": types.ViewerLoadedResourcesDocument,
    "\n  query ViewerModelVersions(\n    $projectId: String!\n    $modelId: String!\n    $versionsCursor: String\n  ) {\n    project(id: $projectId) {\n      id\n      role\n      model(id: $modelId) {\n        id\n        versions(cursor: $versionsCursor, limit: 5) {\n          totalCount\n          cursor\n          items {\n            ...ViewerModelVersionCardItem\n          }\n        }\n      }\n    }\n  }\n": types.ViewerModelVersionsDocument,
    "\n  query ViewerLoadedThreads(\n    $projectId: String!\n    $filter: ProjectCommentsFilter!\n    $cursor: String\n    $limit: Int = 25\n  ) {\n    project(id: $projectId) {\n      id\n      commentThreads(filter: $filter, cursor: $cursor, limit: $limit) {\n        totalCount\n        totalArchivedCount\n        items {\n          ...ViewerCommentThread\n          ...LinkableComment\n        }\n      }\n    }\n  }\n": types.ViewerLoadedThreadsDocument,
    "\n  subscription OnViewerUserActivityBroadcasted($target: ViewerUpdateTrackingTarget!) {\n    viewerUserActivityBroadcasted(target: $target) {\n      userName\n      userId\n      user {\n        ...LimitedUserAvatar\n      }\n      resourceIdString\n      viewerSessionId\n      status\n      thread {\n        isTyping\n        threadId\n      }\n      selection {\n        filteringState\n        selectionLocation\n        sectionBox\n        camera\n      }\n    }\n  }\n": types.OnViewerUserActivityBroadcastedDocument,
    "\n  subscription OnViewerCommentsUpdated($target: ViewerUpdateTrackingTarget!) {\n    projectCommentsUpdated(target: $target) {\n      id\n      type\n      comment {\n        id\n        parent {\n          id\n        }\n        ...ViewerCommentThread\n      }\n    }\n  }\n": types.OnViewerCommentsUpdatedDocument,
    "\n  fragment LinkableComment on Comment {\n    id\n    viewerResources {\n      modelId\n      versionId\n      objectId\n    }\n  }\n": types.LinkableCommentFragmentDoc,
    "\n  query GetActiveUser {\n    activeUser {\n      id\n      name\n      role\n    }\n  }\n": types.GetActiveUserDocument,
    "\n  fragment ProjectPageProject on Project {\n    id\n    createdAt\n    ...ProjectPageProjectHeader\n    ...ProjectPageStatsBlockTeam\n    ...ProjectPageTeamDialog\n    ...ProjectPageStatsBlockVersions\n    ...ProjectPageStatsBlockModels\n    ...ProjectPageStatsBlockComments\n    ...ProjectPageLatestItemsModels\n    ...ProjectPageLatestItemsComments\n  }\n": types.ProjectPageProjectFragmentDoc,
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
export function graphql(source: "\n  fragment AuthRegisterPanelServerInfo on ServerInfo {\n    inviteOnly\n  }\n"): (typeof documents)["\n  fragment AuthRegisterPanelServerInfo on ServerInfo {\n    inviteOnly\n  }\n"];
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
export function graphql(source: "\n  fragment FormUsersSelectItem on LimitedUser {\n    id\n    name\n    avatar\n  }\n"): (typeof documents)["\n  fragment FormUsersSelectItem on LimitedUser {\n    id\n    name\n    avatar\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ProjectModelPageHeaderProject on Project {\n    id\n    name\n    model(id: $modelId) {\n      id\n      name\n    }\n  }\n"): (typeof documents)["\n  fragment ProjectModelPageHeaderProject on Project {\n    id\n    name\n    model(id: $modelId) {\n      id\n      name\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ProjectModelPageVersionsPagination on Project {\n    id\n    model(id: $modelId) {\n      id\n      versions(limit: 16, cursor: $versionsCursor) {\n        cursor\n        totalCount\n        items {\n          ...ProjectModelPageVersionsCardVersion\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  fragment ProjectModelPageVersionsPagination on Project {\n    id\n    model(id: $modelId) {\n      id\n      versions(limit: 16, cursor: $versionsCursor) {\n        cursor\n        totalCount\n        items {\n          ...ProjectModelPageVersionsCardVersion\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ProjectModelPageVersionsProject on Project {\n    id\n    role\n    model(id: $modelId) {\n      id\n      pendingImportedVersions {\n        ...PendingFileUpload\n      }\n    }\n    ...ProjectModelPageVersionsPagination\n  }\n"): (typeof documents)["\n  fragment ProjectModelPageVersionsProject on Project {\n    id\n    role\n    model(id: $modelId) {\n      id\n      pendingImportedVersions {\n        ...PendingFileUpload\n      }\n    }\n    ...ProjectModelPageVersionsPagination\n  }\n"];
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
export function graphql(source: "\n  fragment ProjectModelPageVersionsCardVersion on Version {\n    id\n    message\n    authorUser {\n      ...LimitedUserAvatar\n    }\n    createdAt\n    previewUrl\n    sourceApplication\n    commentThreadCount: commentThreads(limit: 0) {\n      totalCount\n    }\n    ...ProjectModelPageDialogDeleteVersion\n    ...ProjectModelPageDialogMoveToVersion\n  }\n"): (typeof documents)["\n  fragment ProjectModelPageVersionsCardVersion on Version {\n    id\n    message\n    authorUser {\n      ...LimitedUserAvatar\n    }\n    createdAt\n    previewUrl\n    sourceApplication\n    commentThreadCount: commentThreads(limit: 0) {\n      totalCount\n    }\n    ...ProjectModelPageDialogDeleteVersion\n    ...ProjectModelPageDialogMoveToVersion\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ProjectModelsPageHeader_Project on Project {\n    id\n    name\n    sourceApps\n    team {\n      user {\n        ...FormUsersSelectItem\n      }\n    }\n  }\n"): (typeof documents)["\n  fragment ProjectModelsPageHeader_Project on Project {\n    id\n    name\n    sourceApps\n    team {\n      user {\n        ...FormUsersSelectItem\n      }\n    }\n  }\n"];
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
export function graphql(source: "\n  fragment ProjectPageLatestItemsCommentItem on Comment {\n    id\n    author {\n      ...FormUsersSelectItem\n    }\n    screenshot\n    rawText\n    createdAt\n    updatedAt\n    repliesCount: replies(limit: 0) {\n      totalCount\n    }\n    replyAuthors(limit: 4) {\n      totalCount\n      items {\n        ...FormUsersSelectItem\n      }\n    }\n    ...LinkableComment\n  }\n"): (typeof documents)["\n  fragment ProjectPageLatestItemsCommentItem on Comment {\n    id\n    author {\n      ...FormUsersSelectItem\n    }\n    screenshot\n    rawText\n    createdAt\n    updatedAt\n    repliesCount: replies(limit: 0) {\n      totalCount\n    }\n    replyAuthors(limit: 4) {\n      totalCount\n      items {\n        ...FormUsersSelectItem\n      }\n    }\n    ...LinkableComment\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ProjectPageLatestItemsModels on Project {\n    id\n    role\n    modelCount: models(limit: 0) {\n      totalCount\n    }\n  }\n"): (typeof documents)["\n  fragment ProjectPageLatestItemsModels on Project {\n    id\n    role\n    modelCount: models(limit: 0) {\n      totalCount\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ProjectPageModelsActions on Model {\n    id\n    name\n  }\n"): (typeof documents)["\n  fragment ProjectPageModelsActions on Model {\n    id\n    name\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ProjectPageModelsCardProject on Project {\n    id\n    role\n  }\n"): (typeof documents)["\n  fragment ProjectPageModelsCardProject on Project {\n    id\n    role\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ModelPreview on Model {\n    previewUrl\n  }\n"): (typeof documents)["\n  fragment ModelPreview on Model {\n    previewUrl\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment SingleLevelModelTreeItem on ModelsTreeItem {\n    id\n    name\n    fullName\n    model {\n      ...ProjectPageLatestItemsModelItem\n    }\n    pendingModel {\n      ...PendingFileUpload\n    }\n    hasChildren\n    updatedAt\n  }\n"): (typeof documents)["\n  fragment SingleLevelModelTreeItem on ModelsTreeItem {\n    id\n    name\n    fullName\n    model {\n      ...ProjectPageLatestItemsModelItem\n    }\n    pendingModel {\n      ...PendingFileUpload\n    }\n    hasChildren\n    updatedAt\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ProjectPageModelsCardDeleteDialog on Model {\n    id\n    name\n  }\n"): (typeof documents)["\n  fragment ProjectPageModelsCardDeleteDialog on Model {\n    id\n    name\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ProjectPageModelsCardRenameDialog on Model {\n    id\n    name\n  }\n"): (typeof documents)["\n  fragment ProjectPageModelsCardRenameDialog on Model {\n    id\n    name\n  }\n"];
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
export function graphql(source: "\n  fragment ProjectPageTeamDialog on Project {\n    id\n    name\n    role\n    allowPublicComments\n    visibility\n    team {\n      role\n      user {\n        ...LimitedUserAvatar\n      }\n    }\n    invitedTeam {\n      id\n      title\n      inviteId\n      role\n      user {\n        ...LimitedUserAvatar\n      }\n    }\n  }\n"): (typeof documents)["\n  fragment ProjectPageTeamDialog on Project {\n    id\n    name\n    role\n    allowPublicComments\n    visibility\n    team {\n      role\n      user {\n        ...LimitedUserAvatar\n      }\n    }\n    invitedTeam {\n      id\n      title\n      inviteId\n      role\n      user {\n        ...LimitedUserAvatar\n      }\n    }\n  }\n"];
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
export function graphql(source: "\n  fragment ProjectsInviteBanner on PendingStreamCollaborator {\n    id\n    invitedBy {\n      ...LimitedUserAvatar\n    }\n    projectId\n    projectName\n    token\n  }\n"): (typeof documents)["\n  fragment ProjectsInviteBanner on PendingStreamCollaborator {\n    id\n    invitedBy {\n      ...LimitedUserAvatar\n    }\n    projectId\n    projectName\n    token\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ProjectsInviteBanners on User {\n    projectInvites {\n      ...ProjectsInviteBanner\n    }\n  }\n"): (typeof documents)["\n  fragment ProjectsInviteBanners on User {\n    projectInvites {\n      ...ProjectsInviteBanner\n    }\n  }\n"];
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
export function graphql(source: "\n  query ActiveUserMainMetadata {\n    activeUser {\n      id\n      email\n      name\n      role\n      avatar\n      isOnboardingFinished\n      createdAt\n      verified\n    }\n  }\n"): (typeof documents)["\n  query ActiveUserMainMetadata {\n    activeUser {\n      id\n      email\n      name\n      role\n      avatar\n      isOnboardingFinished\n      createdAt\n      verified\n    }\n  }\n"];
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
export function graphql(source: "\n  query AuthServerInfo {\n    serverInfo {\n      ...AuthStategiesServerInfoFragment\n      ...ServerTermsOfServicePrivacyPolicyFragment\n      ...AuthRegisterPanelServerInfo\n    }\n  }\n"): (typeof documents)["\n  query AuthServerInfo {\n    serverInfo {\n      ...AuthStategiesServerInfoFragment\n      ...ServerTermsOfServicePrivacyPolicyFragment\n      ...AuthRegisterPanelServerInfo\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AuthorizableAppMetadata($id: String!) {\n    app(id: $id) {\n      id\n      name\n      description\n      trustByDefault\n      redirectUrl\n      scopes {\n        name\n        description\n      }\n      author {\n        name\n        id\n        avatar\n      }\n    }\n  }\n"): (typeof documents)["\n  query AuthorizableAppMetadata($id: String!) {\n    app(id: $id) {\n      id\n      name\n      description\n      trustByDefault\n      redirectUrl\n      scopes {\n        name\n        description\n      }\n      author {\n        name\n        id\n        avatar\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query MentionsUserSearch($query: String!, $emailOnly: Boolean = false) {\n    userSearch(\n      query: $query\n      limit: 5\n      cursor: null\n      archived: false\n      emailOnly: $emailOnly\n    ) {\n      items {\n        id\n        name\n        company\n      }\n    }\n  }\n"): (typeof documents)["\n  query MentionsUserSearch($query: String!, $emailOnly: Boolean = false) {\n    userSearch(\n      query: $query\n      limit: 5\n      cursor: null\n      archived: false\n      emailOnly: $emailOnly\n    ) {\n      items {\n        id\n        name\n        company\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query UserSearch($query: String!, $limit: Int, $cursor: String, $archived: Boolean) {\n    userSearch(query: $query, limit: $limit, cursor: $cursor, archived: $archived) {\n      cursor\n      items {\n        id\n        name\n        bio\n        company\n        avatar\n        verified\n      }\n    }\n  }\n"): (typeof documents)["\n  query UserSearch($query: String!, $limit: Int, $cursor: String, $archived: Boolean) {\n    userSearch(query: $query, limit: $limit, cursor: $cursor, archived: $archived) {\n      cursor\n      items {\n        id\n        name\n        bio\n        company\n        avatar\n        verified\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ServerInfoBlobSizeLimit {\n    serverInfo {\n      blobSizeLimitBytes\n    }\n  }\n"): (typeof documents)["\n  query ServerInfoBlobSizeLimit {\n    serverInfo {\n      blobSizeLimitBytes\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ProjectModelsSelectorValues($projectId: String!, $cursor: String) {\n    project(id: $projectId) {\n      id\n      models(limit: 100, cursor: $cursor) {\n        cursor\n        totalCount\n        items {\n          ...CommonModelSelectorModel\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query ProjectModelsSelectorValues($projectId: String!, $cursor: String) {\n    project(id: $projectId) {\n      id\n      models(limit: 100, cursor: $cursor) {\n        cursor\n        totalCount\n        items {\n          ...CommonModelSelectorModel\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ServerVersionInfo {\n    serverInfo {\n      version\n    }\n  }\n"): (typeof documents)["\n  query ServerVersionInfo {\n    serverInfo {\n      version\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query InternalTestData {\n    testNumber\n    testList {\n      foo\n      bar\n    }\n  }\n"): (typeof documents)["\n  query InternalTestData {\n    testNumber\n    testList {\n      foo\n      bar\n    }\n  }\n"];
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
export function graphql(source: "\n  fragment ProjectPageLatestItemsModelItem on Model {\n    id\n    name\n    displayName\n    versionCount: versions(limit: 0) {\n      totalCount\n    }\n    commentThreadCount: commentThreads(limit: 0) {\n      totalCount\n    }\n    pendingImportedVersions(limit: 1) {\n      ...PendingFileUpload\n    }\n    previewUrl\n    createdAt\n    updatedAt\n    ...ProjectPageModelsCardRenameDialog\n    ...ProjectPageModelsCardDeleteDialog\n    ...ProjectPageModelsActions\n  }\n"): (typeof documents)["\n  fragment ProjectPageLatestItemsModelItem on Model {\n    id\n    name\n    displayName\n    versionCount: versions(limit: 0) {\n      totalCount\n    }\n    commentThreadCount: commentThreads(limit: 0) {\n      totalCount\n    }\n    pendingImportedVersions(limit: 1) {\n      ...PendingFileUpload\n    }\n    previewUrl\n    createdAt\n    updatedAt\n    ...ProjectPageModelsCardRenameDialog\n    ...ProjectPageModelsCardDeleteDialog\n    ...ProjectPageModelsActions\n  }\n"];
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
export function graphql(source: "\n  mutation InviteProjectUser($input: ProjectInviteCreateInput!) {\n    projectMutations {\n      invites {\n        create(input: $input) {\n          ...ProjectPageTeamDialog\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation InviteProjectUser($input: ProjectInviteCreateInput!) {\n    projectMutations {\n      invites {\n        create(input: $input) {\n          ...ProjectPageTeamDialog\n        }\n      }\n    }\n  }\n"];
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
export function graphql(source: "\n  query ProjectLatestModels(\n    $projectId: String!\n    $filter: ProjectModelsFilter\n    $cursor: String = null\n  ) {\n    project(id: $projectId) {\n      id\n      models(cursor: $cursor, limit: 16, filter: $filter) {\n        totalCount\n        cursor\n        items {\n          ...ProjectPageLatestItemsModelItem\n        }\n      }\n      pendingImportedModels(limit: 16) {\n        ...PendingFileUpload\n      }\n    }\n  }\n"): (typeof documents)["\n  query ProjectLatestModels(\n    $projectId: String!\n    $filter: ProjectModelsFilter\n    $cursor: String = null\n  ) {\n    project(id: $projectId) {\n      id\n      models(cursor: $cursor, limit: 16, filter: $filter) {\n        totalCount\n        cursor\n        items {\n          ...ProjectPageLatestItemsModelItem\n        }\n      }\n      pendingImportedModels(limit: 16) {\n        ...PendingFileUpload\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ProjectModelsTreeTopLevel(\n    $projectId: String!\n    $filter: ProjectModelsTreeFilter\n  ) {\n    project(id: $projectId) {\n      id\n      modelsTree(filter: $filter) {\n        ...SingleLevelModelTreeItem\n      }\n    }\n  }\n"): (typeof documents)["\n  query ProjectModelsTreeTopLevel(\n    $projectId: String!\n    $filter: ProjectModelsTreeFilter\n  ) {\n    project(id: $projectId) {\n      id\n      modelsTree(filter: $filter) {\n        ...SingleLevelModelTreeItem\n      }\n    }\n  }\n"];
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
export function graphql(source: "\n  mutation InviteServerUser($input: ServerInviteCreateInput!) {\n    serverInviteCreate(input: $input)\n  }\n"): (typeof documents)["\n  mutation InviteServerUser($input: ServerInviteCreateInput!) {\n    serverInviteCreate(input: $input)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ViewerCommentBubblesData on Comment {\n    id\n    viewedAt\n    data {\n      location\n      camPos\n      sectionBox\n      selection\n      filters {\n        hiddenIds\n        isolatedIds\n        propertyInfoKey\n        passMax\n        passMin\n        sectionBox\n      }\n    }\n  }\n"): (typeof documents)["\n  fragment ViewerCommentBubblesData on Comment {\n    id\n    viewedAt\n    data {\n      location\n      camPos\n      sectionBox\n      selection\n      filters {\n        hiddenIds\n        isolatedIds\n        propertyInfoKey\n        passMax\n        passMin\n        sectionBox\n      }\n    }\n  }\n"];
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
export function graphql(source: "\n  query ViewerLoadedResources(\n    $projectId: String!\n    $modelIds: [String!]!\n    $versionIds: [String!]\n  ) {\n    project(id: $projectId) {\n      id\n      role\n      models(filter: { ids: $modelIds }) {\n        totalCount\n        items {\n          id\n          name\n          updatedAt\n          loadedVersion: versions(filter: { priorityIds: $versionIds }, limit: 1) {\n            items {\n              ...ViewerModelVersionCardItem\n            }\n          }\n          versions(limit: 5) {\n            totalCount\n            cursor\n            items {\n              ...ViewerModelVersionCardItem\n            }\n          }\n        }\n      }\n      ...ProjectPageLatestItemsModels\n      ...ModelPageProject\n    }\n  }\n"): (typeof documents)["\n  query ViewerLoadedResources(\n    $projectId: String!\n    $modelIds: [String!]!\n    $versionIds: [String!]\n  ) {\n    project(id: $projectId) {\n      id\n      role\n      models(filter: { ids: $modelIds }) {\n        totalCount\n        items {\n          id\n          name\n          updatedAt\n          loadedVersion: versions(filter: { priorityIds: $versionIds }, limit: 1) {\n            items {\n              ...ViewerModelVersionCardItem\n            }\n          }\n          versions(limit: 5) {\n            totalCount\n            cursor\n            items {\n              ...ViewerModelVersionCardItem\n            }\n          }\n        }\n      }\n      ...ProjectPageLatestItemsModels\n      ...ModelPageProject\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ViewerModelVersions(\n    $projectId: String!\n    $modelId: String!\n    $versionsCursor: String\n  ) {\n    project(id: $projectId) {\n      id\n      role\n      model(id: $modelId) {\n        id\n        versions(cursor: $versionsCursor, limit: 5) {\n          totalCount\n          cursor\n          items {\n            ...ViewerModelVersionCardItem\n          }\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query ViewerModelVersions(\n    $projectId: String!\n    $modelId: String!\n    $versionsCursor: String\n  ) {\n    project(id: $projectId) {\n      id\n      role\n      model(id: $modelId) {\n        id\n        versions(cursor: $versionsCursor, limit: 5) {\n          totalCount\n          cursor\n          items {\n            ...ViewerModelVersionCardItem\n          }\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ViewerLoadedThreads(\n    $projectId: String!\n    $filter: ProjectCommentsFilter!\n    $cursor: String\n    $limit: Int = 25\n  ) {\n    project(id: $projectId) {\n      id\n      commentThreads(filter: $filter, cursor: $cursor, limit: $limit) {\n        totalCount\n        totalArchivedCount\n        items {\n          ...ViewerCommentThread\n          ...LinkableComment\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query ViewerLoadedThreads(\n    $projectId: String!\n    $filter: ProjectCommentsFilter!\n    $cursor: String\n    $limit: Int = 25\n  ) {\n    project(id: $projectId) {\n      id\n      commentThreads(filter: $filter, cursor: $cursor, limit: $limit) {\n        totalCount\n        totalArchivedCount\n        items {\n          ...ViewerCommentThread\n          ...LinkableComment\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription OnViewerUserActivityBroadcasted($target: ViewerUpdateTrackingTarget!) {\n    viewerUserActivityBroadcasted(target: $target) {\n      userName\n      userId\n      user {\n        ...LimitedUserAvatar\n      }\n      resourceIdString\n      viewerSessionId\n      status\n      thread {\n        isTyping\n        threadId\n      }\n      selection {\n        filteringState\n        selectionLocation\n        sectionBox\n        camera\n      }\n    }\n  }\n"): (typeof documents)["\n  subscription OnViewerUserActivityBroadcasted($target: ViewerUpdateTrackingTarget!) {\n    viewerUserActivityBroadcasted(target: $target) {\n      userName\n      userId\n      user {\n        ...LimitedUserAvatar\n      }\n      resourceIdString\n      viewerSessionId\n      status\n      thread {\n        isTyping\n        threadId\n      }\n      selection {\n        filteringState\n        selectionLocation\n        sectionBox\n        camera\n      }\n    }\n  }\n"];
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
export function graphql(source: "\n  query GetActiveUser {\n    activeUser {\n      id\n      name\n      role\n    }\n  }\n"): (typeof documents)["\n  query GetActiveUser {\n    activeUser {\n      id\n      name\n      role\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ProjectPageProject on Project {\n    id\n    createdAt\n    ...ProjectPageProjectHeader\n    ...ProjectPageStatsBlockTeam\n    ...ProjectPageTeamDialog\n    ...ProjectPageStatsBlockVersions\n    ...ProjectPageStatsBlockModels\n    ...ProjectPageStatsBlockComments\n    ...ProjectPageLatestItemsModels\n    ...ProjectPageLatestItemsComments\n  }\n"): (typeof documents)["\n  fragment ProjectPageProject on Project {\n    id\n    createdAt\n    ...ProjectPageProjectHeader\n    ...ProjectPageStatsBlockTeam\n    ...ProjectPageTeamDialog\n    ...ProjectPageStatsBlockVersions\n    ...ProjectPageStatsBlockModels\n    ...ProjectPageStatsBlockComments\n    ...ProjectPageLatestItemsModels\n    ...ProjectPageLatestItemsComments\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ModelPageProject on Project {\n    id\n    createdAt\n    name\n  }\n"): (typeof documents)["\n  fragment ModelPageProject on Project {\n    id\n    createdAt\n    name\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;