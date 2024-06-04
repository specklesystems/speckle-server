export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  /** The `BigInt` scalar type represents non-fractional signed whole numeric values. */
  BigInt: bigint;
  /** A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
  DateTime: string;
  EmailAddress: any;
  /** The `JSONObject` scalar type represents JSON objects as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSONObject: Record<string, unknown>;
};

export type ActiveUserMutations = {
  __typename?: 'ActiveUserMutations';
  /** Mark onboarding as complete */
  finishOnboarding: Scalars['Boolean'];
  /** Edit a user's profile */
  update: User;
};


export type ActiveUserMutationsUpdateArgs = {
  user: UserUpdateInput;
};

export type Activity = {
  __typename?: 'Activity';
  actionType: Scalars['String'];
  id: Scalars['ID'];
  info: Scalars['JSONObject'];
  message: Scalars['String'];
  resourceId: Scalars['String'];
  resourceType: Scalars['String'];
  streamId?: Maybe<Scalars['String']>;
  time: Scalars['DateTime'];
  userId: Scalars['String'];
};

export type ActivityCollection = {
  __typename?: 'ActivityCollection';
  cursor?: Maybe<Scalars['String']>;
  items?: Maybe<Array<Maybe<Activity>>>;
  totalCount: Scalars['Int'];
};

export type AdminInviteList = {
  __typename?: 'AdminInviteList';
  cursor?: Maybe<Scalars['String']>;
  items: Array<ServerInvite>;
  totalCount: Scalars['Int'];
};

export type AdminQueries = {
  __typename?: 'AdminQueries';
  inviteList: AdminInviteList;
  projectList: ProjectCollection;
  serverStatistics: ServerStatistics;
  userList: AdminUserList;
};


export type AdminQueriesInviteListArgs = {
  cursor?: InputMaybe<Scalars['String']>;
  limit?: Scalars['Int'];
  query?: InputMaybe<Scalars['String']>;
};


export type AdminQueriesProjectListArgs = {
  cursor?: InputMaybe<Scalars['String']>;
  limit?: Scalars['Int'];
  orderBy?: InputMaybe<Scalars['String']>;
  query?: InputMaybe<Scalars['String']>;
  visibility?: InputMaybe<Scalars['String']>;
};


export type AdminQueriesUserListArgs = {
  cursor?: InputMaybe<Scalars['String']>;
  limit?: Scalars['Int'];
  query?: InputMaybe<Scalars['String']>;
  role?: InputMaybe<ServerRole>;
};

export type AdminUserList = {
  __typename?: 'AdminUserList';
  cursor?: Maybe<Scalars['String']>;
  items: Array<AdminUserListItem>;
  totalCount: Scalars['Int'];
};

export type AdminUserListItem = {
  __typename?: 'AdminUserListItem';
  avatar?: Maybe<Scalars['String']>;
  company?: Maybe<Scalars['String']>;
  email?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  name: Scalars['String'];
  role?: Maybe<Scalars['String']>;
  verified?: Maybe<Scalars['Boolean']>;
};

export type AdminUsersListCollection = {
  __typename?: 'AdminUsersListCollection';
  items: Array<AdminUsersListItem>;
  totalCount: Scalars['Int'];
};

/**
 * A representation of a registered or invited user in the admin users list. Either registeredUser
 * or invitedUser will always be set, both values can't be null.
 */
export type AdminUsersListItem = {
  __typename?: 'AdminUsersListItem';
  id: Scalars['String'];
  invitedUser?: Maybe<ServerInvite>;
  registeredUser?: Maybe<User>;
};

export type ApiToken = {
  __typename?: 'ApiToken';
  createdAt: Scalars['DateTime'];
  id: Scalars['String'];
  lastChars: Scalars['String'];
  lastUsed: Scalars['DateTime'];
  lifespan: Scalars['BigInt'];
  name: Scalars['String'];
  scopes: Array<Maybe<Scalars['String']>>;
};

export type ApiTokenCreateInput = {
  lifespan?: InputMaybe<Scalars['BigInt']>;
  name: Scalars['String'];
  scopes: Array<Scalars['String']>;
};

export type AppAuthor = {
  __typename?: 'AppAuthor';
  avatar?: Maybe<Scalars['String']>;
  id: Scalars['String'];
  name: Scalars['String'];
};

export type AppCreateInput = {
  description: Scalars['String'];
  logo?: InputMaybe<Scalars['String']>;
  name: Scalars['String'];
  public?: InputMaybe<Scalars['Boolean']>;
  redirectUrl: Scalars['String'];
  scopes: Array<InputMaybe<Scalars['String']>>;
  termsAndConditionsLink?: InputMaybe<Scalars['String']>;
};

export type AppTokenCreateInput = {
  lifespan?: InputMaybe<Scalars['BigInt']>;
  /** Optionally limit the token to only have access to specific resources */
  limitResources?: InputMaybe<Array<TokenResourceIdentifierInput>>;
  name: Scalars['String'];
  scopes: Array<Scalars['String']>;
};

export type AppUpdateInput = {
  description: Scalars['String'];
  id: Scalars['String'];
  logo?: InputMaybe<Scalars['String']>;
  name: Scalars['String'];
  public?: InputMaybe<Scalars['Boolean']>;
  redirectUrl: Scalars['String'];
  scopes: Array<InputMaybe<Scalars['String']>>;
  termsAndConditionsLink?: InputMaybe<Scalars['String']>;
};

export type AuthStrategy = {
  __typename?: 'AuthStrategy';
  color?: Maybe<Scalars['String']>;
  icon: Scalars['String'];
  id: Scalars['String'];
  name: Scalars['String'];
  url: Scalars['String'];
};

export type AutomateFunction = {
  __typename?: 'AutomateFunction';
  automationCount: Scalars['Int'];
  description: Scalars['String'];
  id: Scalars['ID'];
  isFeatured: Scalars['Boolean'];
  logo?: Maybe<Scalars['String']>;
  name: Scalars['String'];
  releases: AutomateFunctionReleaseCollection;
  repo: BasicGitRepositoryMetadata;
  /** SourceAppNames values from @speckle/shared. Empty array means - all of them */
  supportedSourceApps: Array<Scalars['String']>;
  tags: Array<Scalars['String']>;
};


export type AutomateFunctionReleasesArgs = {
  cursor?: InputMaybe<Scalars['String']>;
  filter?: InputMaybe<AutomateFunctionReleasesFilter>;
  limit?: InputMaybe<Scalars['Int']>;
};

export type AutomateFunctionCollection = {
  __typename?: 'AutomateFunctionCollection';
  cursor?: Maybe<Scalars['String']>;
  items: Array<AutomateFunction>;
  totalCount: Scalars['Int'];
};

export type AutomateFunctionRelease = {
  __typename?: 'AutomateFunctionRelease';
  commitId: Scalars['String'];
  createdAt: Scalars['DateTime'];
  function: AutomateFunction;
  functionId: Scalars['String'];
  id: Scalars['ID'];
  inputSchema?: Maybe<Scalars['JSONObject']>;
  versionTag: Scalars['String'];
};

export type AutomateFunctionReleaseCollection = {
  __typename?: 'AutomateFunctionReleaseCollection';
  cursor?: Maybe<Scalars['String']>;
  items: Array<AutomateFunctionRelease>;
  totalCount: Scalars['Int'];
};

export type AutomateFunctionReleasesFilter = {
  search?: InputMaybe<Scalars['String']>;
};

export type AutomateFunctionRun = {
  __typename?: 'AutomateFunctionRun';
  contextView?: Maybe<Scalars['String']>;
  createdAt: Scalars['DateTime'];
  elapsed: Scalars['Float'];
  /** Nullable, in case the function is not retrievable due to poor network conditions */
  function?: Maybe<AutomateFunction>;
  functionId?: Maybe<Scalars['String']>;
  functionReleaseId?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  /** AutomateTypes.ResultsSchema type from @speckle/shared */
  results?: Maybe<Scalars['JSONObject']>;
  status: AutomateRunStatus;
  statusMessage?: Maybe<Scalars['String']>;
  updatedAt: Scalars['DateTime'];
};

export type AutomateFunctionRunStatusReportInput = {
  contextView?: InputMaybe<Scalars['String']>;
  functionRunId: Scalars['String'];
  /** AutomateTypes.ResultsSchema type from @speckle/shared */
  results?: InputMaybe<Scalars['JSONObject']>;
  status: AutomateRunStatus;
  statusMessage?: InputMaybe<Scalars['String']>;
};

export type AutomateFunctionTemplate = {
  __typename?: 'AutomateFunctionTemplate';
  id: AutomateFunctionTemplateLanguage;
  logo: Scalars['String'];
  title: Scalars['String'];
  url: Scalars['String'];
};

export enum AutomateFunctionTemplateLanguage {
  DotNet = 'DOT_NET',
  Python = 'PYTHON',
  Typescript = 'TYPESCRIPT'
}

export type AutomateFunctionsFilter = {
  featuredFunctionsOnly?: InputMaybe<Scalars['Boolean']>;
  /** By default we skip functions without releases. Set this to true to include them. */
  functionsWithoutReleases?: InputMaybe<Scalars['Boolean']>;
  search?: InputMaybe<Scalars['String']>;
};

export type AutomateMutations = {
  __typename?: 'AutomateMutations';
  createFunction: AutomateFunction;
  updateFunction: AutomateFunction;
};


export type AutomateMutationsCreateFunctionArgs = {
  input: CreateAutomateFunctionInput;
};


export type AutomateMutationsUpdateFunctionArgs = {
  input: UpdateAutomateFunctionInput;
};

export type AutomateRun = {
  __typename?: 'AutomateRun';
  automation: Automation;
  automationId: Scalars['String'];
  createdAt: Scalars['DateTime'];
  functionRuns: Array<AutomateFunctionRun>;
  id: Scalars['ID'];
  status: AutomateRunStatus;
  trigger: AutomationRunTrigger;
  updatedAt: Scalars['DateTime'];
};

export type AutomateRunCollection = {
  __typename?: 'AutomateRunCollection';
  cursor?: Maybe<Scalars['String']>;
  items: Array<AutomateRun>;
  totalCount: Scalars['Int'];
};

export enum AutomateRunStatus {
  Canceled = 'CANCELED',
  Exception = 'EXCEPTION',
  Failed = 'FAILED',
  Initializing = 'INITIALIZING',
  Pending = 'PENDING',
  Running = 'RUNNING',
  Succeeded = 'SUCCEEDED',
  Timeout = 'TIMEOUT'
}

export enum AutomateRunTriggerType {
  TestType = 'TEST_TYPE',
  VersionCreated = 'VERSION_CREATED'
}

export type Automation = {
  __typename?: 'Automation';
  createdAt: Scalars['DateTime'];
  /** Only accessible to automation owners */
  creationPublicKeys: Array<Scalars['String']>;
  currentRevision?: Maybe<AutomationRevision>;
  enabled: Scalars['Boolean'];
  id: Scalars['ID'];
  isTestAutomation: Scalars['Boolean'];
  name: Scalars['String'];
  runs: AutomateRunCollection;
  updatedAt: Scalars['DateTime'];
};


export type AutomationRunsArgs = {
  cursor?: InputMaybe<Scalars['String']>;
  limit?: InputMaybe<Scalars['Int']>;
};

export type AutomationCollection = {
  __typename?: 'AutomationCollection';
  cursor?: Maybe<Scalars['String']>;
  items: Array<Automation>;
  totalCount: Scalars['Int'];
};

export type AutomationCreateInput = {
  automationId: Scalars['String'];
  automationName: Scalars['String'];
  automationRevisionId: Scalars['String'];
  modelId: Scalars['String'];
  projectId: Scalars['String'];
  webhookId?: InputMaybe<Scalars['String']>;
};

export type AutomationFunctionRun = {
  __typename?: 'AutomationFunctionRun';
  contextView?: Maybe<Scalars['String']>;
  elapsed: Scalars['Float'];
  functionId: Scalars['String'];
  functionLogo?: Maybe<Scalars['String']>;
  functionName: Scalars['String'];
  id: Scalars['ID'];
  resultVersions: Array<Version>;
  /**
   * NOTE: this is the schema for the results field below!
   * Current schema: {
   *   version: "1.0.0",
   *   values: {
   *     objectResults: Record<str, {
   *       category: string
   *       level: ObjectResultLevel
   *       objectIds: string[]
   *       message: str | null
   *       metadata: Records<str, unknown> | null
   *       visualoverrides: Records<str, unknown> | null
   *     }[]>
   *     blobIds?: string[]
   *   }
   * }
   */
  results?: Maybe<Scalars['JSONObject']>;
  status: AutomationRunStatus;
  statusMessage?: Maybe<Scalars['String']>;
};

export type AutomationMutations = {
  __typename?: 'AutomationMutations';
  create: Scalars['Boolean'];
  functionRunStatusReport: Scalars['Boolean'];
};


export type AutomationMutationsCreateArgs = {
  input: AutomationCreateInput;
};


export type AutomationMutationsFunctionRunStatusReportArgs = {
  input: AutomationRunStatusUpdateInput;
};

