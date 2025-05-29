import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
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
  DateTime: { input: string; output: string; }
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
  /** Alias for branchName */
  modelName: Scalars['String']['output'];
  /** Alias for streamId */
  projectId: Scalars['String']['output'];
  streamId: Scalars['String']['output'];
  uploadComplete: Scalars['Boolean']['output'];
  uploadDate: Scalars['DateTime']['output'];
  /** The user's id that uploaded this file. */
  userId: Scalars['String']['output'];
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
  workspaceId: Scalars['String']['output'];
  workspaceName: Scalars['String']['output'];
  workspaceSlug: Scalars['String']['output'];
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


export type ProjectMutationsDeleteArgs = {
  id: Scalars['String']['input'];
};


export type ProjectMutationsLeaveArgs = {
  id: Scalars['String']['input'];
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
  canCreateModel: PermissionCheckResult;
  canDelete: PermissionCheckResult;
  canInvite: PermissionCheckResult;
  canLeave: PermissionCheckResult;
  canLoad: PermissionCheckResult;
  canMoveToWorkspace: PermissionCheckResult;
  canPublish: PermissionCheckResult;
  canRead: PermissionCheckResult;
  canReadSettings: PermissionCheckResult;
  canReadWebhooks: PermissionCheckResult;
  canRequestRender: PermissionCheckResult;
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
  canMoveProjectToWorkspace: PermissionCheckResult;
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
  description?: InputMaybe<Scalars['String']['input']>;
  discoverabilityAutoJoinEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  discoverabilityEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  domainBasedMembershipProtectionEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  id: Scalars['String']['input'];
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

export type CreateObjectMutationVariables = Exact<{
  input: ObjectCreateInput;
}>;


export type CreateObjectMutation = { __typename?: 'Mutation', objectCreate: Array<string> };

export type PingPongSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type PingPongSubscription = { __typename?: 'Subscription', ping: string };

export type OnUserProjectsUpdatedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type OnUserProjectsUpdatedSubscription = { __typename?: 'Subscription', userProjectsUpdated: { __typename?: 'UserProjectsUpdatedMessage', id: string, type: UserProjectsUpdatedMessageType, project?: { __typename?: 'Project', id: string, name: string } | null } };

export type OnProjectUpdatedSubscriptionVariables = Exact<{
  projectId: Scalars['String']['input'];
}>;


export type OnProjectUpdatedSubscription = { __typename?: 'Subscription', projectUpdated: { __typename?: 'ProjectUpdatedMessage', id: string, type: ProjectUpdatedMessageType, project?: { __typename?: 'Project', id: string, name: string } | null } };

export type OnUserStreamAddedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type OnUserStreamAddedSubscription = { __typename?: 'Subscription', userStreamAdded?: Record<string, unknown> | null };

export type OnUserStreamRemovedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type OnUserStreamRemovedSubscription = { __typename?: 'Subscription', userStreamRemoved?: Record<string, unknown> | null };

export type OnStreamUpdatedSubscriptionVariables = Exact<{
  streamId: Scalars['String']['input'];
}>;


export type OnStreamUpdatedSubscription = { __typename?: 'Subscription', streamUpdated?: Record<string, unknown> | null };

export type OnUserProjectVersionsUpdatedSubscriptionVariables = Exact<{
  projectId: Scalars['String']['input'];
}>;


export type OnUserProjectVersionsUpdatedSubscription = { __typename?: 'Subscription', projectVersionsUpdated: { __typename?: 'ProjectVersionsUpdatedMessage', id: string, type: ProjectVersionsUpdatedMessageType, modelId: string, version?: { __typename?: 'Version', id: string, message?: string | null } | null } };

export type OnUserStreamCommitCreatedSubscriptionVariables = Exact<{
  streamId: Scalars['String']['input'];
}>;


export type OnUserStreamCommitCreatedSubscription = { __typename?: 'Subscription', commitCreated?: Record<string, unknown> | null };

export type OnUserStreamCommitDeletedSubscriptionVariables = Exact<{
  streamId: Scalars['String']['input'];
}>;


export type OnUserStreamCommitDeletedSubscription = { __typename?: 'Subscription', commitDeleted?: Record<string, unknown> | null };

export type OnUserStreamCommitUpdatedSubscriptionVariables = Exact<{
  streamId: Scalars['String']['input'];
  commitId?: InputMaybe<Scalars['String']['input']>;
}>;


export type OnUserStreamCommitUpdatedSubscription = { __typename?: 'Subscription', commitUpdated?: Record<string, unknown> | null };

export type OnProjectModelsUpdatedSubscriptionVariables = Exact<{
  projectId: Scalars['String']['input'];
  modelIds?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
}>;


export type OnProjectModelsUpdatedSubscription = { __typename?: 'Subscription', projectModelsUpdated: { __typename?: 'ProjectModelsUpdatedMessage', id: string, type: ProjectModelsUpdatedMessageType, model?: { __typename?: 'Model', id: string, name: string } | null } };

export type OnBranchCreatedSubscriptionVariables = Exact<{
  streamId: Scalars['String']['input'];
}>;


export type OnBranchCreatedSubscription = { __typename?: 'Subscription', branchCreated?: Record<string, unknown> | null };

export type OnBranchUpdatedSubscriptionVariables = Exact<{
  streamId: Scalars['String']['input'];
  branchId?: InputMaybe<Scalars['String']['input']>;
}>;


export type OnBranchUpdatedSubscription = { __typename?: 'Subscription', branchUpdated?: Record<string, unknown> | null };

export type OnBranchDeletedSubscriptionVariables = Exact<{
  streamId: Scalars['String']['input'];
}>;


export type OnBranchDeletedSubscription = { __typename?: 'Subscription', branchDeleted?: Record<string, unknown> | null };

export type UsersRetrievalQueryVariables = Exact<{
  input: UsersRetrievalInput;
}>;


export type UsersRetrievalQuery = { __typename?: 'Query', users: { __typename?: 'UserSearchResultCollection', cursor?: string | null, items: Array<{ __typename?: 'LimitedUser', id: string, name: string }> } };

export type ActiveUserProjectsQueryVariables = Exact<{
  filter: UserProjectsFilter;
  sortBy?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
}>;


export type ActiveUserProjectsQuery = { __typename?: 'Query', activeUser?: { __typename?: 'User', projects: { __typename?: 'UserProjectCollection', cursor?: string | null, items: Array<{ __typename?: 'Project', id: string, name: string }> } } | null };

export type VerifyUserEmailMutationVariables = Exact<{
  input: VerifyUserEmailInput;
}>;


export type VerifyUserEmailMutation = { __typename?: 'Mutation', activeUserMutations: { __typename?: 'ActiveUserMutations', emailMutations: { __typename?: 'UserEmailMutations', verify?: boolean | null } } };

export type GetProjectWithVersionsQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type GetProjectWithVersionsQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, name: string, workspaceId?: string | null, versions: { __typename?: 'VersionCollection', items: Array<{ __typename?: 'Version', id: string, referencedObject?: string | null }> } } };

export type GetProjectWithModelVersionsQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type GetProjectWithModelVersionsQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, name: string, workspaceId?: string | null, models: { __typename?: 'ModelCollection', items: Array<{ __typename?: 'Model', versions: { __typename?: 'VersionCollection', items: Array<{ __typename?: 'Version', id: string, referencedObject?: string | null }> } }> } } };

export type GetNewWorkspaceExplainerDismissedQueryVariables = Exact<{ [key: string]: never; }>;


export type GetNewWorkspaceExplainerDismissedQuery = { __typename?: 'Query', activeUser?: { __typename?: 'User', meta: { __typename?: 'UserMeta', newWorkspaceExplainerDismissed: boolean } } | null };

export type SetNewWorkspaceExplainerDismissedMutationVariables = Exact<{
  input: Scalars['Boolean']['input'];
}>;


export type SetNewWorkspaceExplainerDismissedMutation = { __typename?: 'Mutation', activeUserMutations: { __typename?: 'ActiveUserMutations', meta: { __typename?: 'UserMetaMutations', setNewWorkspaceExplainerDismissed: boolean } } };

export type GetSpeckleConBannerDismissedQueryVariables = Exact<{ [key: string]: never; }>;


export type GetSpeckleConBannerDismissedQuery = { __typename?: 'Query', activeUser?: { __typename?: 'User', meta: { __typename?: 'UserMeta', speckleConBannerDismissed: boolean } } | null };

export type SetSpeckleConBannerDismissedMutationVariables = Exact<{
  input: Scalars['Boolean']['input'];
}>;


export type SetSpeckleConBannerDismissedMutation = { __typename?: 'Mutation', activeUserMutations: { __typename?: 'ActiveUserMutations', meta: { __typename?: 'UserMetaMutations', setSpeckleConBannerDismissed: boolean } } };

export type GetLegacyProjectsExplainerCollapsedQueryVariables = Exact<{ [key: string]: never; }>;


export type GetLegacyProjectsExplainerCollapsedQuery = { __typename?: 'Query', activeUser?: { __typename?: 'User', meta: { __typename?: 'UserMeta', legacyProjectsExplainerCollapsed: boolean } } | null };

export type SetLegacyProjectsExplainerCollapsedMutationVariables = Exact<{
  input: Scalars['Boolean']['input'];
}>;


export type SetLegacyProjectsExplainerCollapsedMutation = { __typename?: 'Mutation', activeUserMutations: { __typename?: 'ActiveUserMutations', meta: { __typename?: 'UserMetaMutations', setLegacyProjectsExplainerCollapsed: boolean } } };

export type LimitedPersonalProjectCommentFragment = { __typename?: 'Comment', id: string, rawText?: string | null, createdAt: string, text?: { __typename?: 'SmartTextEditorValue', doc?: Record<string, unknown> | null, type: string } | null };

export type LimitedPersonalProjectVersionFragment = { __typename?: 'Version', id: string, createdAt: string, message?: string | null, referencedObject?: string | null, commentThreads: { __typename?: 'CommentCollection', totalCount: number, items: Array<{ __typename?: 'Comment', id: string, rawText?: string | null, createdAt: string, text?: { __typename?: 'SmartTextEditorValue', doc?: Record<string, unknown> | null, type: string } | null }> } };

export type GetLimitedPersonalProjectVersionsQueryVariables = Exact<{
  projectId: Scalars['String']['input'];
}>;


export type GetLimitedPersonalProjectVersionsQuery = { __typename?: 'Query', project: { __typename?: 'Project', versions: { __typename?: 'VersionCollection', totalCount: number, items: Array<{ __typename?: 'Version', id: string, createdAt: string, message?: string | null, referencedObject?: string | null, commentThreads: { __typename?: 'CommentCollection', totalCount: number, items: Array<{ __typename?: 'Comment', id: string, rawText?: string | null, createdAt: string, text?: { __typename?: 'SmartTextEditorValue', doc?: Record<string, unknown> | null, type: string } | null }> } }> } } };

export type GetLimitedPersonalProjectVersionQueryVariables = Exact<{
  projectId: Scalars['String']['input'];
  versionId: Scalars['String']['input'];
}>;


export type GetLimitedPersonalProjectVersionQuery = { __typename?: 'Query', project: { __typename?: 'Project', version: { __typename?: 'Version', id: string, createdAt: string, message?: string | null, referencedObject?: string | null, commentThreads: { __typename?: 'CommentCollection', totalCount: number, items: Array<{ __typename?: 'Comment', id: string, rawText?: string | null, createdAt: string, text?: { __typename?: 'SmartTextEditorValue', doc?: Record<string, unknown> | null, type: string } | null }> } } } };

export type LimitedPersonalStreamCommitFragment = { __typename?: 'Commit', id: string, message?: string | null, referencedObject: string, createdAt?: string | null };

export type GetLimitedPersonalStreamCommitsQueryVariables = Exact<{
  streamId: Scalars['String']['input'];
}>;


export type GetLimitedPersonalStreamCommitsQuery = { __typename?: 'Query', stream?: { __typename?: 'Stream', commits?: { __typename?: 'CommitCollection', totalCount: number, items?: Array<{ __typename?: 'Commit', id: string, message?: string | null, referencedObject: string, createdAt?: string | null }> | null } | null } | null };

export type GetLimitedPersonalProjectCommentsQueryVariables = Exact<{
  projectId: Scalars['String']['input'];
}>;


export type GetLimitedPersonalProjectCommentsQuery = { __typename?: 'Query', project: { __typename?: 'Project', commentThreads: { __typename?: 'ProjectCommentCollection', totalCount: number, items: Array<{ __typename?: 'Comment', id: string, rawText?: string | null, createdAt: string, text?: { __typename?: 'SmartTextEditorValue', doc?: Record<string, unknown> | null, type: string } | null }> } } };

export type GetLimitedPersonalProjectCommentQueryVariables = Exact<{
  projectId: Scalars['String']['input'];
  commentId: Scalars['String']['input'];
}>;


export type GetLimitedPersonalProjectCommentQuery = { __typename?: 'Query', project: { __typename?: 'Project', comment?: { __typename?: 'Comment', id: string, rawText?: string | null, createdAt: string, text?: { __typename?: 'SmartTextEditorValue', doc?: Record<string, unknown> | null, type: string } | null } | null } };

export type BasicWorkspaceFragment = { __typename?: 'Workspace', id: string, name: string, slug: string, updatedAt: string, createdAt: string, role?: string | null, readOnly: boolean };

export type BasicPendingWorkspaceCollaboratorFragment = { __typename?: 'PendingWorkspaceCollaborator', id: string, inviteId: string, workspaceId: string, workspaceName: string, title: string, role: string, token?: string | null, invitedBy: { __typename?: 'LimitedUser', id: string, name: string }, user?: { __typename?: 'LimitedUser', id: string, name: string } | null };

export type WorkspaceProjectsFragment = { __typename?: 'ProjectCollection', cursor?: string | null, totalCount: number, items: Array<{ __typename?: 'Project', id: string }> };

export type CreateWorkspaceInviteMutationVariables = Exact<{
  workspaceId: Scalars['String']['input'];
  input: WorkspaceInviteCreateInput;
}>;


export type CreateWorkspaceInviteMutation = { __typename?: 'Mutation', workspaceMutations: { __typename?: 'WorkspaceMutations', invites: { __typename?: 'WorkspaceInviteMutations', create: { __typename?: 'Workspace', id: string, name: string, slug: string, updatedAt: string, createdAt: string, role?: string | null, readOnly: boolean, invitedTeam?: Array<{ __typename?: 'PendingWorkspaceCollaborator', id: string, inviteId: string, workspaceId: string, workspaceName: string, title: string, role: string, token?: string | null, invitedBy: { __typename?: 'LimitedUser', id: string, name: string }, user?: { __typename?: 'LimitedUser', id: string, name: string } | null }> | null } } } };

export type BatchCreateWorkspaceInvitesMutationVariables = Exact<{
  workspaceId: Scalars['String']['input'];
  input: Array<WorkspaceInviteCreateInput> | WorkspaceInviteCreateInput;
}>;


export type BatchCreateWorkspaceInvitesMutation = { __typename?: 'Mutation', workspaceMutations: { __typename?: 'WorkspaceMutations', invites: { __typename?: 'WorkspaceInviteMutations', batchCreate: { __typename?: 'Workspace', id: string, name: string, slug: string, updatedAt: string, createdAt: string, role?: string | null, readOnly: boolean, invitedTeam?: Array<{ __typename?: 'PendingWorkspaceCollaborator', id: string, inviteId: string, workspaceId: string, workspaceName: string, title: string, role: string, token?: string | null, invitedBy: { __typename?: 'LimitedUser', id: string, name: string }, user?: { __typename?: 'LimitedUser', id: string, name: string } | null }> | null } } } };

export type GetWorkspaceWithTeamQueryVariables = Exact<{
  workspaceId: Scalars['String']['input'];
}>;


export type GetWorkspaceWithTeamQuery = { __typename?: 'Query', workspace: { __typename?: 'Workspace', id: string, name: string, slug: string, updatedAt: string, createdAt: string, role?: string | null, readOnly: boolean, invitedTeam?: Array<{ __typename?: 'PendingWorkspaceCollaborator', id: string, inviteId: string, workspaceId: string, workspaceName: string, title: string, role: string, token?: string | null, invitedBy: { __typename?: 'LimitedUser', id: string, name: string }, user?: { __typename?: 'LimitedUser', id: string, name: string } | null }> | null } };

export type GetWorkspaceWithProjectsQueryVariables = Exact<{
  workspaceId: Scalars['String']['input'];
}>;


export type GetWorkspaceWithProjectsQuery = { __typename?: 'Query', workspace: { __typename?: 'Workspace', id: string, name: string, slug: string, updatedAt: string, createdAt: string, role?: string | null, readOnly: boolean, projects: { __typename?: 'ProjectCollection', cursor?: string | null, totalCount: number, items: Array<{ __typename?: 'Project', id: string }> } } };

export type CancelWorkspaceInviteMutationVariables = Exact<{
  workspaceId: Scalars['String']['input'];
  inviteId: Scalars['String']['input'];
}>;


export type CancelWorkspaceInviteMutation = { __typename?: 'Mutation', workspaceMutations: { __typename?: 'WorkspaceMutations', invites: { __typename?: 'WorkspaceInviteMutations', cancel: { __typename?: 'Workspace', id: string, name: string, slug: string, updatedAt: string, createdAt: string, role?: string | null, readOnly: boolean, invitedTeam?: Array<{ __typename?: 'PendingWorkspaceCollaborator', id: string, inviteId: string, workspaceId: string, workspaceName: string, title: string, role: string, token?: string | null, invitedBy: { __typename?: 'LimitedUser', id: string, name: string }, user?: { __typename?: 'LimitedUser', id: string, name: string } | null }> | null } } } };

export type UseWorkspaceInviteMutationVariables = Exact<{
  input: WorkspaceInviteUseInput;
}>;


export type UseWorkspaceInviteMutation = { __typename?: 'Mutation', workspaceMutations: { __typename?: 'WorkspaceMutations', invites: { __typename?: 'WorkspaceInviteMutations', use: boolean } } };

export type GetWorkspaceInviteQueryVariables = Exact<{
  workspaceId: Scalars['String']['input'];
  token?: InputMaybe<Scalars['String']['input']>;
  options?: InputMaybe<WorkspaceInviteLookupOptions>;
}>;


export type GetWorkspaceInviteQuery = { __typename?: 'Query', workspaceInvite?: { __typename?: 'PendingWorkspaceCollaborator', id: string, inviteId: string, workspaceId: string, workspaceName: string, title: string, role: string, token?: string | null, invitedBy: { __typename?: 'LimitedUser', id: string, name: string }, user?: { __typename?: 'LimitedUser', id: string, name: string } | null } | null };

export type GetMyWorkspaceInvitesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMyWorkspaceInvitesQuery = { __typename?: 'Query', activeUser?: { __typename?: 'User', workspaceInvites: Array<{ __typename?: 'PendingWorkspaceCollaborator', id: string, inviteId: string, workspaceId: string, workspaceName: string, title: string, role: string, token?: string | null, invitedBy: { __typename?: 'LimitedUser', id: string, name: string }, user?: { __typename?: 'LimitedUser', id: string, name: string } | null }> } | null };

