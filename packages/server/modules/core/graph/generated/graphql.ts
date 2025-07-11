import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import { StreamGraphQLReturn, CommitGraphQLReturn, ProjectGraphQLReturn, ObjectGraphQLReturn, VersionGraphQLReturn, ServerInviteGraphQLReturnType, ModelGraphQLReturn, ModelsTreeItemGraphQLReturn, MutationsObjectGraphQLReturn, LimitedUserGraphQLReturn, UserGraphQLReturn, EmbedTokenGraphQLReturn, GraphQLEmptyReturn, StreamCollaboratorGraphQLReturn, ProjectCollaboratorGraphQLReturn, ServerInfoGraphQLReturn, BranchGraphQLReturn, UserMetaGraphQLReturn, ProjectPermissionChecksGraphQLReturn, ModelPermissionChecksGraphQLReturn, VersionPermissionChecksGraphQLReturn, RootPermissionChecksGraphQLReturn } from '@/modules/core/helpers/graphTypes';
import { StreamAccessRequestGraphQLReturn, ProjectAccessRequestGraphQLReturn } from '@/modules/accessrequests/helpers/graphTypes';
import { CommentReplyAuthorCollectionGraphQLReturn, CommentGraphQLReturn, CommentPermissionChecksGraphQLReturn } from '@/modules/comments/helpers/graphTypes';
import { PendingStreamCollaboratorGraphQLReturn } from '@/modules/serverinvites/helpers/graphTypes';
import { FileUploadGraphQLReturn } from '@/modules/fileuploads/helpers/types';
import { AutomateFunctionGraphQLReturn, AutomateFunctionReleaseGraphQLReturn, AutomationGraphQLReturn, AutomationPermissionChecksGraphQLReturn, AutomationRevisionGraphQLReturn, AutomationRevisionFunctionGraphQLReturn, AutomateRunGraphQLReturn, AutomationRunTriggerGraphQLReturn, AutomationRevisionTriggerDefinitionGraphQLReturn, AutomateFunctionRunGraphQLReturn, TriggeredAutomationsStatusGraphQLReturn, ProjectAutomationMutationsGraphQLReturn, ProjectTriggeredAutomationsStatusUpdatedMessageGraphQLReturn, ProjectAutomationsUpdatedMessageGraphQLReturn, UserAutomateInfoGraphQLReturn } from '@/modules/automate/helpers/graphTypes';
import { WorkspaceGraphQLReturn, WorkspaceSsoGraphQLReturn, WorkspaceMutationsGraphQLReturn, WorkspaceJoinRequestMutationsGraphQLReturn, WorkspaceInviteMutationsGraphQLReturn, WorkspaceProjectMutationsGraphQLReturn, PendingWorkspaceCollaboratorGraphQLReturn, WorkspaceCollaboratorGraphQLReturn, LimitedWorkspaceGraphQLReturn, LimitedWorkspaceCollaboratorGraphQLReturn, WorkspaceJoinRequestGraphQLReturn, LimitedWorkspaceJoinRequestGraphQLReturn, ProjectMoveToWorkspaceDryRunGraphQLReturn, ProjectRoleGraphQLReturn, WorkspacePermissionChecksGraphQLReturn } from '@/modules/workspacesCore/helpers/graphTypes';
import { WorkspacePlanGraphQLReturn, WorkspacePlanUsageGraphQLReturn, PriceGraphQLReturn } from '@/modules/gatekeeperCore/helpers/graphTypes';
import { WorkspaceBillingMutationsGraphQLReturn, WorkspaceSubscriptionSeatsGraphQLReturn, WorkspaceSubscriptionGraphQLReturn } from '@/modules/gatekeeper/helpers/graphTypes';
import { WebhookGraphQLReturn } from '@/modules/webhooks/helpers/graphTypes';
import { SmartTextEditorValueGraphQLReturn } from '@/modules/core/services/richTextEditorService';
import { BlobStorageItem } from '@/modules/blobstorage/domain/types';
import { ActivityCollectionGraphQLReturn } from '@/modules/activitystream/helpers/graphTypes';
import { ServerAppGraphQLReturn, ServerAppListItemGraphQLReturn } from '@/modules/auth/helpers/graphTypes';
import { GendoAIRenderGraphQLReturn } from '@/modules/gendo/helpers/types/graphTypes';
import { ServerRegionItemGraphQLReturn } from '@/modules/multiregion/helpers/graphTypes';
import { GraphQLContext } from '@/modules/shared/helpers/typeHelper';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** The `BigInt` scalar type represents non-fractional signed whole numeric values. */
  BigInt: { input: bigint; output: bigint; }
  /** A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
  DateTime: { input: Date; output: Date; }
  /** The `JSONObject` scalar type represents JSON objects as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSONObject: { input: Record<string, unknown>; output: Record<string, unknown>; }
};

export type ActiveUserMutations = {
  __typename?: 'ActiveUserMutations';
  emailMutations: UserEmailMutations;
  /** Mark onboarding as complete */
  finishOnboarding: Scalars['Boolean']['output'];
  meta: UserMetaMutations;
  setActiveWorkspace: Scalars['Boolean']['output'];
  /** Edit a user's profile */
  update: User;
};


export type ActiveUserMutationsFinishOnboardingArgs = {
  input?: InputMaybe<OnboardingCompletionInput>;
};


export type ActiveUserMutationsSetActiveWorkspaceArgs = {
  isProjectsActive?: InputMaybe<Scalars['Boolean']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
};


export type ActiveUserMutationsUpdateArgs = {
  user: UserUpdateInput;
};

export type Activity = {
  __typename?: 'Activity';
  actionType: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  info: Scalars['JSONObject']['output'];
  message: Scalars['String']['output'];
  resourceId: Scalars['String']['output'];
  resourceType: Scalars['String']['output'];
  streamId?: Maybe<Scalars['String']['output']>;
  time: Scalars['DateTime']['output'];
  userId: Scalars['String']['output'];
};

export type ActivityCollection = {
  __typename?: 'ActivityCollection';
  cursor?: Maybe<Scalars['String']['output']>;
  items: Array<Activity>;
  totalCount: Scalars['Int']['output'];
};

export type AddDomainToWorkspaceInput = {
  domain: Scalars['String']['input'];
  workspaceId: Scalars['ID']['input'];
};

export type AdminInviteList = {
  __typename?: 'AdminInviteList';
  cursor?: Maybe<Scalars['String']['output']>;
  items: Array<ServerInvite>;
  totalCount: Scalars['Int']['output'];
};

export type AdminMutations = {
  __typename?: 'AdminMutations';
  updateWorkspacePlan: Scalars['Boolean']['output'];
};


export type AdminMutationsUpdateWorkspacePlanArgs = {
  input: AdminUpdateWorkspacePlanInput;
};

export type AdminQueries = {
  __typename?: 'AdminQueries';
  inviteList: AdminInviteList;
  projectList: ProjectCollection;
  serverStatistics: ServerStatistics;
  userList: AdminUserList;
  workspaceList: WorkspaceCollection;
};


export type AdminQueriesInviteListArgs = {
  cursor?: InputMaybe<Scalars['String']['input']>;
  limit?: Scalars['Int']['input'];
  query?: InputMaybe<Scalars['String']['input']>;
};


export type AdminQueriesProjectListArgs = {
  cursor?: InputMaybe<Scalars['String']['input']>;
  limit?: Scalars['Int']['input'];
  orderBy?: InputMaybe<Scalars['String']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
  visibility?: InputMaybe<Scalars['String']['input']>;
};


export type AdminQueriesUserListArgs = {
  cursor?: InputMaybe<Scalars['String']['input']>;
  limit?: Scalars['Int']['input'];
  query?: InputMaybe<Scalars['String']['input']>;
  role?: InputMaybe<ServerRole>;
};


export type AdminQueriesWorkspaceListArgs = {
  cursor?: InputMaybe<Scalars['String']['input']>;
  limit?: Scalars['Int']['input'];
  query?: InputMaybe<Scalars['String']['input']>;
};

export type AdminUpdateWorkspacePlanInput = {
  plan: WorkspacePlans;
  status: WorkspacePlanStatuses;
  workspaceId: Scalars['ID']['input'];
};

export type AdminUserList = {
  __typename?: 'AdminUserList';
  cursor?: Maybe<Scalars['String']['output']>;
  items: Array<AdminUserListItem>;
  totalCount: Scalars['Int']['output'];
};

export type AdminUserListItem = {
  __typename?: 'AdminUserListItem';
  avatar?: Maybe<Scalars['String']['output']>;
  company?: Maybe<Scalars['String']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  role?: Maybe<Scalars['String']['output']>;
  verified?: Maybe<Scalars['Boolean']['output']>;
};

export type AdminUsersListCollection = {
  __typename?: 'AdminUsersListCollection';
  items: Array<AdminUsersListItem>;
  totalCount: Scalars['Int']['output'];
};

/**
 * A representation of a registered or invited user in the admin users list. Either registeredUser
 * or invitedUser will always be set, both values can't be null.
 */
export type AdminUsersListItem = {
  __typename?: 'AdminUsersListItem';
  id: Scalars['String']['output'];
  invitedUser?: Maybe<ServerInvite>;
  registeredUser?: Maybe<User>;
};

export type AdminWorkspaceJoinRequestFilter = {
  status?: InputMaybe<WorkspaceJoinRequestStatus>;
};

export type ApiToken = {
  __typename?: 'ApiToken';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['String']['output'];
  lastChars: Scalars['String']['output'];
  lastUsed: Scalars['DateTime']['output'];
  lifespan: Scalars['BigInt']['output'];
  name: Scalars['String']['output'];
  scopes: Array<Maybe<Scalars['String']['output']>>;
};

export type ApiTokenCreateInput = {
  lifespan?: InputMaybe<Scalars['BigInt']['input']>;
  name: Scalars['String']['input'];
  scopes: Array<Scalars['String']['input']>;
};

export type AppAuthor = {
  __typename?: 'AppAuthor';
  avatar?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

export type AppCreateInput = {
  description: Scalars['String']['input'];
  logo?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  public?: InputMaybe<Scalars['Boolean']['input']>;
  redirectUrl: Scalars['String']['input'];
  scopes: Array<InputMaybe<Scalars['String']['input']>>;
  termsAndConditionsLink?: InputMaybe<Scalars['String']['input']>;
};

export type AppTokenCreateInput = {
  lifespan?: InputMaybe<Scalars['BigInt']['input']>;
  /** Optionally limit the token to only have access to specific resources */
  limitResources?: InputMaybe<Array<TokenResourceIdentifierInput>>;
  name: Scalars['String']['input'];
  scopes: Array<Scalars['String']['input']>;
};

export type AppUpdateInput = {
  description: Scalars['String']['input'];
  id: Scalars['String']['input'];
  logo?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  public?: InputMaybe<Scalars['Boolean']['input']>;
  redirectUrl: Scalars['String']['input'];
  scopes: Array<InputMaybe<Scalars['String']['input']>>;
  termsAndConditionsLink?: InputMaybe<Scalars['String']['input']>;
};

export type ApproveWorkspaceJoinRequestInput = {
  userId: Scalars['String']['input'];
  workspaceId: Scalars['String']['input'];
};

export type ArchiveCommentInput = {
  archived: Scalars['Boolean']['input'];
  commentId: Scalars['String']['input'];
  projectId: Scalars['String']['input'];
};

export type AuthStrategy = {
  __typename?: 'AuthStrategy';
  color?: Maybe<Scalars['String']['output']>;
  icon: Scalars['String']['output'];
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  url: Scalars['String']['output'];
};

export type AutomateAuthCodePayloadTest = {
  action: Scalars['String']['input'];
  code: Scalars['String']['input'];
  userId: Scalars['String']['input'];
  workspaceId?: InputMaybe<Scalars['String']['input']>;
};

/** Additional resources to validate user access to. */
export type AutomateAuthCodeResources = {
  workspaceId?: InputMaybe<Scalars['String']['input']>;
};

export type AutomateFunction = {
  __typename?: 'AutomateFunction';
  /** Only returned if user is a part of this speckle server */
  creator?: Maybe<LimitedUser>;
  description: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isFeatured: Scalars['Boolean']['output'];
  logo?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  releases: AutomateFunctionReleaseCollection;
  repo: BasicGitRepositoryMetadata;
  /** SourceAppNames values from @speckle/shared. Empty array means - all of them */
  supportedSourceApps: Array<Scalars['String']['output']>;
  tags: Array<Scalars['String']['output']>;
  workspaceIds?: Maybe<Array<Scalars['String']['output']>>;
};


export type AutomateFunctionReleasesArgs = {
  cursor?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<AutomateFunctionReleasesFilter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
};

export type AutomateFunctionCollection = {
  __typename?: 'AutomateFunctionCollection';
  cursor?: Maybe<Scalars['String']['output']>;
  items: Array<AutomateFunction>;
  totalCount: Scalars['Int']['output'];
};

export type AutomateFunctionRelease = {
  __typename?: 'AutomateFunctionRelease';
  commitId: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  function: AutomateFunction;
  functionId: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  inputSchema?: Maybe<Scalars['JSONObject']['output']>;
  versionTag: Scalars['String']['output'];
};

export type AutomateFunctionReleaseCollection = {
  __typename?: 'AutomateFunctionReleaseCollection';
  cursor?: Maybe<Scalars['String']['output']>;
  items: Array<AutomateFunctionRelease>;
  totalCount: Scalars['Int']['output'];
};

export type AutomateFunctionReleasesFilter = {
  search?: InputMaybe<Scalars['String']['input']>;
};

export type AutomateFunctionRun = {
  __typename?: 'AutomateFunctionRun';
  contextView?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  elapsed: Scalars['Float']['output'];
  /** Nullable, in case the function is not retrievable due to poor network conditions */
  function?: Maybe<AutomateFunction>;
  functionId?: Maybe<Scalars['String']['output']>;
  functionReleaseId?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  /** AutomateTypes.ResultsSchema type from @speckle/shared */
  results?: Maybe<Scalars['JSONObject']['output']>;
  status: AutomateRunStatus;
  statusMessage?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
};

export type AutomateFunctionRunStatusReportInput = {
  contextView?: InputMaybe<Scalars['String']['input']>;
  functionRunId: Scalars['String']['input'];
  projectId: Scalars['String']['input'];
  /** AutomateTypes.ResultsSchema type from @speckle/shared */
  results?: InputMaybe<Scalars['JSONObject']['input']>;
  status: AutomateRunStatus;
  statusMessage?: InputMaybe<Scalars['String']['input']>;
};

export type AutomateFunctionTemplate = {
  __typename?: 'AutomateFunctionTemplate';
  id: AutomateFunctionTemplateLanguage;
  logo: Scalars['String']['output'];
  title: Scalars['String']['output'];
  url: Scalars['String']['output'];
};

export const AutomateFunctionTemplateLanguage = {
  DotNet: 'DOT_NET',
  Python: 'PYTHON',
  Typescript: 'TYPESCRIPT'
} as const;

export type AutomateFunctionTemplateLanguage = typeof AutomateFunctionTemplateLanguage[keyof typeof AutomateFunctionTemplateLanguage];
export type AutomateFunctionToken = {
  __typename?: 'AutomateFunctionToken';
  functionId: Scalars['String']['output'];
  functionToken: Scalars['String']['output'];
};

export type AutomateFunctionsFilter = {
  /** By default, we include featured ("public") functions. Set this to false to exclude them. */
  includeFeatured?: InputMaybe<Scalars['Boolean']['input']>;
  /** By default, we exclude functions without releases. Set this to false to include them. */
  requireRelease?: InputMaybe<Scalars['Boolean']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
};

export type AutomateMutations = {
  __typename?: 'AutomateMutations';
  createFunction: AutomateFunction;
  createFunctionWithoutVersion: AutomateFunctionToken;
  updateFunction: AutomateFunction;
};


export type AutomateMutationsCreateFunctionArgs = {
  input: CreateAutomateFunctionInput;
};


export type AutomateMutationsCreateFunctionWithoutVersionArgs = {
  input: CreateAutomateFunctionWithoutVersionInput;
};


export type AutomateMutationsUpdateFunctionArgs = {
  input: UpdateAutomateFunctionInput;
};

export type AutomateRun = {
  __typename?: 'AutomateRun';
  automation: Automation;
  automationId: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  functionRuns: Array<AutomateFunctionRun>;
  id: Scalars['ID']['output'];
  status: AutomateRunStatus;
  trigger: AutomationRunTrigger;
  updatedAt: Scalars['DateTime']['output'];
};

export type AutomateRunCollection = {
  __typename?: 'AutomateRunCollection';
  cursor?: Maybe<Scalars['String']['output']>;
  items: Array<AutomateRun>;
  totalCount: Scalars['Int']['output'];
};

export const AutomateRunStatus = {
  Canceled: 'CANCELED',
  Exception: 'EXCEPTION',
  Failed: 'FAILED',
  Initializing: 'INITIALIZING',
  Pending: 'PENDING',
  Running: 'RUNNING',
  Succeeded: 'SUCCEEDED',
  Timeout: 'TIMEOUT'
} as const;

export type AutomateRunStatus = typeof AutomateRunStatus[keyof typeof AutomateRunStatus];
export const AutomateRunTriggerType = {
  VersionCreated: 'VERSION_CREATED'
} as const;

export type AutomateRunTriggerType = typeof AutomateRunTriggerType[keyof typeof AutomateRunTriggerType];
export type Automation = {
  __typename?: 'Automation';
  createdAt: Scalars['DateTime']['output'];
  /** Only accessible to automation owners */
  creationPublicKeys: Array<Scalars['String']['output']>;
  currentRevision?: Maybe<AutomationRevision>;
  enabled: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  isTestAutomation: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  permissions: AutomationPermissionChecks;
  runs: AutomateRunCollection;
  updatedAt: Scalars['DateTime']['output'];
};


export type AutomationRunsArgs = {
  cursor?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
};

export type AutomationCollection = {
  __typename?: 'AutomationCollection';
  cursor?: Maybe<Scalars['String']['output']>;
  items: Array<Automation>;
  totalCount: Scalars['Int']['output'];
};

export type AutomationPermissionChecks = {
  __typename?: 'AutomationPermissionChecks';
  canDelete: PermissionCheckResult;
  canRead: PermissionCheckResult;
  canUpdate: PermissionCheckResult;
};

export type AutomationRevision = {
  __typename?: 'AutomationRevision';
  functions: Array<AutomationRevisionFunction>;
  id: Scalars['ID']['output'];
  triggerDefinitions: Array<AutomationRevisionTriggerDefinition>;
};

export type AutomationRevisionCreateFunctionInput = {
  functionId: Scalars['String']['input'];
  functionReleaseId: Scalars['String']['input'];
  /** Should be encrypted from the client side */
  parameters?: InputMaybe<Scalars['String']['input']>;
};

export type AutomationRevisionFunction = {
  __typename?: 'AutomationRevisionFunction';
  /** The secrets in parameters are redacted with six asterisks - ****** */
  parameters?: Maybe<Scalars['JSONObject']['output']>;
  release: AutomateFunctionRelease;
};

export type AutomationRevisionTriggerDefinition = VersionCreatedTriggerDefinition;

export type AutomationRunTrigger = VersionCreatedTrigger;

export type BasicGitRepositoryMetadata = {
  __typename?: 'BasicGitRepositoryMetadata';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  owner: Scalars['String']['output'];
  url: Scalars['String']['output'];
};

export const BillingInterval = {
  Monthly: 'monthly',
  Yearly: 'yearly'
} as const;

export type BillingInterval = typeof BillingInterval[keyof typeof BillingInterval];
export type BlobMetadata = {
  __typename?: 'BlobMetadata';
  createdAt: Scalars['DateTime']['output'];
  fileHash?: Maybe<Scalars['String']['output']>;
  fileName: Scalars['String']['output'];
  fileSize?: Maybe<Scalars['Int']['output']>;
  fileType: Scalars['String']['output'];
  id: Scalars['String']['output'];
  streamId: Scalars['String']['output'];
  uploadError?: Maybe<Scalars['String']['output']>;
  uploadStatus: Scalars['Int']['output'];
  userId: Scalars['String']['output'];
};

export type BlobMetadataCollection = {
  __typename?: 'BlobMetadataCollection';
  cursor?: Maybe<Scalars['String']['output']>;
  items?: Maybe<Array<BlobMetadata>>;
  totalCount: Scalars['Int']['output'];
  totalSize: Scalars['Int']['output'];
};

export type Branch = {
  __typename?: 'Branch';
  /**
   * All the recent activity on this branch in chronological order
   * @deprecated Part of the old API surface and will be removed in the future.
   */
  activity?: Maybe<ActivityCollection>;
  author?: Maybe<User>;
  commits?: Maybe<CommitCollection>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
};


export type BranchActivityArgs = {
  actionType?: InputMaybe<Scalars['String']['input']>;
  after?: InputMaybe<Scalars['DateTime']['input']>;
  before?: InputMaybe<Scalars['DateTime']['input']>;
  cursor?: InputMaybe<Scalars['DateTime']['input']>;
  limit?: Scalars['Int']['input'];
};


export type BranchCommitsArgs = {
  cursor?: InputMaybe<Scalars['String']['input']>;
  limit?: Scalars['Int']['input'];
};

export type BranchCollection = {
  __typename?: 'BranchCollection';
  cursor?: Maybe<Scalars['String']['output']>;
  items?: Maybe<Array<Branch>>;
  totalCount: Scalars['Int']['output'];
};

export type BranchCreateInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  streamId: Scalars['String']['input'];
};

export type BranchDeleteInput = {
  id: Scalars['String']['input'];
  streamId: Scalars['String']['input'];
};

export type BranchUpdateInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  streamId: Scalars['String']['input'];
};

export type BulkUsersRetrievalInput = {
  cursor?: InputMaybe<Scalars['String']['input']>;
  emails: Array<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
};

export type CancelCheckoutSessionInput = {
  sessionId: Scalars['ID']['input'];
  workspaceId: Scalars['ID']['input'];
};

export type CheckoutSession = {
  __typename?: 'CheckoutSession';
  billingInterval: BillingInterval;
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  paymentStatus: SessionPaymentStatus;
  updatedAt: Scalars['DateTime']['output'];
  url: Scalars['String']['output'];
  workspacePlan: PaidWorkspacePlans;
};

export type CheckoutSessionInput = {
  billingInterval: BillingInterval;
  currency?: InputMaybe<Currency>;
  isCreateFlow?: InputMaybe<Scalars['Boolean']['input']>;
  workspaceId: Scalars['ID']['input'];
  workspacePlan: PaidWorkspacePlans;
};

export type Comment = {
  __typename?: 'Comment';
  archived: Scalars['Boolean']['output'];
  author: LimitedUser;
  authorId: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  /**
   * Legacy comment viewer data field
   * @deprecated Use the new viewerState field instead
   */
  data?: Maybe<Scalars['JSONObject']['output']>;
  /** Whether or not comment is a reply to another comment */
  hasParent: Scalars['Boolean']['output'];
  id: Scalars['String']['output'];
  /** Parent thread, if there's any */
  parent?: Maybe<Comment>;
  permissions: CommentPermissionChecks;
  /** Plain-text version of the comment text, ideal for previews */
  rawText?: Maybe<Scalars['String']['output']>;
  /** @deprecated Not actually implemented */
  reactions?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  /** Gets the replies to this comment. */
  replies: CommentCollection;
  /** Get authors of replies to this comment */
  replyAuthors: CommentReplyAuthorCollection;
  /** Resources that this comment targets. Can be a mixture of either one stream, or multiple commits and objects. */
  resources: Array<ResourceIdentifier>;
  screenshot?: Maybe<Scalars['String']['output']>;
  text?: Maybe<SmartTextEditorValue>;
  /** The time this comment was last updated. Corresponds also to the latest reply to this comment, if any. */
  updatedAt: Scalars['DateTime']['output'];
  /** The last time you viewed this comment. Present only if an auth'ed request. Relevant only if a top level commit. */
  viewedAt?: Maybe<Scalars['DateTime']['output']>;
  /** Resource identifiers as defined and implemented in the Viewer of the new frontend */
  viewerResources: Array<ViewerResourceItem>;
  /** SerializedViewerState */
  viewerState?: Maybe<Scalars['JSONObject']['output']>;
};


export type CommentRepliesArgs = {
  cursor?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type CommentReplyAuthorsArgs = {
  limit?: Scalars['Int']['input'];
};

export type CommentActivityMessage = {
  __typename?: 'CommentActivityMessage';
  comment: Comment;
  type: Scalars['String']['output'];
};

export type CommentCollection = {
  __typename?: 'CommentCollection';
  cursor?: Maybe<Scalars['String']['output']>;
  items: Array<Comment>;
  totalCount: Scalars['Int']['output'];
};

export type CommentContentInput = {
  blobIds?: InputMaybe<Array<Scalars['String']['input']>>;
  doc?: InputMaybe<Scalars['JSONObject']['input']>;
};

/** Deprecated: Used by old stream-based mutations */
export type CommentCreateInput = {
  /** IDs of uploaded blobs that should be attached to this comment */
  blobIds: Array<Scalars['String']['input']>;
  data: Scalars['JSONObject']['input'];
  /**
   * Specifies the resources this comment is linked to. There are several use cases:
   * - a comment targets only one resource (commit or object)
   * - a comment targets one or more resources (commits or objects)
   * - a comment targets only a stream
   */
  resources: Array<InputMaybe<ResourceIdentifierInput>>;
  screenshot?: InputMaybe<Scalars['String']['input']>;
  streamId: Scalars['String']['input'];
  /** ProseMirror document object */
  text?: InputMaybe<Scalars['JSONObject']['input']>;
};

export type CommentDataFilters = {
  __typename?: 'CommentDataFilters';
  hiddenIds?: Maybe<Array<Scalars['String']['output']>>;
  isolatedIds?: Maybe<Array<Scalars['String']['output']>>;
  passMax?: Maybe<Scalars['Float']['output']>;
  passMin?: Maybe<Scalars['Float']['output']>;
  propertyInfoKey?: Maybe<Scalars['String']['output']>;
  sectionBox?: Maybe<Scalars['JSONObject']['output']>;
};

/** Equivalent to frontend-1's LocalFilterState */
export type CommentDataFiltersInput = {
  hiddenIds?: InputMaybe<Array<Scalars['String']['input']>>;
  isolatedIds?: InputMaybe<Array<Scalars['String']['input']>>;
  passMax?: InputMaybe<Scalars['Float']['input']>;
  passMin?: InputMaybe<Scalars['Float']['input']>;
  propertyInfoKey?: InputMaybe<Scalars['String']['input']>;
  sectionBox?: InputMaybe<Scalars['JSONObject']['input']>;
};

/** Deprecated: Used by old stream-based mutations */
export type CommentEditInput = {
  /** IDs of uploaded blobs that should be attached to this comment */
  blobIds: Array<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  streamId: Scalars['String']['input'];
  /** ProseMirror document object */
  text?: InputMaybe<Scalars['JSONObject']['input']>;
};

export type CommentMutations = {
  __typename?: 'CommentMutations';
  archive: Scalars['Boolean']['output'];
  create: Comment;
  edit: Comment;
  markViewed: Scalars['Boolean']['output'];
  reply: Comment;
};


export type CommentMutationsArchiveArgs = {
  input: ArchiveCommentInput;
};


export type CommentMutationsCreateArgs = {
  input: CreateCommentInput;
};


export type CommentMutationsEditArgs = {
  input: EditCommentInput;
};


export type CommentMutationsMarkViewedArgs = {
  input: MarkCommentViewedInput;
};


export type CommentMutationsReplyArgs = {
  input: CreateCommentReplyInput;
};

export type CommentPermissionChecks = {
  __typename?: 'CommentPermissionChecks';
  canArchive: PermissionCheckResult;
};

export type CommentReplyAuthorCollection = {
  __typename?: 'CommentReplyAuthorCollection';
  items: Array<LimitedUser>;
  totalCount: Scalars['Int']['output'];
};

export type CommentThreadActivityMessage = {
  __typename?: 'CommentThreadActivityMessage';
  data?: Maybe<Scalars['JSONObject']['output']>;
  reply?: Maybe<Comment>;
  type: Scalars['String']['output'];
};

export type Commit = {
  __typename?: 'Commit';
  /**
   * All the recent activity on this commit in chronological order
   * @deprecated Part of the old API surface and will be removed in the future.
   */
  activity?: Maybe<ActivityCollection>;
  authorAvatar?: Maybe<Scalars['String']['output']>;
  authorId?: Maybe<Scalars['String']['output']>;
  authorName?: Maybe<Scalars['String']['output']>;
  branch?: Maybe<Branch>;
  branchName?: Maybe<Scalars['String']['output']>;
  /**
   * The total number of comments for this commit. To actually get the comments, use the comments query and pass in a resource array consisting of of this commit's id.
   * E.g.,
   * ```
   * query{
   *   comments(streamId:"streamId" resources:[{resourceType: commit, resourceId:"commitId"}] ){
   *     ...
   *   }
   * ```
   * @deprecated Part of the old API surface and will be removed in the future.
   */
  commentCount: Scalars['Int']['output'];
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['String']['output'];
  message?: Maybe<Scalars['String']['output']>;
  parents?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  referencedObject: Scalars['String']['output'];
  sourceApplication?: Maybe<Scalars['String']['output']>;
  /**
   * Will throw an authorization error if active user isn't authorized to see it, for example,
   * if a stream isn't public and the user doesn't have the appropriate rights.
   */
  stream: Stream;
  /** @deprecated Use the stream field instead */
  streamId?: Maybe<Scalars['String']['output']>;
  /** @deprecated Use the stream field instead */
  streamName?: Maybe<Scalars['String']['output']>;
  totalChildrenCount?: Maybe<Scalars['Int']['output']>;
};


export type CommitActivityArgs = {
  actionType?: InputMaybe<Scalars['String']['input']>;
  after?: InputMaybe<Scalars['DateTime']['input']>;
  before?: InputMaybe<Scalars['DateTime']['input']>;
  cursor?: InputMaybe<Scalars['DateTime']['input']>;
  limit?: Scalars['Int']['input'];
};

export type CommitCollection = {
  __typename?: 'CommitCollection';
  cursor?: Maybe<Scalars['String']['output']>;
  items?: Maybe<Array<Commit>>;
  totalCount: Scalars['Int']['output'];
};

export type CommitCreateInput = {
  branchName: Scalars['String']['input'];
  message?: InputMaybe<Scalars['String']['input']>;
  objectId: Scalars['String']['input'];
  parents?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  /**
   * **DEPRECATED** Use the `parents` field.
   * @deprecated Field no longer supported
   */
  previousCommitIds?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  sourceApplication?: InputMaybe<Scalars['String']['input']>;
  streamId: Scalars['String']['input'];
  totalChildrenCount?: InputMaybe<Scalars['Int']['input']>;
};

export type CommitDeleteInput = {
  id: Scalars['String']['input'];
  streamId: Scalars['String']['input'];
};

export type CommitReceivedInput = {
  commitId: Scalars['String']['input'];
  message?: InputMaybe<Scalars['String']['input']>;
  sourceApplication: Scalars['String']['input'];
  streamId: Scalars['String']['input'];
};

export type CommitUpdateInput = {
  id: Scalars['String']['input'];
  message?: InputMaybe<Scalars['String']['input']>;
  /** To move the commit to a different branch, please the name of the branch. */
  newBranchName?: InputMaybe<Scalars['String']['input']>;
  streamId: Scalars['String']['input'];
};

export type CommitsDeleteInput = {
  commitIds: Array<Scalars['String']['input']>;
  streamId: Scalars['ID']['input'];
};

export type CommitsMoveInput = {
  commitIds: Array<Scalars['String']['input']>;
  streamId: Scalars['ID']['input'];
  targetBranch: Scalars['String']['input'];
};

/**
 * Can be used instead of a full item collection, when the implementation doesn't call for it yet. Because
 * of the structure, it can be swapped out to a full item collection in the future
 */
export type CountOnlyCollection = {
  __typename?: 'CountOnlyCollection';
  totalCount: Scalars['Int']['output'];
};

export type CreateAutomateFunctionInput = {
  description: Scalars['String']['input'];
  /** Base64 encoded image data string */
  logo?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  /** GitHub organization to create the repository in */
  org?: InputMaybe<Scalars['String']['input']>;
  /** SourceAppNames values from @speckle/shared */
  supportedSourceApps: Array<Scalars['String']['input']>;
  tags: Array<Scalars['String']['input']>;
  template: AutomateFunctionTemplateLanguage;
};

export type CreateAutomateFunctionWithoutVersionInput = {
  description: Scalars['String']['input'];
  name: Scalars['String']['input'];
};

export type CreateCommentInput = {
  content: CommentContentInput;
  projectId: Scalars['String']['input'];
  /** Resources that this comment should be attached to */
  resourceIdString: Scalars['String']['input'];
  screenshot?: InputMaybe<Scalars['String']['input']>;
  /**
   * SerializedViewerState. If omitted, comment won't render (correctly) inside the
   * viewer, but will still be retrievable through the API
   */
  viewerState?: InputMaybe<Scalars['JSONObject']['input']>;
};

export type CreateCommentReplyInput = {
  content: CommentContentInput;
  projectId: Scalars['String']['input'];
  threadId: Scalars['String']['input'];
};

export type CreateEmbedTokenReturn = {
  __typename?: 'CreateEmbedTokenReturn';
  token: Scalars['String']['output'];
  tokenMetadata: EmbedToken;
};

export type CreateModelInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  projectId: Scalars['ID']['input'];
};

export type CreateServerRegionInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  key: Scalars['String']['input'];
  name: Scalars['String']['input'];
};

export type CreateUserEmailInput = {
  email: Scalars['String']['input'];
};

export type CreateVersionInput = {
  message?: InputMaybe<Scalars['String']['input']>;
  modelId: Scalars['String']['input'];
  objectId: Scalars['String']['input'];
  parents?: InputMaybe<Array<Scalars['String']['input']>>;
  projectId: Scalars['String']['input'];
  sourceApplication?: InputMaybe<Scalars['String']['input']>;
  totalChildrenCount?: InputMaybe<Scalars['Int']['input']>;
};

export const Currency = {
  Gbp: 'gbp',
  Usd: 'usd'
} as const;

export type Currency = typeof Currency[keyof typeof Currency];
export type CurrencyBasedPrices = {
  __typename?: 'CurrencyBasedPrices';
  gbp: WorkspacePaidPlanPrices;
  usd: WorkspacePaidPlanPrices;
};

export type DeleteModelInput = {
  id: Scalars['ID']['input'];
  projectId: Scalars['ID']['input'];
};

export type DeleteUserEmailInput = {
  id: Scalars['ID']['input'];
};

export type DeleteVersionsInput = {
  projectId: Scalars['ID']['input'];
  versionIds: Array<Scalars['ID']['input']>;
};

export type DenyWorkspaceJoinRequestInput = {
  userId: Scalars['String']['input'];
  workspaceId: Scalars['String']['input'];
};

export const DiscoverableStreamsSortType = {
  CreatedDate: 'CREATED_DATE',
  FavoritesCount: 'FAVORITES_COUNT'
} as const;

export type DiscoverableStreamsSortType = typeof DiscoverableStreamsSortType[keyof typeof DiscoverableStreamsSortType];
export type DiscoverableStreamsSortingInput = {
  direction: SortDirection;
  type: DiscoverableStreamsSortType;
};

export type EditCommentInput = {
  commentId: Scalars['String']['input'];
  content: CommentContentInput;
  projectId: Scalars['String']['input'];
};

export type EmailVerificationRequestInput = {
  id: Scalars['ID']['input'];
};

/** A token used to enable an embedded viewer for a private project */
export type EmbedToken = {
  __typename?: 'EmbedToken';
  createdAt: Scalars['DateTime']['output'];
  lastUsed: Scalars['DateTime']['output'];
  lifespan: Scalars['BigInt']['output'];
  projectId: Scalars['String']['output'];
  resourceIdString: Scalars['String']['output'];
  tokenId: Scalars['String']['output'];
  user?: Maybe<LimitedUser>;
};

export type EmbedTokenCollection = {
  __typename?: 'EmbedTokenCollection';
  cursor?: Maybe<Scalars['String']['output']>;
  items: Array<EmbedToken>;
  totalCount: Scalars['Int']['output'];
};

export type EmbedTokenCreateInput = {
  lifespan?: InputMaybe<Scalars['BigInt']['input']>;
  projectId: Scalars['String']['input'];
  /** The model(s) and version(s) string used in the embed url */
  resourceIdString: Scalars['String']['input'];
};

export type FileUpload = {
  __typename?: 'FileUpload';
  branchName: Scalars['String']['output'];
  /** If present, the conversion result is stored in this commit. */
  convertedCommitId?: Maybe<Scalars['String']['output']>;
  convertedLastUpdate: Scalars['DateTime']['output'];
  /** Holds any errors or info. */
  convertedMessage?: Maybe<Scalars['String']['output']>;
  /** 0 = queued, 1 = processing, 2 = success, 3 = error */
  convertedStatus: Scalars['Int']['output'];
  /** Alias for convertedCommitId */
  convertedVersionId?: Maybe<Scalars['String']['output']>;
  fileName: Scalars['String']['output'];
  fileSize: Scalars['Int']['output'];
  fileType: Scalars['String']['output'];
  id: Scalars['String']['output'];
  /** Model associated with the file upload, if it exists already */
  model?: Maybe<Model>;
  modelId?: Maybe<Scalars['String']['output']>;
  /** Alias for branchName */
  modelName: Scalars['String']['output'];
  /** Alias for streamId */
  projectId: Scalars['String']['output'];
  streamId: Scalars['String']['output'];
  /** Date when upload was last updated */
  updatedAt: Scalars['DateTime']['output'];
  uploadComplete: Scalars['Boolean']['output'];
  uploadDate: Scalars['DateTime']['output'];
  /** The user's id that uploaded this file. */
  userId: Scalars['String']['output'];
};

export type FileUploadCollection = {
  __typename?: 'FileUploadCollection';
  cursor?: Maybe<Scalars['String']['output']>;
  items: Array<FileUpload>;
  totalCount: Scalars['Int']['output'];
};

export type FileUploadMutations = {
  __typename?: 'FileUploadMutations';
  /**
   * Generate a pre-signed url to which a file can be uploaded.
   * After uploading the file, call mutation startFileImport to register the completed upload.
   */
  generateUploadUrl: GenerateFileUploadUrlOutput;
  /**
   * Before calling this mutation, call generateUploadUrl to get the
   * pre-signed url and blobId. Then upload the file to that url.
   * Once the upload to the pre-signed url is completed, this mutation should be
   * called to register the completed upload and create the blob metadata.
   */
  startFileImport: FileUpload;
};


export type FileUploadMutationsGenerateUploadUrlArgs = {
  input: GenerateFileUploadUrlInput;
};


export type FileUploadMutationsStartFileImportArgs = {
  input: StartFileImportInput;
};

export type GendoAiRender = {
  __typename?: 'GendoAIRender';
  camera?: Maybe<Scalars['JSONObject']['output']>;
  createdAt: Scalars['DateTime']['output'];
  gendoGenerationId?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  modelId: Scalars['String']['output'];
  projectId: Scalars['String']['output'];
  prompt: Scalars['String']['output'];
  /** This is a blob id. */
  responseImage?: Maybe<Scalars['String']['output']>;
  status: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  user?: Maybe<LimitedUser>;
  userId: Scalars['String']['output'];
  versionId: Scalars['String']['output'];
};

export type GendoAiRenderCollection = {
  __typename?: 'GendoAIRenderCollection';
  items: Array<Maybe<GendoAiRender>>;
  totalCount: Scalars['Int']['output'];
};

export type GendoAiRenderInput = {
  /** Base64 encoded image of the depthmap. */
  baseImage: Scalars['String']['input'];
  camera: Scalars['JSONObject']['input'];
  modelId: Scalars['ID']['input'];
  projectId: Scalars['ID']['input'];
  /** The generation prompt. */
  prompt: Scalars['String']['input'];
  versionId: Scalars['ID']['input'];
};

export type GenerateFileUploadUrlInput = {
  fileName: Scalars['String']['input'];
  projectId: Scalars['String']['input'];
};

export type GenerateFileUploadUrlOutput = {
  __typename?: 'GenerateFileUploadUrlOutput';
  fileId: Scalars['String']['output'];
  url: Scalars['String']['output'];
};

export type GetModelUploadsInput = {
  /** The cursor for pagination. */
  cursor?: InputMaybe<Scalars['String']['input']>;
  /** The maximum number of uploads to return. */
  limit?: InputMaybe<Scalars['Int']['input']>;
};

export type InvitableCollaboratorsFilter = {
  search?: InputMaybe<Scalars['String']['input']>;
};

export type JoinWorkspaceInput = {
  workspaceId: Scalars['ID']['input'];
};

export type LegacyCommentViewerData = {
  __typename?: 'LegacyCommentViewerData';
  /**
   * An array representing a user's camera position:
   * [camPos.x, camPos.y, camPos.z, camTarget.x, camTarget.y, camTarget.z, isOrtho, zoomNumber]
   */
  camPos: Array<Scalars['Float']['output']>;
  /** Old FE LocalFilterState type */
  filters: CommentDataFilters;
  /** THREE.Vector3 {x, y, z} */
  location: Scalars['JSONObject']['output'];
  /** Viewer.getCurrentSectionBox(): THREE.Box3 */
  sectionBox?: Maybe<Scalars['JSONObject']['output']>;
  /** Currently unused. Ideally comments should keep track of selected objects. */
  selection?: Maybe<Scalars['JSONObject']['output']>;
};

/**
 * Limited user type, for showing public info about a user
 * to another user
 */
export type LimitedUser = {
  __typename?: 'LimitedUser';
  /**
   * All the recent activity from this user in chronological order
   * @deprecated Part of the old API surface and will be removed in the future.
   */
  activity?: Maybe<ActivityCollection>;
  avatar?: Maybe<Scalars['String']['output']>;
  bio?: Maybe<Scalars['String']['output']>;
  /**
   * Get public stream commits authored by the user
   * @deprecated Part of the old API surface and will be removed in the future.
   */
  commits?: Maybe<CommitCollection>;
  company?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  role?: Maybe<Scalars['String']['output']>;
  /**
   * Returns all discoverable streams that the user is a collaborator on
   * @deprecated Part of the old API surface and will be removed in the future.
   */
  streams: UserStreamCollection;
  /**
   * The user's timeline in chronological order
   * @deprecated Part of the old API surface and will be removed in the future.
   */
  timeline?: Maybe<ActivityCollection>;
  /**
   * Total amount of favorites attached to streams owned by the user
   * @deprecated Part of the old API surface and will be removed in the future.
   */
  totalOwnedStreamsFavorites: Scalars['Int']['output'];
  verified?: Maybe<Scalars['Boolean']['output']>;
  workspaceDomainPolicyCompliant?: Maybe<Scalars['Boolean']['output']>;
  workspaceRole?: Maybe<Scalars['String']['output']>;
};


/**
 * Limited user type, for showing public info about a user
 * to another user
 */
export type LimitedUserActivityArgs = {
  actionType?: InputMaybe<Scalars['String']['input']>;
  after?: InputMaybe<Scalars['DateTime']['input']>;
  before?: InputMaybe<Scalars['DateTime']['input']>;
  cursor?: InputMaybe<Scalars['DateTime']['input']>;
  limit?: Scalars['Int']['input'];
};


/**
 * Limited user type, for showing public info about a user
 * to another user
 */
export type LimitedUserCommitsArgs = {
  cursor?: InputMaybe<Scalars['String']['input']>;
  limit?: Scalars['Int']['input'];
};


/**
 * Limited user type, for showing public info about a user
 * to another user
 */
export type LimitedUserStreamsArgs = {
  cursor?: InputMaybe<Scalars['String']['input']>;
  limit?: Scalars['Int']['input'];
};


/**
 * Limited user type, for showing public info about a user
 * to another user
 */
export type LimitedUserTimelineArgs = {
  after?: InputMaybe<Scalars['DateTime']['input']>;
  before?: InputMaybe<Scalars['DateTime']['input']>;
  cursor?: InputMaybe<Scalars['DateTime']['input']>;
  limit?: Scalars['Int']['input'];
};


/**
 * Limited user type, for showing public info about a user
 * to another user
 */
export type LimitedUserWorkspaceDomainPolicyCompliantArgs = {
  workspaceSlug?: InputMaybe<Scalars['String']['input']>;
};


/**
 * Limited user type, for showing public info about a user
 * to another user
 */
export type LimitedUserWorkspaceRoleArgs = {
  workspaceId?: InputMaybe<Scalars['String']['input']>;
};

/** Workspace metadata visible to non-workspace members. */
export type LimitedWorkspace = {
  __typename?: 'LimitedWorkspace';
  /** Workspace admins ordered by join date */
  adminTeam: Array<LimitedWorkspaceCollaborator>;
  /** Workspace description */
  description?: Maybe<Scalars['String']['output']>;
  /** If true, the users with a matching domain may join the workspace directly */
  discoverabilityAutoJoinEnabled: Scalars['Boolean']['output'];
  /** Workspace id */
  id: Scalars['ID']['output'];
  /** Optional base64 encoded workspace logo image */
  logo?: Maybe<Scalars['String']['output']>;
  /** Workspace name */
  name: Scalars['String']['output'];
  /** Unique workspace short id. Used for navigation. */
  slug: Scalars['String']['output'];
  /** Workspace members visible to people with verified email domain */
  team?: Maybe<LimitedWorkspaceCollaboratorCollection>;
};


/** Workspace metadata visible to non-workspace members. */
export type LimitedWorkspaceTeamArgs = {
  cursor?: InputMaybe<Scalars['String']['input']>;
  limit?: Scalars['Int']['input'];
};

export type LimitedWorkspaceCollaborator = {
  __typename?: 'LimitedWorkspaceCollaborator';
  user: LimitedUser;
};

export type LimitedWorkspaceCollaboratorCollection = {
  __typename?: 'LimitedWorkspaceCollaboratorCollection';
  cursor?: Maybe<Scalars['String']['output']>;
  items: Array<LimitedWorkspaceCollaborator>;
  totalCount: Scalars['Int']['output'];
};

export type LimitedWorkspaceJoinRequest = {
  __typename?: 'LimitedWorkspaceJoinRequest';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['String']['output'];
  status: WorkspaceJoinRequestStatus;
  user: LimitedUser;
  workspace: LimitedWorkspace;
};

export type LimitedWorkspaceJoinRequestCollection = {
  __typename?: 'LimitedWorkspaceJoinRequestCollection';
  cursor?: Maybe<Scalars['String']['output']>;
  items: Array<LimitedWorkspaceJoinRequest>;
  totalCount: Scalars['Int']['output'];
};

export type MarkCommentViewedInput = {
  commentId: Scalars['String']['input'];
  projectId: Scalars['String']['input'];
};

export type MarkReceivedVersionInput = {
  message?: InputMaybe<Scalars['String']['input']>;
  projectId: Scalars['String']['input'];
  sourceApplication: Scalars['String']['input'];
  versionId: Scalars['String']['input'];
};

export type Model = {
  __typename?: 'Model';
  author?: Maybe<LimitedUser>;
  automationsStatus?: Maybe<TriggeredAutomationsStatus>;
  /** Return a model tree of children */
  childrenTree: Array<ModelsTreeItem>;
  /** All comment threads in this model */
  commentThreads: CommentCollection;
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  /** The shortened/display name that doesn't include the names of parent models */
  displayName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  /** Full name including the names of parent models delimited by forward slashes */
  name: Scalars['String']['output'];
  /** Returns a list of versions that are being created from a file import */
  pendingImportedVersions: Array<FileUpload>;
  permissions: ModelPermissionChecks;
  previewUrl?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  /** Get all file uploads ever done in this model */
  uploads: FileUploadCollection;
  version: Version;
  versions: VersionCollection;
};


export type ModelCommentThreadsArgs = {
  cursor?: InputMaybe<Scalars['String']['input']>;
  limit?: Scalars['Int']['input'];
};


export type ModelPendingImportedVersionsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type ModelUploadsArgs = {
  input?: InputMaybe<GetModelUploadsInput>;
};


export type ModelVersionArgs = {
  id: Scalars['String']['input'];
};


export type ModelVersionsArgs = {
  cursor?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<ModelVersionsFilter>;
  limit?: Scalars['Int']['input'];
};

export type ModelCollection = {
  __typename?: 'ModelCollection';
  cursor?: Maybe<Scalars['String']['output']>;
  items: Array<Model>;
  totalCount: Scalars['Int']['output'];
};

export type ModelMutations = {
  __typename?: 'ModelMutations';
  create: Model;
  delete: Scalars['Boolean']['output'];
  update: Model;
};


export type ModelMutationsCreateArgs = {
  input: CreateModelInput;
};


export type ModelMutationsDeleteArgs = {
  input: DeleteModelInput;
};


export type ModelMutationsUpdateArgs = {
  input: UpdateModelInput;
};

export type ModelPermissionChecks = {
  __typename?: 'ModelPermissionChecks';
  canCreateVersion: PermissionCheckResult;
  canDelete: PermissionCheckResult;
  canUpdate: PermissionCheckResult;
};

export type ModelVersionsFilter = {
  /** Make sure these specified versions are always loaded first */
  priorityIds?: InputMaybe<Array<Scalars['String']['input']>>;
  /** Only return versions specified in `priorityIds` */
  priorityIdsOnly?: InputMaybe<Scalars['Boolean']['input']>;
};

export type ModelsTreeItem = {
  __typename?: 'ModelsTreeItem';
  children: Array<ModelsTreeItem>;
  fullName: Scalars['String']['output'];
  /** Whether or not this item has nested children models */
  hasChildren: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  /**
   * Nullable cause the item can represent a parent that doesn't actually exist as a model on its own.
   * E.g. A model named "foo/bar" is supposed to be a child of "foo" and will be represented as such,
   * even if "foo" doesn't exist as its own model.
   */
  model?: Maybe<Model>;
  name: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type ModelsTreeItemCollection = {
  __typename?: 'ModelsTreeItemCollection';
  cursor?: Maybe<Scalars['String']['output']>;
  items: Array<ModelsTreeItem>;
  totalCount: Scalars['Int']['output'];
};

export type MoveVersionsInput = {
  projectId: Scalars['ID']['input'];
  /** If the name references a nonexistant model, it will be created */
  targetModelName: Scalars['String']['input'];
  versionIds: Array<Scalars['ID']['input']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  /** The void stares back. */
  _?: Maybe<Scalars['String']['output']>;
  /** Various Active User oriented mutations */
  activeUserMutations: ActiveUserMutations;
  admin: AdminMutations;
  adminDeleteUser: Scalars['Boolean']['output'];
  /** Creates an personal api token. */
  apiTokenCreate: Scalars['String']['output'];
  /** Revokes (deletes) an personal api token/app token. */
  apiTokenRevoke: Scalars['Boolean']['output'];
  /** Register a new third party application. */
  appCreate: Scalars['String']['output'];
  /** Deletes a thirty party application. */
  appDelete: Scalars['Boolean']['output'];
  /** Revokes (de-authorizes) an application that you have previously authorized. */
  appRevokeAccess?: Maybe<Scalars['Boolean']['output']>;
  /** Create an app token. Only apps can create app tokens and they don't show up under personal access tokens. */
  appTokenCreate: Scalars['String']['output'];
  /** Update an existing third party application. **Note: This will invalidate all existing tokens, refresh tokens and access codes and will require existing users to re-authorize it.** */
  appUpdate: Scalars['Boolean']['output'];
  automateFunctionRunStatusReport: Scalars['Boolean']['output'];
  automateMutations: AutomateMutations;
  /** @deprecated Part of the old API surface and will be removed in the future. Use ModelMutations.create instead. */
  branchCreate: Scalars['String']['output'];
  /** @deprecated Part of the old API surface and will be removed in the future. Use ModelMutations.delete instead. */
  branchDelete: Scalars['Boolean']['output'];
  /** @deprecated Part of the old API surface and will be removed in the future. Use ModelMutations.update instead. */
  branchUpdate: Scalars['Boolean']['output'];
  /** Broadcast user activity in the viewer */
  broadcastViewerUserActivity: Scalars['Boolean']['output'];
  /**
   * Archives a comment.
   * @deprecated Use commentMutations version
   */
  commentArchive: Scalars['Boolean']['output'];
  /**
   * Creates a comment
   * @deprecated Use commentMutations version
   */
  commentCreate: Scalars['String']['output'];
  /**
   * Edits a comment.
   * @deprecated Use commentMutations version
   */
  commentEdit: Scalars['Boolean']['output'];
  commentMutations: CommentMutations;
  /**
   * Adds a reply to a comment.
   * @deprecated Use commentMutations version
   */
  commentReply: Scalars['String']['output'];
  /**
   * Flags a comment as viewed by you (the logged in user).
   * @deprecated Use commentMutations version
   */
  commentView: Scalars['Boolean']['output'];
  /** @deprecated Part of the old API surface and will be removed in the future. Use VersionMutations.create instead. */
  commitCreate: Scalars['String']['output'];
  /** @deprecated Part of the old API surface and will be removed in the future. Use VersionMutations.delete instead. */
  commitDelete: Scalars['Boolean']['output'];
  /** @deprecated Part of the old API surface and will be removed in the future. Use VersionMutations.markReceived instead. */
  commitReceive: Scalars['Boolean']['output'];
  /** @deprecated Part of the old API surface and will be removed in the future. Use VersionMutations.update/moveToModel instead. */
  commitUpdate: Scalars['Boolean']['output'];
  /**
   * Delete a batch of commits
   * @deprecated Part of the old API surface and will be removed in the future. Use VersionMutations.delete instead.
   */
  commitsDelete: Scalars['Boolean']['output'];
  /**
   * Move a batch of commits to a new branch
   * @deprecated Part of the old API surface and will be removed in the future. Use VersionMutations.moveToModel instead.
   */
  commitsMove: Scalars['Boolean']['output'];
  fileUploadMutations: FileUploadMutations;
  /**
   * Delete a pending invite
   * Note: The required scope to invoke this is not given out to app or personal access tokens
   */
  inviteDelete: Scalars['Boolean']['output'];
  /**
   * Re-send a pending invite
   * Note: The required scope to invoke this is not given out to app or personal access tokens
   */
  inviteResend: Scalars['Boolean']['output'];
  modelMutations: ModelMutations;
  /** @deprecated Part of the old API surface and will be removed in the future. */
  objectCreate: Array<Scalars['String']['output']>;
  projectMutations: ProjectMutations;
  /** (Re-)send the account verification e-mail */
  requestVerification: Scalars['Boolean']['output'];
  requestVerificationByEmail: Scalars['Boolean']['output'];
  serverInfoMutations: ServerInfoMutations;
  serverInfoUpdate?: Maybe<Scalars['Boolean']['output']>;
  /** Note: The required scope to invoke this is not given out to app or personal access tokens */
  serverInviteBatchCreate: Scalars['Boolean']['output'];
  /** Invite a new user to the speckle server and return the invite ID */
  serverInviteCreate: Scalars['Boolean']['output'];
  /**
   * Request access to a specific stream
   * @deprecated Part of the old API surface and will be removed in the future. Use ProjectAccessRequestMutations.create instead.
   */
  streamAccessRequestCreate: StreamAccessRequest;
  /**
   * Accept or decline a stream access request. Must be a stream owner to invoke this.
   * @deprecated Part of the old API surface and will be removed in the future. Use ProjectAccessRequestMutations.use instead.
   */
  streamAccessRequestUse: Scalars['Boolean']['output'];
  /**
   * Creates a new stream.
   * @deprecated Part of the old API surface and will be removed in the future. Use ProjectMutations.create instead.
   */
  streamCreate?: Maybe<Scalars['String']['output']>;
  /**
   * Deletes an existing stream.
   * @deprecated Part of the old API surface and will be removed in the future. Use ProjectMutations.delete instead.
   */
  streamDelete: Scalars['Boolean']['output'];
  /** @deprecated Part of the old API surface and will be removed in the future. */
  streamFavorite?: Maybe<Stream>;
  /**
   * Note: The required scope to invoke this is not given out to app or personal access tokens
   * @deprecated Part of the old API surface and will be removed in the future. Use ProjectInviteMutations.batchCreate instead.
   */
  streamInviteBatchCreate: Scalars['Boolean']['output'];
  /**
   * Cancel a pending stream invite. Can only be invoked by a stream owner.
   * Note: The required scope to invoke this is not given out to app or personal access tokens
   * @deprecated Part of the old API surface and will be removed in the future. Use ProjectInviteMutations.cancel instead.
   */
  streamInviteCancel: Scalars['Boolean']['output'];
  /**
   * Invite a new or registered user to the specified stream
   * Note: The required scope to invoke this is not given out to app or personal access tokens
   * @deprecated Part of the old API surface and will be removed in the future. Use ProjectInviteMutations.create instead.
   */
  streamInviteCreate: Scalars['Boolean']['output'];
  /**
   * Accept or decline a stream invite
   * @deprecated Part of the old API surface and will be removed in the future. Use ProjectInviteMutations.use instead.
   */
  streamInviteUse: Scalars['Boolean']['output'];
  /**
   * Remove yourself from stream collaborators (not possible for the owner)
   * @deprecated Part of the old API surface and will be removed in the future. Use ProjectMutations.leave instead.
   */
  streamLeave: Scalars['Boolean']['output'];
  /**
   * Revokes the permissions of a user on a given stream.
   * @deprecated Part of the old API surface and will be removed in the future. Use ProjectMutations.updateRole instead.
   */
  streamRevokePermission?: Maybe<Scalars['Boolean']['output']>;
  /**
   * Updates an existing stream.
   * @deprecated Part of the old API surface and will be removed in the future. Use ProjectMutations.update instead.
   */
  streamUpdate: Scalars['Boolean']['output'];
  /**
   * Update permissions of a user on a given stream.
   * @deprecated Part of the old API surface and will be removed in the future. Use ProjectMutations.updateRole instead.
   */
  streamUpdatePermission?: Maybe<Scalars['Boolean']['output']>;
  /** @deprecated Part of the old API surface and will be removed in the future. Use ProjectMutations.batchDelete instead. */
  streamsDelete: Scalars['Boolean']['output'];
  /**
   * Used for broadcasting real time typing status in comment threads. Does not persist any info.
   * @deprecated Use broadcastViewerUserActivity
   */
  userCommentThreadActivityBroadcast: Scalars['Boolean']['output'];
  /** Delete a user's account. */
  userDelete: Scalars['Boolean']['output'];
  userNotificationPreferencesUpdate?: Maybe<Scalars['Boolean']['output']>;
  userRoleChange: Scalars['Boolean']['output'];
  /**
   * Edits a user's profile.
   * @deprecated Use activeUserMutations version
   */
  userUpdate: Scalars['Boolean']['output'];
  /**
   * Used for broadcasting real time chat head bubbles and status. Does not persist any info.
   * @deprecated Use broadcastViewerUserActivity
   */
  userViewerActivityBroadcast: Scalars['Boolean']['output'];
  versionMutations: VersionMutations;
  /** Creates a new webhook on a stream */
  webhookCreate: Scalars['String']['output'];
  /** Deletes an existing webhook */
  webhookDelete: Scalars['String']['output'];
  /** Updates an existing webhook */
  webhookUpdate: Scalars['String']['output'];
  workspaceJoinRequestMutations: WorkspaceJoinRequestMutations;
  workspaceMutations: WorkspaceMutations;
};


export type MutationAdminDeleteUserArgs = {
  userConfirmation: UserDeleteInput;
};


export type MutationApiTokenCreateArgs = {
  token: ApiTokenCreateInput;
};


export type MutationApiTokenRevokeArgs = {
  token: Scalars['String']['input'];
};


export type MutationAppCreateArgs = {
  app: AppCreateInput;
};


export type MutationAppDeleteArgs = {
  appId: Scalars['String']['input'];
};


export type MutationAppRevokeAccessArgs = {
  appId: Scalars['String']['input'];
};


export type MutationAppTokenCreateArgs = {
  token: AppTokenCreateInput;
};


export type MutationAppUpdateArgs = {
  app: AppUpdateInput;
};


export type MutationAutomateFunctionRunStatusReportArgs = {
  input: AutomateFunctionRunStatusReportInput;
};


export type MutationBranchCreateArgs = {
  branch: BranchCreateInput;
};


export type MutationBranchDeleteArgs = {
  branch: BranchDeleteInput;
};


export type MutationBranchUpdateArgs = {
  branch: BranchUpdateInput;
};


export type MutationBroadcastViewerUserActivityArgs = {
  message: ViewerUserActivityMessageInput;
  projectId: Scalars['String']['input'];
  resourceIdString: Scalars['String']['input'];
};


export type MutationCommentArchiveArgs = {
  archived?: Scalars['Boolean']['input'];
  commentId: Scalars['String']['input'];
  streamId: Scalars['String']['input'];
};


export type MutationCommentCreateArgs = {
  input: CommentCreateInput;
};


export type MutationCommentEditArgs = {
  input: CommentEditInput;
};


export type MutationCommentReplyArgs = {
  input: ReplyCreateInput;
};


export type MutationCommentViewArgs = {
  commentId: Scalars['String']['input'];
  streamId: Scalars['String']['input'];
};


export type MutationCommitCreateArgs = {
  commit: CommitCreateInput;
};


export type MutationCommitDeleteArgs = {
  commit: CommitDeleteInput;
};


export type MutationCommitReceiveArgs = {
  input: CommitReceivedInput;
};


export type MutationCommitUpdateArgs = {
  commit: CommitUpdateInput;
};


export type MutationCommitsDeleteArgs = {
  input: CommitsDeleteInput;
};


export type MutationCommitsMoveArgs = {
  input: CommitsMoveInput;
};


export type MutationInviteDeleteArgs = {
  inviteId: Scalars['String']['input'];
};


export type MutationInviteResendArgs = {
  inviteId: Scalars['String']['input'];
};


export type MutationObjectCreateArgs = {
  objectInput: ObjectCreateInput;
};


export type MutationRequestVerificationByEmailArgs = {
  email: Scalars['String']['input'];
};


export type MutationServerInfoUpdateArgs = {
  info: ServerInfoUpdateInput;
};


export type MutationServerInviteBatchCreateArgs = {
  input: Array<ServerInviteCreateInput>;
};


export type MutationServerInviteCreateArgs = {
  input: ServerInviteCreateInput;
};


export type MutationStreamAccessRequestCreateArgs = {
  streamId: Scalars['String']['input'];
};


export type MutationStreamAccessRequestUseArgs = {
  accept: Scalars['Boolean']['input'];
  requestId: Scalars['String']['input'];
  role?: StreamRole;
};


export type MutationStreamCreateArgs = {
  stream: StreamCreateInput;
};


export type MutationStreamDeleteArgs = {
  id: Scalars['String']['input'];
};


export type MutationStreamFavoriteArgs = {
  favorited: Scalars['Boolean']['input'];
  streamId: Scalars['String']['input'];
};


export type MutationStreamInviteBatchCreateArgs = {
  input: Array<StreamInviteCreateInput>;
};


export type MutationStreamInviteCancelArgs = {
  inviteId: Scalars['String']['input'];
  streamId: Scalars['String']['input'];
};


export type MutationStreamInviteCreateArgs = {
  input: StreamInviteCreateInput;
};


export type MutationStreamInviteUseArgs = {
  accept: Scalars['Boolean']['input'];
  streamId: Scalars['String']['input'];
  token: Scalars['String']['input'];
};


export type MutationStreamLeaveArgs = {
  streamId: Scalars['String']['input'];
};


export type MutationStreamRevokePermissionArgs = {
  permissionParams: StreamRevokePermissionInput;
};


export type MutationStreamUpdateArgs = {
  stream: StreamUpdateInput;
};


export type MutationStreamUpdatePermissionArgs = {
  permissionParams: StreamUpdatePermissionInput;
};


export type MutationStreamsDeleteArgs = {
  ids?: InputMaybe<Array<Scalars['String']['input']>>;
};


export type MutationUserCommentThreadActivityBroadcastArgs = {
  commentId: Scalars['String']['input'];
  data?: InputMaybe<Scalars['JSONObject']['input']>;
  streamId: Scalars['String']['input'];
};


export type MutationUserDeleteArgs = {
  userConfirmation: UserDeleteInput;
};


export type MutationUserNotificationPreferencesUpdateArgs = {
  preferences: Scalars['JSONObject']['input'];
};


export type MutationUserRoleChangeArgs = {
  userRoleInput: UserRoleInput;
};


export type MutationUserUpdateArgs = {
  user: UserUpdateInput;
};


export type MutationUserViewerActivityBroadcastArgs = {
  data?: InputMaybe<Scalars['JSONObject']['input']>;
  resourceId: Scalars['String']['input'];
  streamId: Scalars['String']['input'];
};


export type MutationWebhookCreateArgs = {
  webhook: WebhookCreateInput;
};


export type MutationWebhookDeleteArgs = {
  webhook: WebhookDeleteInput;
};


export type MutationWebhookUpdateArgs = {
  webhook: WebhookUpdateInput;
};

export type Object = {
  __typename?: 'Object';
  /** @deprecated Not implemented. */
  applicationId?: Maybe<Scalars['String']['output']>;
  /**
   * Get any objects that this object references. In the case of commits, this will give you a commit's constituent objects.
   * **NOTE**: Providing any of the two last arguments ( `query`, `orderBy` ) will trigger a different code branch that executes a much more expensive SQL query. It is not recommended to do so for basic clients that are interested in purely getting all the objects of a given commit.
   */
  children: ObjectCollection;
  /**
   * The total number of comments for this commit. To actually get the comments, use the comments query and pass in a resource array consisting of of this object's id.
   * E.g.,
   * ```
   * query{
   *   comments(streamId:"streamId" resources:[{resourceType: object, resourceId:"objectId"}] ){
   *     ...
   *   }
   * ```
   * @deprecated Part of the old API surface and will be removed in the future.
   */
  commentCount: Scalars['Int']['output'];
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  /** The full object, with all its props & other things. **NOTE:** If you're requesting objects for the purpose of recreating & displaying, you probably only want to request this specific field. */
  data?: Maybe<Scalars['JSONObject']['output']>;
  id: Scalars['String']['output'];
  speckleType?: Maybe<Scalars['String']['output']>;
  totalChildrenCount?: Maybe<Scalars['Int']['output']>;
};


export type ObjectChildrenArgs = {
  cursor?: InputMaybe<Scalars['String']['input']>;
  depth?: Scalars['Int']['input'];
  limit?: Scalars['Int']['input'];
  orderBy?: InputMaybe<Scalars['JSONObject']['input']>;
  query?: InputMaybe<Array<Scalars['JSONObject']['input']>>;
  select?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type ObjectCollection = {
  __typename?: 'ObjectCollection';
  cursor?: Maybe<Scalars['String']['output']>;
  objects: Array<Object>;
  totalCount: Scalars['Int']['output'];
};

export type ObjectCreateInput = {
  /** The objects you want to create. */
  objects: Array<InputMaybe<Scalars['JSONObject']['input']>>;
  /** The stream against which these objects will be created. */
  streamId: Scalars['String']['input'];
};

export type OnboardingCompletionInput = {
  plans?: InputMaybe<Array<Scalars['String']['input']>>;
  role?: InputMaybe<Scalars['String']['input']>;
  source?: InputMaybe<Scalars['String']['input']>;
};

export const PaidWorkspacePlans = {
  Pro: 'pro',
  ProUnlimited: 'proUnlimited',
  Team: 'team',
  TeamUnlimited: 'teamUnlimited'
} as const;

export type PaidWorkspacePlans = typeof PaidWorkspacePlans[keyof typeof PaidWorkspacePlans];
export type PasswordStrengthCheckFeedback = {
  __typename?: 'PasswordStrengthCheckFeedback';
  suggestions: Array<Scalars['String']['output']>;
  warning?: Maybe<Scalars['String']['output']>;
};

export type PasswordStrengthCheckResults = {
  __typename?: 'PasswordStrengthCheckResults';
  /** Verbal feedback to help choose better passwords. set when score <= 2. */
  feedback: PasswordStrengthCheckFeedback;
  /**
   * Integer from 0-4 (useful for implementing a strength bar):
   * 0 too guessable: risky password. (guesses < 10^3)
   * 1 very guessable: protection from throttled online attacks. (guesses < 10^6)
   * 2 somewhat guessable: protection from unthrottled online attacks. (guesses < 10^8)
   * 3 safely unguessable: moderate protection from offline slow-hash scenario. (guesses < 10^10)
   * 4 very unguessable: strong protection from offline slow-hash scenario. (guesses >= 10^10)
   */
  score: Scalars['Int']['output'];
};

export type PendingStreamCollaborator = {
  __typename?: 'PendingStreamCollaborator';
  id: Scalars['String']['output'];
  inviteId: Scalars['String']['output'];
  invitedBy: LimitedUser;
  projectId: Scalars['String']['output'];
  projectName: Scalars['String']['output'];
  role: Scalars['String']['output'];
  /** @deprecated Use projectId instead */
  streamId: Scalars['String']['output'];
  /** @deprecated Use projectName instead */
  streamName: Scalars['String']['output'];
  /** E-mail address or name of the invited user */
  title: Scalars['String']['output'];
  /** Only available if the active user is the pending stream collaborator */
  token?: Maybe<Scalars['String']['output']>;
  /** Set only if user is registered */
  user?: Maybe<LimitedUser>;
  workspaceSlug?: Maybe<Scalars['String']['output']>;
};

export type PendingWorkspaceCollaborator = {
  __typename?: 'PendingWorkspaceCollaborator';
  /**
   * E-mail address if target is unregistered or primary e-mail of target registered user
   * if token was specified to retrieve this invite
   */
  email?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  inviteId: Scalars['String']['output'];
  invitedBy: LimitedUser;
  /** Target workspace role */
  role: Scalars['String']['output'];
  /** E-mail address or name of the invited user */
  title: Scalars['String']['output'];
  /**
   * Only available if the active user is the pending workspace collaborator or if it was already
   * specified when retrieving this invite
   */
  token?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  /** Set only if user is registered */
  user?: Maybe<LimitedUser>;
  workspace: LimitedWorkspace;
};

export type PendingWorkspaceCollaboratorsFilter = {
  search?: InputMaybe<Scalars['String']['input']>;
};

export type PermissionCheckResult = {
  __typename?: 'PermissionCheckResult';
  authorized: Scalars['Boolean']['output'];
  code: Scalars['String']['output'];
  message: Scalars['String']['output'];
  payload?: Maybe<Scalars['JSONObject']['output']>;
};

export type Price = {
  __typename?: 'Price';
  amount: Scalars['Float']['output'];
  currency: Scalars['String']['output'];
  currencySymbol: Scalars['String']['output'];
};

export type Project = {
  __typename?: 'Project';
  allowPublicComments: Scalars['Boolean']['output'];
  /** Get a single automation by id. Error will be thrown if automation is not found or inaccessible. */
  automation: Automation;
  automations: AutomationCollection;
  blob?: Maybe<BlobMetadata>;
  /** Get the metadata collection of blobs stored for this stream. */
  blobs?: Maybe<BlobMetadataCollection>;
  /** Get specific project comment/thread by ID */
  comment?: Maybe<Comment>;
  /** All comment threads in this project */
  commentThreads: ProjectCommentCollection;
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  /** Public project-level configuration for embedded viewer */
  embedOptions: ProjectEmbedOptions;
  embedTokens: EmbedTokenCollection;
  hasAccessToFeature: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  invitableCollaborators: WorkspaceCollaboratorCollection;
  /** Collaborators who have been invited, but not yet accepted. */
  invitedTeam?: Maybe<Array<PendingStreamCollaborator>>;
  /** Returns a specific model by its ID */
  model: Model;
  /** Retrieve a specific project model by its ID */
  modelByName: Model;
  /** Return a model tree of children for the specified model name */
  modelChildrenTree: Array<ModelsTreeItem>;
  /** Returns a flat list of all models */
  models: ModelCollection;
  /**
   * Return's a project's models in a tree view with submodels being nested under parent models
   * real or fake (e.g., with a foo/bar model, it will be nested under foo even if such a model doesn't actually exist)
   */
  modelsTree: ModelsTreeItemCollection;
  /** Returns information about the potential effects of moving a project to a given workspace. */
  moveToWorkspaceDryRun: ProjectMoveToWorkspaceDryRun;
  name: Scalars['String']['output'];
  object?: Maybe<Object>;
  /** Pending project access requests */
  pendingAccessRequests?: Maybe<Array<ProjectAccessRequest>>;
  /** Returns a list models that are being created from a file import */
  pendingImportedModels: Array<FileUpload>;
  permissions: ProjectPermissionChecks;
  /** Active user's role for this project. `null` if request is not authenticated, or the project is not explicitly shared with you. */
  role?: Maybe<Scalars['String']['output']>;
  /** Source apps used in any models of this project */
  sourceApps: Array<Scalars['String']['output']>;
  team: Array<ProjectCollaborator>;
  updatedAt: Scalars['DateTime']['output'];
  /** Retrieve a specific project version by its ID */
  version: Version;
  /** Returns a flat list of all project versions */
  versions: VersionCollection;
  /** Return metadata about resources being requested in the viewer */
  viewerResources: Array<ViewerResourceGroup>;
  visibility: ProjectVisibility;
  webhooks: WebhookCollection;
  workspace?: Maybe<Workspace>;
  workspaceId?: Maybe<Scalars['String']['output']>;
};


export type ProjectAutomationArgs = {
  id: Scalars['String']['input'];
};


export type ProjectAutomationsArgs = {
  cursor?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type ProjectBlobArgs = {
  id: Scalars['String']['input'];
};


export type ProjectBlobsArgs = {
  cursor?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
};


export type ProjectCommentArgs = {
  id: Scalars['String']['input'];
};


export type ProjectCommentThreadsArgs = {
  cursor?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<ProjectCommentsFilter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type ProjectEmbedTokensArgs = {
  cursor?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type ProjectHasAccessToFeatureArgs = {
  featureName: WorkspaceFeatureName;
};


export type ProjectInvitableCollaboratorsArgs = {
  cursor?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<InvitableCollaboratorsFilter>;
  limit?: Scalars['Int']['input'];
};


export type ProjectModelArgs = {
  id: Scalars['String']['input'];
};


export type ProjectModelByNameArgs = {
  name: Scalars['String']['input'];
};


export type ProjectModelChildrenTreeArgs = {
  fullName: Scalars['String']['input'];
};


export type ProjectModelsArgs = {
  cursor?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<ProjectModelsFilter>;
  limit?: Scalars['Int']['input'];
};


export type ProjectModelsTreeArgs = {
  cursor?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<ProjectModelsTreeFilter>;
  limit?: Scalars['Int']['input'];
};


export type ProjectMoveToWorkspaceDryRunArgs = {
  workspaceId: Scalars['String']['input'];
};


export type ProjectObjectArgs = {
  id: Scalars['String']['input'];
};


export type ProjectPendingImportedModelsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type ProjectVersionArgs = {
  id: Scalars['String']['input'];
};


export type ProjectVersionsArgs = {
  cursor?: InputMaybe<Scalars['String']['input']>;
  limit?: Scalars['Int']['input'];
};


export type ProjectViewerResourcesArgs = {
  loadedVersionsOnly?: InputMaybe<Scalars['Boolean']['input']>;
  resourceIdString: Scalars['String']['input'];
};


export type ProjectWebhooksArgs = {
  id?: InputMaybe<Scalars['String']['input']>;
};

/** Created when a user requests to become a contributor on a project */
export type ProjectAccessRequest = {
  __typename?: 'ProjectAccessRequest';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  /** Can only be selected if authed user has proper access */
  project: Project;
  projectId: Scalars['String']['output'];
  requester: LimitedUser;
  requesterId: Scalars['String']['output'];
};

export type ProjectAccessRequestMutations = {
  __typename?: 'ProjectAccessRequestMutations';
  /** Request access to a specific project */
  create: ProjectAccessRequest;
  /** Accept or decline a project access request. Must be a project owner to invoke this. */
  use: Project;
};


export type ProjectAccessRequestMutationsCreateArgs = {
  projectId: Scalars['String']['input'];
};


export type ProjectAccessRequestMutationsUseArgs = {
  accept: Scalars['Boolean']['input'];
  requestId: Scalars['String']['input'];
  role?: StreamRole;
};

export type ProjectAutomationCreateInput = {
  enabled: Scalars['Boolean']['input'];
  name: Scalars['String']['input'];
};

export type ProjectAutomationMutations = {
  __typename?: 'ProjectAutomationMutations';
  create: Automation;
  createRevision: AutomationRevision;
  createTestAutomation: Automation;
  createTestAutomationRun: TestAutomationRun;
  delete: Scalars['Boolean']['output'];
  /**
   * Trigger an automation with a fake "version created" trigger. The "version created" will
   * just refer to the last version of the model.
   */
  trigger: Scalars['String']['output'];
  update: Automation;
};


export type ProjectAutomationMutationsCreateArgs = {
  input: ProjectAutomationCreateInput;
};


export type ProjectAutomationMutationsCreateRevisionArgs = {
  input: ProjectAutomationRevisionCreateInput;
};


export type ProjectAutomationMutationsCreateTestAutomationArgs = {
  input: ProjectTestAutomationCreateInput;
};


export type ProjectAutomationMutationsCreateTestAutomationRunArgs = {
  automationId: Scalars['ID']['input'];
};


export type ProjectAutomationMutationsDeleteArgs = {
  automationId: Scalars['ID']['input'];
};


export type ProjectAutomationMutationsTriggerArgs = {
  automationId: Scalars['ID']['input'];
};


export type ProjectAutomationMutationsUpdateArgs = {
  input: ProjectAutomationUpdateInput;
};

export type ProjectAutomationRevisionCreateInput = {
  automationId: Scalars['ID']['input'];
  functions: Array<AutomationRevisionCreateFunctionInput>;
  /** AutomateTypes.TriggerDefinitionsSchema type from @speckle/shared */
  triggerDefinitions: Scalars['JSONObject']['input'];
};

export type ProjectAutomationUpdateInput = {
  enabled?: InputMaybe<Scalars['Boolean']['input']>;
  id: Scalars['ID']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
};

export type ProjectAutomationsUpdatedMessage = {
  __typename?: 'ProjectAutomationsUpdatedMessage';
  automation?: Maybe<Automation>;
  automationId: Scalars['String']['output'];
  /** Only set if type === CREATED_REVISION */
  revision?: Maybe<AutomationRevision>;
  type: ProjectAutomationsUpdatedMessageType;
};

export const ProjectAutomationsUpdatedMessageType = {
  Created: 'CREATED',
  CreatedRevision: 'CREATED_REVISION',
  Updated: 'UPDATED'
} as const;

export type ProjectAutomationsUpdatedMessageType = typeof ProjectAutomationsUpdatedMessageType[keyof typeof ProjectAutomationsUpdatedMessageType];
export type ProjectCollaborator = {
  __typename?: 'ProjectCollaborator';
  id: Scalars['ID']['output'];
  role: Scalars['String']['output'];
  /** The collaborator's workspace seat type for the workspace this project is in */
  seatType?: Maybe<WorkspaceSeatType>;
  user: LimitedUser;
  /** The collaborator's workspace role for the workspace this project is in, if any */
  workspaceRole?: Maybe<Scalars['String']['output']>;
};

export type ProjectCollection = {
  __typename?: 'ProjectCollection';
  cursor?: Maybe<Scalars['String']['output']>;
  items: Array<Project>;
  totalCount: Scalars['Int']['output'];
};

export type ProjectCommentCollection = {
  __typename?: 'ProjectCommentCollection';
  cursor?: Maybe<Scalars['String']['output']>;
  items: Array<Comment>;
  totalArchivedCount: Scalars['Int']['output'];
  totalCount: Scalars['Int']['output'];
};

export type ProjectCommentsFilter = {
  /** Whether or not to include archived/resolved threads */
  includeArchived?: InputMaybe<Scalars['Boolean']['input']>;
  /**
   * By default if resourceIdString is set, the "versionId" part of model resource identifiers will be ignored
   * and all comments of all versions of any of the referenced models will be returned. If `loadedVersionsOnly` is
   * enabled, then only comment threads of loaded/referenced versions in resourceIdString will be returned.
   */
  loadedVersionsOnly?: InputMaybe<Scalars['Boolean']['input']>;
  /**
   * Only request comments belonging to the resources identified by this
   * comma-delimited resouce string (same format that's used in the viewer URL)
   */
  resourceIdString?: InputMaybe<Scalars['String']['input']>;
};

export type ProjectCommentsUpdatedMessage = {
  __typename?: 'ProjectCommentsUpdatedMessage';
  /** Null if deleted */
  comment?: Maybe<Comment>;
  id: Scalars['String']['output'];
  type: ProjectCommentsUpdatedMessageType;
};

export const ProjectCommentsUpdatedMessageType = {
  Archived: 'ARCHIVED',
  Created: 'CREATED',
  Updated: 'UPDATED'
} as const;

export type ProjectCommentsUpdatedMessageType = typeof ProjectCommentsUpdatedMessageType[keyof typeof ProjectCommentsUpdatedMessageType];
/** Any values left null will be ignored */
export type ProjectCreateInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  visibility?: InputMaybe<ProjectVisibility>;
};

export type ProjectEmbedOptions = {
  __typename?: 'ProjectEmbedOptions';
  hideSpeckleBranding: Scalars['Boolean']['output'];
};

export type ProjectFileImportUpdatedMessage = {
  __typename?: 'ProjectFileImportUpdatedMessage';
  /** Upload ID */
  id: Scalars['String']['output'];
  type: ProjectFileImportUpdatedMessageType;
  upload: FileUpload;
};

export const ProjectFileImportUpdatedMessageType = {
  Created: 'CREATED',
  Updated: 'UPDATED'
} as const;

export type ProjectFileImportUpdatedMessageType = typeof ProjectFileImportUpdatedMessageType[keyof typeof ProjectFileImportUpdatedMessageType];
export type ProjectInviteCreateInput = {
  /** Either this or userId must be filled */
  email?: InputMaybe<Scalars['String']['input']>;
  /** Defaults to the contributor role, if not specified */
  role?: InputMaybe<Scalars['String']['input']>;
  /** Can only be specified if guest mode is on or if the user is an admin */
  serverRole?: InputMaybe<Scalars['String']['input']>;
  /** Either this or email must be filled */
  userId?: InputMaybe<Scalars['String']['input']>;
};

export type ProjectInviteMutations = {
  __typename?: 'ProjectInviteMutations';
  /** Batch invite to project */
  batchCreate: Project;
  /** Cancel a pending stream invite. Can only be invoked by a project owner. */
  cancel: Project;
  /** Invite a new or registered user to be a project collaborator. Can only be invoked by a project owner. */
  create: Project;
  /**
   * Create invite(-s) for a project in a workspace. Unlike the base create() mutation, this allows
   * configuring the workspace role.
   */
  createForWorkspace: Project;
  /** Accept or decline a project invite */
  use: Scalars['Boolean']['output'];
};


export type ProjectInviteMutationsBatchCreateArgs = {
  input: Array<ProjectInviteCreateInput>;
  projectId: Scalars['ID']['input'];
};


export type ProjectInviteMutationsCancelArgs = {
  inviteId: Scalars['String']['input'];
  projectId: Scalars['ID']['input'];
};


export type ProjectInviteMutationsCreateArgs = {
  input: ProjectInviteCreateInput;
  projectId: Scalars['ID']['input'];
};


export type ProjectInviteMutationsCreateForWorkspaceArgs = {
  inputs: Array<WorkspaceProjectInviteCreateInput>;
  projectId: Scalars['ID']['input'];
};


export type ProjectInviteMutationsUseArgs = {
  input: ProjectInviteUseInput;
};

export type ProjectInviteUseInput = {
  accept: Scalars['Boolean']['input'];
  projectId: Scalars['ID']['input'];
  token: Scalars['String']['input'];
};

export type ProjectModelsFilter = {
  /** Filter by IDs of contributors who participated in models */
  contributors?: InputMaybe<Array<Scalars['String']['input']>>;
  /** Excldue models w/ the specified IDs */
  excludeIds?: InputMaybe<Array<Scalars['String']['input']>>;
  /** Only select models w/ the specified IDs */
  ids?: InputMaybe<Array<Scalars['String']['input']>>;
  /** Filter out models that don't have any versions */
  onlyWithVersions?: InputMaybe<Scalars['Boolean']['input']>;
  /** Filter by model names */
  search?: InputMaybe<Scalars['String']['input']>;
  /** Filter by source apps used in models */
  sourceApps?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type ProjectModelsTreeFilter = {
  /** Filter by IDs of contributors who participated in models */
  contributors?: InputMaybe<Array<Scalars['String']['input']>>;
  /** Search for specific models. If used, tree items from different levels may be mixed. */
  search?: InputMaybe<Scalars['String']['input']>;
  /** Filter by source apps used in models */
  sourceApps?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type ProjectModelsUpdatedMessage = {
  __typename?: 'ProjectModelsUpdatedMessage';
  /** Model ID */
  id: Scalars['String']['output'];
  /** Null if model was deleted */
  model?: Maybe<Model>;
  type: ProjectModelsUpdatedMessageType;
};

export const ProjectModelsUpdatedMessageType = {
  Created: 'CREATED',
  Deleted: 'DELETED',
  Updated: 'UPDATED'
} as const;

export type ProjectModelsUpdatedMessageType = typeof ProjectModelsUpdatedMessageType[keyof typeof ProjectModelsUpdatedMessageType];
export type ProjectMoveToWorkspaceDryRun = {
  __typename?: 'ProjectMoveToWorkspaceDryRun';
  addedToWorkspace: Array<LimitedUser>;
  addedToWorkspaceTotalCount: Scalars['Int']['output'];
};


export type ProjectMoveToWorkspaceDryRunAddedToWorkspaceArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};

export type ProjectMutations = {
  __typename?: 'ProjectMutations';
  /** Access request related mutations */
  accessRequestMutations: ProjectAccessRequestMutations;
  automationMutations: ProjectAutomationMutations;
  /** Batch delete projects */
  batchDelete: Scalars['Boolean']['output'];
  /** Create new project */
  create: Project;
  createEmbedToken: CreateEmbedTokenReturn;
  /**
   * Create onboarding/tutorial project. If one is already created for the active user, that
   * one will be returned instead.
   */
  createForOnboarding: Project;
  /** Delete an existing project */
  delete: Scalars['Boolean']['output'];
  /** Invite related mutations */
  invites: ProjectInviteMutations;
  /** Leave a project. Only possible if you're not the last remaining owner. */
  leave: Scalars['Boolean']['output'];
  revokeEmbedToken: Scalars['Boolean']['output'];
  revokeEmbedTokens: Scalars['Boolean']['output'];
  /** Updates an existing project */
  update: Project;
  /** Update role for a collaborator */
  updateRole: Project;
};


export type ProjectMutationsAutomationMutationsArgs = {
  projectId: Scalars['ID']['input'];
};


export type ProjectMutationsBatchDeleteArgs = {
  ids: Array<Scalars['String']['input']>;
};


export type ProjectMutationsCreateArgs = {
  input?: InputMaybe<ProjectCreateInput>;
};


export type ProjectMutationsCreateEmbedTokenArgs = {
  token: EmbedTokenCreateInput;
};


export type ProjectMutationsDeleteArgs = {
  id: Scalars['String']['input'];
};


export type ProjectMutationsLeaveArgs = {
  id: Scalars['String']['input'];
};


export type ProjectMutationsRevokeEmbedTokenArgs = {
  projectId: Scalars['String']['input'];
  token: Scalars['String']['input'];
};


export type ProjectMutationsRevokeEmbedTokensArgs = {
  projectId: Scalars['String']['input'];
};


export type ProjectMutationsUpdateArgs = {
  update: ProjectUpdateInput;
};


export type ProjectMutationsUpdateRoleArgs = {
  input: ProjectUpdateRoleInput;
};

export type ProjectPendingModelsUpdatedMessage = {
  __typename?: 'ProjectPendingModelsUpdatedMessage';
  /** Upload ID */
  id: Scalars['String']['output'];
  model: FileUpload;
  type: ProjectPendingModelsUpdatedMessageType;
};

export const ProjectPendingModelsUpdatedMessageType = {
  Created: 'CREATED',
  Updated: 'UPDATED'
} as const;

export type ProjectPendingModelsUpdatedMessageType = typeof ProjectPendingModelsUpdatedMessageType[keyof typeof ProjectPendingModelsUpdatedMessageType];
export type ProjectPendingVersionsUpdatedMessage = {
  __typename?: 'ProjectPendingVersionsUpdatedMessage';
  /** Upload ID */
  id: Scalars['String']['output'];
  type: ProjectPendingVersionsUpdatedMessageType;
  version: FileUpload;
};

export const ProjectPendingVersionsUpdatedMessageType = {
  Created: 'CREATED',
  Updated: 'UPDATED'
} as const;

export type ProjectPendingVersionsUpdatedMessageType = typeof ProjectPendingVersionsUpdatedMessageType[keyof typeof ProjectPendingVersionsUpdatedMessageType];
export type ProjectPermissionChecks = {
  __typename?: 'ProjectPermissionChecks';
  canBroadcastActivity: PermissionCheckResult;
  canCreateAutomation: PermissionCheckResult;
  canCreateComment: PermissionCheckResult;
  canCreateEmbedTokens: PermissionCheckResult;
  canCreateModel: PermissionCheckResult;
  canDelete: PermissionCheckResult;
  canInvite: PermissionCheckResult;
  canLeave: PermissionCheckResult;
  canLoad: PermissionCheckResult;
  canMoveToWorkspace: PermissionCheckResult;
  canPublish: PermissionCheckResult;
  canRead: PermissionCheckResult;
  canReadEmbedTokens: PermissionCheckResult;
  canReadSettings: PermissionCheckResult;
  canReadWebhooks: PermissionCheckResult;
  canRequestRender: PermissionCheckResult;
  canRevokeEmbedTokens: PermissionCheckResult;
  canUpdate: PermissionCheckResult;
  canUpdateAllowPublicComments: PermissionCheckResult;
};


export type ProjectPermissionChecksCanMoveToWorkspaceArgs = {
  workspaceId?: InputMaybe<Scalars['String']['input']>;
};

export type ProjectRole = {
  __typename?: 'ProjectRole';
  project: Project;
  role: Scalars['String']['output'];
};

export type ProjectTestAutomationCreateInput = {
  modelId: Scalars['String']['input'];
  name: Scalars['String']['input'];
};

export type ProjectTriggeredAutomationsStatusUpdatedMessage = {
  __typename?: 'ProjectTriggeredAutomationsStatusUpdatedMessage';
  model: Model;
  project: Project;
  run: AutomateRun;
  type: ProjectTriggeredAutomationsStatusUpdatedMessageType;
  version: Version;
};

export const ProjectTriggeredAutomationsStatusUpdatedMessageType = {
  RunCreated: 'RUN_CREATED',
  RunUpdated: 'RUN_UPDATED'
} as const;

export type ProjectTriggeredAutomationsStatusUpdatedMessageType = typeof ProjectTriggeredAutomationsStatusUpdatedMessageType[keyof typeof ProjectTriggeredAutomationsStatusUpdatedMessageType];
/** Any values left null will be ignored, so only set the properties that you want updated */
export type ProjectUpdateInput = {
  allowPublicComments?: InputMaybe<Scalars['Boolean']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  visibility?: InputMaybe<ProjectVisibility>;
};

export type ProjectUpdateRoleInput = {
  projectId: Scalars['String']['input'];
  /** Leave role as null to revoke access entirely */
  role?: InputMaybe<Scalars['String']['input']>;
  userId: Scalars['String']['input'];
};

export type ProjectUpdatedMessage = {
  __typename?: 'ProjectUpdatedMessage';
  /** Project ID */
  id: Scalars['String']['output'];
  /** Project entity, null if project was deleted */
  project?: Maybe<Project>;
  /** Message type */
  type: ProjectUpdatedMessageType;
};

export const ProjectUpdatedMessageType = {
  Deleted: 'DELETED',
  Updated: 'UPDATED'
} as const;

export type ProjectUpdatedMessageType = typeof ProjectUpdatedMessageType[keyof typeof ProjectUpdatedMessageType];
export type ProjectVersionsPreviewGeneratedMessage = {
  __typename?: 'ProjectVersionsPreviewGeneratedMessage';
  objectId: Scalars['String']['output'];
  projectId: Scalars['String']['output'];
  versionId: Scalars['String']['output'];
};

export type ProjectVersionsUpdatedMessage = {
  __typename?: 'ProjectVersionsUpdatedMessage';
  /** Version ID */
  id: Scalars['String']['output'];
  /** Version's model ID */
  modelId: Scalars['String']['output'];
  type: ProjectVersionsUpdatedMessageType;
  /** Null if version was deleted */
  version?: Maybe<Version>;
};

export const ProjectVersionsUpdatedMessageType = {
  Created: 'CREATED',
  Deleted: 'DELETED',
  Updated: 'UPDATED'
} as const;

export type ProjectVersionsUpdatedMessageType = typeof ProjectVersionsUpdatedMessageType[keyof typeof ProjectVersionsUpdatedMessageType];
export const ProjectVisibility = {
  /** Only accessible to explicit collaborators */
  Private: 'PRIVATE',
  /** Accessible to everyone (even non-logged in users) */
  Public: 'PUBLIC',
  /** Legacy - same as public */
  Unlisted: 'UNLISTED',
  /** Accessible to everyone in the project's workspace */
  Workspace: 'WORKSPACE'
} as const;

export type ProjectVisibility = typeof ProjectVisibility[keyof typeof ProjectVisibility];
export type Query = {
  __typename?: 'Query';
  /** Stare into the void. */
  _?: Maybe<Scalars['String']['output']>;
  /** Gets the profile of the authenticated user or null if not authenticated */
  activeUser?: Maybe<User>;
  admin: AdminQueries;
  /**
   * All the streams of the server. Available to admins only.
   * @deprecated use admin.projectList instead
   */
  adminStreams?: Maybe<StreamCollection>;
  /**
   * Get all (or search for specific) users, registered or invited, from the server in a paginated view.
   * The query looks for matches in name, company and email.
   * @deprecated use admin.UserList instead
   */
  adminUsers?: Maybe<AdminUsersListCollection>;
  /** Gets a specific app from the server. */
  app?: Maybe<ServerApp>;
  /**
   * Returns all the publicly available apps on this server.
   * @deprecated Part of the old API surface and will be removed in the future.
   */
  apps?: Maybe<Array<Maybe<ServerAppListItem>>>;
  /** If user is authenticated using an app token, this will describe the app */
  authenticatedAsApp?: Maybe<ServerAppListItem>;
  /** Get a single automate function by id. Error will be thrown if function is not found or inaccessible. */
  automateFunction: AutomateFunction;
  automateFunctions: AutomateFunctionCollection;
  /** Part of the automation/function creation handshake mechanism */
  automateValidateAuthCode: Scalars['Boolean']['output'];
  /** @deprecated Part of the old API surface and will be removed in the future. Use Project.comment instead. */
  comment?: Maybe<Comment>;
  /**
   * This query can be used in the following ways:
   * - get all the comments for a stream: **do not pass in any resource identifiers**.
   * - get the comments targeting any of a set of provided resources (comments/objects): **pass in an array of resources.**
   * @deprecated Use Project/Version/Model 'commentThreads' fields instead
   */
  comments?: Maybe<CommentCollection>;
  /**
   * All of the discoverable streams of the server
   * @deprecated Part of the old API surface and will be removed in the future.
   */
  discoverableStreams?: Maybe<StreamCollection>;
  /** Get the (limited) profile information of another server user */
  otherUser?: Maybe<LimitedUser>;
  /**
   * Find a specific project. Will throw an authorization error if active user isn't authorized
   * to see it, for example, if a project isn't public and the user doesn't have the appropriate rights.
   */
  project: Project;
  /**
   * Look for an invitation to a project, for the current user (authed or not). If token
   * isn't specified, the server will look for any valid invite.
   */
  projectInvite?: Maybe<PendingStreamCollaborator>;
  serverInfo: ServerInfo;
  /** Receive metadata about an invite by the invite token */
  serverInviteByToken?: Maybe<ServerInvite>;
  /** @deprecated use admin.serverStatistics instead */
  serverStats: ServerStats;
  /**
   * Returns a specific stream. Will throw an authorization error if active user isn't authorized
   * to see it, for example, if a stream isn't public and the user doesn't have the appropriate rights.
   * @deprecated Part of the old API surface and will be removed in the future. Use Query.project instead.
   */
  stream?: Maybe<Stream>;
  /**
   * Get authed user's stream access request
   * @deprecated Part of the old API surface and will be removed in the future. Use User.projectAccessRequest instead.
   */
  streamAccessRequest?: Maybe<StreamAccessRequest>;
  /**
   * Look for an invitation to a stream, for the current user (authed or not). If token
   * isn't specified, the server will look for any valid invite.
   * @deprecated Part of the old API surface and will be removed in the future. Use Query.projectInvite instead.
   */
  streamInvite?: Maybe<PendingStreamCollaborator>;
  /**
   * Get all invitations to streams that the active user has
   * @deprecated Part of the old API surface and will be removed in the future. Use User.projectInvites instead.
   */
  streamInvites: Array<PendingStreamCollaborator>;
  /**
   * Returns all streams that the active user is a collaborator on.
   * Pass in the `query` parameter to search by name, description or ID.
   * @deprecated Part of the old API surface and will be removed in the future. Use User.projects instead.
   */
  streams?: Maybe<UserStreamCollection>;
  /**
   * Gets the profile of a user. If no id argument is provided, will return the current authenticated user's profile (as extracted from the authorization header).
   * @deprecated To be removed in the near future! Use 'activeUser' to get info about the active user or 'otherUser' to get info about another user.
   */
  user?: Maybe<User>;
  /**
   * Validate password strength
   * @deprecated Part of the old API surface and will be removed in the future.
   */
  userPwdStrength: PasswordStrengthCheckResults;
  /**
   * Search for users and return limited metadata about them, if you have the server:user role.
   * The query looks for matches in name & email
   * @deprecated Use users() instead.
   */
  userSearch: UserSearchResultCollection;
  /** Look up server users */
  users: UserSearchResultCollection;
  /** Look up server users with a collection of emails */
  usersByEmail: Array<Maybe<LimitedUser>>;
  /** Validates the slug, to make sure it contains only valid characters and its not taken. */
  validateWorkspaceSlug: Scalars['Boolean']['output'];
  workspace: Workspace;
  workspaceBySlug: Workspace;
  /**
   * Look for an invitation to a workspace, for the current user (authed or not).
   *
   * If token is specified, it will return the corresponding invite even if it belongs to a different user.
   *
   * Either token or workspaceId must be specified, or both
   */
  workspaceInvite?: Maybe<PendingWorkspaceCollaborator>;
  /** Find workspaces a given user email can use SSO to sign with */
  workspaceSsoByEmail: Array<LimitedWorkspace>;
};


export type QueryAdminStreamsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
  visibility?: InputMaybe<Scalars['String']['input']>;
};


export type QueryAdminUsersArgs = {
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
  query?: InputMaybe<Scalars['String']['input']>;
};


export type QueryAppArgs = {
  id: Scalars['String']['input'];
};


export type QueryAutomateFunctionArgs = {
  id: Scalars['ID']['input'];
};


export type QueryAutomateFunctionsArgs = {
  cursor?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<AutomateFunctionsFilter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryAutomateValidateAuthCodeArgs = {
  payload: AutomateAuthCodePayloadTest;
  resources?: InputMaybe<AutomateAuthCodeResources>;
};


export type QueryCommentArgs = {
  id: Scalars['String']['input'];
  streamId: Scalars['String']['input'];
};


export type QueryCommentsArgs = {
  archived?: Scalars['Boolean']['input'];
  cursor?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  resources?: InputMaybe<Array<InputMaybe<ResourceIdentifierInput>>>;
  streamId: Scalars['String']['input'];
};


export type QueryDiscoverableStreamsArgs = {
  cursor?: InputMaybe<Scalars['String']['input']>;
  limit?: Scalars['Int']['input'];
  sort?: InputMaybe<DiscoverableStreamsSortingInput>;
};


export type QueryOtherUserArgs = {
  id: Scalars['String']['input'];
};


export type QueryProjectArgs = {
  id: Scalars['String']['input'];
};


export type QueryProjectInviteArgs = {
  projectId: Scalars['String']['input'];
  token?: InputMaybe<Scalars['String']['input']>;
};


export type QueryServerInviteByTokenArgs = {
  token?: InputMaybe<Scalars['String']['input']>;
};


export type QueryStreamArgs = {
  id: Scalars['String']['input'];
};


export type QueryStreamAccessRequestArgs = {
  streamId: Scalars['String']['input'];
};


export type QueryStreamInviteArgs = {
  streamId: Scalars['String']['input'];
  token?: InputMaybe<Scalars['String']['input']>;
};


export type QueryStreamsArgs = {
  cursor?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
};


export type QueryUserArgs = {
  id?: InputMaybe<Scalars['String']['input']>;
};


export type QueryUserPwdStrengthArgs = {
  pwd: Scalars['String']['input'];
};


export type QueryUserSearchArgs = {
  archived?: InputMaybe<Scalars['Boolean']['input']>;
  cursor?: InputMaybe<Scalars['String']['input']>;
  emailOnly?: InputMaybe<Scalars['Boolean']['input']>;
  limit?: Scalars['Int']['input'];
  query: Scalars['String']['input'];
};


export type QueryUsersArgs = {
  input: UsersRetrievalInput;
};


export type QueryUsersByEmailArgs = {
  input: BulkUsersRetrievalInput;
};


export type QueryValidateWorkspaceSlugArgs = {
  slug: Scalars['String']['input'];
};


export type QueryWorkspaceArgs = {
  id: Scalars['String']['input'];
};


export type QueryWorkspaceBySlugArgs = {
  slug: Scalars['String']['input'];
};


export type QueryWorkspaceInviteArgs = {
  options?: InputMaybe<WorkspaceInviteLookupOptions>;
  token?: InputMaybe<Scalars['String']['input']>;
  workspaceId?: InputMaybe<Scalars['String']['input']>;
};


export type QueryWorkspaceSsoByEmailArgs = {
  email: Scalars['String']['input'];
};

/** Deprecated: Used by old stream-based mutations */
export type ReplyCreateInput = {
  /** IDs of uploaded blobs that should be attached to this reply */
  blobIds: Array<Scalars['String']['input']>;
  data?: InputMaybe<Scalars['JSONObject']['input']>;
  parentComment: Scalars['String']['input'];
  streamId: Scalars['String']['input'];
  /** ProseMirror document object */
  text?: InputMaybe<Scalars['JSONObject']['input']>;
};

export type ResourceIdentifier = {
  __typename?: 'ResourceIdentifier';
  resourceId: Scalars['String']['output'];
  resourceType: ResourceType;
};

export type ResourceIdentifierInput = {
  resourceId: Scalars['String']['input'];
  resourceType: ResourceType;
};

export const ResourceType = {
  Comment: 'comment',
  Commit: 'commit',
  Object: 'object',
  Stream: 'stream'
} as const;

export type ResourceType = typeof ResourceType[keyof typeof ResourceType];
export type Role = {
  __typename?: 'Role';
  description: Scalars['String']['output'];
  name: Scalars['String']['output'];
  resourceTarget: Scalars['String']['output'];
};

export type RootPermissionChecks = {
  __typename?: 'RootPermissionChecks';
  canCreatePersonalProject: PermissionCheckResult;
  canCreateWorkspace: PermissionCheckResult;
};

/** Available scopes. */
export type Scope = {
  __typename?: 'Scope';
  description: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

export type ServerApp = {
  __typename?: 'ServerApp';
  author?: Maybe<AppAuthor>;
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  logo?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  public?: Maybe<Scalars['Boolean']['output']>;
  redirectUrl: Scalars['String']['output'];
  scopes: Array<Scope>;
  secret?: Maybe<Scalars['String']['output']>;
  termsAndConditionsLink?: Maybe<Scalars['String']['output']>;
  trustByDefault?: Maybe<Scalars['Boolean']['output']>;
};

export type ServerAppListItem = {
  __typename?: 'ServerAppListItem';
  author?: Maybe<AppAuthor>;
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  logo?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  redirectUrl: Scalars['String']['output'];
  termsAndConditionsLink?: Maybe<Scalars['String']['output']>;
  trustByDefault?: Maybe<Scalars['Boolean']['output']>;
};

export type ServerAutomateInfo = {
  __typename?: 'ServerAutomateInfo';
  availableFunctionTemplates: Array<AutomateFunctionTemplate>;
};

/** Server configuration. */
export type ServerConfiguration = {
  __typename?: 'ServerConfiguration';
  blobSizeLimitBytes: Scalars['Int']['output'];
  /** Whether the email feature is enabled on this server */
  isEmailEnabled: Scalars['Boolean']['output'];
  objectMultipartUploadSizeLimitBytes: Scalars['Int']['output'];
  objectSizeLimitBytes: Scalars['Int']['output'];
};

/** Information about this server. */
export type ServerInfo = {
  __typename?: 'ServerInfo';
  adminContact?: Maybe<Scalars['String']['output']>;
  /** The authentication strategies available on this server. */
  authStrategies: Array<AuthStrategy>;
  automate: ServerAutomateInfo;
  /** Base URL of Speckle Automate, if set */
  automateUrl?: Maybe<Scalars['String']['output']>;
  /** @deprecated Use the ServerInfo{configuration{blobSizeLimitBytes}} field instead. */
  blobSizeLimitBytes: Scalars['Int']['output'];
  canonicalUrl?: Maybe<Scalars['String']['output']>;
  company?: Maybe<Scalars['String']['output']>;
  /**
   * Configuration values that are specific to this server.
   * These are read-only and can only be adjusted during server setup.
   * Please contact your server administrator if you wish to suggest a change to these values.
   */
  configuration: ServerConfiguration;
  description?: Maybe<Scalars['String']['output']>;
  /** Whether or not to show messaging about FE2 (banners etc.) */
  enableNewWebUiMessaging?: Maybe<Scalars['Boolean']['output']>;
  guestModeEnabled: Scalars['Boolean']['output'];
  inviteOnly?: Maybe<Scalars['Boolean']['output']>;
  /** Server relocation / migration info */
  migration?: Maybe<ServerMigration>;
  /** Info about server regions */
  multiRegion: ServerMultiRegionConfiguration;
  name: Scalars['String']['output'];
  /** @deprecated Use role constants from the @speckle/shared npm package instead */
  roles: Array<Role>;
  scopes: Array<Scope>;
  serverRoles: Array<ServerRoleItem>;
  termsOfService?: Maybe<Scalars['String']['output']>;
  version?: Maybe<Scalars['String']['output']>;
  workspaces: ServerWorkspacesInfo;
};

export type ServerInfoMutations = {
  __typename?: 'ServerInfoMutations';
  multiRegion: ServerRegionMutations;
};

export type ServerInfoUpdateInput = {
  adminContact?: InputMaybe<Scalars['String']['input']>;
  company?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  guestModeEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  inviteOnly?: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
  termsOfService?: InputMaybe<Scalars['String']['input']>;
};

export type ServerInvite = {
  __typename?: 'ServerInvite';
  email: Scalars['String']['output'];
  id: Scalars['String']['output'];
  invitedBy: LimitedUser;
};

export type ServerInviteCreateInput = {
  email: Scalars['String']['input'];
  message?: InputMaybe<Scalars['String']['input']>;
  /** Can only be specified if guest mode is on or if the user is an admin */
  serverRole?: InputMaybe<Scalars['String']['input']>;
};

export type ServerMigration = {
  __typename?: 'ServerMigration';
  movedFrom?: Maybe<Scalars['String']['output']>;
  movedTo?: Maybe<Scalars['String']['output']>;
};

export type ServerMultiRegionConfiguration = {
  __typename?: 'ServerMultiRegionConfiguration';
  /**
   * Keys of available regions defined in the multi region config file. Used keys will
   * be filtered out from the result.
   */
  availableKeys: Array<Scalars['String']['output']>;
  /** Regions available for project data residency */
  regions: Array<ServerRegionItem>;
};

export type ServerRegionItem = {
  __typename?: 'ServerRegionItem';
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  key: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

export type ServerRegionMutations = {
  __typename?: 'ServerRegionMutations';
  create: ServerRegionItem;
  update: ServerRegionItem;
};


export type ServerRegionMutationsCreateArgs = {
  input: CreateServerRegionInput;
};


export type ServerRegionMutationsUpdateArgs = {
  input: UpdateServerRegionInput;
};

export const ServerRole = {
  ServerAdmin: 'SERVER_ADMIN',
  ServerArchivedUser: 'SERVER_ARCHIVED_USER',
  ServerGuest: 'SERVER_GUEST',
  ServerUser: 'SERVER_USER'
} as const;

export type ServerRole = typeof ServerRole[keyof typeof ServerRole];
export type ServerRoleItem = {
  __typename?: 'ServerRoleItem';
  id: Scalars['String']['output'];
  title: Scalars['String']['output'];
};

export type ServerStatistics = {
  __typename?: 'ServerStatistics';
  totalPendingInvites: Scalars['Int']['output'];
  totalProjectCount: Scalars['Int']['output'];
  totalUserCount: Scalars['Int']['output'];
};

export type ServerStats = {
  __typename?: 'ServerStats';
  /** An array of objects currently structured as { created_month: Date, count: int }. */
  commitHistory?: Maybe<Array<Maybe<Scalars['JSONObject']['output']>>>;
  /** An array of objects currently structured as { created_month: Date, count: int }. */
  objectHistory?: Maybe<Array<Maybe<Scalars['JSONObject']['output']>>>;
  /** An array of objects currently structured as { created_month: Date, count: int }. */
  streamHistory?: Maybe<Array<Maybe<Scalars['JSONObject']['output']>>>;
  totalCommitCount: Scalars['Int']['output'];
  totalObjectCount: Scalars['Int']['output'];
  totalStreamCount: Scalars['Int']['output'];
  totalUserCount: Scalars['Int']['output'];
  /** An array of objects currently structured as { created_month: Date, count: int }. */
  userHistory?: Maybe<Array<Maybe<Scalars['JSONObject']['output']>>>;
};

export type ServerWorkspacesInfo = {
  __typename?: 'ServerWorkspacesInfo';
  /** Up-to-date prices for paid & non-invoiced Workspace plans */
  planPrices?: Maybe<CurrencyBasedPrices>;
  /**
   * This is a backend control variable for the workspaces feature set.
   * Since workspaces need a backend logic to be enabled, this is not enough as a feature flag.
   */
  workspacesEnabled: Scalars['Boolean']['output'];
};

export const SessionPaymentStatus = {
  Paid: 'paid',
  Unpaid: 'unpaid'
} as const;

export type SessionPaymentStatus = typeof SessionPaymentStatus[keyof typeof SessionPaymentStatus];
export type SetPrimaryUserEmailInput = {
  id: Scalars['ID']['input'];
};

export type SmartTextEditorValue = {
  __typename?: 'SmartTextEditorValue';
  /** File attachments, if any */
  attachments?: Maybe<Array<BlobMetadata>>;
  /**
   * The actual (ProseMirror) document representing the text. Can be empty,
   * if there are attachments.
   */
  doc?: Maybe<Scalars['JSONObject']['output']>;
  /** The type of editor value (comment, blog post etc.) */
  type: Scalars['String']['output'];
  /** The version of the schema */
  version: Scalars['String']['output'];
};

export const SortDirection = {
  Asc: 'ASC',
  Desc: 'DESC'
} as const;

export type SortDirection = typeof SortDirection[keyof typeof SortDirection];
export type StartFileImportInput = {
  /**
   * The etag is returned by the blob storage provider in the response body after a successful upload.
   * It is used to verify the integrity of the uploaded file.
   */
  etag: Scalars['String']['input'];
  fileId: Scalars['String']['input'];
  modelId: Scalars['String']['input'];
  projectId: Scalars['String']['input'];
};

export type Stream = {
  __typename?: 'Stream';
  /**
   * All the recent activity on this stream in chronological order
   * @deprecated Part of the old API surface and will be removed in the future.
   */
  activity?: Maybe<ActivityCollection>;
  allowPublicComments: Scalars['Boolean']['output'];
  /** @deprecated Part of the old API surface and will be removed in the future. Use Project.blob instead. */
  blob?: Maybe<BlobMetadata>;
  /**
   * Get the metadata collection of blobs stored for this stream.
   * @deprecated Part of the old API surface and will be removed in the future. Use Project.blobs instead.
   */
  blobs?: Maybe<BlobMetadataCollection>;
  /** @deprecated Part of the old API surface and will be removed in the future. Use Project.model or Project.modelByName instead. */
  branch?: Maybe<Branch>;
  /** @deprecated Part of the old API surface and will be removed in the future. Use Project.models or Project.modelsTree instead. */
  branches?: Maybe<BranchCollection>;
  collaborators: Array<StreamCollaborator>;
  /**
   * The total number of comments for this stream. To actually get the comments, use the comments query without passing in a resource array. E.g.:
   *
   * ```
   * query{
   *   comments(streamId:"streamId"){
   *     ...
   *   }
   * ```
   * @deprecated Part of the old API surface and will be removed in the future.
   */
  commentCount: Scalars['Int']['output'];
  /** @deprecated Part of the old API surface and will be removed in the future. Use Project.version instead. */
  commit?: Maybe<Commit>;
  /** @deprecated Part of the old API surface and will be removed in the future. Use Project.versions instead. */
  commits?: Maybe<CommitCollection>;
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  /** Date when you favorited this stream. `null` if stream isn't viewed from a specific user's perspective or if it isn't favorited. */
  favoritedDate?: Maybe<Scalars['DateTime']['output']>;
  favoritesCount: Scalars['Int']['output'];
  /**
   * Returns a specific file upload that belongs to this stream.
   * @deprecated Part of the old API surface and will be removed in the future. Use Project.pendingImportedModels or Model.pendingImportedVersions instead.
   */
  fileUpload?: Maybe<FileUpload>;
  /**
   * Returns a list of all the file uploads for this stream.
   * @deprecated Part of the old API surface and will be removed in the future. Use Project.pendingImportedModels or Model.pendingImportedVersions instead.
   */
  fileUploads: Array<FileUpload>;
  id: Scalars['String']['output'];
  /**
   * Whether the stream (if public) can be found on public stream exploration pages
   * and searches
   * @deprecated Discoverability as a feature has been removed.
   */
  isDiscoverable: Scalars['Boolean']['output'];
  /** Whether the stream can be viewed by non-contributors */
  isPublic: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  /** @deprecated Part of the old API surface and will be removed in the future. Use Project.object instead. */
  object?: Maybe<Object>;
  /**
   * Pending stream access requests
   * @deprecated Part of the old API surface and will be removed in the future. Use Project.pendingAccessRequests instead.
   */
  pendingAccessRequests?: Maybe<Array<StreamAccessRequest>>;
  /** Collaborators who have been invited, but not yet accepted. */
  pendingCollaborators?: Maybe<Array<PendingStreamCollaborator>>;
  /** Your role for this stream. `null` if request is not authenticated, or the stream is not explicitly shared with you. */
  role?: Maybe<Scalars['String']['output']>;
  size?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  /** @deprecated Part of the old API surface and will be removed in the future. Use Project.webhooks instead. */
  webhooks: WebhookCollection;
};


export type StreamActivityArgs = {
  actionType?: InputMaybe<Scalars['String']['input']>;
  after?: InputMaybe<Scalars['DateTime']['input']>;
  before?: InputMaybe<Scalars['DateTime']['input']>;
  cursor?: InputMaybe<Scalars['DateTime']['input']>;
  limit?: Scalars['Int']['input'];
};


export type StreamBlobArgs = {
  id: Scalars['String']['input'];
};


export type StreamBlobsArgs = {
  cursor?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
};


export type StreamBranchArgs = {
  name?: InputMaybe<Scalars['String']['input']>;
};


export type StreamBranchesArgs = {
  cursor?: InputMaybe<Scalars['String']['input']>;
  limit?: Scalars['Int']['input'];
};


export type StreamCommitArgs = {
  id?: InputMaybe<Scalars['String']['input']>;
};


export type StreamCommitsArgs = {
  cursor?: InputMaybe<Scalars['String']['input']>;
  limit?: Scalars['Int']['input'];
};


export type StreamFileUploadArgs = {
  id: Scalars['String']['input'];
};


export type StreamObjectArgs = {
  id: Scalars['String']['input'];
};


export type StreamWebhooksArgs = {
  id?: InputMaybe<Scalars['String']['input']>;
};

/** Created when a user requests to become a contributor on a stream */
export type StreamAccessRequest = {
  __typename?: 'StreamAccessRequest';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  requester: LimitedUser;
  requesterId: Scalars['String']['output'];
  /** Can only be selected if authed user has proper access */
  stream: Stream;
  streamId: Scalars['String']['output'];
};

export type StreamCollaborator = {
  __typename?: 'StreamCollaborator';
  avatar?: Maybe<Scalars['String']['output']>;
  company?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  role: Scalars['String']['output'];
  serverRole: Scalars['String']['output'];
};

export type StreamCollection = {
  __typename?: 'StreamCollection';
  cursor?: Maybe<Scalars['String']['output']>;
  items?: Maybe<Array<Stream>>;
  totalCount: Scalars['Int']['output'];
};

export type StreamCreateInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  /**
   * Whether the stream (if public) can be found on public stream exploration pages
   * and searches
   */
  isDiscoverable?: InputMaybe<Scalars['Boolean']['input']>;
  /** Whether the stream can be viewed by non-contributors */
  isPublic?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  /** Optionally specify user IDs of users that you want to invite to be contributors to this stream */
  withContributors?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type StreamInviteCreateInput = {
  email?: InputMaybe<Scalars['String']['input']>;
  message?: InputMaybe<Scalars['String']['input']>;
  /** Defaults to the contributor role, if not specified */
  role?: InputMaybe<Scalars['String']['input']>;
  /** Can only be specified if guest mode is on or if the user is an admin */
  serverRole?: InputMaybe<Scalars['String']['input']>;
  streamId: Scalars['String']['input'];
  userId?: InputMaybe<Scalars['String']['input']>;
};

export type StreamRevokePermissionInput = {
  streamId: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};

export const StreamRole = {
  StreamContributor: 'STREAM_CONTRIBUTOR',
  StreamOwner: 'STREAM_OWNER',
  StreamReviewer: 'STREAM_REVIEWER'
} as const;

export type StreamRole = typeof StreamRole[keyof typeof StreamRole];
export type StreamUpdateInput = {
  allowPublicComments?: InputMaybe<Scalars['Boolean']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  /**
   * Whether the stream (if public) can be found on public stream exploration pages
   * and searches
   */
  isDiscoverable?: InputMaybe<Scalars['Boolean']['input']>;
  /** Whether the stream can be viewed by non-contributors */
  isPublic?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

export type StreamUpdatePermissionInput = {
  role: Scalars['String']['input'];
  streamId: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};

export type Subscription = {
  __typename?: 'Subscription';
  /** It's lonely in the void. */
  _?: Maybe<Scalars['String']['output']>;
  /**
   * Subscribe to branch created event
   * @deprecated Part of the old API surface and will be removed in the future. Use 'projectModelsUpdated' instead.
   */
  branchCreated?: Maybe<Scalars['JSONObject']['output']>;
  /**
   * Subscribe to branch deleted event
   * @deprecated Part of the old API surface and will be removed in the future. Use 'projectModelsUpdated' instead.
   */
  branchDeleted?: Maybe<Scalars['JSONObject']['output']>;
  /**
   * Subscribe to branch updated event.
   * @deprecated Part of the old API surface and will be removed in the future. Use 'projectModelsUpdated' instead.
   */
  branchUpdated?: Maybe<Scalars['JSONObject']['output']>;
  /**
   * Subscribe to new comment events. There's two ways to use this subscription:
   * - for a whole stream: do not pass in any resourceIds; this sub will get called whenever a comment (not reply) is added to any of the stream's resources.
   * - for a specific resource/set of resources: pass in a list of resourceIds (commit or object ids); this sub will get called when *any* of the resources provided get a comment.
   * @deprecated Use projectCommentsUpdated
   */
  commentActivity: CommentActivityMessage;
  /**
   * Subscribes to events on a specific comment. Use to find out when:
   * - a top level comment is deleted (trigger a deletion event outside)
   * - a top level comment receives a reply.
   * @deprecated Use projectCommentsUpdated or viewerUserActivityBroadcasted for reply status
   */
  commentThreadActivity: CommentThreadActivityMessage;
  /**
   * Subscribe to commit created event
   * @deprecated Part of the old API surface and will be removed in the future. Use 'projectVersionsUpdated' instead.
   */
  commitCreated?: Maybe<Scalars['JSONObject']['output']>;
  /**
   * Subscribe to commit deleted event
   * @deprecated Part of the old API surface and will be removed in the future. Use 'projectVersionsUpdated' instead.
   */
  commitDeleted?: Maybe<Scalars['JSONObject']['output']>;
  /**
   * Subscribe to commit updated event.
   * @deprecated Part of the old API surface and will be removed in the future. Use 'projectVersionsUpdated' instead.
   */
  commitUpdated?: Maybe<Scalars['JSONObject']['output']>;
  /**
   * Cyclically sends a message to the client, used for testing
   * Note: Only works in test environment
   */
  ping: Scalars['String']['output'];
  /** Subscribe to updates to automations in the project */
  projectAutomationsUpdated: ProjectAutomationsUpdatedMessage;
  /**
   * Subscribe to updates to resource comments/threads. Optionally specify resource ID string to only receive
   * updates regarding comments for those resources.
   */
  projectCommentsUpdated: ProjectCommentsUpdatedMessage;
  /**
   * Subscribe to changes to any of a project's file imports
   * @deprecated Part of the old API surface and will be removed in the future. Use projectPendingModelsUpdated or projectPendingVersionsUpdated instead.
   */
  projectFileImportUpdated: ProjectFileImportUpdatedMessage;
  /** Subscribe to changes to a project's models. Optionally specify modelIds to track. */
  projectModelsUpdated: ProjectModelsUpdatedMessage;
  /** Subscribe to changes to a project's pending models */
  projectPendingModelsUpdated: ProjectPendingModelsUpdatedMessage;
  /** Subscribe to changes to a project's pending versions */
  projectPendingVersionsUpdated: ProjectPendingVersionsUpdatedMessage;
  /** Subscribe to updates to any triggered automations statuses in the project */
  projectTriggeredAutomationsStatusUpdated: ProjectTriggeredAutomationsStatusUpdatedMessage;
  /** Track updates to a specific project */
  projectUpdated: ProjectUpdatedMessage;
  projectVersionGendoAIRenderCreated: GendoAiRender;
  projectVersionGendoAIRenderUpdated: GendoAiRender;
  /** Subscribe to when a project's versions get their preview image fully generated. */
  projectVersionsPreviewGenerated: ProjectVersionsPreviewGeneratedMessage;
  /** Subscribe to changes to a project's versions. */
  projectVersionsUpdated: ProjectVersionsUpdatedMessage;
  /**
   * Subscribes to stream deleted event. Use this in clients/components that pertain only to this stream.
   * @deprecated Part of the old API surface and will be removed in the future. Use projectUpdated instead.
   */
  streamDeleted?: Maybe<Scalars['JSONObject']['output']>;
  /**
   * Subscribes to stream updated event. Use this in clients/components that pertain only to this stream.
   * @deprecated Part of the old API surface and will be removed in the future. Use projectUpdated instead.
   */
  streamUpdated?: Maybe<Scalars['JSONObject']['output']>;
  /** Track newly added or deleted projects owned by the active user */
  userProjectsUpdated: UserProjectsUpdatedMessage;
  /**
   * Subscribes to new stream added event for your profile. Use this to display an up-to-date list of streams.
   * **NOTE**: If someone shares a stream with you, this subscription will be triggered with an extra value of `sharedBy` in the payload.
   * @deprecated Part of the old API surface and will be removed in the future. Use userProjectsUpdated instead.
   */
  userStreamAdded?: Maybe<Scalars['JSONObject']['output']>;
  /**
   * Subscribes to stream removed event for your profile. Use this to display an up-to-date list of streams for your profile.
   * **NOTE**: If someone revokes your permissions on a stream, this subscription will be triggered with an extra value of `revokedBy` in the payload.
   * @deprecated Part of the old API surface and will be removed in the future. Use userProjectsUpdated instead.
   */
  userStreamRemoved?: Maybe<Scalars['JSONObject']['output']>;
  /**
   * Broadcasts "real-time" location data for viewer users.
   * @deprecated Use viewerUserActivityBroadcasted
   */
  userViewerActivity?: Maybe<Scalars['JSONObject']['output']>;
  /** Track user activities in the viewer relating to the specified resources */
  viewerUserActivityBroadcasted: ViewerUserActivityMessage;
  /**
   * Track newly added or deleted projects in a specific workspace.
   * Either slug or id must be set.
   */
  workspaceProjectsUpdated: WorkspaceProjectsUpdatedMessage;
  /**
   * Track updates to a specific workspace.
   * Either slug or id must be set.
   */
  workspaceUpdated: WorkspaceUpdatedMessage;
};


export type SubscriptionBranchCreatedArgs = {
  streamId: Scalars['String']['input'];
};


export type SubscriptionBranchDeletedArgs = {
  streamId: Scalars['String']['input'];
};


export type SubscriptionBranchUpdatedArgs = {
  branchId?: InputMaybe<Scalars['String']['input']>;
  streamId: Scalars['String']['input'];
};


export type SubscriptionCommentActivityArgs = {
  resourceIds?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  streamId: Scalars['String']['input'];
};


export type SubscriptionCommentThreadActivityArgs = {
  commentId: Scalars['String']['input'];
  streamId: Scalars['String']['input'];
};


export type SubscriptionCommitCreatedArgs = {
  streamId: Scalars['String']['input'];
};


export type SubscriptionCommitDeletedArgs = {
  streamId: Scalars['String']['input'];
};


export type SubscriptionCommitUpdatedArgs = {
  commitId?: InputMaybe<Scalars['String']['input']>;
  streamId: Scalars['String']['input'];
};


export type SubscriptionProjectAutomationsUpdatedArgs = {
  projectId: Scalars['String']['input'];
};


export type SubscriptionProjectCommentsUpdatedArgs = {
  target: ViewerUpdateTrackingTarget;
};


export type SubscriptionProjectFileImportUpdatedArgs = {
  id: Scalars['String']['input'];
};


export type SubscriptionProjectModelsUpdatedArgs = {
  id: Scalars['String']['input'];
  modelIds?: InputMaybe<Array<Scalars['String']['input']>>;
};


export type SubscriptionProjectPendingModelsUpdatedArgs = {
  id: Scalars['String']['input'];
};


export type SubscriptionProjectPendingVersionsUpdatedArgs = {
  id: Scalars['String']['input'];
};


export type SubscriptionProjectTriggeredAutomationsStatusUpdatedArgs = {
  projectId: Scalars['String']['input'];
};


export type SubscriptionProjectUpdatedArgs = {
  id: Scalars['String']['input'];
};


export type SubscriptionProjectVersionGendoAiRenderCreatedArgs = {
  id: Scalars['String']['input'];
  versionId: Scalars['String']['input'];
};


export type SubscriptionProjectVersionGendoAiRenderUpdatedArgs = {
  id: Scalars['String']['input'];
  versionId: Scalars['String']['input'];
};


export type SubscriptionProjectVersionsPreviewGeneratedArgs = {
  id: Scalars['String']['input'];
};


export type SubscriptionProjectVersionsUpdatedArgs = {
  id: Scalars['String']['input'];
};


export type SubscriptionStreamDeletedArgs = {
  streamId?: InputMaybe<Scalars['String']['input']>;
};


export type SubscriptionStreamUpdatedArgs = {
  streamId?: InputMaybe<Scalars['String']['input']>;
};


export type SubscriptionUserViewerActivityArgs = {
  resourceId: Scalars['String']['input'];
  streamId: Scalars['String']['input'];
};


export type SubscriptionViewerUserActivityBroadcastedArgs = {
  sessionId?: InputMaybe<Scalars['String']['input']>;
  target: ViewerUpdateTrackingTarget;
};


export type SubscriptionWorkspaceProjectsUpdatedArgs = {
  workspaceId?: InputMaybe<Scalars['String']['input']>;
  workspaceSlug?: InputMaybe<Scalars['String']['input']>;
};


export type SubscriptionWorkspaceUpdatedArgs = {
  workspaceId?: InputMaybe<Scalars['String']['input']>;
  workspaceSlug?: InputMaybe<Scalars['String']['input']>;
};

export type TestAutomationRun = {
  __typename?: 'TestAutomationRun';
  automationRunId: Scalars['String']['output'];
  functionRunId: Scalars['String']['output'];
  triggers: Array<TestAutomationRunTrigger>;
};

export type TestAutomationRunTrigger = {
  __typename?: 'TestAutomationRunTrigger';
  payload: TestAutomationRunTriggerPayload;
  triggerType: Scalars['String']['output'];
};

export type TestAutomationRunTriggerPayload = {
  __typename?: 'TestAutomationRunTriggerPayload';
  modelId: Scalars['String']['output'];
  versionId: Scalars['String']['output'];
};

export type TokenResourceIdentifier = {
  __typename?: 'TokenResourceIdentifier';
  id: Scalars['String']['output'];
  type: TokenResourceIdentifierType;
};

export type TokenResourceIdentifierInput = {
  id: Scalars['String']['input'];
  type: TokenResourceIdentifierType;
};

export const TokenResourceIdentifierType = {
  Project: 'project',
  Workspace: 'workspace'
} as const;

export type TokenResourceIdentifierType = typeof TokenResourceIdentifierType[keyof typeof TokenResourceIdentifierType];
export type TriggeredAutomationsStatus = {
  __typename?: 'TriggeredAutomationsStatus';
  automationRuns: Array<AutomateRun>;
  id: Scalars['ID']['output'];
  status: AutomateRunStatus;
  statusMessage?: Maybe<Scalars['String']['output']>;
};

/** Any null values will be ignored */
export type UpdateAutomateFunctionInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  logo?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  /** SourceAppNames values from @speckle/shared */
  supportedSourceApps?: InputMaybe<Array<Scalars['String']['input']>>;
  tags?: InputMaybe<Array<Scalars['String']['input']>>;
  workspaceIds?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type UpdateModelInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  projectId: Scalars['ID']['input'];
};

export type UpdateServerRegionInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  key: Scalars['String']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
};

/** Only non-null values will be updated */
export type UpdateVersionInput = {
  message?: InputMaybe<Scalars['String']['input']>;
  projectId: Scalars['ID']['input'];
  versionId: Scalars['ID']['input'];
};

export type UpgradePlanInput = {
  billingInterval: BillingInterval;
  workspaceId: Scalars['ID']['input'];
  workspacePlan: PaidWorkspacePlans;
};

/**
 * Full user type, should only be used in the context of admin operations or
 * when a user is reading/writing info about himself
 */
export type User = {
  __typename?: 'User';
  /** The last-visited workspace for the given user */
  activeWorkspace?: Maybe<Workspace>;
  /**
   * All the recent activity from this user in chronological order
   * @deprecated Part of the old API surface and will be removed in the future.
   */
  activity?: Maybe<ActivityCollection>;
  /** Returns a list of your personal api tokens. */
  apiTokens: Array<ApiToken>;
  /** Returns the apps you have authorized. */
  authorizedApps?: Maybe<Array<ServerAppListItem>>;
  automateFunctions: AutomateFunctionCollection;
  automateInfo: UserAutomateInfo;
  avatar?: Maybe<Scalars['String']['output']>;
  bio?: Maybe<Scalars['String']['output']>;
  /**
   * Get commits authored by the user. If requested for another user, then only commits
   * from public streams will be returned.
   * @deprecated Part of the old API surface and will be removed in the future. Use User.versions instead.
   */
  commits?: Maybe<CommitCollection>;
  company?: Maybe<Scalars['String']['output']>;
  /** Returns the apps you have created. */
  createdApps?: Maybe<Array<ServerApp>>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  /** Get discoverable workspaces with verified domains that match the active user's */
  discoverableWorkspaces: Array<LimitedWorkspace>;
  /** Only returned if API user is the user being requested or an admin */
  email?: Maybe<Scalars['String']['output']>;
  emails: Array<UserEmail>;
  /**
   * A list of workspaces for the active user where:
   * (1) The user is a member or admin
   * (2) The workspace has SSO provider enabled
   * (3) The user does not have a valid SSO session for the given SSO provider
   */
  expiredSsoSessions: Array<LimitedWorkspace>;
  /**
   * All the streams that a active user has favorited.
   * Note: You can't use this to retrieve another user's favorite streams.
   * @deprecated Part of the old API surface and will be removed in the future.
   */
  favoriteStreams: StreamCollection;
  gendoAICredits: UserGendoAiCredits;
  /** Whether the user has a pending/active email verification token */
  hasPendingVerification?: Maybe<Scalars['Boolean']['output']>;
  id: Scalars['ID']['output'];
  /** Whether post-sign up onboarding has been finished or skipped entirely */
  isOnboardingFinished?: Maybe<Scalars['Boolean']['output']>;
  /** Returns `true` if last visited project was "legacy" "personal project" outside of a workspace */
  isProjectsActive?: Maybe<Scalars['Boolean']['output']>;
  meta: UserMeta;
  name: Scalars['String']['output'];
  notificationPreferences: Scalars['JSONObject']['output'];
  permissions: RootPermissionChecks;
  profiles?: Maybe<Scalars['JSONObject']['output']>;
  /** Get pending project access request, that the user made */
  projectAccessRequest?: Maybe<ProjectAccessRequest>;
  /** Get all invitations to projects that the active user has */
  projectInvites: Array<PendingStreamCollaborator>;
  /** Get projects that the user participates in */
  projects: UserProjectCollection;
  role?: Maybe<Scalars['String']['output']>;
  /**
   * Returns all streams that the user is a collaborator on. If requested for a user, who isn't the
   * authenticated user, then this will only return discoverable streams.
   * @deprecated Part of the old API surface and will be removed in the future. Use User.projects instead.
   */
  streams: UserStreamCollection;
  /**
   * The user's timeline in chronological order
   * @deprecated Part of the old API surface and will be removed in the future.
   */
  timeline?: Maybe<ActivityCollection>;
  /**
   * Total amount of favorites attached to streams owned by the user
   * @deprecated Part of the old API surface and will be removed in the future.
   */
  totalOwnedStreamsFavorites: Scalars['Int']['output'];
  verified?: Maybe<Scalars['Boolean']['output']>;
  /**
   * Get (count of) user's versions. By default gets all versions of all projects the user has access to.
   * Set authoredOnly=true to only retrieve versions authored by the user.
   *
   * Note: Only count resolution is currently implemented
   */
  versions: CountOnlyCollection;
  /** Get all invitations to workspaces that the active user has */
  workspaceInvites: Array<PendingWorkspaceCollaborator>;
  workspaceJoinRequests?: Maybe<LimitedWorkspaceJoinRequestCollection>;
  /** Get the workspaces for the user */
  workspaces: WorkspaceCollection;
};


/**
 * Full user type, should only be used in the context of admin operations or
 * when a user is reading/writing info about himself
 */
export type UserActivityArgs = {
  actionType?: InputMaybe<Scalars['String']['input']>;
  after?: InputMaybe<Scalars['DateTime']['input']>;
  before?: InputMaybe<Scalars['DateTime']['input']>;
  cursor?: InputMaybe<Scalars['DateTime']['input']>;
  limit?: Scalars['Int']['input'];
};


/**
 * Full user type, should only be used in the context of admin operations or
 * when a user is reading/writing info about himself
 */
export type UserAutomateFunctionsArgs = {
  cursor?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<AutomateFunctionsFilter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
};


/**
 * Full user type, should only be used in the context of admin operations or
 * when a user is reading/writing info about himself
 */
export type UserCommitsArgs = {
  cursor?: InputMaybe<Scalars['String']['input']>;
  limit?: Scalars['Int']['input'];
};


/**
 * Full user type, should only be used in the context of admin operations or
 * when a user is reading/writing info about himself
 */
export type UserFavoriteStreamsArgs = {
  cursor?: InputMaybe<Scalars['String']['input']>;
  limit?: Scalars['Int']['input'];
};


/**
 * Full user type, should only be used in the context of admin operations or
 * when a user is reading/writing info about himself
 */
export type UserProjectAccessRequestArgs = {
  projectId: Scalars['String']['input'];
};


/**
 * Full user type, should only be used in the context of admin operations or
 * when a user is reading/writing info about himself
 */
export type UserProjectsArgs = {
  cursor?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<UserProjectsFilter>;
  limit?: Scalars['Int']['input'];
  sortBy?: InputMaybe<Array<Scalars['String']['input']>>;
};


/**
 * Full user type, should only be used in the context of admin operations or
 * when a user is reading/writing info about himself
 */
export type UserStreamsArgs = {
  cursor?: InputMaybe<Scalars['String']['input']>;
  limit?: Scalars['Int']['input'];
};


/**
 * Full user type, should only be used in the context of admin operations or
 * when a user is reading/writing info about himself
 */
export type UserTimelineArgs = {
  after?: InputMaybe<Scalars['DateTime']['input']>;
  before?: InputMaybe<Scalars['DateTime']['input']>;
  cursor?: InputMaybe<Scalars['DateTime']['input']>;
  limit?: Scalars['Int']['input'];
};


/**
 * Full user type, should only be used in the context of admin operations or
 * when a user is reading/writing info about himself
 */
export type UserVersionsArgs = {
  authoredOnly?: Scalars['Boolean']['input'];
  limit?: Scalars['Int']['input'];
};


/**
 * Full user type, should only be used in the context of admin operations or
 * when a user is reading/writing info about himself
 */
export type UserWorkspaceJoinRequestsArgs = {
  cursor?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<WorkspaceJoinRequestFilter>;
  limit?: Scalars['Int']['input'];
};


/**
 * Full user type, should only be used in the context of admin operations or
 * when a user is reading/writing info about himself
 */
export type UserWorkspacesArgs = {
  cursor?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<UserWorkspacesFilter>;
  limit?: Scalars['Int']['input'];
};

export type UserAutomateInfo = {
  __typename?: 'UserAutomateInfo';
  availableGithubOrgs: Array<Scalars['String']['output']>;
  hasAutomateGithubApp: Scalars['Boolean']['output'];
};

export type UserDeleteInput = {
  email: Scalars['String']['input'];
};

export type UserEmail = {
  __typename?: 'UserEmail';
  email: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  primary: Scalars['Boolean']['output'];
  userId: Scalars['ID']['output'];
  verified: Scalars['Boolean']['output'];
};

export type UserEmailMutations = {
  __typename?: 'UserEmailMutations';
  create: User;
  delete: User;
  requestNewEmailVerification?: Maybe<Scalars['Boolean']['output']>;
  setPrimary: User;
  verify?: Maybe<Scalars['Boolean']['output']>;
};


export type UserEmailMutationsCreateArgs = {
  input: CreateUserEmailInput;
};


export type UserEmailMutationsDeleteArgs = {
  input: DeleteUserEmailInput;
};


export type UserEmailMutationsRequestNewEmailVerificationArgs = {
  input: EmailVerificationRequestInput;
};


export type UserEmailMutationsSetPrimaryArgs = {
  input: SetPrimaryUserEmailInput;
};


export type UserEmailMutationsVerifyArgs = {
  input: VerifyUserEmailInput;
};

export type UserGendoAiCredits = {
  __typename?: 'UserGendoAICredits';
  limit: Scalars['Int']['output'];
  resetDate: Scalars['DateTime']['output'];
  used: Scalars['Int']['output'];
};

export type UserMeta = {
  __typename?: 'UserMeta';
  legacyProjectsExplainerCollapsed: Scalars['Boolean']['output'];
  newWorkspaceExplainerDismissed: Scalars['Boolean']['output'];
  speckleConBannerDismissed: Scalars['Boolean']['output'];
};

export type UserMetaMutations = {
  __typename?: 'UserMetaMutations';
  setLegacyProjectsExplainerCollapsed: Scalars['Boolean']['output'];
  setNewWorkspaceExplainerDismissed: Scalars['Boolean']['output'];
  setSpeckleConBannerDismissed: Scalars['Boolean']['output'];
};


export type UserMetaMutationsSetLegacyProjectsExplainerCollapsedArgs = {
  value: Scalars['Boolean']['input'];
};


export type UserMetaMutationsSetNewWorkspaceExplainerDismissedArgs = {
  value: Scalars['Boolean']['input'];
};


export type UserMetaMutationsSetSpeckleConBannerDismissedArgs = {
  value: Scalars['Boolean']['input'];
};

export type UserProjectCollection = {
  __typename?: 'UserProjectCollection';
  cursor?: Maybe<Scalars['String']['output']>;
  items: Array<Project>;
  numberOfHidden: Scalars['Int']['output'];
  totalCount: Scalars['Int']['output'];
};

export type UserProjectsFilter = {
  /**
   * If set to true, will also include streams that the user may not have an explicit role on,
   * but has implicit access to because of workspaces
   */
  includeImplicitAccess?: InputMaybe<Scalars['Boolean']['input']>;
  /** Only include projects where user has the specified roles */
  onlyWithRoles?: InputMaybe<Array<Scalars['String']['input']>>;
  /** Only include personal projects (not in any workspace) */
  personalOnly?: InputMaybe<Scalars['Boolean']['input']>;
  /** Filter out projects by name */
  search?: InputMaybe<Scalars['String']['input']>;
  /** Only include projects in the specified workspace */
  workspaceId?: InputMaybe<Scalars['ID']['input']>;
};

export type UserProjectsUpdatedMessage = {
  __typename?: 'UserProjectsUpdatedMessage';
  /** Project ID */
  id: Scalars['String']['output'];
  /** Project entity, null if project was deleted */
  project?: Maybe<Project>;
  /** Message type */
  type: UserProjectsUpdatedMessageType;
};

export const UserProjectsUpdatedMessageType = {
  Added: 'ADDED',
  Removed: 'REMOVED'
} as const;

export type UserProjectsUpdatedMessageType = typeof UserProjectsUpdatedMessageType[keyof typeof UserProjectsUpdatedMessageType];
export type UserRoleInput = {
  id: Scalars['String']['input'];
  role: Scalars['String']['input'];
};

export type UserSearchResultCollection = {
  __typename?: 'UserSearchResultCollection';
  cursor?: Maybe<Scalars['String']['output']>;
  items: Array<LimitedUser>;
};

export type UserStreamCollection = {
  __typename?: 'UserStreamCollection';
  cursor?: Maybe<Scalars['String']['output']>;
  items?: Maybe<Array<Stream>>;
  numberOfHidden: Scalars['Int']['output'];
  totalCount: Scalars['Int']['output'];
};

export type UserUpdateInput = {
  avatar?: InputMaybe<Scalars['String']['input']>;
  bio?: InputMaybe<Scalars['String']['input']>;
  company?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

export type UserWorkspacesFilter = {
  completed?: InputMaybe<Scalars['Boolean']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
};

export type UsersRetrievalInput = {
  cursor?: InputMaybe<Scalars['String']['input']>;
  /** Only find users with directly matching emails */
  emailOnly?: InputMaybe<Scalars['Boolean']['input']>;
  /** Limit defaults to 10 */
  limit?: InputMaybe<Scalars['Int']['input']>;
  /** Only find users that are collaborators of the specified project */
  projectId?: InputMaybe<Scalars['String']['input']>;
  /** The query looks for matches in user name & email */
  query: Scalars['String']['input'];
};

export type VerifyUserEmailInput = {
  code: Scalars['String']['input'];
  email: Scalars['String']['input'];
};

export type Version = {
  __typename?: 'Version';
  authorUser?: Maybe<LimitedUser>;
  automationsStatus?: Maybe<TriggeredAutomationsStatus>;
  /** All comment threads in this version */
  commentThreads: CommentCollection;
  createdAt: Scalars['DateTime']['output'];
  gendoAIRender: GendoAiRender;
  gendoAIRenders: GendoAiRenderCollection;
  id: Scalars['ID']['output'];
  message?: Maybe<Scalars['String']['output']>;
  model: Model;
  parents?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  permissions: VersionPermissionChecks;
  previewUrl: Scalars['String']['output'];
  referencedObject?: Maybe<Scalars['String']['output']>;
  sourceApplication?: Maybe<Scalars['String']['output']>;
  totalChildrenCount?: Maybe<Scalars['Int']['output']>;
};


export type VersionCommentThreadsArgs = {
  cursor?: InputMaybe<Scalars['String']['input']>;
  limit?: Scalars['Int']['input'];
};


export type VersionGendoAiRenderArgs = {
  id: Scalars['String']['input'];
};

export type VersionCollection = {
  __typename?: 'VersionCollection';
  cursor?: Maybe<Scalars['String']['output']>;
  items: Array<Version>;
  totalCount: Scalars['Int']['output'];
};

export type VersionCreatedTrigger = {
  __typename?: 'VersionCreatedTrigger';
  model?: Maybe<Model>;
  type: AutomateRunTriggerType;
  version?: Maybe<Version>;
};

export type VersionCreatedTriggerDefinition = {
  __typename?: 'VersionCreatedTriggerDefinition';
  model?: Maybe<Model>;
  type: AutomateRunTriggerType;
};

export type VersionMutations = {
  __typename?: 'VersionMutations';
  create: Version;
  delete: Scalars['Boolean']['output'];
  markReceived: Scalars['Boolean']['output'];
  moveToModel: Model;
  requestGendoAIRender: Scalars['Boolean']['output'];
  update: Version;
};


export type VersionMutationsCreateArgs = {
  input: CreateVersionInput;
};


export type VersionMutationsDeleteArgs = {
  input: DeleteVersionsInput;
};


export type VersionMutationsMarkReceivedArgs = {
  input: MarkReceivedVersionInput;
};


export type VersionMutationsMoveToModelArgs = {
  input: MoveVersionsInput;
};


export type VersionMutationsRequestGendoAiRenderArgs = {
  input: GendoAiRenderInput;
};


export type VersionMutationsUpdateArgs = {
  input: UpdateVersionInput;
};

export type VersionPermissionChecks = {
  __typename?: 'VersionPermissionChecks';
  canReceive: PermissionCheckResult;
  canUpdate: PermissionCheckResult;
};

export type ViewerResourceGroup = {
  __typename?: 'ViewerResourceGroup';
  /** Resource identifier used to refer to a collection of resource items */
  identifier: Scalars['String']['output'];
  /** Viewer resources that the identifier refers to */
  items: Array<ViewerResourceItem>;
};

export type ViewerResourceItem = {
  __typename?: 'ViewerResourceItem';
  /** Null if resource represents an object */
  modelId?: Maybe<Scalars['String']['output']>;
  objectId: Scalars['String']['output'];
  /** Null if resource represents an object */
  versionId?: Maybe<Scalars['String']['output']>;
};

export type ViewerUpdateTrackingTarget = {
  /**
   * By default if resourceIdString is set, the "versionId" part of model resource identifiers will be ignored
   * and all updates to of all versions of any of the referenced models will be returned. If `loadedVersionsOnly` is
   * enabled, then only updates of loaded/referenced versions in resourceIdString will be returned.
   */
  loadedVersionsOnly?: InputMaybe<Scalars['Boolean']['input']>;
  projectId: Scalars['String']['input'];
  /**
   * Only request updates to the resources identified by this
   * comma-delimited resouce string (same format that's used in the viewer URL)
   */
  resourceIdString: Scalars['String']['input'];
};

export type ViewerUserActivityMessage = {
  __typename?: 'ViewerUserActivityMessage';
  sessionId: Scalars['String']['output'];
  /** SerializedViewerState, only null if DISCONNECTED */
  state?: Maybe<Scalars['JSONObject']['output']>;
  status: ViewerUserActivityStatus;
  user?: Maybe<LimitedUser>;
  userId?: Maybe<Scalars['String']['output']>;
  userName: Scalars['String']['output'];
};

export type ViewerUserActivityMessageInput = {
  sessionId: Scalars['String']['input'];
  /** SerializedViewerState, only null if DISCONNECTED */
  state?: InputMaybe<Scalars['JSONObject']['input']>;
  status: ViewerUserActivityStatus;
  userId?: InputMaybe<Scalars['String']['input']>;
  userName: Scalars['String']['input'];
};

export const ViewerUserActivityStatus = {
  Disconnected: 'DISCONNECTED',
  Viewing: 'VIEWING'
} as const;

export type ViewerUserActivityStatus = typeof ViewerUserActivityStatus[keyof typeof ViewerUserActivityStatus];
export type Webhook = {
  __typename?: 'Webhook';
  description?: Maybe<Scalars['String']['output']>;
  enabled?: Maybe<Scalars['Boolean']['output']>;
  hasSecret: Scalars['Boolean']['output'];
  history?: Maybe<WebhookEventCollection>;
  id: Scalars['String']['output'];
  projectId: Scalars['String']['output'];
  streamId: Scalars['String']['output'];
  triggers: Array<Scalars['String']['output']>;
  url: Scalars['String']['output'];
};


export type WebhookHistoryArgs = {
  limit?: Scalars['Int']['input'];
};

export type WebhookCollection = {
  __typename?: 'WebhookCollection';
  items: Array<Webhook>;
  totalCount: Scalars['Int']['output'];
};

export type WebhookCreateInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  enabled?: InputMaybe<Scalars['Boolean']['input']>;
  secret?: InputMaybe<Scalars['String']['input']>;
  streamId: Scalars['String']['input'];
  triggers: Array<Scalars['String']['input']>;
  url: Scalars['String']['input'];
};

export type WebhookDeleteInput = {
  id: Scalars['String']['input'];
  streamId: Scalars['String']['input'];
};

export type WebhookEvent = {
  __typename?: 'WebhookEvent';
  id: Scalars['String']['output'];
  lastUpdate: Scalars['DateTime']['output'];
  payload: Scalars['String']['output'];
  retryCount: Scalars['Int']['output'];
  status: Scalars['Int']['output'];
  statusInfo: Scalars['String']['output'];
  webhookId: Scalars['String']['output'];
};

export type WebhookEventCollection = {
  __typename?: 'WebhookEventCollection';
  items?: Maybe<Array<Maybe<WebhookEvent>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type WebhookUpdateInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  enabled?: InputMaybe<Scalars['Boolean']['input']>;
  id: Scalars['String']['input'];
  secret?: InputMaybe<Scalars['String']['input']>;
  streamId: Scalars['String']['input'];
  triggers?: InputMaybe<Array<Scalars['String']['input']>>;
  url?: InputMaybe<Scalars['String']['input']>;
};

export type Workspace = {
  __typename?: 'Workspace';
  /** Get all join requests for all the workspaces the user is an admin of */
  adminWorkspacesJoinRequests?: Maybe<WorkspaceJoinRequestCollection>;
  automateFunctions: AutomateFunctionCollection;
  createdAt: Scalars['DateTime']['output'];
  /** Info about the workspace creation state */
  creationState?: Maybe<WorkspaceCreationState>;
  customerPortalUrl?: Maybe<Scalars['String']['output']>;
  /**
   * The default role workspace members will receive for workspace projects.
   * @deprecated Always the reviewer role. Will be removed in the future.
   */
  defaultProjectRole: Scalars['String']['output'];
  /**
   * The default region where project data will be stored, if set. If undefined, defaults to main/default
   * region.
   */
  defaultRegion?: Maybe<ServerRegionItem>;
  /** The default seat assigned to users that join a workspace. Used during workspace discovery or on invites without seat types. */
  defaultSeatType: WorkspaceSeatType;
  description?: Maybe<Scalars['String']['output']>;
  /** If true, allow users to automatically join discoverable workspaces (instead of requesting to join) */
  discoverabilityAutoJoinEnabled: Scalars['Boolean']['output'];
  /** Enable/Disable discovery of the workspace */
  discoverabilityEnabled: Scalars['Boolean']['output'];
  /** Enable/Disable restriction to invite users to workspace as Guests only */
  domainBasedMembershipProtectionEnabled: Scalars['Boolean']['output'];
  /** Verified workspace domains */
  domains?: Maybe<Array<WorkspaceDomain>>;
  /** Workspace-level configuration for models in embedded viewer */
  embedOptions: WorkspaceEmbedOptions;
  hasAccessToFeature: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  /** Only available to workspace owners/members */
  invitedTeam?: Maybe<Array<PendingWorkspaceCollaborator>>;
  /** Exclusive workspaces do not allow their workspace members to create or join other workspaces as members. */
  isExclusive: Scalars['Boolean']['output'];
  /** Logo image as base64-encoded string */
  logo?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  permissions: WorkspacePermissionChecks;
  plan?: Maybe<WorkspacePlan>;
  /** Shows the plan prices localized for the given workspace */
  planPrices?: Maybe<WorkspacePaidPlanPrices>;
  projects: ProjectCollection;
  /** A Workspace is marked as readOnly if its trial period is finished or a paid plan is subscribed but payment has failed */
  readOnly: Scalars['Boolean']['output'];
  /** Active user's role for this workspace. `null` if request is not authenticated, or the workspace is not explicitly shared with you. */
  role?: Maybe<Scalars['String']['output']>;
  /** Active user's seat type for this workspace. `null` if request is not authenticated, or the workspace is not explicitly shared with you. */
  seatType?: Maybe<WorkspaceSeatType>;
  seats?: Maybe<WorkspaceSubscriptionSeats>;
  slug: Scalars['String']['output'];
  /** Information about the workspace's SSO configuration and the current user's SSO session, if present */
  sso?: Maybe<WorkspaceSso>;
  subscription?: Maybe<WorkspaceSubscription>;
  team: WorkspaceCollaboratorCollection;
  teamByRole: WorkspaceTeamByRole;
  updatedAt: Scalars['DateTime']['output'];
};


export type WorkspaceAdminWorkspacesJoinRequestsArgs = {
  cursor?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<AdminWorkspaceJoinRequestFilter>;
  limit?: Scalars['Int']['input'];
};


export type WorkspaceAutomateFunctionsArgs = {
  cursor?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<AutomateFunctionsFilter>;
  limit?: Scalars['Int']['input'];
};


export type WorkspaceHasAccessToFeatureArgs = {
  featureName: WorkspaceFeatureName;
};


export type WorkspaceInvitedTeamArgs = {
  filter?: InputMaybe<PendingWorkspaceCollaboratorsFilter>;
};


export type WorkspaceProjectsArgs = {
  cursor?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<WorkspaceProjectsFilter>;
  limit?: Scalars['Int']['input'];
};


export type WorkspaceTeamArgs = {
  cursor?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<WorkspaceTeamFilter>;
  limit?: Scalars['Int']['input'];
};

export type WorkspaceBillingMutations = {
  __typename?: 'WorkspaceBillingMutations';
  cancelCheckoutSession: Scalars['Boolean']['output'];
  createCheckoutSession: CheckoutSession;
  upgradePlan: Scalars['Boolean']['output'];
};


export type WorkspaceBillingMutationsCancelCheckoutSessionArgs = {
  input: CancelCheckoutSessionInput;
};


export type WorkspaceBillingMutationsCreateCheckoutSessionArgs = {
  input: CheckoutSessionInput;
};


export type WorkspaceBillingMutationsUpgradePlanArgs = {
  input: UpgradePlanInput;
};

/** Overridden by `WorkspaceCollaboratorGraphQLReturn` */
export type WorkspaceCollaborator = {
  __typename?: 'WorkspaceCollaborator';
  email?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  /** Date that the user joined the workspace. */
  joinDate: Scalars['DateTime']['output'];
  projectRoles: Array<ProjectRole>;
  role: Scalars['String']['output'];
  seatType?: Maybe<WorkspaceSeatType>;
  user: LimitedUser;
};

export type WorkspaceCollaboratorCollection = {
  __typename?: 'WorkspaceCollaboratorCollection';
  cursor?: Maybe<Scalars['String']['output']>;
  items: Array<WorkspaceCollaborator>;
  totalCount: Scalars['Int']['output'];
};

export type WorkspaceCollection = {
  __typename?: 'WorkspaceCollection';
  cursor?: Maybe<Scalars['String']['output']>;
  items: Array<Workspace>;
  totalCount: Scalars['Int']['output'];
};

export type WorkspaceCreateInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  /** Add this domain to the workspace as a verified domain and enable domain discoverability */
  enableDomainDiscoverabilityForDomain?: InputMaybe<Scalars['String']['input']>;
  /** Logo image as base64-encoded string */
  logo?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  slug?: InputMaybe<Scalars['String']['input']>;
};

export type WorkspaceCreationState = {
  __typename?: 'WorkspaceCreationState';
  completed: Scalars['Boolean']['output'];
  state: Scalars['JSONObject']['output'];
};

export type WorkspaceCreationStateInput = {
  completed: Scalars['Boolean']['input'];
  state: Scalars['JSONObject']['input'];
  workspaceId: Scalars['ID']['input'];
};

export type WorkspaceDismissInput = {
  workspaceId: Scalars['ID']['input'];
};

export type WorkspaceDomain = {
  __typename?: 'WorkspaceDomain';
  domain: Scalars['String']['output'];
  id: Scalars['ID']['output'];
};

export type WorkspaceDomainDeleteInput = {
  id: Scalars['ID']['input'];
  workspaceId: Scalars['ID']['input'];
};

export type WorkspaceEmbedOptions = {
  __typename?: 'WorkspaceEmbedOptions';
  hideSpeckleBranding: Scalars['Boolean']['output'];
};

export const WorkspaceFeatureName = {
  DomainBasedSecurityPolicies: 'domainBasedSecurityPolicies',
  ExclusiveMembership: 'exclusiveMembership',
  HideSpeckleBranding: 'hideSpeckleBranding',
  OidcSso: 'oidcSso',
  WorkspaceDataRegionSpecificity: 'workspaceDataRegionSpecificity'
} as const;

export type WorkspaceFeatureName = typeof WorkspaceFeatureName[keyof typeof WorkspaceFeatureName];
export type WorkspaceInviteCreateInput = {
  /** Either this or userId must be filled */
  email?: InputMaybe<Scalars['String']['input']>;
  /** Defaults to the member role, if not specified */
  role?: InputMaybe<WorkspaceRole>;
  /** The workspace seat type to assign to the user upon accepting the invite. */
  seatType?: InputMaybe<WorkspaceSeatType>;
  /** Defaults to User, if not specified */
  serverRole?: InputMaybe<ServerRole>;
  /** Either this or email must be filled */
  userId?: InputMaybe<Scalars['String']['input']>;
};

export type WorkspaceInviteLookupOptions = {
  /** If true, the query will assume workspaceId is actually the workspace slug, and do the lookup by slug */
  useSlug?: InputMaybe<Scalars['Boolean']['input']>;
};

export type WorkspaceInviteMutations = {
  __typename?: 'WorkspaceInviteMutations';
  batchCreate: Workspace;
  cancel: Workspace;
  create: Workspace;
  resend: Scalars['Boolean']['output'];
  use: Scalars['Boolean']['output'];
};


export type WorkspaceInviteMutationsBatchCreateArgs = {
  input: Array<WorkspaceInviteCreateInput>;
  workspaceId: Scalars['String']['input'];
};


export type WorkspaceInviteMutationsCancelArgs = {
  inviteId: Scalars['String']['input'];
  workspaceId: Scalars['String']['input'];
};


export type WorkspaceInviteMutationsCreateArgs = {
  input: WorkspaceInviteCreateInput;
  workspaceId: Scalars['String']['input'];
};


export type WorkspaceInviteMutationsResendArgs = {
  input: WorkspaceInviteResendInput;
};


export type WorkspaceInviteMutationsUseArgs = {
  input: WorkspaceInviteUseInput;
};

export type WorkspaceInviteResendInput = {
  inviteId: Scalars['String']['input'];
  workspaceId: Scalars['String']['input'];
};

export type WorkspaceInviteUseInput = {
  accept: Scalars['Boolean']['input'];
  /**
   * If invite is attached to an unregistered email, the invite can only be used if this is set to true.
   * Upon accepting such an invite, the unregistered email will be added to the user's account as well.
   */
  addNewEmail?: InputMaybe<Scalars['Boolean']['input']>;
  token: Scalars['String']['input'];
};

export type WorkspaceJoinRequest = {
  __typename?: 'WorkspaceJoinRequest';
  createdAt: Scalars['DateTime']['output'];
  email?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  status: WorkspaceJoinRequestStatus;
  user: LimitedUser;
  workspace: Workspace;
};

export type WorkspaceJoinRequestCollection = {
  __typename?: 'WorkspaceJoinRequestCollection';
  cursor?: Maybe<Scalars['String']['output']>;
  items: Array<WorkspaceJoinRequest>;
  totalCount: Scalars['Int']['output'];
};

export type WorkspaceJoinRequestFilter = {
  status?: InputMaybe<WorkspaceJoinRequestStatus>;
};

export type WorkspaceJoinRequestMutations = {
  __typename?: 'WorkspaceJoinRequestMutations';
  approve: Scalars['Boolean']['output'];
  deny: Scalars['Boolean']['output'];
};


export type WorkspaceJoinRequestMutationsApproveArgs = {
  input: ApproveWorkspaceJoinRequestInput;
};


export type WorkspaceJoinRequestMutationsDenyArgs = {
  input: DenyWorkspaceJoinRequestInput;
};

export const WorkspaceJoinRequestStatus = {
  Approved: 'approved',
  Denied: 'denied',
  Pending: 'pending'
} as const;

export type WorkspaceJoinRequestStatus = typeof WorkspaceJoinRequestStatus[keyof typeof WorkspaceJoinRequestStatus];
export type WorkspaceMutations = {
  __typename?: 'WorkspaceMutations';
  addDomain: Workspace;
  billing: WorkspaceBillingMutations;
  create: Workspace;
  delete: Scalars['Boolean']['output'];
  deleteDomain: Workspace;
  deleteSsoProvider: Scalars['Boolean']['output'];
  /** Dismiss a workspace from the discoverable list, behind the scene a join request is created with the status "dismissed" */
  dismiss: Scalars['Boolean']['output'];
  invites: WorkspaceInviteMutations;
  leave: Scalars['Boolean']['output'];
  projects: WorkspaceProjectMutations;
  requestToJoin: Scalars['Boolean']['output'];
  /** Set the default region where project data will be stored. Only available to admins. */
  setDefaultRegion: Workspace;
  update: Workspace;
  updateCreationState: Scalars['Boolean']['output'];
  updateEmbedOptions: WorkspaceEmbedOptions;
  updateRole: Workspace;
  updateSeatType: Workspace;
};


export type WorkspaceMutationsAddDomainArgs = {
  input: AddDomainToWorkspaceInput;
};


export type WorkspaceMutationsCreateArgs = {
  input: WorkspaceCreateInput;
};


export type WorkspaceMutationsDeleteArgs = {
  workspaceId: Scalars['String']['input'];
};


export type WorkspaceMutationsDeleteDomainArgs = {
  input: WorkspaceDomainDeleteInput;
};


export type WorkspaceMutationsDeleteSsoProviderArgs = {
  workspaceId: Scalars['String']['input'];
};


export type WorkspaceMutationsDismissArgs = {
  input: WorkspaceDismissInput;
};


export type WorkspaceMutationsLeaveArgs = {
  id: Scalars['ID']['input'];
};


export type WorkspaceMutationsRequestToJoinArgs = {
  input: WorkspaceRequestToJoinInput;
};


export type WorkspaceMutationsSetDefaultRegionArgs = {
  regionKey: Scalars['String']['input'];
  workspaceId: Scalars['String']['input'];
};


export type WorkspaceMutationsUpdateArgs = {
  input: WorkspaceUpdateInput;
};


export type WorkspaceMutationsUpdateCreationStateArgs = {
  input: WorkspaceCreationStateInput;
};


export type WorkspaceMutationsUpdateEmbedOptionsArgs = {
  input: WorkspaceUpdateEmbedOptionsInput;
};


export type WorkspaceMutationsUpdateRoleArgs = {
  input: WorkspaceRoleUpdateInput;
};


export type WorkspaceMutationsUpdateSeatTypeArgs = {
  input: WorkspaceUpdateSeatTypeInput;
};

export type WorkspacePaidPlanPrices = {
  __typename?: 'WorkspacePaidPlanPrices';
  pro: WorkspacePlanPrice;
  proUnlimited: WorkspacePlanPrice;
  team: WorkspacePlanPrice;
  teamUnlimited: WorkspacePlanPrice;
};

export const WorkspacePaymentMethod = {
  Billing: 'billing',
  Invoice: 'invoice',
  Unpaid: 'unpaid'
} as const;

export type WorkspacePaymentMethod = typeof WorkspacePaymentMethod[keyof typeof WorkspacePaymentMethod];
export type WorkspacePermissionChecks = {
  __typename?: 'WorkspacePermissionChecks';
  canCreateProject: PermissionCheckResult;
  canEditEmbedOptions: PermissionCheckResult;
  canInvite: PermissionCheckResult;
  canMakeWorkspaceExclusive: PermissionCheckResult;
  canMoveProjectToWorkspace: PermissionCheckResult;
  canReadMemberEmail: PermissionCheckResult;
};


export type WorkspacePermissionChecksCanMoveProjectToWorkspaceArgs = {
  projectId?: InputMaybe<Scalars['String']['input']>;
};

export type WorkspacePlan = {
  __typename?: 'WorkspacePlan';
  createdAt: Scalars['DateTime']['output'];
  name: WorkspacePlans;
  paymentMethod: WorkspacePaymentMethod;
  status: WorkspacePlanStatuses;
  usage: WorkspacePlanUsage;
};

export type WorkspacePlanPrice = {
  __typename?: 'WorkspacePlanPrice';
  monthly: Price;
  yearly: Price;
};

export const WorkspacePlanStatuses = {
  CancelationScheduled: 'cancelationScheduled',
  Canceled: 'canceled',
  PaymentFailed: 'paymentFailed',
  Valid: 'valid'
} as const;

export type WorkspacePlanStatuses = typeof WorkspacePlanStatuses[keyof typeof WorkspacePlanStatuses];
export type WorkspacePlanUsage = {
  __typename?: 'WorkspacePlanUsage';
  modelCount: Scalars['Int']['output'];
  projectCount: Scalars['Int']['output'];
};

export const WorkspacePlans = {
  Academia: 'academia',
  Enterprise: 'enterprise',
  Free: 'free',
  Pro: 'pro',
  ProUnlimited: 'proUnlimited',
  ProUnlimitedInvoiced: 'proUnlimitedInvoiced',
  Team: 'team',
  TeamUnlimited: 'teamUnlimited',
  TeamUnlimitedInvoiced: 'teamUnlimitedInvoiced',
  Unlimited: 'unlimited'
} as const;

export type WorkspacePlans = typeof WorkspacePlans[keyof typeof WorkspacePlans];
export type WorkspaceProjectCreateInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  visibility?: InputMaybe<ProjectVisibility>;
  workspaceId: Scalars['String']['input'];
};

export type WorkspaceProjectInviteCreateInput = {
  /** Either this or userId must be filled */
  email?: InputMaybe<Scalars['String']['input']>;
  /** Defaults to the contributor role, if not specified */
  role?: InputMaybe<Scalars['String']['input']>;
  /**
   * The workspace seat type to assign to the user upon accepting the invite
   * (if user is a workspace member already, the seat type will be updated)
   */
  seatType?: InputMaybe<WorkspaceSeatType>;
  /** Can only be specified if guest mode is on or if the user is an admin */
  serverRole?: InputMaybe<Scalars['String']['input']>;
  /** Either this or email must be filled */
  userId?: InputMaybe<Scalars['String']['input']>;
  /** Only taken into account, if project belongs to a workspace. Defaults to guest access. */
  workspaceRole?: InputMaybe<Scalars['String']['input']>;
};

export type WorkspaceProjectMutations = {
  __typename?: 'WorkspaceProjectMutations';
  create: Project;
  /**
   * Schedule a job that will:
   * - Move all regional data to target region
   * - Update project region key
   * - TODO: Eventually delete data in previous region
   */
  moveToRegion: Scalars['String']['output'];
  moveToWorkspace: Project;
  updateRole: Project;
};


export type WorkspaceProjectMutationsCreateArgs = {
  input: WorkspaceProjectCreateInput;
};


export type WorkspaceProjectMutationsMoveToRegionArgs = {
  projectId: Scalars['String']['input'];
  regionKey: Scalars['String']['input'];
};


export type WorkspaceProjectMutationsMoveToWorkspaceArgs = {
  projectId: Scalars['String']['input'];
  workspaceId: Scalars['String']['input'];
};


export type WorkspaceProjectMutationsUpdateRoleArgs = {
  input: ProjectUpdateRoleInput;
};

export type WorkspaceProjectsFilter = {
  /** Filter out projects by name */
  search?: InputMaybe<Scalars['String']['input']>;
  /** Only return workspace projects that the active user has an explicit project role in */
  withProjectRoleOnly?: InputMaybe<Scalars['Boolean']['input']>;
};

export type WorkspaceProjectsUpdatedMessage = {
  __typename?: 'WorkspaceProjectsUpdatedMessage';
  /** Project entity, null if project was deleted */
  project?: Maybe<Project>;
  /** Project ID */
  projectId: Scalars['String']['output'];
  /** Message type */
  type: WorkspaceProjectsUpdatedMessageType;
  /** Workspace ID */
  workspaceId: Scalars['String']['output'];
};

export const WorkspaceProjectsUpdatedMessageType = {
  Added: 'ADDED',
  Removed: 'REMOVED'
} as const;

export type WorkspaceProjectsUpdatedMessageType = typeof WorkspaceProjectsUpdatedMessageType[keyof typeof WorkspaceProjectsUpdatedMessageType];
export type WorkspaceRequestToJoinInput = {
  workspaceId: Scalars['ID']['input'];
};

export const WorkspaceRole = {
  Admin: 'ADMIN',
  Guest: 'GUEST',
  Member: 'MEMBER'
} as const;

export type WorkspaceRole = typeof WorkspaceRole[keyof typeof WorkspaceRole];
export type WorkspaceRoleCollection = {
  __typename?: 'WorkspaceRoleCollection';
  totalCount: Scalars['Int']['output'];
};

export type WorkspaceRoleDeleteInput = {
  userId: Scalars['String']['input'];
  workspaceId: Scalars['String']['input'];
};

export type WorkspaceRoleUpdateInput = {
  /** Leave role null to revoke access entirely */
  role?: InputMaybe<Scalars['String']['input']>;
  userId: Scalars['String']['input'];
  workspaceId: Scalars['String']['input'];
};

export type WorkspaceSeatCollection = {
  __typename?: 'WorkspaceSeatCollection';
  totalCount: Scalars['Int']['output'];
};

export const WorkspaceSeatType = {
  Editor: 'editor',
  Viewer: 'viewer'
} as const;

export type WorkspaceSeatType = typeof WorkspaceSeatType[keyof typeof WorkspaceSeatType];
export type WorkspaceSeatsByType = {
  __typename?: 'WorkspaceSeatsByType';
  editors?: Maybe<WorkspaceSeatCollection>;
  viewers?: Maybe<WorkspaceSeatCollection>;
};

export type WorkspaceSso = {
  __typename?: 'WorkspaceSso';
  /** If null, the workspace does not have SSO configured */
  provider?: Maybe<WorkspaceSsoProvider>;
  session?: Maybe<WorkspaceSsoSession>;
};

export type WorkspaceSsoProvider = {
  __typename?: 'WorkspaceSsoProvider';
  clientId: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  issuerUrl: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

export type WorkspaceSsoSession = {
  __typename?: 'WorkspaceSsoSession';
  createdAt: Scalars['DateTime']['output'];
  validUntil: Scalars['DateTime']['output'];
};

export type WorkspaceSubscription = {
  __typename?: 'WorkspaceSubscription';
  billingInterval: BillingInterval;
  createdAt: Scalars['DateTime']['output'];
  currency: Currency;
  currentBillingCycleEnd: Scalars['DateTime']['output'];
  seats: WorkspaceSubscriptionSeats;
  updatedAt: Scalars['DateTime']['output'];
};

export type WorkspaceSubscriptionSeatCount = {
  __typename?: 'WorkspaceSubscriptionSeatCount';
  /** Total number of seats in use by workspace users */
  assigned: Scalars['Int']['output'];
  /** Total number of seats purchased and available in the current subscription cycle */
  available: Scalars['Int']['output'];
};

export type WorkspaceSubscriptionSeats = {
  __typename?: 'WorkspaceSubscriptionSeats';
  editors: WorkspaceSubscriptionSeatCount;
  viewers: WorkspaceSubscriptionSeatCount;
};

export type WorkspaceTeamByRole = {
  __typename?: 'WorkspaceTeamByRole';
  admins?: Maybe<WorkspaceRoleCollection>;
  guests?: Maybe<WorkspaceRoleCollection>;
  members?: Maybe<WorkspaceRoleCollection>;
};

export type WorkspaceTeamFilter = {
  /** Limit team members to provided role(s) */
  roles?: InputMaybe<Array<Scalars['String']['input']>>;
  /** Search for team members by name or email */
  search?: InputMaybe<Scalars['String']['input']>;
  seatType?: InputMaybe<WorkspaceSeatType>;
};

export type WorkspaceUpdateEmbedOptionsInput = {
  hideSpeckleBranding: Scalars['Boolean']['input'];
  workspaceId: Scalars['String']['input'];
};

export type WorkspaceUpdateInput = {
  /** @deprecated Always the reviewer role. Will be removed in the future. */
  defaultProjectRole?: InputMaybe<Scalars['String']['input']>;
  defaultSeatType?: InputMaybe<WorkspaceSeatType>;
  description?: InputMaybe<Scalars['String']['input']>;
  discoverabilityAutoJoinEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  discoverabilityEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  domainBasedMembershipProtectionEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  id: Scalars['String']['input'];
  isExclusive?: InputMaybe<Scalars['Boolean']['input']>;
  /** Logo image as base64-encoded string */
  logo?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
};

export type WorkspaceUpdateSeatTypeInput = {
  seatType: WorkspaceSeatType;
  userId: Scalars['String']['input'];
  workspaceId: Scalars['String']['input'];
};

export type WorkspaceUpdatedMessage = {
  __typename?: 'WorkspaceUpdatedMessage';
  /** Workspace ID */
  id: Scalars['String']['output'];
  /** Workspace itself */
  workspace: Workspace;
};



export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;



/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  ActiveUserMutations: ResolverTypeWrapper<MutationsObjectGraphQLReturn>;
  Activity: ResolverTypeWrapper<Activity>;
  ActivityCollection: ResolverTypeWrapper<ActivityCollectionGraphQLReturn>;
  AddDomainToWorkspaceInput: AddDomainToWorkspaceInput;
  AdminInviteList: ResolverTypeWrapper<Omit<AdminInviteList, 'items'> & { items: Array<ResolversTypes['ServerInvite']> }>;
  AdminMutations: ResolverTypeWrapper<MutationsObjectGraphQLReturn>;
  AdminQueries: ResolverTypeWrapper<GraphQLEmptyReturn>;
  AdminUpdateWorkspacePlanInput: AdminUpdateWorkspacePlanInput;
  AdminUserList: ResolverTypeWrapper<AdminUserList>;
  AdminUserListItem: ResolverTypeWrapper<AdminUserListItem>;
  AdminUsersListCollection: ResolverTypeWrapper<Omit<AdminUsersListCollection, 'items'> & { items: Array<ResolversTypes['AdminUsersListItem']> }>;
  AdminUsersListItem: ResolverTypeWrapper<Omit<AdminUsersListItem, 'invitedUser' | 'registeredUser'> & { invitedUser?: Maybe<ResolversTypes['ServerInvite']>, registeredUser?: Maybe<ResolversTypes['User']> }>;
  AdminWorkspaceJoinRequestFilter: AdminWorkspaceJoinRequestFilter;
  ApiToken: ResolverTypeWrapper<ApiToken>;
  ApiTokenCreateInput: ApiTokenCreateInput;
  AppAuthor: ResolverTypeWrapper<AppAuthor>;
  AppCreateInput: AppCreateInput;
  AppTokenCreateInput: AppTokenCreateInput;
  AppUpdateInput: AppUpdateInput;
  ApproveWorkspaceJoinRequestInput: ApproveWorkspaceJoinRequestInput;
  ArchiveCommentInput: ArchiveCommentInput;
  AuthStrategy: ResolverTypeWrapper<AuthStrategy>;
  AutomateAuthCodePayloadTest: AutomateAuthCodePayloadTest;
  AutomateAuthCodeResources: AutomateAuthCodeResources;
  AutomateFunction: ResolverTypeWrapper<AutomateFunctionGraphQLReturn>;
  AutomateFunctionCollection: ResolverTypeWrapper<Omit<AutomateFunctionCollection, 'items'> & { items: Array<ResolversTypes['AutomateFunction']> }>;
  AutomateFunctionRelease: ResolverTypeWrapper<AutomateFunctionReleaseGraphQLReturn>;
  AutomateFunctionReleaseCollection: ResolverTypeWrapper<Omit<AutomateFunctionReleaseCollection, 'items'> & { items: Array<ResolversTypes['AutomateFunctionRelease']> }>;
  AutomateFunctionReleasesFilter: AutomateFunctionReleasesFilter;
  AutomateFunctionRun: ResolverTypeWrapper<AutomateFunctionRunGraphQLReturn>;
  AutomateFunctionRunStatusReportInput: AutomateFunctionRunStatusReportInput;
  AutomateFunctionTemplate: ResolverTypeWrapper<AutomateFunctionTemplate>;
  AutomateFunctionTemplateLanguage: AutomateFunctionTemplateLanguage;
  AutomateFunctionToken: ResolverTypeWrapper<AutomateFunctionToken>;
  AutomateFunctionsFilter: AutomateFunctionsFilter;
  AutomateMutations: ResolverTypeWrapper<MutationsObjectGraphQLReturn>;
  AutomateRun: ResolverTypeWrapper<AutomateRunGraphQLReturn>;
  AutomateRunCollection: ResolverTypeWrapper<Omit<AutomateRunCollection, 'items'> & { items: Array<ResolversTypes['AutomateRun']> }>;
  AutomateRunStatus: AutomateRunStatus;
  AutomateRunTriggerType: AutomateRunTriggerType;
  Automation: ResolverTypeWrapper<AutomationGraphQLReturn>;
  AutomationCollection: ResolverTypeWrapper<Omit<AutomationCollection, 'items'> & { items: Array<ResolversTypes['Automation']> }>;
  AutomationPermissionChecks: ResolverTypeWrapper<AutomationPermissionChecksGraphQLReturn>;
  AutomationRevision: ResolverTypeWrapper<AutomationRevisionGraphQLReturn>;
  AutomationRevisionCreateFunctionInput: AutomationRevisionCreateFunctionInput;
  AutomationRevisionFunction: ResolverTypeWrapper<AutomationRevisionFunctionGraphQLReturn>;
  AutomationRevisionTriggerDefinition: ResolverTypeWrapper<AutomationRevisionTriggerDefinitionGraphQLReturn>;
  AutomationRunTrigger: ResolverTypeWrapper<AutomationRunTriggerGraphQLReturn>;
  BasicGitRepositoryMetadata: ResolverTypeWrapper<BasicGitRepositoryMetadata>;
  BigInt: ResolverTypeWrapper<Scalars['BigInt']['output']>;
  BillingInterval: BillingInterval;
  BlobMetadata: ResolverTypeWrapper<BlobStorageItem>;
  BlobMetadataCollection: ResolverTypeWrapper<Omit<BlobMetadataCollection, 'items'> & { items?: Maybe<Array<ResolversTypes['BlobMetadata']>> }>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  Branch: ResolverTypeWrapper<BranchGraphQLReturn>;
  BranchCollection: ResolverTypeWrapper<Omit<BranchCollection, 'items'> & { items?: Maybe<Array<ResolversTypes['Branch']>> }>;
  BranchCreateInput: BranchCreateInput;
  BranchDeleteInput: BranchDeleteInput;
  BranchUpdateInput: BranchUpdateInput;
  BulkUsersRetrievalInput: BulkUsersRetrievalInput;
  CancelCheckoutSessionInput: CancelCheckoutSessionInput;
  CheckoutSession: ResolverTypeWrapper<CheckoutSession>;
  CheckoutSessionInput: CheckoutSessionInput;
  Comment: ResolverTypeWrapper<CommentGraphQLReturn>;
  CommentActivityMessage: ResolverTypeWrapper<Omit<CommentActivityMessage, 'comment'> & { comment: ResolversTypes['Comment'] }>;
  CommentCollection: ResolverTypeWrapper<Omit<CommentCollection, 'items'> & { items: Array<ResolversTypes['Comment']> }>;
  CommentContentInput: CommentContentInput;
  CommentCreateInput: CommentCreateInput;
  CommentDataFilters: ResolverTypeWrapper<CommentDataFilters>;
  CommentDataFiltersInput: CommentDataFiltersInput;
  CommentEditInput: CommentEditInput;
  CommentMutations: ResolverTypeWrapper<MutationsObjectGraphQLReturn>;
  CommentPermissionChecks: ResolverTypeWrapper<CommentPermissionChecksGraphQLReturn>;
  CommentReplyAuthorCollection: ResolverTypeWrapper<CommentReplyAuthorCollectionGraphQLReturn>;
  CommentThreadActivityMessage: ResolverTypeWrapper<Omit<CommentThreadActivityMessage, 'reply'> & { reply?: Maybe<ResolversTypes['Comment']> }>;
  Commit: ResolverTypeWrapper<CommitGraphQLReturn>;
  CommitCollection: ResolverTypeWrapper<Omit<CommitCollection, 'items'> & { items?: Maybe<Array<ResolversTypes['Commit']>> }>;
  CommitCreateInput: CommitCreateInput;
  CommitDeleteInput: CommitDeleteInput;
  CommitReceivedInput: CommitReceivedInput;
  CommitUpdateInput: CommitUpdateInput;
  CommitsDeleteInput: CommitsDeleteInput;
  CommitsMoveInput: CommitsMoveInput;
  CountOnlyCollection: ResolverTypeWrapper<CountOnlyCollection>;
  CreateAutomateFunctionInput: CreateAutomateFunctionInput;
  CreateAutomateFunctionWithoutVersionInput: CreateAutomateFunctionWithoutVersionInput;
  CreateCommentInput: CreateCommentInput;
  CreateCommentReplyInput: CreateCommentReplyInput;
  CreateEmbedTokenReturn: ResolverTypeWrapper<Omit<CreateEmbedTokenReturn, 'tokenMetadata'> & { tokenMetadata: ResolversTypes['EmbedToken'] }>;
  CreateModelInput: CreateModelInput;
  CreateServerRegionInput: CreateServerRegionInput;
  CreateUserEmailInput: CreateUserEmailInput;
  CreateVersionInput: CreateVersionInput;
  Currency: Currency;
  CurrencyBasedPrices: ResolverTypeWrapper<Omit<CurrencyBasedPrices, 'gbp' | 'usd'> & { gbp: ResolversTypes['WorkspacePaidPlanPrices'], usd: ResolversTypes['WorkspacePaidPlanPrices'] }>;
  DateTime: ResolverTypeWrapper<Scalars['DateTime']['output']>;
  DeleteModelInput: DeleteModelInput;
  DeleteUserEmailInput: DeleteUserEmailInput;
  DeleteVersionsInput: DeleteVersionsInput;
  DenyWorkspaceJoinRequestInput: DenyWorkspaceJoinRequestInput;
  DiscoverableStreamsSortType: DiscoverableStreamsSortType;
  DiscoverableStreamsSortingInput: DiscoverableStreamsSortingInput;
  EditCommentInput: EditCommentInput;
  EmailVerificationRequestInput: EmailVerificationRequestInput;
  EmbedToken: ResolverTypeWrapper<EmbedTokenGraphQLReturn>;
  EmbedTokenCollection: ResolverTypeWrapper<Omit<EmbedTokenCollection, 'items'> & { items: Array<ResolversTypes['EmbedToken']> }>;
  EmbedTokenCreateInput: EmbedTokenCreateInput;
  FileUpload: ResolverTypeWrapper<FileUploadGraphQLReturn>;
  FileUploadCollection: ResolverTypeWrapper<Omit<FileUploadCollection, 'items'> & { items: Array<ResolversTypes['FileUpload']> }>;
  FileUploadMutations: ResolverTypeWrapper<MutationsObjectGraphQLReturn>;
  Float: ResolverTypeWrapper<Scalars['Float']['output']>;
  GendoAIRender: ResolverTypeWrapper<GendoAIRenderGraphQLReturn>;
  GendoAIRenderCollection: ResolverTypeWrapper<Omit<GendoAiRenderCollection, 'items'> & { items: Array<Maybe<ResolversTypes['GendoAIRender']>> }>;
  GendoAIRenderInput: GendoAiRenderInput;
  GenerateFileUploadUrlInput: GenerateFileUploadUrlInput;
  GenerateFileUploadUrlOutput: ResolverTypeWrapper<GenerateFileUploadUrlOutput>;
  GetModelUploadsInput: GetModelUploadsInput;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  InvitableCollaboratorsFilter: InvitableCollaboratorsFilter;
  JSONObject: ResolverTypeWrapper<Scalars['JSONObject']['output']>;
  JoinWorkspaceInput: JoinWorkspaceInput;
  LegacyCommentViewerData: ResolverTypeWrapper<LegacyCommentViewerData>;
  LimitedUser: ResolverTypeWrapper<LimitedUserGraphQLReturn>;
  LimitedWorkspace: ResolverTypeWrapper<LimitedWorkspaceGraphQLReturn>;
  LimitedWorkspaceCollaborator: ResolverTypeWrapper<LimitedWorkspaceCollaboratorGraphQLReturn>;
  LimitedWorkspaceCollaboratorCollection: ResolverTypeWrapper<Omit<LimitedWorkspaceCollaboratorCollection, 'items'> & { items: Array<ResolversTypes['LimitedWorkspaceCollaborator']> }>;
  LimitedWorkspaceJoinRequest: ResolverTypeWrapper<LimitedWorkspaceJoinRequestGraphQLReturn>;
  LimitedWorkspaceJoinRequestCollection: ResolverTypeWrapper<Omit<LimitedWorkspaceJoinRequestCollection, 'items'> & { items: Array<ResolversTypes['LimitedWorkspaceJoinRequest']> }>;
  MarkCommentViewedInput: MarkCommentViewedInput;
  MarkReceivedVersionInput: MarkReceivedVersionInput;
  Model: ResolverTypeWrapper<ModelGraphQLReturn>;
  ModelCollection: ResolverTypeWrapper<Omit<ModelCollection, 'items'> & { items: Array<ResolversTypes['Model']> }>;
  ModelMutations: ResolverTypeWrapper<MutationsObjectGraphQLReturn>;
  ModelPermissionChecks: ResolverTypeWrapper<ModelPermissionChecksGraphQLReturn>;
  ModelVersionsFilter: ModelVersionsFilter;
  ModelsTreeItem: ResolverTypeWrapper<ModelsTreeItemGraphQLReturn>;
  ModelsTreeItemCollection: ResolverTypeWrapper<Omit<ModelsTreeItemCollection, 'items'> & { items: Array<ResolversTypes['ModelsTreeItem']> }>;
  MoveVersionsInput: MoveVersionsInput;
  Mutation: ResolverTypeWrapper<{}>;
  Object: ResolverTypeWrapper<ObjectGraphQLReturn>;
  ObjectCollection: ResolverTypeWrapper<Omit<ObjectCollection, 'objects'> & { objects: Array<ResolversTypes['Object']> }>;
  ObjectCreateInput: ObjectCreateInput;
  OnboardingCompletionInput: OnboardingCompletionInput;
  PaidWorkspacePlans: PaidWorkspacePlans;
  PasswordStrengthCheckFeedback: ResolverTypeWrapper<PasswordStrengthCheckFeedback>;
  PasswordStrengthCheckResults: ResolverTypeWrapper<PasswordStrengthCheckResults>;
  PendingStreamCollaborator: ResolverTypeWrapper<PendingStreamCollaboratorGraphQLReturn>;
  PendingWorkspaceCollaborator: ResolverTypeWrapper<PendingWorkspaceCollaboratorGraphQLReturn>;
  PendingWorkspaceCollaboratorsFilter: PendingWorkspaceCollaboratorsFilter;
  PermissionCheckResult: ResolverTypeWrapper<PermissionCheckResult>;
  Price: ResolverTypeWrapper<PriceGraphQLReturn>;
  Project: ResolverTypeWrapper<ProjectGraphQLReturn>;
  ProjectAccessRequest: ResolverTypeWrapper<ProjectAccessRequestGraphQLReturn>;
  ProjectAccessRequestMutations: ResolverTypeWrapper<MutationsObjectGraphQLReturn>;
  ProjectAutomationCreateInput: ProjectAutomationCreateInput;
  ProjectAutomationMutations: ResolverTypeWrapper<ProjectAutomationMutationsGraphQLReturn>;
  ProjectAutomationRevisionCreateInput: ProjectAutomationRevisionCreateInput;
  ProjectAutomationUpdateInput: ProjectAutomationUpdateInput;
  ProjectAutomationsUpdatedMessage: ResolverTypeWrapper<ProjectAutomationsUpdatedMessageGraphQLReturn>;
  ProjectAutomationsUpdatedMessageType: ProjectAutomationsUpdatedMessageType;
  ProjectCollaborator: ResolverTypeWrapper<ProjectCollaboratorGraphQLReturn>;
  ProjectCollection: ResolverTypeWrapper<Omit<ProjectCollection, 'items'> & { items: Array<ResolversTypes['Project']> }>;
  ProjectCommentCollection: ResolverTypeWrapper<Omit<ProjectCommentCollection, 'items'> & { items: Array<ResolversTypes['Comment']> }>;
  ProjectCommentsFilter: ProjectCommentsFilter;
  ProjectCommentsUpdatedMessage: ResolverTypeWrapper<Omit<ProjectCommentsUpdatedMessage, 'comment'> & { comment?: Maybe<ResolversTypes['Comment']> }>;
  ProjectCommentsUpdatedMessageType: ProjectCommentsUpdatedMessageType;
  ProjectCreateInput: ProjectCreateInput;
  ProjectEmbedOptions: ResolverTypeWrapper<ProjectEmbedOptions>;
  ProjectFileImportUpdatedMessage: ResolverTypeWrapper<Omit<ProjectFileImportUpdatedMessage, 'upload'> & { upload: ResolversTypes['FileUpload'] }>;
  ProjectFileImportUpdatedMessageType: ProjectFileImportUpdatedMessageType;
  ProjectInviteCreateInput: ProjectInviteCreateInput;
  ProjectInviteMutations: ResolverTypeWrapper<MutationsObjectGraphQLReturn>;
  ProjectInviteUseInput: ProjectInviteUseInput;
  ProjectModelsFilter: ProjectModelsFilter;
  ProjectModelsTreeFilter: ProjectModelsTreeFilter;
  ProjectModelsUpdatedMessage: ResolverTypeWrapper<Omit<ProjectModelsUpdatedMessage, 'model'> & { model?: Maybe<ResolversTypes['Model']> }>;
  ProjectModelsUpdatedMessageType: ProjectModelsUpdatedMessageType;
  ProjectMoveToWorkspaceDryRun: ResolverTypeWrapper<ProjectMoveToWorkspaceDryRunGraphQLReturn>;
  ProjectMutations: ResolverTypeWrapper<MutationsObjectGraphQLReturn>;
  ProjectPendingModelsUpdatedMessage: ResolverTypeWrapper<Omit<ProjectPendingModelsUpdatedMessage, 'model'> & { model: ResolversTypes['FileUpload'] }>;
  ProjectPendingModelsUpdatedMessageType: ProjectPendingModelsUpdatedMessageType;
  ProjectPendingVersionsUpdatedMessage: ResolverTypeWrapper<Omit<ProjectPendingVersionsUpdatedMessage, 'version'> & { version: ResolversTypes['FileUpload'] }>;
  ProjectPendingVersionsUpdatedMessageType: ProjectPendingVersionsUpdatedMessageType;
  ProjectPermissionChecks: ResolverTypeWrapper<ProjectPermissionChecksGraphQLReturn>;
  ProjectRole: ResolverTypeWrapper<ProjectRoleGraphQLReturn>;
  ProjectTestAutomationCreateInput: ProjectTestAutomationCreateInput;
  ProjectTriggeredAutomationsStatusUpdatedMessage: ResolverTypeWrapper<ProjectTriggeredAutomationsStatusUpdatedMessageGraphQLReturn>;
  ProjectTriggeredAutomationsStatusUpdatedMessageType: ProjectTriggeredAutomationsStatusUpdatedMessageType;
  ProjectUpdateInput: ProjectUpdateInput;
  ProjectUpdateRoleInput: ProjectUpdateRoleInput;
  ProjectUpdatedMessage: ResolverTypeWrapper<Omit<ProjectUpdatedMessage, 'project'> & { project?: Maybe<ResolversTypes['Project']> }>;
  ProjectUpdatedMessageType: ProjectUpdatedMessageType;
  ProjectVersionsPreviewGeneratedMessage: ResolverTypeWrapper<ProjectVersionsPreviewGeneratedMessage>;
  ProjectVersionsUpdatedMessage: ResolverTypeWrapper<Omit<ProjectVersionsUpdatedMessage, 'version'> & { version?: Maybe<ResolversTypes['Version']> }>;
  ProjectVersionsUpdatedMessageType: ProjectVersionsUpdatedMessageType;
  ProjectVisibility: ProjectVisibility;
  Query: ResolverTypeWrapper<{}>;
  ReplyCreateInput: ReplyCreateInput;
  ResourceIdentifier: ResolverTypeWrapper<ResourceIdentifier>;
  ResourceIdentifierInput: ResourceIdentifierInput;
  ResourceType: ResourceType;
  Role: ResolverTypeWrapper<Role>;
  RootPermissionChecks: ResolverTypeWrapper<RootPermissionChecksGraphQLReturn>;
  Scope: ResolverTypeWrapper<Scope>;
  ServerApp: ResolverTypeWrapper<ServerAppGraphQLReturn>;
  ServerAppListItem: ResolverTypeWrapper<ServerAppListItemGraphQLReturn>;
  ServerAutomateInfo: ResolverTypeWrapper<ServerAutomateInfo>;
  ServerConfiguration: ResolverTypeWrapper<ServerConfiguration>;
  ServerInfo: ResolverTypeWrapper<ServerInfoGraphQLReturn>;
  ServerInfoMutations: ResolverTypeWrapper<MutationsObjectGraphQLReturn>;
  ServerInfoUpdateInput: ServerInfoUpdateInput;
  ServerInvite: ResolverTypeWrapper<ServerInviteGraphQLReturnType>;
  ServerInviteCreateInput: ServerInviteCreateInput;
  ServerMigration: ResolverTypeWrapper<ServerMigration>;
  ServerMultiRegionConfiguration: ResolverTypeWrapper<GraphQLEmptyReturn>;
  ServerRegionItem: ResolverTypeWrapper<ServerRegionItemGraphQLReturn>;
  ServerRegionMutations: ResolverTypeWrapper<MutationsObjectGraphQLReturn>;
  ServerRole: ServerRole;
  ServerRoleItem: ResolverTypeWrapper<ServerRoleItem>;
  ServerStatistics: ResolverTypeWrapper<GraphQLEmptyReturn>;
  ServerStats: ResolverTypeWrapper<GraphQLEmptyReturn>;
  ServerWorkspacesInfo: ResolverTypeWrapper<GraphQLEmptyReturn>;
  SessionPaymentStatus: SessionPaymentStatus;
  SetPrimaryUserEmailInput: SetPrimaryUserEmailInput;
  SmartTextEditorValue: ResolverTypeWrapper<SmartTextEditorValueGraphQLReturn>;
  SortDirection: SortDirection;
  StartFileImportInput: StartFileImportInput;
  Stream: ResolverTypeWrapper<StreamGraphQLReturn>;
  StreamAccessRequest: ResolverTypeWrapper<StreamAccessRequestGraphQLReturn>;
  StreamCollaborator: ResolverTypeWrapper<StreamCollaboratorGraphQLReturn>;
  StreamCollection: ResolverTypeWrapper<Omit<StreamCollection, 'items'> & { items?: Maybe<Array<ResolversTypes['Stream']>> }>;
  StreamCreateInput: StreamCreateInput;
  StreamInviteCreateInput: StreamInviteCreateInput;
  StreamRevokePermissionInput: StreamRevokePermissionInput;
  StreamRole: StreamRole;
  StreamUpdateInput: StreamUpdateInput;
  StreamUpdatePermissionInput: StreamUpdatePermissionInput;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  Subscription: ResolverTypeWrapper<{}>;
  TestAutomationRun: ResolverTypeWrapper<TestAutomationRun>;
  TestAutomationRunTrigger: ResolverTypeWrapper<TestAutomationRunTrigger>;
  TestAutomationRunTriggerPayload: ResolverTypeWrapper<TestAutomationRunTriggerPayload>;
  TokenResourceIdentifier: ResolverTypeWrapper<TokenResourceIdentifier>;
  TokenResourceIdentifierInput: TokenResourceIdentifierInput;
  TokenResourceIdentifierType: TokenResourceIdentifierType;
  TriggeredAutomationsStatus: ResolverTypeWrapper<TriggeredAutomationsStatusGraphQLReturn>;
  UpdateAutomateFunctionInput: UpdateAutomateFunctionInput;
  UpdateModelInput: UpdateModelInput;
  UpdateServerRegionInput: UpdateServerRegionInput;
  UpdateVersionInput: UpdateVersionInput;
  UpgradePlanInput: UpgradePlanInput;
  User: ResolverTypeWrapper<UserGraphQLReturn>;
  UserAutomateInfo: ResolverTypeWrapper<UserAutomateInfoGraphQLReturn>;
  UserDeleteInput: UserDeleteInput;
  UserEmail: ResolverTypeWrapper<UserEmail>;
  UserEmailMutations: ResolverTypeWrapper<MutationsObjectGraphQLReturn>;
  UserGendoAICredits: ResolverTypeWrapper<UserGendoAiCredits>;
  UserMeta: ResolverTypeWrapper<UserMetaGraphQLReturn>;
  UserMetaMutations: ResolverTypeWrapper<MutationsObjectGraphQLReturn>;
  UserProjectCollection: ResolverTypeWrapper<Omit<UserProjectCollection, 'items'> & { items: Array<ResolversTypes['Project']> }>;
  UserProjectsFilter: UserProjectsFilter;
  UserProjectsUpdatedMessage: ResolverTypeWrapper<Omit<UserProjectsUpdatedMessage, 'project'> & { project?: Maybe<ResolversTypes['Project']> }>;
  UserProjectsUpdatedMessageType: UserProjectsUpdatedMessageType;
  UserRoleInput: UserRoleInput;
  UserSearchResultCollection: ResolverTypeWrapper<Omit<UserSearchResultCollection, 'items'> & { items: Array<ResolversTypes['LimitedUser']> }>;
  UserStreamCollection: ResolverTypeWrapper<Omit<UserStreamCollection, 'items'> & { items?: Maybe<Array<ResolversTypes['Stream']>> }>;
  UserUpdateInput: UserUpdateInput;
  UserWorkspacesFilter: UserWorkspacesFilter;
  UsersRetrievalInput: UsersRetrievalInput;
  VerifyUserEmailInput: VerifyUserEmailInput;
  Version: ResolverTypeWrapper<VersionGraphQLReturn>;
  VersionCollection: ResolverTypeWrapper<Omit<VersionCollection, 'items'> & { items: Array<ResolversTypes['Version']> }>;
  VersionCreatedTrigger: ResolverTypeWrapper<AutomationRunTriggerGraphQLReturn>;
  VersionCreatedTriggerDefinition: ResolverTypeWrapper<AutomationRevisionTriggerDefinitionGraphQLReturn>;
  VersionMutations: ResolverTypeWrapper<MutationsObjectGraphQLReturn>;
  VersionPermissionChecks: ResolverTypeWrapper<VersionPermissionChecksGraphQLReturn>;
  ViewerResourceGroup: ResolverTypeWrapper<ViewerResourceGroup>;
  ViewerResourceItem: ResolverTypeWrapper<ViewerResourceItem>;
  ViewerUpdateTrackingTarget: ViewerUpdateTrackingTarget;
  ViewerUserActivityMessage: ResolverTypeWrapper<Omit<ViewerUserActivityMessage, 'user'> & { user?: Maybe<ResolversTypes['LimitedUser']> }>;
  ViewerUserActivityMessageInput: ViewerUserActivityMessageInput;
  ViewerUserActivityStatus: ViewerUserActivityStatus;
  Webhook: ResolverTypeWrapper<WebhookGraphQLReturn>;
  WebhookCollection: ResolverTypeWrapper<Omit<WebhookCollection, 'items'> & { items: Array<ResolversTypes['Webhook']> }>;
  WebhookCreateInput: WebhookCreateInput;
  WebhookDeleteInput: WebhookDeleteInput;
  WebhookEvent: ResolverTypeWrapper<WebhookEvent>;
  WebhookEventCollection: ResolverTypeWrapper<WebhookEventCollection>;
  WebhookUpdateInput: WebhookUpdateInput;
  Workspace: ResolverTypeWrapper<WorkspaceGraphQLReturn>;
  WorkspaceBillingMutations: ResolverTypeWrapper<WorkspaceBillingMutationsGraphQLReturn>;
  WorkspaceCollaborator: ResolverTypeWrapper<WorkspaceCollaboratorGraphQLReturn>;
  WorkspaceCollaboratorCollection: ResolverTypeWrapper<Omit<WorkspaceCollaboratorCollection, 'items'> & { items: Array<ResolversTypes['WorkspaceCollaborator']> }>;
  WorkspaceCollection: ResolverTypeWrapper<Omit<WorkspaceCollection, 'items'> & { items: Array<ResolversTypes['Workspace']> }>;
  WorkspaceCreateInput: WorkspaceCreateInput;
  WorkspaceCreationState: ResolverTypeWrapper<WorkspaceCreationState>;
  WorkspaceCreationStateInput: WorkspaceCreationStateInput;
  WorkspaceDismissInput: WorkspaceDismissInput;
  WorkspaceDomain: ResolverTypeWrapper<WorkspaceDomain>;
  WorkspaceDomainDeleteInput: WorkspaceDomainDeleteInput;
  WorkspaceEmbedOptions: ResolverTypeWrapper<WorkspaceEmbedOptions>;
  WorkspaceFeatureName: WorkspaceFeatureName;
  WorkspaceInviteCreateInput: WorkspaceInviteCreateInput;
  WorkspaceInviteLookupOptions: WorkspaceInviteLookupOptions;
  WorkspaceInviteMutations: ResolverTypeWrapper<WorkspaceInviteMutationsGraphQLReturn>;
  WorkspaceInviteResendInput: WorkspaceInviteResendInput;
  WorkspaceInviteUseInput: WorkspaceInviteUseInput;
  WorkspaceJoinRequest: ResolverTypeWrapper<WorkspaceJoinRequestGraphQLReturn>;
  WorkspaceJoinRequestCollection: ResolverTypeWrapper<Omit<WorkspaceJoinRequestCollection, 'items'> & { items: Array<ResolversTypes['WorkspaceJoinRequest']> }>;
  WorkspaceJoinRequestFilter: WorkspaceJoinRequestFilter;
  WorkspaceJoinRequestMutations: ResolverTypeWrapper<WorkspaceJoinRequestMutationsGraphQLReturn>;
  WorkspaceJoinRequestStatus: WorkspaceJoinRequestStatus;
  WorkspaceMutations: ResolverTypeWrapper<WorkspaceMutationsGraphQLReturn>;
  WorkspacePaidPlanPrices: ResolverTypeWrapper<Omit<WorkspacePaidPlanPrices, 'pro' | 'proUnlimited' | 'team' | 'teamUnlimited'> & { pro: ResolversTypes['WorkspacePlanPrice'], proUnlimited: ResolversTypes['WorkspacePlanPrice'], team: ResolversTypes['WorkspacePlanPrice'], teamUnlimited: ResolversTypes['WorkspacePlanPrice'] }>;
  WorkspacePaymentMethod: WorkspacePaymentMethod;
  WorkspacePermissionChecks: ResolverTypeWrapper<WorkspacePermissionChecksGraphQLReturn>;
  WorkspacePlan: ResolverTypeWrapper<WorkspacePlanGraphQLReturn>;
  WorkspacePlanPrice: ResolverTypeWrapper<Omit<WorkspacePlanPrice, 'monthly' | 'yearly'> & { monthly: ResolversTypes['Price'], yearly: ResolversTypes['Price'] }>;
  WorkspacePlanStatuses: WorkspacePlanStatuses;
  WorkspacePlanUsage: ResolverTypeWrapper<WorkspacePlanUsageGraphQLReturn>;
  WorkspacePlans: WorkspacePlans;
  WorkspaceProjectCreateInput: WorkspaceProjectCreateInput;
  WorkspaceProjectInviteCreateInput: WorkspaceProjectInviteCreateInput;
  WorkspaceProjectMutations: ResolverTypeWrapper<WorkspaceProjectMutationsGraphQLReturn>;
  WorkspaceProjectsFilter: WorkspaceProjectsFilter;
  WorkspaceProjectsUpdatedMessage: ResolverTypeWrapper<Omit<WorkspaceProjectsUpdatedMessage, 'project'> & { project?: Maybe<ResolversTypes['Project']> }>;
  WorkspaceProjectsUpdatedMessageType: WorkspaceProjectsUpdatedMessageType;
  WorkspaceRequestToJoinInput: WorkspaceRequestToJoinInput;
  WorkspaceRole: WorkspaceRole;
  WorkspaceRoleCollection: ResolverTypeWrapper<WorkspaceRoleCollection>;
  WorkspaceRoleDeleteInput: WorkspaceRoleDeleteInput;
  WorkspaceRoleUpdateInput: WorkspaceRoleUpdateInput;
  WorkspaceSeatCollection: ResolverTypeWrapper<WorkspaceSeatCollection>;
  WorkspaceSeatType: WorkspaceSeatType;
  WorkspaceSeatsByType: ResolverTypeWrapper<WorkspaceSeatsByType>;
  WorkspaceSso: ResolverTypeWrapper<WorkspaceSsoGraphQLReturn>;
  WorkspaceSsoProvider: ResolverTypeWrapper<WorkspaceSsoProvider>;
  WorkspaceSsoSession: ResolverTypeWrapper<WorkspaceSsoSession>;
  WorkspaceSubscription: ResolverTypeWrapper<WorkspaceSubscriptionGraphQLReturn>;
  WorkspaceSubscriptionSeatCount: ResolverTypeWrapper<WorkspaceSubscriptionSeatCount>;
  WorkspaceSubscriptionSeats: ResolverTypeWrapper<WorkspaceSubscriptionSeatsGraphQLReturn>;
  WorkspaceTeamByRole: ResolverTypeWrapper<WorkspaceTeamByRole>;
  WorkspaceTeamFilter: WorkspaceTeamFilter;
  WorkspaceUpdateEmbedOptionsInput: WorkspaceUpdateEmbedOptionsInput;
  WorkspaceUpdateInput: WorkspaceUpdateInput;
  WorkspaceUpdateSeatTypeInput: WorkspaceUpdateSeatTypeInput;
  WorkspaceUpdatedMessage: ResolverTypeWrapper<Omit<WorkspaceUpdatedMessage, 'workspace'> & { workspace: ResolversTypes['Workspace'] }>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  ActiveUserMutations: MutationsObjectGraphQLReturn;
  Activity: Activity;
  ActivityCollection: ActivityCollectionGraphQLReturn;
  AddDomainToWorkspaceInput: AddDomainToWorkspaceInput;
  AdminInviteList: Omit<AdminInviteList, 'items'> & { items: Array<ResolversParentTypes['ServerInvite']> };
  AdminMutations: MutationsObjectGraphQLReturn;
  AdminQueries: GraphQLEmptyReturn;
  AdminUpdateWorkspacePlanInput: AdminUpdateWorkspacePlanInput;
  AdminUserList: AdminUserList;
  AdminUserListItem: AdminUserListItem;
  AdminUsersListCollection: Omit<AdminUsersListCollection, 'items'> & { items: Array<ResolversParentTypes['AdminUsersListItem']> };
  AdminUsersListItem: Omit<AdminUsersListItem, 'invitedUser' | 'registeredUser'> & { invitedUser?: Maybe<ResolversParentTypes['ServerInvite']>, registeredUser?: Maybe<ResolversParentTypes['User']> };
  AdminWorkspaceJoinRequestFilter: AdminWorkspaceJoinRequestFilter;
  ApiToken: ApiToken;
  ApiTokenCreateInput: ApiTokenCreateInput;
  AppAuthor: AppAuthor;
  AppCreateInput: AppCreateInput;
  AppTokenCreateInput: AppTokenCreateInput;
  AppUpdateInput: AppUpdateInput;
  ApproveWorkspaceJoinRequestInput: ApproveWorkspaceJoinRequestInput;
  ArchiveCommentInput: ArchiveCommentInput;
  AuthStrategy: AuthStrategy;
  AutomateAuthCodePayloadTest: AutomateAuthCodePayloadTest;
  AutomateAuthCodeResources: AutomateAuthCodeResources;
  AutomateFunction: AutomateFunctionGraphQLReturn;
  AutomateFunctionCollection: Omit<AutomateFunctionCollection, 'items'> & { items: Array<ResolversParentTypes['AutomateFunction']> };
  AutomateFunctionRelease: AutomateFunctionReleaseGraphQLReturn;
  AutomateFunctionReleaseCollection: Omit<AutomateFunctionReleaseCollection, 'items'> & { items: Array<ResolversParentTypes['AutomateFunctionRelease']> };
  AutomateFunctionReleasesFilter: AutomateFunctionReleasesFilter;
  AutomateFunctionRun: AutomateFunctionRunGraphQLReturn;
  AutomateFunctionRunStatusReportInput: AutomateFunctionRunStatusReportInput;
  AutomateFunctionTemplate: AutomateFunctionTemplate;
  AutomateFunctionToken: AutomateFunctionToken;
  AutomateFunctionsFilter: AutomateFunctionsFilter;
  AutomateMutations: MutationsObjectGraphQLReturn;
  AutomateRun: AutomateRunGraphQLReturn;
  AutomateRunCollection: Omit<AutomateRunCollection, 'items'> & { items: Array<ResolversParentTypes['AutomateRun']> };
  Automation: AutomationGraphQLReturn;
  AutomationCollection: Omit<AutomationCollection, 'items'> & { items: Array<ResolversParentTypes['Automation']> };
  AutomationPermissionChecks: AutomationPermissionChecksGraphQLReturn;
  AutomationRevision: AutomationRevisionGraphQLReturn;
  AutomationRevisionCreateFunctionInput: AutomationRevisionCreateFunctionInput;
  AutomationRevisionFunction: AutomationRevisionFunctionGraphQLReturn;
  AutomationRevisionTriggerDefinition: AutomationRevisionTriggerDefinitionGraphQLReturn;
  AutomationRunTrigger: AutomationRunTriggerGraphQLReturn;
  BasicGitRepositoryMetadata: BasicGitRepositoryMetadata;
  BigInt: Scalars['BigInt']['output'];
  BlobMetadata: BlobStorageItem;
  BlobMetadataCollection: Omit<BlobMetadataCollection, 'items'> & { items?: Maybe<Array<ResolversParentTypes['BlobMetadata']>> };
  Boolean: Scalars['Boolean']['output'];
  Branch: BranchGraphQLReturn;
  BranchCollection: Omit<BranchCollection, 'items'> & { items?: Maybe<Array<ResolversParentTypes['Branch']>> };
  BranchCreateInput: BranchCreateInput;
  BranchDeleteInput: BranchDeleteInput;
  BranchUpdateInput: BranchUpdateInput;
  BulkUsersRetrievalInput: BulkUsersRetrievalInput;
  CancelCheckoutSessionInput: CancelCheckoutSessionInput;
  CheckoutSession: CheckoutSession;
  CheckoutSessionInput: CheckoutSessionInput;
  Comment: CommentGraphQLReturn;
  CommentActivityMessage: Omit<CommentActivityMessage, 'comment'> & { comment: ResolversParentTypes['Comment'] };
  CommentCollection: Omit<CommentCollection, 'items'> & { items: Array<ResolversParentTypes['Comment']> };
  CommentContentInput: CommentContentInput;
  CommentCreateInput: CommentCreateInput;
  CommentDataFilters: CommentDataFilters;
  CommentDataFiltersInput: CommentDataFiltersInput;
  CommentEditInput: CommentEditInput;
  CommentMutations: MutationsObjectGraphQLReturn;
  CommentPermissionChecks: CommentPermissionChecksGraphQLReturn;
  CommentReplyAuthorCollection: CommentReplyAuthorCollectionGraphQLReturn;
  CommentThreadActivityMessage: Omit<CommentThreadActivityMessage, 'reply'> & { reply?: Maybe<ResolversParentTypes['Comment']> };
  Commit: CommitGraphQLReturn;
  CommitCollection: Omit<CommitCollection, 'items'> & { items?: Maybe<Array<ResolversParentTypes['Commit']>> };
  CommitCreateInput: CommitCreateInput;
  CommitDeleteInput: CommitDeleteInput;
  CommitReceivedInput: CommitReceivedInput;
  CommitUpdateInput: CommitUpdateInput;
  CommitsDeleteInput: CommitsDeleteInput;
  CommitsMoveInput: CommitsMoveInput;
  CountOnlyCollection: CountOnlyCollection;
  CreateAutomateFunctionInput: CreateAutomateFunctionInput;
  CreateAutomateFunctionWithoutVersionInput: CreateAutomateFunctionWithoutVersionInput;
  CreateCommentInput: CreateCommentInput;
  CreateCommentReplyInput: CreateCommentReplyInput;
  CreateEmbedTokenReturn: Omit<CreateEmbedTokenReturn, 'tokenMetadata'> & { tokenMetadata: ResolversParentTypes['EmbedToken'] };
  CreateModelInput: CreateModelInput;
  CreateServerRegionInput: CreateServerRegionInput;
  CreateUserEmailInput: CreateUserEmailInput;
  CreateVersionInput: CreateVersionInput;
  CurrencyBasedPrices: Omit<CurrencyBasedPrices, 'gbp' | 'usd'> & { gbp: ResolversParentTypes['WorkspacePaidPlanPrices'], usd: ResolversParentTypes['WorkspacePaidPlanPrices'] };
  DateTime: Scalars['DateTime']['output'];
  DeleteModelInput: DeleteModelInput;
  DeleteUserEmailInput: DeleteUserEmailInput;
  DeleteVersionsInput: DeleteVersionsInput;
  DenyWorkspaceJoinRequestInput: DenyWorkspaceJoinRequestInput;
  DiscoverableStreamsSortingInput: DiscoverableStreamsSortingInput;
  EditCommentInput: EditCommentInput;
  EmailVerificationRequestInput: EmailVerificationRequestInput;
  EmbedToken: EmbedTokenGraphQLReturn;
  EmbedTokenCollection: Omit<EmbedTokenCollection, 'items'> & { items: Array<ResolversParentTypes['EmbedToken']> };
  EmbedTokenCreateInput: EmbedTokenCreateInput;
  FileUpload: FileUploadGraphQLReturn;
  FileUploadCollection: Omit<FileUploadCollection, 'items'> & { items: Array<ResolversParentTypes['FileUpload']> };
  FileUploadMutations: MutationsObjectGraphQLReturn;
  Float: Scalars['Float']['output'];
  GendoAIRender: GendoAIRenderGraphQLReturn;
  GendoAIRenderCollection: Omit<GendoAiRenderCollection, 'items'> & { items: Array<Maybe<ResolversParentTypes['GendoAIRender']>> };
  GendoAIRenderInput: GendoAiRenderInput;
  GenerateFileUploadUrlInput: GenerateFileUploadUrlInput;
  GenerateFileUploadUrlOutput: GenerateFileUploadUrlOutput;
  GetModelUploadsInput: GetModelUploadsInput;
  ID: Scalars['ID']['output'];
  Int: Scalars['Int']['output'];
  InvitableCollaboratorsFilter: InvitableCollaboratorsFilter;
  JSONObject: Scalars['JSONObject']['output'];
  JoinWorkspaceInput: JoinWorkspaceInput;
  LegacyCommentViewerData: LegacyCommentViewerData;
  LimitedUser: LimitedUserGraphQLReturn;
  LimitedWorkspace: LimitedWorkspaceGraphQLReturn;
  LimitedWorkspaceCollaborator: LimitedWorkspaceCollaboratorGraphQLReturn;
  LimitedWorkspaceCollaboratorCollection: Omit<LimitedWorkspaceCollaboratorCollection, 'items'> & { items: Array<ResolversParentTypes['LimitedWorkspaceCollaborator']> };
  LimitedWorkspaceJoinRequest: LimitedWorkspaceJoinRequestGraphQLReturn;
  LimitedWorkspaceJoinRequestCollection: Omit<LimitedWorkspaceJoinRequestCollection, 'items'> & { items: Array<ResolversParentTypes['LimitedWorkspaceJoinRequest']> };
  MarkCommentViewedInput: MarkCommentViewedInput;
  MarkReceivedVersionInput: MarkReceivedVersionInput;
  Model: ModelGraphQLReturn;
  ModelCollection: Omit<ModelCollection, 'items'> & { items: Array<ResolversParentTypes['Model']> };
  ModelMutations: MutationsObjectGraphQLReturn;
  ModelPermissionChecks: ModelPermissionChecksGraphQLReturn;
  ModelVersionsFilter: ModelVersionsFilter;
  ModelsTreeItem: ModelsTreeItemGraphQLReturn;
  ModelsTreeItemCollection: Omit<ModelsTreeItemCollection, 'items'> & { items: Array<ResolversParentTypes['ModelsTreeItem']> };
  MoveVersionsInput: MoveVersionsInput;
  Mutation: {};
  Object: ObjectGraphQLReturn;
  ObjectCollection: Omit<ObjectCollection, 'objects'> & { objects: Array<ResolversParentTypes['Object']> };
  ObjectCreateInput: ObjectCreateInput;
  OnboardingCompletionInput: OnboardingCompletionInput;
  PasswordStrengthCheckFeedback: PasswordStrengthCheckFeedback;
  PasswordStrengthCheckResults: PasswordStrengthCheckResults;
  PendingStreamCollaborator: PendingStreamCollaboratorGraphQLReturn;
  PendingWorkspaceCollaborator: PendingWorkspaceCollaboratorGraphQLReturn;
  PendingWorkspaceCollaboratorsFilter: PendingWorkspaceCollaboratorsFilter;
  PermissionCheckResult: PermissionCheckResult;
  Price: PriceGraphQLReturn;
  Project: ProjectGraphQLReturn;
  ProjectAccessRequest: ProjectAccessRequestGraphQLReturn;
  ProjectAccessRequestMutations: MutationsObjectGraphQLReturn;
  ProjectAutomationCreateInput: ProjectAutomationCreateInput;
  ProjectAutomationMutations: ProjectAutomationMutationsGraphQLReturn;
  ProjectAutomationRevisionCreateInput: ProjectAutomationRevisionCreateInput;
  ProjectAutomationUpdateInput: ProjectAutomationUpdateInput;
  ProjectAutomationsUpdatedMessage: ProjectAutomationsUpdatedMessageGraphQLReturn;
  ProjectCollaborator: ProjectCollaboratorGraphQLReturn;
  ProjectCollection: Omit<ProjectCollection, 'items'> & { items: Array<ResolversParentTypes['Project']> };
  ProjectCommentCollection: Omit<ProjectCommentCollection, 'items'> & { items: Array<ResolversParentTypes['Comment']> };
  ProjectCommentsFilter: ProjectCommentsFilter;
  ProjectCommentsUpdatedMessage: Omit<ProjectCommentsUpdatedMessage, 'comment'> & { comment?: Maybe<ResolversParentTypes['Comment']> };
  ProjectCreateInput: ProjectCreateInput;
  ProjectEmbedOptions: ProjectEmbedOptions;
  ProjectFileImportUpdatedMessage: Omit<ProjectFileImportUpdatedMessage, 'upload'> & { upload: ResolversParentTypes['FileUpload'] };
  ProjectInviteCreateInput: ProjectInviteCreateInput;
  ProjectInviteMutations: MutationsObjectGraphQLReturn;
  ProjectInviteUseInput: ProjectInviteUseInput;
  ProjectModelsFilter: ProjectModelsFilter;
  ProjectModelsTreeFilter: ProjectModelsTreeFilter;
  ProjectModelsUpdatedMessage: Omit<ProjectModelsUpdatedMessage, 'model'> & { model?: Maybe<ResolversParentTypes['Model']> };
  ProjectMoveToWorkspaceDryRun: ProjectMoveToWorkspaceDryRunGraphQLReturn;
  ProjectMutations: MutationsObjectGraphQLReturn;
  ProjectPendingModelsUpdatedMessage: Omit<ProjectPendingModelsUpdatedMessage, 'model'> & { model: ResolversParentTypes['FileUpload'] };
  ProjectPendingVersionsUpdatedMessage: Omit<ProjectPendingVersionsUpdatedMessage, 'version'> & { version: ResolversParentTypes['FileUpload'] };
  ProjectPermissionChecks: ProjectPermissionChecksGraphQLReturn;
  ProjectRole: ProjectRoleGraphQLReturn;
  ProjectTestAutomationCreateInput: ProjectTestAutomationCreateInput;
  ProjectTriggeredAutomationsStatusUpdatedMessage: ProjectTriggeredAutomationsStatusUpdatedMessageGraphQLReturn;
  ProjectUpdateInput: ProjectUpdateInput;
  ProjectUpdateRoleInput: ProjectUpdateRoleInput;
  ProjectUpdatedMessage: Omit<ProjectUpdatedMessage, 'project'> & { project?: Maybe<ResolversParentTypes['Project']> };
  ProjectVersionsPreviewGeneratedMessage: ProjectVersionsPreviewGeneratedMessage;
  ProjectVersionsUpdatedMessage: Omit<ProjectVersionsUpdatedMessage, 'version'> & { version?: Maybe<ResolversParentTypes['Version']> };
  Query: {};
  ReplyCreateInput: ReplyCreateInput;
  ResourceIdentifier: ResourceIdentifier;
  ResourceIdentifierInput: ResourceIdentifierInput;
  Role: Role;
  RootPermissionChecks: RootPermissionChecksGraphQLReturn;
  Scope: Scope;
  ServerApp: ServerAppGraphQLReturn;
  ServerAppListItem: ServerAppListItemGraphQLReturn;
  ServerAutomateInfo: ServerAutomateInfo;
  ServerConfiguration: ServerConfiguration;
  ServerInfo: ServerInfoGraphQLReturn;
  ServerInfoMutations: MutationsObjectGraphQLReturn;
  ServerInfoUpdateInput: ServerInfoUpdateInput;
  ServerInvite: ServerInviteGraphQLReturnType;
  ServerInviteCreateInput: ServerInviteCreateInput;
  ServerMigration: ServerMigration;
  ServerMultiRegionConfiguration: GraphQLEmptyReturn;
  ServerRegionItem: ServerRegionItemGraphQLReturn;
  ServerRegionMutations: MutationsObjectGraphQLReturn;
  ServerRoleItem: ServerRoleItem;
  ServerStatistics: GraphQLEmptyReturn;
  ServerStats: GraphQLEmptyReturn;
  ServerWorkspacesInfo: GraphQLEmptyReturn;
  SetPrimaryUserEmailInput: SetPrimaryUserEmailInput;
  SmartTextEditorValue: SmartTextEditorValueGraphQLReturn;
  StartFileImportInput: StartFileImportInput;
  Stream: StreamGraphQLReturn;
  StreamAccessRequest: StreamAccessRequestGraphQLReturn;
  StreamCollaborator: StreamCollaboratorGraphQLReturn;
  StreamCollection: Omit<StreamCollection, 'items'> & { items?: Maybe<Array<ResolversParentTypes['Stream']>> };
  StreamCreateInput: StreamCreateInput;
  StreamInviteCreateInput: StreamInviteCreateInput;
  StreamRevokePermissionInput: StreamRevokePermissionInput;
  StreamUpdateInput: StreamUpdateInput;
  StreamUpdatePermissionInput: StreamUpdatePermissionInput;
  String: Scalars['String']['output'];
  Subscription: {};
  TestAutomationRun: TestAutomationRun;
  TestAutomationRunTrigger: TestAutomationRunTrigger;
  TestAutomationRunTriggerPayload: TestAutomationRunTriggerPayload;
  TokenResourceIdentifier: TokenResourceIdentifier;
  TokenResourceIdentifierInput: TokenResourceIdentifierInput;
  TriggeredAutomationsStatus: TriggeredAutomationsStatusGraphQLReturn;
  UpdateAutomateFunctionInput: UpdateAutomateFunctionInput;
  UpdateModelInput: UpdateModelInput;
  UpdateServerRegionInput: UpdateServerRegionInput;
  UpdateVersionInput: UpdateVersionInput;
  UpgradePlanInput: UpgradePlanInput;
  User: UserGraphQLReturn;
  UserAutomateInfo: UserAutomateInfoGraphQLReturn;
  UserDeleteInput: UserDeleteInput;
  UserEmail: UserEmail;
  UserEmailMutations: MutationsObjectGraphQLReturn;
  UserGendoAICredits: UserGendoAiCredits;
  UserMeta: UserMetaGraphQLReturn;
  UserMetaMutations: MutationsObjectGraphQLReturn;
  UserProjectCollection: Omit<UserProjectCollection, 'items'> & { items: Array<ResolversParentTypes['Project']> };
  UserProjectsFilter: UserProjectsFilter;
  UserProjectsUpdatedMessage: Omit<UserProjectsUpdatedMessage, 'project'> & { project?: Maybe<ResolversParentTypes['Project']> };
  UserRoleInput: UserRoleInput;
  UserSearchResultCollection: Omit<UserSearchResultCollection, 'items'> & { items: Array<ResolversParentTypes['LimitedUser']> };
  UserStreamCollection: Omit<UserStreamCollection, 'items'> & { items?: Maybe<Array<ResolversParentTypes['Stream']>> };
  UserUpdateInput: UserUpdateInput;
  UserWorkspacesFilter: UserWorkspacesFilter;
  UsersRetrievalInput: UsersRetrievalInput;
  VerifyUserEmailInput: VerifyUserEmailInput;
  Version: VersionGraphQLReturn;
  VersionCollection: Omit<VersionCollection, 'items'> & { items: Array<ResolversParentTypes['Version']> };
  VersionCreatedTrigger: AutomationRunTriggerGraphQLReturn;
  VersionCreatedTriggerDefinition: AutomationRevisionTriggerDefinitionGraphQLReturn;
  VersionMutations: MutationsObjectGraphQLReturn;
  VersionPermissionChecks: VersionPermissionChecksGraphQLReturn;
  ViewerResourceGroup: ViewerResourceGroup;
  ViewerResourceItem: ViewerResourceItem;
  ViewerUpdateTrackingTarget: ViewerUpdateTrackingTarget;
  ViewerUserActivityMessage: Omit<ViewerUserActivityMessage, 'user'> & { user?: Maybe<ResolversParentTypes['LimitedUser']> };
  ViewerUserActivityMessageInput: ViewerUserActivityMessageInput;
  Webhook: WebhookGraphQLReturn;
  WebhookCollection: Omit<WebhookCollection, 'items'> & { items: Array<ResolversParentTypes['Webhook']> };
  WebhookCreateInput: WebhookCreateInput;
  WebhookDeleteInput: WebhookDeleteInput;
  WebhookEvent: WebhookEvent;
  WebhookEventCollection: WebhookEventCollection;
  WebhookUpdateInput: WebhookUpdateInput;
  Workspace: WorkspaceGraphQLReturn;
  WorkspaceBillingMutations: WorkspaceBillingMutationsGraphQLReturn;
  WorkspaceCollaborator: WorkspaceCollaboratorGraphQLReturn;
  WorkspaceCollaboratorCollection: Omit<WorkspaceCollaboratorCollection, 'items'> & { items: Array<ResolversParentTypes['WorkspaceCollaborator']> };
  WorkspaceCollection: Omit<WorkspaceCollection, 'items'> & { items: Array<ResolversParentTypes['Workspace']> };
  WorkspaceCreateInput: WorkspaceCreateInput;
  WorkspaceCreationState: WorkspaceCreationState;
  WorkspaceCreationStateInput: WorkspaceCreationStateInput;
  WorkspaceDismissInput: WorkspaceDismissInput;
  WorkspaceDomain: WorkspaceDomain;
  WorkspaceDomainDeleteInput: WorkspaceDomainDeleteInput;
  WorkspaceEmbedOptions: WorkspaceEmbedOptions;
  WorkspaceInviteCreateInput: WorkspaceInviteCreateInput;
  WorkspaceInviteLookupOptions: WorkspaceInviteLookupOptions;
  WorkspaceInviteMutations: WorkspaceInviteMutationsGraphQLReturn;
  WorkspaceInviteResendInput: WorkspaceInviteResendInput;
  WorkspaceInviteUseInput: WorkspaceInviteUseInput;
  WorkspaceJoinRequest: WorkspaceJoinRequestGraphQLReturn;
  WorkspaceJoinRequestCollection: Omit<WorkspaceJoinRequestCollection, 'items'> & { items: Array<ResolversParentTypes['WorkspaceJoinRequest']> };
  WorkspaceJoinRequestFilter: WorkspaceJoinRequestFilter;
  WorkspaceJoinRequestMutations: WorkspaceJoinRequestMutationsGraphQLReturn;
  WorkspaceMutations: WorkspaceMutationsGraphQLReturn;
  WorkspacePaidPlanPrices: Omit<WorkspacePaidPlanPrices, 'pro' | 'proUnlimited' | 'team' | 'teamUnlimited'> & { pro: ResolversParentTypes['WorkspacePlanPrice'], proUnlimited: ResolversParentTypes['WorkspacePlanPrice'], team: ResolversParentTypes['WorkspacePlanPrice'], teamUnlimited: ResolversParentTypes['WorkspacePlanPrice'] };
  WorkspacePermissionChecks: WorkspacePermissionChecksGraphQLReturn;
  WorkspacePlan: WorkspacePlanGraphQLReturn;
  WorkspacePlanPrice: Omit<WorkspacePlanPrice, 'monthly' | 'yearly'> & { monthly: ResolversParentTypes['Price'], yearly: ResolversParentTypes['Price'] };
  WorkspacePlanUsage: WorkspacePlanUsageGraphQLReturn;
  WorkspaceProjectCreateInput: WorkspaceProjectCreateInput;
  WorkspaceProjectInviteCreateInput: WorkspaceProjectInviteCreateInput;
  WorkspaceProjectMutations: WorkspaceProjectMutationsGraphQLReturn;
  WorkspaceProjectsFilter: WorkspaceProjectsFilter;
  WorkspaceProjectsUpdatedMessage: Omit<WorkspaceProjectsUpdatedMessage, 'project'> & { project?: Maybe<ResolversParentTypes['Project']> };
  WorkspaceRequestToJoinInput: WorkspaceRequestToJoinInput;
  WorkspaceRoleCollection: WorkspaceRoleCollection;
  WorkspaceRoleDeleteInput: WorkspaceRoleDeleteInput;
  WorkspaceRoleUpdateInput: WorkspaceRoleUpdateInput;
  WorkspaceSeatCollection: WorkspaceSeatCollection;
  WorkspaceSeatsByType: WorkspaceSeatsByType;
  WorkspaceSso: WorkspaceSsoGraphQLReturn;
  WorkspaceSsoProvider: WorkspaceSsoProvider;
  WorkspaceSsoSession: WorkspaceSsoSession;
  WorkspaceSubscription: WorkspaceSubscriptionGraphQLReturn;
  WorkspaceSubscriptionSeatCount: WorkspaceSubscriptionSeatCount;
  WorkspaceSubscriptionSeats: WorkspaceSubscriptionSeatsGraphQLReturn;
  WorkspaceTeamByRole: WorkspaceTeamByRole;
  WorkspaceTeamFilter: WorkspaceTeamFilter;
  WorkspaceUpdateEmbedOptionsInput: WorkspaceUpdateEmbedOptionsInput;
  WorkspaceUpdateInput: WorkspaceUpdateInput;
  WorkspaceUpdateSeatTypeInput: WorkspaceUpdateSeatTypeInput;
  WorkspaceUpdatedMessage: Omit<WorkspaceUpdatedMessage, 'workspace'> & { workspace: ResolversParentTypes['Workspace'] };
};

export type HasScopeDirectiveArgs = {
  scope: Scalars['String']['input'];
};

export type HasScopeDirectiveResolver<Result, Parent, ContextType = GraphQLContext, Args = HasScopeDirectiveArgs> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type HasScopesDirectiveArgs = {
  scopes: Array<Maybe<Scalars['String']['input']>>;
};

export type HasScopesDirectiveResolver<Result, Parent, ContextType = GraphQLContext, Args = HasScopesDirectiveArgs> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type HasServerRoleDirectiveArgs = {
  role: ServerRole;
};

export type HasServerRoleDirectiveResolver<Result, Parent, ContextType = GraphQLContext, Args = HasServerRoleDirectiveArgs> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type HasStreamRoleDirectiveArgs = {
  role: StreamRole;
};

export type HasStreamRoleDirectiveResolver<Result, Parent, ContextType = GraphQLContext, Args = HasStreamRoleDirectiveArgs> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type HasWorkspaceRoleDirectiveArgs = {
  role: WorkspaceRole;
};

export type HasWorkspaceRoleDirectiveResolver<Result, Parent, ContextType = GraphQLContext, Args = HasWorkspaceRoleDirectiveArgs> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type IsOwnerDirectiveArgs = { };

export type IsOwnerDirectiveResolver<Result, Parent, ContextType = GraphQLContext, Args = IsOwnerDirectiveArgs> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type ActiveUserMutationsResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ActiveUserMutations'] = ResolversParentTypes['ActiveUserMutations']> = {
  emailMutations?: Resolver<ResolversTypes['UserEmailMutations'], ParentType, ContextType>;
  finishOnboarding?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, Partial<ActiveUserMutationsFinishOnboardingArgs>>;
  meta?: Resolver<ResolversTypes['UserMetaMutations'], ParentType, ContextType>;
  setActiveWorkspace?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, Partial<ActiveUserMutationsSetActiveWorkspaceArgs>>;
  update?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<ActiveUserMutationsUpdateArgs, 'user'>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ActivityResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Activity'] = ResolversParentTypes['Activity']> = {
  actionType?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  info?: Resolver<ResolversTypes['JSONObject'], ParentType, ContextType>;
  message?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  resourceId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  resourceType?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  streamId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  time?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ActivityCollectionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ActivityCollection'] = ResolversParentTypes['ActivityCollection']> = {
  cursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  items?: Resolver<Array<ResolversTypes['Activity']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AdminInviteListResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['AdminInviteList'] = ResolversParentTypes['AdminInviteList']> = {
  cursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  items?: Resolver<Array<ResolversTypes['ServerInvite']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AdminMutationsResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['AdminMutations'] = ResolversParentTypes['AdminMutations']> = {
  updateWorkspacePlan?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<AdminMutationsUpdateWorkspacePlanArgs, 'input'>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AdminQueriesResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['AdminQueries'] = ResolversParentTypes['AdminQueries']> = {
  inviteList?: Resolver<ResolversTypes['AdminInviteList'], ParentType, ContextType, RequireFields<AdminQueriesInviteListArgs, 'cursor' | 'limit' | 'query'>>;
  projectList?: Resolver<ResolversTypes['ProjectCollection'], ParentType, ContextType, RequireFields<AdminQueriesProjectListArgs, 'cursor' | 'limit'>>;
  serverStatistics?: Resolver<ResolversTypes['ServerStatistics'], ParentType, ContextType>;
  userList?: Resolver<ResolversTypes['AdminUserList'], ParentType, ContextType, RequireFields<AdminQueriesUserListArgs, 'cursor' | 'limit' | 'query' | 'role'>>;
  workspaceList?: Resolver<ResolversTypes['WorkspaceCollection'], ParentType, ContextType, RequireFields<AdminQueriesWorkspaceListArgs, 'cursor' | 'limit'>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AdminUserListResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['AdminUserList'] = ResolversParentTypes['AdminUserList']> = {
  cursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  items?: Resolver<Array<ResolversTypes['AdminUserListItem']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AdminUserListItemResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['AdminUserListItem'] = ResolversParentTypes['AdminUserListItem']> = {
  avatar?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  company?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  email?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  role?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  verified?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AdminUsersListCollectionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['AdminUsersListCollection'] = ResolversParentTypes['AdminUsersListCollection']> = {
  items?: Resolver<Array<ResolversTypes['AdminUsersListItem']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AdminUsersListItemResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['AdminUsersListItem'] = ResolversParentTypes['AdminUsersListItem']> = {
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  invitedUser?: Resolver<Maybe<ResolversTypes['ServerInvite']>, ParentType, ContextType>;
  registeredUser?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ApiTokenResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ApiToken'] = ResolversParentTypes['ApiToken']> = {
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  lastChars?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  lastUsed?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  lifespan?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  scopes?: Resolver<Array<Maybe<ResolversTypes['String']>>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AppAuthorResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['AppAuthor'] = ResolversParentTypes['AppAuthor']> = {
  avatar?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AuthStrategyResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['AuthStrategy'] = ResolversParentTypes['AuthStrategy']> = {
  color?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  icon?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  url?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AutomateFunctionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['AutomateFunction'] = ResolversParentTypes['AutomateFunction']> = {
  creator?: Resolver<Maybe<ResolversTypes['LimitedUser']>, ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isFeatured?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  logo?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  releases?: Resolver<ResolversTypes['AutomateFunctionReleaseCollection'], ParentType, ContextType, Partial<AutomateFunctionReleasesArgs>>;
  repo?: Resolver<ResolversTypes['BasicGitRepositoryMetadata'], ParentType, ContextType>;
  supportedSourceApps?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  tags?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  workspaceIds?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AutomateFunctionCollectionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['AutomateFunctionCollection'] = ResolversParentTypes['AutomateFunctionCollection']> = {
  cursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  items?: Resolver<Array<ResolversTypes['AutomateFunction']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AutomateFunctionReleaseResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['AutomateFunctionRelease'] = ResolversParentTypes['AutomateFunctionRelease']> = {
  commitId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  function?: Resolver<ResolversTypes['AutomateFunction'], ParentType, ContextType>;
  functionId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  inputSchema?: Resolver<Maybe<ResolversTypes['JSONObject']>, ParentType, ContextType>;
  versionTag?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AutomateFunctionReleaseCollectionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['AutomateFunctionReleaseCollection'] = ResolversParentTypes['AutomateFunctionReleaseCollection']> = {
  cursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  items?: Resolver<Array<ResolversTypes['AutomateFunctionRelease']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AutomateFunctionRunResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['AutomateFunctionRun'] = ResolversParentTypes['AutomateFunctionRun']> = {
  contextView?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  elapsed?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  function?: Resolver<Maybe<ResolversTypes['AutomateFunction']>, ParentType, ContextType>;
  functionId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  functionReleaseId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  results?: Resolver<Maybe<ResolversTypes['JSONObject']>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes['AutomateRunStatus'], ParentType, ContextType>;
  statusMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AutomateFunctionTemplateResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['AutomateFunctionTemplate'] = ResolversParentTypes['AutomateFunctionTemplate']> = {
  id?: Resolver<ResolversTypes['AutomateFunctionTemplateLanguage'], ParentType, ContextType>;
  logo?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  url?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AutomateFunctionTokenResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['AutomateFunctionToken'] = ResolversParentTypes['AutomateFunctionToken']> = {
  functionId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  functionToken?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AutomateMutationsResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['AutomateMutations'] = ResolversParentTypes['AutomateMutations']> = {
  createFunction?: Resolver<ResolversTypes['AutomateFunction'], ParentType, ContextType, RequireFields<AutomateMutationsCreateFunctionArgs, 'input'>>;
  createFunctionWithoutVersion?: Resolver<ResolversTypes['AutomateFunctionToken'], ParentType, ContextType, RequireFields<AutomateMutationsCreateFunctionWithoutVersionArgs, 'input'>>;
  updateFunction?: Resolver<ResolversTypes['AutomateFunction'], ParentType, ContextType, RequireFields<AutomateMutationsUpdateFunctionArgs, 'input'>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AutomateRunResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['AutomateRun'] = ResolversParentTypes['AutomateRun']> = {
  automation?: Resolver<ResolversTypes['Automation'], ParentType, ContextType>;
  automationId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  functionRuns?: Resolver<Array<ResolversTypes['AutomateFunctionRun']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['AutomateRunStatus'], ParentType, ContextType>;
  trigger?: Resolver<ResolversTypes['AutomationRunTrigger'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AutomateRunCollectionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['AutomateRunCollection'] = ResolversParentTypes['AutomateRunCollection']> = {
  cursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  items?: Resolver<Array<ResolversTypes['AutomateRun']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AutomationResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Automation'] = ResolversParentTypes['Automation']> = {
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  creationPublicKeys?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  currentRevision?: Resolver<Maybe<ResolversTypes['AutomationRevision']>, ParentType, ContextType>;
  enabled?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isTestAutomation?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  permissions?: Resolver<ResolversTypes['AutomationPermissionChecks'], ParentType, ContextType>;
  runs?: Resolver<ResolversTypes['AutomateRunCollection'], ParentType, ContextType, Partial<AutomationRunsArgs>>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AutomationCollectionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['AutomationCollection'] = ResolversParentTypes['AutomationCollection']> = {
  cursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  items?: Resolver<Array<ResolversTypes['Automation']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AutomationPermissionChecksResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['AutomationPermissionChecks'] = ResolversParentTypes['AutomationPermissionChecks']> = {
  canDelete?: Resolver<ResolversTypes['PermissionCheckResult'], ParentType, ContextType>;
  canRead?: Resolver<ResolversTypes['PermissionCheckResult'], ParentType, ContextType>;
  canUpdate?: Resolver<ResolversTypes['PermissionCheckResult'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AutomationRevisionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['AutomationRevision'] = ResolversParentTypes['AutomationRevision']> = {
  functions?: Resolver<Array<ResolversTypes['AutomationRevisionFunction']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  triggerDefinitions?: Resolver<Array<ResolversTypes['AutomationRevisionTriggerDefinition']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AutomationRevisionFunctionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['AutomationRevisionFunction'] = ResolversParentTypes['AutomationRevisionFunction']> = {
  parameters?: Resolver<Maybe<ResolversTypes['JSONObject']>, ParentType, ContextType>;
  release?: Resolver<ResolversTypes['AutomateFunctionRelease'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AutomationRevisionTriggerDefinitionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['AutomationRevisionTriggerDefinition'] = ResolversParentTypes['AutomationRevisionTriggerDefinition']> = {
  __resolveType: TypeResolveFn<'VersionCreatedTriggerDefinition', ParentType, ContextType>;
};

export type AutomationRunTriggerResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['AutomationRunTrigger'] = ResolversParentTypes['AutomationRunTrigger']> = {
  __resolveType: TypeResolveFn<'VersionCreatedTrigger', ParentType, ContextType>;
};

export type BasicGitRepositoryMetadataResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['BasicGitRepositoryMetadata'] = ResolversParentTypes['BasicGitRepositoryMetadata']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  owner?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  url?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface BigIntScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['BigInt'], any> {
  name: 'BigInt';
}

export type BlobMetadataResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['BlobMetadata'] = ResolversParentTypes['BlobMetadata']> = {
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  fileHash?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  fileName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  fileSize?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  fileType?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  streamId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uploadError?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  uploadStatus?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BlobMetadataCollectionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['BlobMetadataCollection'] = ResolversParentTypes['BlobMetadataCollection']> = {
  cursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  items?: Resolver<Maybe<Array<ResolversTypes['BlobMetadata']>>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalSize?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BranchResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Branch'] = ResolversParentTypes['Branch']> = {
  activity?: Resolver<Maybe<ResolversTypes['ActivityCollection']>, ParentType, ContextType, RequireFields<BranchActivityArgs, 'limit'>>;
  author?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  commits?: Resolver<Maybe<ResolversTypes['CommitCollection']>, ParentType, ContextType, RequireFields<BranchCommitsArgs, 'limit'>>;
  createdAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BranchCollectionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['BranchCollection'] = ResolversParentTypes['BranchCollection']> = {
  cursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  items?: Resolver<Maybe<Array<ResolversTypes['Branch']>>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CheckoutSessionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['CheckoutSession'] = ResolversParentTypes['CheckoutSession']> = {
  billingInterval?: Resolver<ResolversTypes['BillingInterval'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  paymentStatus?: Resolver<ResolversTypes['SessionPaymentStatus'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  url?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  workspacePlan?: Resolver<ResolversTypes['PaidWorkspacePlans'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CommentResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Comment'] = ResolversParentTypes['Comment']> = {
  archived?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  author?: Resolver<ResolversTypes['LimitedUser'], ParentType, ContextType>;
  authorId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  data?: Resolver<Maybe<ResolversTypes['JSONObject']>, ParentType, ContextType>;
  hasParent?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  parent?: Resolver<Maybe<ResolversTypes['Comment']>, ParentType, ContextType>;
  permissions?: Resolver<ResolversTypes['CommentPermissionChecks'], ParentType, ContextType>;
  rawText?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  reactions?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  replies?: Resolver<ResolversTypes['CommentCollection'], ParentType, ContextType, RequireFields<CommentRepliesArgs, 'limit'>>;
  replyAuthors?: Resolver<ResolversTypes['CommentReplyAuthorCollection'], ParentType, ContextType, RequireFields<CommentReplyAuthorsArgs, 'limit'>>;
  resources?: Resolver<Array<ResolversTypes['ResourceIdentifier']>, ParentType, ContextType>;
  screenshot?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  text?: Resolver<Maybe<ResolversTypes['SmartTextEditorValue']>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  viewedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  viewerResources?: Resolver<Array<ResolversTypes['ViewerResourceItem']>, ParentType, ContextType>;
  viewerState?: Resolver<Maybe<ResolversTypes['JSONObject']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CommentActivityMessageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['CommentActivityMessage'] = ResolversParentTypes['CommentActivityMessage']> = {
  comment?: Resolver<ResolversTypes['Comment'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CommentCollectionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['CommentCollection'] = ResolversParentTypes['CommentCollection']> = {
  cursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  items?: Resolver<Array<ResolversTypes['Comment']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CommentDataFiltersResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['CommentDataFilters'] = ResolversParentTypes['CommentDataFilters']> = {
  hiddenIds?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  isolatedIds?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  passMax?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  passMin?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  propertyInfoKey?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  sectionBox?: Resolver<Maybe<ResolversTypes['JSONObject']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CommentMutationsResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['CommentMutations'] = ResolversParentTypes['CommentMutations']> = {
  archive?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<CommentMutationsArchiveArgs, 'input'>>;
  create?: Resolver<ResolversTypes['Comment'], ParentType, ContextType, RequireFields<CommentMutationsCreateArgs, 'input'>>;
  edit?: Resolver<ResolversTypes['Comment'], ParentType, ContextType, RequireFields<CommentMutationsEditArgs, 'input'>>;
  markViewed?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<CommentMutationsMarkViewedArgs, 'input'>>;
  reply?: Resolver<ResolversTypes['Comment'], ParentType, ContextType, RequireFields<CommentMutationsReplyArgs, 'input'>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CommentPermissionChecksResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['CommentPermissionChecks'] = ResolversParentTypes['CommentPermissionChecks']> = {
  canArchive?: Resolver<ResolversTypes['PermissionCheckResult'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CommentReplyAuthorCollectionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['CommentReplyAuthorCollection'] = ResolversParentTypes['CommentReplyAuthorCollection']> = {
  items?: Resolver<Array<ResolversTypes['LimitedUser']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CommentThreadActivityMessageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['CommentThreadActivityMessage'] = ResolversParentTypes['CommentThreadActivityMessage']> = {
  data?: Resolver<Maybe<ResolversTypes['JSONObject']>, ParentType, ContextType>;
  reply?: Resolver<Maybe<ResolversTypes['Comment']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CommitResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Commit'] = ResolversParentTypes['Commit']> = {
  activity?: Resolver<Maybe<ResolversTypes['ActivityCollection']>, ParentType, ContextType, RequireFields<CommitActivityArgs, 'limit'>>;
  authorAvatar?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  authorId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  authorName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  branch?: Resolver<Maybe<ResolversTypes['Branch']>, ParentType, ContextType>;
  branchName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  commentCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  createdAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  message?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  parents?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  referencedObject?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  sourceApplication?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  stream?: Resolver<ResolversTypes['Stream'], ParentType, ContextType>;
  streamId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  streamName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  totalChildrenCount?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CommitCollectionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['CommitCollection'] = ResolversParentTypes['CommitCollection']> = {
  cursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  items?: Resolver<Maybe<Array<ResolversTypes['Commit']>>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CountOnlyCollectionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['CountOnlyCollection'] = ResolversParentTypes['CountOnlyCollection']> = {
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CreateEmbedTokenReturnResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['CreateEmbedTokenReturn'] = ResolversParentTypes['CreateEmbedTokenReturn']> = {
  token?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  tokenMetadata?: Resolver<ResolversTypes['EmbedToken'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CurrencyBasedPricesResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['CurrencyBasedPrices'] = ResolversParentTypes['CurrencyBasedPrices']> = {
  gbp?: Resolver<ResolversTypes['WorkspacePaidPlanPrices'], ParentType, ContextType>;
  usd?: Resolver<ResolversTypes['WorkspacePaidPlanPrices'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface DateTimeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['DateTime'], any> {
  name: 'DateTime';
}

export type EmbedTokenResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['EmbedToken'] = ResolversParentTypes['EmbedToken']> = {
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  lastUsed?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  lifespan?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  projectId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  resourceIdString?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  tokenId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  user?: Resolver<Maybe<ResolversTypes['LimitedUser']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type EmbedTokenCollectionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['EmbedTokenCollection'] = ResolversParentTypes['EmbedTokenCollection']> = {
  cursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  items?: Resolver<Array<ResolversTypes['EmbedToken']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type FileUploadResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['FileUpload'] = ResolversParentTypes['FileUpload']> = {
  branchName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  convertedCommitId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  convertedLastUpdate?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  convertedMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  convertedStatus?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  convertedVersionId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  fileName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  fileSize?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  fileType?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  model?: Resolver<Maybe<ResolversTypes['Model']>, ParentType, ContextType>;
  modelId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  modelName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  projectId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  streamId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  uploadComplete?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  uploadDate?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type FileUploadCollectionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['FileUploadCollection'] = ResolversParentTypes['FileUploadCollection']> = {
  cursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  items?: Resolver<Array<ResolversTypes['FileUpload']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type FileUploadMutationsResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['FileUploadMutations'] = ResolversParentTypes['FileUploadMutations']> = {
  generateUploadUrl?: Resolver<ResolversTypes['GenerateFileUploadUrlOutput'], ParentType, ContextType, RequireFields<FileUploadMutationsGenerateUploadUrlArgs, 'input'>>;
  startFileImport?: Resolver<ResolversTypes['FileUpload'], ParentType, ContextType, RequireFields<FileUploadMutationsStartFileImportArgs, 'input'>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type GendoAiRenderResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['GendoAIRender'] = ResolversParentTypes['GendoAIRender']> = {
  camera?: Resolver<Maybe<ResolversTypes['JSONObject']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  gendoGenerationId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  modelId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  projectId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  prompt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  responseImage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  user?: Resolver<Maybe<ResolversTypes['LimitedUser']>, ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  versionId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type GendoAiRenderCollectionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['GendoAIRenderCollection'] = ResolversParentTypes['GendoAIRenderCollection']> = {
  items?: Resolver<Array<Maybe<ResolversTypes['GendoAIRender']>>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type GenerateFileUploadUrlOutputResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['GenerateFileUploadUrlOutput'] = ResolversParentTypes['GenerateFileUploadUrlOutput']> = {
  fileId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  url?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface JsonObjectScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['JSONObject'], any> {
  name: 'JSONObject';
}

export type LegacyCommentViewerDataResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['LegacyCommentViewerData'] = ResolversParentTypes['LegacyCommentViewerData']> = {
  camPos?: Resolver<Array<ResolversTypes['Float']>, ParentType, ContextType>;
  filters?: Resolver<ResolversTypes['CommentDataFilters'], ParentType, ContextType>;
  location?: Resolver<ResolversTypes['JSONObject'], ParentType, ContextType>;
  sectionBox?: Resolver<Maybe<ResolversTypes['JSONObject']>, ParentType, ContextType>;
  selection?: Resolver<Maybe<ResolversTypes['JSONObject']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type LimitedUserResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['LimitedUser'] = ResolversParentTypes['LimitedUser']> = {
  activity?: Resolver<Maybe<ResolversTypes['ActivityCollection']>, ParentType, ContextType, RequireFields<LimitedUserActivityArgs, 'limit'>>;
  avatar?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  bio?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  commits?: Resolver<Maybe<ResolversTypes['CommitCollection']>, ParentType, ContextType, RequireFields<LimitedUserCommitsArgs, 'limit'>>;
  company?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  role?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  streams?: Resolver<ResolversTypes['UserStreamCollection'], ParentType, ContextType, RequireFields<LimitedUserStreamsArgs, 'limit'>>;
  timeline?: Resolver<Maybe<ResolversTypes['ActivityCollection']>, ParentType, ContextType, RequireFields<LimitedUserTimelineArgs, 'limit'>>;
  totalOwnedStreamsFavorites?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  verified?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  workspaceDomainPolicyCompliant?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, Partial<LimitedUserWorkspaceDomainPolicyCompliantArgs>>;
  workspaceRole?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<LimitedUserWorkspaceRoleArgs>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type LimitedWorkspaceResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['LimitedWorkspace'] = ResolversParentTypes['LimitedWorkspace']> = {
  adminTeam?: Resolver<Array<ResolversTypes['LimitedWorkspaceCollaborator']>, ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  discoverabilityAutoJoinEnabled?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  logo?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  slug?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  team?: Resolver<Maybe<ResolversTypes['LimitedWorkspaceCollaboratorCollection']>, ParentType, ContextType, RequireFields<LimitedWorkspaceTeamArgs, 'limit'>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type LimitedWorkspaceCollaboratorResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['LimitedWorkspaceCollaborator'] = ResolversParentTypes['LimitedWorkspaceCollaborator']> = {
  user?: Resolver<ResolversTypes['LimitedUser'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type LimitedWorkspaceCollaboratorCollectionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['LimitedWorkspaceCollaboratorCollection'] = ResolversParentTypes['LimitedWorkspaceCollaboratorCollection']> = {
  cursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  items?: Resolver<Array<ResolversTypes['LimitedWorkspaceCollaborator']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type LimitedWorkspaceJoinRequestResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['LimitedWorkspaceJoinRequest'] = ResolversParentTypes['LimitedWorkspaceJoinRequest']> = {
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['WorkspaceJoinRequestStatus'], ParentType, ContextType>;
  user?: Resolver<ResolversTypes['LimitedUser'], ParentType, ContextType>;
  workspace?: Resolver<ResolversTypes['LimitedWorkspace'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type LimitedWorkspaceJoinRequestCollectionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['LimitedWorkspaceJoinRequestCollection'] = ResolversParentTypes['LimitedWorkspaceJoinRequestCollection']> = {
  cursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  items?: Resolver<Array<ResolversTypes['LimitedWorkspaceJoinRequest']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ModelResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Model'] = ResolversParentTypes['Model']> = {
  author?: Resolver<Maybe<ResolversTypes['LimitedUser']>, ParentType, ContextType>;
  automationsStatus?: Resolver<Maybe<ResolversTypes['TriggeredAutomationsStatus']>, ParentType, ContextType>;
  childrenTree?: Resolver<Array<ResolversTypes['ModelsTreeItem']>, ParentType, ContextType>;
  commentThreads?: Resolver<ResolversTypes['CommentCollection'], ParentType, ContextType, RequireFields<ModelCommentThreadsArgs, 'limit'>>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  displayName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  pendingImportedVersions?: Resolver<Array<ResolversTypes['FileUpload']>, ParentType, ContextType, RequireFields<ModelPendingImportedVersionsArgs, 'limit'>>;
  permissions?: Resolver<ResolversTypes['ModelPermissionChecks'], ParentType, ContextType>;
  previewUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  uploads?: Resolver<ResolversTypes['FileUploadCollection'], ParentType, ContextType, Partial<ModelUploadsArgs>>;
  version?: Resolver<ResolversTypes['Version'], ParentType, ContextType, RequireFields<ModelVersionArgs, 'id'>>;
  versions?: Resolver<ResolversTypes['VersionCollection'], ParentType, ContextType, RequireFields<ModelVersionsArgs, 'limit'>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ModelCollectionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ModelCollection'] = ResolversParentTypes['ModelCollection']> = {
  cursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  items?: Resolver<Array<ResolversTypes['Model']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ModelMutationsResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ModelMutations'] = ResolversParentTypes['ModelMutations']> = {
  create?: Resolver<ResolversTypes['Model'], ParentType, ContextType, RequireFields<ModelMutationsCreateArgs, 'input'>>;
  delete?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<ModelMutationsDeleteArgs, 'input'>>;
  update?: Resolver<ResolversTypes['Model'], ParentType, ContextType, RequireFields<ModelMutationsUpdateArgs, 'input'>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ModelPermissionChecksResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ModelPermissionChecks'] = ResolversParentTypes['ModelPermissionChecks']> = {
  canCreateVersion?: Resolver<ResolversTypes['PermissionCheckResult'], ParentType, ContextType>;
  canDelete?: Resolver<ResolversTypes['PermissionCheckResult'], ParentType, ContextType>;
  canUpdate?: Resolver<ResolversTypes['PermissionCheckResult'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ModelsTreeItemResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ModelsTreeItem'] = ResolversParentTypes['ModelsTreeItem']> = {
  children?: Resolver<Array<ResolversTypes['ModelsTreeItem']>, ParentType, ContextType>;
  fullName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  hasChildren?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  model?: Resolver<Maybe<ResolversTypes['Model']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ModelsTreeItemCollectionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ModelsTreeItemCollection'] = ResolversParentTypes['ModelsTreeItemCollection']> = {
  cursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  items?: Resolver<Array<ResolversTypes['ModelsTreeItem']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MutationResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  _?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  activeUserMutations?: Resolver<ResolversTypes['ActiveUserMutations'], ParentType, ContextType>;
  admin?: Resolver<ResolversTypes['AdminMutations'], ParentType, ContextType>;
  adminDeleteUser?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationAdminDeleteUserArgs, 'userConfirmation'>>;
  apiTokenCreate?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<MutationApiTokenCreateArgs, 'token'>>;
  apiTokenRevoke?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationApiTokenRevokeArgs, 'token'>>;
  appCreate?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<MutationAppCreateArgs, 'app'>>;
  appDelete?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationAppDeleteArgs, 'appId'>>;
  appRevokeAccess?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, RequireFields<MutationAppRevokeAccessArgs, 'appId'>>;
  appTokenCreate?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<MutationAppTokenCreateArgs, 'token'>>;
  appUpdate?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationAppUpdateArgs, 'app'>>;
  automateFunctionRunStatusReport?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationAutomateFunctionRunStatusReportArgs, 'input'>>;
  automateMutations?: Resolver<ResolversTypes['AutomateMutations'], ParentType, ContextType>;
  branchCreate?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<MutationBranchCreateArgs, 'branch'>>;
  branchDelete?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationBranchDeleteArgs, 'branch'>>;
  branchUpdate?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationBranchUpdateArgs, 'branch'>>;
  broadcastViewerUserActivity?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationBroadcastViewerUserActivityArgs, 'message' | 'projectId' | 'resourceIdString'>>;
  commentArchive?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationCommentArchiveArgs, 'archived' | 'commentId' | 'streamId'>>;
  commentCreate?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<MutationCommentCreateArgs, 'input'>>;
  commentEdit?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationCommentEditArgs, 'input'>>;
  commentMutations?: Resolver<ResolversTypes['CommentMutations'], ParentType, ContextType>;
  commentReply?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<MutationCommentReplyArgs, 'input'>>;
  commentView?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationCommentViewArgs, 'commentId' | 'streamId'>>;
  commitCreate?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<MutationCommitCreateArgs, 'commit'>>;
  commitDelete?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationCommitDeleteArgs, 'commit'>>;
  commitReceive?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationCommitReceiveArgs, 'input'>>;
  commitUpdate?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationCommitUpdateArgs, 'commit'>>;
  commitsDelete?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationCommitsDeleteArgs, 'input'>>;
  commitsMove?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationCommitsMoveArgs, 'input'>>;
  fileUploadMutations?: Resolver<ResolversTypes['FileUploadMutations'], ParentType, ContextType>;
  inviteDelete?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationInviteDeleteArgs, 'inviteId'>>;
  inviteResend?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationInviteResendArgs, 'inviteId'>>;
  modelMutations?: Resolver<ResolversTypes['ModelMutations'], ParentType, ContextType>;
  objectCreate?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType, RequireFields<MutationObjectCreateArgs, 'objectInput'>>;
  projectMutations?: Resolver<ResolversTypes['ProjectMutations'], ParentType, ContextType>;
  requestVerification?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  requestVerificationByEmail?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationRequestVerificationByEmailArgs, 'email'>>;
  serverInfoMutations?: Resolver<ResolversTypes['ServerInfoMutations'], ParentType, ContextType>;
  serverInfoUpdate?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, RequireFields<MutationServerInfoUpdateArgs, 'info'>>;
  serverInviteBatchCreate?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationServerInviteBatchCreateArgs, 'input'>>;
  serverInviteCreate?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationServerInviteCreateArgs, 'input'>>;
  streamAccessRequestCreate?: Resolver<ResolversTypes['StreamAccessRequest'], ParentType, ContextType, RequireFields<MutationStreamAccessRequestCreateArgs, 'streamId'>>;
  streamAccessRequestUse?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationStreamAccessRequestUseArgs, 'accept' | 'requestId' | 'role'>>;
  streamCreate?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, RequireFields<MutationStreamCreateArgs, 'stream'>>;
  streamDelete?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationStreamDeleteArgs, 'id'>>;
  streamFavorite?: Resolver<Maybe<ResolversTypes['Stream']>, ParentType, ContextType, RequireFields<MutationStreamFavoriteArgs, 'favorited' | 'streamId'>>;
  streamInviteBatchCreate?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationStreamInviteBatchCreateArgs, 'input'>>;
  streamInviteCancel?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationStreamInviteCancelArgs, 'inviteId' | 'streamId'>>;
  streamInviteCreate?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationStreamInviteCreateArgs, 'input'>>;
  streamInviteUse?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationStreamInviteUseArgs, 'accept' | 'streamId' | 'token'>>;
  streamLeave?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationStreamLeaveArgs, 'streamId'>>;
  streamRevokePermission?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, RequireFields<MutationStreamRevokePermissionArgs, 'permissionParams'>>;
  streamUpdate?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationStreamUpdateArgs, 'stream'>>;
  streamUpdatePermission?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, RequireFields<MutationStreamUpdatePermissionArgs, 'permissionParams'>>;
  streamsDelete?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, Partial<MutationStreamsDeleteArgs>>;
  userCommentThreadActivityBroadcast?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationUserCommentThreadActivityBroadcastArgs, 'commentId' | 'streamId'>>;
  userDelete?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationUserDeleteArgs, 'userConfirmation'>>;
  userNotificationPreferencesUpdate?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, RequireFields<MutationUserNotificationPreferencesUpdateArgs, 'preferences'>>;
  userRoleChange?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationUserRoleChangeArgs, 'userRoleInput'>>;
  userUpdate?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationUserUpdateArgs, 'user'>>;
  userViewerActivityBroadcast?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationUserViewerActivityBroadcastArgs, 'resourceId' | 'streamId'>>;
  versionMutations?: Resolver<ResolversTypes['VersionMutations'], ParentType, ContextType>;
  webhookCreate?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<MutationWebhookCreateArgs, 'webhook'>>;
  webhookDelete?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<MutationWebhookDeleteArgs, 'webhook'>>;
  webhookUpdate?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<MutationWebhookUpdateArgs, 'webhook'>>;
  workspaceJoinRequestMutations?: Resolver<ResolversTypes['WorkspaceJoinRequestMutations'], ParentType, ContextType>;
  workspaceMutations?: Resolver<ResolversTypes['WorkspaceMutations'], ParentType, ContextType>;
};

export type ObjectResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Object'] = ResolversParentTypes['Object']> = {
  applicationId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  children?: Resolver<ResolversTypes['ObjectCollection'], ParentType, ContextType, RequireFields<ObjectChildrenArgs, 'depth' | 'limit'>>;
  commentCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  createdAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  data?: Resolver<Maybe<ResolversTypes['JSONObject']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  speckleType?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  totalChildrenCount?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ObjectCollectionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ObjectCollection'] = ResolversParentTypes['ObjectCollection']> = {
  cursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  objects?: Resolver<Array<ResolversTypes['Object']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PasswordStrengthCheckFeedbackResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['PasswordStrengthCheckFeedback'] = ResolversParentTypes['PasswordStrengthCheckFeedback']> = {
  suggestions?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  warning?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PasswordStrengthCheckResultsResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['PasswordStrengthCheckResults'] = ResolversParentTypes['PasswordStrengthCheckResults']> = {
  feedback?: Resolver<ResolversTypes['PasswordStrengthCheckFeedback'], ParentType, ContextType>;
  score?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PendingStreamCollaboratorResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['PendingStreamCollaborator'] = ResolversParentTypes['PendingStreamCollaborator']> = {
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  inviteId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  invitedBy?: Resolver<ResolversTypes['LimitedUser'], ParentType, ContextType>;
  projectId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  projectName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  role?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  streamId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  streamName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  token?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  user?: Resolver<Maybe<ResolversTypes['LimitedUser']>, ParentType, ContextType>;
  workspaceSlug?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PendingWorkspaceCollaboratorResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['PendingWorkspaceCollaborator'] = ResolversParentTypes['PendingWorkspaceCollaborator']> = {
  email?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  inviteId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  invitedBy?: Resolver<ResolversTypes['LimitedUser'], ParentType, ContextType>;
  role?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  token?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  user?: Resolver<Maybe<ResolversTypes['LimitedUser']>, ParentType, ContextType>;
  workspace?: Resolver<ResolversTypes['LimitedWorkspace'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PermissionCheckResultResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['PermissionCheckResult'] = ResolversParentTypes['PermissionCheckResult']> = {
  authorized?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  code?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  message?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  payload?: Resolver<Maybe<ResolversTypes['JSONObject']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PriceResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Price'] = ResolversParentTypes['Price']> = {
  amount?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  currency?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  currencySymbol?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ProjectResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Project'] = ResolversParentTypes['Project']> = {
  allowPublicComments?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  automation?: Resolver<ResolversTypes['Automation'], ParentType, ContextType, RequireFields<ProjectAutomationArgs, 'id'>>;
  automations?: Resolver<ResolversTypes['AutomationCollection'], ParentType, ContextType, Partial<ProjectAutomationsArgs>>;
  blob?: Resolver<Maybe<ResolversTypes['BlobMetadata']>, ParentType, ContextType, RequireFields<ProjectBlobArgs, 'id'>>;
  blobs?: Resolver<Maybe<ResolversTypes['BlobMetadataCollection']>, ParentType, ContextType, RequireFields<ProjectBlobsArgs, 'cursor' | 'limit' | 'query'>>;
  comment?: Resolver<Maybe<ResolversTypes['Comment']>, ParentType, ContextType, RequireFields<ProjectCommentArgs, 'id'>>;
  commentThreads?: Resolver<ResolversTypes['ProjectCommentCollection'], ParentType, ContextType, Partial<ProjectCommentThreadsArgs>>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  embedOptions?: Resolver<ResolversTypes['ProjectEmbedOptions'], ParentType, ContextType>;
  embedTokens?: Resolver<ResolversTypes['EmbedTokenCollection'], ParentType, ContextType, Partial<ProjectEmbedTokensArgs>>;
  hasAccessToFeature?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<ProjectHasAccessToFeatureArgs, 'featureName'>>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  invitableCollaborators?: Resolver<ResolversTypes['WorkspaceCollaboratorCollection'], ParentType, ContextType, RequireFields<ProjectInvitableCollaboratorsArgs, 'limit'>>;
  invitedTeam?: Resolver<Maybe<Array<ResolversTypes['PendingStreamCollaborator']>>, ParentType, ContextType>;
  model?: Resolver<ResolversTypes['Model'], ParentType, ContextType, RequireFields<ProjectModelArgs, 'id'>>;
  modelByName?: Resolver<ResolversTypes['Model'], ParentType, ContextType, RequireFields<ProjectModelByNameArgs, 'name'>>;
  modelChildrenTree?: Resolver<Array<ResolversTypes['ModelsTreeItem']>, ParentType, ContextType, RequireFields<ProjectModelChildrenTreeArgs, 'fullName'>>;
  models?: Resolver<ResolversTypes['ModelCollection'], ParentType, ContextType, RequireFields<ProjectModelsArgs, 'limit'>>;
  modelsTree?: Resolver<ResolversTypes['ModelsTreeItemCollection'], ParentType, ContextType, RequireFields<ProjectModelsTreeArgs, 'limit'>>;
  moveToWorkspaceDryRun?: Resolver<ResolversTypes['ProjectMoveToWorkspaceDryRun'], ParentType, ContextType, RequireFields<ProjectMoveToWorkspaceDryRunArgs, 'workspaceId'>>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  object?: Resolver<Maybe<ResolversTypes['Object']>, ParentType, ContextType, RequireFields<ProjectObjectArgs, 'id'>>;
  pendingAccessRequests?: Resolver<Maybe<Array<ResolversTypes['ProjectAccessRequest']>>, ParentType, ContextType>;
  pendingImportedModels?: Resolver<Array<ResolversTypes['FileUpload']>, ParentType, ContextType, RequireFields<ProjectPendingImportedModelsArgs, 'limit'>>;
  permissions?: Resolver<ResolversTypes['ProjectPermissionChecks'], ParentType, ContextType>;
  role?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  sourceApps?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  team?: Resolver<Array<ResolversTypes['ProjectCollaborator']>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  version?: Resolver<ResolversTypes['Version'], ParentType, ContextType, RequireFields<ProjectVersionArgs, 'id'>>;
  versions?: Resolver<ResolversTypes['VersionCollection'], ParentType, ContextType, RequireFields<ProjectVersionsArgs, 'limit'>>;
  viewerResources?: Resolver<Array<ResolversTypes['ViewerResourceGroup']>, ParentType, ContextType, RequireFields<ProjectViewerResourcesArgs, 'loadedVersionsOnly' | 'resourceIdString'>>;
  visibility?: Resolver<ResolversTypes['ProjectVisibility'], ParentType, ContextType>;
  webhooks?: Resolver<ResolversTypes['WebhookCollection'], ParentType, ContextType, Partial<ProjectWebhooksArgs>>;
  workspace?: Resolver<Maybe<ResolversTypes['Workspace']>, ParentType, ContextType>;
  workspaceId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ProjectAccessRequestResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ProjectAccessRequest'] = ResolversParentTypes['ProjectAccessRequest']> = {
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  project?: Resolver<ResolversTypes['Project'], ParentType, ContextType>;
  projectId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  requester?: Resolver<ResolversTypes['LimitedUser'], ParentType, ContextType>;
  requesterId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ProjectAccessRequestMutationsResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ProjectAccessRequestMutations'] = ResolversParentTypes['ProjectAccessRequestMutations']> = {
  create?: Resolver<ResolversTypes['ProjectAccessRequest'], ParentType, ContextType, RequireFields<ProjectAccessRequestMutationsCreateArgs, 'projectId'>>;
  use?: Resolver<ResolversTypes['Project'], ParentType, ContextType, RequireFields<ProjectAccessRequestMutationsUseArgs, 'accept' | 'requestId' | 'role'>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ProjectAutomationMutationsResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ProjectAutomationMutations'] = ResolversParentTypes['ProjectAutomationMutations']> = {
  create?: Resolver<ResolversTypes['Automation'], ParentType, ContextType, RequireFields<ProjectAutomationMutationsCreateArgs, 'input'>>;
  createRevision?: Resolver<ResolversTypes['AutomationRevision'], ParentType, ContextType, RequireFields<ProjectAutomationMutationsCreateRevisionArgs, 'input'>>;
  createTestAutomation?: Resolver<ResolversTypes['Automation'], ParentType, ContextType, RequireFields<ProjectAutomationMutationsCreateTestAutomationArgs, 'input'>>;
  createTestAutomationRun?: Resolver<ResolversTypes['TestAutomationRun'], ParentType, ContextType, RequireFields<ProjectAutomationMutationsCreateTestAutomationRunArgs, 'automationId'>>;
  delete?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<ProjectAutomationMutationsDeleteArgs, 'automationId'>>;
  trigger?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<ProjectAutomationMutationsTriggerArgs, 'automationId'>>;
  update?: Resolver<ResolversTypes['Automation'], ParentType, ContextType, RequireFields<ProjectAutomationMutationsUpdateArgs, 'input'>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ProjectAutomationsUpdatedMessageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ProjectAutomationsUpdatedMessage'] = ResolversParentTypes['ProjectAutomationsUpdatedMessage']> = {
  automation?: Resolver<Maybe<ResolversTypes['Automation']>, ParentType, ContextType>;
  automationId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  revision?: Resolver<Maybe<ResolversTypes['AutomationRevision']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['ProjectAutomationsUpdatedMessageType'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ProjectCollaboratorResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ProjectCollaborator'] = ResolversParentTypes['ProjectCollaborator']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  role?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  seatType?: Resolver<Maybe<ResolversTypes['WorkspaceSeatType']>, ParentType, ContextType>;
  user?: Resolver<ResolversTypes['LimitedUser'], ParentType, ContextType>;
  workspaceRole?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ProjectCollectionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ProjectCollection'] = ResolversParentTypes['ProjectCollection']> = {
  cursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  items?: Resolver<Array<ResolversTypes['Project']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ProjectCommentCollectionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ProjectCommentCollection'] = ResolversParentTypes['ProjectCommentCollection']> = {
  cursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  items?: Resolver<Array<ResolversTypes['Comment']>, ParentType, ContextType>;
  totalArchivedCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ProjectCommentsUpdatedMessageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ProjectCommentsUpdatedMessage'] = ResolversParentTypes['ProjectCommentsUpdatedMessage']> = {
  comment?: Resolver<Maybe<ResolversTypes['Comment']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['ProjectCommentsUpdatedMessageType'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ProjectEmbedOptionsResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ProjectEmbedOptions'] = ResolversParentTypes['ProjectEmbedOptions']> = {
  hideSpeckleBranding?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ProjectFileImportUpdatedMessageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ProjectFileImportUpdatedMessage'] = ResolversParentTypes['ProjectFileImportUpdatedMessage']> = {
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['ProjectFileImportUpdatedMessageType'], ParentType, ContextType>;
  upload?: Resolver<ResolversTypes['FileUpload'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ProjectInviteMutationsResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ProjectInviteMutations'] = ResolversParentTypes['ProjectInviteMutations']> = {
  batchCreate?: Resolver<ResolversTypes['Project'], ParentType, ContextType, RequireFields<ProjectInviteMutationsBatchCreateArgs, 'input' | 'projectId'>>;
  cancel?: Resolver<ResolversTypes['Project'], ParentType, ContextType, RequireFields<ProjectInviteMutationsCancelArgs, 'inviteId' | 'projectId'>>;
  create?: Resolver<ResolversTypes['Project'], ParentType, ContextType, RequireFields<ProjectInviteMutationsCreateArgs, 'input' | 'projectId'>>;
  createForWorkspace?: Resolver<ResolversTypes['Project'], ParentType, ContextType, RequireFields<ProjectInviteMutationsCreateForWorkspaceArgs, 'inputs' | 'projectId'>>;
  use?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<ProjectInviteMutationsUseArgs, 'input'>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ProjectModelsUpdatedMessageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ProjectModelsUpdatedMessage'] = ResolversParentTypes['ProjectModelsUpdatedMessage']> = {
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  model?: Resolver<Maybe<ResolversTypes['Model']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['ProjectModelsUpdatedMessageType'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ProjectMoveToWorkspaceDryRunResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ProjectMoveToWorkspaceDryRun'] = ResolversParentTypes['ProjectMoveToWorkspaceDryRun']> = {
  addedToWorkspace?: Resolver<Array<ResolversTypes['LimitedUser']>, ParentType, ContextType, Partial<ProjectMoveToWorkspaceDryRunAddedToWorkspaceArgs>>;
  addedToWorkspaceTotalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ProjectMutationsResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ProjectMutations'] = ResolversParentTypes['ProjectMutations']> = {
  accessRequestMutations?: Resolver<ResolversTypes['ProjectAccessRequestMutations'], ParentType, ContextType>;
  automationMutations?: Resolver<ResolversTypes['ProjectAutomationMutations'], ParentType, ContextType, RequireFields<ProjectMutationsAutomationMutationsArgs, 'projectId'>>;
  batchDelete?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<ProjectMutationsBatchDeleteArgs, 'ids'>>;
  create?: Resolver<ResolversTypes['Project'], ParentType, ContextType, Partial<ProjectMutationsCreateArgs>>;
  createEmbedToken?: Resolver<ResolversTypes['CreateEmbedTokenReturn'], ParentType, ContextType, RequireFields<ProjectMutationsCreateEmbedTokenArgs, 'token'>>;
  createForOnboarding?: Resolver<ResolversTypes['Project'], ParentType, ContextType>;
  delete?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<ProjectMutationsDeleteArgs, 'id'>>;
  invites?: Resolver<ResolversTypes['ProjectInviteMutations'], ParentType, ContextType>;
  leave?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<ProjectMutationsLeaveArgs, 'id'>>;
  revokeEmbedToken?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<ProjectMutationsRevokeEmbedTokenArgs, 'projectId' | 'token'>>;
  revokeEmbedTokens?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<ProjectMutationsRevokeEmbedTokensArgs, 'projectId'>>;
  update?: Resolver<ResolversTypes['Project'], ParentType, ContextType, RequireFields<ProjectMutationsUpdateArgs, 'update'>>;
  updateRole?: Resolver<ResolversTypes['Project'], ParentType, ContextType, RequireFields<ProjectMutationsUpdateRoleArgs, 'input'>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ProjectPendingModelsUpdatedMessageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ProjectPendingModelsUpdatedMessage'] = ResolversParentTypes['ProjectPendingModelsUpdatedMessage']> = {
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  model?: Resolver<ResolversTypes['FileUpload'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['ProjectPendingModelsUpdatedMessageType'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ProjectPendingVersionsUpdatedMessageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ProjectPendingVersionsUpdatedMessage'] = ResolversParentTypes['ProjectPendingVersionsUpdatedMessage']> = {
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['ProjectPendingVersionsUpdatedMessageType'], ParentType, ContextType>;
  version?: Resolver<ResolversTypes['FileUpload'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ProjectPermissionChecksResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ProjectPermissionChecks'] = ResolversParentTypes['ProjectPermissionChecks']> = {
  canBroadcastActivity?: Resolver<ResolversTypes['PermissionCheckResult'], ParentType, ContextType>;
  canCreateAutomation?: Resolver<ResolversTypes['PermissionCheckResult'], ParentType, ContextType>;
  canCreateComment?: Resolver<ResolversTypes['PermissionCheckResult'], ParentType, ContextType>;
  canCreateEmbedTokens?: Resolver<ResolversTypes['PermissionCheckResult'], ParentType, ContextType>;
  canCreateModel?: Resolver<ResolversTypes['PermissionCheckResult'], ParentType, ContextType>;
  canDelete?: Resolver<ResolversTypes['PermissionCheckResult'], ParentType, ContextType>;
  canInvite?: Resolver<ResolversTypes['PermissionCheckResult'], ParentType, ContextType>;
  canLeave?: Resolver<ResolversTypes['PermissionCheckResult'], ParentType, ContextType>;
  canLoad?: Resolver<ResolversTypes['PermissionCheckResult'], ParentType, ContextType>;
  canMoveToWorkspace?: Resolver<ResolversTypes['PermissionCheckResult'], ParentType, ContextType, Partial<ProjectPermissionChecksCanMoveToWorkspaceArgs>>;
  canPublish?: Resolver<ResolversTypes['PermissionCheckResult'], ParentType, ContextType>;
  canRead?: Resolver<ResolversTypes['PermissionCheckResult'], ParentType, ContextType>;
  canReadEmbedTokens?: Resolver<ResolversTypes['PermissionCheckResult'], ParentType, ContextType>;
  canReadSettings?: Resolver<ResolversTypes['PermissionCheckResult'], ParentType, ContextType>;
  canReadWebhooks?: Resolver<ResolversTypes['PermissionCheckResult'], ParentType, ContextType>;
  canRequestRender?: Resolver<ResolversTypes['PermissionCheckResult'], ParentType, ContextType>;
  canRevokeEmbedTokens?: Resolver<ResolversTypes['PermissionCheckResult'], ParentType, ContextType>;
  canUpdate?: Resolver<ResolversTypes['PermissionCheckResult'], ParentType, ContextType>;
  canUpdateAllowPublicComments?: Resolver<ResolversTypes['PermissionCheckResult'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ProjectRoleResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ProjectRole'] = ResolversParentTypes['ProjectRole']> = {
  project?: Resolver<ResolversTypes['Project'], ParentType, ContextType>;
  role?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ProjectTriggeredAutomationsStatusUpdatedMessageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ProjectTriggeredAutomationsStatusUpdatedMessage'] = ResolversParentTypes['ProjectTriggeredAutomationsStatusUpdatedMessage']> = {
  model?: Resolver<ResolversTypes['Model'], ParentType, ContextType>;
  project?: Resolver<ResolversTypes['Project'], ParentType, ContextType>;
  run?: Resolver<ResolversTypes['AutomateRun'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['ProjectTriggeredAutomationsStatusUpdatedMessageType'], ParentType, ContextType>;
  version?: Resolver<ResolversTypes['Version'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ProjectUpdatedMessageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ProjectUpdatedMessage'] = ResolversParentTypes['ProjectUpdatedMessage']> = {
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  project?: Resolver<Maybe<ResolversTypes['Project']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['ProjectUpdatedMessageType'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ProjectVersionsPreviewGeneratedMessageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ProjectVersionsPreviewGeneratedMessage'] = ResolversParentTypes['ProjectVersionsPreviewGeneratedMessage']> = {
  objectId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  projectId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  versionId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ProjectVersionsUpdatedMessageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ProjectVersionsUpdatedMessage'] = ResolversParentTypes['ProjectVersionsUpdatedMessage']> = {
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  modelId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['ProjectVersionsUpdatedMessageType'], ParentType, ContextType>;
  version?: Resolver<Maybe<ResolversTypes['Version']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type QueryResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  _?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  activeUser?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  admin?: Resolver<ResolversTypes['AdminQueries'], ParentType, ContextType>;
  adminStreams?: Resolver<Maybe<ResolversTypes['StreamCollection']>, ParentType, ContextType, RequireFields<QueryAdminStreamsArgs, 'limit' | 'offset'>>;
  adminUsers?: Resolver<Maybe<ResolversTypes['AdminUsersListCollection']>, ParentType, ContextType, RequireFields<QueryAdminUsersArgs, 'limit' | 'offset' | 'query'>>;
  app?: Resolver<Maybe<ResolversTypes['ServerApp']>, ParentType, ContextType, RequireFields<QueryAppArgs, 'id'>>;
  apps?: Resolver<Maybe<Array<Maybe<ResolversTypes['ServerAppListItem']>>>, ParentType, ContextType>;
  authenticatedAsApp?: Resolver<Maybe<ResolversTypes['ServerAppListItem']>, ParentType, ContextType>;
  automateFunction?: Resolver<ResolversTypes['AutomateFunction'], ParentType, ContextType, RequireFields<QueryAutomateFunctionArgs, 'id'>>;
  automateFunctions?: Resolver<ResolversTypes['AutomateFunctionCollection'], ParentType, ContextType, Partial<QueryAutomateFunctionsArgs>>;
  automateValidateAuthCode?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<QueryAutomateValidateAuthCodeArgs, 'payload'>>;
  comment?: Resolver<Maybe<ResolversTypes['Comment']>, ParentType, ContextType, RequireFields<QueryCommentArgs, 'id' | 'streamId'>>;
  comments?: Resolver<Maybe<ResolversTypes['CommentCollection']>, ParentType, ContextType, RequireFields<QueryCommentsArgs, 'archived' | 'limit' | 'streamId'>>;
  discoverableStreams?: Resolver<Maybe<ResolversTypes['StreamCollection']>, ParentType, ContextType, RequireFields<QueryDiscoverableStreamsArgs, 'limit'>>;
  otherUser?: Resolver<Maybe<ResolversTypes['LimitedUser']>, ParentType, ContextType, RequireFields<QueryOtherUserArgs, 'id'>>;
  project?: Resolver<ResolversTypes['Project'], ParentType, ContextType, RequireFields<QueryProjectArgs, 'id'>>;
  projectInvite?: Resolver<Maybe<ResolversTypes['PendingStreamCollaborator']>, ParentType, ContextType, RequireFields<QueryProjectInviteArgs, 'projectId'>>;
  serverInfo?: Resolver<ResolversTypes['ServerInfo'], ParentType, ContextType>;
  serverInviteByToken?: Resolver<Maybe<ResolversTypes['ServerInvite']>, ParentType, ContextType, Partial<QueryServerInviteByTokenArgs>>;
  serverStats?: Resolver<ResolversTypes['ServerStats'], ParentType, ContextType>;
  stream?: Resolver<Maybe<ResolversTypes['Stream']>, ParentType, ContextType, RequireFields<QueryStreamArgs, 'id'>>;
  streamAccessRequest?: Resolver<Maybe<ResolversTypes['StreamAccessRequest']>, ParentType, ContextType, RequireFields<QueryStreamAccessRequestArgs, 'streamId'>>;
  streamInvite?: Resolver<Maybe<ResolversTypes['PendingStreamCollaborator']>, ParentType, ContextType, RequireFields<QueryStreamInviteArgs, 'streamId'>>;
  streamInvites?: Resolver<Array<ResolversTypes['PendingStreamCollaborator']>, ParentType, ContextType>;
  streams?: Resolver<Maybe<ResolversTypes['UserStreamCollection']>, ParentType, ContextType, RequireFields<QueryStreamsArgs, 'limit'>>;
  user?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, Partial<QueryUserArgs>>;
  userPwdStrength?: Resolver<ResolversTypes['PasswordStrengthCheckResults'], ParentType, ContextType, RequireFields<QueryUserPwdStrengthArgs, 'pwd'>>;
  userSearch?: Resolver<ResolversTypes['UserSearchResultCollection'], ParentType, ContextType, RequireFields<QueryUserSearchArgs, 'archived' | 'emailOnly' | 'limit' | 'query'>>;
  users?: Resolver<ResolversTypes['UserSearchResultCollection'], ParentType, ContextType, RequireFields<QueryUsersArgs, 'input'>>;
  usersByEmail?: Resolver<Array<Maybe<ResolversTypes['LimitedUser']>>, ParentType, ContextType, RequireFields<QueryUsersByEmailArgs, 'input'>>;
  validateWorkspaceSlug?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<QueryValidateWorkspaceSlugArgs, 'slug'>>;
  workspace?: Resolver<ResolversTypes['Workspace'], ParentType, ContextType, RequireFields<QueryWorkspaceArgs, 'id'>>;
  workspaceBySlug?: Resolver<ResolversTypes['Workspace'], ParentType, ContextType, RequireFields<QueryWorkspaceBySlugArgs, 'slug'>>;
  workspaceInvite?: Resolver<Maybe<ResolversTypes['PendingWorkspaceCollaborator']>, ParentType, ContextType, Partial<QueryWorkspaceInviteArgs>>;
  workspaceSsoByEmail?: Resolver<Array<ResolversTypes['LimitedWorkspace']>, ParentType, ContextType, RequireFields<QueryWorkspaceSsoByEmailArgs, 'email'>>;
};

export type ResourceIdentifierResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ResourceIdentifier'] = ResolversParentTypes['ResourceIdentifier']> = {
  resourceId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  resourceType?: Resolver<ResolversTypes['ResourceType'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type RoleResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Role'] = ResolversParentTypes['Role']> = {
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  resourceTarget?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type RootPermissionChecksResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['RootPermissionChecks'] = ResolversParentTypes['RootPermissionChecks']> = {
  canCreatePersonalProject?: Resolver<ResolversTypes['PermissionCheckResult'], ParentType, ContextType>;
  canCreateWorkspace?: Resolver<ResolversTypes['PermissionCheckResult'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ScopeResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Scope'] = ResolversParentTypes['Scope']> = {
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ServerAppResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ServerApp'] = ResolversParentTypes['ServerApp']> = {
  author?: Resolver<Maybe<ResolversTypes['AppAuthor']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  logo?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  public?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  redirectUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  scopes?: Resolver<Array<ResolversTypes['Scope']>, ParentType, ContextType>;
  secret?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  termsAndConditionsLink?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  trustByDefault?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ServerAppListItemResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ServerAppListItem'] = ResolversParentTypes['ServerAppListItem']> = {
  author?: Resolver<Maybe<ResolversTypes['AppAuthor']>, ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  logo?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  redirectUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  termsAndConditionsLink?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  trustByDefault?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ServerAutomateInfoResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ServerAutomateInfo'] = ResolversParentTypes['ServerAutomateInfo']> = {
  availableFunctionTemplates?: Resolver<Array<ResolversTypes['AutomateFunctionTemplate']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ServerConfigurationResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ServerConfiguration'] = ResolversParentTypes['ServerConfiguration']> = {
  blobSizeLimitBytes?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  isEmailEnabled?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  objectMultipartUploadSizeLimitBytes?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  objectSizeLimitBytes?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ServerInfoResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ServerInfo'] = ResolversParentTypes['ServerInfo']> = {
  adminContact?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  authStrategies?: Resolver<Array<ResolversTypes['AuthStrategy']>, ParentType, ContextType>;
  automate?: Resolver<ResolversTypes['ServerAutomateInfo'], ParentType, ContextType>;
  automateUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  blobSizeLimitBytes?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  canonicalUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  company?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  configuration?: Resolver<ResolversTypes['ServerConfiguration'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  enableNewWebUiMessaging?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  guestModeEnabled?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  inviteOnly?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  migration?: Resolver<Maybe<ResolversTypes['ServerMigration']>, ParentType, ContextType>;
  multiRegion?: Resolver<ResolversTypes['ServerMultiRegionConfiguration'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  roles?: Resolver<Array<ResolversTypes['Role']>, ParentType, ContextType>;
  scopes?: Resolver<Array<ResolversTypes['Scope']>, ParentType, ContextType>;
  serverRoles?: Resolver<Array<ResolversTypes['ServerRoleItem']>, ParentType, ContextType>;
  termsOfService?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  version?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  workspaces?: Resolver<ResolversTypes['ServerWorkspacesInfo'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ServerInfoMutationsResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ServerInfoMutations'] = ResolversParentTypes['ServerInfoMutations']> = {
  multiRegion?: Resolver<ResolversTypes['ServerRegionMutations'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ServerInviteResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ServerInvite'] = ResolversParentTypes['ServerInvite']> = {
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  invitedBy?: Resolver<ResolversTypes['LimitedUser'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ServerMigrationResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ServerMigration'] = ResolversParentTypes['ServerMigration']> = {
  movedFrom?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  movedTo?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ServerMultiRegionConfigurationResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ServerMultiRegionConfiguration'] = ResolversParentTypes['ServerMultiRegionConfiguration']> = {
  availableKeys?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  regions?: Resolver<Array<ResolversTypes['ServerRegionItem']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ServerRegionItemResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ServerRegionItem'] = ResolversParentTypes['ServerRegionItem']> = {
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  key?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ServerRegionMutationsResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ServerRegionMutations'] = ResolversParentTypes['ServerRegionMutations']> = {
  create?: Resolver<ResolversTypes['ServerRegionItem'], ParentType, ContextType, RequireFields<ServerRegionMutationsCreateArgs, 'input'>>;
  update?: Resolver<ResolversTypes['ServerRegionItem'], ParentType, ContextType, RequireFields<ServerRegionMutationsUpdateArgs, 'input'>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ServerRoleItemResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ServerRoleItem'] = ResolversParentTypes['ServerRoleItem']> = {
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ServerStatisticsResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ServerStatistics'] = ResolversParentTypes['ServerStatistics']> = {
  totalPendingInvites?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalProjectCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalUserCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ServerStatsResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ServerStats'] = ResolversParentTypes['ServerStats']> = {
  commitHistory?: Resolver<Maybe<Array<Maybe<ResolversTypes['JSONObject']>>>, ParentType, ContextType>;
  objectHistory?: Resolver<Maybe<Array<Maybe<ResolversTypes['JSONObject']>>>, ParentType, ContextType>;
  streamHistory?: Resolver<Maybe<Array<Maybe<ResolversTypes['JSONObject']>>>, ParentType, ContextType>;
  totalCommitCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalObjectCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalStreamCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalUserCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  userHistory?: Resolver<Maybe<Array<Maybe<ResolversTypes['JSONObject']>>>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ServerWorkspacesInfoResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ServerWorkspacesInfo'] = ResolversParentTypes['ServerWorkspacesInfo']> = {
  planPrices?: Resolver<Maybe<ResolversTypes['CurrencyBasedPrices']>, ParentType, ContextType>;
  workspacesEnabled?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SmartTextEditorValueResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['SmartTextEditorValue'] = ResolversParentTypes['SmartTextEditorValue']> = {
  attachments?: Resolver<Maybe<Array<ResolversTypes['BlobMetadata']>>, ParentType, ContextType>;
  doc?: Resolver<Maybe<ResolversTypes['JSONObject']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  version?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type StreamResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Stream'] = ResolversParentTypes['Stream']> = {
  activity?: Resolver<Maybe<ResolversTypes['ActivityCollection']>, ParentType, ContextType, RequireFields<StreamActivityArgs, 'limit'>>;
  allowPublicComments?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  blob?: Resolver<Maybe<ResolversTypes['BlobMetadata']>, ParentType, ContextType, RequireFields<StreamBlobArgs, 'id'>>;
  blobs?: Resolver<Maybe<ResolversTypes['BlobMetadataCollection']>, ParentType, ContextType, RequireFields<StreamBlobsArgs, 'cursor' | 'limit' | 'query'>>;
  branch?: Resolver<Maybe<ResolversTypes['Branch']>, ParentType, ContextType, RequireFields<StreamBranchArgs, 'name'>>;
  branches?: Resolver<Maybe<ResolversTypes['BranchCollection']>, ParentType, ContextType, RequireFields<StreamBranchesArgs, 'limit'>>;
  collaborators?: Resolver<Array<ResolversTypes['StreamCollaborator']>, ParentType, ContextType>;
  commentCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  commit?: Resolver<Maybe<ResolversTypes['Commit']>, ParentType, ContextType, Partial<StreamCommitArgs>>;
  commits?: Resolver<Maybe<ResolversTypes['CommitCollection']>, ParentType, ContextType, RequireFields<StreamCommitsArgs, 'limit'>>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  favoritedDate?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  favoritesCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  fileUpload?: Resolver<Maybe<ResolversTypes['FileUpload']>, ParentType, ContextType, RequireFields<StreamFileUploadArgs, 'id'>>;
  fileUploads?: Resolver<Array<ResolversTypes['FileUpload']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  isDiscoverable?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  isPublic?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  object?: Resolver<Maybe<ResolversTypes['Object']>, ParentType, ContextType, RequireFields<StreamObjectArgs, 'id'>>;
  pendingAccessRequests?: Resolver<Maybe<Array<ResolversTypes['StreamAccessRequest']>>, ParentType, ContextType>;
  pendingCollaborators?: Resolver<Maybe<Array<ResolversTypes['PendingStreamCollaborator']>>, ParentType, ContextType>;
  role?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  size?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  webhooks?: Resolver<ResolversTypes['WebhookCollection'], ParentType, ContextType, Partial<StreamWebhooksArgs>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type StreamAccessRequestResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['StreamAccessRequest'] = ResolversParentTypes['StreamAccessRequest']> = {
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  requester?: Resolver<ResolversTypes['LimitedUser'], ParentType, ContextType>;
  requesterId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  stream?: Resolver<ResolversTypes['Stream'], ParentType, ContextType>;
  streamId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type StreamCollaboratorResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['StreamCollaborator'] = ResolversParentTypes['StreamCollaborator']> = {
  avatar?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  company?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  role?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  serverRole?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type StreamCollectionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['StreamCollection'] = ResolversParentTypes['StreamCollection']> = {
  cursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  items?: Resolver<Maybe<Array<ResolversTypes['Stream']>>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SubscriptionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Subscription'] = ResolversParentTypes['Subscription']> = {
  _?: SubscriptionResolver<Maybe<ResolversTypes['String']>, "_", ParentType, ContextType>;
  branchCreated?: SubscriptionResolver<Maybe<ResolversTypes['JSONObject']>, "branchCreated", ParentType, ContextType, RequireFields<SubscriptionBranchCreatedArgs, 'streamId'>>;
  branchDeleted?: SubscriptionResolver<Maybe<ResolversTypes['JSONObject']>, "branchDeleted", ParentType, ContextType, RequireFields<SubscriptionBranchDeletedArgs, 'streamId'>>;
  branchUpdated?: SubscriptionResolver<Maybe<ResolversTypes['JSONObject']>, "branchUpdated", ParentType, ContextType, RequireFields<SubscriptionBranchUpdatedArgs, 'streamId'>>;
  commentActivity?: SubscriptionResolver<ResolversTypes['CommentActivityMessage'], "commentActivity", ParentType, ContextType, RequireFields<SubscriptionCommentActivityArgs, 'streamId'>>;
  commentThreadActivity?: SubscriptionResolver<ResolversTypes['CommentThreadActivityMessage'], "commentThreadActivity", ParentType, ContextType, RequireFields<SubscriptionCommentThreadActivityArgs, 'commentId' | 'streamId'>>;
  commitCreated?: SubscriptionResolver<Maybe<ResolversTypes['JSONObject']>, "commitCreated", ParentType, ContextType, RequireFields<SubscriptionCommitCreatedArgs, 'streamId'>>;
  commitDeleted?: SubscriptionResolver<Maybe<ResolversTypes['JSONObject']>, "commitDeleted", ParentType, ContextType, RequireFields<SubscriptionCommitDeletedArgs, 'streamId'>>;
  commitUpdated?: SubscriptionResolver<Maybe<ResolversTypes['JSONObject']>, "commitUpdated", ParentType, ContextType, RequireFields<SubscriptionCommitUpdatedArgs, 'streamId'>>;
  ping?: SubscriptionResolver<ResolversTypes['String'], "ping", ParentType, ContextType>;
  projectAutomationsUpdated?: SubscriptionResolver<ResolversTypes['ProjectAutomationsUpdatedMessage'], "projectAutomationsUpdated", ParentType, ContextType, RequireFields<SubscriptionProjectAutomationsUpdatedArgs, 'projectId'>>;
  projectCommentsUpdated?: SubscriptionResolver<ResolversTypes['ProjectCommentsUpdatedMessage'], "projectCommentsUpdated", ParentType, ContextType, RequireFields<SubscriptionProjectCommentsUpdatedArgs, 'target'>>;
  projectFileImportUpdated?: SubscriptionResolver<ResolversTypes['ProjectFileImportUpdatedMessage'], "projectFileImportUpdated", ParentType, ContextType, RequireFields<SubscriptionProjectFileImportUpdatedArgs, 'id'>>;
  projectModelsUpdated?: SubscriptionResolver<ResolversTypes['ProjectModelsUpdatedMessage'], "projectModelsUpdated", ParentType, ContextType, RequireFields<SubscriptionProjectModelsUpdatedArgs, 'id'>>;
  projectPendingModelsUpdated?: SubscriptionResolver<ResolversTypes['ProjectPendingModelsUpdatedMessage'], "projectPendingModelsUpdated", ParentType, ContextType, RequireFields<SubscriptionProjectPendingModelsUpdatedArgs, 'id'>>;
  projectPendingVersionsUpdated?: SubscriptionResolver<ResolversTypes['ProjectPendingVersionsUpdatedMessage'], "projectPendingVersionsUpdated", ParentType, ContextType, RequireFields<SubscriptionProjectPendingVersionsUpdatedArgs, 'id'>>;
  projectTriggeredAutomationsStatusUpdated?: SubscriptionResolver<ResolversTypes['ProjectTriggeredAutomationsStatusUpdatedMessage'], "projectTriggeredAutomationsStatusUpdated", ParentType, ContextType, RequireFields<SubscriptionProjectTriggeredAutomationsStatusUpdatedArgs, 'projectId'>>;
  projectUpdated?: SubscriptionResolver<ResolversTypes['ProjectUpdatedMessage'], "projectUpdated", ParentType, ContextType, RequireFields<SubscriptionProjectUpdatedArgs, 'id'>>;
  projectVersionGendoAIRenderCreated?: SubscriptionResolver<ResolversTypes['GendoAIRender'], "projectVersionGendoAIRenderCreated", ParentType, ContextType, RequireFields<SubscriptionProjectVersionGendoAiRenderCreatedArgs, 'id' | 'versionId'>>;
  projectVersionGendoAIRenderUpdated?: SubscriptionResolver<ResolversTypes['GendoAIRender'], "projectVersionGendoAIRenderUpdated", ParentType, ContextType, RequireFields<SubscriptionProjectVersionGendoAiRenderUpdatedArgs, 'id' | 'versionId'>>;
  projectVersionsPreviewGenerated?: SubscriptionResolver<ResolversTypes['ProjectVersionsPreviewGeneratedMessage'], "projectVersionsPreviewGenerated", ParentType, ContextType, RequireFields<SubscriptionProjectVersionsPreviewGeneratedArgs, 'id'>>;
  projectVersionsUpdated?: SubscriptionResolver<ResolversTypes['ProjectVersionsUpdatedMessage'], "projectVersionsUpdated", ParentType, ContextType, RequireFields<SubscriptionProjectVersionsUpdatedArgs, 'id'>>;
  streamDeleted?: SubscriptionResolver<Maybe<ResolversTypes['JSONObject']>, "streamDeleted", ParentType, ContextType, Partial<SubscriptionStreamDeletedArgs>>;
  streamUpdated?: SubscriptionResolver<Maybe<ResolversTypes['JSONObject']>, "streamUpdated", ParentType, ContextType, Partial<SubscriptionStreamUpdatedArgs>>;
  userProjectsUpdated?: SubscriptionResolver<ResolversTypes['UserProjectsUpdatedMessage'], "userProjectsUpdated", ParentType, ContextType>;
  userStreamAdded?: SubscriptionResolver<Maybe<ResolversTypes['JSONObject']>, "userStreamAdded", ParentType, ContextType>;
  userStreamRemoved?: SubscriptionResolver<Maybe<ResolversTypes['JSONObject']>, "userStreamRemoved", ParentType, ContextType>;
  userViewerActivity?: SubscriptionResolver<Maybe<ResolversTypes['JSONObject']>, "userViewerActivity", ParentType, ContextType, RequireFields<SubscriptionUserViewerActivityArgs, 'resourceId' | 'streamId'>>;
  viewerUserActivityBroadcasted?: SubscriptionResolver<ResolversTypes['ViewerUserActivityMessage'], "viewerUserActivityBroadcasted", ParentType, ContextType, RequireFields<SubscriptionViewerUserActivityBroadcastedArgs, 'target'>>;
  workspaceProjectsUpdated?: SubscriptionResolver<ResolversTypes['WorkspaceProjectsUpdatedMessage'], "workspaceProjectsUpdated", ParentType, ContextType, Partial<SubscriptionWorkspaceProjectsUpdatedArgs>>;
  workspaceUpdated?: SubscriptionResolver<ResolversTypes['WorkspaceUpdatedMessage'], "workspaceUpdated", ParentType, ContextType, Partial<SubscriptionWorkspaceUpdatedArgs>>;
};

export type TestAutomationRunResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['TestAutomationRun'] = ResolversParentTypes['TestAutomationRun']> = {
  automationRunId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  functionRunId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  triggers?: Resolver<Array<ResolversTypes['TestAutomationRunTrigger']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TestAutomationRunTriggerResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['TestAutomationRunTrigger'] = ResolversParentTypes['TestAutomationRunTrigger']> = {
  payload?: Resolver<ResolversTypes['TestAutomationRunTriggerPayload'], ParentType, ContextType>;
  triggerType?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TestAutomationRunTriggerPayloadResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['TestAutomationRunTriggerPayload'] = ResolversParentTypes['TestAutomationRunTriggerPayload']> = {
  modelId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  versionId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TokenResourceIdentifierResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['TokenResourceIdentifier'] = ResolversParentTypes['TokenResourceIdentifier']> = {
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['TokenResourceIdentifierType'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TriggeredAutomationsStatusResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['TriggeredAutomationsStatus'] = ResolversParentTypes['TriggeredAutomationsStatus']> = {
  automationRuns?: Resolver<Array<ResolversTypes['AutomateRun']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['AutomateRunStatus'], ParentType, ContextType>;
  statusMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UserResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['User'] = ResolversParentTypes['User']> = {
  activeWorkspace?: Resolver<Maybe<ResolversTypes['Workspace']>, ParentType, ContextType>;
  activity?: Resolver<Maybe<ResolversTypes['ActivityCollection']>, ParentType, ContextType, RequireFields<UserActivityArgs, 'limit'>>;
  apiTokens?: Resolver<Array<ResolversTypes['ApiToken']>, ParentType, ContextType>;
  authorizedApps?: Resolver<Maybe<Array<ResolversTypes['ServerAppListItem']>>, ParentType, ContextType>;
  automateFunctions?: Resolver<ResolversTypes['AutomateFunctionCollection'], ParentType, ContextType, Partial<UserAutomateFunctionsArgs>>;
  automateInfo?: Resolver<ResolversTypes['UserAutomateInfo'], ParentType, ContextType>;
  avatar?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  bio?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  commits?: Resolver<Maybe<ResolversTypes['CommitCollection']>, ParentType, ContextType, RequireFields<UserCommitsArgs, 'limit'>>;
  company?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  createdApps?: Resolver<Maybe<Array<ResolversTypes['ServerApp']>>, ParentType, ContextType>;
  createdAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  discoverableWorkspaces?: Resolver<Array<ResolversTypes['LimitedWorkspace']>, ParentType, ContextType>;
  email?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  emails?: Resolver<Array<ResolversTypes['UserEmail']>, ParentType, ContextType>;
  expiredSsoSessions?: Resolver<Array<ResolversTypes['LimitedWorkspace']>, ParentType, ContextType>;
  favoriteStreams?: Resolver<ResolversTypes['StreamCollection'], ParentType, ContextType, RequireFields<UserFavoriteStreamsArgs, 'limit'>>;
  gendoAICredits?: Resolver<ResolversTypes['UserGendoAICredits'], ParentType, ContextType>;
  hasPendingVerification?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isOnboardingFinished?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  isProjectsActive?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  meta?: Resolver<ResolversTypes['UserMeta'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  notificationPreferences?: Resolver<ResolversTypes['JSONObject'], ParentType, ContextType>;
  permissions?: Resolver<ResolversTypes['RootPermissionChecks'], ParentType, ContextType>;
  profiles?: Resolver<Maybe<ResolversTypes['JSONObject']>, ParentType, ContextType>;
  projectAccessRequest?: Resolver<Maybe<ResolversTypes['ProjectAccessRequest']>, ParentType, ContextType, RequireFields<UserProjectAccessRequestArgs, 'projectId'>>;
  projectInvites?: Resolver<Array<ResolversTypes['PendingStreamCollaborator']>, ParentType, ContextType>;
  projects?: Resolver<ResolversTypes['UserProjectCollection'], ParentType, ContextType, RequireFields<UserProjectsArgs, 'limit'>>;
  role?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  streams?: Resolver<ResolversTypes['UserStreamCollection'], ParentType, ContextType, RequireFields<UserStreamsArgs, 'limit'>>;
  timeline?: Resolver<Maybe<ResolversTypes['ActivityCollection']>, ParentType, ContextType, RequireFields<UserTimelineArgs, 'limit'>>;
  totalOwnedStreamsFavorites?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  verified?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  versions?: Resolver<ResolversTypes['CountOnlyCollection'], ParentType, ContextType, RequireFields<UserVersionsArgs, 'authoredOnly' | 'limit'>>;
  workspaceInvites?: Resolver<Array<ResolversTypes['PendingWorkspaceCollaborator']>, ParentType, ContextType>;
  workspaceJoinRequests?: Resolver<Maybe<ResolversTypes['LimitedWorkspaceJoinRequestCollection']>, ParentType, ContextType, RequireFields<UserWorkspaceJoinRequestsArgs, 'limit'>>;
  workspaces?: Resolver<ResolversTypes['WorkspaceCollection'], ParentType, ContextType, RequireFields<UserWorkspacesArgs, 'cursor' | 'limit'>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UserAutomateInfoResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['UserAutomateInfo'] = ResolversParentTypes['UserAutomateInfo']> = {
  availableGithubOrgs?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  hasAutomateGithubApp?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UserEmailResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['UserEmail'] = ResolversParentTypes['UserEmail']> = {
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  primary?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  verified?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UserEmailMutationsResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['UserEmailMutations'] = ResolversParentTypes['UserEmailMutations']> = {
  create?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<UserEmailMutationsCreateArgs, 'input'>>;
  delete?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<UserEmailMutationsDeleteArgs, 'input'>>;
  requestNewEmailVerification?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, RequireFields<UserEmailMutationsRequestNewEmailVerificationArgs, 'input'>>;
  setPrimary?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<UserEmailMutationsSetPrimaryArgs, 'input'>>;
  verify?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, RequireFields<UserEmailMutationsVerifyArgs, 'input'>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UserGendoAiCreditsResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['UserGendoAICredits'] = ResolversParentTypes['UserGendoAICredits']> = {
  limit?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  resetDate?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  used?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UserMetaResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['UserMeta'] = ResolversParentTypes['UserMeta']> = {
  legacyProjectsExplainerCollapsed?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  newWorkspaceExplainerDismissed?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  speckleConBannerDismissed?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UserMetaMutationsResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['UserMetaMutations'] = ResolversParentTypes['UserMetaMutations']> = {
  setLegacyProjectsExplainerCollapsed?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<UserMetaMutationsSetLegacyProjectsExplainerCollapsedArgs, 'value'>>;
  setNewWorkspaceExplainerDismissed?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<UserMetaMutationsSetNewWorkspaceExplainerDismissedArgs, 'value'>>;
  setSpeckleConBannerDismissed?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<UserMetaMutationsSetSpeckleConBannerDismissedArgs, 'value'>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UserProjectCollectionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['UserProjectCollection'] = ResolversParentTypes['UserProjectCollection']> = {
  cursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  items?: Resolver<Array<ResolversTypes['Project']>, ParentType, ContextType>;
  numberOfHidden?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UserProjectsUpdatedMessageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['UserProjectsUpdatedMessage'] = ResolversParentTypes['UserProjectsUpdatedMessage']> = {
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  project?: Resolver<Maybe<ResolversTypes['Project']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['UserProjectsUpdatedMessageType'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UserSearchResultCollectionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['UserSearchResultCollection'] = ResolversParentTypes['UserSearchResultCollection']> = {
  cursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  items?: Resolver<Array<ResolversTypes['LimitedUser']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UserStreamCollectionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['UserStreamCollection'] = ResolversParentTypes['UserStreamCollection']> = {
  cursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  items?: Resolver<Maybe<Array<ResolversTypes['Stream']>>, ParentType, ContextType>;
  numberOfHidden?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type VersionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Version'] = ResolversParentTypes['Version']> = {
  authorUser?: Resolver<Maybe<ResolversTypes['LimitedUser']>, ParentType, ContextType>;
  automationsStatus?: Resolver<Maybe<ResolversTypes['TriggeredAutomationsStatus']>, ParentType, ContextType>;
  commentThreads?: Resolver<ResolversTypes['CommentCollection'], ParentType, ContextType, RequireFields<VersionCommentThreadsArgs, 'limit'>>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  gendoAIRender?: Resolver<ResolversTypes['GendoAIRender'], ParentType, ContextType, RequireFields<VersionGendoAiRenderArgs, 'id'>>;
  gendoAIRenders?: Resolver<ResolversTypes['GendoAIRenderCollection'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  message?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  model?: Resolver<ResolversTypes['Model'], ParentType, ContextType>;
  parents?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  permissions?: Resolver<ResolversTypes['VersionPermissionChecks'], ParentType, ContextType>;
  previewUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  referencedObject?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  sourceApplication?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  totalChildrenCount?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type VersionCollectionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['VersionCollection'] = ResolversParentTypes['VersionCollection']> = {
  cursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  items?: Resolver<Array<ResolversTypes['Version']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type VersionCreatedTriggerResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['VersionCreatedTrigger'] = ResolversParentTypes['VersionCreatedTrigger']> = {
  model?: Resolver<Maybe<ResolversTypes['Model']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['AutomateRunTriggerType'], ParentType, ContextType>;
  version?: Resolver<Maybe<ResolversTypes['Version']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type VersionCreatedTriggerDefinitionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['VersionCreatedTriggerDefinition'] = ResolversParentTypes['VersionCreatedTriggerDefinition']> = {
  model?: Resolver<Maybe<ResolversTypes['Model']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['AutomateRunTriggerType'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type VersionMutationsResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['VersionMutations'] = ResolversParentTypes['VersionMutations']> = {
  create?: Resolver<ResolversTypes['Version'], ParentType, ContextType, RequireFields<VersionMutationsCreateArgs, 'input'>>;
  delete?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<VersionMutationsDeleteArgs, 'input'>>;
  markReceived?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<VersionMutationsMarkReceivedArgs, 'input'>>;
  moveToModel?: Resolver<ResolversTypes['Model'], ParentType, ContextType, RequireFields<VersionMutationsMoveToModelArgs, 'input'>>;
  requestGendoAIRender?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<VersionMutationsRequestGendoAiRenderArgs, 'input'>>;
  update?: Resolver<ResolversTypes['Version'], ParentType, ContextType, RequireFields<VersionMutationsUpdateArgs, 'input'>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type VersionPermissionChecksResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['VersionPermissionChecks'] = ResolversParentTypes['VersionPermissionChecks']> = {
  canReceive?: Resolver<ResolversTypes['PermissionCheckResult'], ParentType, ContextType>;
  canUpdate?: Resolver<ResolversTypes['PermissionCheckResult'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ViewerResourceGroupResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ViewerResourceGroup'] = ResolversParentTypes['ViewerResourceGroup']> = {
  identifier?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  items?: Resolver<Array<ResolversTypes['ViewerResourceItem']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ViewerResourceItemResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ViewerResourceItem'] = ResolversParentTypes['ViewerResourceItem']> = {
  modelId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  objectId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  versionId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ViewerUserActivityMessageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ViewerUserActivityMessage'] = ResolversParentTypes['ViewerUserActivityMessage']> = {
  sessionId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  state?: Resolver<Maybe<ResolversTypes['JSONObject']>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes['ViewerUserActivityStatus'], ParentType, ContextType>;
  user?: Resolver<Maybe<ResolversTypes['LimitedUser']>, ParentType, ContextType>;
  userId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  userName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type WebhookResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Webhook'] = ResolversParentTypes['Webhook']> = {
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  enabled?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  hasSecret?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  history?: Resolver<Maybe<ResolversTypes['WebhookEventCollection']>, ParentType, ContextType, RequireFields<WebhookHistoryArgs, 'limit'>>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  projectId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  streamId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  triggers?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  url?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type WebhookCollectionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['WebhookCollection'] = ResolversParentTypes['WebhookCollection']> = {
  items?: Resolver<Array<ResolversTypes['Webhook']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type WebhookEventResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['WebhookEvent'] = ResolversParentTypes['WebhookEvent']> = {
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  lastUpdate?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  payload?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  retryCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  statusInfo?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  webhookId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type WebhookEventCollectionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['WebhookEventCollection'] = ResolversParentTypes['WebhookEventCollection']> = {
  items?: Resolver<Maybe<Array<Maybe<ResolversTypes['WebhookEvent']>>>, ParentType, ContextType>;
  totalCount?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type WorkspaceResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Workspace'] = ResolversParentTypes['Workspace']> = {
  adminWorkspacesJoinRequests?: Resolver<Maybe<ResolversTypes['WorkspaceJoinRequestCollection']>, ParentType, ContextType, RequireFields<WorkspaceAdminWorkspacesJoinRequestsArgs, 'limit'>>;
  automateFunctions?: Resolver<ResolversTypes['AutomateFunctionCollection'], ParentType, ContextType, RequireFields<WorkspaceAutomateFunctionsArgs, 'limit'>>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  creationState?: Resolver<Maybe<ResolversTypes['WorkspaceCreationState']>, ParentType, ContextType>;
  customerPortalUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  defaultProjectRole?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  defaultRegion?: Resolver<Maybe<ResolversTypes['ServerRegionItem']>, ParentType, ContextType>;
  defaultSeatType?: Resolver<ResolversTypes['WorkspaceSeatType'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  discoverabilityAutoJoinEnabled?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  discoverabilityEnabled?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  domainBasedMembershipProtectionEnabled?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  domains?: Resolver<Maybe<Array<ResolversTypes['WorkspaceDomain']>>, ParentType, ContextType>;
  embedOptions?: Resolver<ResolversTypes['WorkspaceEmbedOptions'], ParentType, ContextType>;
  hasAccessToFeature?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<WorkspaceHasAccessToFeatureArgs, 'featureName'>>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  invitedTeam?: Resolver<Maybe<Array<ResolversTypes['PendingWorkspaceCollaborator']>>, ParentType, ContextType, Partial<WorkspaceInvitedTeamArgs>>;
  isExclusive?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  logo?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  permissions?: Resolver<ResolversTypes['WorkspacePermissionChecks'], ParentType, ContextType>;
  plan?: Resolver<Maybe<ResolversTypes['WorkspacePlan']>, ParentType, ContextType>;
  planPrices?: Resolver<Maybe<ResolversTypes['WorkspacePaidPlanPrices']>, ParentType, ContextType>;
  projects?: Resolver<ResolversTypes['ProjectCollection'], ParentType, ContextType, RequireFields<WorkspaceProjectsArgs, 'limit'>>;
  readOnly?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  role?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  seatType?: Resolver<Maybe<ResolversTypes['WorkspaceSeatType']>, ParentType, ContextType>;
  seats?: Resolver<Maybe<ResolversTypes['WorkspaceSubscriptionSeats']>, ParentType, ContextType>;
  slug?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  sso?: Resolver<Maybe<ResolversTypes['WorkspaceSso']>, ParentType, ContextType>;
  subscription?: Resolver<Maybe<ResolversTypes['WorkspaceSubscription']>, ParentType, ContextType>;
  team?: Resolver<ResolversTypes['WorkspaceCollaboratorCollection'], ParentType, ContextType, RequireFields<WorkspaceTeamArgs, 'limit'>>;
  teamByRole?: Resolver<ResolversTypes['WorkspaceTeamByRole'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type WorkspaceBillingMutationsResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['WorkspaceBillingMutations'] = ResolversParentTypes['WorkspaceBillingMutations']> = {
  cancelCheckoutSession?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<WorkspaceBillingMutationsCancelCheckoutSessionArgs, 'input'>>;
  createCheckoutSession?: Resolver<ResolversTypes['CheckoutSession'], ParentType, ContextType, RequireFields<WorkspaceBillingMutationsCreateCheckoutSessionArgs, 'input'>>;
  upgradePlan?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<WorkspaceBillingMutationsUpgradePlanArgs, 'input'>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type WorkspaceCollaboratorResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['WorkspaceCollaborator'] = ResolversParentTypes['WorkspaceCollaborator']> = {
  email?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  joinDate?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  projectRoles?: Resolver<Array<ResolversTypes['ProjectRole']>, ParentType, ContextType>;
  role?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  seatType?: Resolver<Maybe<ResolversTypes['WorkspaceSeatType']>, ParentType, ContextType>;
  user?: Resolver<ResolversTypes['LimitedUser'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type WorkspaceCollaboratorCollectionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['WorkspaceCollaboratorCollection'] = ResolversParentTypes['WorkspaceCollaboratorCollection']> = {
  cursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  items?: Resolver<Array<ResolversTypes['WorkspaceCollaborator']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type WorkspaceCollectionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['WorkspaceCollection'] = ResolversParentTypes['WorkspaceCollection']> = {
  cursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  items?: Resolver<Array<ResolversTypes['Workspace']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type WorkspaceCreationStateResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['WorkspaceCreationState'] = ResolversParentTypes['WorkspaceCreationState']> = {
  completed?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  state?: Resolver<ResolversTypes['JSONObject'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type WorkspaceDomainResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['WorkspaceDomain'] = ResolversParentTypes['WorkspaceDomain']> = {
  domain?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type WorkspaceEmbedOptionsResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['WorkspaceEmbedOptions'] = ResolversParentTypes['WorkspaceEmbedOptions']> = {
  hideSpeckleBranding?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type WorkspaceInviteMutationsResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['WorkspaceInviteMutations'] = ResolversParentTypes['WorkspaceInviteMutations']> = {
  batchCreate?: Resolver<ResolversTypes['Workspace'], ParentType, ContextType, RequireFields<WorkspaceInviteMutationsBatchCreateArgs, 'input' | 'workspaceId'>>;
  cancel?: Resolver<ResolversTypes['Workspace'], ParentType, ContextType, RequireFields<WorkspaceInviteMutationsCancelArgs, 'inviteId' | 'workspaceId'>>;
  create?: Resolver<ResolversTypes['Workspace'], ParentType, ContextType, RequireFields<WorkspaceInviteMutationsCreateArgs, 'input' | 'workspaceId'>>;
  resend?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<WorkspaceInviteMutationsResendArgs, 'input'>>;
  use?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<WorkspaceInviteMutationsUseArgs, 'input'>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type WorkspaceJoinRequestResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['WorkspaceJoinRequest'] = ResolversParentTypes['WorkspaceJoinRequest']> = {
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  email?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['WorkspaceJoinRequestStatus'], ParentType, ContextType>;
  user?: Resolver<ResolversTypes['LimitedUser'], ParentType, ContextType>;
  workspace?: Resolver<ResolversTypes['Workspace'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type WorkspaceJoinRequestCollectionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['WorkspaceJoinRequestCollection'] = ResolversParentTypes['WorkspaceJoinRequestCollection']> = {
  cursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  items?: Resolver<Array<ResolversTypes['WorkspaceJoinRequest']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type WorkspaceJoinRequestMutationsResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['WorkspaceJoinRequestMutations'] = ResolversParentTypes['WorkspaceJoinRequestMutations']> = {
  approve?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<WorkspaceJoinRequestMutationsApproveArgs, 'input'>>;
  deny?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<WorkspaceJoinRequestMutationsDenyArgs, 'input'>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type WorkspaceMutationsResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['WorkspaceMutations'] = ResolversParentTypes['WorkspaceMutations']> = {
  addDomain?: Resolver<ResolversTypes['Workspace'], ParentType, ContextType, RequireFields<WorkspaceMutationsAddDomainArgs, 'input'>>;
  billing?: Resolver<ResolversTypes['WorkspaceBillingMutations'], ParentType, ContextType>;
  create?: Resolver<ResolversTypes['Workspace'], ParentType, ContextType, RequireFields<WorkspaceMutationsCreateArgs, 'input'>>;
  delete?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<WorkspaceMutationsDeleteArgs, 'workspaceId'>>;
  deleteDomain?: Resolver<ResolversTypes['Workspace'], ParentType, ContextType, RequireFields<WorkspaceMutationsDeleteDomainArgs, 'input'>>;
  deleteSsoProvider?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<WorkspaceMutationsDeleteSsoProviderArgs, 'workspaceId'>>;
  dismiss?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<WorkspaceMutationsDismissArgs, 'input'>>;
  invites?: Resolver<ResolversTypes['WorkspaceInviteMutations'], ParentType, ContextType>;
  leave?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<WorkspaceMutationsLeaveArgs, 'id'>>;
  projects?: Resolver<ResolversTypes['WorkspaceProjectMutations'], ParentType, ContextType>;
  requestToJoin?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<WorkspaceMutationsRequestToJoinArgs, 'input'>>;
  setDefaultRegion?: Resolver<ResolversTypes['Workspace'], ParentType, ContextType, RequireFields<WorkspaceMutationsSetDefaultRegionArgs, 'regionKey' | 'workspaceId'>>;
  update?: Resolver<ResolversTypes['Workspace'], ParentType, ContextType, RequireFields<WorkspaceMutationsUpdateArgs, 'input'>>;
  updateCreationState?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<WorkspaceMutationsUpdateCreationStateArgs, 'input'>>;
  updateEmbedOptions?: Resolver<ResolversTypes['WorkspaceEmbedOptions'], ParentType, ContextType, RequireFields<WorkspaceMutationsUpdateEmbedOptionsArgs, 'input'>>;
  updateRole?: Resolver<ResolversTypes['Workspace'], ParentType, ContextType, RequireFields<WorkspaceMutationsUpdateRoleArgs, 'input'>>;
  updateSeatType?: Resolver<ResolversTypes['Workspace'], ParentType, ContextType, RequireFields<WorkspaceMutationsUpdateSeatTypeArgs, 'input'>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type WorkspacePaidPlanPricesResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['WorkspacePaidPlanPrices'] = ResolversParentTypes['WorkspacePaidPlanPrices']> = {
  pro?: Resolver<ResolversTypes['WorkspacePlanPrice'], ParentType, ContextType>;
  proUnlimited?: Resolver<ResolversTypes['WorkspacePlanPrice'], ParentType, ContextType>;
  team?: Resolver<ResolversTypes['WorkspacePlanPrice'], ParentType, ContextType>;
  teamUnlimited?: Resolver<ResolversTypes['WorkspacePlanPrice'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type WorkspacePermissionChecksResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['WorkspacePermissionChecks'] = ResolversParentTypes['WorkspacePermissionChecks']> = {
  canCreateProject?: Resolver<ResolversTypes['PermissionCheckResult'], ParentType, ContextType>;
  canEditEmbedOptions?: Resolver<ResolversTypes['PermissionCheckResult'], ParentType, ContextType>;
  canInvite?: Resolver<ResolversTypes['PermissionCheckResult'], ParentType, ContextType>;
  canMakeWorkspaceExclusive?: Resolver<ResolversTypes['PermissionCheckResult'], ParentType, ContextType>;
  canMoveProjectToWorkspace?: Resolver<ResolversTypes['PermissionCheckResult'], ParentType, ContextType, Partial<WorkspacePermissionChecksCanMoveProjectToWorkspaceArgs>>;
  canReadMemberEmail?: Resolver<ResolversTypes['PermissionCheckResult'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type WorkspacePlanResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['WorkspacePlan'] = ResolversParentTypes['WorkspacePlan']> = {
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['WorkspacePlans'], ParentType, ContextType>;
  paymentMethod?: Resolver<ResolversTypes['WorkspacePaymentMethod'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['WorkspacePlanStatuses'], ParentType, ContextType>;
  usage?: Resolver<ResolversTypes['WorkspacePlanUsage'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type WorkspacePlanPriceResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['WorkspacePlanPrice'] = ResolversParentTypes['WorkspacePlanPrice']> = {
  monthly?: Resolver<ResolversTypes['Price'], ParentType, ContextType>;
  yearly?: Resolver<ResolversTypes['Price'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type WorkspacePlanUsageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['WorkspacePlanUsage'] = ResolversParentTypes['WorkspacePlanUsage']> = {
  modelCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  projectCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type WorkspaceProjectMutationsResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['WorkspaceProjectMutations'] = ResolversParentTypes['WorkspaceProjectMutations']> = {
  create?: Resolver<ResolversTypes['Project'], ParentType, ContextType, RequireFields<WorkspaceProjectMutationsCreateArgs, 'input'>>;
  moveToRegion?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<WorkspaceProjectMutationsMoveToRegionArgs, 'projectId' | 'regionKey'>>;
  moveToWorkspace?: Resolver<ResolversTypes['Project'], ParentType, ContextType, RequireFields<WorkspaceProjectMutationsMoveToWorkspaceArgs, 'projectId' | 'workspaceId'>>;
  updateRole?: Resolver<ResolversTypes['Project'], ParentType, ContextType, RequireFields<WorkspaceProjectMutationsUpdateRoleArgs, 'input'>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type WorkspaceProjectsUpdatedMessageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['WorkspaceProjectsUpdatedMessage'] = ResolversParentTypes['WorkspaceProjectsUpdatedMessage']> = {
  project?: Resolver<Maybe<ResolversTypes['Project']>, ParentType, ContextType>;
  projectId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['WorkspaceProjectsUpdatedMessageType'], ParentType, ContextType>;
  workspaceId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type WorkspaceRoleCollectionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['WorkspaceRoleCollection'] = ResolversParentTypes['WorkspaceRoleCollection']> = {
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type WorkspaceSeatCollectionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['WorkspaceSeatCollection'] = ResolversParentTypes['WorkspaceSeatCollection']> = {
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type WorkspaceSeatsByTypeResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['WorkspaceSeatsByType'] = ResolversParentTypes['WorkspaceSeatsByType']> = {
  editors?: Resolver<Maybe<ResolversTypes['WorkspaceSeatCollection']>, ParentType, ContextType>;
  viewers?: Resolver<Maybe<ResolversTypes['WorkspaceSeatCollection']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type WorkspaceSsoResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['WorkspaceSso'] = ResolversParentTypes['WorkspaceSso']> = {
  provider?: Resolver<Maybe<ResolversTypes['WorkspaceSsoProvider']>, ParentType, ContextType>;
  session?: Resolver<Maybe<ResolversTypes['WorkspaceSsoSession']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type WorkspaceSsoProviderResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['WorkspaceSsoProvider'] = ResolversParentTypes['WorkspaceSsoProvider']> = {
  clientId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  issuerUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type WorkspaceSsoSessionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['WorkspaceSsoSession'] = ResolversParentTypes['WorkspaceSsoSession']> = {
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  validUntil?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type WorkspaceSubscriptionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['WorkspaceSubscription'] = ResolversParentTypes['WorkspaceSubscription']> = {
  billingInterval?: Resolver<ResolversTypes['BillingInterval'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  currency?: Resolver<ResolversTypes['Currency'], ParentType, ContextType>;
  currentBillingCycleEnd?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  seats?: Resolver<ResolversTypes['WorkspaceSubscriptionSeats'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type WorkspaceSubscriptionSeatCountResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['WorkspaceSubscriptionSeatCount'] = ResolversParentTypes['WorkspaceSubscriptionSeatCount']> = {
  assigned?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  available?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type WorkspaceSubscriptionSeatsResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['WorkspaceSubscriptionSeats'] = ResolversParentTypes['WorkspaceSubscriptionSeats']> = {
  editors?: Resolver<ResolversTypes['WorkspaceSubscriptionSeatCount'], ParentType, ContextType>;
  viewers?: Resolver<ResolversTypes['WorkspaceSubscriptionSeatCount'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type WorkspaceTeamByRoleResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['WorkspaceTeamByRole'] = ResolversParentTypes['WorkspaceTeamByRole']> = {
  admins?: Resolver<Maybe<ResolversTypes['WorkspaceRoleCollection']>, ParentType, ContextType>;
  guests?: Resolver<Maybe<ResolversTypes['WorkspaceRoleCollection']>, ParentType, ContextType>;
  members?: Resolver<Maybe<ResolversTypes['WorkspaceRoleCollection']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type WorkspaceUpdatedMessageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['WorkspaceUpdatedMessage'] = ResolversParentTypes['WorkspaceUpdatedMessage']> = {
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  workspace?: Resolver<ResolversTypes['Workspace'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type Resolvers<ContextType = GraphQLContext> = {
  ActiveUserMutations?: ActiveUserMutationsResolvers<ContextType>;
  Activity?: ActivityResolvers<ContextType>;
  ActivityCollection?: ActivityCollectionResolvers<ContextType>;
  AdminInviteList?: AdminInviteListResolvers<ContextType>;
  AdminMutations?: AdminMutationsResolvers<ContextType>;
  AdminQueries?: AdminQueriesResolvers<ContextType>;
  AdminUserList?: AdminUserListResolvers<ContextType>;
  AdminUserListItem?: AdminUserListItemResolvers<ContextType>;
  AdminUsersListCollection?: AdminUsersListCollectionResolvers<ContextType>;
  AdminUsersListItem?: AdminUsersListItemResolvers<ContextType>;
  ApiToken?: ApiTokenResolvers<ContextType>;
  AppAuthor?: AppAuthorResolvers<ContextType>;
  AuthStrategy?: AuthStrategyResolvers<ContextType>;
  AutomateFunction?: AutomateFunctionResolvers<ContextType>;
  AutomateFunctionCollection?: AutomateFunctionCollectionResolvers<ContextType>;
  AutomateFunctionRelease?: AutomateFunctionReleaseResolvers<ContextType>;
  AutomateFunctionReleaseCollection?: AutomateFunctionReleaseCollectionResolvers<ContextType>;
  AutomateFunctionRun?: AutomateFunctionRunResolvers<ContextType>;
  AutomateFunctionTemplate?: AutomateFunctionTemplateResolvers<ContextType>;
  AutomateFunctionToken?: AutomateFunctionTokenResolvers<ContextType>;
  AutomateMutations?: AutomateMutationsResolvers<ContextType>;
  AutomateRun?: AutomateRunResolvers<ContextType>;
  AutomateRunCollection?: AutomateRunCollectionResolvers<ContextType>;
  Automation?: AutomationResolvers<ContextType>;
  AutomationCollection?: AutomationCollectionResolvers<ContextType>;
  AutomationPermissionChecks?: AutomationPermissionChecksResolvers<ContextType>;
  AutomationRevision?: AutomationRevisionResolvers<ContextType>;
  AutomationRevisionFunction?: AutomationRevisionFunctionResolvers<ContextType>;
  AutomationRevisionTriggerDefinition?: AutomationRevisionTriggerDefinitionResolvers<ContextType>;
  AutomationRunTrigger?: AutomationRunTriggerResolvers<ContextType>;
  BasicGitRepositoryMetadata?: BasicGitRepositoryMetadataResolvers<ContextType>;
  BigInt?: GraphQLScalarType;
  BlobMetadata?: BlobMetadataResolvers<ContextType>;
  BlobMetadataCollection?: BlobMetadataCollectionResolvers<ContextType>;
  Branch?: BranchResolvers<ContextType>;
  BranchCollection?: BranchCollectionResolvers<ContextType>;
  CheckoutSession?: CheckoutSessionResolvers<ContextType>;
  Comment?: CommentResolvers<ContextType>;
  CommentActivityMessage?: CommentActivityMessageResolvers<ContextType>;
  CommentCollection?: CommentCollectionResolvers<ContextType>;
  CommentDataFilters?: CommentDataFiltersResolvers<ContextType>;
  CommentMutations?: CommentMutationsResolvers<ContextType>;
  CommentPermissionChecks?: CommentPermissionChecksResolvers<ContextType>;
  CommentReplyAuthorCollection?: CommentReplyAuthorCollectionResolvers<ContextType>;
  CommentThreadActivityMessage?: CommentThreadActivityMessageResolvers<ContextType>;
  Commit?: CommitResolvers<ContextType>;
  CommitCollection?: CommitCollectionResolvers<ContextType>;
  CountOnlyCollection?: CountOnlyCollectionResolvers<ContextType>;
  CreateEmbedTokenReturn?: CreateEmbedTokenReturnResolvers<ContextType>;
  CurrencyBasedPrices?: CurrencyBasedPricesResolvers<ContextType>;
  DateTime?: GraphQLScalarType;
  EmbedToken?: EmbedTokenResolvers<ContextType>;
  EmbedTokenCollection?: EmbedTokenCollectionResolvers<ContextType>;
  FileUpload?: FileUploadResolvers<ContextType>;
  FileUploadCollection?: FileUploadCollectionResolvers<ContextType>;
  FileUploadMutations?: FileUploadMutationsResolvers<ContextType>;
  GendoAIRender?: GendoAiRenderResolvers<ContextType>;
  GendoAIRenderCollection?: GendoAiRenderCollectionResolvers<ContextType>;
  GenerateFileUploadUrlOutput?: GenerateFileUploadUrlOutputResolvers<ContextType>;
  JSONObject?: GraphQLScalarType;
  LegacyCommentViewerData?: LegacyCommentViewerDataResolvers<ContextType>;
  LimitedUser?: LimitedUserResolvers<ContextType>;
  LimitedWorkspace?: LimitedWorkspaceResolvers<ContextType>;
  LimitedWorkspaceCollaborator?: LimitedWorkspaceCollaboratorResolvers<ContextType>;
  LimitedWorkspaceCollaboratorCollection?: LimitedWorkspaceCollaboratorCollectionResolvers<ContextType>;
  LimitedWorkspaceJoinRequest?: LimitedWorkspaceJoinRequestResolvers<ContextType>;
  LimitedWorkspaceJoinRequestCollection?: LimitedWorkspaceJoinRequestCollectionResolvers<ContextType>;
  Model?: ModelResolvers<ContextType>;
  ModelCollection?: ModelCollectionResolvers<ContextType>;
  ModelMutations?: ModelMutationsResolvers<ContextType>;
  ModelPermissionChecks?: ModelPermissionChecksResolvers<ContextType>;
  ModelsTreeItem?: ModelsTreeItemResolvers<ContextType>;
  ModelsTreeItemCollection?: ModelsTreeItemCollectionResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  Object?: ObjectResolvers<ContextType>;
  ObjectCollection?: ObjectCollectionResolvers<ContextType>;
  PasswordStrengthCheckFeedback?: PasswordStrengthCheckFeedbackResolvers<ContextType>;
  PasswordStrengthCheckResults?: PasswordStrengthCheckResultsResolvers<ContextType>;
  PendingStreamCollaborator?: PendingStreamCollaboratorResolvers<ContextType>;
  PendingWorkspaceCollaborator?: PendingWorkspaceCollaboratorResolvers<ContextType>;
  PermissionCheckResult?: PermissionCheckResultResolvers<ContextType>;
  Price?: PriceResolvers<ContextType>;
  Project?: ProjectResolvers<ContextType>;
  ProjectAccessRequest?: ProjectAccessRequestResolvers<ContextType>;
  ProjectAccessRequestMutations?: ProjectAccessRequestMutationsResolvers<ContextType>;
  ProjectAutomationMutations?: ProjectAutomationMutationsResolvers<ContextType>;
  ProjectAutomationsUpdatedMessage?: ProjectAutomationsUpdatedMessageResolvers<ContextType>;
  ProjectCollaborator?: ProjectCollaboratorResolvers<ContextType>;
  ProjectCollection?: ProjectCollectionResolvers<ContextType>;
  ProjectCommentCollection?: ProjectCommentCollectionResolvers<ContextType>;
  ProjectCommentsUpdatedMessage?: ProjectCommentsUpdatedMessageResolvers<ContextType>;
  ProjectEmbedOptions?: ProjectEmbedOptionsResolvers<ContextType>;
  ProjectFileImportUpdatedMessage?: ProjectFileImportUpdatedMessageResolvers<ContextType>;
  ProjectInviteMutations?: ProjectInviteMutationsResolvers<ContextType>;
  ProjectModelsUpdatedMessage?: ProjectModelsUpdatedMessageResolvers<ContextType>;
  ProjectMoveToWorkspaceDryRun?: ProjectMoveToWorkspaceDryRunResolvers<ContextType>;
  ProjectMutations?: ProjectMutationsResolvers<ContextType>;
  ProjectPendingModelsUpdatedMessage?: ProjectPendingModelsUpdatedMessageResolvers<ContextType>;
  ProjectPendingVersionsUpdatedMessage?: ProjectPendingVersionsUpdatedMessageResolvers<ContextType>;
  ProjectPermissionChecks?: ProjectPermissionChecksResolvers<ContextType>;
  ProjectRole?: ProjectRoleResolvers<ContextType>;
  ProjectTriggeredAutomationsStatusUpdatedMessage?: ProjectTriggeredAutomationsStatusUpdatedMessageResolvers<ContextType>;
  ProjectUpdatedMessage?: ProjectUpdatedMessageResolvers<ContextType>;
  ProjectVersionsPreviewGeneratedMessage?: ProjectVersionsPreviewGeneratedMessageResolvers<ContextType>;
  ProjectVersionsUpdatedMessage?: ProjectVersionsUpdatedMessageResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  ResourceIdentifier?: ResourceIdentifierResolvers<ContextType>;
  Role?: RoleResolvers<ContextType>;
  RootPermissionChecks?: RootPermissionChecksResolvers<ContextType>;
  Scope?: ScopeResolvers<ContextType>;
  ServerApp?: ServerAppResolvers<ContextType>;
  ServerAppListItem?: ServerAppListItemResolvers<ContextType>;
  ServerAutomateInfo?: ServerAutomateInfoResolvers<ContextType>;
  ServerConfiguration?: ServerConfigurationResolvers<ContextType>;
  ServerInfo?: ServerInfoResolvers<ContextType>;
  ServerInfoMutations?: ServerInfoMutationsResolvers<ContextType>;
  ServerInvite?: ServerInviteResolvers<ContextType>;
  ServerMigration?: ServerMigrationResolvers<ContextType>;
  ServerMultiRegionConfiguration?: ServerMultiRegionConfigurationResolvers<ContextType>;
  ServerRegionItem?: ServerRegionItemResolvers<ContextType>;
  ServerRegionMutations?: ServerRegionMutationsResolvers<ContextType>;
  ServerRoleItem?: ServerRoleItemResolvers<ContextType>;
  ServerStatistics?: ServerStatisticsResolvers<ContextType>;
  ServerStats?: ServerStatsResolvers<ContextType>;
  ServerWorkspacesInfo?: ServerWorkspacesInfoResolvers<ContextType>;
  SmartTextEditorValue?: SmartTextEditorValueResolvers<ContextType>;
  Stream?: StreamResolvers<ContextType>;
  StreamAccessRequest?: StreamAccessRequestResolvers<ContextType>;
  StreamCollaborator?: StreamCollaboratorResolvers<ContextType>;
  StreamCollection?: StreamCollectionResolvers<ContextType>;
  Subscription?: SubscriptionResolvers<ContextType>;
  TestAutomationRun?: TestAutomationRunResolvers<ContextType>;
  TestAutomationRunTrigger?: TestAutomationRunTriggerResolvers<ContextType>;
  TestAutomationRunTriggerPayload?: TestAutomationRunTriggerPayloadResolvers<ContextType>;
  TokenResourceIdentifier?: TokenResourceIdentifierResolvers<ContextType>;
  TriggeredAutomationsStatus?: TriggeredAutomationsStatusResolvers<ContextType>;
  User?: UserResolvers<ContextType>;
  UserAutomateInfo?: UserAutomateInfoResolvers<ContextType>;
  UserEmail?: UserEmailResolvers<ContextType>;
  UserEmailMutations?: UserEmailMutationsResolvers<ContextType>;
  UserGendoAICredits?: UserGendoAiCreditsResolvers<ContextType>;
  UserMeta?: UserMetaResolvers<ContextType>;
  UserMetaMutations?: UserMetaMutationsResolvers<ContextType>;
  UserProjectCollection?: UserProjectCollectionResolvers<ContextType>;
  UserProjectsUpdatedMessage?: UserProjectsUpdatedMessageResolvers<ContextType>;
  UserSearchResultCollection?: UserSearchResultCollectionResolvers<ContextType>;
  UserStreamCollection?: UserStreamCollectionResolvers<ContextType>;
  Version?: VersionResolvers<ContextType>;
  VersionCollection?: VersionCollectionResolvers<ContextType>;
  VersionCreatedTrigger?: VersionCreatedTriggerResolvers<ContextType>;
  VersionCreatedTriggerDefinition?: VersionCreatedTriggerDefinitionResolvers<ContextType>;
  VersionMutations?: VersionMutationsResolvers<ContextType>;
  VersionPermissionChecks?: VersionPermissionChecksResolvers<ContextType>;
  ViewerResourceGroup?: ViewerResourceGroupResolvers<ContextType>;
  ViewerResourceItem?: ViewerResourceItemResolvers<ContextType>;
  ViewerUserActivityMessage?: ViewerUserActivityMessageResolvers<ContextType>;
  Webhook?: WebhookResolvers<ContextType>;
  WebhookCollection?: WebhookCollectionResolvers<ContextType>;
  WebhookEvent?: WebhookEventResolvers<ContextType>;
  WebhookEventCollection?: WebhookEventCollectionResolvers<ContextType>;
  Workspace?: WorkspaceResolvers<ContextType>;
  WorkspaceBillingMutations?: WorkspaceBillingMutationsResolvers<ContextType>;
  WorkspaceCollaborator?: WorkspaceCollaboratorResolvers<ContextType>;
  WorkspaceCollaboratorCollection?: WorkspaceCollaboratorCollectionResolvers<ContextType>;
  WorkspaceCollection?: WorkspaceCollectionResolvers<ContextType>;
  WorkspaceCreationState?: WorkspaceCreationStateResolvers<ContextType>;
  WorkspaceDomain?: WorkspaceDomainResolvers<ContextType>;
  WorkspaceEmbedOptions?: WorkspaceEmbedOptionsResolvers<ContextType>;
  WorkspaceInviteMutations?: WorkspaceInviteMutationsResolvers<ContextType>;
  WorkspaceJoinRequest?: WorkspaceJoinRequestResolvers<ContextType>;
  WorkspaceJoinRequestCollection?: WorkspaceJoinRequestCollectionResolvers<ContextType>;
  WorkspaceJoinRequestMutations?: WorkspaceJoinRequestMutationsResolvers<ContextType>;
  WorkspaceMutations?: WorkspaceMutationsResolvers<ContextType>;
  WorkspacePaidPlanPrices?: WorkspacePaidPlanPricesResolvers<ContextType>;
  WorkspacePermissionChecks?: WorkspacePermissionChecksResolvers<ContextType>;
  WorkspacePlan?: WorkspacePlanResolvers<ContextType>;
  WorkspacePlanPrice?: WorkspacePlanPriceResolvers<ContextType>;
  WorkspacePlanUsage?: WorkspacePlanUsageResolvers<ContextType>;
  WorkspaceProjectMutations?: WorkspaceProjectMutationsResolvers<ContextType>;
  WorkspaceProjectsUpdatedMessage?: WorkspaceProjectsUpdatedMessageResolvers<ContextType>;
  WorkspaceRoleCollection?: WorkspaceRoleCollectionResolvers<ContextType>;
  WorkspaceSeatCollection?: WorkspaceSeatCollectionResolvers<ContextType>;
  WorkspaceSeatsByType?: WorkspaceSeatsByTypeResolvers<ContextType>;
  WorkspaceSso?: WorkspaceSsoResolvers<ContextType>;
  WorkspaceSsoProvider?: WorkspaceSsoProviderResolvers<ContextType>;
  WorkspaceSsoSession?: WorkspaceSsoSessionResolvers<ContextType>;
  WorkspaceSubscription?: WorkspaceSubscriptionResolvers<ContextType>;
  WorkspaceSubscriptionSeatCount?: WorkspaceSubscriptionSeatCountResolvers<ContextType>;
  WorkspaceSubscriptionSeats?: WorkspaceSubscriptionSeatsResolvers<ContextType>;
  WorkspaceTeamByRole?: WorkspaceTeamByRoleResolvers<ContextType>;
  WorkspaceUpdatedMessage?: WorkspaceUpdatedMessageResolvers<ContextType>;
};

export type DirectiveResolvers<ContextType = GraphQLContext> = {
  hasScope?: HasScopeDirectiveResolver<any, any, ContextType>;
  hasScopes?: HasScopesDirectiveResolver<any, any, ContextType>;
  hasServerRole?: HasServerRoleDirectiveResolver<any, any, ContextType>;
  hasStreamRole?: HasStreamRoleDirectiveResolver<any, any, ContextType>;
  hasWorkspaceRole?: HasWorkspaceRoleDirectiveResolver<any, any, ContextType>;
  isOwner?: IsOwnerDirectiveResolver<any, any, ContextType>;
};