export type AutomationRevision = {
  __typename?: 'AutomationRevision';
  functions: Array<AutomationRevisionFunction>;
  id: Scalars['ID'];
  triggerDefinitions: Array<AutomationRevisionTriggerDefinition>;
};

export type AutomationRevisionCreateFunctionInput = {
  functionId: Scalars['String'];
  functionReleaseId: Scalars['String'];
  /** Should be encrypted from the client side */
  parameters?: InputMaybe<Scalars['String']>;
};

export type AutomationRevisionFunction = {
  __typename?: 'AutomationRevisionFunction';
  /** The secrets in parameters are redacted with six asterisks - ****** */
  parameters?: Maybe<Scalars['JSONObject']>;
  release: AutomateFunctionRelease;
};

export type AutomationRevisionTriggerDefinition = VersionCreatedTriggerDefinition;

export type AutomationRun = {
  __typename?: 'AutomationRun';
  automationId: Scalars['String'];
  automationName: Scalars['String'];
  createdAt: Scalars['DateTime'];
  functionRuns: Array<AutomationFunctionRun>;
  id: Scalars['ID'];
  /** Resolved from all function run statuses */
  status: AutomationRunStatus;
  updatedAt: Scalars['DateTime'];
  versionId: Scalars['String'];
};

export enum AutomationRunStatus {
  Failed = 'FAILED',
  Initializing = 'INITIALIZING',
  Running = 'RUNNING',
  Succeeded = 'SUCCEEDED'
}

export type AutomationRunStatusUpdateInput = {
  automationId: Scalars['String'];
  automationRevisionId: Scalars['String'];
  automationRunId: Scalars['String'];
  functionRuns: Array<FunctionRunStatusInput>;
  versionId: Scalars['String'];
};

export type AutomationRunTrigger = VersionCreatedTrigger;

export type AutomationsStatus = {
  __typename?: 'AutomationsStatus';
  automationRuns: Array<AutomationRun>;
  id: Scalars['ID'];
  status: AutomationRunStatus;
  statusMessage?: Maybe<Scalars['String']>;
};

export type AvatarUser = {
  __typename?: 'AvatarUser';
  avatar?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  name: Scalars['String'];
};

export type BasicGitRepositoryMetadata = {
  __typename?: 'BasicGitRepositoryMetadata';
  id: Scalars['ID'];
  name: Scalars['String'];
  owner: Scalars['String'];
  url: Scalars['String'];
};

export type BlobMetadata = {
  __typename?: 'BlobMetadata';
  createdAt: Scalars['DateTime'];
  fileHash?: Maybe<Scalars['String']>;
  fileName: Scalars['String'];
  fileSize?: Maybe<Scalars['Int']>;
  fileType: Scalars['String'];
  id: Scalars['String'];
  streamId: Scalars['String'];
  uploadError?: Maybe<Scalars['String']>;
  uploadStatus: Scalars['Int'];
  userId: Scalars['String'];
};

export type BlobMetadataCollection = {
  __typename?: 'BlobMetadataCollection';
  cursor?: Maybe<Scalars['String']>;
  items?: Maybe<Array<BlobMetadata>>;
  totalCount: Scalars['Int'];
  totalSize: Scalars['Int'];
};

export type Branch = {
  __typename?: 'Branch';
  /** All the recent activity on this branch in chronological order */
  activity?: Maybe<ActivityCollection>;
  author?: Maybe<User>;
  commits?: Maybe<CommitCollection>;
  createdAt?: Maybe<Scalars['DateTime']>;
  description?: Maybe<Scalars['String']>;
  id: Scalars['String'];
  name: Scalars['String'];
};


export type BranchActivityArgs = {
  actionType?: InputMaybe<Scalars['String']>;
  after?: InputMaybe<Scalars['DateTime']>;
  before?: InputMaybe<Scalars['DateTime']>;
  cursor?: InputMaybe<Scalars['DateTime']>;
  limit?: Scalars['Int'];
};


export type BranchCommitsArgs = {
  cursor?: InputMaybe<Scalars['String']>;
  limit?: Scalars['Int'];
};

export type BranchCollection = {
  __typename?: 'BranchCollection';
  cursor?: Maybe<Scalars['String']>;
  items?: Maybe<Array<Branch>>;
  totalCount: Scalars['Int'];
};

export type BranchCreateInput = {
  description?: InputMaybe<Scalars['String']>;
  name: Scalars['String'];
  streamId: Scalars['String'];
};

export type BranchDeleteInput = {
  id: Scalars['String'];
  streamId: Scalars['String'];
};

export type BranchUpdateInput = {
  description?: InputMaybe<Scalars['String']>;
  id: Scalars['String'];
  name?: InputMaybe<Scalars['String']>;
  streamId: Scalars['String'];
};

export type Comment = {
  __typename?: 'Comment';
  archived: Scalars['Boolean'];
  author: LimitedUser;
  authorId: Scalars['String'];
  createdAt: Scalars['DateTime'];
  /**
   * Legacy comment viewer data field
   * @deprecated Use the new viewerState field instead
   */
  data?: Maybe<Scalars['JSONObject']>;
  /** Whether or not comment is a reply to another comment */
  hasParent: Scalars['Boolean'];
  id: Scalars['String'];
  /** Parent thread, if there's any */
  parent?: Maybe<Comment>;
  /** Plain-text version of the comment text, ideal for previews */
  rawText: Scalars['String'];
  /** @deprecated Not actually implemented */
  reactions?: Maybe<Array<Maybe<Scalars['String']>>>;
  /** Gets the replies to this comment. */
  replies: CommentCollection;
  /** Get authors of replies to this comment */
  replyAuthors: CommentReplyAuthorCollection;
  /** Resources that this comment targets. Can be a mixture of either one stream, or multiple commits and objects. */
  resources: Array<ResourceIdentifier>;
  screenshot?: Maybe<Scalars['String']>;
  text: SmartTextEditorValue;
  /** The time this comment was last updated. Corresponds also to the latest reply to this comment, if any. */
  updatedAt: Scalars['DateTime'];
  /** The last time you viewed this comment. Present only if an auth'ed request. Relevant only if a top level commit. */
  viewedAt?: Maybe<Scalars['DateTime']>;
  /** Resource identifiers as defined and implemented in the Viewer of the new frontend */
  viewerResources: Array<ViewerResourceItem>;
  /** SerializedViewerState */
  viewerState?: Maybe<Scalars['JSONObject']>;
};


export type CommentRepliesArgs = {
  cursor?: InputMaybe<Scalars['String']>;
  limit?: InputMaybe<Scalars['Int']>;
};


export type CommentReplyAuthorsArgs = {
  limit?: Scalars['Int'];
};

export type CommentActivityMessage = {
  __typename?: 'CommentActivityMessage';
  comment: Comment;
  type: Scalars['String'];
};

export type CommentCollection = {
  __typename?: 'CommentCollection';
  cursor?: Maybe<Scalars['String']>;
  items: Array<Comment>;
  totalCount: Scalars['Int'];
};

export type CommentContentInput = {
  blobIds?: InputMaybe<Array<Scalars['String']>>;
  doc?: InputMaybe<Scalars['JSONObject']>;
};

/** Deprecated: Used by old stream-based mutations */
export type CommentCreateInput = {
  /** IDs of uploaded blobs that should be attached to this comment */
  blobIds: Array<Scalars['String']>;
  data: Scalars['JSONObject'];
  /**
   * Specifies the resources this comment is linked to. There are several use cases:
   * - a comment targets only one resource (commit or object)
   * - a comment targets one or more resources (commits or objects)
   * - a comment targets only a stream
   */
  resources: Array<InputMaybe<ResourceIdentifierInput>>;
  screenshot?: InputMaybe<Scalars['String']>;
  streamId: Scalars['String'];
  /** ProseMirror document object */
  text?: InputMaybe<Scalars['JSONObject']>;
};

export type CommentDataFilters = {
  __typename?: 'CommentDataFilters';
  hiddenIds?: Maybe<Array<Scalars['String']>>;
  isolatedIds?: Maybe<Array<Scalars['String']>>;
  passMax?: Maybe<Scalars['Float']>;
  passMin?: Maybe<Scalars['Float']>;
  propertyInfoKey?: Maybe<Scalars['String']>;
  sectionBox?: Maybe<Scalars['JSONObject']>;
};

/** Equivalent to frontend-1's LocalFilterState */
export type CommentDataFiltersInput = {
  hiddenIds?: InputMaybe<Array<Scalars['String']>>;
  isolatedIds?: InputMaybe<Array<Scalars['String']>>;
  passMax?: InputMaybe<Scalars['Float']>;
  passMin?: InputMaybe<Scalars['Float']>;
  propertyInfoKey?: InputMaybe<Scalars['String']>;
  sectionBox?: InputMaybe<Scalars['JSONObject']>;
};

/** Deprecated: Used by old stream-based mutations */
export type CommentEditInput = {
  /** IDs of uploaded blobs that should be attached to this comment */
  blobIds: Array<Scalars['String']>;
  id: Scalars['String'];
  streamId: Scalars['String'];
  /** ProseMirror document object */
  text?: InputMaybe<Scalars['JSONObject']>;
};

export type CommentMutations = {
  __typename?: 'CommentMutations';
  archive: Scalars['Boolean'];
  create: Comment;
  edit: Comment;
  markViewed: Scalars['Boolean'];
  reply: Comment;
};


export type CommentMutationsArchiveArgs = {
  archived?: Scalars['Boolean'];
  commentId: Scalars['String'];
};


export type CommentMutationsCreateArgs = {
  input: CreateCommentInput;
};


export type CommentMutationsEditArgs = {
  input: EditCommentInput;
};


export type CommentMutationsMarkViewedArgs = {
  commentId: Scalars['String'];
};


export type CommentMutationsReplyArgs = {
  input: CreateCommentReplyInput;
};

export type CommentReplyAuthorCollection = {
  __typename?: 'CommentReplyAuthorCollection';
  items: Array<LimitedUser>;
  totalCount: Scalars['Int'];
};

export type CommentThreadActivityMessage = {
  __typename?: 'CommentThreadActivityMessage';
  data?: Maybe<Scalars['JSONObject']>;
  reply?: Maybe<Comment>;
  type: Scalars['String'];
};

export type Commit = {
  __typename?: 'Commit';
  /** All the recent activity on this commit in chronological order */
  activity?: Maybe<ActivityCollection>;
  authorAvatar?: Maybe<Scalars['String']>;
  authorId?: Maybe<Scalars['String']>;
  authorName?: Maybe<Scalars['String']>;
  branch?: Maybe<Branch>;
  branchName?: Maybe<Scalars['String']>;
  /**
   * The total number of comments for this commit. To actually get the comments, use the comments query and pass in a resource array consisting of of this commit's id.
   * E.g.,
   * ```
   * query{
   *   comments(streamId:"streamId" resources:[{resourceType: commit, resourceId:"commitId"}] ){
   *     ...
   *   }
   * ```
   */
  commentCount: Scalars['Int'];
  createdAt?: Maybe<Scalars['DateTime']>;
  id: Scalars['String'];
  message?: Maybe<Scalars['String']>;
  parents?: Maybe<Array<Maybe<Scalars['String']>>>;
  referencedObject: Scalars['String'];
  sourceApplication?: Maybe<Scalars['String']>;
  /**
   * Will throw an authorization error if active user isn't authorized to see it, for example,
   * if a stream isn't public and the user doesn't have the appropriate rights.
   */
  stream: Stream;
  /** @deprecated Use the stream field instead */
  streamId?: Maybe<Scalars['String']>;
  /** @deprecated Use the stream field instead */
  streamName?: Maybe<Scalars['String']>;
  totalChildrenCount?: Maybe<Scalars['Int']>;
};


export type CommitActivityArgs = {
  actionType?: InputMaybe<Scalars['String']>;
  after?: InputMaybe<Scalars['DateTime']>;
  before?: InputMaybe<Scalars['DateTime']>;
  cursor?: InputMaybe<Scalars['DateTime']>;
  limit?: Scalars['Int'];
};

export type CommitCollection = {
  __typename?: 'CommitCollection';
  cursor?: Maybe<Scalars['String']>;
  items?: Maybe<Array<Commit>>;
  totalCount: Scalars['Int'];
};

export type CommitCreateInput = {
  branchName: Scalars['String'];
  message?: InputMaybe<Scalars['String']>;
  objectId: Scalars['String'];
  parents?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  /**
   * **DEPRECATED** Use the `parents` field.
   * @deprecated Field no longer supported
   */
  previousCommitIds?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  sourceApplication?: InputMaybe<Scalars['String']>;
  streamId: Scalars['String'];
  totalChildrenCount?: InputMaybe<Scalars['Int']>;
};

export type CommitDeleteInput = {
  id: Scalars['String'];
  streamId: Scalars['String'];
};

export type CommitReceivedInput = {
  commitId: Scalars['String'];
  message?: InputMaybe<Scalars['String']>;
  sourceApplication: Scalars['String'];
  streamId: Scalars['String'];
};