export type UseWorkspaceProjectInviteMutationVariables = Exact<{
  input: ProjectInviteUseInput;
}>;


export type UseWorkspaceProjectInviteMutation = { __typename?: 'Mutation', projectMutations: { __typename?: 'ProjectMutations', invites: { __typename?: 'ProjectInviteMutations', use: boolean } } };

export type CreateWorkspaceProjectInviteMutationVariables = Exact<{
  projectId: Scalars['ID']['input'];
  inputs: Array<WorkspaceProjectInviteCreateInput> | WorkspaceProjectInviteCreateInput;
}>;


export type CreateWorkspaceProjectInviteMutation = { __typename?: 'Mutation', projectMutations: { __typename?: 'ProjectMutations', invites: { __typename?: 'ProjectInviteMutations', createForWorkspace: { __typename?: 'Project', id: string } } } };

export type ResendWorkspaceInviteMutationVariables = Exact<{
  input: WorkspaceInviteResendInput;
}>;


export type ResendWorkspaceInviteMutation = { __typename?: 'Mutation', workspaceMutations: { __typename?: 'WorkspaceMutations', invites: { __typename?: 'WorkspaceInviteMutations', resend: boolean } } };

export type AddWorkspaceDomainMutationVariables = Exact<{
  input: AddDomainToWorkspaceInput;
}>;


export type AddWorkspaceDomainMutation = { __typename?: 'Mutation', workspaceMutations: { __typename?: 'WorkspaceMutations', addDomain: { __typename?: 'Workspace', id: string, domains?: Array<{ __typename?: 'WorkspaceDomain', id: string }> | null } } };

export type DeleteWorkspaceDomainMutationVariables = Exact<{
  input: WorkspaceDomainDeleteInput;
}>;


export type DeleteWorkspaceDomainMutation = { __typename?: 'Mutation', workspaceMutations: { __typename?: 'WorkspaceMutations', deleteDomain: { __typename?: 'Workspace', id: string, domainBasedMembershipProtectionEnabled: boolean, discoverabilityEnabled: boolean, domains?: Array<{ __typename?: 'WorkspaceDomain', id: string }> | null } } };

export type GetAvailableRegionsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAvailableRegionsQuery = { __typename?: 'Query', serverInfo: { __typename?: 'ServerInfo', multiRegion: { __typename?: 'ServerMultiRegionConfiguration', regions: Array<{ __typename?: 'ServerRegionItem', id: string, key: string, name: string }> } } };

export type GetWorkspaceDefaultRegionQueryVariables = Exact<{
  workspaceId: Scalars['String']['input'];
}>;


export type GetWorkspaceDefaultRegionQuery = { __typename?: 'Query', workspace: { __typename?: 'Workspace', id: string, defaultRegion?: { __typename?: 'ServerRegionItem', id: string, key: string, name: string } | null } };

export type SetWorkspaceDefaultRegionMutationVariables = Exact<{
  workspaceId: Scalars['String']['input'];
  regionKey: Scalars['String']['input'];
}>;


export type SetWorkspaceDefaultRegionMutation = { __typename?: 'Mutation', workspaceMutations: { __typename?: 'WorkspaceMutations', setDefaultRegion: { __typename?: 'Workspace', id: string, defaultRegion?: { __typename?: 'ServerRegionItem', id: string, key: string, name: string } | null } } };

export type OnWorkspaceProjectsUpdatedSubscriptionVariables = Exact<{
  workspaceId?: InputMaybe<Scalars['String']['input']>;
  workspaceSlug?: InputMaybe<Scalars['String']['input']>;
}>;


export type OnWorkspaceProjectsUpdatedSubscription = { __typename?: 'Subscription', workspaceProjectsUpdated: { __typename?: 'WorkspaceProjectsUpdatedMessage', type: WorkspaceProjectsUpdatedMessageType, projectId: string, workspaceId: string, project?: { __typename?: 'Project', id: string, name: string } | null } };

export type OnWorkspaceUpdatedSubscriptionVariables = Exact<{
  workspaceId?: InputMaybe<Scalars['String']['input']>;
  workspaceSlug?: InputMaybe<Scalars['String']['input']>;
}>;


export type OnWorkspaceUpdatedSubscription = { __typename?: 'Subscription', workspaceUpdated: { __typename?: 'WorkspaceUpdatedMessage', id: string, workspace: { __typename?: 'Workspace', id: string, name: string, slug: string, updatedAt: string, createdAt: string, role?: string | null, readOnly: boolean, team: { __typename?: 'WorkspaceCollaboratorCollection', totalCount: number, items: Array<{ __typename?: 'WorkspaceCollaborator', id: string, role: string, user: { __typename?: 'LimitedUser', id: string, name: string } }> }, invitedTeam?: Array<{ __typename?: 'PendingWorkspaceCollaborator', id: string, inviteId: string, workspaceId: string, workspaceName: string, title: string, role: string, token?: string | null, invitedBy: { __typename?: 'LimitedUser', id: string, name: string }, user?: { __typename?: 'LimitedUser', id: string, name: string } | null }> | null } } };

export type DismissWorkspaceMutationVariables = Exact<{
  input: WorkspaceDismissInput;
}>;


export type DismissWorkspaceMutation = { __typename?: 'Mutation', workspaceMutations: { __typename?: 'WorkspaceMutations', dismiss: boolean } };

export type RequestToJoinWorkspaceMutationVariables = Exact<{
  input: WorkspaceRequestToJoinInput;
}>;


export type RequestToJoinWorkspaceMutation = { __typename?: 'Mutation', workspaceMutations: { __typename?: 'WorkspaceMutations', requestToJoin: boolean } };

export type GetWorkspaceWithJoinRequestsQueryVariables = Exact<{
  workspaceId: Scalars['String']['input'];
  filter?: InputMaybe<AdminWorkspaceJoinRequestFilter>;
  cursor?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetWorkspaceWithJoinRequestsQuery = { __typename?: 'Query', workspace: { __typename?: 'Workspace', id: string, name: string, slug: string, updatedAt: string, createdAt: string, role?: string | null, readOnly: boolean, adminWorkspacesJoinRequests?: { __typename?: 'WorkspaceJoinRequestCollection', cursor?: string | null, totalCount: number, items: Array<{ __typename?: 'WorkspaceJoinRequest', status: WorkspaceJoinRequestStatus, createdAt: string, user: { __typename?: 'LimitedUser', id: string, name: string }, workspace: { __typename?: 'Workspace', id: string, name: string } }> } | null } };

export type GetWorkspaceWithSubscriptionQueryVariables = Exact<{
  workspaceId: Scalars['String']['input'];
}>;


export type GetWorkspaceWithSubscriptionQuery = { __typename?: 'Query', workspace: { __typename?: 'Workspace', id: string, name: string, slug: string, updatedAt: string, createdAt: string, role?: string | null, readOnly: boolean, subscription?: { __typename?: 'WorkspaceSubscription', createdAt: string, updatedAt: string, currentBillingCycleEnd: string, billingInterval: BillingInterval, seats: { __typename?: 'WorkspaceSubscriptionSeats', editors: { __typename?: 'WorkspaceSubscriptionSeatCount', available: number, assigned: number }, viewers: { __typename?: 'WorkspaceSubscriptionSeatCount', assigned: number } } } | null } };

export type GetWorkspacePlanUsageQueryVariables = Exact<{
  workspaceId: Scalars['String']['input'];
}>;


export type GetWorkspacePlanUsageQuery = { __typename?: 'Query', workspace: { __typename?: 'Workspace', id: string, name: string, slug: string, updatedAt: string, createdAt: string, role?: string | null, readOnly: boolean, plan?: { __typename?: 'WorkspacePlan', usage: { __typename?: 'WorkspacePlanUsage', projectCount: number, modelCount: number } } | null } };

export type GetWorkspaceWithMembersByRoleQueryVariables = Exact<{
  workspaceId: Scalars['String']['input'];
}>;


export type GetWorkspaceWithMembersByRoleQuery = { __typename?: 'Query', workspace: { __typename?: 'Workspace', id: string, name: string, slug: string, updatedAt: string, createdAt: string, role?: string | null, readOnly: boolean, teamByRole: { __typename?: 'WorkspaceTeamByRole', admins?: { __typename?: 'WorkspaceRoleCollection', totalCount: number } | null, members?: { __typename?: 'WorkspaceRoleCollection', totalCount: number } | null, guests?: { __typename?: 'WorkspaceRoleCollection', totalCount: number } | null } } };

export type UpdateWorkspaceProjectRoleMutationVariables = Exact<{
  input: ProjectUpdateRoleInput;
}>;


export type UpdateWorkspaceProjectRoleMutation = { __typename?: 'Mutation', workspaceMutations: { __typename?: 'WorkspaceMutations', projects: { __typename?: 'WorkspaceProjectMutations', updateRole: { __typename?: 'Project', id: string, name: string, description?: string | null, visibility: ProjectVisibility, allowPublicComments: boolean, role?: string | null, createdAt: string, updatedAt: string } } } };

export type UpdateWorkspaceSeatTypeMutationVariables = Exact<{
  input: WorkspaceUpdateSeatTypeInput;
}>;


export type UpdateWorkspaceSeatTypeMutation = { __typename?: 'Mutation', workspaceMutations: { __typename?: 'WorkspaceMutations', updateSeatType: { __typename?: 'Workspace', id: string, team: { __typename?: 'WorkspaceCollaboratorCollection', items: Array<{ __typename?: 'WorkspaceCollaborator', id: string, role: string, seatType?: WorkspaceSeatType | null }> } } } };

export type GetProjectInvitableCollaboratorsQueryVariables = Exact<{
  projectId: Scalars['String']['input'];
  search?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetProjectInvitableCollaboratorsQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, name: string, invitableCollaborators: { __typename?: 'WorkspaceCollaboratorCollection', totalCount: number, items: Array<{ __typename?: 'WorkspaceCollaborator', id: string, user: { __typename?: 'LimitedUser', name: string } }> } } };

export type FullPermissionCheckResultFragment = { __typename?: 'PermissionCheckResult', authorized: boolean, code: string, message: string, payload?: Record<string, unknown> | null };

export type ProjectImplicitRoleCheckFragment = { __typename?: 'Project', id: string, role?: string | null, permissions: { __typename?: 'ProjectPermissionChecks', canRead: { __typename?: 'PermissionCheckResult', authorized: boolean, code: string, message: string, payload?: Record<string, unknown> | null }, canReadSettings: { __typename?: 'PermissionCheckResult', authorized: boolean, code: string, message: string, payload?: Record<string, unknown> | null }, canReadWebhooks: { __typename?: 'PermissionCheckResult', authorized: boolean, code: string, message: string, payload?: Record<string, unknown> | null }, canCreateModel: { __typename?: 'PermissionCheckResult', authorized: boolean, code: string, message: string, payload?: Record<string, unknown> | null } } };

export type GetUserWorkspaceAccessQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type GetUserWorkspaceAccessQuery = { __typename?: 'Query', workspace: { __typename?: 'Workspace', id: string, role?: string | null, seatType?: WorkspaceSeatType | null } };

export type GetUserWorkspaceProjectsWithAccessChecksQueryVariables = Exact<{
  id: Scalars['String']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  cursor?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<WorkspaceProjectsFilter>;
}>;


export type GetUserWorkspaceProjectsWithAccessChecksQuery = { __typename?: 'Query', workspace: { __typename?: 'Workspace', role?: string | null, seatType?: WorkspaceSeatType | null, id: string, name: string, slug: string, updatedAt: string, createdAt: string, readOnly: boolean, projects: { __typename?: 'ProjectCollection', cursor?: string | null, totalCount: number, items: Array<{ __typename?: 'Project', id: string, role?: string | null, permissions: { __typename?: 'ProjectPermissionChecks', canRead: { __typename?: 'PermissionCheckResult', authorized: boolean, code: string, message: string, payload?: Record<string, unknown> | null }, canReadSettings: { __typename?: 'PermissionCheckResult', authorized: boolean, code: string, message: string, payload?: Record<string, unknown> | null }, canReadWebhooks: { __typename?: 'PermissionCheckResult', authorized: boolean, code: string, message: string, payload?: Record<string, unknown> | null }, canCreateModel: { __typename?: 'PermissionCheckResult', authorized: boolean, code: string, message: string, payload?: Record<string, unknown> | null } } }> } } };

export type GetUserProjectsWithAccessChecksQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
  cursor?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<UserProjectsFilter>;
}>;


export type GetUserProjectsWithAccessChecksQuery = { __typename?: 'Query', activeUser?: { __typename?: 'User', id: string, projects: { __typename?: 'UserProjectCollection', cursor?: string | null, totalCount: number, items: Array<{ __typename?: 'Project', id: string, role?: string | null, permissions: { __typename?: 'ProjectPermissionChecks', canRead: { __typename?: 'PermissionCheckResult', authorized: boolean, code: string, message: string, payload?: Record<string, unknown> | null }, canReadSettings: { __typename?: 'PermissionCheckResult', authorized: boolean, code: string, message: string, payload?: Record<string, unknown> | null }, canReadWebhooks: { __typename?: 'PermissionCheckResult', authorized: boolean, code: string, message: string, payload?: Record<string, unknown> | null }, canCreateModel: { __typename?: 'PermissionCheckResult', authorized: boolean, code: string, message: string, payload?: Record<string, unknown> | null } } }> } } | null };

export type BasicStreamAccessRequestFieldsFragment = { __typename?: 'StreamAccessRequest', id: string, requesterId: string, streamId: string, createdAt: string, requester: { __typename?: 'LimitedUser', id: string, name: string } };

export type CreateStreamAccessRequestMutationVariables = Exact<{
  streamId: Scalars['String']['input'];
}>;


export type CreateStreamAccessRequestMutation = { __typename?: 'Mutation', streamAccessRequestCreate: { __typename?: 'StreamAccessRequest', id: string, requesterId: string, streamId: string, createdAt: string, requester: { __typename?: 'LimitedUser', id: string, name: string } } };

export type GetStreamAccessRequestQueryVariables = Exact<{
  streamId: Scalars['String']['input'];
}>;


export type GetStreamAccessRequestQuery = { __typename?: 'Query', streamAccessRequest?: { __typename?: 'StreamAccessRequest', id: string, requesterId: string, streamId: string, createdAt: string, requester: { __typename?: 'LimitedUser', id: string, name: string } } | null };

export type GetFullStreamAccessRequestQueryVariables = Exact<{
  streamId: Scalars['String']['input'];
}>;


export type GetFullStreamAccessRequestQuery = { __typename?: 'Query', streamAccessRequest?: { __typename?: 'StreamAccessRequest', id: string, requesterId: string, streamId: string, createdAt: string, stream: { __typename?: 'Stream', id: string, name: string }, requester: { __typename?: 'LimitedUser', id: string, name: string } } | null };

export type GetPendingStreamAccessRequestsQueryVariables = Exact<{
  streamId: Scalars['String']['input'];
}>;


export type GetPendingStreamAccessRequestsQuery = { __typename?: 'Query', stream?: { __typename?: 'Stream', id: string, name: string, pendingAccessRequests?: Array<{ __typename?: 'StreamAccessRequest', id: string, requesterId: string, streamId: string, createdAt: string, stream: { __typename?: 'Stream', id: string, name: string }, requester: { __typename?: 'LimitedUser', id: string, name: string } }> | null } | null };

export type UseStreamAccessRequestMutationVariables = Exact<{
  requestId: Scalars['String']['input'];
  accept: Scalars['Boolean']['input'];
  role?: StreamRole;
}>;


export type UseStreamAccessRequestMutation = { __typename?: 'Mutation', streamAccessRequestUse: boolean };

export type CreateTokenMutationVariables = Exact<{
  token: ApiTokenCreateInput;
}>;


export type CreateTokenMutation = { __typename?: 'Mutation', apiTokenCreate: string };

export type RevokeTokenMutationVariables = Exact<{
  token: Scalars['String']['input'];
}>;


export type RevokeTokenMutation = { __typename?: 'Mutation', apiTokenRevoke: boolean };

export type TokenAppInfoQueryVariables = Exact<{ [key: string]: never; }>;


export type TokenAppInfoQuery = { __typename?: 'Query', authenticatedAsApp?: { __typename?: 'ServerAppListItem', id: string, name: string } | null };

export type AppTokenCreateMutationVariables = Exact<{
  token: AppTokenCreateInput;
}>;


export type AppTokenCreateMutation = { __typename?: 'Mutation', appTokenCreate: string };

export type TestAutomateFunctionFragment = { __typename?: 'AutomateFunction', id: string, name: string, isFeatured: boolean, description: string, logo?: string | null, supportedSourceApps: Array<string>, tags: Array<string>, repo: { __typename?: 'BasicGitRepositoryMetadata', id: string, owner: string, name: string }, releases: { __typename?: 'AutomateFunctionReleaseCollection', totalCount: number, items: Array<{ __typename?: 'AutomateFunctionRelease', id: string, versionTag: string, createdAt: string, inputSchema?: Record<string, unknown> | null, commitId: string }> } };

export type TestAutomationFragment = { __typename?: 'Automation', id: string, name: string, enabled: boolean, createdAt: string, updatedAt: string, runs: { __typename?: 'AutomateRunCollection', totalCount: number, items: Array<{ __typename?: 'AutomateRun', id: string, status: AutomateRunStatus, createdAt: string, updatedAt: string, trigger: { __typename?: 'VersionCreatedTrigger', version?: { __typename?: 'Version', id: string } | null, model?: { __typename?: 'Model', id: string } | null }, functionRuns: Array<{ __typename?: 'AutomateFunctionRun', id: string, status: AutomateRunStatus, statusMessage?: string | null, contextView?: string | null, elapsed: number, results?: Record<string, unknown> | null, function?: { __typename?: 'AutomateFunction', id: string } | null }> }> }, currentRevision?: { __typename?: 'AutomationRevision', id: string, triggerDefinitions: Array<{ __typename?: 'VersionCreatedTriggerDefinition', type: AutomateRunTriggerType, model?: { __typename?: 'Model', id: string } | null }>, functions: Array<{ __typename?: 'AutomationRevisionFunction', parameters?: Record<string, unknown> | null, release: { __typename?: 'AutomateFunctionRelease', id: string, versionTag: string, createdAt: string, inputSchema?: Record<string, unknown> | null, commitId: string, function: { __typename?: 'AutomateFunction', id: string } } }> } | null };

export type GetProjectAutomationQueryVariables = Exact<{
  projectId: Scalars['String']['input'];
  automationId: Scalars['String']['input'];
}>;


export type GetProjectAutomationQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, automation: { __typename?: 'Automation', id: string, name: string, enabled: boolean, createdAt: string, updatedAt: string, runs: { __typename?: 'AutomateRunCollection', totalCount: number, items: Array<{ __typename?: 'AutomateRun', id: string, status: AutomateRunStatus, createdAt: string, updatedAt: string, trigger: { __typename?: 'VersionCreatedTrigger', version?: { __typename?: 'Version', id: string } | null, model?: { __typename?: 'Model', id: string } | null }, functionRuns: Array<{ __typename?: 'AutomateFunctionRun', id: string, status: AutomateRunStatus, statusMessage?: string | null, contextView?: string | null, elapsed: number, results?: Record<string, unknown> | null, function?: { __typename?: 'AutomateFunction', id: string } | null }> }> }, currentRevision?: { __typename?: 'AutomationRevision', id: string, triggerDefinitions: Array<{ __typename?: 'VersionCreatedTriggerDefinition', type: AutomateRunTriggerType, model?: { __typename?: 'Model', id: string } | null }>, functions: Array<{ __typename?: 'AutomationRevisionFunction', parameters?: Record<string, unknown> | null, release: { __typename?: 'AutomateFunctionRelease', id: string, versionTag: string, createdAt: string, inputSchema?: Record<string, unknown> | null, commitId: string, function: { __typename?: 'AutomateFunction', id: string } } }> } | null } } };

export type GetAutomateFunctionsQueryVariables = Exact<{
  cursor?: InputMaybe<Scalars['String']['input']>;
  limit: Scalars['Int']['input'];
  filter?: InputMaybe<AutomateFunctionsFilter>;
}>;


export type GetAutomateFunctionsQuery = { __typename?: 'Query', automateFunctions: { __typename?: 'AutomateFunctionCollection', cursor?: string | null, totalCount: number, items: Array<{ __typename?: 'AutomateFunction', id: string, name: string, isFeatured: boolean, description: string, logo?: string | null, supportedSourceApps: Array<string>, tags: Array<string>, repo: { __typename?: 'BasicGitRepositoryMetadata', id: string, owner: string, name: string }, releases: { __typename?: 'AutomateFunctionReleaseCollection', totalCount: number, items: Array<{ __typename?: 'AutomateFunctionRelease', id: string, versionTag: string, createdAt: string, inputSchema?: Record<string, unknown> | null, commitId: string }> } }> } };

export type AutomateValidateAuthCodeQueryVariables = Exact<{
  payload: AutomateAuthCodePayloadTest;
}>;


export type AutomateValidateAuthCodeQuery = { __typename?: 'Query', automateValidateAuthCode: boolean };

export type CommentWithRepliesFragment = { __typename?: 'Comment', id: string, rawText?: string | null, text?: { __typename?: 'SmartTextEditorValue', doc?: Record<string, unknown> | null, attachments?: Array<{ __typename?: 'BlobMetadata', id: string, fileName: string, streamId: string }> | null } | null, replies: { __typename?: 'CommentCollection', items: Array<{ __typename?: 'Comment', id: string, text?: { __typename?: 'SmartTextEditorValue', doc?: Record<string, unknown> | null, attachments?: Array<{ __typename?: 'BlobMetadata', id: string, fileName: string, streamId: string }> | null } | null }> } };

export type CreateCommentMutationVariables = Exact<{
  input: CommentCreateInput;
}>;


export type CreateCommentMutation = { __typename?: 'Mutation', commentCreate: string };

export type CreateReplyMutationVariables = Exact<{
  input: ReplyCreateInput;
}>;


export type CreateReplyMutation = { __typename?: 'Mutation', commentReply: string };

export type GetCommentQueryVariables = Exact<{
  id: Scalars['String']['input'];
  streamId: Scalars['String']['input'];
}>;


export type GetCommentQuery = { __typename?: 'Query', comment?: { __typename?: 'Comment', id: string, rawText?: string | null, text?: { __typename?: 'SmartTextEditorValue', doc?: Record<string, unknown> | null, attachments?: Array<{ __typename?: 'BlobMetadata', id: string, fileName: string, streamId: string }> | null } | null, replies: { __typename?: 'CommentCollection', items: Array<{ __typename?: 'Comment', id: string, text?: { __typename?: 'SmartTextEditorValue', doc?: Record<string, unknown> | null, attachments?: Array<{ __typename?: 'BlobMetadata', id: string, fileName: string, streamId: string }> | null } | null }> } } | null };

export type GetCommentsQueryVariables = Exact<{
  streamId: Scalars['String']['input'];
  cursor?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetCommentsQuery = { __typename?: 'Query', comments?: { __typename?: 'CommentCollection', totalCount: number, cursor?: string | null, items: Array<{ __typename?: 'Comment', id: string, rawText?: string | null, text?: { __typename?: 'SmartTextEditorValue', doc?: Record<string, unknown> | null, attachments?: Array<{ __typename?: 'BlobMetadata', id: string, fileName: string, streamId: string }> | null } | null, replies: { __typename?: 'CommentCollection', items: Array<{ __typename?: 'Comment', id: string, text?: { __typename?: 'SmartTextEditorValue', doc?: Record<string, unknown> | null, attachments?: Array<{ __typename?: 'BlobMetadata', id: string, fileName: string, streamId: string }> | null } | null }> } }> } | null };

export type BaseCommitFieldsFragment = { __typename?: 'Commit', id: string, authorName?: string | null, authorId?: string | null, authorAvatar?: string | null, streamId?: string | null, streamName?: string | null, sourceApplication?: string | null, message?: string | null, referencedObject: string, createdAt?: string | null, commentCount: number };

export type ReadOwnCommitsQueryVariables = Exact<{
  cursor?: InputMaybe<Scalars['String']['input']>;
  limit?: Scalars['Int']['input'];
}>;


export type ReadOwnCommitsQuery = { __typename?: 'Query', activeUser?: { __typename?: 'User', commits?: { __typename?: 'CommitCollection', totalCount: number, cursor?: string | null, items?: Array<{ __typename?: 'Commit', id: string, authorName?: string | null, authorId?: string | null, authorAvatar?: string | null, streamId?: string | null, streamName?: string | null, sourceApplication?: string | null, message?: string | null, referencedObject: string, createdAt?: string | null, commentCount: number }> | null } | null } | null };

export type ReadOtherUsersCommitsQueryVariables = Exact<{
  userId: Scalars['String']['input'];
  cursor?: InputMaybe<Scalars['String']['input']>;
  limit?: Scalars['Int']['input'];
}>;


export type ReadOtherUsersCommitsQuery = { __typename?: 'Query', otherUser?: { __typename?: 'LimitedUser', commits?: { __typename?: 'CommitCollection', totalCount: number, cursor?: string | null, items?: Array<{ __typename?: 'Commit', id: string, authorName?: string | null, authorId?: string | null, authorAvatar?: string | null, streamId?: string | null, streamName?: string | null, sourceApplication?: string | null, message?: string | null, referencedObject: string, createdAt?: string | null, commentCount: number, stream: { __typename?: 'Stream', id: string, name: string, isPublic: boolean } }> | null } | null } | null };

export type ReadStreamBranchCommitsQueryVariables = Exact<{
  streamId: Scalars['String']['input'];
  branchName: Scalars['String']['input'];
  cursor?: InputMaybe<Scalars['String']['input']>;
  limit?: Scalars['Int']['input'];
}>;


export type ReadStreamBranchCommitsQuery = { __typename?: 'Query', stream?: { __typename?: 'Stream', id: string, name: string, role?: string | null, branch?: { __typename?: 'Branch', id: string, name: string, description?: string | null, commits?: { __typename?: 'CommitCollection', totalCount: number, cursor?: string | null, items?: Array<{ __typename?: 'Commit', id: string, authorName?: string | null, authorId?: string | null, authorAvatar?: string | null, streamId?: string | null, streamName?: string | null, sourceApplication?: string | null, message?: string | null, referencedObject: string, createdAt?: string | null, commentCount: number }> | null } | null } | null } | null };

export type MoveCommitsMutationVariables = Exact<{
  input: CommitsMoveInput;
}>;


export type MoveCommitsMutation = { __typename?: 'Mutation', commitsMove: boolean };

export type DeleteCommitsMutationVariables = Exact<{
  input: CommitsDeleteInput;
}>;


export type DeleteCommitsMutation = { __typename?: 'Mutation', commitsDelete: boolean };

export type GetWorkspacePlanPricesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetWorkspacePlanPricesQuery = { __typename?: 'Query', serverInfo: { __typename?: 'ServerInfo', workspaces: { __typename?: 'ServerWorkspacesInfo', planPrices?: { __typename?: 'CurrencyBasedPrices', usd: { __typename?: 'WorkspacePaidPlanPrices', team: { __typename?: 'WorkspacePlanPrice', monthly: { __typename?: 'Price', amount: number, currency: string }, yearly: { __typename?: 'Price', amount: number, currency: string } }, teamUnlimited: { __typename?: 'WorkspacePlanPrice', monthly: { __typename?: 'Price', amount: number, currency: string }, yearly: { __typename?: 'Price', amount: number, currency: string } }, pro: { __typename?: 'WorkspacePlanPrice', monthly: { __typename?: 'Price', amount: number, currency: string }, yearly: { __typename?: 'Price', amount: number, currency: string } }, proUnlimited: { __typename?: 'WorkspacePlanPrice', monthly: { __typename?: 'Price', amount: number, currency: string }, yearly: { __typename?: 'Price', amount: number, currency: string } } }, gbp: { __typename?: 'WorkspacePaidPlanPrices', team: { __typename?: 'WorkspacePlanPrice', monthly: { __typename?: 'Price', amount: number, currency: string }, yearly: { __typename?: 'Price', amount: number, currency: string } }, teamUnlimited: { __typename?: 'WorkspacePlanPrice', monthly: { __typename?: 'Price', amount: number, currency: string }, yearly: { __typename?: 'Price', amount: number, currency: string } }, pro: { __typename?: 'WorkspacePlanPrice', monthly: { __typename?: 'Price', amount: number, currency: string }, yearly: { __typename?: 'Price', amount: number, currency: string } }, proUnlimited: { __typename?: 'WorkspacePlanPrice', monthly: { __typename?: 'Price', amount: number, currency: string }, yearly: { __typename?: 'Price', amount: number, currency: string } } } } | null } } };

export type CreateProjectModelMutationVariables = Exact<{
  input: CreateModelInput;
}>;


export type CreateProjectModelMutation = { __typename?: 'Mutation', modelMutations: { __typename?: 'ModelMutations', create: { __typename?: 'Model', id: string, name: string, description?: string | null } } };

export type FindProjectModelByNameQueryVariables = Exact<{
  projectId: Scalars['String']['input'];
  name: Scalars['String']['input'];
}>;


export type FindProjectModelByNameQuery = { __typename?: 'Query', project: { __typename?: 'Project', modelByName: { __typename?: 'Model', id: string, name: string, description?: string | null } } };

export type MainRegionMetadataFragment = { __typename?: 'ServerRegionItem', id: string, key: string, name: string, description?: string | null };

export type GetAvailableRegionKeysQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAvailableRegionKeysQuery = { __typename?: 'Query', serverInfo: { __typename?: 'ServerInfo', multiRegion: { __typename?: 'ServerMultiRegionConfiguration', availableKeys: Array<string> } } };

export type CreateNewRegionMutationVariables = Exact<{
  input: CreateServerRegionInput;
}>;


export type CreateNewRegionMutation = { __typename?: 'Mutation', serverInfoMutations: { __typename?: 'ServerInfoMutations', multiRegion: { __typename?: 'ServerRegionMutations', create: { __typename?: 'ServerRegionItem', id: string, key: string, name: string, description?: string | null } } } };

export type GetRegionsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetRegionsQuery = { __typename?: 'Query', serverInfo: { __typename?: 'ServerInfo', multiRegion: { __typename?: 'ServerMultiRegionConfiguration', regions: Array<{ __typename?: 'ServerRegionItem', id: string, key: string, name: string, description?: string | null }> } } };

export type UpdateRegionMutationVariables = Exact<{
  input: UpdateServerRegionInput;
}>;


export type UpdateRegionMutation = { __typename?: 'Mutation', serverInfoMutations: { __typename?: 'ServerInfoMutations', multiRegion: { __typename?: 'ServerRegionMutations', update: { __typename?: 'ServerRegionItem', id: string, key: string, name: string, description?: string | null } } } };

export type UpdateProjectRegionMutationVariables = Exact<{
  projectId: Scalars['String']['input'];
  regionKey: Scalars['String']['input'];
}>;


export type UpdateProjectRegionMutation = { __typename?: 'Mutation', workspaceMutations: { __typename?: 'WorkspaceMutations', projects: { __typename?: 'WorkspaceProjectMutations', moveToRegion: string } } };

export type GetRegionalProjectModelQueryVariables = Exact<{
  projectId: Scalars['String']['input'];
  modelId: Scalars['String']['input'];
}>;


export type GetRegionalProjectModelQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, model: { __typename?: 'Model', id: string, name: string } } };

export type GetRegionalProjectVersionQueryVariables = Exact<{
  projectId: Scalars['String']['input'];
  modelId: Scalars['String']['input'];
  versionId: Scalars['String']['input'];
}>;


export type GetRegionalProjectVersionQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, model: { __typename?: 'Model', id: string, version: { __typename?: 'Version', id: string, referencedObject?: string | null } } } };

export type GetRegionalProjectObjectQueryVariables = Exact<{
  projectId: Scalars['String']['input'];
  objectId: Scalars['String']['input'];
}>;


export type GetRegionalProjectObjectQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, object?: { __typename?: 'Object', id: string } | null } };

export type GetRegionalProjectAutomationQueryVariables = Exact<{
  projectId: Scalars['String']['input'];
  automationId: Scalars['String']['input'];
}>;


export type GetRegionalProjectAutomationQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, automation: { __typename?: 'Automation', id: string, runs: { __typename?: 'AutomateRunCollection', items: Array<{ __typename?: 'AutomateRun', id: string, functionRuns: Array<{ __typename?: 'AutomateFunctionRun', id: string, status: AutomateRunStatus }> }> } } } };

export type GetRegionalProjectCommentQueryVariables = Exact<{
  projectId: Scalars['String']['input'];
  commentId: Scalars['String']['input'];
}>;


export type GetRegionalProjectCommentQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, comment?: { __typename?: 'Comment', id: string } | null } };

export type GetRegionalProjectWebhookQueryVariables = Exact<{
  projectId: Scalars['String']['input'];
  webhookId: Scalars['String']['input'];
}>;


export type GetRegionalProjectWebhookQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, webhooks: { __typename?: 'WebhookCollection', items: Array<{ __typename?: 'Webhook', id: string }> } } };

export type GetRegionalProjectBlobQueryVariables = Exact<{
  projectId: Scalars['String']['input'];
  blobId: Scalars['String']['input'];
}>;


export type GetRegionalProjectBlobQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, blob?: { __typename?: 'BlobMetadata', id: string, fileName: string } | null } };

export type BasicProjectAccessRequestFieldsFragment = { __typename?: 'ProjectAccessRequest', id: string, requesterId: string, projectId: string, createdAt: string, requester: { __typename?: 'LimitedUser', id: string, name: string } };

export type CreateProjectAccessRequestMutationVariables = Exact<{
  projectId: Scalars['String']['input'];
}>;


export type CreateProjectAccessRequestMutation = { __typename?: 'Mutation', projectMutations: { __typename?: 'ProjectMutations', accessRequestMutations: { __typename?: 'ProjectAccessRequestMutations', create: { __typename?: 'ProjectAccessRequest', id: string, requesterId: string, projectId: string, createdAt: string, requester: { __typename?: 'LimitedUser', id: string, name: string } } } } };

export type GetActiveUserProjectAccessRequestQueryVariables = Exact<{
  projectId: Scalars['String']['input'];
}>;


export type GetActiveUserProjectAccessRequestQuery = { __typename?: 'Query', activeUser?: { __typename?: 'User', projectAccessRequest?: { __typename?: 'ProjectAccessRequest', id: string, requesterId: string, projectId: string, createdAt: string, requester: { __typename?: 'LimitedUser', id: string, name: string } } | null } | null };

export type GetActiveUserFullProjectAccessRequestQueryVariables = Exact<{
  projectId: Scalars['String']['input'];
}>;


export type GetActiveUserFullProjectAccessRequestQuery = { __typename?: 'Query', activeUser?: { __typename?: 'User', projectAccessRequest?: { __typename?: 'ProjectAccessRequest', id: string, requesterId: string, projectId: string, createdAt: string, project: { __typename?: 'Project', id: string, name: string }, requester: { __typename?: 'LimitedUser', id: string, name: string } } | null } | null };

export type GetPendingProjectAccessRequestsQueryVariables = Exact<{
  projectId: Scalars['String']['input'];
}>;


export type GetPendingProjectAccessRequestsQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, name: string, pendingAccessRequests?: Array<{ __typename?: 'ProjectAccessRequest', id: string, requesterId: string, projectId: string, createdAt: string, project: { __typename?: 'Project', id: string, name: string }, requester: { __typename?: 'LimitedUser', id: string, name: string } }> | null } };

export type UseProjectAccessRequestMutationVariables = Exact<{
  requestId: Scalars['String']['input'];
  accept: Scalars['Boolean']['input'];
  role?: StreamRole;
}>;


export type UseProjectAccessRequestMutation = { __typename?: 'Mutation', projectMutations: { __typename?: 'ProjectMutations', accessRequestMutations: { __typename?: 'ProjectAccessRequestMutations', use: { __typename?: 'Project', id: string } } } };

export type BasicProjectCommentFragment = { __typename?: 'Comment', id: string, rawText?: string | null, authorId: string, text?: { __typename?: 'SmartTextEditorValue', doc?: Record<string, unknown> | null } | null };

export type CreateProjectCommentMutationVariables = Exact<{
  input: CreateCommentInput;
}>;


export type CreateProjectCommentMutation = { __typename?: 'Mutation', commentMutations: { __typename?: 'CommentMutations', create: { __typename?: 'Comment', id: string, rawText?: string | null, authorId: string, text?: { __typename?: 'SmartTextEditorValue', doc?: Record<string, unknown> | null } | null } } };

export type CreateProjectCommentReplyMutationVariables = Exact<{
  input: CreateCommentReplyInput;
}>;


export type CreateProjectCommentReplyMutation = { __typename?: 'Mutation', commentMutations: { __typename?: 'CommentMutations', reply: { __typename?: 'Comment', id: string, rawText?: string | null, authorId: string, text?: { __typename?: 'SmartTextEditorValue', doc?: Record<string, unknown> | null } | null } } };

export type EditProjectCommentMutationVariables = Exact<{
  input: EditCommentInput;
}>;


export type EditProjectCommentMutation = { __typename?: 'Mutation', commentMutations: { __typename?: 'CommentMutations', edit: { __typename?: 'Comment', id: string, rawText?: string | null, authorId: string, text?: { __typename?: 'SmartTextEditorValue', doc?: Record<string, unknown> | null } | null } } };

export type BasicProjectFieldsFragment = { __typename?: 'Project', id: string, name: string, description?: string | null, visibility: ProjectVisibility, allowPublicComments: boolean, role?: string | null, createdAt: string, updatedAt: string };

export type AdminProjectListQueryVariables = Exact<{
  query?: InputMaybe<Scalars['String']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  visibility?: InputMaybe<Scalars['String']['input']>;
  limit?: Scalars['Int']['input'];
  cursor?: InputMaybe<Scalars['String']['input']>;
}>;