export type CommitUpdateInput = {
  id: Scalars['String'];
  message?: InputMaybe<Scalars['String']>;
  /** To move the commit to a different branch, please the name of the branch. */
  newBranchName?: InputMaybe<Scalars['String']>;
  streamId: Scalars['String'];
};

export type CommitsDeleteInput = {
  commitIds: Array<Scalars['String']>;
};

export type CommitsMoveInput = {
  commitIds: Array<Scalars['String']>;
  targetBranch: Scalars['String'];
};

/**
 * Can be used instead of a full item collection, when the implementation doesn't call for it yet. Because
 * of the structure, it can be swapped out to a full item collection in the future
 */
export type CountOnlyCollection = {
  __typename?: 'CountOnlyCollection';
  totalCount: Scalars['Int'];
};

export type CreateAutomateFunctionInput = {
  description: Scalars['String'];
  /** Base64 encoded image data string */
  logo?: InputMaybe<Scalars['String']>;
  name: Scalars['String'];
  /** GitHub organization to create the repository in */
  org?: InputMaybe<Scalars['String']>;
  /** SourceAppNames values from @speckle/shared */
  supportedSourceApps: Array<Scalars['String']>;
  tags: Array<Scalars['String']>;
  template: AutomateFunctionTemplateLanguage;
};

export type CreateCommentInput = {
  content: CommentContentInput;
  projectId: Scalars['String'];
  /** Resources that this comment should be attached to */
  resourceIdString: Scalars['String'];
  screenshot?: InputMaybe<Scalars['String']>;
  /**
   * SerializedViewerState. If omitted, comment won't render (correctly) inside the
   * viewer, but will still be retrievable through the API
   */
  viewerState?: InputMaybe<Scalars['JSONObject']>;
};

export type CreateCommentReplyInput = {
  content: CommentContentInput;
  threadId: Scalars['String'];
};

export type CreateModelInput = {
  description?: InputMaybe<Scalars['String']>;
  name: Scalars['String'];
  projectId: Scalars['ID'];
};

export type DeleteModelInput = {
  id: Scalars['ID'];
  projectId: Scalars['ID'];
};

export type DeleteVersionsInput = {
  versionIds: Array<Scalars['String']>;
};

export enum DiscoverableStreamsSortType {
  CreatedDate = 'CREATED_DATE',
  FavoritesCount = 'FAVORITES_COUNT'
}

export type DiscoverableStreamsSortingInput = {
  direction: SortDirection;
  type: DiscoverableStreamsSortType;
};

export type EditCommentInput = {
  commentId: Scalars['String'];
  content: CommentContentInput;
};

export type FileUpload = {
  __typename?: 'FileUpload';
  branchName: Scalars['String'];
  /** If present, the conversion result is stored in this commit. */
  convertedCommitId?: Maybe<Scalars['String']>;
  convertedLastUpdate: Scalars['DateTime'];
  /** Holds any errors or info. */
  convertedMessage?: Maybe<Scalars['String']>;
  /** 0 = queued, 1 = processing, 2 = success, 3 = error */
  convertedStatus: Scalars['Int'];
  /** Alias for convertedCommitId */
  convertedVersionId?: Maybe<Scalars['String']>;
  fileName: Scalars['String'];
  fileSize: Scalars['Int'];
  fileType: Scalars['String'];
  id: Scalars['String'];
  /** Model associated with the file upload, if it exists already */
  model?: Maybe<Model>;
  /** Alias for branchName */
  modelName: Scalars['String'];
  /** Alias for streamId */
  projectId: Scalars['String'];
  streamId: Scalars['String'];
  uploadComplete: Scalars['Boolean'];
  uploadDate: Scalars['DateTime'];
  /** The user's id that uploaded this file. */
  userId: Scalars['String'];
};

export type FunctionRunStatusInput = {
  contextView?: InputMaybe<Scalars['String']>;
  elapsed: Scalars['Float'];
  functionId: Scalars['String'];
  functionLogo?: InputMaybe<Scalars['String']>;
  functionName: Scalars['String'];
  resultVersionIds: Array<Scalars['String']>;
  /**
   * Current schema: {
   *   version: "1.0.0",
   *   values: {
   *     speckleObjects: Record<ObjectId, {level: string; statusMessage: string}[]>
   *     blobIds?: string[]
   *   }
   * }
   */
  results?: InputMaybe<Scalars['JSONObject']>;
  status: AutomationRunStatus;
  statusMessage?: InputMaybe<Scalars['String']>;
};

export type GendoAiRender = {
  __typename?: 'GendoAIRender';
  camera?: Maybe<Scalars['JSONObject']>;
  createdAt: Scalars['String'];
  gendoGenerationId?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  modelId: Scalars['String'];
  projectId: Scalars['String'];
  prompt: Scalars['String'];
  /** This is a blob id. */
  responseImage?: Maybe<Scalars['String']>;
  status: Scalars['String'];
  updatedAt: Scalars['String'];
  user?: Maybe<AvatarUser>;
  userId: Scalars['String'];
  versionId: Scalars['String'];
};

export type GendoAiRenderCollection = {
  __typename?: 'GendoAIRenderCollection';
  items: Array<Maybe<GendoAiRender>>;
  totalCount: Scalars['Int'];
};

export type GendoAiRenderInput = {
  /** Base64 encoded image of the depthmap. */
  baseImage: Scalars['String'];
  camera: Scalars['JSONObject'];
  modelId: Scalars['ID'];
  projectId: Scalars['ID'];
  /** The generation prompt. */
  prompt: Scalars['String'];
  versionId: Scalars['ID'];
};

export type LegacyCommentViewerData = {
  __typename?: 'LegacyCommentViewerData';
  /**
   * An array representing a user's camera position:
   * [camPos.x, camPos.y, camPos.z, camTarget.x, camTarget.y, camTarget.z, isOrtho, zoomNumber]
   */
  camPos: Array<Scalars['Float']>;
  /** Old FE LocalFilterState type */
  filters: CommentDataFilters;
  /** THREE.Vector3 {x, y, z} */
  location: Scalars['JSONObject'];
  /** Viewer.getCurrentSectionBox(): THREE.Box3 */
  sectionBox?: Maybe<Scalars['JSONObject']>;
  /** Currently unused. Ideally comments should keep track of selected objects. */
  selection?: Maybe<Scalars['JSONObject']>;
};

/**
 * Limited user type, for showing public info about a user
 * to another user
 */
export type LimitedUser = {
  __typename?: 'LimitedUser';
  /** All the recent activity from this user in chronological order */
  activity?: Maybe<ActivityCollection>;
  avatar?: Maybe<Scalars['String']>;
  bio?: Maybe<Scalars['String']>;
  /** Get public stream commits authored by the user */
  commits?: Maybe<CommitCollection>;
  company?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  name: Scalars['String'];
  role?: Maybe<Scalars['String']>;
  /** Returns all discoverable streams that the user is a collaborator on */
  streams: StreamCollection;
  /** The user's timeline in chronological order */
  timeline?: Maybe<ActivityCollection>;
  /** Total amount of favorites attached to streams owned by the user */
  totalOwnedStreamsFavorites: Scalars['Int'];
  verified?: Maybe<Scalars['Boolean']>;
};


/**
 * Limited user type, for showing public info about a user
 * to another user
 */
export type LimitedUserActivityArgs = {
  actionType?: InputMaybe<Scalars['String']>;
  after?: InputMaybe<Scalars['DateTime']>;
  before?: InputMaybe<Scalars['DateTime']>;
  cursor?: InputMaybe<Scalars['DateTime']>;
  limit?: Scalars['Int'];
};


/**
 * Limited user type, for showing public info about a user
 * to another user
 */
export type LimitedUserCommitsArgs = {
  cursor?: InputMaybe<Scalars['String']>;
  limit?: Scalars['Int'];
};


/**
 * Limited user type, for showing public info about a user
 * to another user
 */
export type LimitedUserStreamsArgs = {
  cursor?: InputMaybe<Scalars['String']>;
  limit?: Scalars['Int'];
};


/**
 * Limited user type, for showing public info about a user
 * to another user
 */
export type LimitedUserTimelineArgs = {
  after?: InputMaybe<Scalars['DateTime']>;
  before?: InputMaybe<Scalars['DateTime']>;
  cursor?: InputMaybe<Scalars['DateTime']>;
  limit?: Scalars['Int'];
};

export type Model = {
  __typename?: 'Model';
  author: LimitedUser;
  automationStatus?: Maybe<AutomationsStatus>;
  automationsStatus?: Maybe<TriggeredAutomationsStatus>;
  /** Return a model tree of children */
  childrenTree: Array<ModelsTreeItem>;
  /** All comment threads in this model */
  commentThreads: CommentCollection;
  createdAt: Scalars['DateTime'];
  description?: Maybe<Scalars['String']>;
  /** The shortened/display name that doesn't include the names of parent models */
  displayName: Scalars['String'];
  id: Scalars['ID'];
  /** Full name including the names of parent models delimited by forward slashes */
  name: Scalars['String'];
  /** Returns a list of versions that are being created from a file import */
  pendingImportedVersions: Array<FileUpload>;
  previewUrl?: Maybe<Scalars['String']>;
  updatedAt: Scalars['DateTime'];
  version: Version;
  versions: VersionCollection;
};


export type ModelCommentThreadsArgs = {
  cursor?: InputMaybe<Scalars['String']>;
  limit?: Scalars['Int'];
};


export type ModelPendingImportedVersionsArgs = {
  limit?: InputMaybe<Scalars['Int']>;
};


export type ModelVersionArgs = {
  id: Scalars['String'];
};


export type ModelVersionsArgs = {
  cursor?: InputMaybe<Scalars['String']>;
  filter?: InputMaybe<ModelVersionsFilter>;
  limit?: Scalars['Int'];
};

export type ModelCollection = {
  __typename?: 'ModelCollection';
  cursor?: Maybe<Scalars['String']>;
  items: Array<Model>;
  totalCount: Scalars['Int'];
};