export type AdminProjectListQuery = { __typename?: 'Query', admin: { __typename?: 'AdminQueries', projectList: { __typename?: 'ProjectCollection', cursor?: string | null, totalCount: number, items: Array<{ __typename?: 'Project', id: string, name: string, description?: string | null, visibility: ProjectVisibility, allowPublicComments: boolean, role?: string | null, createdAt: string, updatedAt: string }> } } };

export type GetProjectObjectQueryVariables = Exact<{
  projectId: Scalars['String']['input'];
  objectId: Scalars['String']['input'];
}>;


export type GetProjectObjectQuery = { __typename?: 'Query', project: { __typename?: 'Project', object?: { __typename?: 'Object', id: string, createdAt?: string | null } | null } };

export type GetProjectQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type GetProjectQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, name: string, workspaceId?: string | null, role?: string | null, description?: string | null, visibility: ProjectVisibility, allowPublicComments: boolean, createdAt: string, updatedAt: string } };

export type CreateProjectMutationVariables = Exact<{
  input: ProjectCreateInput;
}>;


export type CreateProjectMutation = { __typename?: 'Mutation', projectMutations: { __typename?: 'ProjectMutations', create: { __typename?: 'Project', id: string, name: string, description?: string | null, visibility: ProjectVisibility, allowPublicComments: boolean, role?: string | null, createdAt: string, updatedAt: string } } };

export type BatchDeleteProjectsMutationVariables = Exact<{
  ids: Array<Scalars['String']['input']> | Scalars['String']['input'];
}>;


export type BatchDeleteProjectsMutation = { __typename?: 'Mutation', projectMutations: { __typename?: 'ProjectMutations', batchDelete: boolean } };

export type UpdateProjectRoleMutationVariables = Exact<{
  input: ProjectUpdateRoleInput;
}>;


export type UpdateProjectRoleMutation = { __typename?: 'Mutation', projectMutations: { __typename?: 'ProjectMutations', updateRole: { __typename?: 'Project', id: string, name: string, description?: string | null, visibility: ProjectVisibility, allowPublicComments: boolean, role?: string | null, createdAt: string, updatedAt: string } } };

export type GetProjectCollaboratorsQueryVariables = Exact<{
  projectId: Scalars['String']['input'];
}>;


export type GetProjectCollaboratorsQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, team: Array<{ __typename?: 'ProjectCollaborator', id: string, role: string }> } };

export type CreateServerInviteMutationVariables = Exact<{
  input: ServerInviteCreateInput;
}>;


export type CreateServerInviteMutation = { __typename?: 'Mutation', serverInviteCreate: boolean };

export type CreateStreamInviteMutationVariables = Exact<{
  input: StreamInviteCreateInput;
}>;


export type CreateStreamInviteMutation = { __typename?: 'Mutation', streamInviteCreate: boolean };

export type ResendInviteMutationVariables = Exact<{
  inviteId: Scalars['String']['input'];
}>;


export type ResendInviteMutation = { __typename?: 'Mutation', inviteResend: boolean };

export type BatchCreateServerInviteMutationVariables = Exact<{
  input: Array<ServerInviteCreateInput> | ServerInviteCreateInput;
}>;


export type BatchCreateServerInviteMutation = { __typename?: 'Mutation', serverInviteBatchCreate: boolean };

export type BatchCreateStreamInviteMutationVariables = Exact<{
  input: Array<StreamInviteCreateInput> | StreamInviteCreateInput;
}>;


export type BatchCreateStreamInviteMutation = { __typename?: 'Mutation', streamInviteBatchCreate: boolean };

export type DeleteInviteMutationVariables = Exact<{
  inviteId: Scalars['String']['input'];
}>;


export type DeleteInviteMutation = { __typename?: 'Mutation', inviteDelete: boolean };

export type StreamInviteDataFragment = { __typename?: 'PendingStreamCollaborator', id: string, inviteId: string, streamId: string, title: string, role: string, token?: string | null, invitedBy: { __typename?: 'LimitedUser', id: string, name: string, bio?: string | null, company?: string | null, avatar?: string | null, verified?: boolean | null }, user?: { __typename?: 'LimitedUser', id: string, name: string, bio?: string | null, company?: string | null, avatar?: string | null, verified?: boolean | null } | null };