export type ModelMutations = {
  __typename?: 'ModelMutations';
  create: Model;
  delete: Scalars['Boolean'];
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

export type ModelVersionsFilter = {
  /** Make sure these specified versions are always loaded first */
  priorityIds?: InputMaybe<Array<Scalars['String']>>;
  /** Only return versions specified in `priorityIds` */
  priorityIdsOnly?: InputMaybe<Scalars['Boolean']>;
};

export type ModelsTreeItem = {
  __typename?: 'ModelsTreeItem';
  children: Array<ModelsTreeItem>;
  fullName: Scalars['String'];
  /** Whether or not this item has nested children models */
  hasChildren: Scalars['Boolean'];
  id: Scalars['ID'];
  /**
   * Nullable cause the item can represent a parent that doesn't actually exist as a model on its own.
   * E.g. A model named "foo/bar" is supposed to be a child of "foo" and will be represented as such,
   * even if "foo" doesn't exist as its own model.
   */
  model?: Maybe<Model>;
  name: Scalars['String'];
  updatedAt: Scalars['DateTime'];
};

export type ModelsTreeItemCollection = {
  __typename?: 'ModelsTreeItemCollection';
  cursor?: Maybe<Scalars['String']>;
  items: Array<ModelsTreeItem>;
  totalCount: Scalars['Int'];
};

export type MoveVersionsInput = {
  /** If the name references a nonexistant model, it will be created */
  targetModelName: Scalars['String'];
  versionIds: Array<Scalars['String']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  /** The void stares back. */
  _?: Maybe<Scalars['String']>;
  /** Various Active User oriented mutations */
  activeUserMutations: ActiveUserMutations;
  adminDeleteUser: Scalars['Boolean'];
  /** Creates an personal api token. */
  apiTokenCreate: Scalars['String'];
  /** Revokes (deletes) an personal api token/app token. */
  apiTokenRevoke: Scalars['Boolean'];
  /** Register a new third party application. */
  appCreate: Scalars['String'];
  /** Deletes a thirty party application. */
  appDelete: Scalars['Boolean'];
  /** Revokes (de-authorizes) an application that you have previously authorized. */
  appRevokeAccess?: Maybe<Scalars['Boolean']>;
  /** Create an app token. Only apps can create app tokens and they don't show up under personal access tokens. */
  appTokenCreate: Scalars['String'];
  /** Update an existing third party application. **Note: This will invalidate all existing tokens, refresh tokens and access codes and will require existing users to re-authorize it.** */
  appUpdate: Scalars['Boolean'];
  automateFunctionRunStatusReport: Scalars['Boolean'];
  automateMutations: AutomateMutations;
  automationMutations: AutomationMutations;
  branchCreate: Scalars['String'];
  branchDelete: Scalars['Boolean'];
  branchUpdate: Scalars['Boolean'];
  /** Broadcast user activity in the viewer */
  broadcastViewerUserActivity: Scalars['Boolean'];
  /**
   * Archives a comment.
   * @deprecated Use commentMutations version
   */
  commentArchive: Scalars['Boolean'];
  /**
   * Creates a comment
   * @deprecated Use commentMutations version
   */
  commentCreate: Scalars['String'];
  /**
   * Edits a comment.
   * @deprecated Use commentMutations version
   */
  commentEdit: Scalars['Boolean'];
  commentMutations: CommentMutations;
  /**
   * Adds a reply to a comment.
   * @deprecated Use commentMutations version
   */
  commentReply: Scalars['String'];
  /**
   * Flags a comment as viewed by you (the logged in user).
   * @deprecated Use commentMutations version
   */
  commentView: Scalars['Boolean'];
  commitCreate: Scalars['String'];
  commitDelete: Scalars['Boolean'];
  commitReceive: Scalars['Boolean'];
  commitUpdate: Scalars['Boolean'];
  /** Delete a batch of commits */
  commitsDelete: Scalars['Boolean'];
  /** Move a batch of commits to a new branch */
  commitsMove: Scalars['Boolean'];
  /** Delete a pending invite */
  inviteDelete: Scalars['Boolean'];
  /** Re-send a pending invite */
  inviteResend: Scalars['Boolean'];
  modelMutations: ModelMutations;
  objectCreate: Array<Maybe<Scalars['String']>>;
  projectMutations: ProjectMutations;
  /** (Re-)send the account verification e-mail */
  requestVerification: Scalars['Boolean'];
  requestVerificationByEmail: Scalars['Boolean'];
  serverInfoUpdate?: Maybe<Scalars['Boolean']>;
  serverInviteBatchCreate: Scalars['Boolean'];
  /** Invite a new user to the speckle server and return the invite ID */
  serverInviteCreate: Scalars['Boolean'];
  /** Request access to a specific stream */
  streamAccessRequestCreate: StreamAccessRequest;
  /** Accept or decline a stream access request. Must be a stream owner to invoke this. */
  streamAccessRequestUse: Scalars['Boolean'];
  /** Creates a new stream. */
  streamCreate?: Maybe<Scalars['String']>;
  /** Deletes an existing stream. */
  streamDelete: Scalars['Boolean'];
  streamFavorite?: Maybe<Stream>;
  streamInviteBatchCreate: Scalars['Boolean'];
  /** Cancel a pending stream invite. Can only be invoked by a stream owner. */
  streamInviteCancel: Scalars['Boolean'];
  /** Invite a new or registered user to the specified stream */
  streamInviteCreate: Scalars['Boolean'];
  /** Accept or decline a stream invite */
  streamInviteUse: Scalars['Boolean'];
  /** Remove yourself from stream collaborators (not possible for the owner) */
  streamLeave: Scalars['Boolean'];
  /** Revokes the permissions of a user on a given stream. */
  streamRevokePermission?: Maybe<Scalars['Boolean']>;
  /** Updates an existing stream. */
  streamUpdate: Scalars['Boolean'];
  /** Update permissions of a user on a given stream. */
  streamUpdatePermission?: Maybe<Scalars['Boolean']>;
  streamsDelete: Scalars['Boolean'];
  /**
   * Used for broadcasting real time typing status in comment threads. Does not persist any info.
   * @deprecated Use broadcastViewerUserActivity
   */
  userCommentThreadActivityBroadcast: Scalars['Boolean'];
  /** Delete a user's account. */
  userDelete: Scalars['Boolean'];
  userNotificationPreferencesUpdate?: Maybe<Scalars['Boolean']>;
  userRoleChange: Scalars['Boolean'];
  /**
   * Edits a user's profile.
   * @deprecated Use activeUserMutations version
   */
  userUpdate: Scalars['Boolean'];
  /**
   * Used for broadcasting real time chat head bubbles and status. Does not persist any info.
   * @deprecated Use broadcastViewerUserActivity
   */
  userViewerActivityBroadcast: Scalars['Boolean'];
  versionMutations: VersionMutations;
  /** Creates a new webhook on a stream */
  webhookCreate: Scalars['String'];
  /** Deletes an existing webhook */
  webhookDelete: Scalars['String'];
  /** Updates an existing webhook */
  webhookUpdate: Scalars['String'];
};


export type MutationAdminDeleteUserArgs = {
  userConfirmation: UserDeleteInput;
};


export type MutationApiTokenCreateArgs = {
  token: ApiTokenCreateInput;
};


export type MutationApiTokenRevokeArgs = {
  token: Scalars['String'];
};


export type MutationAppCreateArgs = {
  app: AppCreateInput;
};


export type MutationAppDeleteArgs = {
  appId: Scalars['String'];
};


export type MutationAppRevokeAccessArgs = {
  appId: Scalars['String'];
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
  projectId: Scalars['String'];
  resourceIdString: Scalars['String'];
};


export type MutationCommentArchiveArgs = {
  archived?: Scalars['Boolean'];
  commentId: Scalars['String'];
  streamId: Scalars['String'];
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
  commentId: Scalars['String'];
  streamId: Scalars['String'];
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
  inviteId: Scalars['String'];
};


export type MutationInviteResendArgs = {
  inviteId: Scalars['String'];
};


export type MutationObjectCreateArgs = {
  objectInput: ObjectCreateInput;
};


export type MutationRequestVerificationByEmailArgs = {
  email: Scalars['String'];
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
  streamId: Scalars['String'];
};


export type MutationStreamAccessRequestUseArgs = {
  accept: Scalars['Boolean'];
  requestId: Scalars['String'];
  role?: StreamRole;
};


export type MutationStreamCreateArgs = {
  stream: StreamCreateInput;
};


export type MutationStreamDeleteArgs = {
  id: Scalars['String'];
};


export type MutationStreamFavoriteArgs = {
  favorited: Scalars['Boolean'];
  streamId: Scalars['String'];
};


export type MutationStreamInviteBatchCreateArgs = {
  input: Array<StreamInviteCreateInput>;
};


export type MutationStreamInviteCancelArgs = {
  inviteId: Scalars['String'];
  streamId: Scalars['String'];
};


export type MutationStreamInviteCreateArgs = {
  input: StreamInviteCreateInput;
};


export type MutationStreamInviteUseArgs = {
  accept: Scalars['Boolean'];
  streamId: Scalars['String'];
  token: Scalars['String'];
};


export type MutationStreamLeaveArgs = {
  streamId: Scalars['String'];
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
  ids?: InputMaybe<Array<Scalars['String']>>;
};


export type MutationUserCommentThreadActivityBroadcastArgs = {
  commentId: Scalars['String'];
  data?: InputMaybe<Scalars['JSONObject']>;
  streamId: Scalars['String'];
};


export type MutationUserDeleteArgs = {
  userConfirmation: UserDeleteInput;
};


export type MutationUserNotificationPreferencesUpdateArgs = {
  preferences: Scalars['JSONObject'];
};


export type MutationUserRoleChangeArgs = {
  userRoleInput: UserRoleInput;
};


export type MutationUserUpdateArgs = {
  user: UserUpdateInput;
};


export type MutationUserViewerActivityBroadcastArgs = {
  data?: InputMaybe<Scalars['JSONObject']>;
  resourceId: Scalars['String'];
  streamId: Scalars['String'];
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
  applicationId?: Maybe<Scalars['String']>;
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
   */
  commentCount: Scalars['Int'];
  createdAt?: Maybe<Scalars['DateTime']>;
  /** The full object, with all its props & other things. **NOTE:** If you're requesting objects for the purpose of recreating & displaying, you probably only want to request this specific field. */
  data?: Maybe<Scalars['JSONObject']>;
  id: Scalars['String'];
  speckleType?: Maybe<Scalars['String']>;
  totalChildrenCount?: Maybe<Scalars['Int']>;
};


export type ObjectChildrenArgs = {
  cursor?: InputMaybe<Scalars['String']>;
  depth?: Scalars['Int'];
  limit?: Scalars['Int'];
  orderBy?: InputMaybe<Scalars['JSONObject']>;
  query?: InputMaybe<Array<Scalars['JSONObject']>>;
  select?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
};

export type ObjectCollection = {
  __typename?: 'ObjectCollection';
  cursor?: Maybe<Scalars['String']>;
  objects: Array<Maybe<Object>>;
  totalCount: Scalars['Int'];
};

export type ObjectCreateInput = {
  /** The objects you want to create. */
  objects: Array<InputMaybe<Scalars['JSONObject']>>;
  /** The stream against which these objects will be created. */
  streamId: Scalars['String'];
};

export type PasswordStrengthCheckFeedback = {
  __typename?: 'PasswordStrengthCheckFeedback';
  suggestions: Array<Scalars['String']>;
  warning?: Maybe<Scalars['String']>;
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
  score: Scalars['Int'];
};

export type PendingStreamCollaborator = {
  __typename?: 'PendingStreamCollaborator';
  id: Scalars['String'];
  inviteId: Scalars['String'];
  invitedBy: LimitedUser;
  projectId: Scalars['String'];
  projectName: Scalars['String'];
  role: Scalars['String'];
  streamId: Scalars['String'];
  streamName: Scalars['String'];
  /** E-mail address or name of the invited user */
  title: Scalars['String'];
  /** Only available if the active user is the pending stream collaborator */
  token?: Maybe<Scalars['String']>;
  /** Set only if user is registered */
  user?: Maybe<LimitedUser>;
};

export type Project = {
  __typename?: 'Project';
  allowPublicComments: Scalars['Boolean'];
  /** Get a single automation by id. Error will be thrown if automation is not found or inaccessible. */
  automation: Automation;
  automations: AutomationCollection;
  blob?: Maybe<BlobMetadata>;
  /** Get the metadata collection of blobs stored for this stream. */
  blobs?: Maybe<BlobMetadataCollection>;
  /** All comment threads in this project */
  commentThreads: ProjectCommentCollection;
  createdAt: Scalars['DateTime'];
  description?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  /** Collaborators who have been invited, but not yet accepted. */
  invitedTeam?: Maybe<Array<PendingStreamCollaborator>>;
  /** Returns a specific model by its ID */
  model: Model;
  /** Return a model tree of children for the specified model name */
  modelChildrenTree: Array<ModelsTreeItem>;
  /** Returns a flat list of all models */
  models: ModelCollection;
  /**
   * Return's a project's models in a tree view with submodels being nested under parent models
   * real or fake (e.g., with a foo/bar model, it will be nested under foo even if such a model doesn't actually exist)
   */
  modelsTree: ModelsTreeItemCollection;
  name: Scalars['String'];
  /** Returns a list models that are being created from a file import */
  pendingImportedModels: Array<FileUpload>;
  /** Active user's role for this project. `null` if request is not authenticated, or the project is not explicitly shared with you. */
  role?: Maybe<Scalars['String']>;
  /** Source apps used in any models of this project */
  sourceApps: Array<Scalars['String']>;
  team: Array<ProjectCollaborator>;
  updatedAt: Scalars['DateTime'];
  /** Retrieve a specific project version by its ID */
  version?: Maybe<Version>;
  /** Returns a flat list of all project versions */
  versions: VersionCollection;
  /** Return metadata about resources being requested in the viewer */
  viewerResources: Array<ViewerResourceGroup>;
  visibility: ProjectVisibility;
  webhooks: WebhookCollection;
};


export type ProjectAutomationArgs = {
  id: Scalars['String'];
};


export type ProjectAutomationsArgs = {
  cursor?: InputMaybe<Scalars['String']>;
  filter?: InputMaybe<Scalars['String']>;
  limit?: InputMaybe<Scalars['Int']>;
};


export type ProjectBlobArgs = {
  id: Scalars['String'];
};


export type ProjectBlobsArgs = {
  cursor?: InputMaybe<Scalars['String']>;
  limit?: InputMaybe<Scalars['Int']>;
  query?: InputMaybe<Scalars['String']>;
};


export type ProjectCommentThreadsArgs = {
  cursor?: InputMaybe<Scalars['String']>;
  filter?: InputMaybe<ProjectCommentsFilter>;
  limit?: Scalars['Int'];
};


export type ProjectModelArgs = {
  id: Scalars['String'];
};


export type ProjectModelChildrenTreeArgs = {
  fullName: Scalars['String'];
};


export type ProjectModelsArgs = {
  cursor?: InputMaybe<Scalars['String']>;
  filter?: InputMaybe<ProjectModelsFilter>;
  limit?: Scalars['Int'];
};


export type ProjectModelsTreeArgs = {
  cursor?: InputMaybe<Scalars['String']>;
  filter?: InputMaybe<ProjectModelsTreeFilter>;
  limit?: Scalars['Int'];
};


export type ProjectPendingImportedModelsArgs = {
  limit?: InputMaybe<Scalars['Int']>;
};


export type ProjectVersionArgs = {
  id: Scalars['String'];
};


export type ProjectVersionsArgs = {
  cursor?: InputMaybe<Scalars['String']>;
  limit?: Scalars['Int'];
};


export type ProjectViewerResourcesArgs = {
  loadedVersionsOnly?: InputMaybe<Scalars['Boolean']>;
  resourceIdString: Scalars['String'];
};


export type ProjectWebhooksArgs = {
  id?: InputMaybe<Scalars['String']>;
};

export type ProjectAutomationCreateInput = {
  enabled: Scalars['Boolean'];
  name: Scalars['String'];
};

export type ProjectAutomationMutations = {
  __typename?: 'ProjectAutomationMutations';
  create: Automation;
  createRevision: AutomationRevision;
  createTestAutomation: Automation;
  createTestAutomationRun: TestAutomationRun;
  /**
   * Trigger an automation with a fake "version created" trigger. The "version created" will
   * just refer to the last version of the model.
   */
  trigger: Scalars['Boolean'];
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
  automationId: Scalars['ID'];
};


export type ProjectAutomationMutationsTriggerArgs = {
  automationId: Scalars['ID'];
};


export type ProjectAutomationMutationsUpdateArgs = {
  input: ProjectAutomationUpdateInput;
};

export type ProjectAutomationRevisionCreateInput = {
  automationId: Scalars['ID'];
  functions: Array<AutomationRevisionCreateFunctionInput>;
  /** AutomateTypes.TriggerDefinitionsSchema type from @speckle/shared */
  triggerDefinitions: Scalars['JSONObject'];
};

export type ProjectAutomationUpdateInput = {
  enabled?: InputMaybe<Scalars['Boolean']>;
  id: Scalars['ID'];
  name?: InputMaybe<Scalars['String']>;
};

export type ProjectAutomationsStatusUpdatedMessage = {
  __typename?: 'ProjectAutomationsStatusUpdatedMessage';
  model: Model;
  project: Project;
  status: AutomationsStatus;
  version: Version;
};

export type ProjectAutomationsUpdatedMessage = {
  __typename?: 'ProjectAutomationsUpdatedMessage';
  automation?: Maybe<Automation>;
  automationId: Scalars['String'];
  /** Only set if type === CREATED_REVISION */
  revision?: Maybe<AutomationRevision>;
  type: ProjectAutomationsUpdatedMessageType;
};

export enum ProjectAutomationsUpdatedMessageType {
  Created = 'CREATED',
  CreatedRevision = 'CREATED_REVISION',
  Updated = 'UPDATED'
}

export type ProjectCollaborator = {
  __typename?: 'ProjectCollaborator';
  id: Scalars['ID'];
  role: Scalars['String'];
  user: LimitedUser;
};

export type ProjectCollection = {
  __typename?: 'ProjectCollection';
  cursor?: Maybe<Scalars['String']>;
  items: Array<Project>;
  totalCount: Scalars['Int'];
};

export type ProjectCommentCollection = {
  __typename?: 'ProjectCommentCollection';
  cursor?: Maybe<Scalars['String']>;
  items: Array<Comment>;
  totalArchivedCount: Scalars['Int'];
  totalCount: Scalars['Int'];
};

export type ProjectCommentsFilter = {
  /** Whether or not to include archived/resolved threads */
  includeArchived?: InputMaybe<Scalars['Boolean']>;
  /**
   * By default if resourceIdString is set, the "versionId" part of model resource identifiers will be ignored
   * and all comments of all versions of any of the referenced models will be returned. If `loadedVersionsOnly` is
   * enabled, then only comment threads of loaded/referenced versions in resourceIdString will be returned.
   */
  loadedVersionsOnly?: InputMaybe<Scalars['Boolean']>;
  /**
   * Only request comments belonging to the resources identified by this
   * comma-delimited resouce string (same format that's used in the viewer URL)
   */
  resourceIdString?: InputMaybe<Scalars['String']>;
};

export type ProjectCommentsUpdatedMessage = {
  __typename?: 'ProjectCommentsUpdatedMessage';
  /** Null if deleted */
  comment?: Maybe<Comment>;
  id: Scalars['String'];
  type: ProjectCommentsUpdatedMessageType;
};

export enum ProjectCommentsUpdatedMessageType {
  Archived = 'ARCHIVED',
  Created = 'CREATED',
  Updated = 'UPDATED'
}

/** Any values left null will be ignored */
export type ProjectCreateInput = {
  description?: InputMaybe<Scalars['String']>;
  name?: InputMaybe<Scalars['String']>;
  visibility?: InputMaybe<ProjectVisibility>;
};

export type ProjectFileImportUpdatedMessage = {
  __typename?: 'ProjectFileImportUpdatedMessage';
  /** Upload ID */
  id: Scalars['String'];
  type: ProjectFileImportUpdatedMessageType;
  upload: FileUpload;
};

export enum ProjectFileImportUpdatedMessageType {
  Created = 'CREATED',
  Updated = 'UPDATED'
}

export type ProjectInviteCreateInput = {
  /** Either this or userId must be filled */
  email?: InputMaybe<Scalars['String']>;
  /** Defaults to the contributor role, if not specified */
  role?: InputMaybe<Scalars['String']>;
  /** Can only be specified if guest mode is on or if the user is an admin */
  serverRole?: InputMaybe<Scalars['String']>;
  /** Either this or email must be filled */
  userId?: InputMaybe<Scalars['String']>;
};

export type ProjectInviteMutations = {
  __typename?: 'ProjectInviteMutations';
  /** Batch invite to project */
  batchCreate: Project;
  /** Cancel a pending stream invite. Can only be invoked by a project owner. */
  cancel: Project;
  /** Invite a new or registered user to be a project collaborator. Can only be invoked by a project owner. */
  create: Project;
  /** Accept or decline a project invite */
  use: Scalars['Boolean'];
};


export type ProjectInviteMutationsBatchCreateArgs = {
  input: Array<ProjectInviteCreateInput>;
  projectId: Scalars['ID'];
};


export type ProjectInviteMutationsCancelArgs = {
  inviteId: Scalars['String'];
  projectId: Scalars['ID'];
};


export type ProjectInviteMutationsCreateArgs = {
  input: ProjectInviteCreateInput;
  projectId: Scalars['ID'];
};


export type ProjectInviteMutationsUseArgs = {
  input: ProjectInviteUseInput;
};

export type ProjectInviteUseInput = {
  accept: Scalars['Boolean'];
  projectId: Scalars['ID'];
  token: Scalars['String'];
};

export type ProjectModelsFilter = {
  /** Filter by IDs of contributors who participated in models */
  contributors?: InputMaybe<Array<Scalars['String']>>;
  /** Excldue models w/ the specified IDs */
  excludeIds?: InputMaybe<Array<Scalars['String']>>;
  /** Only select models w/ the specified IDs */
  ids?: InputMaybe<Array<Scalars['String']>>;
  /** Filter out models that don't have any versions */
  onlyWithVersions?: InputMaybe<Scalars['Boolean']>;
  /** Filter by model names */
  search?: InputMaybe<Scalars['String']>;
  /** Filter by source apps used in models */
  sourceApps?: InputMaybe<Array<Scalars['String']>>;
};

export type ProjectModelsTreeFilter = {
  /** Filter by IDs of contributors who participated in models */
  contributors?: InputMaybe<Array<Scalars['String']>>;
  /** Search for specific models. If used, tree items from different levels may be mixed. */
  search?: InputMaybe<Scalars['String']>;
  /** Filter by source apps used in models */
  sourceApps?: InputMaybe<Array<Scalars['String']>>;
};

export type ProjectModelsUpdatedMessage = {
  __typename?: 'ProjectModelsUpdatedMessage';
  /** Model ID */
  id: Scalars['String'];
  /** Null if model was deleted */
  model?: Maybe<Model>;
  type: ProjectModelsUpdatedMessageType;
};

export enum ProjectModelsUpdatedMessageType {
  Created = 'CREATED',
  Deleted = 'DELETED',
  Updated = 'UPDATED'
}

export type ProjectMutations = {
  __typename?: 'ProjectMutations';
  automationMutations: ProjectAutomationMutations;
  /** Create new project */
  create: Project;
  /**
   * Create onboarding/tutorial project. If one is already created for the active user, that
   * one will be returned instead.
   */
  createForOnboarding: Project;
  /** Delete an existing project */
  delete: Scalars['Boolean'];
  /** Invite related mutations */
  invites: ProjectInviteMutations;
  /** Leave a project. Only possible if you're not the last remaining owner. */
  leave: Scalars['Boolean'];
  /** Updates an existing project */
  update: Project;
  /** Update role for a collaborator */
  updateRole: Project;
};


export type ProjectMutationsAutomationMutationsArgs = {
  projectId: Scalars['ID'];
};


export type ProjectMutationsCreateArgs = {
  input?: InputMaybe<ProjectCreateInput>;
};


export type ProjectMutationsDeleteArgs = {
  id: Scalars['String'];
};


export type ProjectMutationsLeaveArgs = {
  id: Scalars['String'];
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
  id: Scalars['String'];
  model: FileUpload;
  type: ProjectPendingModelsUpdatedMessageType;
};

export enum ProjectPendingModelsUpdatedMessageType {
  Created = 'CREATED',
  Updated = 'UPDATED'
}

export type ProjectPendingVersionsUpdatedMessage = {
  __typename?: 'ProjectPendingVersionsUpdatedMessage';
  /** Upload ID */
  id: Scalars['String'];
  type: ProjectPendingVersionsUpdatedMessageType;
  version: FileUpload;
};

export enum ProjectPendingVersionsUpdatedMessageType {
  Created = 'CREATED',
  Updated = 'UPDATED'
}

export type ProjectTestAutomationCreateInput = {
  functionId: Scalars['String'];
  modelId: Scalars['String'];
  name: Scalars['String'];
};

export type ProjectTriggeredAutomationsStatusUpdatedMessage = {
  __typename?: 'ProjectTriggeredAutomationsStatusUpdatedMessage';
  model: Model;
  project: Project;
  run: AutomateRun;
  type: ProjectTriggeredAutomationsStatusUpdatedMessageType;
  version: Version;
};

export enum ProjectTriggeredAutomationsStatusUpdatedMessageType {
  RunCreated = 'RUN_CREATED',
  RunUpdated = 'RUN_UPDATED'
}

/** Any values left null will be ignored, so only set the properties that you want updated */
export type ProjectUpdateInput = {
  allowPublicComments?: InputMaybe<Scalars['Boolean']>;
  description?: InputMaybe<Scalars['String']>;
  id: Scalars['ID'];
  name?: InputMaybe<Scalars['String']>;
  visibility?: InputMaybe<ProjectVisibility>;
};

export type ProjectUpdateRoleInput = {
  projectId: Scalars['String'];
  /** Leave role as null to revoke access entirely */
  role?: InputMaybe<Scalars['String']>;
  userId: Scalars['String'];
};

export type ProjectUpdatedMessage = {
  __typename?: 'ProjectUpdatedMessage';
  /** Project ID */
  id: Scalars['String'];
  /** Project entity, null if project was deleted */
  project?: Maybe<Project>;
  /** Message type */
  type: ProjectUpdatedMessageType;
};

export enum ProjectUpdatedMessageType {
  Deleted = 'DELETED',
  Updated = 'UPDATED'
}

export type ProjectVersionsPreviewGeneratedMessage = {
  __typename?: 'ProjectVersionsPreviewGeneratedMessage';
  objectId: Scalars['String'];
  projectId: Scalars['String'];
  versionId: Scalars['String'];
};

export type ProjectVersionsUpdatedMessage = {
  __typename?: 'ProjectVersionsUpdatedMessage';
  /** Version ID */
  id: Scalars['String'];
  /** Only set if version was deleted, in other scenarios can be queried from 'version' */
  modelId?: Maybe<Scalars['String']>;
  type: ProjectVersionsUpdatedMessageType;
  /** Null if version was deleted */
  version?: Maybe<Version>;
};

export enum ProjectVersionsUpdatedMessageType {
  Created = 'CREATED',
  Deleted = 'DELETED',
  Updated = 'UPDATED'
}

export enum ProjectVisibility {
  Private = 'PRIVATE',
  Public = 'PUBLIC',
  Unlisted = 'UNLISTED'
}

export type Query = {
  __typename?: 'Query';
  /** Stare into the void. */
  _?: Maybe<Scalars['String']>;
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
  /** Returns all the publicly available apps on this server. */
  apps?: Maybe<Array<Maybe<ServerAppListItem>>>;
  /** If user is authenticated using an app token, this will describe the app */
  authenticatedAsApp?: Maybe<ServerAppListItem>;
  /** Get a single automate function by id. Error will be thrown if function is not found or inaccessible. */
  automateFunction: AutomateFunction;
  automateFunctions: AutomateFunctionCollection;
  /** Part of the automation/function creation handshake mechanism */
  automateValidateAuthCode: Scalars['Boolean'];
  comment?: Maybe<Comment>;
  /**
   * This query can be used in the following ways:
   * - get all the comments for a stream: **do not pass in any resource identifiers**.
   * - get the comments targeting any of a set of provided resources (comments/objects): **pass in an array of resources.**
   * @deprecated Use 'commentThreads' fields instead
   */
  comments?: Maybe<CommentCollection>;
  /** All of the discoverable streams of the server */
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
   */
  stream?: Maybe<Stream>;
  /** Get authed user's stream access request */
  streamAccessRequest?: Maybe<StreamAccessRequest>;
  /**
   * Look for an invitation to a stream, for the current user (authed or not). If token
   * isn't specified, the server will look for any valid invite.
   */
  streamInvite?: Maybe<PendingStreamCollaborator>;
  /** Get all invitations to streams that the active user has */
  streamInvites: Array<PendingStreamCollaborator>;
  /**
   * Returns all streams that the active user is a collaborator on.
   * Pass in the `query` parameter to search by name, description or ID.
   */
  streams?: Maybe<StreamCollection>;
  /**
   * Gets the profile of a user. If no id argument is provided, will return the current authenticated user's profile (as extracted from the authorization header).
   * @deprecated To be removed in the near future! Use 'activeUser' to get info about the active user or 'otherUser' to get info about another user.
   */
  user?: Maybe<User>;
  /** Validate password strength */
  userPwdStrength: PasswordStrengthCheckResults;
  /**
   * Search for users and return limited metadata about them, if you have the server:user role.
   * The query looks for matches in name & email
   */
  userSearch: UserSearchResultCollection;
};


export type QueryAdminStreamsArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Scalars['String']>;
  query?: InputMaybe<Scalars['String']>;
  visibility?: InputMaybe<Scalars['String']>;
};


export type QueryAdminUsersArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  query?: InputMaybe<Scalars['String']>;
};


export type QueryAppArgs = {
  id: Scalars['String'];
};


export type QueryAutomateFunctionArgs = {
  id: Scalars['ID'];
};


export type QueryAutomateFunctionsArgs = {
  cursor?: InputMaybe<Scalars['String']>;
  filter?: InputMaybe<AutomateFunctionsFilter>;
  limit?: InputMaybe<Scalars['Int']>;
};


export type QueryAutomateValidateAuthCodeArgs = {
  code: Scalars['String'];
};


export type QueryCommentArgs = {
  id: Scalars['String'];
  streamId: Scalars['String'];
};


export type QueryCommentsArgs = {
  archived?: Scalars['Boolean'];
  cursor?: InputMaybe<Scalars['String']>;
  limit?: InputMaybe<Scalars['Int']>;
  resources?: InputMaybe<Array<InputMaybe<ResourceIdentifierInput>>>;
  streamId: Scalars['String'];
};


export type QueryDiscoverableStreamsArgs = {
  cursor?: InputMaybe<Scalars['String']>;
  limit?: Scalars['Int'];
  sort?: InputMaybe<DiscoverableStreamsSortingInput>;
};


export type QueryOtherUserArgs = {
  id: Scalars['String'];
};