export type GetStreamInviteQueryVariables = Exact<{
  streamId: Scalars['String']['input'];
  token?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetStreamInviteQuery = { __typename?: 'Query', streamInvite?: { __typename?: 'PendingStreamCollaborator', id: string, inviteId: string, streamId: string, title: string, role: string, token?: string | null, invitedBy: { __typename?: 'LimitedUser', id: string, name: string, bio?: string | null, company?: string | null, avatar?: string | null, verified?: boolean | null }, user?: { __typename?: 'LimitedUser', id: string, name: string, bio?: string | null, company?: string | null, avatar?: string | null, verified?: boolean | null } | null } | null };

export type GetStreamInvitesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetStreamInvitesQuery = { __typename?: 'Query', streamInvites: Array<{ __typename?: 'PendingStreamCollaborator', id: string, inviteId: string, streamId: string, title: string, role: string, token?: string | null, invitedBy: { __typename?: 'LimitedUser', id: string, name: string, bio?: string | null, company?: string | null, avatar?: string | null, verified?: boolean | null }, user?: { __typename?: 'LimitedUser', id: string, name: string, bio?: string | null, company?: string | null, avatar?: string | null, verified?: boolean | null } | null }> };

export type GetOwnProjectInvitesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetOwnProjectInvitesQuery = { __typename?: 'Query', activeUser?: { __typename?: 'User', projectInvites: Array<{ __typename?: 'PendingStreamCollaborator', id: string, inviteId: string, streamId: string, title: string, role: string, token?: string | null, invitedBy: { __typename?: 'LimitedUser', id: string, name: string, bio?: string | null, company?: string | null, avatar?: string | null, verified?: boolean | null }, user?: { __typename?: 'LimitedUser', id: string, name: string, bio?: string | null, company?: string | null, avatar?: string | null, verified?: boolean | null } | null }> } | null };

export type UseStreamInviteMutationVariables = Exact<{
  accept: Scalars['Boolean']['input'];
  streamId: Scalars['String']['input'];
  token: Scalars['String']['input'];
}>;


export type UseStreamInviteMutation = { __typename?: 'Mutation', streamInviteUse: boolean };

export type CancelStreamInviteMutationVariables = Exact<{
  streamId: Scalars['String']['input'];
  inviteId: Scalars['String']['input'];
}>;


export type CancelStreamInviteMutation = { __typename?: 'Mutation', streamInviteCancel: boolean };

export type GetStreamPendingCollaboratorsQueryVariables = Exact<{
  streamId: Scalars['String']['input'];
}>;


export type GetStreamPendingCollaboratorsQuery = { __typename?: 'Query', stream?: { __typename?: 'Stream', id: string, pendingCollaborators?: Array<{ __typename?: 'PendingStreamCollaborator', inviteId: string, title: string, token?: string | null, user?: { __typename?: 'LimitedUser', id: string, name: string } | null }> | null } | null };

export type CreateProjectInviteMutationVariables = Exact<{
  projectId: Scalars['ID']['input'];
  input: ProjectInviteCreateInput;
}>;


export type CreateProjectInviteMutation = { __typename?: 'Mutation', projectMutations: { __typename?: 'ProjectMutations', invites: { __typename?: 'ProjectInviteMutations', create: { __typename?: 'Project', id: string } } } };

export type BasicStreamFieldsFragment = { __typename?: 'Stream', id: string, name: string, description?: string | null, isPublic: boolean, isDiscoverable: boolean, allowPublicComments: boolean, role?: string | null, createdAt: string, updatedAt: string };

export type LeaveStreamMutationVariables = Exact<{
  streamId: Scalars['String']['input'];
}>;


export type LeaveStreamMutation = { __typename?: 'Mutation', streamLeave: boolean };

export type CreateStreamMutationVariables = Exact<{
  stream: StreamCreateInput;
}>;


export type CreateStreamMutation = { __typename?: 'Mutation', streamCreate?: string | null };

export type UpdateStreamMutationVariables = Exact<{
  stream: StreamUpdateInput;
}>;


export type UpdateStreamMutation = { __typename?: 'Mutation', streamUpdate: boolean };

export type ReadStreamQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type ReadStreamQuery = { __typename?: 'Query', stream?: { __typename?: 'Stream', id: string, name: string, description?: string | null, isPublic: boolean, isDiscoverable: boolean, allowPublicComments: boolean, role?: string | null, createdAt: string, updatedAt: string } | null };

export type ReadStreamsQueryVariables = Exact<{ [key: string]: never; }>;


export type ReadStreamsQuery = { __typename?: 'Query', streams?: { __typename?: 'UserStreamCollection', cursor?: string | null, totalCount: number, items?: Array<{ __typename?: 'Stream', id: string, name: string, description?: string | null, isPublic: boolean, isDiscoverable: boolean, allowPublicComments: boolean, role?: string | null, createdAt: string, updatedAt: string }> | null } | null };

export type ReadDiscoverableStreamsQueryVariables = Exact<{
  limit?: Scalars['Int']['input'];
  cursor?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<DiscoverableStreamsSortingInput>;
}>;


export type ReadDiscoverableStreamsQuery = { __typename?: 'Query', discoverableStreams?: { __typename?: 'StreamCollection', totalCount: number, cursor?: string | null, items?: Array<{ __typename?: 'Stream', favoritesCount: number, id: string, name: string, description?: string | null, isPublic: boolean, isDiscoverable: boolean, allowPublicComments: boolean, role?: string | null, createdAt: string, updatedAt: string }> | null } | null };

export type GetUserStreamsQueryVariables = Exact<{
  userId?: InputMaybe<Scalars['String']['input']>;
  limit?: Scalars['Int']['input'];
  cursor?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetUserStreamsQuery = { __typename?: 'Query', user?: { __typename?: 'User', streams: { __typename?: 'UserStreamCollection', totalCount: number, cursor?: string | null, items?: Array<{ __typename?: 'Stream', id: string, name: string, description?: string | null, isPublic: boolean, isDiscoverable: boolean, allowPublicComments: boolean, role?: string | null, createdAt: string, updatedAt: string }> | null } } | null };

export type GetLimitedUserStreamsQueryVariables = Exact<{
  userId: Scalars['String']['input'];
  limit?: Scalars['Int']['input'];
  cursor?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetLimitedUserStreamsQuery = { __typename?: 'Query', otherUser?: { __typename?: 'LimitedUser', streams: { __typename?: 'UserStreamCollection', totalCount: number, cursor?: string | null, items?: Array<{ __typename?: 'Stream', id: string, name: string, description?: string | null, isPublic: boolean, isDiscoverable: boolean, allowPublicComments: boolean, role?: string | null, createdAt: string, updatedAt: string }> | null } } | null };

export type UserWithEmailsFragment = { __typename?: 'User', id: string, name: string, createdAt?: string | null, role?: string | null, emails: Array<{ __typename?: 'UserEmail', id: string, email: string, verified: boolean, primary: boolean }> };

export type GetActiveUserEmailsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetActiveUserEmailsQuery = { __typename?: 'Query', activeUser?: { __typename?: 'User', id: string, name: string, createdAt?: string | null, role?: string | null, emails: Array<{ __typename?: 'UserEmail', id: string, email: string, verified: boolean, primary: boolean }> } | null };

export type CreateUserEmailMutationVariables = Exact<{
  input: CreateUserEmailInput;
}>;


export type CreateUserEmailMutation = { __typename?: 'Mutation', activeUserMutations: { __typename?: 'ActiveUserMutations', emailMutations: { __typename?: 'UserEmailMutations', create: { __typename?: 'User', id: string, name: string, createdAt?: string | null, role?: string | null, emails: Array<{ __typename?: 'UserEmail', id: string, email: string, verified: boolean, primary: boolean }> } } } };

export type DeleteUserEmailMutationVariables = Exact<{
  input: DeleteUserEmailInput;
}>;


export type DeleteUserEmailMutation = { __typename?: 'Mutation', activeUserMutations: { __typename?: 'ActiveUserMutations', emailMutations: { __typename?: 'UserEmailMutations', delete: { __typename?: 'User', id: string, name: string, createdAt?: string | null, role?: string | null, emails: Array<{ __typename?: 'UserEmail', id: string, email: string, verified: boolean, primary: boolean }> } } } };

export type SetPrimaryUserEmailMutationVariables = Exact<{
  input: SetPrimaryUserEmailInput;
}>;


export type SetPrimaryUserEmailMutation = { __typename?: 'Mutation', activeUserMutations: { __typename?: 'ActiveUserMutations', emailMutations: { __typename?: 'UserEmailMutations', setPrimary: { __typename?: 'User', id: string, name: string, createdAt?: string | null, role?: string | null, emails: Array<{ __typename?: 'UserEmail', id: string, email: string, verified: boolean, primary: boolean }> } } } };

export type BaseUserFieldsFragment = { __typename?: 'User', id: string, email?: string | null, name: string, bio?: string | null, company?: string | null, avatar?: string | null, verified?: boolean | null, role?: string | null };

export type BaseLimitedUserFieldsFragment = { __typename?: 'LimitedUser', id: string, name: string, bio?: string | null, company?: string | null, avatar?: string | null, verified?: boolean | null };

export type GetActiveUserQueryVariables = Exact<{ [key: string]: never; }>;


export type GetActiveUserQuery = { __typename?: 'Query', activeUser?: { __typename?: 'User', id: string, email?: string | null, name: string, bio?: string | null, company?: string | null, avatar?: string | null, verified?: boolean | null, role?: string | null } | null };

export type GetActiveUserWithWorkspaceJoinRequestsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetActiveUserWithWorkspaceJoinRequestsQuery = { __typename?: 'Query', activeUser?: { __typename?: 'User', id: string, email?: string | null, name: string, bio?: string | null, company?: string | null, avatar?: string | null, verified?: boolean | null, role?: string | null, workspaceJoinRequests?: { __typename?: 'LimitedWorkspaceJoinRequestCollection', totalCount: number, cursor?: string | null, items: Array<{ __typename?: 'LimitedWorkspaceJoinRequest', status: WorkspaceJoinRequestStatus, workspace: { __typename?: 'LimitedWorkspace', id: string, name: string }, user: { __typename?: 'LimitedUser', id: string, name: string } }> } | null } | null };

export type GetOtherUserQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type GetOtherUserQuery = { __typename?: 'Query', otherUser?: { __typename?: 'LimitedUser', id: string, name: string, bio?: string | null, company?: string | null, avatar?: string | null, verified?: boolean | null } | null };

export type GetAdminUsersQueryVariables = Exact<{
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
  query?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetAdminUsersQuery = { __typename?: 'Query', adminUsers?: { __typename?: 'AdminUsersListCollection', totalCount: number, items: Array<{ __typename?: 'AdminUsersListItem', id: string, registeredUser?: { __typename?: 'User', id: string, email?: string | null, name: string } | null, invitedUser?: { __typename?: 'ServerInvite', id: string, email: string, invitedBy: { __typename?: 'LimitedUser', id: string, name: string } } | null }> } | null };

export type GetPendingEmailVerificationStatusQueryVariables = Exact<{
  id?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetPendingEmailVerificationStatusQuery = { __typename?: 'Query', user?: { __typename?: 'User', hasPendingVerification?: boolean | null } | null };

export type RequestVerificationMutationVariables = Exact<{ [key: string]: never; }>;


export type RequestVerificationMutation = { __typename?: 'Mutation', requestVerification: boolean };

export type UserActiveResourcesQueryVariables = Exact<{ [key: string]: never; }>;


export type UserActiveResourcesQuery = { __typename?: 'Query', activeUser?: { __typename?: 'User', isProjectsActive?: boolean | null, activeWorkspace?: { __typename?: 'Workspace', id: string, name: string } | null } | null };

export type SetUserActiveWorkspaceMutationVariables = Exact<{
  slug?: InputMaybe<Scalars['String']['input']>;
  isProjectsActive?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type SetUserActiveWorkspaceMutation = { __typename?: 'Mutation', activeUserMutations: { __typename?: 'ActiveUserMutations', setActiveWorkspace: boolean } };

export type CreateProjectVersionMutationVariables = Exact<{
  input: CreateVersionInput;
}>;


export type CreateProjectVersionMutation = { __typename?: 'Mutation', versionMutations: { __typename?: 'VersionMutations', create: { __typename?: 'Version', id: string, message?: string | null, sourceApplication?: string | null, referencedObject?: string | null, model: { __typename?: 'Model', id: string } } } };

export type MarkProjectVersionReceivedMutationVariables = Exact<{
  input: MarkReceivedVersionInput;
}>;


export type MarkProjectVersionReceivedMutation = { __typename?: 'Mutation', versionMutations: { __typename?: 'VersionMutations', markReceived: boolean } };

export type TestWorkspaceFragment = { __typename?: 'Workspace', id: string, name: string, slug: string, description?: string | null, createdAt: string, updatedAt: string, logo?: string | null, readOnly: boolean, discoverabilityEnabled: boolean, role?: string | null };

export type TestWorkspaceCollaboratorFragment = { __typename?: 'WorkspaceCollaborator', id: string, role: string, user: { __typename?: 'LimitedUser', name: string }, projectRoles: Array<{ __typename?: 'ProjectRole', role: string, project: { __typename?: 'Project', id: string, name: string } }> };

export type TestWorkspaceProjectFragment = { __typename?: 'Project', id: string, name: string, createdAt: string, updatedAt: string, visibility: ProjectVisibility, team: Array<{ __typename?: 'ProjectCollaborator', id: string, role: string }> };

export type CreateWorkspaceMutationVariables = Exact<{
  input: WorkspaceCreateInput;
}>;


export type CreateWorkspaceMutation = { __typename?: 'Mutation', workspaceMutations: { __typename?: 'WorkspaceMutations', create: { __typename?: 'Workspace', id: string, name: string, slug: string, description?: string | null, createdAt: string, updatedAt: string, logo?: string | null, readOnly: boolean, discoverabilityEnabled: boolean, role?: string | null } } };

export type DeleteWorkspaceMutationVariables = Exact<{
  workspaceId: Scalars['String']['input'];
}>;


export type DeleteWorkspaceMutation = { __typename?: 'Mutation', workspaceMutations: { __typename?: 'WorkspaceMutations', delete: boolean } };

export type GetWorkspaceQueryVariables = Exact<{
  workspaceId: Scalars['String']['input'];
}>;


export type GetWorkspaceQuery = { __typename?: 'Query', workspace: { __typename?: 'Workspace', id: string, name: string, slug: string, description?: string | null, createdAt: string, updatedAt: string, logo?: string | null, readOnly: boolean, discoverabilityEnabled: boolean, role?: string | null, team: { __typename?: 'WorkspaceCollaboratorCollection', items: Array<{ __typename?: 'WorkspaceCollaborator', id: string, role: string, user: { __typename?: 'LimitedUser', name: string }, projectRoles: Array<{ __typename?: 'ProjectRole', role: string, project: { __typename?: 'Project', id: string, name: string } }> }> } } };

export type GetWorkspaceBySlugQueryVariables = Exact<{
  workspaceSlug: Scalars['String']['input'];
}>;


export type GetWorkspaceBySlugQuery = { __typename?: 'Query', workspaceBySlug: { __typename?: 'Workspace', id: string, name: string, slug: string, description?: string | null, createdAt: string, updatedAt: string, logo?: string | null, readOnly: boolean, discoverabilityEnabled: boolean, role?: string | null, team: { __typename?: 'WorkspaceCollaboratorCollection', items: Array<{ __typename?: 'WorkspaceCollaborator', id: string, role: string, user: { __typename?: 'LimitedUser', name: string }, projectRoles: Array<{ __typename?: 'ProjectRole', role: string, project: { __typename?: 'Project', id: string, name: string } }> }> } } };

export type GetActiveUserDiscoverableWorkspacesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetActiveUserDiscoverableWorkspacesQuery = { __typename?: 'Query', activeUser?: { __typename?: 'User', discoverableWorkspaces: Array<{ __typename?: 'LimitedWorkspace', id: string, name: string, description?: string | null, team?: { __typename?: 'LimitedWorkspaceCollaboratorCollection', totalCount: number, cursor?: string | null, items: Array<{ __typename?: 'LimitedWorkspaceCollaborator', user: { __typename?: 'LimitedUser', avatar?: string | null } }> } | null }> } | null };

export type UpdateWorkspaceMutationVariables = Exact<{
  input: WorkspaceUpdateInput;
}>;


export type UpdateWorkspaceMutation = { __typename?: 'Mutation', workspaceMutations: { __typename?: 'WorkspaceMutations', update: { __typename?: 'Workspace', id: string, name: string, slug: string, description?: string | null, createdAt: string, updatedAt: string, logo?: string | null, readOnly: boolean, discoverabilityEnabled: boolean, role?: string | null } } };

export type GetActiveUserWorkspacesQueryVariables = Exact<{
  filter?: InputMaybe<UserWorkspacesFilter>;
}>;


export type GetActiveUserWorkspacesQuery = { __typename?: 'Query', activeUser?: { __typename?: 'User', workspaces: { __typename?: 'WorkspaceCollection', items: Array<{ __typename?: 'Workspace', id: string, name: string, slug: string, description?: string | null, createdAt: string, updatedAt: string, logo?: string | null, readOnly: boolean, discoverabilityEnabled: boolean, role?: string | null }> } } | null };

export type UpdateWorkspaceRoleMutationVariables = Exact<{
  input: WorkspaceRoleUpdateInput;
}>;


export type UpdateWorkspaceRoleMutation = { __typename?: 'Mutation', workspaceMutations: { __typename?: 'WorkspaceMutations', updateRole: { __typename?: 'Workspace', team: { __typename?: 'WorkspaceCollaboratorCollection', items: Array<{ __typename?: 'WorkspaceCollaborator', id: string, role: string, user: { __typename?: 'LimitedUser', name: string }, projectRoles: Array<{ __typename?: 'ProjectRole', role: string, project: { __typename?: 'Project', id: string, name: string } }> }> } } } };

export type CreateWorkspaceProjectMutationVariables = Exact<{
  input: WorkspaceProjectCreateInput;
}>;


export type CreateWorkspaceProjectMutation = { __typename?: 'Mutation', workspaceMutations: { __typename?: 'WorkspaceMutations', projects: { __typename?: 'WorkspaceProjectMutations', create: { __typename?: 'Project', id: string, name: string, createdAt: string, updatedAt: string, visibility: ProjectVisibility, team: Array<{ __typename?: 'ProjectCollaborator', id: string, role: string }> } } } };

export type GetWorkspaceProjectsQueryVariables = Exact<{
  id: Scalars['String']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  cursor?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<WorkspaceProjectsFilter>;
}>;


export type GetWorkspaceProjectsQuery = { __typename?: 'Query', workspace: { __typename?: 'Workspace', projects: { __typename?: 'ProjectCollection', cursor?: string | null, totalCount: number, items: Array<{ __typename?: 'Project', id: string, name: string, createdAt: string, updatedAt: string, visibility: ProjectVisibility, team: Array<{ __typename?: 'ProjectCollaborator', id: string, role: string }> }> } } };

export type GetWorkspaceSsoQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type GetWorkspaceSsoQuery = { __typename?: 'Query', workspace: { __typename?: 'Workspace', sso?: { __typename?: 'WorkspaceSso', provider?: { __typename?: 'WorkspaceSsoProvider', id: string, name: string } | null, session?: { __typename?: 'WorkspaceSsoSession', createdAt: string, validUntil: string } | null } | null } };

export type GetWorkspaceTeamQueryVariables = Exact<{
  workspaceId: Scalars['String']['input'];
  filter?: InputMaybe<WorkspaceTeamFilter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  cursor?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetWorkspaceTeamQuery = { __typename?: 'Query', workspace: { __typename?: 'Workspace', team: { __typename?: 'WorkspaceCollaboratorCollection', cursor?: string | null, totalCount: number, items: Array<{ __typename?: 'WorkspaceCollaborator', id: string, role: string, user: { __typename?: 'LimitedUser', name: string }, projectRoles: Array<{ __typename?: 'ProjectRole', role: string, project: { __typename?: 'Project', id: string, name: string } }> }> } } };

export type ActiveUserLeaveWorkspaceMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type ActiveUserLeaveWorkspaceMutation = { __typename?: 'Mutation', workspaceMutations: { __typename?: 'WorkspaceMutations', leave: boolean } };

export type ActiveUserProjectsWorkspaceQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
  cursor?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<UserProjectsFilter>;
}>;


export type ActiveUserProjectsWorkspaceQuery = { __typename?: 'Query', activeUser?: { __typename?: 'User', projects: { __typename?: 'UserProjectCollection', totalCount: number, items: Array<{ __typename?: 'Project', id: string, workspace?: { __typename?: 'Workspace', id: string, name: string } | null }> } } | null };

export type ActiveUserExpiredSsoSessionsQueryVariables = Exact<{ [key: string]: never; }>;


export type ActiveUserExpiredSsoSessionsQuery = { __typename?: 'Query', activeUser?: { __typename?: 'User', expiredSsoSessions: Array<{ __typename?: 'LimitedWorkspace', id: string, slug: string }> } | null };

export type MoveProjectToWorkspaceMutationVariables = Exact<{
  projectId: Scalars['String']['input'];
  workspaceId: Scalars['String']['input'];
}>;


export type MoveProjectToWorkspaceMutation = { __typename?: 'Mutation', workspaceMutations: { __typename?: 'WorkspaceMutations', projects: { __typename?: 'WorkspaceProjectMutations', moveToWorkspace: { __typename?: 'Project', id: string, workspaceId?: string | null, visibility: ProjectVisibility, team: Array<{ __typename?: 'ProjectCollaborator', id: string, role: string }> } } } };

export type UpdateEmbedOptionsMutationVariables = Exact<{
  input: WorkspaceUpdateEmbedOptionsInput;
}>;


export type UpdateEmbedOptionsMutation = { __typename?: 'Mutation', workspaceMutations: { __typename?: 'WorkspaceMutations', updateEmbedOptions: { __typename?: 'WorkspaceEmbedOptions', hideSpeckleBranding: boolean } } };

export type WorkspaceEmbedOptionsQueryVariables = Exact<{
  workspaceId: Scalars['String']['input'];
}>;


export type WorkspaceEmbedOptionsQuery = { __typename?: 'Query', workspace: { __typename?: 'Workspace', id: string, embedOptions: { __typename?: 'WorkspaceEmbedOptions', hideSpeckleBranding: boolean } } };

export type ProjectEmbedOptionsQueryVariables = Exact<{
  projectId: Scalars['String']['input'];
}>;


export type ProjectEmbedOptionsQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, embedOptions: { __typename?: 'ProjectEmbedOptions', hideSpeckleBranding: boolean } } };

export const LimitedPersonalProjectCommentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LimitedPersonalProjectComment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Comment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"rawText"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"text"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"doc"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}}]}}]} as unknown as DocumentNode<LimitedPersonalProjectCommentFragment, unknown>;
export const LimitedPersonalProjectVersionFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LimitedPersonalProjectVersion"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Version"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"referencedObject"}},{"kind":"Field","name":{"kind":"Name","value":"commentThreads"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedPersonalProjectComment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LimitedPersonalProjectComment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Comment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"rawText"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"text"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"doc"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}}]}}]} as unknown as DocumentNode<LimitedPersonalProjectVersionFragment, unknown>;
export const LimitedPersonalStreamCommitFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LimitedPersonalStreamCommit"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Commit"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"referencedObject"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<LimitedPersonalStreamCommitFragment, unknown>;
export const BasicWorkspaceFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BasicWorkspace"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Workspace"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"readOnly"}}]}}]} as unknown as DocumentNode<BasicWorkspaceFragment, unknown>;
export const BasicPendingWorkspaceCollaboratorFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BasicPendingWorkspaceCollaborator"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PendingWorkspaceCollaborator"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"inviteId"}},{"kind":"Field","name":{"kind":"Name","value":"workspaceId"}},{"kind":"Field","name":{"kind":"Name","value":"workspaceName"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"invitedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"token"}}]}}]} as unknown as DocumentNode<BasicPendingWorkspaceCollaboratorFragment, unknown>;
export const WorkspaceProjectsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"WorkspaceProjects"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ProjectCollection"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]} as unknown as DocumentNode<WorkspaceProjectsFragment, unknown>;
export const FullPermissionCheckResultFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FullPermissionCheckResult"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PermissionCheckResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"authorized"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"payload"}}]}}]} as unknown as DocumentNode<FullPermissionCheckResultFragment, unknown>;
export const ProjectImplicitRoleCheckFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectImplicitRoleCheck"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"canRead"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FullPermissionCheckResult"}}]}},{"kind":"Field","name":{"kind":"Name","value":"canReadSettings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FullPermissionCheckResult"}}]}},{"kind":"Field","name":{"kind":"Name","value":"canReadWebhooks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FullPermissionCheckResult"}}]}},{"kind":"Field","name":{"kind":"Name","value":"canCreateModel"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FullPermissionCheckResult"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FullPermissionCheckResult"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PermissionCheckResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"authorized"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"payload"}}]}}]} as unknown as DocumentNode<ProjectImplicitRoleCheckFragment, unknown>;
export const BasicStreamAccessRequestFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BasicStreamAccessRequestFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StreamAccessRequest"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"requester"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"requesterId"}},{"kind":"Field","name":{"kind":"Name","value":"streamId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<BasicStreamAccessRequestFieldsFragment, unknown>;
export const TestAutomateFunctionFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TestAutomateFunction"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunction"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"repo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"owner"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"isFeatured"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"releases"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"5"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"versionTag"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"inputSchema"}},{"kind":"Field","name":{"kind":"Name","value":"commitId"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"supportedSourceApps"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}}]}}]} as unknown as DocumentNode<TestAutomateFunctionFragment, unknown>;
export const TestAutomationFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TestAutomation"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Automation"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"runs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"trigger"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"VersionCreatedTrigger"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"version"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"model"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"statusMessage"}},{"kind":"Field","name":{"kind":"Name","value":"contextView"}},{"kind":"Field","name":{"kind":"Name","value":"function"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"elapsed"}},{"kind":"Field","name":{"kind":"Name","value":"results"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"currentRevision"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"triggerDefinitions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"VersionCreatedTriggerDefinition"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"model"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"functions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"parameters"}},{"kind":"Field","name":{"kind":"Name","value":"release"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"function"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"versionTag"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"inputSchema"}},{"kind":"Field","name":{"kind":"Name","value":"commitId"}}]}}]}}]}}]}}]} as unknown as DocumentNode<TestAutomationFragment, unknown>;
export const CommentWithRepliesFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CommentWithReplies"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Comment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"rawText"}},{"kind":"Field","name":{"kind":"Name","value":"text"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"doc"}},{"kind":"Field","name":{"kind":"Name","value":"attachments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}},{"kind":"Field","name":{"kind":"Name","value":"streamId"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"replies"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"10"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"text"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"doc"}},{"kind":"Field","name":{"kind":"Name","value":"attachments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}},{"kind":"Field","name":{"kind":"Name","value":"streamId"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<CommentWithRepliesFragment, unknown>;
export const BaseCommitFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BaseCommitFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Commit"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"authorName"}},{"kind":"Field","name":{"kind":"Name","value":"authorId"}},{"kind":"Field","name":{"kind":"Name","value":"authorAvatar"}},{"kind":"Field","name":{"kind":"Name","value":"streamId"}},{"kind":"Field","name":{"kind":"Name","value":"streamName"}},{"kind":"Field","name":{"kind":"Name","value":"sourceApplication"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"referencedObject"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"commentCount"}}]}}]} as unknown as DocumentNode<BaseCommitFieldsFragment, unknown>;
export const MainRegionMetadataFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MainRegionMetadata"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ServerRegionItem"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]} as unknown as DocumentNode<MainRegionMetadataFragment, unknown>;
export const BasicProjectAccessRequestFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BasicProjectAccessRequestFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ProjectAccessRequest"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"requester"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"requesterId"}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<BasicProjectAccessRequestFieldsFragment, unknown>;
export const BasicProjectCommentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BasicProjectComment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Comment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"rawText"}},{"kind":"Field","name":{"kind":"Name","value":"text"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"doc"}}]}},{"kind":"Field","name":{"kind":"Name","value":"authorId"}}]}}]} as unknown as DocumentNode<BasicProjectCommentFragment, unknown>;
export const BasicProjectFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BasicProjectFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"allowPublicComments"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<BasicProjectFieldsFragment, unknown>;
export const StreamInviteDataFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StreamInviteData"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PendingStreamCollaborator"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"inviteId"}},{"kind":"Field","name":{"kind":"Name","value":"streamId"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"token"}},{"kind":"Field","name":{"kind":"Name","value":"invitedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"bio"}},{"kind":"Field","name":{"kind":"Name","value":"company"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"verified"}}]}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"bio"}},{"kind":"Field","name":{"kind":"Name","value":"company"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"verified"}}]}}]}}]} as unknown as DocumentNode<StreamInviteDataFragment, unknown>;
export const BasicStreamFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BasicStreamFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Stream"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"isDiscoverable"}},{"kind":"Field","name":{"kind":"Name","value":"allowPublicComments"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<BasicStreamFieldsFragment, unknown>;
export const UserWithEmailsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserWithEmails"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"emails"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"verified"}},{"kind":"Field","name":{"kind":"Name","value":"primary"}}]}}]}}]} as unknown as DocumentNode<UserWithEmailsFragment, unknown>;
export const BaseUserFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BaseUserFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"bio"}},{"kind":"Field","name":{"kind":"Name","value":"company"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"verified"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]} as unknown as DocumentNode<BaseUserFieldsFragment, unknown>;
export const BaseLimitedUserFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BaseLimitedUserFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LimitedUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"bio"}},{"kind":"Field","name":{"kind":"Name","value":"company"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"verified"}}]}}]} as unknown as DocumentNode<BaseLimitedUserFieldsFragment, unknown>;
export const TestWorkspaceFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TestWorkspace"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Workspace"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"readOnly"}},{"kind":"Field","name":{"kind":"Name","value":"discoverabilityEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]} as unknown as DocumentNode<TestWorkspaceFragment, unknown>;
export const TestWorkspaceCollaboratorFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TestWorkspaceCollaborator"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"WorkspaceCollaborator"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"projectRoles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"project"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<TestWorkspaceCollaboratorFragment, unknown>;
export const TestWorkspaceProjectFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TestWorkspaceProject"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]}}]} as unknown as DocumentNode<TestWorkspaceProjectFragment, unknown>;
export const CreateObjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateObject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ObjectCreateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"objectCreate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"objectInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<CreateObjectMutation, CreateObjectMutationVariables>;
export const PingPongDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"PingPong"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ping"}}]}}]} as unknown as DocumentNode<PingPongSubscription, PingPongSubscriptionVariables>;
export const OnUserProjectsUpdatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"OnUserProjectsUpdated"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userProjectsUpdated"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"project"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<OnUserProjectsUpdatedSubscription, OnUserProjectsUpdatedSubscriptionVariables>;
export const OnProjectUpdatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"OnProjectUpdated"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectUpdated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"project"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<OnProjectUpdatedSubscription, OnProjectUpdatedSubscriptionVariables>;
export const OnUserStreamAddedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"OnUserStreamAdded"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userStreamAdded"}}]}}]} as unknown as DocumentNode<OnUserStreamAddedSubscription, OnUserStreamAddedSubscriptionVariables>;
export const OnUserStreamRemovedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"OnUserStreamRemoved"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userStreamRemoved"}}]}}]} as unknown as DocumentNode<OnUserStreamRemovedSubscription, OnUserStreamRemovedSubscriptionVariables>;
export const OnStreamUpdatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"OnStreamUpdated"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"streamUpdated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"streamId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}}}]}]}}]} as unknown as DocumentNode<OnStreamUpdatedSubscription, OnStreamUpdatedSubscriptionVariables>;
export const OnUserProjectVersionsUpdatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"OnUserProjectVersionsUpdated"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectVersionsUpdated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"version"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}},{"kind":"Field","name":{"kind":"Name","value":"modelId"}}]}}]}}]} as unknown as DocumentNode<OnUserProjectVersionsUpdatedSubscription, OnUserProjectVersionsUpdatedSubscriptionVariables>;
export const OnUserStreamCommitCreatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"OnUserStreamCommitCreated"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"commitCreated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"streamId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}}}]}]}}]} as unknown as DocumentNode<OnUserStreamCommitCreatedSubscription, OnUserStreamCommitCreatedSubscriptionVariables>;
export const OnUserStreamCommitDeletedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"OnUserStreamCommitDeleted"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"commitDeleted"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"streamId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}}}]}]}}]} as unknown as DocumentNode<OnUserStreamCommitDeletedSubscription, OnUserStreamCommitDeletedSubscriptionVariables>;
export const OnUserStreamCommitUpdatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"OnUserStreamCommitUpdated"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"commitId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"commitUpdated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"streamId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}}},{"kind":"Argument","name":{"kind":"Name","value":"commitId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"commitId"}}}]}]}}]} as unknown as DocumentNode<OnUserStreamCommitUpdatedSubscription, OnUserStreamCommitUpdatedSubscriptionVariables>;
export const OnProjectModelsUpdatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"OnProjectModelsUpdated"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"modelIds"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectModelsUpdated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}},{"kind":"Argument","name":{"kind":"Name","value":"modelIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"modelIds"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"model"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<OnProjectModelsUpdatedSubscription, OnProjectModelsUpdatedSubscriptionVariables>;
export const OnBranchCreatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"OnBranchCreated"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"branchCreated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"streamId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}}}]}]}}]} as unknown as DocumentNode<OnBranchCreatedSubscription, OnBranchCreatedSubscriptionVariables>;
export const OnBranchUpdatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"OnBranchUpdated"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"branchId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"branchUpdated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"streamId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}}},{"kind":"Argument","name":{"kind":"Name","value":"branchId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"branchId"}}}]}]}}]} as unknown as DocumentNode<OnBranchUpdatedSubscription, OnBranchUpdatedSubscriptionVariables>;
export const OnBranchDeletedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"OnBranchDeleted"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"branchDeleted"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"streamId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}}}]}]}}]} as unknown as DocumentNode<OnBranchDeletedSubscription, OnBranchDeletedSubscriptionVariables>;
export const UsersRetrievalDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"UsersRetrieval"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UsersRetrievalInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"users"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<UsersRetrievalQuery, UsersRetrievalQueryVariables>;
export const ActiveUserProjectsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ActiveUserProjects"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UserProjectsFilter"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sortBy"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projects"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}},{"kind":"Argument","name":{"kind":"Name","value":"sortBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sortBy"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]} as unknown as DocumentNode<ActiveUserProjectsQuery, ActiveUserProjectsQueryVariables>;
export const VerifyUserEmailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"VerifyUserEmail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"VerifyUserEmailInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeUserMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"emailMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"verify"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]}}]}}]} as unknown as DocumentNode<VerifyUserEmailMutation, VerifyUserEmailMutationVariables>;
export const GetProjectWithVersionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetProjectWithVersions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"workspaceId"}},{"kind":"Field","name":{"kind":"Name","value":"versions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"referencedObject"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetProjectWithVersionsQuery, GetProjectWithVersionsQueryVariables>;
export const GetProjectWithModelVersionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetProjectWithModelVersions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"workspaceId"}},{"kind":"Field","name":{"kind":"Name","value":"models"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"versions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"referencedObject"}}]}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetProjectWithModelVersionsQuery, GetProjectWithModelVersionsQueryVariables>;
export const GetNewWorkspaceExplainerDismissedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetNewWorkspaceExplainerDismissed"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"meta"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"newWorkspaceExplainerDismissed"}}]}}]}}]}}]} as unknown as DocumentNode<GetNewWorkspaceExplainerDismissedQuery, GetNewWorkspaceExplainerDismissedQueryVariables>;
export const SetNewWorkspaceExplainerDismissedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetNewWorkspaceExplainerDismissed"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeUserMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"meta"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setNewWorkspaceExplainerDismissed"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"value"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]}}]}}]} as unknown as DocumentNode<SetNewWorkspaceExplainerDismissedMutation, SetNewWorkspaceExplainerDismissedMutationVariables>;
export const GetSpeckleConBannerDismissedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetSpeckleConBannerDismissed"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"meta"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"speckleConBannerDismissed"}}]}}]}}]}}]} as unknown as DocumentNode<GetSpeckleConBannerDismissedQuery, GetSpeckleConBannerDismissedQueryVariables>;
export const SetSpeckleConBannerDismissedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetSpeckleConBannerDismissed"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeUserMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"meta"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setSpeckleConBannerDismissed"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"value"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]}}]}}]} as unknown as DocumentNode<SetSpeckleConBannerDismissedMutation, SetSpeckleConBannerDismissedMutationVariables>;
export const GetLegacyProjectsExplainerCollapsedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetLegacyProjectsExplainerCollapsed"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"meta"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"legacyProjectsExplainerCollapsed"}}]}}]}}]}}]} as unknown as DocumentNode<GetLegacyProjectsExplainerCollapsedQuery, GetLegacyProjectsExplainerCollapsedQueryVariables>;
export const SetLegacyProjectsExplainerCollapsedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetLegacyProjectsExplainerCollapsed"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeUserMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"meta"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setLegacyProjectsExplainerCollapsed"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"value"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]}}]}}]} as unknown as DocumentNode<SetLegacyProjectsExplainerCollapsedMutation, SetLegacyProjectsExplainerCollapsedMutationVariables>;
export const GetLimitedPersonalProjectVersionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetLimitedPersonalProjectVersions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"versions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedPersonalProjectVersion"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LimitedPersonalProjectComment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Comment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"rawText"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"text"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"doc"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LimitedPersonalProjectVersion"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Version"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"referencedObject"}},{"kind":"Field","name":{"kind":"Name","value":"commentThreads"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedPersonalProjectComment"}}]}}]}}]}}]} as unknown as DocumentNode<GetLimitedPersonalProjectVersionsQuery, GetLimitedPersonalProjectVersionsQueryVariables>;
export const GetLimitedPersonalProjectVersionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetLimitedPersonalProjectVersion"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"versionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"version"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"versionId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedPersonalProjectVersion"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LimitedPersonalProjectComment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Comment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"rawText"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"text"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"doc"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LimitedPersonalProjectVersion"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Version"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"referencedObject"}},{"kind":"Field","name":{"kind":"Name","value":"commentThreads"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedPersonalProjectComment"}}]}}]}}]}}]} as unknown as DocumentNode<GetLimitedPersonalProjectVersionQuery, GetLimitedPersonalProjectVersionQueryVariables>;
export const GetLimitedPersonalStreamCommitsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetLimitedPersonalStreamCommits"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stream"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"commits"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedPersonalStreamCommit"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LimitedPersonalStreamCommit"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Commit"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"referencedObject"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<GetLimitedPersonalStreamCommitsQuery, GetLimitedPersonalStreamCommitsQueryVariables>;
export const GetLimitedPersonalProjectCommentsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetLimitedPersonalProjectComments"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"commentThreads"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedPersonalProjectComment"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LimitedPersonalProjectComment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Comment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"rawText"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"text"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"doc"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}}]}}]} as unknown as DocumentNode<GetLimitedPersonalProjectCommentsQuery, GetLimitedPersonalProjectCommentsQueryVariables>;
export const GetLimitedPersonalProjectCommentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetLimitedPersonalProjectComment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"commentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"comment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"commentId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedPersonalProjectComment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LimitedPersonalProjectComment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Comment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"rawText"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"text"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"doc"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}}]}}]} as unknown as DocumentNode<GetLimitedPersonalProjectCommentQuery, GetLimitedPersonalProjectCommentQueryVariables>;
export const CreateWorkspaceInviteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateWorkspaceInvite"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"WorkspaceInviteCreateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspaceMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"invites"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"create"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"workspaceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BasicWorkspace"}},{"kind":"Field","name":{"kind":"Name","value":"invitedTeam"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BasicPendingWorkspaceCollaborator"}}]}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BasicWorkspace"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Workspace"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"readOnly"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BasicPendingWorkspaceCollaborator"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PendingWorkspaceCollaborator"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"inviteId"}},{"kind":"Field","name":{"kind":"Name","value":"workspaceId"}},{"kind":"Field","name":{"kind":"Name","value":"workspaceName"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"invitedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"token"}}]}}]} as unknown as DocumentNode<CreateWorkspaceInviteMutation, CreateWorkspaceInviteMutationVariables>;
export const BatchCreateWorkspaceInvitesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"BatchCreateWorkspaceInvites"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"WorkspaceInviteCreateInput"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspaceMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"invites"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"batchCreate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"workspaceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BasicWorkspace"}},{"kind":"Field","name":{"kind":"Name","value":"invitedTeam"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BasicPendingWorkspaceCollaborator"}}]}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BasicWorkspace"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Workspace"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"readOnly"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BasicPendingWorkspaceCollaborator"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PendingWorkspaceCollaborator"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"inviteId"}},{"kind":"Field","name":{"kind":"Name","value":"workspaceId"}},{"kind":"Field","name":{"kind":"Name","value":"workspaceName"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"invitedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"token"}}]}}]} as unknown as DocumentNode<BatchCreateWorkspaceInvitesMutation, BatchCreateWorkspaceInvitesMutationVariables>;
export const GetWorkspaceWithTeamDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetWorkspaceWithTeam"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BasicWorkspace"}},{"kind":"Field","name":{"kind":"Name","value":"invitedTeam"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BasicPendingWorkspaceCollaborator"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BasicWorkspace"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Workspace"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"readOnly"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BasicPendingWorkspaceCollaborator"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PendingWorkspaceCollaborator"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"inviteId"}},{"kind":"Field","name":{"kind":"Name","value":"workspaceId"}},{"kind":"Field","name":{"kind":"Name","value":"workspaceName"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"invitedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"token"}}]}}]} as unknown as DocumentNode<GetWorkspaceWithTeamQuery, GetWorkspaceWithTeamQueryVariables>;
export const GetWorkspaceWithProjectsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetWorkspaceWithProjects"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BasicWorkspace"}},{"kind":"Field","name":{"kind":"Name","value":"projects"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"WorkspaceProjects"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BasicWorkspace"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Workspace"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"readOnly"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"WorkspaceProjects"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ProjectCollection"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]} as unknown as DocumentNode<GetWorkspaceWithProjectsQuery, GetWorkspaceWithProjectsQueryVariables>;
export const CancelWorkspaceInviteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CancelWorkspaceInvite"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"inviteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspaceMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"invites"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cancel"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"workspaceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"inviteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"inviteId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BasicWorkspace"}},{"kind":"Field","name":{"kind":"Name","value":"invitedTeam"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BasicPendingWorkspaceCollaborator"}}]}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BasicWorkspace"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Workspace"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"readOnly"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BasicPendingWorkspaceCollaborator"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PendingWorkspaceCollaborator"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"inviteId"}},{"kind":"Field","name":{"kind":"Name","value":"workspaceId"}},{"kind":"Field","name":{"kind":"Name","value":"workspaceName"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"invitedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"token"}}]}}]} as unknown as DocumentNode<CancelWorkspaceInviteMutation, CancelWorkspaceInviteMutationVariables>;
export const UseWorkspaceInviteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UseWorkspaceInvite"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"WorkspaceInviteUseInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspaceMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"invites"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"use"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]}}]}}]} as unknown as DocumentNode<UseWorkspaceInviteMutation, UseWorkspaceInviteMutationVariables>;
export const GetWorkspaceInviteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetWorkspaceInvite"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"token"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"options"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"WorkspaceInviteLookupOptions"}},"defaultValue":{"kind":"NullValue"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspaceInvite"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"workspaceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"token"},"value":{"kind":"Variable","name":{"kind":"Name","value":"token"}}},{"kind":"Argument","name":{"kind":"Name","value":"options"},"value":{"kind":"Variable","name":{"kind":"Name","value":"options"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BasicPendingWorkspaceCollaborator"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BasicPendingWorkspaceCollaborator"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PendingWorkspaceCollaborator"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"inviteId"}},{"kind":"Field","name":{"kind":"Name","value":"workspaceId"}},{"kind":"Field","name":{"kind":"Name","value":"workspaceName"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"invitedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"token"}}]}}]} as unknown as DocumentNode<GetWorkspaceInviteQuery, GetWorkspaceInviteQueryVariables>;
export const GetMyWorkspaceInvitesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMyWorkspaceInvites"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspaceInvites"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BasicPendingWorkspaceCollaborator"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BasicPendingWorkspaceCollaborator"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PendingWorkspaceCollaborator"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"inviteId"}},{"kind":"Field","name":{"kind":"Name","value":"workspaceId"}},{"kind":"Field","name":{"kind":"Name","value":"workspaceName"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"invitedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"token"}}]}}]} as unknown as DocumentNode<GetMyWorkspaceInvitesQuery, GetMyWorkspaceInvitesQueryVariables>;
export const UseWorkspaceProjectInviteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UseWorkspaceProjectInvite"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ProjectInviteUseInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"invites"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"use"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]}}]}}]} as unknown as DocumentNode<UseWorkspaceProjectInviteMutation, UseWorkspaceProjectInviteMutationVariables>;
export const CreateWorkspaceProjectInviteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateWorkspaceProjectInvite"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"inputs"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"WorkspaceProjectInviteCreateInput"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"invites"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createForWorkspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}},{"kind":"Argument","name":{"kind":"Name","value":"inputs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"inputs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]}}]} as unknown as DocumentNode<CreateWorkspaceProjectInviteMutation, CreateWorkspaceProjectInviteMutationVariables>;
export const ResendWorkspaceInviteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ResendWorkspaceInvite"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"WorkspaceInviteResendInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspaceMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"invites"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resend"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]}}]}}]} as unknown as DocumentNode<ResendWorkspaceInviteMutation, ResendWorkspaceInviteMutationVariables>;
export const AddWorkspaceDomainDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddWorkspaceDomain"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AddDomainToWorkspaceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspaceMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addDomain"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"domains"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]}}]} as unknown as DocumentNode<AddWorkspaceDomainMutation, AddWorkspaceDomainMutationVariables>;
export const DeleteWorkspaceDomainDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteWorkspaceDomain"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"WorkspaceDomainDeleteInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspaceMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteDomain"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"domains"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"domainBasedMembershipProtectionEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"discoverabilityEnabled"}}]}}]}}]}}]} as unknown as DocumentNode<DeleteWorkspaceDomainMutation, DeleteWorkspaceDomainMutationVariables>;
export const GetAvailableRegionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAvailableRegions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"serverInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"multiRegion"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"regions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetAvailableRegionsQuery, GetAvailableRegionsQueryVariables>;
export const GetWorkspaceDefaultRegionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetWorkspaceDefaultRegion"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"defaultRegion"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<GetWorkspaceDefaultRegionQuery, GetWorkspaceDefaultRegionQueryVariables>;
export const SetWorkspaceDefaultRegionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetWorkspaceDefaultRegion"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"regionKey"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspaceMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setDefaultRegion"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"regionKey"},"value":{"kind":"Variable","name":{"kind":"Name","value":"regionKey"}}},{"kind":"Argument","name":{"kind":"Name","value":"workspaceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"defaultRegion"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]} as unknown as DocumentNode<SetWorkspaceDefaultRegionMutation, SetWorkspaceDefaultRegionMutationVariables>;
export const OnWorkspaceProjectsUpdatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"OnWorkspaceProjectsUpdated"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceSlug"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspaceProjectsUpdated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"workspaceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"workspaceSlug"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceSlug"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"workspaceId"}},{"kind":"Field","name":{"kind":"Name","value":"project"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<OnWorkspaceProjectsUpdatedSubscription, OnWorkspaceProjectsUpdatedSubscriptionVariables>;
export const OnWorkspaceUpdatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"OnWorkspaceUpdated"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceSlug"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspaceUpdated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"workspaceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"workspaceSlug"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceSlug"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"workspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BasicWorkspace"}},{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"invitedTeam"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BasicPendingWorkspaceCollaborator"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BasicWorkspace"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Workspace"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"readOnly"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BasicPendingWorkspaceCollaborator"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PendingWorkspaceCollaborator"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"inviteId"}},{"kind":"Field","name":{"kind":"Name","value":"workspaceId"}},{"kind":"Field","name":{"kind":"Name","value":"workspaceName"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"invitedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"token"}}]}}]} as unknown as DocumentNode<OnWorkspaceUpdatedSubscription, OnWorkspaceUpdatedSubscriptionVariables>;
export const DismissWorkspaceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"dismissWorkspace"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"WorkspaceDismissInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspaceMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dismiss"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]}}]} as unknown as DocumentNode<DismissWorkspaceMutation, DismissWorkspaceMutationVariables>;
export const RequestToJoinWorkspaceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"requestToJoinWorkspace"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"WorkspaceRequestToJoinInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspaceMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requestToJoin"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]}}]} as unknown as DocumentNode<RequestToJoinWorkspaceMutation, RequestToJoinWorkspaceMutationVariables>;
export const GetWorkspaceWithJoinRequestsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetWorkspaceWithJoinRequests"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"AdminWorkspaceJoinRequestFilter"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BasicWorkspace"}},{"kind":"Field","name":{"kind":"Name","value":"adminWorkspacesJoinRequests"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}},{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"workspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BasicWorkspace"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Workspace"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"readOnly"}}]}}]} as unknown as DocumentNode<GetWorkspaceWithJoinRequestsQuery, GetWorkspaceWithJoinRequestsQueryVariables>;
export const GetWorkspaceWithSubscriptionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetWorkspaceWithSubscription"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BasicWorkspace"}},{"kind":"Field","name":{"kind":"Name","value":"subscription"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"currentBillingCycleEnd"}},{"kind":"Field","name":{"kind":"Name","value":"billingInterval"}},{"kind":"Field","name":{"kind":"Name","value":"seats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"editors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"available"}},{"kind":"Field","name":{"kind":"Name","value":"assigned"}}]}},{"kind":"Field","name":{"kind":"Name","value":"viewers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"assigned"}}]}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BasicWorkspace"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Workspace"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"readOnly"}}]}}]} as unknown as DocumentNode<GetWorkspaceWithSubscriptionQuery, GetWorkspaceWithSubscriptionQueryVariables>;
export const GetWorkspacePlanUsageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetWorkspacePlanUsage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BasicWorkspace"}},{"kind":"Field","name":{"kind":"Name","value":"plan"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"usage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectCount"}},{"kind":"Field","name":{"kind":"Name","value":"modelCount"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BasicWorkspace"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Workspace"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"readOnly"}}]}}]} as unknown as DocumentNode<GetWorkspacePlanUsageQuery, GetWorkspacePlanUsageQueryVariables>;
export const GetWorkspaceWithMembersByRoleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetWorkspaceWithMembersByRole"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BasicWorkspace"}},{"kind":"Field","name":{"kind":"Name","value":"teamByRole"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"admins"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"guests"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BasicWorkspace"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Workspace"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"readOnly"}}]}}]} as unknown as DocumentNode<GetWorkspaceWithMembersByRoleQuery, GetWorkspaceWithMembersByRoleQueryVariables>;
export const UpdateWorkspaceProjectRoleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateWorkspaceProjectRole"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ProjectUpdateRoleInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspaceMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projects"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateRole"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BasicProjectFields"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BasicProjectFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"allowPublicComments"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<UpdateWorkspaceProjectRoleMutation, UpdateWorkspaceProjectRoleMutationVariables>;
export const UpdateWorkspaceSeatTypeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateWorkspaceSeatType"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"WorkspaceUpdateSeatTypeInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspaceMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateSeatType"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"seatType"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<UpdateWorkspaceSeatTypeMutation, UpdateWorkspaceSeatTypeMutationVariables>;
export const GetProjectInvitableCollaboratorsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetProjectInvitableCollaborators"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"invitableCollaborators"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetProjectInvitableCollaboratorsQuery, GetProjectInvitableCollaboratorsQueryVariables>;
export const GetUserWorkspaceAccessDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetUserWorkspaceAccess"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"seatType"}}]}}]}}]} as unknown as DocumentNode<GetUserWorkspaceAccessQuery, GetUserWorkspaceAccessQueryVariables>;
export const GetUserWorkspaceProjectsWithAccessChecksDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetUserWorkspaceProjectsWithAccessChecks"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"WorkspaceProjectsFilter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BasicWorkspace"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"seatType"}},{"kind":"Field","name":{"kind":"Name","value":"projects"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}}},{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectImplicitRoleCheck"}}]}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FullPermissionCheckResult"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PermissionCheckResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"authorized"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"payload"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BasicWorkspace"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Workspace"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"readOnly"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectImplicitRoleCheck"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"canRead"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FullPermissionCheckResult"}}]}},{"kind":"Field","name":{"kind":"Name","value":"canReadSettings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FullPermissionCheckResult"}}]}},{"kind":"Field","name":{"kind":"Name","value":"canReadWebhooks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FullPermissionCheckResult"}}]}},{"kind":"Field","name":{"kind":"Name","value":"canCreateModel"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FullPermissionCheckResult"}}]}}]}}]}}]} as unknown as DocumentNode<GetUserWorkspaceProjectsWithAccessChecksQuery, GetUserWorkspaceProjectsWithAccessChecksQueryVariables>;
export const GetUserProjectsWithAccessChecksDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetUserProjectsWithAccessChecks"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"UserProjectsFilter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"projects"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}}},{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectImplicitRoleCheck"}}]}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FullPermissionCheckResult"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PermissionCheckResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"authorized"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"payload"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectImplicitRoleCheck"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"canRead"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FullPermissionCheckResult"}}]}},{"kind":"Field","name":{"kind":"Name","value":"canReadSettings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FullPermissionCheckResult"}}]}},{"kind":"Field","name":{"kind":"Name","value":"canReadWebhooks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FullPermissionCheckResult"}}]}},{"kind":"Field","name":{"kind":"Name","value":"canCreateModel"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FullPermissionCheckResult"}}]}}]}}]}}]} as unknown as DocumentNode<GetUserProjectsWithAccessChecksQuery, GetUserProjectsWithAccessChecksQueryVariables>;
export const CreateStreamAccessRequestDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateStreamAccessRequest"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"streamAccessRequestCreate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"streamId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BasicStreamAccessRequestFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BasicStreamAccessRequestFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StreamAccessRequest"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"requester"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"requesterId"}},{"kind":"Field","name":{"kind":"Name","value":"streamId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<CreateStreamAccessRequestMutation, CreateStreamAccessRequestMutationVariables>;
export const GetStreamAccessRequestDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetStreamAccessRequest"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"streamAccessRequest"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"streamId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BasicStreamAccessRequestFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BasicStreamAccessRequestFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StreamAccessRequest"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"requester"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"requesterId"}},{"kind":"Field","name":{"kind":"Name","value":"streamId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<GetStreamAccessRequestQuery, GetStreamAccessRequestQueryVariables>;
export const GetFullStreamAccessRequestDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetFullStreamAccessRequest"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"streamAccessRequest"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"streamId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BasicStreamAccessRequestFields"}},{"kind":"Field","name":{"kind":"Name","value":"stream"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BasicStreamAccessRequestFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StreamAccessRequest"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"requester"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"requesterId"}},{"kind":"Field","name":{"kind":"Name","value":"streamId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<GetFullStreamAccessRequestQuery, GetFullStreamAccessRequestQueryVariables>;
export const GetPendingStreamAccessRequestsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetPendingStreamAccessRequests"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stream"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"pendingAccessRequests"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BasicStreamAccessRequestFields"}},{"kind":"Field","name":{"kind":"Name","value":"stream"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BasicStreamAccessRequestFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StreamAccessRequest"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"requester"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"requesterId"}},{"kind":"Field","name":{"kind":"Name","value":"streamId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<GetPendingStreamAccessRequestsQuery, GetPendingStreamAccessRequestsQueryVariables>;
export const UseStreamAccessRequestDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UseStreamAccessRequest"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"requestId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"accept"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"role"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"StreamRole"}}},"defaultValue":{"kind":"EnumValue","value":"STREAM_CONTRIBUTOR"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"streamAccessRequestUse"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"requestId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"requestId"}}},{"kind":"Argument","name":{"kind":"Name","value":"accept"},"value":{"kind":"Variable","name":{"kind":"Name","value":"accept"}}},{"kind":"Argument","name":{"kind":"Name","value":"role"},"value":{"kind":"Variable","name":{"kind":"Name","value":"role"}}}]}]}}]} as unknown as DocumentNode<UseStreamAccessRequestMutation, UseStreamAccessRequestMutationVariables>;
export const CreateTokenDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateToken"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"token"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ApiTokenCreateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"apiTokenCreate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"token"},"value":{"kind":"Variable","name":{"kind":"Name","value":"token"}}}]}]}}]} as unknown as DocumentNode<CreateTokenMutation, CreateTokenMutationVariables>;
export const RevokeTokenDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RevokeToken"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"token"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"apiTokenRevoke"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"token"},"value":{"kind":"Variable","name":{"kind":"Name","value":"token"}}}]}]}}]} as unknown as DocumentNode<RevokeTokenMutation, RevokeTokenMutationVariables>;
export const TokenAppInfoDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TokenAppInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"authenticatedAsApp"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<TokenAppInfoQuery, TokenAppInfoQueryVariables>;
export const AppTokenCreateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AppTokenCreate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"token"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AppTokenCreateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"appTokenCreate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"token"},"value":{"kind":"Variable","name":{"kind":"Name","value":"token"}}}]}]}}]} as unknown as DocumentNode<AppTokenCreateMutation, AppTokenCreateMutationVariables>;
export const GetProjectAutomationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetProjectAutomation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"automationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"automationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TestAutomation"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TestAutomation"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Automation"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"runs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"trigger"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"VersionCreatedTrigger"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"version"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"model"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"statusMessage"}},{"kind":"Field","name":{"kind":"Name","value":"contextView"}},{"kind":"Field","name":{"kind":"Name","value":"function"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"elapsed"}},{"kind":"Field","name":{"kind":"Name","value":"results"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"currentRevision"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"triggerDefinitions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"VersionCreatedTriggerDefinition"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"model"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"functions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"parameters"}},{"kind":"Field","name":{"kind":"Name","value":"release"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"function"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"versionTag"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"inputSchema"}},{"kind":"Field","name":{"kind":"Name","value":"commitId"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetProjectAutomationQuery, GetProjectAutomationQueryVariables>;
export const GetAutomateFunctionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAutomateFunctions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionsFilter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"automateFunctions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TestAutomateFunction"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TestAutomateFunction"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunction"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"repo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"owner"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"isFeatured"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"releases"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"5"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"versionTag"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"inputSchema"}},{"kind":"Field","name":{"kind":"Name","value":"commitId"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"supportedSourceApps"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}}]}}]} as unknown as DocumentNode<GetAutomateFunctionsQuery, GetAutomateFunctionsQueryVariables>;
export const AutomateValidateAuthCodeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AutomateValidateAuthCode"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"payload"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateAuthCodePayloadTest"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"automateValidateAuthCode"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"payload"},"value":{"kind":"Variable","name":{"kind":"Name","value":"payload"}}}]}]}}]} as unknown as DocumentNode<AutomateValidateAuthCodeQuery, AutomateValidateAuthCodeQueryVariables>;
export const CreateCommentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateComment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CommentCreateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"commentCreate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<CreateCommentMutation, CreateCommentMutationVariables>;
export const CreateReplyDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateReply"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ReplyCreateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"commentReply"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<CreateReplyMutation, CreateReplyMutationVariables>;
export const GetCommentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetComment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"comment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"streamId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CommentWithReplies"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CommentWithReplies"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Comment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"rawText"}},{"kind":"Field","name":{"kind":"Name","value":"text"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"doc"}},{"kind":"Field","name":{"kind":"Name","value":"attachments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}},{"kind":"Field","name":{"kind":"Name","value":"streamId"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"replies"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"10"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"text"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"doc"}},{"kind":"Field","name":{"kind":"Name","value":"attachments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}},{"kind":"Field","name":{"kind":"Name","value":"streamId"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetCommentQuery, GetCommentQueryVariables>;
export const GetCommentsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetComments"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"comments"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"streamId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"10"}},{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CommentWithReplies"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CommentWithReplies"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Comment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"rawText"}},{"kind":"Field","name":{"kind":"Name","value":"text"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"doc"}},{"kind":"Field","name":{"kind":"Name","value":"attachments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}},{"kind":"Field","name":{"kind":"Name","value":"streamId"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"replies"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"10"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"text"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"doc"}},{"kind":"Field","name":{"kind":"Name","value":"attachments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}},{"kind":"Field","name":{"kind":"Name","value":"streamId"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetCommentsQuery, GetCommentsQueryVariables>;
export const ReadOwnCommitsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ReadOwnCommits"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},"defaultValue":{"kind":"IntValue","value":"10"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"commits"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BaseCommitFields"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BaseCommitFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Commit"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"authorName"}},{"kind":"Field","name":{"kind":"Name","value":"authorId"}},{"kind":"Field","name":{"kind":"Name","value":"authorAvatar"}},{"kind":"Field","name":{"kind":"Name","value":"streamId"}},{"kind":"Field","name":{"kind":"Name","value":"streamName"}},{"kind":"Field","name":{"kind":"Name","value":"sourceApplication"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"referencedObject"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"commentCount"}}]}}]} as unknown as DocumentNode<ReadOwnCommitsQuery, ReadOwnCommitsQueryVariables>;
export const ReadOtherUsersCommitsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ReadOtherUsersCommits"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},"defaultValue":{"kind":"IntValue","value":"10"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"otherUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"commits"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BaseCommitFields"}},{"kind":"Field","name":{"kind":"Name","value":"stream"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}}]}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BaseCommitFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Commit"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"authorName"}},{"kind":"Field","name":{"kind":"Name","value":"authorId"}},{"kind":"Field","name":{"kind":"Name","value":"authorAvatar"}},{"kind":"Field","name":{"kind":"Name","value":"streamId"}},{"kind":"Field","name":{"kind":"Name","value":"streamName"}},{"kind":"Field","name":{"kind":"Name","value":"sourceApplication"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"referencedObject"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"commentCount"}}]}}]} as unknown as DocumentNode<ReadOtherUsersCommitsQuery, ReadOtherUsersCommitsQueryVariables>;
export const ReadStreamBranchCommitsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ReadStreamBranchCommits"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"branchName"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},"defaultValue":{"kind":"IntValue","value":"10"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stream"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"branch"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"branchName"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"commits"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BaseCommitFields"}}]}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BaseCommitFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Commit"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"authorName"}},{"kind":"Field","name":{"kind":"Name","value":"authorId"}},{"kind":"Field","name":{"kind":"Name","value":"authorAvatar"}},{"kind":"Field","name":{"kind":"Name","value":"streamId"}},{"kind":"Field","name":{"kind":"Name","value":"streamName"}},{"kind":"Field","name":{"kind":"Name","value":"sourceApplication"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"referencedObject"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"commentCount"}}]}}]} as unknown as DocumentNode<ReadStreamBranchCommitsQuery, ReadStreamBranchCommitsQueryVariables>;
export const MoveCommitsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MoveCommits"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CommitsMoveInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"commitsMove"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<MoveCommitsMutation, MoveCommitsMutationVariables>;
export const DeleteCommitsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteCommits"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CommitsDeleteInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"commitsDelete"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<DeleteCommitsMutation, DeleteCommitsMutationVariables>;
export const GetWorkspacePlanPricesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetWorkspacePlanPrices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"serverInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspaces"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"planPrices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"usd"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"monthly"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}}]}},{"kind":"Field","name":{"kind":"Name","value":"yearly"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"teamUnlimited"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"monthly"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}}]}},{"kind":"Field","name":{"kind":"Name","value":"yearly"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pro"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"monthly"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}}]}},{"kind":"Field","name":{"kind":"Name","value":"yearly"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"proUnlimited"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"monthly"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}}]}},{"kind":"Field","name":{"kind":"Name","value":"yearly"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"gbp"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"monthly"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}}]}},{"kind":"Field","name":{"kind":"Name","value":"yearly"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"teamUnlimited"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"monthly"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}}]}},{"kind":"Field","name":{"kind":"Name","value":"yearly"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pro"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"monthly"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}}]}},{"kind":"Field","name":{"kind":"Name","value":"yearly"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"proUnlimited"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"monthly"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}}]}},{"kind":"Field","name":{"kind":"Name","value":"yearly"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}}]}}]}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetWorkspacePlanPricesQuery, GetWorkspacePlanPricesQueryVariables>;
export const CreateProjectModelDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateProjectModel"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateModelInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"modelMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"create"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]}}]} as unknown as DocumentNode<CreateProjectModelMutation, CreateProjectModelMutationVariables>;
export const FindProjectModelByNameDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"FindProjectModelByName"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"modelByName"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]}}]} as unknown as DocumentNode<FindProjectModelByNameQuery, FindProjectModelByNameQueryVariables>;
export const GetAvailableRegionKeysDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAvailableRegionKeys"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"serverInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"multiRegion"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"availableKeys"}}]}}]}}]}}]} as unknown as DocumentNode<GetAvailableRegionKeysQuery, GetAvailableRegionKeysQueryVariables>;
export const CreateNewRegionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateNewRegion"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateServerRegionInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"serverInfoMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"multiRegion"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"create"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MainRegionMetadata"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MainRegionMetadata"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ServerRegionItem"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]} as unknown as DocumentNode<CreateNewRegionMutation, CreateNewRegionMutationVariables>;
export const GetRegionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetRegions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"serverInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"multiRegion"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"regions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MainRegionMetadata"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MainRegionMetadata"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ServerRegionItem"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]} as unknown as DocumentNode<GetRegionsQuery, GetRegionsQueryVariables>;
export const UpdateRegionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateRegion"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateServerRegionInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"serverInfoMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"multiRegion"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"update"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MainRegionMetadata"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MainRegionMetadata"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ServerRegionItem"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]} as unknown as DocumentNode<UpdateRegionMutation, UpdateRegionMutationVariables>;
export const UpdateProjectRegionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateProjectRegion"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"regionKey"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspaceMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projects"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"moveToRegion"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}},{"kind":"Argument","name":{"kind":"Name","value":"regionKey"},"value":{"kind":"Variable","name":{"kind":"Name","value":"regionKey"}}}]}]}}]}}]}}]} as unknown as DocumentNode<UpdateProjectRegionMutation, UpdateProjectRegionMutationVariables>;
export const GetRegionalProjectModelDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetRegionalProjectModel"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"modelId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"model"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"modelId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<GetRegionalProjectModelQuery, GetRegionalProjectModelQueryVariables>;
export const GetRegionalProjectVersionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetRegionalProjectVersion"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"modelId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"versionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"model"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"modelId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"version"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"versionId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"referencedObject"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetRegionalProjectVersionQuery, GetRegionalProjectVersionQueryVariables>;
export const GetRegionalProjectObjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetRegionalProjectObject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"objectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"object"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"objectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<GetRegionalProjectObjectQuery, GetRegionalProjectObjectQueryVariables>;
export const GetRegionalProjectAutomationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetRegionalProjectAutomation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"automationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"automationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"runs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetRegionalProjectAutomationQuery, GetRegionalProjectAutomationQueryVariables>;
export const GetRegionalProjectCommentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetRegionalProjectComment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"commentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"comment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"commentId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<GetRegionalProjectCommentQuery, GetRegionalProjectCommentQueryVariables>;
export const GetRegionalProjectWebhookDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetRegionalProjectWebhook"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"webhookId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"webhooks"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"webhookId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetRegionalProjectWebhookQuery, GetRegionalProjectWebhookQueryVariables>;
export const GetRegionalProjectBlobDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetRegionalProjectBlob"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"blobId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"blob"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"blobId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}}]}}]}}]}}]} as unknown as DocumentNode<GetRegionalProjectBlobQuery, GetRegionalProjectBlobQueryVariables>;
export const CreateProjectAccessRequestDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateProjectAccessRequest"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accessRequestMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"create"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BasicProjectAccessRequestFields"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BasicProjectAccessRequestFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ProjectAccessRequest"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"requester"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"requesterId"}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<CreateProjectAccessRequestMutation, CreateProjectAccessRequestMutationVariables>;
export const GetActiveUserProjectAccessRequestDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetActiveUserProjectAccessRequest"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectAccessRequest"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BasicProjectAccessRequestFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BasicProjectAccessRequestFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ProjectAccessRequest"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"requester"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"requesterId"}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<GetActiveUserProjectAccessRequestQuery, GetActiveUserProjectAccessRequestQueryVariables>;
export const GetActiveUserFullProjectAccessRequestDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetActiveUserFullProjectAccessRequest"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectAccessRequest"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BasicProjectAccessRequestFields"}},{"kind":"Field","name":{"kind":"Name","value":"project"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BasicProjectAccessRequestFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ProjectAccessRequest"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"requester"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"requesterId"}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<GetActiveUserFullProjectAccessRequestQuery, GetActiveUserFullProjectAccessRequestQueryVariables>;
export const GetPendingProjectAccessRequestsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetPendingProjectAccessRequests"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"pendingAccessRequests"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BasicProjectAccessRequestFields"}},{"kind":"Field","name":{"kind":"Name","value":"project"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BasicProjectAccessRequestFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ProjectAccessRequest"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"requester"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"requesterId"}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<GetPendingProjectAccessRequestsQuery, GetPendingProjectAccessRequestsQueryVariables>;
export const UseProjectAccessRequestDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UseProjectAccessRequest"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"requestId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"accept"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"role"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"StreamRole"}}},"defaultValue":{"kind":"EnumValue","value":"STREAM_CONTRIBUTOR"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accessRequestMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"use"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"requestId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"requestId"}}},{"kind":"Argument","name":{"kind":"Name","value":"accept"},"value":{"kind":"Variable","name":{"kind":"Name","value":"accept"}}},{"kind":"Argument","name":{"kind":"Name","value":"role"},"value":{"kind":"Variable","name":{"kind":"Name","value":"role"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]}}]} as unknown as DocumentNode<UseProjectAccessRequestMutation, UseProjectAccessRequestMutationVariables>;
export const CreateProjectCommentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateProjectComment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateCommentInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"commentMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"create"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BasicProjectComment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BasicProjectComment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Comment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"rawText"}},{"kind":"Field","name":{"kind":"Name","value":"text"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"doc"}}]}},{"kind":"Field","name":{"kind":"Name","value":"authorId"}}]}}]} as unknown as DocumentNode<CreateProjectCommentMutation, CreateProjectCommentMutationVariables>;
export const CreateProjectCommentReplyDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateProjectCommentReply"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateCommentReplyInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"commentMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"reply"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BasicProjectComment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BasicProjectComment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Comment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"rawText"}},{"kind":"Field","name":{"kind":"Name","value":"text"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"doc"}}]}},{"kind":"Field","name":{"kind":"Name","value":"authorId"}}]}}]} as unknown as DocumentNode<CreateProjectCommentReplyMutation, CreateProjectCommentReplyMutationVariables>;
export const EditProjectCommentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"EditProjectComment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"EditCommentInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"commentMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edit"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BasicProjectComment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BasicProjectComment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Comment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"rawText"}},{"kind":"Field","name":{"kind":"Name","value":"text"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"doc"}}]}},{"kind":"Field","name":{"kind":"Name","value":"authorId"}}]}}]} as unknown as DocumentNode<EditProjectCommentMutation, EditProjectCommentMutationVariables>;
export const AdminProjectListDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminProjectList"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"query"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"visibility"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},"defaultValue":{"kind":"IntValue","value":"25"}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"defaultValue":{"kind":"NullValue"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"admin"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectList"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"query"},"value":{"kind":"Variable","name":{"kind":"Name","value":"query"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}}},{"kind":"Argument","name":{"kind":"Name","value":"visibility"},"value":{"kind":"Variable","name":{"kind":"Name","value":"visibility"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BasicProjectFields"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BasicProjectFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"allowPublicComments"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<AdminProjectListQuery, AdminProjectListQueryVariables>;
export const GetProjectObjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetProjectObject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"objectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"object"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"objectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]}}]} as unknown as DocumentNode<GetProjectObjectQuery, GetProjectObjectQueryVariables>;
export const GetProjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetProject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"workspaceId"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"BasicProjectFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BasicProjectFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"allowPublicComments"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<GetProjectQuery, GetProjectQueryVariables>;
export const CreateProjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateProject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ProjectCreateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"create"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BasicProjectFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BasicProjectFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"allowPublicComments"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<CreateProjectMutation, CreateProjectMutationVariables>;
export const BatchDeleteProjectsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"BatchDeleteProjects"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ids"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"batchDelete"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"ids"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ids"}}}]}]}}]}}]} as unknown as DocumentNode<BatchDeleteProjectsMutation, BatchDeleteProjectsMutationVariables>;
export const UpdateProjectRoleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateProjectRole"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ProjectUpdateRoleInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateRole"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BasicProjectFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BasicProjectFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"allowPublicComments"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<UpdateProjectRoleMutation, UpdateProjectRoleMutationVariables>;
export const GetProjectCollaboratorsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetProjectCollaborators"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]}}]}}]} as unknown as DocumentNode<GetProjectCollaboratorsQuery, GetProjectCollaboratorsQueryVariables>;
export const CreateServerInviteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateServerInvite"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ServerInviteCreateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"serverInviteCreate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<CreateServerInviteMutation, CreateServerInviteMutationVariables>;
export const CreateStreamInviteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateStreamInvite"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"StreamInviteCreateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"streamInviteCreate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<CreateStreamInviteMutation, CreateStreamInviteMutationVariables>;
export const ResendInviteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ResendInvite"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"inviteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"inviteResend"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"inviteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"inviteId"}}}]}]}}]} as unknown as DocumentNode<ResendInviteMutation, ResendInviteMutationVariables>;
export const BatchCreateServerInviteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"BatchCreateServerInvite"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ServerInviteCreateInput"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"serverInviteBatchCreate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<BatchCreateServerInviteMutation, BatchCreateServerInviteMutationVariables>;
export const BatchCreateStreamInviteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"BatchCreateStreamInvite"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"StreamInviteCreateInput"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"streamInviteBatchCreate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<BatchCreateStreamInviteMutation, BatchCreateStreamInviteMutationVariables>;
export const DeleteInviteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteInvite"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"inviteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"inviteDelete"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"inviteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"inviteId"}}}]}]}}]} as unknown as DocumentNode<DeleteInviteMutation, DeleteInviteMutationVariables>;
export const GetStreamInviteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetStreamInvite"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"token"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"streamInvite"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"streamId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}}},{"kind":"Argument","name":{"kind":"Name","value":"token"},"value":{"kind":"Variable","name":{"kind":"Name","value":"token"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StreamInviteData"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StreamInviteData"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PendingStreamCollaborator"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"inviteId"}},{"kind":"Field","name":{"kind":"Name","value":"streamId"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"token"}},{"kind":"Field","name":{"kind":"Name","value":"invitedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"bio"}},{"kind":"Field","name":{"kind":"Name","value":"company"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"verified"}}]}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"bio"}},{"kind":"Field","name":{"kind":"Name","value":"company"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"verified"}}]}}]}}]} as unknown as DocumentNode<GetStreamInviteQuery, GetStreamInviteQueryVariables>;
export const GetStreamInvitesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetStreamInvites"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"streamInvites"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StreamInviteData"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StreamInviteData"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PendingStreamCollaborator"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"inviteId"}},{"kind":"Field","name":{"kind":"Name","value":"streamId"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"token"}},{"kind":"Field","name":{"kind":"Name","value":"invitedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"bio"}},{"kind":"Field","name":{"kind":"Name","value":"company"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"verified"}}]}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"bio"}},{"kind":"Field","name":{"kind":"Name","value":"company"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"verified"}}]}}]}}]} as unknown as DocumentNode<GetStreamInvitesQuery, GetStreamInvitesQueryVariables>;
export const GetOwnProjectInvitesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetOwnProjectInvites"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectInvites"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StreamInviteData"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StreamInviteData"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PendingStreamCollaborator"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"inviteId"}},{"kind":"Field","name":{"kind":"Name","value":"streamId"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"token"}},{"kind":"Field","name":{"kind":"Name","value":"invitedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"bio"}},{"kind":"Field","name":{"kind":"Name","value":"company"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"verified"}}]}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"bio"}},{"kind":"Field","name":{"kind":"Name","value":"company"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"verified"}}]}}]}}]} as unknown as DocumentNode<GetOwnProjectInvitesQuery, GetOwnProjectInvitesQueryVariables>;
export const UseStreamInviteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UseStreamInvite"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"accept"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"token"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"streamInviteUse"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"accept"},"value":{"kind":"Variable","name":{"kind":"Name","value":"accept"}}},{"kind":"Argument","name":{"kind":"Name","value":"streamId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}}},{"kind":"Argument","name":{"kind":"Name","value":"token"},"value":{"kind":"Variable","name":{"kind":"Name","value":"token"}}}]}]}}]} as unknown as DocumentNode<UseStreamInviteMutation, UseStreamInviteMutationVariables>;
export const CancelStreamInviteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CancelStreamInvite"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"inviteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"streamInviteCancel"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"streamId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}}},{"kind":"Argument","name":{"kind":"Name","value":"inviteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"inviteId"}}}]}]}}]} as unknown as DocumentNode<CancelStreamInviteMutation, CancelStreamInviteMutationVariables>;
export const GetStreamPendingCollaboratorsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetStreamPendingCollaborators"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stream"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"pendingCollaborators"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"inviteId"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"token"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetStreamPendingCollaboratorsQuery, GetStreamPendingCollaboratorsQueryVariables>;
export const CreateProjectInviteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateProjectInvite"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ProjectInviteCreateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"invites"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"create"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]}}]} as unknown as DocumentNode<CreateProjectInviteMutation, CreateProjectInviteMutationVariables>;
export const LeaveStreamDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"LeaveStream"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"streamLeave"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"streamId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}}}]}]}}]} as unknown as DocumentNode<LeaveStreamMutation, LeaveStreamMutationVariables>;
export const CreateStreamDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateStream"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"stream"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"StreamCreateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"streamCreate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"stream"},"value":{"kind":"Variable","name":{"kind":"Name","value":"stream"}}}]}]}}]} as unknown as DocumentNode<CreateStreamMutation, CreateStreamMutationVariables>;
export const UpdateStreamDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateStream"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"stream"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"StreamUpdateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"streamUpdate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"stream"},"value":{"kind":"Variable","name":{"kind":"Name","value":"stream"}}}]}]}}]} as unknown as DocumentNode<UpdateStreamMutation, UpdateStreamMutationVariables>;
export const ReadStreamDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ReadStream"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stream"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BasicStreamFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BasicStreamFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Stream"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"isDiscoverable"}},{"kind":"Field","name":{"kind":"Name","value":"allowPublicComments"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<ReadStreamQuery, ReadStreamQueryVariables>;
export const ReadStreamsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ReadStreams"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"streams"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BasicStreamFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BasicStreamFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Stream"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"isDiscoverable"}},{"kind":"Field","name":{"kind":"Name","value":"allowPublicComments"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<ReadStreamsQuery, ReadStreamsQueryVariables>;
export const ReadDiscoverableStreamsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ReadDiscoverableStreams"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},"defaultValue":{"kind":"IntValue","value":"25"}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sort"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"DiscoverableStreamsSortingInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"discoverableStreams"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}}},{"kind":"Argument","name":{"kind":"Name","value":"sort"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sort"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"favoritesCount"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"BasicStreamFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BasicStreamFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Stream"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"isDiscoverable"}},{"kind":"Field","name":{"kind":"Name","value":"allowPublicComments"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<ReadDiscoverableStreamsQuery, ReadDiscoverableStreamsQueryVariables>;
export const GetUserStreamsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetUserStreams"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},"defaultValue":{"kind":"IntValue","value":"25"}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"streams"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BasicStreamFields"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BasicStreamFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Stream"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"isDiscoverable"}},{"kind":"Field","name":{"kind":"Name","value":"allowPublicComments"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<GetUserStreamsQuery, GetUserStreamsQueryVariables>;
export const GetLimitedUserStreamsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetLimitedUserStreams"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},"defaultValue":{"kind":"IntValue","value":"25"}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"otherUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"streams"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BasicStreamFields"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BasicStreamFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Stream"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"isDiscoverable"}},{"kind":"Field","name":{"kind":"Name","value":"allowPublicComments"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<GetLimitedUserStreamsQuery, GetLimitedUserStreamsQueryVariables>;
export const GetActiveUserEmailsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetActiveUserEmails"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserWithEmails"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserWithEmails"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"emails"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"verified"}},{"kind":"Field","name":{"kind":"Name","value":"primary"}}]}}]}}]} as unknown as DocumentNode<GetActiveUserEmailsQuery, GetActiveUserEmailsQueryVariables>;
export const CreateUserEmailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateUserEmail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateUserEmailInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeUserMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"emailMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"create"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserWithEmails"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserWithEmails"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"emails"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"verified"}},{"kind":"Field","name":{"kind":"Name","value":"primary"}}]}}]}}]} as unknown as DocumentNode<CreateUserEmailMutation, CreateUserEmailMutationVariables>;
export const DeleteUserEmailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteUserEmail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DeleteUserEmailInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeUserMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"emailMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"delete"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserWithEmails"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserWithEmails"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"emails"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"verified"}},{"kind":"Field","name":{"kind":"Name","value":"primary"}}]}}]}}]} as unknown as DocumentNode<DeleteUserEmailMutation, DeleteUserEmailMutationVariables>;
export const SetPrimaryUserEmailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetPrimaryUserEmail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SetPrimaryUserEmailInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeUserMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"emailMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setPrimary"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserWithEmails"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserWithEmails"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"emails"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"verified"}},{"kind":"Field","name":{"kind":"Name","value":"primary"}}]}}]}}]} as unknown as DocumentNode<SetPrimaryUserEmailMutation, SetPrimaryUserEmailMutationVariables>;
export const GetActiveUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetActiveUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BaseUserFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BaseUserFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"bio"}},{"kind":"Field","name":{"kind":"Name","value":"company"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"verified"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]} as unknown as DocumentNode<GetActiveUserQuery, GetActiveUserQueryVariables>;
export const GetActiveUserWithWorkspaceJoinRequestsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetActiveUserWithWorkspaceJoinRequests"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BaseUserFields"}},{"kind":"Field","name":{"kind":"Name","value":"workspaceJoinRequests"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BaseUserFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"bio"}},{"kind":"Field","name":{"kind":"Name","value":"company"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"verified"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]} as unknown as DocumentNode<GetActiveUserWithWorkspaceJoinRequestsQuery, GetActiveUserWithWorkspaceJoinRequestsQueryVariables>;
export const GetOtherUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetOtherUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"otherUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BaseLimitedUserFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BaseLimitedUserFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LimitedUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"bio"}},{"kind":"Field","name":{"kind":"Name","value":"company"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"verified"}}]}}]} as unknown as DocumentNode<GetOtherUserQuery, GetOtherUserQueryVariables>;
export const GetAdminUsersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAdminUsers"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},"defaultValue":{"kind":"IntValue","value":"25"}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},"defaultValue":{"kind":"IntValue","value":"0"}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"query"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"defaultValue":{"kind":"NullValue"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminUsers"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}},{"kind":"Argument","name":{"kind":"Name","value":"query"},"value":{"kind":"Variable","name":{"kind":"Name","value":"query"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"registeredUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"invitedUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"invitedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetAdminUsersQuery, GetAdminUsersQueryVariables>;
export const GetPendingEmailVerificationStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetPendingEmailVerificationStatus"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasPendingVerification"}}]}}]}}]} as unknown as DocumentNode<GetPendingEmailVerificationStatusQuery, GetPendingEmailVerificationStatusQueryVariables>;
export const RequestVerificationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RequestVerification"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requestVerification"}}]}}]} as unknown as DocumentNode<RequestVerificationMutation, RequestVerificationMutationVariables>;
export const UserActiveResourcesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"UserActiveResources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeWorkspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"isProjectsActive"}}]}}]}}]} as unknown as DocumentNode<UserActiveResourcesQuery, UserActiveResourcesQueryVariables>;
export const SetUserActiveWorkspaceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetUserActiveWorkspace"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"slug"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"isProjectsActive"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeUserMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setActiveWorkspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"slug"},"value":{"kind":"Variable","name":{"kind":"Name","value":"slug"}}},{"kind":"Argument","name":{"kind":"Name","value":"isProjectsActive"},"value":{"kind":"Variable","name":{"kind":"Name","value":"isProjectsActive"}}}]}]}}]}}]} as unknown as DocumentNode<SetUserActiveWorkspaceMutation, SetUserActiveWorkspaceMutationVariables>;
export const CreateProjectVersionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateProjectVersion"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateVersionInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"versionMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"create"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"sourceApplication"}},{"kind":"Field","name":{"kind":"Name","value":"model"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"referencedObject"}}]}}]}}]}}]} as unknown as DocumentNode<CreateProjectVersionMutation, CreateProjectVersionMutationVariables>;
export const MarkProjectVersionReceivedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MarkProjectVersionReceived"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MarkReceivedVersionInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"versionMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markReceived"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]}}]} as unknown as DocumentNode<MarkProjectVersionReceivedMutation, MarkProjectVersionReceivedMutationVariables>;
export const CreateWorkspaceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateWorkspace"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"WorkspaceCreateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspaceMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"create"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TestWorkspace"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TestWorkspace"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Workspace"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"readOnly"}},{"kind":"Field","name":{"kind":"Name","value":"discoverabilityEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]} as unknown as DocumentNode<CreateWorkspaceMutation, CreateWorkspaceMutationVariables>;
export const DeleteWorkspaceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteWorkspace"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspaceMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"delete"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"workspaceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}]}]}}]}}]} as unknown as DocumentNode<DeleteWorkspaceMutation, DeleteWorkspaceMutationVariables>;
export const GetWorkspaceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetWorkspace"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TestWorkspace"}},{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TestWorkspaceCollaborator"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TestWorkspace"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Workspace"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"readOnly"}},{"kind":"Field","name":{"kind":"Name","value":"discoverabilityEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TestWorkspaceCollaborator"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"WorkspaceCollaborator"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"projectRoles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"project"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<GetWorkspaceQuery, GetWorkspaceQueryVariables>;
export const GetWorkspaceBySlugDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetWorkspaceBySlug"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceSlug"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspaceBySlug"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"slug"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceSlug"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TestWorkspace"}},{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TestWorkspaceCollaborator"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TestWorkspace"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Workspace"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"readOnly"}},{"kind":"Field","name":{"kind":"Name","value":"discoverabilityEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TestWorkspaceCollaborator"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"WorkspaceCollaborator"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"projectRoles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"project"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<GetWorkspaceBySlugQuery, GetWorkspaceBySlugQueryVariables>;
export const GetActiveUserDiscoverableWorkspacesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getActiveUserDiscoverableWorkspaces"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"discoverableWorkspaces"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetActiveUserDiscoverableWorkspacesQuery, GetActiveUserDiscoverableWorkspacesQueryVariables>;
export const UpdateWorkspaceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateWorkspace"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"WorkspaceUpdateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspaceMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"update"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TestWorkspace"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TestWorkspace"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Workspace"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"readOnly"}},{"kind":"Field","name":{"kind":"Name","value":"discoverabilityEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]} as unknown as DocumentNode<UpdateWorkspaceMutation, UpdateWorkspaceMutationVariables>;
export const GetActiveUserWorkspacesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetActiveUserWorkspaces"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"UserWorkspacesFilter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspaces"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TestWorkspace"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TestWorkspace"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Workspace"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"readOnly"}},{"kind":"Field","name":{"kind":"Name","value":"discoverabilityEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]} as unknown as DocumentNode<GetActiveUserWorkspacesQuery, GetActiveUserWorkspacesQueryVariables>;
export const UpdateWorkspaceRoleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateWorkspaceRole"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"WorkspaceRoleUpdateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspaceMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateRole"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TestWorkspaceCollaborator"}}]}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TestWorkspaceCollaborator"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"WorkspaceCollaborator"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"projectRoles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"project"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateWorkspaceRoleMutation, UpdateWorkspaceRoleMutationVariables>;
export const CreateWorkspaceProjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateWorkspaceProject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"WorkspaceProjectCreateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspaceMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projects"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"create"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TestWorkspaceProject"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TestWorkspaceProject"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]}}]} as unknown as DocumentNode<CreateWorkspaceProjectMutation, CreateWorkspaceProjectMutationVariables>;
export const GetWorkspaceProjectsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetWorkspaceProjects"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"WorkspaceProjectsFilter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projects"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}}},{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TestWorkspaceProject"}}]}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TestWorkspaceProject"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]}}]} as unknown as DocumentNode<GetWorkspaceProjectsQuery, GetWorkspaceProjectsQueryVariables>;
export const GetWorkspaceSsoDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetWorkspaceSso"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sso"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"provider"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"session"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"validUntil"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetWorkspaceSsoQuery, GetWorkspaceSsoQueryVariables>;
export const GetWorkspaceTeamDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetWorkspaceTeam"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"WorkspaceTeamFilter"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"team"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TestWorkspaceCollaborator"}}]}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TestWorkspaceCollaborator"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"WorkspaceCollaborator"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"projectRoles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"project"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<GetWorkspaceTeamQuery, GetWorkspaceTeamQueryVariables>;
export const ActiveUserLeaveWorkspaceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ActiveUserLeaveWorkspace"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspaceMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"leave"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]}}]} as unknown as DocumentNode<ActiveUserLeaveWorkspaceMutation, ActiveUserLeaveWorkspaceMutationVariables>;
export const ActiveUserProjectsWorkspaceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ActiveUserProjectsWorkspace"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"UserProjectsFilter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projects"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"workspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<ActiveUserProjectsWorkspaceQuery, ActiveUserProjectsWorkspaceQueryVariables>;
export const ActiveUserExpiredSsoSessionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ActiveUserExpiredSsoSessions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"expiredSsoSessions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}}]}}]}}]}}]} as unknown as DocumentNode<ActiveUserExpiredSsoSessionsQuery, ActiveUserExpiredSsoSessionsQueryVariables>;
export const MoveProjectToWorkspaceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MoveProjectToWorkspace"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspaceMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projects"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"moveToWorkspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}},{"kind":"Argument","name":{"kind":"Name","value":"workspaceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"workspaceId"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<MoveProjectToWorkspaceMutation, MoveProjectToWorkspaceMutationVariables>;
export const UpdateEmbedOptionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateEmbedOptions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"WorkspaceUpdateEmbedOptionsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspaceMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateEmbedOptions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hideSpeckleBranding"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateEmbedOptionsMutation, UpdateEmbedOptionsMutationVariables>;
export const WorkspaceEmbedOptionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"WorkspaceEmbedOptions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"embedOptions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hideSpeckleBranding"}}]}}]}}]}}]} as unknown as DocumentNode<WorkspaceEmbedOptionsQuery, WorkspaceEmbedOptionsQueryVariables>;
export const ProjectEmbedOptionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectEmbedOptions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"embedOptions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hideSpeckleBranding"}}]}}]}}]}}]} as unknown as DocumentNode<ProjectEmbedOptionsQuery, ProjectEmbedOptionsQueryVariables>;