export type QueryProjectArgs = {
  id: Scalars['String'];
};


export type QueryProjectInviteArgs = {
  projectId: Scalars['String'];
  token?: InputMaybe<Scalars['String']>;
};


export type QueryServerInviteByTokenArgs = {
  token: Scalars['String'];
};


export type QueryStreamArgs = {
  id: Scalars['String'];
};


export type QueryStreamAccessRequestArgs = {
  streamId: Scalars['String'];
};


export type QueryStreamInviteArgs = {
  streamId: Scalars['String'];
  token?: InputMaybe<Scalars['String']>;
};


export type QueryStreamsArgs = {
  cursor?: InputMaybe<Scalars['String']>;
  limit?: InputMaybe<Scalars['Int']>;
  query?: InputMaybe<Scalars['String']>;
};


export type QueryUserArgs = {
  id?: InputMaybe<Scalars['String']>;
};


export type QueryUserPwdStrengthArgs = {
  pwd: Scalars['String'];
};


export type QueryUserSearchArgs = {
  archived?: InputMaybe<Scalars['Boolean']>;
  cursor?: InputMaybe<Scalars['String']>;
  emailOnly?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  query: Scalars['String'];
};

/** Deprecated: Used by old stream-based mutations */
export type ReplyCreateInput = {
  /** IDs of uploaded blobs that should be attached to this reply */
  blobIds: Array<Scalars['String']>;
  data?: InputMaybe<Scalars['JSONObject']>;
  parentComment: Scalars['String'];
  streamId: Scalars['String'];
  /** ProseMirror document object */
  text?: InputMaybe<Scalars['JSONObject']>;
};

export type ResourceIdentifier = {
  __typename?: 'ResourceIdentifier';
  resourceId: Scalars['String'];
  resourceType: ResourceType;
};

export type ResourceIdentifierInput = {
  resourceId: Scalars['String'];
  resourceType: ResourceType;
};

export enum ResourceType {
  Comment = 'comment',
  Commit = 'commit',
  Object = 'object',
  Stream = 'stream'
}

export type Role = {
  __typename?: 'Role';
  description: Scalars['String'];
  name: Scalars['String'];
  resourceTarget: Scalars['String'];
};

/** Available scopes. */
export type Scope = {
  __typename?: 'Scope';
  description: Scalars['String'];
  name: Scalars['String'];
};

export type ServerApp = {
  __typename?: 'ServerApp';
  author?: Maybe<AppAuthor>;
  createdAt: Scalars['DateTime'];
  description?: Maybe<Scalars['String']>;
  id: Scalars['String'];
  logo?: Maybe<Scalars['String']>;
  name: Scalars['String'];
  public?: Maybe<Scalars['Boolean']>;
  redirectUrl: Scalars['String'];
  scopes: Array<Scope>;
  secret?: Maybe<Scalars['String']>;
  termsAndConditionsLink?: Maybe<Scalars['String']>;
  trustByDefault?: Maybe<Scalars['Boolean']>;
};

export type ServerAppListItem = {
  __typename?: 'ServerAppListItem';
  author?: Maybe<AppAuthor>;
  description?: Maybe<Scalars['String']>;
  id: Scalars['String'];
  logo?: Maybe<Scalars['String']>;
  name: Scalars['String'];
  redirectUrl: Scalars['String'];
  termsAndConditionsLink?: Maybe<Scalars['String']>;
  trustByDefault?: Maybe<Scalars['Boolean']>;
};

export type ServerAutomateInfo = {
  __typename?: 'ServerAutomateInfo';
  availableFunctionTemplates: Array<AutomateFunctionTemplate>;
};

/** Information about this server. */
export type ServerInfo = {
  __typename?: 'ServerInfo';
  adminContact?: Maybe<Scalars['String']>;
  /** The authentication strategies available on this server. */
  authStrategies: Array<AuthStrategy>;
  automate: ServerAutomateInfo;
  /** Base URL of Speckle Automate, if set */
  automateUrl?: Maybe<Scalars['String']>;
  blobSizeLimitBytes: Scalars['Int'];
  canonicalUrl?: Maybe<Scalars['String']>;
  company?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  /** Whether or not to show messaging about FE2 (banners etc.) */
  enableNewWebUiMessaging?: Maybe<Scalars['Boolean']>;
  guestModeEnabled: Scalars['Boolean'];
  inviteOnly?: Maybe<Scalars['Boolean']>;
  /** Server relocation / migration info */
  migration?: Maybe<ServerMigration>;
  name: Scalars['String'];
  /** @deprecated Use role constants from the @speckle/shared npm package instead */
  roles: Array<Role>;
  scopes: Array<Scope>;
  serverRoles: Array<ServerRoleItem>;
  termsOfService?: Maybe<Scalars['String']>;
  version?: Maybe<Scalars['String']>;
};

export type ServerInfoUpdateInput = {
  adminContact?: InputMaybe<Scalars['String']>;
  company?: InputMaybe<Scalars['String']>;
  description?: InputMaybe<Scalars['String']>;
  guestModeEnabled?: InputMaybe<Scalars['Boolean']>;
  inviteOnly?: InputMaybe<Scalars['Boolean']>;
  name: Scalars['String'];
  termsOfService?: InputMaybe<Scalars['String']>;
};

export type ServerInvite = {
  __typename?: 'ServerInvite';
  email: Scalars['String'];
  id: Scalars['String'];
  invitedBy: LimitedUser;
};

export type ServerInviteCreateInput = {
  email: Scalars['String'];
  message?: InputMaybe<Scalars['String']>;
  /** Can only be specified if guest mode is on or if the user is an admin */
  serverRole?: InputMaybe<Scalars['String']>;
};

export type ServerMigration = {
  __typename?: 'ServerMigration';
  movedFrom?: Maybe<Scalars['String']>;
  movedTo?: Maybe<Scalars['String']>;
};

export enum ServerRole {
  ServerAdmin = 'SERVER_ADMIN',
  ServerArchivedUser = 'SERVER_ARCHIVED_USER',
  ServerGuest = 'SERVER_GUEST',
  ServerUser = 'SERVER_USER'
}

export type ServerRoleItem = {
  __typename?: 'ServerRoleItem';
  id: Scalars['String'];
  title: Scalars['String'];
};

export type ServerStatistics = {
  __typename?: 'ServerStatistics';
  totalPendingInvites: Scalars['Int'];
  totalProjectCount: Scalars['Int'];
  totalUserCount: Scalars['Int'];
};

export type ServerStats = {
  __typename?: 'ServerStats';
  /** An array of objects currently structured as { created_month: Date, count: int }. */
  commitHistory?: Maybe<Array<Maybe<Scalars['JSONObject']>>>;
  /** An array of objects currently structured as { created_month: Date, count: int }. */
  objectHistory?: Maybe<Array<Maybe<Scalars['JSONObject']>>>;
  /** An array of objects currently structured as { created_month: Date, count: int }. */
  streamHistory?: Maybe<Array<Maybe<Scalars['JSONObject']>>>;
  totalCommitCount: Scalars['Int'];
  totalObjectCount: Scalars['Int'];
  totalStreamCount: Scalars['Int'];
  totalUserCount: Scalars['Int'];
  /** An array of objects currently structured as { created_month: Date, count: int }. */
  userHistory?: Maybe<Array<Maybe<Scalars['JSONObject']>>>;
};

export type SmartTextEditorValue = {
  __typename?: 'SmartTextEditorValue';
  /** File attachments, if any */
  attachments?: Maybe<Array<BlobMetadata>>;
  /**
   * The actual (ProseMirror) document representing the text. Can be empty,
   * if there are attachments.
   */
  doc?: Maybe<Scalars['JSONObject']>;
  /** The type of editor value (comment, blog post etc.) */
  type: Scalars['String'];
  /** The version of the schema */
  version: Scalars['String'];
};

export enum SortDirection {
  Asc = 'ASC',
  Desc = 'DESC'
}

export type Stream = {
  __typename?: 'Stream';
  /** All the recent activity on this stream in chronological order */
  activity?: Maybe<ActivityCollection>;
  allowPublicComments: Scalars['Boolean'];
  blob?: Maybe<BlobMetadata>;
  /** Get the metadata collection of blobs stored for this stream. */
  blobs?: Maybe<BlobMetadataCollection>;
  branch?: Maybe<Branch>;
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
   */
  commentCount: Scalars['Int'];
  commit?: Maybe<Commit>;
  commits?: Maybe<CommitCollection>;
  createdAt: Scalars['DateTime'];
  description?: Maybe<Scalars['String']>;
  /** Date when you favorited this stream. `null` if stream isn't viewed from a specific user's perspective or if it isn't favorited. */
  favoritedDate?: Maybe<Scalars['DateTime']>;
  favoritesCount: Scalars['Int'];
  /** Returns a specific file upload that belongs to this stream. */
  fileUpload?: Maybe<FileUpload>;
  /** Returns a list of all the file uploads for this stream. */
  fileUploads: Array<FileUpload>;
  id: Scalars['String'];
  /**
   * Whether the stream (if public) can be found on public stream exploration pages
   * and searches
   */
  isDiscoverable: Scalars['Boolean'];
  /** Whether the stream can be viewed by non-contributors */
  isPublic: Scalars['Boolean'];
  name: Scalars['String'];
  object?: Maybe<Object>;
  /** Pending stream access requests */
  pendingAccessRequests?: Maybe<Array<StreamAccessRequest>>;
  /** Collaborators who have been invited, but not yet accepted. */
  pendingCollaborators?: Maybe<Array<PendingStreamCollaborator>>;
  /** Your role for this stream. `null` if request is not authenticated, or the stream is not explicitly shared with you. */
  role?: Maybe<Scalars['String']>;
  size?: Maybe<Scalars['String']>;
  updatedAt: Scalars['DateTime'];
  webhooks: WebhookCollection;
};


export type StreamActivityArgs = {
  actionType?: InputMaybe<Scalars['String']>;
  after?: InputMaybe<Scalars['DateTime']>;
  before?: InputMaybe<Scalars['DateTime']>;
  cursor?: InputMaybe<Scalars['DateTime']>;
  limit?: Scalars['Int'];
};


export type StreamBlobArgs = {
  id: Scalars['String'];
};


export type StreamBlobsArgs = {
  cursor?: InputMaybe<Scalars['String']>;
  limit?: InputMaybe<Scalars['Int']>;
  query?: InputMaybe<Scalars['String']>;
};


export type StreamBranchArgs = {
  name?: InputMaybe<Scalars['String']>;
};


export type StreamBranchesArgs = {
  cursor?: InputMaybe<Scalars['String']>;
  limit?: Scalars['Int'];
};


export type StreamCommitArgs = {
  id?: InputMaybe<Scalars['String']>;
};


export type StreamCommitsArgs = {
  cursor?: InputMaybe<Scalars['String']>;
  limit?: Scalars['Int'];
};


export type StreamFileUploadArgs = {
  id: Scalars['String'];
};


export type StreamObjectArgs = {
  id: Scalars['String'];
};


export type StreamWebhooksArgs = {
  id?: InputMaybe<Scalars['String']>;
};

/** Created when a user requests to become a contributor on a stream */
export type StreamAccessRequest = {
  __typename?: 'StreamAccessRequest';
  createdAt: Scalars['DateTime'];
  id: Scalars['ID'];
  requester: LimitedUser;
  requesterId: Scalars['String'];
  /** Can only be selected if authed user has proper access */
  stream: Stream;
  streamId: Scalars['String'];
};

export type StreamCollaborator = {
  __typename?: 'StreamCollaborator';
  avatar?: Maybe<Scalars['String']>;
  company?: Maybe<Scalars['String']>;
  id: Scalars['String'];
  name: Scalars['String'];
  role: Scalars['String'];
  serverRole: Scalars['String'];
};

export type StreamCollection = {
  __typename?: 'StreamCollection';
  cursor?: Maybe<Scalars['String']>;
  items?: Maybe<Array<Stream>>;
  totalCount: Scalars['Int'];
};

export type StreamCreateInput = {
  description?: InputMaybe<Scalars['String']>;
  /**
   * Whether the stream (if public) can be found on public stream exploration pages
   * and searches
   */
  isDiscoverable?: InputMaybe<Scalars['Boolean']>;
  /** Whether the stream can be viewed by non-contributors */
  isPublic?: InputMaybe<Scalars['Boolean']>;
  name?: InputMaybe<Scalars['String']>;
  /** Optionally specify user IDs of users that you want to invite to be contributors to this stream */
  withContributors?: InputMaybe<Array<Scalars['String']>>;
};

export type StreamInviteCreateInput = {
  email?: InputMaybe<Scalars['String']>;
  message?: InputMaybe<Scalars['String']>;
  /** Defaults to the contributor role, if not specified */
  role?: InputMaybe<Scalars['String']>;
  /** Can only be specified if guest mode is on or if the user is an admin */
  serverRole?: InputMaybe<Scalars['String']>;
  streamId: Scalars['String'];
  userId?: InputMaybe<Scalars['String']>;
};

export type StreamRevokePermissionInput = {
  streamId: Scalars['String'];
  userId: Scalars['String'];
};

export enum StreamRole {
  StreamContributor = 'STREAM_CONTRIBUTOR',
  StreamOwner = 'STREAM_OWNER',
  StreamReviewer = 'STREAM_REVIEWER'
}

export type StreamUpdateInput = {
  allowPublicComments?: InputMaybe<Scalars['Boolean']>;
  description?: InputMaybe<Scalars['String']>;
  id: Scalars['String'];
  /**
   * Whether the stream (if public) can be found on public stream exploration pages
   * and searches
   */
  isDiscoverable?: InputMaybe<Scalars['Boolean']>;
  /** Whether the stream can be viewed by non-contributors */
  isPublic?: InputMaybe<Scalars['Boolean']>;
  name?: InputMaybe<Scalars['String']>;
};

export type StreamUpdatePermissionInput = {
  role: Scalars['String'];
  streamId: Scalars['String'];
  userId: Scalars['String'];
};

export type Subscription = {
  __typename?: 'Subscription';
  /** It's lonely in the void. */
  _?: Maybe<Scalars['String']>;
  /** Subscribe to branch created event */
  branchCreated?: Maybe<Scalars['JSONObject']>;
  /** Subscribe to branch deleted event */
  branchDeleted?: Maybe<Scalars['JSONObject']>;
  /** Subscribe to branch updated event. */
  branchUpdated?: Maybe<Scalars['JSONObject']>;
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
  /** Subscribe to commit created event */
  commitCreated?: Maybe<Scalars['JSONObject']>;
  /** Subscribe to commit deleted event */
  commitDeleted?: Maybe<Scalars['JSONObject']>;
  /** Subscribe to commit updated event. */
  commitUpdated?: Maybe<Scalars['JSONObject']>;
  projectAutomationsStatusUpdated: ProjectAutomationsStatusUpdatedMessage;
  /** Subscribe to updates to automations in the project */
  projectAutomationsUpdated: ProjectAutomationsUpdatedMessage;
  /**
   * Subscribe to updates to resource comments/threads. Optionally specify resource ID string to only receive
   * updates regarding comments for those resources.
   */
  projectCommentsUpdated: ProjectCommentsUpdatedMessage;
  /** Subscribe to changes to any of a project's file imports */
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
  /** Subscribes to stream deleted event. Use this in clients/components that pertain only to this stream. */
  streamDeleted?: Maybe<Scalars['JSONObject']>;
  /** Subscribes to stream updated event. Use this in clients/components that pertain only to this stream. */
  streamUpdated?: Maybe<Scalars['JSONObject']>;
  /** Track newly added or deleted projects owned by the active user */
  userProjectsUpdated: UserProjectsUpdatedMessage;
  /**
   * Subscribes to new stream added event for your profile. Use this to display an up-to-date list of streams.
   * **NOTE**: If someone shares a stream with you, this subscription will be triggered with an extra value of `sharedBy` in the payload.
   */
  userStreamAdded?: Maybe<Scalars['JSONObject']>;
  /**
   * Subscribes to stream removed event for your profile. Use this to display an up-to-date list of streams for your profile.
   * **NOTE**: If someone revokes your permissions on a stream, this subscription will be triggered with an extra value of `revokedBy` in the payload.
   */
  userStreamRemoved?: Maybe<Scalars['JSONObject']>;
  /**
   * Broadcasts "real-time" location data for viewer users.
   * @deprecated Use viewerUserActivityBroadcasted
   */
  userViewerActivity?: Maybe<Scalars['JSONObject']>;
  /** Track user activities in the viewer relating to the specified resources */
  viewerUserActivityBroadcasted: ViewerUserActivityMessage;
};


export type SubscriptionBranchCreatedArgs = {
  streamId: Scalars['String'];
};


export type SubscriptionBranchDeletedArgs = {
  streamId: Scalars['String'];
};


export type SubscriptionBranchUpdatedArgs = {
  branchId?: InputMaybe<Scalars['String']>;
  streamId: Scalars['String'];
};


export type SubscriptionCommentActivityArgs = {
  resourceIds?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  streamId: Scalars['String'];
};


export type SubscriptionCommentThreadActivityArgs = {
  commentId: Scalars['String'];
  streamId: Scalars['String'];
};


export type SubscriptionCommitCreatedArgs = {
  streamId: Scalars['String'];
};


export type SubscriptionCommitDeletedArgs = {
  streamId: Scalars['String'];
};


export type SubscriptionCommitUpdatedArgs = {
  commitId?: InputMaybe<Scalars['String']>;
  streamId: Scalars['String'];
};


export type SubscriptionProjectAutomationsStatusUpdatedArgs = {
  projectId: Scalars['String'];
};


export type SubscriptionProjectAutomationsUpdatedArgs = {
  projectId: Scalars['String'];
};


export type SubscriptionProjectCommentsUpdatedArgs = {
  target: ViewerUpdateTrackingTarget;
};


export type SubscriptionProjectFileImportUpdatedArgs = {
  id: Scalars['String'];
};


export type SubscriptionProjectModelsUpdatedArgs = {
  id: Scalars['String'];
  modelIds?: InputMaybe<Array<Scalars['String']>>;
};


export type SubscriptionProjectPendingModelsUpdatedArgs = {
  id: Scalars['String'];
};


export type SubscriptionProjectPendingVersionsUpdatedArgs = {
  id: Scalars['String'];
};


export type SubscriptionProjectTriggeredAutomationsStatusUpdatedArgs = {
  projectId: Scalars['String'];
};


export type SubscriptionProjectUpdatedArgs = {
  id: Scalars['String'];
};


export type SubscriptionProjectVersionGendoAiRenderCreatedArgs = {
  id: Scalars['String'];
  versionId: Scalars['String'];
};


export type SubscriptionProjectVersionGendoAiRenderUpdatedArgs = {
  id: Scalars['String'];
  versionId: Scalars['String'];
};


export type SubscriptionProjectVersionsPreviewGeneratedArgs = {
  id: Scalars['String'];
};


export type SubscriptionProjectVersionsUpdatedArgs = {
  id: Scalars['String'];
};


export type SubscriptionStreamDeletedArgs = {
  streamId?: InputMaybe<Scalars['String']>;
};


export type SubscriptionStreamUpdatedArgs = {
  streamId?: InputMaybe<Scalars['String']>;
};


export type SubscriptionUserViewerActivityArgs = {
  resourceId: Scalars['String'];
  streamId: Scalars['String'];
};


export type SubscriptionViewerUserActivityBroadcastedArgs = {
  sessionId?: InputMaybe<Scalars['String']>;
  target: ViewerUpdateTrackingTarget;
};

export type TestAutomationRun = {
  __typename?: 'TestAutomationRun';
  automationRunId: Scalars['String'];
  functionRunId: Scalars['String'];
  triggers: Array<TestAutomationRunTrigger>;
};

export type TestAutomationRunTrigger = {
  __typename?: 'TestAutomationRunTrigger';
  payload: TestAutomationRunTriggerPayload;
  triggerType: Scalars['String'];
};

export type TestAutomationRunTriggerPayload = {
  __typename?: 'TestAutomationRunTriggerPayload';
  modelId: Scalars['String'];
  versionId: Scalars['String'];
};

export type TokenResourceIdentifier = {
  __typename?: 'TokenResourceIdentifier';
  id: Scalars['String'];
  type: TokenResourceIdentifierType;
};

export type TokenResourceIdentifierInput = {
  id: Scalars['String'];
  type: TokenResourceIdentifierType;
};

export enum TokenResourceIdentifierType {
  Project = 'project'
}

export type TriggeredAutomationsStatus = {
  __typename?: 'TriggeredAutomationsStatus';
  automationRuns: Array<AutomateRun>;
  id: Scalars['ID'];
  status: AutomateRunStatus;
  statusMessage?: Maybe<Scalars['String']>;
};

/** Any null values will be ignored */
export type UpdateAutomateFunctionInput = {
  description?: InputMaybe<Scalars['String']>;
  id: Scalars['ID'];
  logo?: InputMaybe<Scalars['String']>;
  name?: InputMaybe<Scalars['String']>;
  /** SourceAppNames values from @speckle/shared */
  supportedSourceApps?: InputMaybe<Array<Scalars['String']>>;
  tags?: InputMaybe<Array<Scalars['String']>>;
};

export type UpdateModelInput = {
  description?: InputMaybe<Scalars['String']>;
  id: Scalars['ID'];
  name?: InputMaybe<Scalars['String']>;
  projectId: Scalars['ID'];
};

/** Only non-null values will be updated */
export type UpdateVersionInput = {
  message?: InputMaybe<Scalars['String']>;
  versionId: Scalars['String'];
};

/**
 * Full user type, should only be used in the context of admin operations or
 * when a user is reading/writing info about himself
 */
export type User = {
  __typename?: 'User';
  /** All the recent activity from this user in chronological order */
  activity?: Maybe<ActivityCollection>;
  /** Returns a list of your personal api tokens. */
  apiTokens: Array<ApiToken>;
  /** Returns the apps you have authorized. */
  authorizedApps?: Maybe<Array<ServerAppListItem>>;
  automateInfo: UserAutomateInfo;
  avatar?: Maybe<Scalars['String']>;
  bio?: Maybe<Scalars['String']>;
  /**
   * Get commits authored by the user. If requested for another user, then only commits
   * from public streams will be returned.
   */
  commits?: Maybe<CommitCollection>;
  company?: Maybe<Scalars['String']>;
  /** Returns the apps you have created. */
  createdApps?: Maybe<Array<ServerApp>>;
  createdAt?: Maybe<Scalars['DateTime']>;
  email?: Maybe<Scalars['String']>;
  /**
   * All the streams that a active user has favorited.
   * Note: You can't use this to retrieve another user's favorite streams.
   */
  favoriteStreams: StreamCollection;
  /** Whether the user has a pending/active email verification token */
  hasPendingVerification?: Maybe<Scalars['Boolean']>;
  id: Scalars['ID'];
  /** Whether post-sign up onboarding has been finished or skipped entirely */
  isOnboardingFinished?: Maybe<Scalars['Boolean']>;
  name: Scalars['String'];
  notificationPreferences: Scalars['JSONObject'];
  profiles?: Maybe<Scalars['JSONObject']>;
  /** Get all invitations to projects that the active user has */
  projectInvites: Array<PendingStreamCollaborator>;
  /** Get projects that the user participates in */
  projects: ProjectCollection;
  role?: Maybe<Scalars['String']>;
  /**
   * Returns all streams that the user is a collaborator on. If requested for a user, who isn't the
   * authenticated user, then this will only return discoverable streams.
   */
  streams: StreamCollection;
  /** The user's timeline in chronological order */
  timeline?: Maybe<ActivityCollection>;
  /** Total amount of favorites attached to streams owned by the user */
  totalOwnedStreamsFavorites: Scalars['Int'];
  verified?: Maybe<Scalars['Boolean']>;
  /**
   * Get (count of) user's versions. By default gets all versions of all projects the user has access to.
   * Set authoredOnly=true to only retrieve versions authored by the user.
   *
   * Note: Only count resolution is currently implemented
   */
  versions: CountOnlyCollection;
};


/**
 * Full user type, should only be used in the context of admin operations or
 * when a user is reading/writing info about himself
 */
export type UserActivityArgs = {
  actionType?: InputMaybe<Scalars['String']>;
  after?: InputMaybe<Scalars['DateTime']>;
  before?: InputMaybe<Scalars['DateTime']>;
  cursor?: InputMaybe<Scalars['DateTime']>;
  limit?: Scalars['Int'];
};


/**
 * Full user type, should only be used in the context of admin operations or
 * when a user is reading/writing info about himself
 */
export type UserCommitsArgs = {
  cursor?: InputMaybe<Scalars['String']>;
  limit?: Scalars['Int'];
};


/**
 * Full user type, should only be used in the context of admin operations or
 * when a user is reading/writing info about himself
 */
export type UserFavoriteStreamsArgs = {
  cursor?: InputMaybe<Scalars['String']>;
  limit?: Scalars['Int'];
};


/**
 * Full user type, should only be used in the context of admin operations or
 * when a user is reading/writing info about himself
 */
export type UserProjectsArgs = {
  cursor?: InputMaybe<Scalars['String']>;
  filter?: InputMaybe<UserProjectsFilter>;
  limit?: Scalars['Int'];
};


/**
 * Full user type, should only be used in the context of admin operations or
 * when a user is reading/writing info about himself
 */
export type UserStreamsArgs = {
  cursor?: InputMaybe<Scalars['String']>;
  limit?: Scalars['Int'];
};


/**
 * Full user type, should only be used in the context of admin operations or
 * when a user is reading/writing info about himself
 */
export type UserTimelineArgs = {
  after?: InputMaybe<Scalars['DateTime']>;
  before?: InputMaybe<Scalars['DateTime']>;
  cursor?: InputMaybe<Scalars['DateTime']>;
  limit?: Scalars['Int'];
};


/**
 * Full user type, should only be used in the context of admin operations or
 * when a user is reading/writing info about himself
 */
export type UserVersionsArgs = {
  authoredOnly?: Scalars['Boolean'];
  limit?: Scalars['Int'];
};

export type UserAutomateInfo = {
  __typename?: 'UserAutomateInfo';
  availableGithubOrgs: Array<Scalars['String']>;
  hasAutomateGithubApp: Scalars['Boolean'];
};

export type UserDeleteInput = {
  email: Scalars['String'];
};

export type UserProjectsFilter = {
  /** Only include projects where user has the specified roles */
  onlyWithRoles?: InputMaybe<Array<Scalars['String']>>;
  /** Filter out projects by name */
  search?: InputMaybe<Scalars['String']>;
};

export type UserProjectsUpdatedMessage = {
  __typename?: 'UserProjectsUpdatedMessage';
  /** Project ID */
  id: Scalars['String'];
  /** Project entity, null if project was deleted */
  project?: Maybe<Project>;
  /** Message type */
  type: UserProjectsUpdatedMessageType;
};

export enum UserProjectsUpdatedMessageType {
  Added = 'ADDED',
  Removed = 'REMOVED'
}

export type UserRoleInput = {
  id: Scalars['String'];
  role: Scalars['String'];
};

export type UserSearchResultCollection = {
  __typename?: 'UserSearchResultCollection';
  cursor?: Maybe<Scalars['String']>;
  items: Array<LimitedUser>;
};

export type UserUpdateInput = {
  avatar?: InputMaybe<Scalars['String']>;
  bio?: InputMaybe<Scalars['String']>;
  company?: InputMaybe<Scalars['String']>;
  name?: InputMaybe<Scalars['String']>;
};

export type Version = {
  __typename?: 'Version';
  authorUser?: Maybe<LimitedUser>;
  automationStatus?: Maybe<AutomationsStatus>;
  automationsStatus?: Maybe<TriggeredAutomationsStatus>;
  /** All comment threads in this version */
  commentThreads: CommentCollection;
  createdAt: Scalars['DateTime'];
  gendoAIRender: GendoAiRender;
  gendoAIRenders: GendoAiRenderCollection;
  id: Scalars['ID'];
  message?: Maybe<Scalars['String']>;
  model: Model;
  parents?: Maybe<Array<Maybe<Scalars['String']>>>;
  previewUrl: Scalars['String'];
  referencedObject: Scalars['String'];
  sourceApplication?: Maybe<Scalars['String']>;
  totalChildrenCount?: Maybe<Scalars['Int']>;
};


export type VersionCommentThreadsArgs = {
  cursor?: InputMaybe<Scalars['String']>;
  limit?: Scalars['Int'];
};


export type VersionGendoAiRenderArgs = {
  id: Scalars['String'];
};

export type VersionCollection = {
  __typename?: 'VersionCollection';
  cursor?: Maybe<Scalars['String']>;
  items: Array<Version>;
  totalCount: Scalars['Int'];
};

export type VersionCreatedTrigger = {
  __typename?: 'VersionCreatedTrigger';
  model: Model;
  type: AutomateRunTriggerType;
  version: Version;
};

export type VersionCreatedTriggerDefinition = {
  __typename?: 'VersionCreatedTriggerDefinition';
  model: Model;
  type: AutomateRunTriggerType;
};

export type VersionMutations = {
  __typename?: 'VersionMutations';
  delete: Scalars['Boolean'];
  moveToModel: Model;
  requestGendoAIRender: Scalars['Boolean'];
  update: Version;
};


export type VersionMutationsDeleteArgs = {
  input: DeleteVersionsInput;
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

export type ViewerResourceGroup = {
  __typename?: 'ViewerResourceGroup';
  /** Resource identifier used to refer to a collection of resource items */
  identifier: Scalars['String'];
  /** Viewer resources that the identifier refers to */
  items: Array<ViewerResourceItem>;
};

export type ViewerResourceItem = {
  __typename?: 'ViewerResourceItem';
  /** Null if resource represents an object */
  modelId?: Maybe<Scalars['String']>;
  objectId: Scalars['String'];
  /** Null if resource represents an object */
  versionId?: Maybe<Scalars['String']>;
};

export type ViewerUpdateTrackingTarget = {
  /**
   * By default if resourceIdString is set, the "versionId" part of model resource identifiers will be ignored
   * and all updates to of all versions of any of the referenced models will be returned. If `loadedVersionsOnly` is
   * enabled, then only updates of loaded/referenced versions in resourceIdString will be returned.
   */
  loadedVersionsOnly?: InputMaybe<Scalars['Boolean']>;
  projectId: Scalars['String'];
  /**
   * Only request updates to the resources identified by this
   * comma-delimited resouce string (same format that's used in the viewer URL)
   */
  resourceIdString: Scalars['String'];
};

export type ViewerUserActivityMessage = {
  __typename?: 'ViewerUserActivityMessage';
  sessionId: Scalars['String'];
  /** SerializedViewerState, only null if DISCONNECTED */
  state?: Maybe<Scalars['JSONObject']>;
  status: ViewerUserActivityStatus;
  user?: Maybe<LimitedUser>;
  userId?: Maybe<Scalars['String']>;
  userName: Scalars['String'];
};

export type ViewerUserActivityMessageInput = {
  sessionId: Scalars['String'];
  /** SerializedViewerState, only null if DISCONNECTED */
  state?: InputMaybe<Scalars['JSONObject']>;
  status: ViewerUserActivityStatus;
  userId?: InputMaybe<Scalars['String']>;
  userName: Scalars['String'];
};

export enum ViewerUserActivityStatus {
  Disconnected = 'DISCONNECTED',
  Viewing = 'VIEWING'
}

export type Webhook = {
  __typename?: 'Webhook';
  description?: Maybe<Scalars['String']>;
  enabled?: Maybe<Scalars['Boolean']>;
  hasSecret: Scalars['Boolean'];
  history?: Maybe<WebhookEventCollection>;
  id: Scalars['String'];
  projectId: Scalars['String'];
  streamId: Scalars['String'];
  triggers: Array<Scalars['String']>;
  url: Scalars['String'];
};


export type WebhookHistoryArgs = {
  limit?: Scalars['Int'];
};

export type WebhookCollection = {
  __typename?: 'WebhookCollection';
  items: Array<Webhook>;
  totalCount: Scalars['Int'];
};

export type WebhookCreateInput = {
  description?: InputMaybe<Scalars['String']>;
  enabled?: InputMaybe<Scalars['Boolean']>;
  secret?: InputMaybe<Scalars['String']>;
  streamId: Scalars['String'];
  triggers: Array<InputMaybe<Scalars['String']>>;
  url: Scalars['String'];
};

export type WebhookDeleteInput = {
  id: Scalars['String'];
  streamId: Scalars['String'];
};

export type WebhookEvent = {
  __typename?: 'WebhookEvent';
  id: Scalars['String'];
  lastUpdate: Scalars['DateTime'];
  payload: Scalars['String'];
  retryCount: Scalars['Int'];
  status: Scalars['Int'];
  statusInfo: Scalars['String'];
  webhookId: Scalars['String'];
};

export type WebhookEventCollection = {
  __typename?: 'WebhookEventCollection';
  items?: Maybe<Array<Maybe<WebhookEvent>>>;
  totalCount?: Maybe<Scalars['Int']>;
};

export type WebhookUpdateInput = {
  description?: InputMaybe<Scalars['String']>;
  enabled?: InputMaybe<Scalars['Boolean']>;
  id: Scalars['String'];
  secret?: InputMaybe<Scalars['String']>;
  streamId: Scalars['String'];
  triggers?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  url?: InputMaybe<Scalars['String']>;
};

export type CrossSyncCommitBranchMetadataQueryVariables = Exact<{
  streamId: Scalars['String'];
  commitId: Scalars['String'];
}>;


export type CrossSyncCommitBranchMetadataQuery = { __typename?: 'Query', stream?: { __typename?: 'Stream', commit?: { __typename?: 'Commit', id: string, branchName?: string | null } | null } | null };

export type CrossSyncBranchMetadataQueryVariables = Exact<{
  streamId: Scalars['String'];
  branchName: Scalars['String'];
}>;


export type CrossSyncBranchMetadataQuery = { __typename?: 'Query', stream?: { __typename?: 'Stream', branch?: { __typename?: 'Branch', id: string } | null } | null };

export type CrossSyncCommitDownloadMetadataQueryVariables = Exact<{
  streamId: Scalars['String'];
  commitId: Scalars['String'];
}>;


export type CrossSyncCommitDownloadMetadataQuery = { __typename?: 'Query', stream?: { __typename?: 'Stream', commit?: { __typename?: 'Commit', id: string, referencedObject: string, authorId?: string | null, message?: string | null, createdAt?: string | null, sourceApplication?: string | null, totalChildrenCount?: number | null, parents?: Array<string | null> | null } | null } | null };

export type CrossSyncProjectViewerResourcesQueryVariables = Exact<{
  projectId: Scalars['String'];
  resourceUrlString: Scalars['String'];
}>;


export type CrossSyncProjectViewerResourcesQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, viewerResources: Array<{ __typename?: 'ViewerResourceGroup', identifier: string, items: Array<{ __typename?: 'ViewerResourceItem', modelId?: string | null, versionId?: string | null, objectId: string }> }> } };

export type CrossSyncDownloadableCommitViewerThreadsQueryVariables = Exact<{
  projectId: Scalars['String'];
  filter: ProjectCommentsFilter;
  cursor?: InputMaybe<Scalars['String']>;
  limit?: InputMaybe<Scalars['Int']>;
}>;


export type CrossSyncDownloadableCommitViewerThreadsQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, commentThreads: { __typename?: 'ProjectCommentCollection', totalCount: number, totalArchivedCount: number, items: Array<{ __typename?: 'Comment', id: string, viewerState?: Record<string, unknown> | null, screenshot?: string | null, replies: { __typename?: 'CommentCollection', items: Array<{ __typename?: 'Comment', id: string, viewerState?: Record<string, unknown> | null, screenshot?: string | null, text: { __typename?: 'SmartTextEditorValue', doc?: Record<string, unknown> | null } }> }, text: { __typename?: 'SmartTextEditorValue', doc?: Record<string, unknown> | null } }> } } };

export type DownloadbleCommentMetadataFragment = { __typename?: 'Comment', id: string, viewerState?: Record<string, unknown> | null, screenshot?: string | null, text: { __typename?: 'SmartTextEditorValue', doc?: Record<string, unknown> | null } };

export type CrossSyncProjectMetadataQueryVariables = Exact<{
  id: Scalars['String'];
  versionsCursor?: InputMaybe<Scalars['String']>;
}>;


export type CrossSyncProjectMetadataQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, name: string, description?: string | null, visibility: ProjectVisibility, versions: { __typename?: 'VersionCollection', totalCount: number, cursor?: string | null, items: Array<{ __typename?: 'Version', id: string, createdAt: string, model: { __typename?: 'Model', id: string, name: string } }> } } };

export type CrossSyncClientTestQueryVariables = Exact<{ [key: string]: never; }>;


export type CrossSyncClientTestQuery = { __typename?: 'Query', _?: string | null };
