/* eslint-disable */
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
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
  BigInt: { input: any; output: any; }
  /** A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
  DateTime: { input: string; output: string; }
  /** The `JSONObject` scalar type represents JSON objects as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSONObject: { input: {}; output: {}; }
};

export type ActiveUserMutations = {
  __typename?: 'ActiveUserMutations';
  /** Mark onboarding as complete */
  finishOnboarding: Scalars['Boolean']['output'];
  /** Edit a user's profile */
  update: User;
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
  items?: Maybe<Array<Maybe<Activity>>>;
  totalCount: Scalars['Int']['output'];
};

export type AdminInviteList = {
  __typename?: 'AdminInviteList';
  cursor?: Maybe<Scalars['String']['output']>;
  items: Array<ServerInvite>;
  totalCount: Scalars['Int']['output'];
};

export type AdminQueries = {
  __typename?: 'AdminQueries';
  inviteList: AdminInviteList;
  projectList: ProjectCollection;
  serverStatistics: ServerStatistics;
  userList: AdminUserList;
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
};

export type AutomateFunction = {
  __typename?: 'AutomateFunction';
  automationCount: Scalars['Int']['output'];
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

export enum AutomateFunctionTemplateLanguage {
  DotNet = 'DOT_NET',
  Python = 'PYTHON',
  Typescript = 'TYPESCRIPT'
}

export type AutomateFunctionsFilter = {
  featuredFunctionsOnly?: InputMaybe<Scalars['Boolean']['input']>;
  /** By default we skip functions without releases. Set this to true to include them. */
  functionsWithoutReleases?: InputMaybe<Scalars['Boolean']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
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
  VersionCreated = 'VERSION_CREATED'
}

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

export type AvatarUser = {
  __typename?: 'AvatarUser';
  avatar?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export type BasicGitRepositoryMetadata = {
  __typename?: 'BasicGitRepositoryMetadata';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  owner: Scalars['String']['output'];
  url: Scalars['String']['output'];
};

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
  /** Plain-text version of the comment text, ideal for previews */
  rawText: Scalars['String']['output'];
  /** @deprecated Not actually implemented */
  reactions?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  /** Gets the replies to this comment. */
  replies: CommentCollection;
  /** Get authors of replies to this comment */
  replyAuthors: CommentReplyAuthorCollection;
  /** Resources that this comment targets. Can be a mixture of either one stream, or multiple commits and objects. */
  resources: Array<ResourceIdentifier>;
  screenshot?: Maybe<Scalars['String']['output']>;
  text: SmartTextEditorValue;
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
  archived?: Scalars['Boolean']['input'];
  commentId: Scalars['String']['input'];
};


export type CommentMutationsCreateArgs = {
  input: CreateCommentInput;
};


export type CommentMutationsEditArgs = {
  input: EditCommentInput;
};


export type CommentMutationsMarkViewedArgs = {
  commentId: Scalars['String']['input'];
};


export type CommentMutationsReplyArgs = {
  input: CreateCommentReplyInput;
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
};

export type CommitsMoveInput = {
  commitIds: Array<Scalars['String']['input']>;
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
  threadId: Scalars['String']['input'];
};

export type CreateModelInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  projectId: Scalars['ID']['input'];
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

export type DeleteModelInput = {
  id: Scalars['ID']['input'];
  projectId: Scalars['ID']['input'];
};

export type DeleteVersionsInput = {
  versionIds: Array<Scalars['String']['input']>;
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
  commentId: Scalars['String']['input'];
  content: CommentContentInput;
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
  createdAt: Scalars['String']['output'];
  gendoGenerationId?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  modelId: Scalars['String']['output'];
  projectId: Scalars['String']['output'];
  prompt: Scalars['String']['output'];
  /** This is a blob id. */
  responseImage?: Maybe<Scalars['String']['output']>;
  status: Scalars['String']['output'];
  updatedAt: Scalars['String']['output'];
  user?: Maybe<AvatarUser>;
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
  streams: StreamCollection;
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

export type MarkReceivedVersionInput = {
  message?: InputMaybe<Scalars['String']['input']>;
  projectId: Scalars['String']['input'];
  sourceApplication: Scalars['String']['input'];
  versionId: Scalars['String']['input'];
};

export type Model = {
  __typename?: 'Model';
  author: LimitedUser;
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
  /** If the name references a nonexistant model, it will be created */
  targetModelName: Scalars['String']['input'];
  versionIds: Array<Scalars['String']['input']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  /** The void stares back. */
  _?: Maybe<Scalars['String']['output']>;
  /** Various Active User oriented mutations */
  activeUserMutations: ActiveUserMutations;
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
  id: Scalars['ID']['output'];
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
  name: Scalars['String']['output'];
  object?: Maybe<Object>;
  /** Pending project access requests */
  pendingAccessRequests?: Maybe<Array<ProjectAccessRequest>>;
  /** Returns a list models that are being created from a file import */
  pendingImportedModels: Array<FileUpload>;
  /** Active user's role for this project. `null` if request is not authenticated, or the project is not explicitly shared with you. */
  role?: Maybe<Scalars['String']['output']>;
  /** Source apps used in any models of this project */
  sourceApps: Array<Scalars['String']['output']>;
  team: Array<ProjectCollaborator>;
  updatedAt: Scalars['DateTime']['output'];
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

export enum ProjectAutomationsUpdatedMessageType {
  Created = 'CREATED',
  CreatedRevision = 'CREATED_REVISION',
  Updated = 'UPDATED'
}

export type ProjectCollaborator = {
  __typename?: 'ProjectCollaborator';
  id: Scalars['ID']['output'];
  role: Scalars['String']['output'];
  user: LimitedUser;
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

export enum ProjectCommentsUpdatedMessageType {
  Archived = 'ARCHIVED',
  Created = 'CREATED',
  Updated = 'UPDATED'
}

/** Any values left null will be ignored */
export type ProjectCreateInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  visibility?: InputMaybe<ProjectVisibility>;
  workspaceId?: InputMaybe<Scalars['String']['input']>;
};

export type ProjectFileImportUpdatedMessage = {
  __typename?: 'ProjectFileImportUpdatedMessage';
  /** Upload ID */
  id: Scalars['String']['output'];
  type: ProjectFileImportUpdatedMessageType;
  upload: FileUpload;
};

export enum ProjectFileImportUpdatedMessageType {
  Created = 'CREATED',
  Updated = 'UPDATED'
}

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

export enum ProjectModelsUpdatedMessageType {
  Created = 'CREATED',
  Deleted = 'DELETED',
  Updated = 'UPDATED'
}

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

export enum ProjectPendingModelsUpdatedMessageType {
  Created = 'CREATED',
  Updated = 'UPDATED'
}

export type ProjectPendingVersionsUpdatedMessage = {
  __typename?: 'ProjectPendingVersionsUpdatedMessage';
  /** Upload ID */
  id: Scalars['String']['output'];
  type: ProjectPendingVersionsUpdatedMessageType;
  version: FileUpload;
};

export enum ProjectPendingVersionsUpdatedMessageType {
  Created = 'CREATED',
  Updated = 'UPDATED'
}

export type ProjectTestAutomationCreateInput = {
  functionId: Scalars['String']['input'];
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

export enum ProjectTriggeredAutomationsStatusUpdatedMessageType {
  RunCreated = 'RUN_CREATED',
  RunUpdated = 'RUN_UPDATED'
}

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

export enum ProjectUpdatedMessageType {
  Deleted = 'DELETED',
  Updated = 'UPDATED'
}

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
  /** Only set if version was deleted, in other scenarios can be queried from 'version' */
  modelId?: Maybe<Scalars['String']['output']>;
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
  streams?: Maybe<StreamCollection>;
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
   */
  userSearch: UserSearchResultCollection;
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
  token: Scalars['String']['input'];
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

export enum ResourceType {
  Comment = 'comment',
  Commit = 'commit',
  Object = 'object',
  Stream = 'stream'
}

export type Role = {
  __typename?: 'Role';
  description: Scalars['String']['output'];
  name: Scalars['String']['output'];
  resourceTarget: Scalars['String']['output'];
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

/** Information about this server. */
export type ServerInfo = {
  __typename?: 'ServerInfo';
  adminContact?: Maybe<Scalars['String']['output']>;
  /** The authentication strategies available on this server. */
  authStrategies: Array<AuthStrategy>;
  automate: ServerAutomateInfo;
  /** Base URL of Speckle Automate, if set */
  automateUrl?: Maybe<Scalars['String']['output']>;
  blobSizeLimitBytes: Scalars['Int']['output'];
  canonicalUrl?: Maybe<Scalars['String']['output']>;
  company?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  /** Whether or not to show messaging about FE2 (banners etc.) */
  enableNewWebUiMessaging?: Maybe<Scalars['Boolean']['output']>;
  guestModeEnabled: Scalars['Boolean']['output'];
  inviteOnly?: Maybe<Scalars['Boolean']['output']>;
  /** Server relocation / migration info */
  migration?: Maybe<ServerMigration>;
  name: Scalars['String']['output'];
  /** @deprecated Use role constants from the @speckle/shared npm package instead */
  roles: Array<Role>;
  scopes: Array<Scope>;
  serverRoles: Array<ServerRoleItem>;
  termsOfService?: Maybe<Scalars['String']['output']>;
  version?: Maybe<Scalars['String']['output']>;
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

export enum ServerRole {
  ServerAdmin = 'SERVER_ADMIN',
  ServerArchivedUser = 'SERVER_ARCHIVED_USER',
  ServerGuest = 'SERVER_GUEST',
  ServerUser = 'SERVER_USER'
}

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

export enum SortDirection {
  Asc = 'ASC',
  Desc = 'DESC'
}

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
  workspaceId?: InputMaybe<Scalars['String']['input']>;
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

export enum StreamRole {
  StreamContributor = 'STREAM_CONTRIBUTOR',
  StreamOwner = 'STREAM_OWNER',
  StreamReviewer = 'STREAM_REVIEWER'
}

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

export enum TokenResourceIdentifierType {
  Project = 'project'
}

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
};

export type UpdateModelInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  projectId: Scalars['ID']['input'];
};

/** Only non-null values will be updated */
export type UpdateVersionInput = {
  message?: InputMaybe<Scalars['String']['input']>;
  versionId: Scalars['String']['input'];
};

/**
 * Full user type, should only be used in the context of admin operations or
 * when a user is reading/writing info about himself
 */
export type User = {
  __typename?: 'User';
  /**
   * All the recent activity from this user in chronological order
   * @deprecated Part of the old API surface and will be removed in the future.
   */
  activity?: Maybe<ActivityCollection>;
  /** Returns a list of your personal api tokens. */
  apiTokens: Array<ApiToken>;
  /** Returns the apps you have authorized. */
  authorizedApps?: Maybe<Array<ServerAppListItem>>;
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
  /** Only returned if API user is the user being requested or an admin */
  email?: Maybe<Scalars['String']['output']>;
  /**
   * All the streams that a active user has favorited.
   * Note: You can't use this to retrieve another user's favorite streams.
   * @deprecated Part of the old API surface and will be removed in the future.
   */
  favoriteStreams: StreamCollection;
  /** Whether the user has a pending/active email verification token */
  hasPendingVerification?: Maybe<Scalars['Boolean']['output']>;
  id: Scalars['ID']['output'];
  /** Whether post-sign up onboarding has been finished or skipped entirely */
  isOnboardingFinished?: Maybe<Scalars['Boolean']['output']>;
  name: Scalars['String']['output'];
  notificationPreferences: Scalars['JSONObject']['output'];
  profiles?: Maybe<Scalars['JSONObject']['output']>;
  /** Get pending project access request, that the user made */
  projectAccessRequest?: Maybe<ProjectAccessRequest>;
  /** Get all invitations to projects that the active user has */
  projectInvites: Array<PendingStreamCollaborator>;
  /** Get projects that the user participates in */
  projects: ProjectCollection;
  role?: Maybe<Scalars['String']['output']>;
  /**
   * Returns all streams that the user is a collaborator on. If requested for a user, who isn't the
   * authenticated user, then this will only return discoverable streams.
   * @deprecated Part of the old API surface and will be removed in the future. Use User.projects instead.
   */
  streams: StreamCollection;
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

export type UserAutomateInfo = {
  __typename?: 'UserAutomateInfo';
  availableGithubOrgs: Array<Scalars['String']['output']>;
  hasAutomateGithubApp: Scalars['Boolean']['output'];
};

export type UserDeleteInput = {
  email: Scalars['String']['input'];
};

export type UserProjectsFilter = {
  /** Only include projects where user has the specified roles */
  onlyWithRoles?: InputMaybe<Array<Scalars['String']['input']>>;
  /** Filter out projects by name */
  search?: InputMaybe<Scalars['String']['input']>;
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

export enum UserProjectsUpdatedMessageType {
  Added = 'ADDED',
  Removed = 'REMOVED'
}

export type UserRoleInput = {
  id: Scalars['String']['input'];
  role: Scalars['String']['input'];
};

export type UserSearchResultCollection = {
  __typename?: 'UserSearchResultCollection';
  cursor?: Maybe<Scalars['String']['output']>;
  items: Array<LimitedUser>;
};

export type UserUpdateInput = {
  avatar?: InputMaybe<Scalars['String']['input']>;
  bio?: InputMaybe<Scalars['String']['input']>;
  company?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
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
  previewUrl: Scalars['String']['output'];
  referencedObject: Scalars['String']['output'];
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

export enum ViewerUserActivityStatus {
  Disconnected = 'DISCONNECTED',
  Viewing = 'VIEWING'
}

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
  triggers: Array<InputMaybe<Scalars['String']['input']>>;
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
  triggers?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  url?: InputMaybe<Scalars['String']['input']>;
};

export type AuthRegisterPanelServerInfoFragment = { __typename?: 'ServerInfo', inviteOnly?: boolean | null };

export type RegisterPanelServerInviteQueryVariables = Exact<{
  token: Scalars['String']['input'];
}>;


export type RegisterPanelServerInviteQuery = { __typename?: 'Query', serverInviteByToken?: { __typename?: 'ServerInvite', id: string, email: string } | null };

export type ServerTermsOfServicePrivacyPolicyFragmentFragment = { __typename?: 'ServerInfo', termsOfService?: string | null };

export type EmailVerificationBannerStateQueryVariables = Exact<{ [key: string]: never; }>;


export type EmailVerificationBannerStateQuery = { __typename?: 'Query', activeUser?: { __typename?: 'User', id: string, email?: string | null, verified?: boolean | null, hasPendingVerification?: boolean | null } | null };

export type RequestVerificationMutationVariables = Exact<{ [key: string]: never; }>;


export type RequestVerificationMutation = { __typename?: 'Mutation', requestVerification: boolean };

export type AuthStategiesServerInfoFragmentFragment = { __typename?: 'ServerInfo', authStrategies: Array<{ __typename?: 'AuthStrategy', id: string, name: string, url: string }> };

export type AutomateAutomationCreateDialog_AutomateFunctionFragment = { __typename?: 'AutomateFunction', id: string, name: string, isFeatured: boolean, description: string, logo?: string | null, repo: { __typename?: 'BasicGitRepositoryMetadata', id: string, url: string, owner: string, name: string }, releases: { __typename?: 'AutomateFunctionReleaseCollection', items: Array<{ __typename?: 'AutomateFunctionRelease', id: string, inputSchema?: {} | null }> } };

export type AutomateAutomationCreateDialogFunctionParametersStep_AutomateFunctionFragment = { __typename?: 'AutomateFunction', id: string, releases: { __typename?: 'AutomateFunctionReleaseCollection', items: Array<{ __typename?: 'AutomateFunctionRelease', id: string, inputSchema?: {} | null }> } };

export type AutomationCreateDialogFunctionsSearchQueryVariables = Exact<{
  search?: InputMaybe<Scalars['String']['input']>;
  cursor?: InputMaybe<Scalars['String']['input']>;
}>;


export type AutomationCreateDialogFunctionsSearchQuery = { __typename?: 'Query', automateFunctions: { __typename?: 'AutomateFunctionCollection', cursor?: string | null, totalCount: number, items: Array<{ __typename?: 'AutomateFunction', id: string, name: string, isFeatured: boolean, description: string, logo?: string | null, repo: { __typename?: 'BasicGitRepositoryMetadata', id: string, url: string, owner: string, name: string }, releases: { __typename?: 'AutomateFunctionReleaseCollection', items: Array<{ __typename?: 'AutomateFunctionRelease', id: string, inputSchema?: {} | null }> } }> } };

export type AutomationsFunctionsCard_AutomateFunctionFragment = { __typename?: 'AutomateFunction', id: string, name: string, isFeatured: boolean, description: string, logo?: string | null, repo: { __typename?: 'BasicGitRepositoryMetadata', id: string, url: string, owner: string, name: string } };

export type AutomateFunctionCreateDialogDoneStep_AutomateFunctionFragment = { __typename?: 'AutomateFunction', id: string, name: string, isFeatured: boolean, description: string, logo?: string | null, repo: { __typename?: 'BasicGitRepositoryMetadata', id: string, url: string, owner: string, name: string } };

export type AutomateFunctionCreateDialogTemplateStep_AutomateFunctionTemplateFragment = { __typename?: 'AutomateFunctionTemplate', id: AutomateFunctionTemplateLanguage, title: string, logo: string, url: string };

export type AutomateFunctionPageHeader_FunctionFragment = { __typename?: 'AutomateFunction', id: string, name: string, logo?: string | null, repo: { __typename?: 'BasicGitRepositoryMetadata', id: string, url: string, owner: string, name: string }, releases: { __typename?: 'AutomateFunctionReleaseCollection', totalCount: number } };

export type AutomateFunctionPageInfo_AutomateFunctionFragment = { __typename?: 'AutomateFunction', id: string, automationCount: number, description: string, repo: { __typename?: 'BasicGitRepositoryMetadata', id: string, url: string, owner: string, name: string }, releases: { __typename?: 'AutomateFunctionReleaseCollection', items: Array<{ __typename?: 'AutomateFunctionRelease', id: string, inputSchema?: {} | null, createdAt: string, commitId: string }> } };

export type AutomateFunctionPageParametersDialog_AutomateFunctionReleaseFragment = { __typename?: 'AutomateFunctionRelease', id: string, inputSchema?: {} | null };

export type AutomateFunctionsPageHeader_QueryFragment = { __typename?: 'Query', activeUser?: { __typename?: 'User', id: string, automateInfo: { __typename?: 'UserAutomateInfo', hasAutomateGithubApp: boolean, availableGithubOrgs: Array<string> } } | null, serverInfo: { __typename?: 'ServerInfo', automate: { __typename?: 'ServerAutomateInfo', availableFunctionTemplates: Array<{ __typename?: 'AutomateFunctionTemplate', id: AutomateFunctionTemplateLanguage, title: string, logo: string, url: string }> } } };

export type AutomateFunctionsPageItems_QueryFragment = { __typename?: 'Query', automateFunctions: { __typename?: 'AutomateFunctionCollection', totalCount: number, cursor?: string | null, items: Array<{ __typename?: 'AutomateFunction', id: string, name: string, isFeatured: boolean, description: string, logo?: string | null, repo: { __typename?: 'BasicGitRepositoryMetadata', id: string, url: string, owner: string, name: string }, releases: { __typename?: 'AutomateFunctionReleaseCollection', items: Array<{ __typename?: 'AutomateFunctionRelease', id: string, inputSchema?: {} | null }> } }> } };

export type AutomateRunsTriggerStatus_TriggeredAutomationsStatusFragment = { __typename?: 'TriggeredAutomationsStatus', id: string, automationRuns: Array<{ __typename?: 'AutomateRun', id: string, functionRuns: Array<{ __typename?: 'AutomateFunctionRun', id: string, updatedAt: string, status: AutomateRunStatus, results?: {} | null, statusMessage?: string | null, contextView?: string | null, createdAt: string, function?: { __typename?: 'AutomateFunction', id: string, logo?: string | null, name: string } | null }>, automation: { __typename?: 'Automation', id: string, name: string } }> };

export type AutomateRunsTriggerStatusDialog_TriggeredAutomationsStatusFragment = { __typename?: 'TriggeredAutomationsStatus', id: string, automationRuns: Array<{ __typename?: 'AutomateRun', id: string, functionRuns: Array<{ __typename?: 'AutomateFunctionRun', id: string, updatedAt: string, status: AutomateRunStatus, results?: {} | null, statusMessage?: string | null, contextView?: string | null, createdAt: string, function?: { __typename?: 'AutomateFunction', id: string, logo?: string | null, name: string } | null }>, automation: { __typename?: 'Automation', id: string, name: string } }> };

export type AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRunFragment = { __typename?: 'AutomateFunctionRun', id: string, results?: {} | null, status: AutomateRunStatus, statusMessage?: string | null, contextView?: string | null, createdAt: string, updatedAt: string, function?: { __typename?: 'AutomateFunction', id: string, logo?: string | null, name: string } | null };

export type AutomateRunsTriggerStatusDialogRunsRows_AutomateRunFragment = { __typename?: 'AutomateRun', id: string, functionRuns: Array<{ __typename?: 'AutomateFunctionRun', id: string, updatedAt: string, status: AutomateRunStatus, results?: {} | null, statusMessage?: string | null, contextView?: string | null, createdAt: string, function?: { __typename?: 'AutomateFunction', id: string, logo?: string | null, name: string } | null }>, automation: { __typename?: 'Automation', id: string, name: string } };

export type AutomateViewerPanel_AutomateRunFragment = { __typename?: 'AutomateRun', id: string, functionRuns: Array<{ __typename?: 'AutomateFunctionRun', id: string, updatedAt: string, status: AutomateRunStatus, results?: {} | null, statusMessage?: string | null, contextView?: string | null, createdAt: string, function?: { __typename?: 'AutomateFunction', id: string, logo?: string | null, name: string } | null }>, automation: { __typename?: 'Automation', id: string, name: string } };

export type AutomateViewerPanelFunctionRunRow_AutomateFunctionRunFragment = { __typename?: 'AutomateFunctionRun', id: string, results?: {} | null, status: AutomateRunStatus, statusMessage?: string | null, contextView?: string | null, createdAt: string, updatedAt: string, function?: { __typename?: 'AutomateFunction', id: string, logo?: string | null, name: string } | null };

export type CommonModelSelectorModelFragment = { __typename?: 'Model', id: string, name: string };

export type FormSelectModels_ModelFragment = { __typename?: 'Model', id: string, name: string };

export type FormSelectProjects_ProjectFragment = { __typename?: 'Project', id: string, name: string };

export type FormUsersSelectItemFragment = { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null };

export type HeaderNavShare_ProjectFragment = { __typename?: 'Project', id: string, visibility: ProjectVisibility, role?: string | null };

export type ProjectModelPageHeaderProjectFragment = { __typename?: 'Project', id: string, name: string, model: { __typename?: 'Model', id: string, name: string, description?: string | null } };

export type ProjectModelPageVersionsPaginationFragment = { __typename?: 'Project', id: string, visibility: ProjectVisibility, role?: string | null, model: { __typename?: 'Model', id: string, versions: { __typename?: 'VersionCollection', cursor?: string | null, totalCount: number, items: Array<{ __typename?: 'Version', id: string, message?: string | null, createdAt: string, previewUrl: string, sourceApplication?: string | null, authorUser?: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } | null, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number }, automationsStatus?: { __typename?: 'TriggeredAutomationsStatus', id: string, automationRuns: Array<{ __typename?: 'AutomateRun', id: string, functionRuns: Array<{ __typename?: 'AutomateFunctionRun', id: string, updatedAt: string, status: AutomateRunStatus, results?: {} | null, statusMessage?: string | null, contextView?: string | null, createdAt: string, function?: { __typename?: 'AutomateFunction', id: string, logo?: string | null, name: string } | null }>, automation: { __typename?: 'Automation', id: string, name: string } }> } | null }> } } };

export type ProjectModelPageVersionsProjectFragment = { __typename?: 'Project', id: string, role?: string | null, name: string, description?: string | null, visibility: ProjectVisibility, allowPublicComments: boolean, model: { __typename?: 'Model', id: string, name: string, pendingImportedVersions: Array<{ __typename?: 'FileUpload', id: string, projectId: string, modelName: string, convertedStatus: number, convertedMessage?: string | null, uploadDate: string, convertedLastUpdate: string, fileType: string, fileName: string }>, versions: { __typename?: 'VersionCollection', cursor?: string | null, totalCount: number, items: Array<{ __typename?: 'Version', id: string, message?: string | null, createdAt: string, previewUrl: string, sourceApplication?: string | null, authorUser?: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } | null, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number }, automationsStatus?: { __typename?: 'TriggeredAutomationsStatus', id: string, automationRuns: Array<{ __typename?: 'AutomateRun', id: string, functionRuns: Array<{ __typename?: 'AutomateFunctionRun', id: string, updatedAt: string, status: AutomateRunStatus, results?: {} | null, statusMessage?: string | null, contextView?: string | null, createdAt: string, function?: { __typename?: 'AutomateFunction', id: string, logo?: string | null, name: string } | null }>, automation: { __typename?: 'Automation', id: string, name: string } }> } | null }> } } };

export type ProjectModelPageDialogDeleteVersionFragment = { __typename?: 'Version', id: string, message?: string | null };

export type ProjectModelPageDialogEditMessageVersionFragment = { __typename?: 'Version', id: string, message?: string | null };

export type ProjectModelPageDialogMoveToVersionFragment = { __typename?: 'Version', id: string, message?: string | null };

export type ProjectsModelPageEmbed_ProjectFragment = { __typename?: 'Project', id: string, visibility: ProjectVisibility, role?: string | null };

export type ProjectModelPageVersionsCardVersionFragment = { __typename?: 'Version', id: string, message?: string | null, createdAt: string, previewUrl: string, sourceApplication?: string | null, authorUser?: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } | null, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number }, automationsStatus?: { __typename?: 'TriggeredAutomationsStatus', id: string, automationRuns: Array<{ __typename?: 'AutomateRun', id: string, functionRuns: Array<{ __typename?: 'AutomateFunctionRun', id: string, updatedAt: string, status: AutomateRunStatus, results?: {} | null, statusMessage?: string | null, contextView?: string | null, createdAt: string, function?: { __typename?: 'AutomateFunction', id: string, logo?: string | null, name: string } | null }>, automation: { __typename?: 'Automation', id: string, name: string } }> } | null };

export type ProjectPageProjectHeaderFragment = { __typename?: 'Project', id: string, role?: string | null, name: string, description?: string | null, visibility: ProjectVisibility, allowPublicComments: boolean };

export type ProjectPageInviteDialog_ProjectFragment = { __typename?: 'Project', id: string, role?: string | null, invitedTeam?: Array<{ __typename?: 'PendingStreamCollaborator', id: string, title: string, role: string, inviteId: string, user?: { __typename?: 'LimitedUser', role?: string | null, id: string, name: string, avatar?: string | null } | null }> | null, team: Array<{ __typename?: 'ProjectCollaborator', role: string, user: { __typename?: 'LimitedUser', role?: string | null, id: string, name: string, avatar?: string | null } }> };

export type ProjectPageAutomationFunctionSettingsDialog_AutomationRevisionFunctionFragment = { __typename?: 'AutomationRevisionFunction', parameters?: {} | null, release: { __typename?: 'AutomateFunctionRelease', id: string, inputSchema?: {} | null, function: { __typename?: 'AutomateFunction', id: string } } };

export type ProjectPageAutomationFunctionSettingsDialog_AutomationRevisionFragment = { __typename?: 'AutomationRevision', id: string, triggerDefinitions: Array<{ __typename?: 'VersionCreatedTriggerDefinition', type: AutomateRunTriggerType, model?: { __typename?: 'Model', id: string, name: string } | null }> };

export type ProjectPageAutomationFunctions_AutomationFragment = { __typename?: 'Automation', id: string, currentRevision?: { __typename?: 'AutomationRevision', id: string, functions: Array<{ __typename?: 'AutomationRevisionFunction', parameters?: {} | null, release: { __typename?: 'AutomateFunctionRelease', id: string, inputSchema?: {} | null, function: { __typename?: 'AutomateFunction', id: string, name: string, isFeatured: boolean, description: string, logo?: string | null, releases: { __typename?: 'AutomateFunctionReleaseCollection', items: Array<{ __typename?: 'AutomateFunctionRelease', id: string }> }, repo: { __typename?: 'BasicGitRepositoryMetadata', id: string, url: string, owner: string, name: string } } } }>, triggerDefinitions: Array<{ __typename?: 'VersionCreatedTriggerDefinition', type: AutomateRunTriggerType, model?: { __typename?: 'Model', id: string, name: string } | null }> } | null };

export type ProjectPageAutomationHeader_AutomationFragment = { __typename?: 'Automation', id: string, name: string, enabled: boolean, isTestAutomation: boolean, currentRevision?: { __typename?: 'AutomationRevision', id: string, triggerDefinitions: Array<{ __typename?: 'VersionCreatedTriggerDefinition', model?: { __typename?: 'Model', id: string, name: string, displayName: string, previewUrl?: string | null, createdAt: string, updatedAt: string, description?: string | null, versionCount: { __typename?: 'VersionCollection', totalCount: number }, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number }, pendingImportedVersions: Array<{ __typename?: 'FileUpload', id: string, projectId: string, modelName: string, convertedStatus: number, convertedMessage?: string | null, uploadDate: string, convertedLastUpdate: string, fileType: string, fileName: string }>, automationsStatus?: { __typename?: 'TriggeredAutomationsStatus', id: string, automationRuns: Array<{ __typename?: 'AutomateRun', id: string, functionRuns: Array<{ __typename?: 'AutomateFunctionRun', id: string, updatedAt: string, status: AutomateRunStatus, results?: {} | null, statusMessage?: string | null, contextView?: string | null, createdAt: string, function?: { __typename?: 'AutomateFunction', id: string, logo?: string | null, name: string } | null }>, automation: { __typename?: 'Automation', id: string, name: string } }> } | null } | null }> } | null };

export type ProjectPageAutomationHeader_ProjectFragment = { __typename?: 'Project', id: string, role?: string | null, visibility: ProjectVisibility };

export type ProjectPageAutomationRuns_AutomationFragment = { __typename?: 'Automation', id: string, name: string, enabled: boolean, isTestAutomation: boolean, runs: { __typename?: 'AutomateRunCollection', totalCount: number, cursor?: string | null, items: Array<{ __typename?: 'AutomateRun', id: string, status: AutomateRunStatus, createdAt: string, updatedAt: string, functionRuns: Array<{ __typename?: 'AutomateFunctionRun', statusMessage?: string | null, id: string, status: AutomateRunStatus }>, trigger: { __typename?: 'VersionCreatedTrigger', version?: { __typename?: 'Version', id: string } | null, model?: { __typename?: 'Model', id: string } | null } }> } };

export type ProjectPageAutomationsEmptyState_QueryFragment = { __typename?: 'Query', automateFunctions: { __typename?: 'AutomateFunctionCollection', items: Array<{ __typename?: 'AutomateFunction', id: string, name: string, isFeatured: boolean, description: string, logo?: string | null, repo: { __typename?: 'BasicGitRepositoryMetadata', id: string, url: string, owner: string, name: string }, releases: { __typename?: 'AutomateFunctionReleaseCollection', items: Array<{ __typename?: 'AutomateFunctionRelease', id: string, inputSchema?: {} | null }> } }> } };

export type ProjectPageAutomationsRow_AutomationFragment = { __typename?: 'Automation', id: string, name: string, enabled: boolean, isTestAutomation: boolean, currentRevision?: { __typename?: 'AutomationRevision', id: string, triggerDefinitions: Array<{ __typename?: 'VersionCreatedTriggerDefinition', model?: { __typename?: 'Model', id: string, name: string } | null }> } | null, runs: { __typename?: 'AutomateRunCollection', totalCount: number, cursor?: string | null, items: Array<{ __typename?: 'AutomateRun', id: string, status: AutomateRunStatus, createdAt: string, updatedAt: string, functionRuns: Array<{ __typename?: 'AutomateFunctionRun', statusMessage?: string | null, id: string, status: AutomateRunStatus }>, trigger: { __typename?: 'VersionCreatedTrigger', version?: { __typename?: 'Version', id: string } | null, model?: { __typename?: 'Model', id: string } | null } }> } };

export type ProjectDiscussionsPageHeader_ProjectFragment = { __typename?: 'Project', id: string, name: string };

export type ProjectDiscussionsPageResults_ProjectFragment = { __typename?: 'Project', id: string };

export type ProjectPageModelsActionsFragment = { __typename?: 'Model', id: string, name: string };

export type ProjectPageModelsActions_ProjectFragment = { __typename?: 'Project', id: string, visibility: ProjectVisibility, role?: string | null };

export type ProjectPageModelsCardProjectFragment = { __typename?: 'Project', id: string, role?: string | null, visibility: ProjectVisibility };

export type ProjectModelsPageHeader_ProjectFragment = { __typename?: 'Project', id: string, name: string, sourceApps: Array<string>, role?: string | null, team: Array<{ __typename?: 'ProjectCollaborator', id: string, user: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } }> };

export type ProjectModelsPageResults_ProjectFragment = { __typename?: 'Project', id: string, role?: string | null, visibility: ProjectVisibility, modelCount: { __typename?: 'ModelCollection', totalCount: number } };

export type ProjectPageModelsStructureItem_ProjectFragment = { __typename?: 'Project', id: string, visibility: ProjectVisibility, role?: string | null };

export type SingleLevelModelTreeItemFragment = { __typename?: 'ModelsTreeItem', id: string, name: string, fullName: string, hasChildren: boolean, updatedAt: string, model?: { __typename?: 'Model', id: string, name: string, displayName: string, previewUrl?: string | null, createdAt: string, updatedAt: string, description?: string | null, versionCount: { __typename?: 'VersionCollection', totalCount: number }, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number }, pendingImportedVersions: Array<{ __typename?: 'FileUpload', id: string, projectId: string, modelName: string, convertedStatus: number, convertedMessage?: string | null, uploadDate: string, convertedLastUpdate: string, fileType: string, fileName: string }>, automationsStatus?: { __typename?: 'TriggeredAutomationsStatus', id: string, automationRuns: Array<{ __typename?: 'AutomateRun', id: string, functionRuns: Array<{ __typename?: 'AutomateFunctionRun', id: string, updatedAt: string, status: AutomateRunStatus, results?: {} | null, statusMessage?: string | null, contextView?: string | null, createdAt: string, function?: { __typename?: 'AutomateFunction', id: string, logo?: string | null, name: string } | null }>, automation: { __typename?: 'Automation', id: string, name: string } }> } | null } | null };

export type ProjectPageModelsCardDeleteDialogFragment = { __typename?: 'Model', id: string, name: string };

export type ProjectPageModelsCardRenameDialogFragment = { __typename?: 'Model', id: string, name: string, description?: string | null };

export type ProjectPageSettingsCollaboratorsQueryVariables = Exact<{
  projectId: Scalars['String']['input'];
}>;


export type ProjectPageSettingsCollaboratorsQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, role?: string | null, invitedTeam?: Array<{ __typename?: 'PendingStreamCollaborator', id: string, title: string, role: string, inviteId: string, user?: { __typename?: 'LimitedUser', role?: string | null, id: string, name: string, avatar?: string | null } | null }> | null, team: Array<{ __typename?: 'ProjectCollaborator', role: string, user: { __typename?: 'LimitedUser', role?: string | null, id: string, name: string, avatar?: string | null } }> } };

export type ProjectPageSettingsGeneralQueryVariables = Exact<{
  projectId: Scalars['String']['input'];
}>;


export type ProjectPageSettingsGeneralQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, role?: string | null, name: string, description?: string | null, visibility: ProjectVisibility, allowPublicComments: boolean, team: Array<{ __typename?: 'ProjectCollaborator', role: string, user: { __typename?: 'LimitedUser', role?: string | null, id: string, name: string, avatar?: string | null } }>, models: { __typename?: 'ModelCollection', totalCount: number }, commentThreads: { __typename?: 'ProjectCommentCollection', totalCount: number }, invitedTeam?: Array<{ __typename?: 'PendingStreamCollaborator', id: string, title: string, role: string, inviteId: string, user?: { __typename?: 'LimitedUser', role?: string | null, id: string, name: string, avatar?: string | null } | null }> | null } };

export type ProjectPageSettingsGeneralBlockAccess_ProjectFragment = { __typename?: 'Project', id: string, visibility: ProjectVisibility };

export type ProjectPageSettingsGeneralBlockDelete_ProjectFragment = { __typename?: 'Project', id: string, name: string, role?: string | null, models: { __typename?: 'ModelCollection', totalCount: number }, commentThreads: { __typename?: 'ProjectCommentCollection', totalCount: number } };

export type ProjectPageSettingsGeneralBlockDiscussions_ProjectFragment = { __typename?: 'Project', id: string, visibility: ProjectVisibility, allowPublicComments: boolean };

export type ProjectPageSettingsGeneralBlockLeave_ProjectFragment = { __typename?: 'Project', id: string, name: string, role?: string | null, team: Array<{ __typename?: 'ProjectCollaborator', role: string, user: { __typename?: 'LimitedUser', role?: string | null, id: string, name: string, avatar?: string | null } }> };

export type ProjectPageSettingsGeneralBlockProjectInfo_ProjectFragment = { __typename?: 'Project', id: string, role?: string | null, name: string, description?: string | null };

export type ProjectPageTeamDialogFragment = { __typename?: 'Project', id: string, name: string, role?: string | null, allowPublicComments: boolean, visibility: ProjectVisibility, team: Array<{ __typename?: 'ProjectCollaborator', id: string, role: string, user: { __typename?: 'LimitedUser', role?: string | null, id: string, name: string, avatar?: string | null } }>, invitedTeam?: Array<{ __typename?: 'PendingStreamCollaborator', id: string, title: string, inviteId: string, role: string, user?: { __typename?: 'LimitedUser', role?: string | null, id: string, name: string, avatar?: string | null } | null }> | null };

export type ProjectsPageTeamDialogManagePermissions_ProjectFragment = { __typename?: 'Project', id: string, visibility: ProjectVisibility, role?: string | null };

export type OnUserProjectsUpdateSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type OnUserProjectsUpdateSubscription = { __typename?: 'Subscription', userProjectsUpdated: { __typename?: 'UserProjectsUpdatedMessage', type: UserProjectsUpdatedMessageType, id: string, project?: { __typename?: 'Project', id: string, name: string, createdAt: string, updatedAt: string, role?: string | null, visibility: ProjectVisibility, models: { __typename?: 'ModelCollection', totalCount: number, items: Array<{ __typename?: 'Model', id: string, name: string, displayName: string, previewUrl?: string | null, createdAt: string, updatedAt: string, description?: string | null, versionCount: { __typename?: 'VersionCollection', totalCount: number }, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number }, pendingImportedVersions: Array<{ __typename?: 'FileUpload', id: string, projectId: string, modelName: string, convertedStatus: number, convertedMessage?: string | null, uploadDate: string, convertedLastUpdate: string, fileType: string, fileName: string }>, automationsStatus?: { __typename?: 'TriggeredAutomationsStatus', id: string, automationRuns: Array<{ __typename?: 'AutomateRun', id: string, functionRuns: Array<{ __typename?: 'AutomateFunctionRun', id: string, updatedAt: string, status: AutomateRunStatus, results?: {} | null, statusMessage?: string | null, contextView?: string | null, createdAt: string, function?: { __typename?: 'AutomateFunction', id: string, logo?: string | null, name: string } | null }>, automation: { __typename?: 'Automation', id: string, name: string } }> } | null }> }, pendingImportedModels: Array<{ __typename?: 'FileUpload', id: string, projectId: string, modelName: string, convertedStatus: number, convertedMessage?: string | null, uploadDate: string, convertedLastUpdate: string, fileType: string, fileName: string }>, team: Array<{ __typename?: 'ProjectCollaborator', id: string, user: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } }> } | null } };

export type ProjectsDashboardFilledFragment = { __typename?: 'ProjectCollection', items: Array<{ __typename?: 'Project', id: string, name: string, createdAt: string, updatedAt: string, role?: string | null, visibility: ProjectVisibility, models: { __typename?: 'ModelCollection', totalCount: number, items: Array<{ __typename?: 'Model', id: string, name: string, displayName: string, previewUrl?: string | null, createdAt: string, updatedAt: string, description?: string | null, versionCount: { __typename?: 'VersionCollection', totalCount: number }, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number }, pendingImportedVersions: Array<{ __typename?: 'FileUpload', id: string, projectId: string, modelName: string, convertedStatus: number, convertedMessage?: string | null, uploadDate: string, convertedLastUpdate: string, fileType: string, fileName: string }>, automationsStatus?: { __typename?: 'TriggeredAutomationsStatus', id: string, automationRuns: Array<{ __typename?: 'AutomateRun', id: string, functionRuns: Array<{ __typename?: 'AutomateFunctionRun', id: string, updatedAt: string, status: AutomateRunStatus, results?: {} | null, statusMessage?: string | null, contextView?: string | null, createdAt: string, function?: { __typename?: 'AutomateFunction', id: string, logo?: string | null, name: string } | null }>, automation: { __typename?: 'Automation', id: string, name: string } }> } | null }> }, pendingImportedModels: Array<{ __typename?: 'FileUpload', id: string, projectId: string, modelName: string, convertedStatus: number, convertedMessage?: string | null, uploadDate: string, convertedLastUpdate: string, fileType: string, fileName: string }>, team: Array<{ __typename?: 'ProjectCollaborator', id: string, user: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } }> }> };

export type ProjectsInviteBannerFragment = { __typename?: 'PendingStreamCollaborator', id: string, projectId: string, projectName: string, token?: string | null, invitedBy: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null }, user?: { __typename?: 'LimitedUser', id: string } | null };

export type ProjectsInviteBannersFragment = { __typename?: 'User', projectInvites: Array<{ __typename?: 'PendingStreamCollaborator', id: string, projectId: string, projectName: string, token?: string | null, invitedBy: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null }, user?: { __typename?: 'LimitedUser', id: string } | null }> };

export type UserProfileEditDialogAvatar_UserFragment = { __typename?: 'User', id: string, avatar?: string | null, name: string };

export type UserProfileEditDialogBio_UserFragment = { __typename?: 'User', id: string, name: string, company?: string | null, bio?: string | null, avatar?: string | null };

export type UserProfileEditDialogDeleteAccount_UserFragment = { __typename?: 'User', id: string, email?: string | null };

export type UserProfileEditDialogNotificationPreferences_UserFragment = { __typename?: 'User', id: string, notificationPreferences: {} };

export type ModelPageProjectFragment = { __typename?: 'Project', id: string, createdAt: string, name: string, visibility: ProjectVisibility };

export type ThreadCommentAttachmentFragment = { __typename?: 'Comment', text: { __typename?: 'SmartTextEditorValue', attachments?: Array<{ __typename?: 'BlobMetadata', id: string, fileName: string, fileType: string, fileSize?: number | null }> | null } };

export type ViewerCommentsListItemFragment = { __typename?: 'Comment', id: string, rawText: string, archived: boolean, createdAt: string, viewedAt?: string | null, author: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null }, replies: { __typename?: 'CommentCollection', totalCount: number, cursor?: string | null, items: Array<{ __typename?: 'Comment', id: string, archived: boolean, rawText: string, createdAt: string, text: { __typename?: 'SmartTextEditorValue', doc?: {} | null, attachments?: Array<{ __typename?: 'BlobMetadata', id: string, fileName: string, fileType: string, fileSize?: number | null }> | null }, author: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } }> }, replyAuthors: { __typename?: 'CommentReplyAuthorCollection', totalCount: number, items: Array<{ __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null }> }, resources: Array<{ __typename?: 'ResourceIdentifier', resourceId: string, resourceType: ResourceType }> };

export type ViewerModelVersionCardItemFragment = { __typename?: 'Version', id: string, message?: string | null, referencedObject: string, sourceApplication?: string | null, createdAt: string, previewUrl: string, authorUser?: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } | null };

export type ActiveUserMainMetadataQueryVariables = Exact<{ [key: string]: never; }>;


export type ActiveUserMainMetadataQuery = { __typename?: 'Query', activeUser?: { __typename?: 'User', id: string, email?: string | null, company?: string | null, bio?: string | null, name: string, role?: string | null, avatar?: string | null, isOnboardingFinished?: boolean | null, createdAt?: string | null, verified?: boolean | null, notificationPreferences: {}, versions: { __typename?: 'CountOnlyCollection', totalCount: number } } | null };

export type CreateOnboardingProjectMutationVariables = Exact<{ [key: string]: never; }>;


export type CreateOnboardingProjectMutation = { __typename?: 'Mutation', projectMutations: { __typename?: 'ProjectMutations', createForOnboarding: { __typename?: 'Project', id: string, createdAt: string, role?: string | null, name: string, description?: string | null, visibility: ProjectVisibility, allowPublicComments: boolean, updatedAt: string, modelCount: { __typename?: 'ModelCollection', totalCount: number }, commentThreadCount: { __typename?: 'ProjectCommentCollection', totalCount: number }, models: { __typename?: 'ModelCollection', totalCount: number, items: Array<{ __typename?: 'Model', id: string, name: string, displayName: string, previewUrl?: string | null, createdAt: string, updatedAt: string, description?: string | null, versionCount: { __typename?: 'VersionCollection', totalCount: number }, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number }, pendingImportedVersions: Array<{ __typename?: 'FileUpload', id: string, projectId: string, modelName: string, convertedStatus: number, convertedMessage?: string | null, uploadDate: string, convertedLastUpdate: string, fileType: string, fileName: string }>, automationsStatus?: { __typename?: 'TriggeredAutomationsStatus', id: string, automationRuns: Array<{ __typename?: 'AutomateRun', id: string, functionRuns: Array<{ __typename?: 'AutomateFunctionRun', id: string, updatedAt: string, status: AutomateRunStatus, results?: {} | null, statusMessage?: string | null, contextView?: string | null, createdAt: string, function?: { __typename?: 'AutomateFunction', id: string, logo?: string | null, name: string } | null }>, automation: { __typename?: 'Automation', id: string, name: string } }> } | null }> }, pendingImportedModels: Array<{ __typename?: 'FileUpload', id: string, projectId: string, modelName: string, convertedStatus: number, convertedMessage?: string | null, uploadDate: string, convertedLastUpdate: string, fileType: string, fileName: string }>, team: Array<{ __typename?: 'ProjectCollaborator', id: string, role: string, user: { __typename?: 'LimitedUser', role?: string | null, id: string, name: string, avatar?: string | null } }>, invitedTeam?: Array<{ __typename?: 'PendingStreamCollaborator', id: string, title: string, inviteId: string, role: string, user?: { __typename?: 'LimitedUser', role?: string | null, id: string, name: string, avatar?: string | null } | null }> | null } } };

export type FinishOnboardingMutationVariables = Exact<{ [key: string]: never; }>;


export type FinishOnboardingMutation = { __typename?: 'Mutation', activeUserMutations: { __typename?: 'ActiveUserMutations', finishOnboarding: boolean } };

export type RequestVerificationByEmailMutationVariables = Exact<{
  email: Scalars['String']['input'];
}>;


export type RequestVerificationByEmailMutation = { __typename?: 'Mutation', requestVerificationByEmail: boolean };

export type AuthServerInfoQueryVariables = Exact<{ [key: string]: never; }>;


export type AuthServerInfoQuery = { __typename?: 'Query', serverInfo: { __typename?: 'ServerInfo', termsOfService?: string | null, inviteOnly?: boolean | null, authStrategies: Array<{ __typename?: 'AuthStrategy', id: string, name: string, url: string }> } };

export type AuthorizableAppMetadataQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type AuthorizableAppMetadataQuery = { __typename?: 'Query', app?: { __typename?: 'ServerApp', id: string, name: string, description?: string | null, trustByDefault?: boolean | null, redirectUrl: string, scopes: Array<{ __typename?: 'Scope', name: string, description: string }>, author?: { __typename?: 'AppAuthor', name: string, id: string, avatar?: string | null } | null } | null };

export type FunctionRunStatusForSummaryFragment = { __typename?: 'AutomateFunctionRun', id: string, status: AutomateRunStatus };

export type TriggeredAutomationsStatusSummaryFragment = { __typename?: 'TriggeredAutomationsStatus', id: string, automationRuns: Array<{ __typename?: 'AutomateRun', id: string, functionRuns: Array<{ __typename?: 'AutomateFunctionRun', id: string, status: AutomateRunStatus }> }> };

export type AutomationRunDetailsFragment = { __typename?: 'AutomateRun', id: string, status: AutomateRunStatus, createdAt: string, updatedAt: string, functionRuns: Array<{ __typename?: 'AutomateFunctionRun', statusMessage?: string | null, id: string, status: AutomateRunStatus }>, trigger: { __typename?: 'VersionCreatedTrigger', version?: { __typename?: 'Version', id: string } | null, model?: { __typename?: 'Model', id: string } | null } };

export type AutomationsStatusOrderedRuns_AutomationRunFragment = { __typename?: 'AutomateRun', id: string, automation: { __typename?: 'Automation', id: string, name: string }, functionRuns: Array<{ __typename?: 'AutomateFunctionRun', id: string, updatedAt: string }> };

export type SearchAutomateFunctionReleaseItemFragment = { __typename?: 'AutomateFunctionRelease', id: string, versionTag: string, createdAt: string, inputSchema?: {} | null };

export type CreateAutomateFunctionMutationVariables = Exact<{
  input: CreateAutomateFunctionInput;
}>;


export type CreateAutomateFunctionMutation = { __typename?: 'Mutation', automateMutations: { __typename?: 'AutomateMutations', createFunction: { __typename?: 'AutomateFunction', id: string, name: string, isFeatured: boolean, description: string, logo?: string | null, repo: { __typename?: 'BasicGitRepositoryMetadata', id: string, url: string, owner: string, name: string } } } };

export type UpdateAutomateFunctionMutationVariables = Exact<{
  input: UpdateAutomateFunctionInput;
}>;


export type UpdateAutomateFunctionMutation = { __typename?: 'Mutation', automateMutations: { __typename?: 'AutomateMutations', updateFunction: { __typename?: 'AutomateFunction', id: string, name: string, description: string, logo?: string | null, supportedSourceApps: Array<string>, tags: Array<string>, automationCount: number, isFeatured: boolean, creator?: { __typename?: 'LimitedUser', id: string } | null, repo: { __typename?: 'BasicGitRepositoryMetadata', id: string, url: string, owner: string, name: string }, releases: { __typename?: 'AutomateFunctionReleaseCollection', totalCount: number, items: Array<{ __typename?: 'AutomateFunctionRelease', id: string, inputSchema?: {} | null, createdAt: string, commitId: string }> } } } };

export type SearchAutomateFunctionReleasesQueryVariables = Exact<{
  functionId: Scalars['ID']['input'];
  cursor?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  filter?: InputMaybe<AutomateFunctionReleasesFilter>;
}>;


export type SearchAutomateFunctionReleasesQuery = { __typename?: 'Query', automateFunction: { __typename?: 'AutomateFunction', id: string, releases: { __typename?: 'AutomateFunctionReleaseCollection', cursor?: string | null, totalCount: number, items: Array<{ __typename?: 'AutomateFunctionRelease', id: string, versionTag: string, createdAt: string, inputSchema?: {} | null }> } } };

export type FunctionAccessCheckQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type FunctionAccessCheckQuery = { __typename?: 'Query', automateFunction: { __typename?: 'AutomateFunction', id: string } };

export type ProjectAutomationCreationPublicKeysQueryVariables = Exact<{
  projectId: Scalars['String']['input'];
  automationId: Scalars['String']['input'];
}>;


export type ProjectAutomationCreationPublicKeysQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, automation: { __typename?: 'Automation', id: string, creationPublicKeys: Array<string> } } };

export type AutomateFunctionsPagePaginationQueryVariables = Exact<{
  search?: InputMaybe<Scalars['String']['input']>;
  cursor?: InputMaybe<Scalars['String']['input']>;
}>;


export type AutomateFunctionsPagePaginationQuery = { __typename?: 'Query', automateFunctions: { __typename?: 'AutomateFunctionCollection', totalCount: number, cursor?: string | null, items: Array<{ __typename?: 'AutomateFunction', id: string, name: string, isFeatured: boolean, description: string, logo?: string | null, repo: { __typename?: 'BasicGitRepositoryMetadata', id: string, url: string, owner: string, name: string }, releases: { __typename?: 'AutomateFunctionReleaseCollection', items: Array<{ __typename?: 'AutomateFunctionRelease', id: string, inputSchema?: {} | null }> } }> } };

export type MentionsUserSearchQueryVariables = Exact<{
  query: Scalars['String']['input'];
  emailOnly?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type MentionsUserSearchQuery = { __typename?: 'Query', userSearch: { __typename?: 'UserSearchResultCollection', items: Array<{ __typename?: 'LimitedUser', id: string, name: string, company?: string | null }> } };

export type UserSearchQueryVariables = Exact<{
  query: Scalars['String']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  cursor?: InputMaybe<Scalars['String']['input']>;
  archived?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type UserSearchQuery = { __typename?: 'Query', userSearch: { __typename?: 'UserSearchResultCollection', cursor?: string | null, items: Array<{ __typename?: 'LimitedUser', id: string, name: string, bio?: string | null, company?: string | null, avatar?: string | null, verified?: boolean | null, role?: string | null }> } };

export type ServerInfoBlobSizeLimitQueryVariables = Exact<{ [key: string]: never; }>;


export type ServerInfoBlobSizeLimitQuery = { __typename?: 'Query', serverInfo: { __typename?: 'ServerInfo', blobSizeLimitBytes: number } };

export type ServerInfoAllScopesQueryVariables = Exact<{ [key: string]: never; }>;


export type ServerInfoAllScopesQuery = { __typename?: 'Query', serverInfo: { __typename?: 'ServerInfo', scopes: Array<{ __typename?: 'Scope', name: string, description: string }> } };

export type ProjectModelsSelectorValuesQueryVariables = Exact<{
  projectId: Scalars['String']['input'];
  cursor?: InputMaybe<Scalars['String']['input']>;
}>;


export type ProjectModelsSelectorValuesQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, models: { __typename?: 'ModelCollection', cursor?: string | null, totalCount: number, items: Array<{ __typename?: 'Model', id: string, name: string }> } } };

export type MainServerInfoDataQueryVariables = Exact<{ [key: string]: never; }>;


export type MainServerInfoDataQuery = { __typename?: 'Query', serverInfo: { __typename?: 'ServerInfo', adminContact?: string | null, blobSizeLimitBytes: number, canonicalUrl?: string | null, company?: string | null, description?: string | null, guestModeEnabled: boolean, inviteOnly?: boolean | null, name: string, termsOfService?: string | null, version?: string | null, automateUrl?: string | null } };

export type DeleteAccessTokenMutationVariables = Exact<{
  token: Scalars['String']['input'];
}>;


export type DeleteAccessTokenMutation = { __typename?: 'Mutation', apiTokenRevoke: boolean };

export type CreateAccessTokenMutationVariables = Exact<{
  token: ApiTokenCreateInput;
}>;


export type CreateAccessTokenMutation = { __typename?: 'Mutation', apiTokenCreate: string };

export type DeleteApplicationMutationVariables = Exact<{
  appId: Scalars['String']['input'];
}>;


export type DeleteApplicationMutation = { __typename?: 'Mutation', appDelete: boolean };

export type CreateApplicationMutationVariables = Exact<{
  app: AppCreateInput;
}>;


export type CreateApplicationMutation = { __typename?: 'Mutation', appCreate: string };

export type EditApplicationMutationVariables = Exact<{
  app: AppUpdateInput;
}>;


export type EditApplicationMutation = { __typename?: 'Mutation', appUpdate: boolean };

export type RevokeAppAccessMutationVariables = Exact<{
  appId: Scalars['String']['input'];
}>;


export type RevokeAppAccessMutation = { __typename?: 'Mutation', appRevokeAccess?: boolean | null };

export type DeveloperSettingsAccessTokensQueryVariables = Exact<{ [key: string]: never; }>;


export type DeveloperSettingsAccessTokensQuery = { __typename?: 'Query', activeUser?: { __typename?: 'User', id: string, apiTokens: Array<{ __typename?: 'ApiToken', id: string, name: string, lastUsed: string, lastChars: string, createdAt: string, scopes: Array<string | null> }> } | null };

export type DeveloperSettingsApplicationsQueryVariables = Exact<{ [key: string]: never; }>;


export type DeveloperSettingsApplicationsQuery = { __typename?: 'Query', activeUser?: { __typename?: 'User', id: string, createdApps?: Array<{ __typename?: 'ServerApp', id: string, secret?: string | null, name: string, description?: string | null, redirectUrl: string, scopes: Array<{ __typename?: 'Scope', name: string, description: string }> }> | null } | null };

export type DeveloperSettingsAuthorizedAppsQueryVariables = Exact<{ [key: string]: never; }>;


export type DeveloperSettingsAuthorizedAppsQuery = { __typename?: 'Query', activeUser?: { __typename?: 'User', id: string, authorizedApps?: Array<{ __typename?: 'ServerAppListItem', id: string, description?: string | null, name: string, author?: { __typename?: 'AppAuthor', id: string, name: string, avatar?: string | null } | null }> | null } | null };

export type SearchProjectsQueryVariables = Exact<{
  search?: InputMaybe<Scalars['String']['input']>;
  onlyWithRoles?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
}>;


export type SearchProjectsQuery = { __typename?: 'Query', activeUser?: { __typename?: 'User', projects: { __typename?: 'ProjectCollection', totalCount: number, items: Array<{ __typename?: 'Project', id: string, name: string }> } } | null };

export type SearchProjectModelsQueryVariables = Exact<{
  search?: InputMaybe<Scalars['String']['input']>;
  projectId: Scalars['String']['input'];
}>;


export type SearchProjectModelsQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, models: { __typename?: 'ModelCollection', totalCount: number, items: Array<{ __typename?: 'Model', id: string, name: string }> } } };

export type RequestGendoAiRenderMutationVariables = Exact<{
  input: GendoAiRenderInput;
}>;


export type RequestGendoAiRenderMutation = { __typename?: 'Mutation', versionMutations: { __typename?: 'VersionMutations', requestGendoAIRender: boolean } };

export type GendoAiRenderQueryVariables = Exact<{
  gendoAiRenderId: Scalars['String']['input'];
  versionId: Scalars['String']['input'];
  projectId: Scalars['String']['input'];
}>;


export type GendoAiRenderQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, version?: { __typename?: 'Version', id: string, gendoAIRender: { __typename?: 'GendoAIRender', id: string, projectId: string, modelId: string, versionId: string, createdAt: string, updatedAt: string, gendoGenerationId?: string | null, status: string, prompt: string, camera?: {} | null, responseImage?: string | null, user?: { __typename?: 'AvatarUser', name: string, avatar?: string | null, id: string } | null } } | null } };

export type GendoAiRendersQueryVariables = Exact<{
  versionId: Scalars['String']['input'];
  projectId: Scalars['String']['input'];
}>;


export type GendoAiRendersQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, version?: { __typename?: 'Version', id: string, gendoAIRenders: { __typename?: 'GendoAIRenderCollection', totalCount: number, items: Array<{ __typename?: 'GendoAIRender', id: string, createdAt: string, updatedAt: string, status: string, gendoGenerationId?: string | null, prompt: string, camera?: {} | null } | null> } } | null } };

export type ProjectVersionGendoAiRenderCreatedSubscriptionVariables = Exact<{
  id: Scalars['String']['input'];
  versionId: Scalars['String']['input'];
}>;


export type ProjectVersionGendoAiRenderCreatedSubscription = { __typename?: 'Subscription', projectVersionGendoAIRenderCreated: { __typename?: 'GendoAIRender', id: string, createdAt: string, updatedAt: string, status: string, gendoGenerationId?: string | null, prompt: string, camera?: {} | null } };

export type ProjectVersionGendoAiRenderUpdatedSubscriptionVariables = Exact<{
  id: Scalars['String']['input'];
  versionId: Scalars['String']['input'];
}>;


export type ProjectVersionGendoAiRenderUpdatedSubscription = { __typename?: 'Subscription', projectVersionGendoAIRenderUpdated: { __typename?: 'GendoAIRender', id: string, projectId: string, modelId: string, versionId: string, createdAt: string, updatedAt: string, gendoGenerationId?: string | null, status: string, prompt: string, camera?: {} | null, responseImage?: string | null } };

export type ProjectPageTeamInternals_ProjectFragment = { __typename?: 'Project', id: string, role?: string | null, invitedTeam?: Array<{ __typename?: 'PendingStreamCollaborator', id: string, title: string, role: string, inviteId: string, user?: { __typename?: 'LimitedUser', role?: string | null, id: string, name: string, avatar?: string | null } | null }> | null, team: Array<{ __typename?: 'ProjectCollaborator', role: string, user: { __typename?: 'LimitedUser', role?: string | null, id: string, name: string, avatar?: string | null } }> };

export type ProjectDashboardItemNoModelsFragment = { __typename?: 'Project', id: string, name: string, createdAt: string, updatedAt: string, role?: string | null, visibility: ProjectVisibility, team: Array<{ __typename?: 'ProjectCollaborator', id: string, user: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } }> };

export type ProjectDashboardItemFragment = { __typename?: 'Project', id: string, name: string, createdAt: string, updatedAt: string, role?: string | null, visibility: ProjectVisibility, models: { __typename?: 'ModelCollection', totalCount: number, items: Array<{ __typename?: 'Model', id: string, name: string, displayName: string, previewUrl?: string | null, createdAt: string, updatedAt: string, description?: string | null, versionCount: { __typename?: 'VersionCollection', totalCount: number }, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number }, pendingImportedVersions: Array<{ __typename?: 'FileUpload', id: string, projectId: string, modelName: string, convertedStatus: number, convertedMessage?: string | null, uploadDate: string, convertedLastUpdate: string, fileType: string, fileName: string }>, automationsStatus?: { __typename?: 'TriggeredAutomationsStatus', id: string, automationRuns: Array<{ __typename?: 'AutomateRun', id: string, functionRuns: Array<{ __typename?: 'AutomateFunctionRun', id: string, updatedAt: string, status: AutomateRunStatus, results?: {} | null, statusMessage?: string | null, contextView?: string | null, createdAt: string, function?: { __typename?: 'AutomateFunction', id: string, logo?: string | null, name: string } | null }>, automation: { __typename?: 'Automation', id: string, name: string } }> } | null }> }, pendingImportedModels: Array<{ __typename?: 'FileUpload', id: string, projectId: string, modelName: string, convertedStatus: number, convertedMessage?: string | null, uploadDate: string, convertedLastUpdate: string, fileType: string, fileName: string }>, team: Array<{ __typename?: 'ProjectCollaborator', id: string, user: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } }> };

export type PendingFileUploadFragment = { __typename?: 'FileUpload', id: string, projectId: string, modelName: string, convertedStatus: number, convertedMessage?: string | null, uploadDate: string, convertedLastUpdate: string, fileType: string, fileName: string };

export type ProjectPageLatestItemsModelItemFragment = { __typename?: 'Model', id: string, name: string, displayName: string, previewUrl?: string | null, createdAt: string, updatedAt: string, description?: string | null, versionCount: { __typename?: 'VersionCollection', totalCount: number }, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number }, pendingImportedVersions: Array<{ __typename?: 'FileUpload', id: string, projectId: string, modelName: string, convertedStatus: number, convertedMessage?: string | null, uploadDate: string, convertedLastUpdate: string, fileType: string, fileName: string }>, automationsStatus?: { __typename?: 'TriggeredAutomationsStatus', id: string, automationRuns: Array<{ __typename?: 'AutomateRun', id: string, functionRuns: Array<{ __typename?: 'AutomateFunctionRun', id: string, updatedAt: string, status: AutomateRunStatus, results?: {} | null, statusMessage?: string | null, contextView?: string | null, createdAt: string, function?: { __typename?: 'AutomateFunction', id: string, logo?: string | null, name: string } | null }>, automation: { __typename?: 'Automation', id: string, name: string } }> } | null };

export type ProjectUpdatableMetadataFragment = { __typename?: 'Project', id: string, name: string, description?: string | null, visibility: ProjectVisibility, allowPublicComments: boolean };

export type ProjectPageLatestItemsModelsFragment = { __typename?: 'Project', id: string, role?: string | null, visibility: ProjectVisibility, modelCount: { __typename?: 'ModelCollection', totalCount: number } };

export type ProjectPageLatestItemsCommentsFragment = { __typename?: 'Project', id: string, commentThreadCount: { __typename?: 'ProjectCommentCollection', totalCount: number } };

export type ProjectPageLatestItemsCommentItemFragment = { __typename?: 'Comment', id: string, screenshot?: string | null, rawText: string, createdAt: string, updatedAt: string, archived: boolean, author: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null }, repliesCount: { __typename?: 'CommentCollection', totalCount: number }, replyAuthors: { __typename?: 'CommentReplyAuthorCollection', totalCount: number, items: Array<{ __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null }> } };

export type CreateModelMutationVariables = Exact<{
  input: CreateModelInput;
}>;


export type CreateModelMutation = { __typename?: 'Mutation', modelMutations: { __typename?: 'ModelMutations', create: { __typename?: 'Model', id: string, name: string, displayName: string, previewUrl?: string | null, createdAt: string, updatedAt: string, description?: string | null, versionCount: { __typename?: 'VersionCollection', totalCount: number }, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number }, pendingImportedVersions: Array<{ __typename?: 'FileUpload', id: string, projectId: string, modelName: string, convertedStatus: number, convertedMessage?: string | null, uploadDate: string, convertedLastUpdate: string, fileType: string, fileName: string }>, automationsStatus?: { __typename?: 'TriggeredAutomationsStatus', id: string, automationRuns: Array<{ __typename?: 'AutomateRun', id: string, functionRuns: Array<{ __typename?: 'AutomateFunctionRun', id: string, updatedAt: string, status: AutomateRunStatus, results?: {} | null, statusMessage?: string | null, contextView?: string | null, createdAt: string, function?: { __typename?: 'AutomateFunction', id: string, logo?: string | null, name: string } | null }>, automation: { __typename?: 'Automation', id: string, name: string } }> } | null } } };

export type CreateProjectMutationVariables = Exact<{
  input?: InputMaybe<ProjectCreateInput>;
}>;


export type CreateProjectMutation = { __typename?: 'Mutation', projectMutations: { __typename?: 'ProjectMutations', create: { __typename?: 'Project', id: string, createdAt: string, role?: string | null, name: string, description?: string | null, visibility: ProjectVisibility, allowPublicComments: boolean, updatedAt: string, modelCount: { __typename?: 'ModelCollection', totalCount: number }, commentThreadCount: { __typename?: 'ProjectCommentCollection', totalCount: number }, models: { __typename?: 'ModelCollection', totalCount: number, items: Array<{ __typename?: 'Model', id: string, name: string, displayName: string, previewUrl?: string | null, createdAt: string, updatedAt: string, description?: string | null, versionCount: { __typename?: 'VersionCollection', totalCount: number }, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number }, pendingImportedVersions: Array<{ __typename?: 'FileUpload', id: string, projectId: string, modelName: string, convertedStatus: number, convertedMessage?: string | null, uploadDate: string, convertedLastUpdate: string, fileType: string, fileName: string }>, automationsStatus?: { __typename?: 'TriggeredAutomationsStatus', id: string, automationRuns: Array<{ __typename?: 'AutomateRun', id: string, functionRuns: Array<{ __typename?: 'AutomateFunctionRun', id: string, updatedAt: string, status: AutomateRunStatus, results?: {} | null, statusMessage?: string | null, contextView?: string | null, createdAt: string, function?: { __typename?: 'AutomateFunction', id: string, logo?: string | null, name: string } | null }>, automation: { __typename?: 'Automation', id: string, name: string } }> } | null }> }, pendingImportedModels: Array<{ __typename?: 'FileUpload', id: string, projectId: string, modelName: string, convertedStatus: number, convertedMessage?: string | null, uploadDate: string, convertedLastUpdate: string, fileType: string, fileName: string }>, team: Array<{ __typename?: 'ProjectCollaborator', id: string, role: string, user: { __typename?: 'LimitedUser', role?: string | null, id: string, name: string, avatar?: string | null } }>, invitedTeam?: Array<{ __typename?: 'PendingStreamCollaborator', id: string, title: string, inviteId: string, role: string, user?: { __typename?: 'LimitedUser', role?: string | null, id: string, name: string, avatar?: string | null } | null }> | null } } };

export type UpdateModelMutationVariables = Exact<{
  input: UpdateModelInput;
}>;


export type UpdateModelMutation = { __typename?: 'Mutation', modelMutations: { __typename?: 'ModelMutations', update: { __typename?: 'Model', id: string, name: string, displayName: string, previewUrl?: string | null, createdAt: string, updatedAt: string, description?: string | null, versionCount: { __typename?: 'VersionCollection', totalCount: number }, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number }, pendingImportedVersions: Array<{ __typename?: 'FileUpload', id: string, projectId: string, modelName: string, convertedStatus: number, convertedMessage?: string | null, uploadDate: string, convertedLastUpdate: string, fileType: string, fileName: string }>, automationsStatus?: { __typename?: 'TriggeredAutomationsStatus', id: string, automationRuns: Array<{ __typename?: 'AutomateRun', id: string, functionRuns: Array<{ __typename?: 'AutomateFunctionRun', id: string, updatedAt: string, status: AutomateRunStatus, results?: {} | null, statusMessage?: string | null, contextView?: string | null, createdAt: string, function?: { __typename?: 'AutomateFunction', id: string, logo?: string | null, name: string } | null }>, automation: { __typename?: 'Automation', id: string, name: string } }> } | null } } };

export type DeleteModelMutationVariables = Exact<{
  input: DeleteModelInput;
}>;


export type DeleteModelMutation = { __typename?: 'Mutation', modelMutations: { __typename?: 'ModelMutations', delete: boolean } };

export type UpdateProjectRoleMutationVariables = Exact<{
  input: ProjectUpdateRoleInput;
}>;


export type UpdateProjectRoleMutation = { __typename?: 'Mutation', projectMutations: { __typename?: 'ProjectMutations', updateRole: { __typename?: 'Project', id: string, team: Array<{ __typename?: 'ProjectCollaborator', id: string, role: string, user: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } }> } } };

export type InviteProjectUserMutationVariables = Exact<{
  projectId: Scalars['ID']['input'];
  input: Array<ProjectInviteCreateInput> | ProjectInviteCreateInput;
}>;


export type InviteProjectUserMutation = { __typename?: 'Mutation', projectMutations: { __typename?: 'ProjectMutations', invites: { __typename?: 'ProjectInviteMutations', batchCreate: { __typename?: 'Project', id: string, name: string, role?: string | null, allowPublicComments: boolean, visibility: ProjectVisibility, team: Array<{ __typename?: 'ProjectCollaborator', id: string, role: string, user: { __typename?: 'LimitedUser', role?: string | null, id: string, name: string, avatar?: string | null } }>, invitedTeam?: Array<{ __typename?: 'PendingStreamCollaborator', id: string, title: string, inviteId: string, role: string, user?: { __typename?: 'LimitedUser', role?: string | null, id: string, name: string, avatar?: string | null } | null }> | null } } } };

export type CancelProjectInviteMutationVariables = Exact<{
  projectId: Scalars['ID']['input'];
  inviteId: Scalars['String']['input'];
}>;


export type CancelProjectInviteMutation = { __typename?: 'Mutation', projectMutations: { __typename?: 'ProjectMutations', invites: { __typename?: 'ProjectInviteMutations', cancel: { __typename?: 'Project', id: string, name: string, role?: string | null, allowPublicComments: boolean, visibility: ProjectVisibility, team: Array<{ __typename?: 'ProjectCollaborator', id: string, role: string, user: { __typename?: 'LimitedUser', role?: string | null, id: string, name: string, avatar?: string | null } }>, invitedTeam?: Array<{ __typename?: 'PendingStreamCollaborator', id: string, title: string, inviteId: string, role: string, user?: { __typename?: 'LimitedUser', role?: string | null, id: string, name: string, avatar?: string | null } | null }> | null } } } };

export type UpdateProjectMetadataMutationVariables = Exact<{
  update: ProjectUpdateInput;
}>;


export type UpdateProjectMetadataMutation = { __typename?: 'Mutation', projectMutations: { __typename?: 'ProjectMutations', update: { __typename?: 'Project', id: string, name: string, description?: string | null, visibility: ProjectVisibility, allowPublicComments: boolean } } };

export type DeleteProjectMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type DeleteProjectMutation = { __typename?: 'Mutation', projectMutations: { __typename?: 'ProjectMutations', delete: boolean } };

export type UseProjectInviteMutationVariables = Exact<{
  input: ProjectInviteUseInput;
}>;


export type UseProjectInviteMutation = { __typename?: 'Mutation', projectMutations: { __typename?: 'ProjectMutations', invites: { __typename?: 'ProjectInviteMutations', use: boolean } } };

export type LeaveProjectMutationVariables = Exact<{
  projectId: Scalars['String']['input'];
}>;


export type LeaveProjectMutation = { __typename?: 'Mutation', projectMutations: { __typename?: 'ProjectMutations', leave: boolean } };

export type DeleteVersionsMutationVariables = Exact<{
  input: DeleteVersionsInput;
}>;


export type DeleteVersionsMutation = { __typename?: 'Mutation', versionMutations: { __typename?: 'VersionMutations', delete: boolean } };

export type MoveVersionsMutationVariables = Exact<{
  input: MoveVersionsInput;
}>;


export type MoveVersionsMutation = { __typename?: 'Mutation', versionMutations: { __typename?: 'VersionMutations', moveToModel: { __typename?: 'Model', id: string } } };

export type UpdateVersionMutationVariables = Exact<{
  input: UpdateVersionInput;
}>;


export type UpdateVersionMutation = { __typename?: 'Mutation', versionMutations: { __typename?: 'VersionMutations', update: { __typename?: 'Version', id: string, message?: string | null } } };

export type DeleteWebhookMutationVariables = Exact<{
  webhook: WebhookDeleteInput;
}>;


export type DeleteWebhookMutation = { __typename?: 'Mutation', webhookDelete: string };

export type CreateWebhookMutationVariables = Exact<{
  webhook: WebhookCreateInput;
}>;


export type CreateWebhookMutation = { __typename?: 'Mutation', webhookCreate: string };

export type UpdateWebhookMutationVariables = Exact<{
  webhook: WebhookUpdateInput;
}>;


export type UpdateWebhookMutation = { __typename?: 'Mutation', webhookUpdate: string };

export type CreateAutomationMutationVariables = Exact<{
  projectId: Scalars['ID']['input'];
  input: ProjectAutomationCreateInput;
}>;


export type CreateAutomationMutation = { __typename?: 'Mutation', projectMutations: { __typename?: 'ProjectMutations', automationMutations: { __typename?: 'ProjectAutomationMutations', create: { __typename?: 'Automation', id: string, name: string, enabled: boolean, isTestAutomation: boolean, currentRevision?: { __typename?: 'AutomationRevision', id: string, triggerDefinitions: Array<{ __typename?: 'VersionCreatedTriggerDefinition', model?: { __typename?: 'Model', id: string, name: string } | null }> } | null, runs: { __typename?: 'AutomateRunCollection', totalCount: number, cursor?: string | null, items: Array<{ __typename?: 'AutomateRun', id: string, status: AutomateRunStatus, createdAt: string, updatedAt: string, functionRuns: Array<{ __typename?: 'AutomateFunctionRun', statusMessage?: string | null, id: string, status: AutomateRunStatus }>, trigger: { __typename?: 'VersionCreatedTrigger', version?: { __typename?: 'Version', id: string } | null, model?: { __typename?: 'Model', id: string } | null } }> } } } } };

export type UpdateAutomationMutationVariables = Exact<{
  projectId: Scalars['ID']['input'];
  input: ProjectAutomationUpdateInput;
}>;


export type UpdateAutomationMutation = { __typename?: 'Mutation', projectMutations: { __typename?: 'ProjectMutations', automationMutations: { __typename?: 'ProjectAutomationMutations', update: { __typename?: 'Automation', id: string, name: string, enabled: boolean } } } };

export type CreateAutomationRevisionMutationVariables = Exact<{
  projectId: Scalars['ID']['input'];
  input: ProjectAutomationRevisionCreateInput;
}>;


export type CreateAutomationRevisionMutation = { __typename?: 'Mutation', projectMutations: { __typename?: 'ProjectMutations', automationMutations: { __typename?: 'ProjectAutomationMutations', createRevision: { __typename?: 'AutomationRevision', id: string } } } };

export type TriggerAutomationMutationVariables = Exact<{
  projectId: Scalars['ID']['input'];
  automationId: Scalars['ID']['input'];
}>;


export type TriggerAutomationMutation = { __typename?: 'Mutation', projectMutations: { __typename?: 'ProjectMutations', automationMutations: { __typename?: 'ProjectAutomationMutations', trigger: string } } };

export type CreateTestAutomationMutationVariables = Exact<{
  projectId: Scalars['ID']['input'];
  input: ProjectTestAutomationCreateInput;
}>;


export type CreateTestAutomationMutation = { __typename?: 'Mutation', projectMutations: { __typename?: 'ProjectMutations', automationMutations: { __typename?: 'ProjectAutomationMutations', createTestAutomation: { __typename?: 'Automation', id: string, name: string, enabled: boolean, isTestAutomation: boolean, currentRevision?: { __typename?: 'AutomationRevision', id: string, triggerDefinitions: Array<{ __typename?: 'VersionCreatedTriggerDefinition', model?: { __typename?: 'Model', id: string, name: string } | null }> } | null, runs: { __typename?: 'AutomateRunCollection', totalCount: number, cursor?: string | null, items: Array<{ __typename?: 'AutomateRun', id: string, status: AutomateRunStatus, createdAt: string, updatedAt: string, functionRuns: Array<{ __typename?: 'AutomateFunctionRun', statusMessage?: string | null, id: string, status: AutomateRunStatus }>, trigger: { __typename?: 'VersionCreatedTrigger', version?: { __typename?: 'Version', id: string } | null, model?: { __typename?: 'Model', id: string } | null } }> } } } } };

export type ProjectAccessCheckQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type ProjectAccessCheckQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string } };

export type ProjectRoleCheckQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type ProjectRoleCheckQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, role?: string | null } };

export type ProjectsDashboardQueryQueryVariables = Exact<{
  filter?: InputMaybe<UserProjectsFilter>;
  cursor?: InputMaybe<Scalars['String']['input']>;
}>;


export type ProjectsDashboardQueryQuery = { __typename?: 'Query', activeUser?: { __typename?: 'User', id: string, projects: { __typename?: 'ProjectCollection', cursor?: string | null, totalCount: number, items: Array<{ __typename?: 'Project', id: string, name: string, createdAt: string, updatedAt: string, role?: string | null, visibility: ProjectVisibility, models: { __typename?: 'ModelCollection', totalCount: number, items: Array<{ __typename?: 'Model', id: string, name: string, displayName: string, previewUrl?: string | null, createdAt: string, updatedAt: string, description?: string | null, versionCount: { __typename?: 'VersionCollection', totalCount: number }, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number }, pendingImportedVersions: Array<{ __typename?: 'FileUpload', id: string, projectId: string, modelName: string, convertedStatus: number, convertedMessage?: string | null, uploadDate: string, convertedLastUpdate: string, fileType: string, fileName: string }>, automationsStatus?: { __typename?: 'TriggeredAutomationsStatus', id: string, automationRuns: Array<{ __typename?: 'AutomateRun', id: string, functionRuns: Array<{ __typename?: 'AutomateFunctionRun', id: string, updatedAt: string, status: AutomateRunStatus, results?: {} | null, statusMessage?: string | null, contextView?: string | null, createdAt: string, function?: { __typename?: 'AutomateFunction', id: string, logo?: string | null, name: string } | null }>, automation: { __typename?: 'Automation', id: string, name: string } }> } | null }> }, pendingImportedModels: Array<{ __typename?: 'FileUpload', id: string, projectId: string, modelName: string, convertedStatus: number, convertedMessage?: string | null, uploadDate: string, convertedLastUpdate: string, fileType: string, fileName: string }>, team: Array<{ __typename?: 'ProjectCollaborator', id: string, user: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } }> }> }, projectInvites: Array<{ __typename?: 'PendingStreamCollaborator', id: string, projectId: string, projectName: string, token?: string | null, invitedBy: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null }, user?: { __typename?: 'LimitedUser', id: string } | null }> } | null };

export type ProjectPageQueryQueryVariables = Exact<{
  id: Scalars['String']['input'];
  token?: InputMaybe<Scalars['String']['input']>;
}>;


export type ProjectPageQueryQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, createdAt: string, role?: string | null, name: string, description?: string | null, visibility: ProjectVisibility, allowPublicComments: boolean, modelCount: { __typename?: 'ModelCollection', totalCount: number }, commentThreadCount: { __typename?: 'ProjectCommentCollection', totalCount: number }, team: Array<{ __typename?: 'ProjectCollaborator', id: string, role: string, user: { __typename?: 'LimitedUser', role?: string | null, id: string, name: string, avatar?: string | null } }>, invitedTeam?: Array<{ __typename?: 'PendingStreamCollaborator', id: string, title: string, inviteId: string, role: string, user?: { __typename?: 'LimitedUser', role?: string | null, id: string, name: string, avatar?: string | null } | null }> | null }, projectInvite?: { __typename?: 'PendingStreamCollaborator', id: string, projectId: string, projectName: string, token?: string | null, invitedBy: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null }, user?: { __typename?: 'LimitedUser', id: string } | null } | null };

export type ProjectLatestModelsQueryVariables = Exact<{
  projectId: Scalars['String']['input'];
  filter?: InputMaybe<ProjectModelsFilter>;
}>;


export type ProjectLatestModelsQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, models: { __typename?: 'ModelCollection', totalCount: number, cursor?: string | null, items: Array<{ __typename?: 'Model', id: string, name: string, displayName: string, previewUrl?: string | null, createdAt: string, updatedAt: string, description?: string | null, versionCount: { __typename?: 'VersionCollection', totalCount: number }, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number }, pendingImportedVersions: Array<{ __typename?: 'FileUpload', id: string, projectId: string, modelName: string, convertedStatus: number, convertedMessage?: string | null, uploadDate: string, convertedLastUpdate: string, fileType: string, fileName: string }>, automationsStatus?: { __typename?: 'TriggeredAutomationsStatus', id: string, automationRuns: Array<{ __typename?: 'AutomateRun', id: string, functionRuns: Array<{ __typename?: 'AutomateFunctionRun', id: string, updatedAt: string, status: AutomateRunStatus, results?: {} | null, statusMessage?: string | null, contextView?: string | null, createdAt: string, function?: { __typename?: 'AutomateFunction', id: string, logo?: string | null, name: string } | null }>, automation: { __typename?: 'Automation', id: string, name: string } }> } | null }> }, pendingImportedModels: Array<{ __typename?: 'FileUpload', id: string, projectId: string, modelName: string, convertedStatus: number, convertedMessage?: string | null, uploadDate: string, convertedLastUpdate: string, fileType: string, fileName: string }> } };

export type ProjectLatestModelsPaginationQueryVariables = Exact<{
  projectId: Scalars['String']['input'];
  filter?: InputMaybe<ProjectModelsFilter>;
  cursor?: InputMaybe<Scalars['String']['input']>;
}>;


export type ProjectLatestModelsPaginationQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, models: { __typename?: 'ModelCollection', totalCount: number, cursor?: string | null, items: Array<{ __typename?: 'Model', id: string, name: string, displayName: string, previewUrl?: string | null, createdAt: string, updatedAt: string, description?: string | null, versionCount: { __typename?: 'VersionCollection', totalCount: number }, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number }, pendingImportedVersions: Array<{ __typename?: 'FileUpload', id: string, projectId: string, modelName: string, convertedStatus: number, convertedMessage?: string | null, uploadDate: string, convertedLastUpdate: string, fileType: string, fileName: string }>, automationsStatus?: { __typename?: 'TriggeredAutomationsStatus', id: string, automationRuns: Array<{ __typename?: 'AutomateRun', id: string, functionRuns: Array<{ __typename?: 'AutomateFunctionRun', id: string, updatedAt: string, status: AutomateRunStatus, results?: {} | null, statusMessage?: string | null, contextView?: string | null, createdAt: string, function?: { __typename?: 'AutomateFunction', id: string, logo?: string | null, name: string } | null }>, automation: { __typename?: 'Automation', id: string, name: string } }> } | null }> } } };

export type ProjectModelsTreeTopLevelQueryVariables = Exact<{
  projectId: Scalars['String']['input'];
  filter?: InputMaybe<ProjectModelsTreeFilter>;
}>;


export type ProjectModelsTreeTopLevelQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, modelsTree: { __typename?: 'ModelsTreeItemCollection', totalCount: number, cursor?: string | null, items: Array<{ __typename?: 'ModelsTreeItem', id: string, name: string, fullName: string, hasChildren: boolean, updatedAt: string, model?: { __typename?: 'Model', id: string, name: string, displayName: string, previewUrl?: string | null, createdAt: string, updatedAt: string, description?: string | null, versionCount: { __typename?: 'VersionCollection', totalCount: number }, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number }, pendingImportedVersions: Array<{ __typename?: 'FileUpload', id: string, projectId: string, modelName: string, convertedStatus: number, convertedMessage?: string | null, uploadDate: string, convertedLastUpdate: string, fileType: string, fileName: string }>, automationsStatus?: { __typename?: 'TriggeredAutomationsStatus', id: string, automationRuns: Array<{ __typename?: 'AutomateRun', id: string, functionRuns: Array<{ __typename?: 'AutomateFunctionRun', id: string, updatedAt: string, status: AutomateRunStatus, results?: {} | null, statusMessage?: string | null, contextView?: string | null, createdAt: string, function?: { __typename?: 'AutomateFunction', id: string, logo?: string | null, name: string } | null }>, automation: { __typename?: 'Automation', id: string, name: string } }> } | null } | null }> }, pendingImportedModels: Array<{ __typename?: 'FileUpload', id: string, projectId: string, modelName: string, convertedStatus: number, convertedMessage?: string | null, uploadDate: string, convertedLastUpdate: string, fileType: string, fileName: string }> } };

export type ProjectModelsTreeTopLevelPaginationQueryVariables = Exact<{
  projectId: Scalars['String']['input'];
  filter?: InputMaybe<ProjectModelsTreeFilter>;
  cursor?: InputMaybe<Scalars['String']['input']>;
}>;


export type ProjectModelsTreeTopLevelPaginationQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, modelsTree: { __typename?: 'ModelsTreeItemCollection', totalCount: number, cursor?: string | null, items: Array<{ __typename?: 'ModelsTreeItem', id: string, name: string, fullName: string, hasChildren: boolean, updatedAt: string, model?: { __typename?: 'Model', id: string, name: string, displayName: string, previewUrl?: string | null, createdAt: string, updatedAt: string, description?: string | null, versionCount: { __typename?: 'VersionCollection', totalCount: number }, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number }, pendingImportedVersions: Array<{ __typename?: 'FileUpload', id: string, projectId: string, modelName: string, convertedStatus: number, convertedMessage?: string | null, uploadDate: string, convertedLastUpdate: string, fileType: string, fileName: string }>, automationsStatus?: { __typename?: 'TriggeredAutomationsStatus', id: string, automationRuns: Array<{ __typename?: 'AutomateRun', id: string, functionRuns: Array<{ __typename?: 'AutomateFunctionRun', id: string, updatedAt: string, status: AutomateRunStatus, results?: {} | null, statusMessage?: string | null, contextView?: string | null, createdAt: string, function?: { __typename?: 'AutomateFunction', id: string, logo?: string | null, name: string } | null }>, automation: { __typename?: 'Automation', id: string, name: string } }> } | null } | null }> } } };

export type ProjectModelChildrenTreeQueryVariables = Exact<{
  projectId: Scalars['String']['input'];
  parentName: Scalars['String']['input'];
}>;


export type ProjectModelChildrenTreeQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, modelChildrenTree: Array<{ __typename?: 'ModelsTreeItem', id: string, name: string, fullName: string, hasChildren: boolean, updatedAt: string, model?: { __typename?: 'Model', id: string, name: string, displayName: string, previewUrl?: string | null, createdAt: string, updatedAt: string, description?: string | null, versionCount: { __typename?: 'VersionCollection', totalCount: number }, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number }, pendingImportedVersions: Array<{ __typename?: 'FileUpload', id: string, projectId: string, modelName: string, convertedStatus: number, convertedMessage?: string | null, uploadDate: string, convertedLastUpdate: string, fileType: string, fileName: string }>, automationsStatus?: { __typename?: 'TriggeredAutomationsStatus', id: string, automationRuns: Array<{ __typename?: 'AutomateRun', id: string, functionRuns: Array<{ __typename?: 'AutomateFunctionRun', id: string, updatedAt: string, status: AutomateRunStatus, results?: {} | null, statusMessage?: string | null, contextView?: string | null, createdAt: string, function?: { __typename?: 'AutomateFunction', id: string, logo?: string | null, name: string } | null }>, automation: { __typename?: 'Automation', id: string, name: string } }> } | null } | null }> } };

export type ProjectLatestCommentThreadsQueryVariables = Exact<{
  projectId: Scalars['String']['input'];
  cursor?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<ProjectCommentsFilter>;
}>;


export type ProjectLatestCommentThreadsQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, commentThreads: { __typename?: 'ProjectCommentCollection', totalCount: number, cursor?: string | null, items: Array<{ __typename?: 'Comment', id: string, screenshot?: string | null, rawText: string, createdAt: string, updatedAt: string, archived: boolean, author: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null }, repliesCount: { __typename?: 'CommentCollection', totalCount: number }, replyAuthors: { __typename?: 'CommentReplyAuthorCollection', totalCount: number, items: Array<{ __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null }> } }> } } };

export type ProjectInviteQueryVariables = Exact<{
  projectId: Scalars['String']['input'];
  token?: InputMaybe<Scalars['String']['input']>;
}>;


export type ProjectInviteQuery = { __typename?: 'Query', projectInvite?: { __typename?: 'PendingStreamCollaborator', id: string, projectId: string, projectName: string, token?: string | null, invitedBy: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null }, user?: { __typename?: 'LimitedUser', id: string } | null } | null };

export type ProjectModelCheckQueryVariables = Exact<{
  projectId: Scalars['String']['input'];
  modelId: Scalars['String']['input'];
}>;


export type ProjectModelCheckQuery = { __typename?: 'Query', project: { __typename?: 'Project', model: { __typename?: 'Model', id: string } } };

export type ProjectModelPageQueryVariables = Exact<{
  projectId: Scalars['String']['input'];
  modelId: Scalars['String']['input'];
  versionsCursor?: InputMaybe<Scalars['String']['input']>;
}>;


export type ProjectModelPageQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, name: string, role?: string | null, description?: string | null, visibility: ProjectVisibility, allowPublicComments: boolean, model: { __typename?: 'Model', id: string, name: string, description?: string | null, pendingImportedVersions: Array<{ __typename?: 'FileUpload', id: string, projectId: string, modelName: string, convertedStatus: number, convertedMessage?: string | null, uploadDate: string, convertedLastUpdate: string, fileType: string, fileName: string }>, versions: { __typename?: 'VersionCollection', cursor?: string | null, totalCount: number, items: Array<{ __typename?: 'Version', id: string, message?: string | null, createdAt: string, previewUrl: string, sourceApplication?: string | null, authorUser?: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } | null, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number }, automationsStatus?: { __typename?: 'TriggeredAutomationsStatus', id: string, automationRuns: Array<{ __typename?: 'AutomateRun', id: string, functionRuns: Array<{ __typename?: 'AutomateFunctionRun', id: string, updatedAt: string, status: AutomateRunStatus, results?: {} | null, statusMessage?: string | null, contextView?: string | null, createdAt: string, function?: { __typename?: 'AutomateFunction', id: string, logo?: string | null, name: string } | null }>, automation: { __typename?: 'Automation', id: string, name: string } }> } | null }> } } } };

export type ProjectModelVersionsQueryVariables = Exact<{
  projectId: Scalars['String']['input'];
  modelId: Scalars['String']['input'];
  versionsCursor?: InputMaybe<Scalars['String']['input']>;
}>;


export type ProjectModelVersionsQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, visibility: ProjectVisibility, role?: string | null, model: { __typename?: 'Model', id: string, versions: { __typename?: 'VersionCollection', cursor?: string | null, totalCount: number, items: Array<{ __typename?: 'Version', id: string, message?: string | null, createdAt: string, previewUrl: string, sourceApplication?: string | null, authorUser?: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } | null, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number }, automationsStatus?: { __typename?: 'TriggeredAutomationsStatus', id: string, automationRuns: Array<{ __typename?: 'AutomateRun', id: string, functionRuns: Array<{ __typename?: 'AutomateFunctionRun', id: string, updatedAt: string, status: AutomateRunStatus, results?: {} | null, statusMessage?: string | null, contextView?: string | null, createdAt: string, function?: { __typename?: 'AutomateFunction', id: string, logo?: string | null, name: string } | null }>, automation: { __typename?: 'Automation', id: string, name: string } }> } | null }> } } } };

export type ProjectModelsPageQueryVariables = Exact<{
  projectId: Scalars['String']['input'];
}>;


export type ProjectModelsPageQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, name: string, sourceApps: Array<string>, role?: string | null, visibility: ProjectVisibility, team: Array<{ __typename?: 'ProjectCollaborator', id: string, user: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } }>, modelCount: { __typename?: 'ModelCollection', totalCount: number } } };

export type ProjectDiscussionsPageQueryVariables = Exact<{
  projectId: Scalars['String']['input'];
}>;


export type ProjectDiscussionsPageQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, name: string } };

export type ProjectAutomationsTabQueryVariables = Exact<{
  projectId: Scalars['String']['input'];
}>;


export type ProjectAutomationsTabQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, name: string, models: { __typename?: 'ModelCollection', items: Array<{ __typename?: 'Model', id: string }> }, automations: { __typename?: 'AutomationCollection', totalCount: number, cursor?: string | null, items: Array<{ __typename?: 'Automation', id: string, name: string, enabled: boolean, isTestAutomation: boolean, currentRevision?: { __typename?: 'AutomationRevision', id: string, triggerDefinitions: Array<{ __typename?: 'VersionCreatedTriggerDefinition', model?: { __typename?: 'Model', id: string, name: string } | null }> } | null, runs: { __typename?: 'AutomateRunCollection', totalCount: number, cursor?: string | null, items: Array<{ __typename?: 'AutomateRun', id: string, status: AutomateRunStatus, createdAt: string, updatedAt: string, functionRuns: Array<{ __typename?: 'AutomateFunctionRun', statusMessage?: string | null, id: string, status: AutomateRunStatus }>, trigger: { __typename?: 'VersionCreatedTrigger', version?: { __typename?: 'Version', id: string } | null, model?: { __typename?: 'Model', id: string } | null } }> } }> } }, automateFunctions: { __typename?: 'AutomateFunctionCollection', items: Array<{ __typename?: 'AutomateFunction', id: string, name: string, isFeatured: boolean, description: string, logo?: string | null, repo: { __typename?: 'BasicGitRepositoryMetadata', id: string, url: string, owner: string, name: string }, releases: { __typename?: 'AutomateFunctionReleaseCollection', items: Array<{ __typename?: 'AutomateFunctionRelease', id: string, inputSchema?: {} | null }> } }> } };

export type ProjectAutomationsTabAutomationsPaginationQueryVariables = Exact<{
  projectId: Scalars['String']['input'];
  search?: InputMaybe<Scalars['String']['input']>;
  cursor?: InputMaybe<Scalars['String']['input']>;
}>;


export type ProjectAutomationsTabAutomationsPaginationQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, automations: { __typename?: 'AutomationCollection', totalCount: number, cursor?: string | null, items: Array<{ __typename?: 'Automation', id: string, name: string, enabled: boolean, isTestAutomation: boolean, currentRevision?: { __typename?: 'AutomationRevision', id: string, triggerDefinitions: Array<{ __typename?: 'VersionCreatedTriggerDefinition', model?: { __typename?: 'Model', id: string, name: string } | null }> } | null, runs: { __typename?: 'AutomateRunCollection', totalCount: number, cursor?: string | null, items: Array<{ __typename?: 'AutomateRun', id: string, status: AutomateRunStatus, createdAt: string, updatedAt: string, functionRuns: Array<{ __typename?: 'AutomateFunctionRun', statusMessage?: string | null, id: string, status: AutomateRunStatus }>, trigger: { __typename?: 'VersionCreatedTrigger', version?: { __typename?: 'Version', id: string } | null, model?: { __typename?: 'Model', id: string } | null } }> } }> } } };

export type ProjectAutomationPageQueryVariables = Exact<{
  projectId: Scalars['String']['input'];
  automationId: Scalars['String']['input'];
}>;


export type ProjectAutomationPageQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, role?: string | null, visibility: ProjectVisibility, automation: { __typename?: 'Automation', id: string, name: string, enabled: boolean, isTestAutomation: boolean, currentRevision?: { __typename?: 'AutomationRevision', id: string, triggerDefinitions: Array<{ __typename?: 'VersionCreatedTriggerDefinition', type: AutomateRunTriggerType, model?: { __typename?: 'Model', id: string, name: string, displayName: string, previewUrl?: string | null, createdAt: string, updatedAt: string, description?: string | null, versionCount: { __typename?: 'VersionCollection', totalCount: number }, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number }, pendingImportedVersions: Array<{ __typename?: 'FileUpload', id: string, projectId: string, modelName: string, convertedStatus: number, convertedMessage?: string | null, uploadDate: string, convertedLastUpdate: string, fileType: string, fileName: string }>, automationsStatus?: { __typename?: 'TriggeredAutomationsStatus', id: string, automationRuns: Array<{ __typename?: 'AutomateRun', id: string, functionRuns: Array<{ __typename?: 'AutomateFunctionRun', id: string, updatedAt: string, status: AutomateRunStatus, results?: {} | null, statusMessage?: string | null, contextView?: string | null, createdAt: string, function?: { __typename?: 'AutomateFunction', id: string, logo?: string | null, name: string } | null }>, automation: { __typename?: 'Automation', id: string, name: string } }> } | null } | null }>, functions: Array<{ __typename?: 'AutomationRevisionFunction', parameters?: {} | null, release: { __typename?: 'AutomateFunctionRelease', id: string, inputSchema?: {} | null, function: { __typename?: 'AutomateFunction', id: string, name: string, isFeatured: boolean, description: string, logo?: string | null, releases: { __typename?: 'AutomateFunctionReleaseCollection', items: Array<{ __typename?: 'AutomateFunctionRelease', id: string }> }, repo: { __typename?: 'BasicGitRepositoryMetadata', id: string, url: string, owner: string, name: string } } } }> } | null, runs: { __typename?: 'AutomateRunCollection', totalCount: number, cursor?: string | null, items: Array<{ __typename?: 'AutomateRun', id: string, status: AutomateRunStatus, createdAt: string, updatedAt: string, functionRuns: Array<{ __typename?: 'AutomateFunctionRun', statusMessage?: string | null, id: string, status: AutomateRunStatus }>, trigger: { __typename?: 'VersionCreatedTrigger', version?: { __typename?: 'Version', id: string } | null, model?: { __typename?: 'Model', id: string } | null } }> } } } };

export type ProjectAutomationPagePaginatedRunsQueryVariables = Exact<{
  projectId: Scalars['String']['input'];
  automationId: Scalars['String']['input'];
  cursor?: InputMaybe<Scalars['String']['input']>;
}>;


export type ProjectAutomationPagePaginatedRunsQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, automation: { __typename?: 'Automation', id: string, runs: { __typename?: 'AutomateRunCollection', totalCount: number, cursor?: string | null, items: Array<{ __typename?: 'AutomateRun', id: string, status: AutomateRunStatus, createdAt: string, updatedAt: string, functionRuns: Array<{ __typename?: 'AutomateFunctionRun', statusMessage?: string | null, id: string, status: AutomateRunStatus }>, trigger: { __typename?: 'VersionCreatedTrigger', version?: { __typename?: 'Version', id: string } | null, model?: { __typename?: 'Model', id: string } | null } }> } } } };

export type ProjectAutomationAccessCheckQueryVariables = Exact<{
  projectId: Scalars['String']['input'];
}>;


export type ProjectAutomationAccessCheckQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, automations: { __typename?: 'AutomationCollection', totalCount: number } } };

export type ProjectWebhooksQueryVariables = Exact<{
  projectId: Scalars['String']['input'];
}>;


export type ProjectWebhooksQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, name: string, webhooks: { __typename?: 'WebhookCollection', totalCount: number, items: Array<{ __typename?: 'Webhook', streamId: string, triggers: Array<string>, enabled?: boolean | null, url: string, id: string, description?: string | null, history?: { __typename?: 'WebhookEventCollection', items?: Array<{ __typename?: 'WebhookEvent', status: number, statusInfo: string } | null> | null } | null }> } } };

export type ProjectBlobInfoQueryVariables = Exact<{
  blobId: Scalars['String']['input'];
  projectId: Scalars['String']['input'];
}>;


export type ProjectBlobInfoQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, blob?: { __typename?: 'BlobMetadata', id: string, fileName: string, fileType: string, fileSize?: number | null, createdAt: string } | null } };

export type OnProjectUpdatedSubscriptionVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type OnProjectUpdatedSubscription = { __typename?: 'Subscription', projectUpdated: { __typename?: 'ProjectUpdatedMessage', id: string, type: ProjectUpdatedMessageType, project?: { __typename?: 'Project', id: string, createdAt: string, name: string, updatedAt: string, role?: string | null, description?: string | null, visibility: ProjectVisibility, allowPublicComments: boolean, modelCount: { __typename?: 'ModelCollection', totalCount: number }, commentThreadCount: { __typename?: 'ProjectCommentCollection', totalCount: number }, team: Array<{ __typename?: 'ProjectCollaborator', id: string, role: string, user: { __typename?: 'LimitedUser', role?: string | null, id: string, name: string, avatar?: string | null } }>, invitedTeam?: Array<{ __typename?: 'PendingStreamCollaborator', id: string, title: string, inviteId: string, role: string, user?: { __typename?: 'LimitedUser', role?: string | null, id: string, name: string, avatar?: string | null } | null }> | null } | null } };

export type OnProjectModelsUpdateSubscriptionVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type OnProjectModelsUpdateSubscription = { __typename?: 'Subscription', projectModelsUpdated: { __typename?: 'ProjectModelsUpdatedMessage', id: string, type: ProjectModelsUpdatedMessageType, model?: { __typename?: 'Model', id: string, name: string, displayName: string, previewUrl?: string | null, createdAt: string, updatedAt: string, description?: string | null, versions: { __typename?: 'VersionCollection', items: Array<{ __typename?: 'Version', id: string, referencedObject: string }> }, versionCount: { __typename?: 'VersionCollection', totalCount: number }, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number }, pendingImportedVersions: Array<{ __typename?: 'FileUpload', id: string, projectId: string, modelName: string, convertedStatus: number, convertedMessage?: string | null, uploadDate: string, convertedLastUpdate: string, fileType: string, fileName: string }>, automationsStatus?: { __typename?: 'TriggeredAutomationsStatus', id: string, automationRuns: Array<{ __typename?: 'AutomateRun', id: string, functionRuns: Array<{ __typename?: 'AutomateFunctionRun', id: string, updatedAt: string, status: AutomateRunStatus, results?: {} | null, statusMessage?: string | null, contextView?: string | null, createdAt: string, function?: { __typename?: 'AutomateFunction', id: string, logo?: string | null, name: string } | null }>, automation: { __typename?: 'Automation', id: string, name: string } }> } | null } | null } };

export type OnProjectVersionsUpdateSubscriptionVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type OnProjectVersionsUpdateSubscription = { __typename?: 'Subscription', projectVersionsUpdated: { __typename?: 'ProjectVersionsUpdatedMessage', id: string, modelId?: string | null, type: ProjectVersionsUpdatedMessageType, version?: { __typename?: 'Version', id: string, message?: string | null, referencedObject: string, sourceApplication?: string | null, createdAt: string, previewUrl: string, model: { __typename?: 'Model', id: string, name: string, displayName: string, previewUrl?: string | null, createdAt: string, updatedAt: string, description?: string | null, versionCount: { __typename?: 'VersionCollection', totalCount: number }, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number }, pendingImportedVersions: Array<{ __typename?: 'FileUpload', id: string, projectId: string, modelName: string, convertedStatus: number, convertedMessage?: string | null, uploadDate: string, convertedLastUpdate: string, fileType: string, fileName: string }>, automationsStatus?: { __typename?: 'TriggeredAutomationsStatus', id: string, automationRuns: Array<{ __typename?: 'AutomateRun', id: string, functionRuns: Array<{ __typename?: 'AutomateFunctionRun', id: string, updatedAt: string, status: AutomateRunStatus, results?: {} | null, statusMessage?: string | null, contextView?: string | null, createdAt: string, function?: { __typename?: 'AutomateFunction', id: string, logo?: string | null, name: string } | null }>, automation: { __typename?: 'Automation', id: string, name: string } }> } | null }, authorUser?: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } | null, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number }, automationsStatus?: { __typename?: 'TriggeredAutomationsStatus', id: string, automationRuns: Array<{ __typename?: 'AutomateRun', id: string, functionRuns: Array<{ __typename?: 'AutomateFunctionRun', id: string, updatedAt: string, status: AutomateRunStatus, results?: {} | null, statusMessage?: string | null, contextView?: string | null, createdAt: string, function?: { __typename?: 'AutomateFunction', id: string, logo?: string | null, name: string } | null }>, automation: { __typename?: 'Automation', id: string, name: string } }> } | null } | null } };

export type OnProjectVersionsPreviewGeneratedSubscriptionVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type OnProjectVersionsPreviewGeneratedSubscription = { __typename?: 'Subscription', projectVersionsPreviewGenerated: { __typename?: 'ProjectVersionsPreviewGeneratedMessage', projectId: string, objectId: string, versionId: string } };

export type OnProjectPendingModelsUpdatedSubscriptionVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type OnProjectPendingModelsUpdatedSubscription = { __typename?: 'Subscription', projectPendingModelsUpdated: { __typename?: 'ProjectPendingModelsUpdatedMessage', id: string, type: ProjectPendingModelsUpdatedMessageType, model: { __typename?: 'FileUpload', id: string, projectId: string, modelName: string, convertedStatus: number, convertedMessage?: string | null, uploadDate: string, convertedLastUpdate: string, fileType: string, fileName: string, model?: { __typename?: 'Model', id: string, name: string, displayName: string, previewUrl?: string | null, createdAt: string, updatedAt: string, description?: string | null, versionCount: { __typename?: 'VersionCollection', totalCount: number }, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number }, pendingImportedVersions: Array<{ __typename?: 'FileUpload', id: string, projectId: string, modelName: string, convertedStatus: number, convertedMessage?: string | null, uploadDate: string, convertedLastUpdate: string, fileType: string, fileName: string }>, automationsStatus?: { __typename?: 'TriggeredAutomationsStatus', id: string, automationRuns: Array<{ __typename?: 'AutomateRun', id: string, functionRuns: Array<{ __typename?: 'AutomateFunctionRun', id: string, updatedAt: string, status: AutomateRunStatus, results?: {} | null, statusMessage?: string | null, contextView?: string | null, createdAt: string, function?: { __typename?: 'AutomateFunction', id: string, logo?: string | null, name: string } | null }>, automation: { __typename?: 'Automation', id: string, name: string } }> } | null } | null } } };

export type OnProjectPendingVersionsUpdatedSubscriptionVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type OnProjectPendingVersionsUpdatedSubscription = { __typename?: 'Subscription', projectPendingVersionsUpdated: { __typename?: 'ProjectPendingVersionsUpdatedMessage', id: string, type: ProjectPendingVersionsUpdatedMessageType, version: { __typename?: 'FileUpload', id: string, projectId: string, modelName: string, convertedStatus: number, convertedMessage?: string | null, uploadDate: string, convertedLastUpdate: string, fileType: string, fileName: string, model?: { __typename?: 'Model', id: string, name: string, displayName: string, previewUrl?: string | null, createdAt: string, updatedAt: string, description?: string | null, versionCount: { __typename?: 'VersionCollection', totalCount: number }, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number }, pendingImportedVersions: Array<{ __typename?: 'FileUpload', id: string, projectId: string, modelName: string, convertedStatus: number, convertedMessage?: string | null, uploadDate: string, convertedLastUpdate: string, fileType: string, fileName: string }>, automationsStatus?: { __typename?: 'TriggeredAutomationsStatus', id: string, automationRuns: Array<{ __typename?: 'AutomateRun', id: string, functionRuns: Array<{ __typename?: 'AutomateFunctionRun', id: string, updatedAt: string, status: AutomateRunStatus, results?: {} | null, statusMessage?: string | null, contextView?: string | null, createdAt: string, function?: { __typename?: 'AutomateFunction', id: string, logo?: string | null, name: string } | null }>, automation: { __typename?: 'Automation', id: string, name: string } }> } | null } | null } } };

export type OnProjectTriggeredAutomationsStatusUpdatedSubscriptionVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type OnProjectTriggeredAutomationsStatusUpdatedSubscription = { __typename?: 'Subscription', projectTriggeredAutomationsStatusUpdated: { __typename?: 'ProjectTriggeredAutomationsStatusUpdatedMessage', type: ProjectTriggeredAutomationsStatusUpdatedMessageType, version: { __typename?: 'Version', id: string, automationsStatus?: { __typename?: 'TriggeredAutomationsStatus', id: string, automationRuns: Array<{ __typename?: 'AutomateRun', id: string, functionRuns: Array<{ __typename?: 'AutomateFunctionRun', id: string, updatedAt: string, status: AutomateRunStatus, results?: {} | null, statusMessage?: string | null, contextView?: string | null, createdAt: string, function?: { __typename?: 'AutomateFunction', id: string, logo?: string | null, name: string } | null }>, automation: { __typename?: 'Automation', id: string, name: string } }> } | null }, model: { __typename?: 'Model', id: string }, run: { __typename?: 'AutomateRun', id: string, automationId: string, status: AutomateRunStatus, createdAt: string, updatedAt: string, functionRuns: Array<{ __typename?: 'AutomateFunctionRun', statusMessage?: string | null, id: string, status: AutomateRunStatus }>, trigger: { __typename?: 'VersionCreatedTrigger', version?: { __typename?: 'Version', id: string } | null, model?: { __typename?: 'Model', id: string } | null } } } };

export type OnProjectAutomationsUpdatedSubscriptionVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type OnProjectAutomationsUpdatedSubscription = { __typename?: 'Subscription', projectAutomationsUpdated: { __typename?: 'ProjectAutomationsUpdatedMessage', type: ProjectAutomationsUpdatedMessageType, automationId: string, automation?: { __typename?: 'Automation', id: string, name: string, enabled: boolean, isTestAutomation: boolean, currentRevision?: { __typename?: 'AutomationRevision', id: string, triggerDefinitions: Array<{ __typename?: 'VersionCreatedTriggerDefinition', type: AutomateRunTriggerType, model?: { __typename?: 'Model', id: string, name: string, displayName: string, previewUrl?: string | null, createdAt: string, updatedAt: string, description?: string | null, versionCount: { __typename?: 'VersionCollection', totalCount: number }, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number }, pendingImportedVersions: Array<{ __typename?: 'FileUpload', id: string, projectId: string, modelName: string, convertedStatus: number, convertedMessage?: string | null, uploadDate: string, convertedLastUpdate: string, fileType: string, fileName: string }>, automationsStatus?: { __typename?: 'TriggeredAutomationsStatus', id: string, automationRuns: Array<{ __typename?: 'AutomateRun', id: string, functionRuns: Array<{ __typename?: 'AutomateFunctionRun', id: string, updatedAt: string, status: AutomateRunStatus, results?: {} | null, statusMessage?: string | null, contextView?: string | null, createdAt: string, function?: { __typename?: 'AutomateFunction', id: string, logo?: string | null, name: string } | null }>, automation: { __typename?: 'Automation', id: string, name: string } }> } | null } | null }>, functions: Array<{ __typename?: 'AutomationRevisionFunction', parameters?: {} | null, release: { __typename?: 'AutomateFunctionRelease', id: string, inputSchema?: {} | null, function: { __typename?: 'AutomateFunction', id: string, name: string, isFeatured: boolean, description: string, logo?: string | null, releases: { __typename?: 'AutomateFunctionReleaseCollection', items: Array<{ __typename?: 'AutomateFunctionRelease', id: string }> }, repo: { __typename?: 'BasicGitRepositoryMetadata', id: string, url: string, owner: string, name: string } } } }> } | null, runs: { __typename?: 'AutomateRunCollection', totalCount: number, cursor?: string | null, items: Array<{ __typename?: 'AutomateRun', id: string, status: AutomateRunStatus, createdAt: string, updatedAt: string, functionRuns: Array<{ __typename?: 'AutomateFunctionRun', statusMessage?: string | null, id: string, status: AutomateRunStatus }>, trigger: { __typename?: 'VersionCreatedTrigger', version?: { __typename?: 'Version', id: string } | null, model?: { __typename?: 'Model', id: string } | null } }> } } | null } };

export type ServerInfoUpdateMutationVariables = Exact<{
  info: ServerInfoUpdateInput;
}>;


export type ServerInfoUpdateMutation = { __typename?: 'Mutation', serverInfoUpdate?: boolean | null };

export type AdminPanelDeleteUserMutationVariables = Exact<{
  userConfirmation: UserDeleteInput;
}>;


export type AdminPanelDeleteUserMutation = { __typename?: 'Mutation', adminDeleteUser: boolean };

export type AdminPanelDeleteProjectMutationVariables = Exact<{
  ids: Array<Scalars['String']['input']> | Scalars['String']['input'];
}>;


export type AdminPanelDeleteProjectMutation = { __typename?: 'Mutation', projectMutations: { __typename?: 'ProjectMutations', batchDelete: boolean } };

export type AdminPanelResendInviteMutationVariables = Exact<{
  inviteId: Scalars['String']['input'];
}>;


export type AdminPanelResendInviteMutation = { __typename?: 'Mutation', inviteResend: boolean };

export type AdminPanelDeleteInviteMutationVariables = Exact<{
  inviteId: Scalars['String']['input'];
}>;


export type AdminPanelDeleteInviteMutation = { __typename?: 'Mutation', inviteDelete: boolean };

export type AdminChangeUseRoleMutationVariables = Exact<{
  userRoleInput: UserRoleInput;
}>;


export type AdminChangeUseRoleMutation = { __typename?: 'Mutation', userRoleChange: boolean };

export type ServerManagementDataPageQueryVariables = Exact<{ [key: string]: never; }>;


export type ServerManagementDataPageQuery = { __typename?: 'Query', admin: { __typename?: 'AdminQueries', userList: { __typename?: 'AdminUserList', totalCount: number }, projectList: { __typename?: 'ProjectCollection', totalCount: number }, inviteList: { __typename?: 'AdminInviteList', totalCount: number } }, serverInfo: { __typename?: 'ServerInfo', name: string, version?: string | null } };

export type ServerSettingsDialogDataQueryVariables = Exact<{ [key: string]: never; }>;


export type ServerSettingsDialogDataQuery = { __typename?: 'Query', serverInfo: { __typename?: 'ServerInfo', name: string, description?: string | null, adminContact?: string | null, company?: string | null, termsOfService?: string | null, inviteOnly?: boolean | null, guestModeEnabled: boolean } };

export type AdminPanelUsersListQueryVariables = Exact<{
  limit: Scalars['Int']['input'];
  cursor?: InputMaybe<Scalars['String']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
}>;


export type AdminPanelUsersListQuery = { __typename?: 'Query', admin: { __typename?: 'AdminQueries', userList: { __typename?: 'AdminUserList', totalCount: number, cursor?: string | null, items: Array<{ __typename?: 'AdminUserListItem', id: string, email?: string | null, avatar?: string | null, name: string, role?: string | null, verified?: boolean | null, company?: string | null }> } } };

export type AdminPanelProjectsListQueryVariables = Exact<{
  query?: InputMaybe<Scalars['String']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  limit: Scalars['Int']['input'];
  visibility?: InputMaybe<Scalars['String']['input']>;
  cursor?: InputMaybe<Scalars['String']['input']>;
}>;


export type AdminPanelProjectsListQuery = { __typename?: 'Query', admin: { __typename?: 'AdminQueries', projectList: { __typename?: 'ProjectCollection', cursor?: string | null, totalCount: number, items: Array<{ __typename?: 'Project', id: string, name: string, visibility: ProjectVisibility, createdAt: string, updatedAt: string, models: { __typename?: 'ModelCollection', totalCount: number }, versions: { __typename?: 'VersionCollection', totalCount: number }, team: Array<{ __typename?: 'ProjectCollaborator', id: string, user: { __typename?: 'LimitedUser', name: string, id: string, avatar?: string | null } }> }> } } };

export type AdminPanelInvitesListQueryVariables = Exact<{
  limit: Scalars['Int']['input'];
  cursor?: InputMaybe<Scalars['String']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
}>;


export type AdminPanelInvitesListQuery = { __typename?: 'Query', admin: { __typename?: 'AdminQueries', inviteList: { __typename?: 'AdminInviteList', cursor?: string | null, totalCount: number, items: Array<{ __typename?: 'ServerInvite', email: string, id: string, invitedBy: { __typename?: 'LimitedUser', id: string, name: string } }> } } };

export type InviteServerUserMutationVariables = Exact<{
  input: Array<ServerInviteCreateInput> | ServerInviteCreateInput;
}>;


export type InviteServerUserMutation = { __typename?: 'Mutation', serverInviteBatchCreate: boolean };

export type AppAuthorAvatarFragment = { __typename?: 'AppAuthor', id: string, name: string, avatar?: string | null };

export type LimitedUserAvatarFragment = { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null };

export type ActiveUserAvatarFragment = { __typename?: 'User', id: string, name: string, avatar?: string | null };

export type UpdateUserMutationVariables = Exact<{
  input: UserUpdateInput;
}>;


export type UpdateUserMutation = { __typename?: 'Mutation', activeUserMutations: { __typename?: 'ActiveUserMutations', update: { __typename?: 'User', id: string, name: string, bio?: string | null, company?: string | null, avatar?: string | null } } };

export type UpdateNotificationPreferencesMutationVariables = Exact<{
  input: Scalars['JSONObject']['input'];
}>;


export type UpdateNotificationPreferencesMutation = { __typename?: 'Mutation', userNotificationPreferencesUpdate?: boolean | null };

export type DeleteAccountMutationVariables = Exact<{
  input: UserDeleteInput;
}>;


export type DeleteAccountMutation = { __typename?: 'Mutation', userDelete: boolean };

export type ProfileEditDialogQueryVariables = Exact<{ [key: string]: never; }>;


export type ProfileEditDialogQuery = { __typename?: 'Query', activeUser?: { __typename?: 'User', id: string, name: string, company?: string | null, bio?: string | null, notificationPreferences: {}, email?: string | null, avatar?: string | null } | null };

export type ViewerCommentBubblesDataFragment = { __typename?: 'Comment', id: string, viewedAt?: string | null, viewerState?: {} | null };

export type ViewerCommentThreadFragment = { __typename?: 'Comment', id: string, rawText: string, archived: boolean, createdAt: string, viewedAt?: string | null, viewerState?: {} | null, author: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null }, replies: { __typename?: 'CommentCollection', totalCount: number, cursor?: string | null, items: Array<{ __typename?: 'Comment', id: string, archived: boolean, rawText: string, createdAt: string, text: { __typename?: 'SmartTextEditorValue', doc?: {} | null, attachments?: Array<{ __typename?: 'BlobMetadata', id: string, fileName: string, fileType: string, fileSize?: number | null }> | null }, author: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } }> }, replyAuthors: { __typename?: 'CommentReplyAuthorCollection', totalCount: number, items: Array<{ __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null }> }, resources: Array<{ __typename?: 'ResourceIdentifier', resourceId: string, resourceType: ResourceType }>, text: { __typename?: 'SmartTextEditorValue', doc?: {} | null, attachments?: Array<{ __typename?: 'BlobMetadata', id: string, fileName: string, fileType: string, fileSize?: number | null }> | null } };

export type ViewerCommentsReplyItemFragment = { __typename?: 'Comment', id: string, archived: boolean, rawText: string, createdAt: string, text: { __typename?: 'SmartTextEditorValue', doc?: {} | null, attachments?: Array<{ __typename?: 'BlobMetadata', id: string, fileName: string, fileType: string, fileSize?: number | null }> | null }, author: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } };

export type BroadcastViewerUserActivityMutationVariables = Exact<{
  projectId: Scalars['String']['input'];
  resourceIdString: Scalars['String']['input'];
  message: ViewerUserActivityMessageInput;
}>;


export type BroadcastViewerUserActivityMutation = { __typename?: 'Mutation', broadcastViewerUserActivity: boolean };

export type MarkCommentViewedMutationVariables = Exact<{
  threadId: Scalars['String']['input'];
}>;


export type MarkCommentViewedMutation = { __typename?: 'Mutation', commentMutations: { __typename?: 'CommentMutations', markViewed: boolean } };

export type CreateCommentThreadMutationVariables = Exact<{
  input: CreateCommentInput;
}>;


export type CreateCommentThreadMutation = { __typename?: 'Mutation', commentMutations: { __typename?: 'CommentMutations', create: { __typename?: 'Comment', id: string, rawText: string, archived: boolean, createdAt: string, viewedAt?: string | null, viewerState?: {} | null, author: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null }, replies: { __typename?: 'CommentCollection', totalCount: number, cursor?: string | null, items: Array<{ __typename?: 'Comment', id: string, archived: boolean, rawText: string, createdAt: string, text: { __typename?: 'SmartTextEditorValue', doc?: {} | null, attachments?: Array<{ __typename?: 'BlobMetadata', id: string, fileName: string, fileType: string, fileSize?: number | null }> | null }, author: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } }> }, replyAuthors: { __typename?: 'CommentReplyAuthorCollection', totalCount: number, items: Array<{ __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null }> }, resources: Array<{ __typename?: 'ResourceIdentifier', resourceId: string, resourceType: ResourceType }>, text: { __typename?: 'SmartTextEditorValue', doc?: {} | null, attachments?: Array<{ __typename?: 'BlobMetadata', id: string, fileName: string, fileType: string, fileSize?: number | null }> | null } } } };

export type CreateCommentReplyMutationVariables = Exact<{
  input: CreateCommentReplyInput;
}>;


export type CreateCommentReplyMutation = { __typename?: 'Mutation', commentMutations: { __typename?: 'CommentMutations', reply: { __typename?: 'Comment', id: string, archived: boolean, rawText: string, createdAt: string, text: { __typename?: 'SmartTextEditorValue', doc?: {} | null, attachments?: Array<{ __typename?: 'BlobMetadata', id: string, fileName: string, fileType: string, fileSize?: number | null }> | null }, author: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } } } };

export type ArchiveCommentMutationVariables = Exact<{
  commentId: Scalars['String']['input'];
  archived?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type ArchiveCommentMutation = { __typename?: 'Mutation', commentMutations: { __typename?: 'CommentMutations', archive: boolean } };

export type ProjectViewerResourcesQueryVariables = Exact<{
  projectId: Scalars['String']['input'];
  resourceUrlString: Scalars['String']['input'];
}>;


export type ProjectViewerResourcesQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, viewerResources: Array<{ __typename?: 'ViewerResourceGroup', identifier: string, items: Array<{ __typename?: 'ViewerResourceItem', modelId?: string | null, versionId?: string | null, objectId: string }> }> } };

export type ViewerLoadedResourcesQueryVariables = Exact<{
  projectId: Scalars['String']['input'];
  modelIds: Array<Scalars['String']['input']> | Scalars['String']['input'];
  versionIds?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
}>;


export type ViewerLoadedResourcesQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, role?: string | null, allowPublicComments: boolean, visibility: ProjectVisibility, createdAt: string, name: string, models: { __typename?: 'ModelCollection', totalCount: number, items: Array<{ __typename?: 'Model', id: string, name: string, updatedAt: string, loadedVersion: { __typename?: 'VersionCollection', items: Array<{ __typename?: 'Version', id: string, message?: string | null, referencedObject: string, sourceApplication?: string | null, createdAt: string, previewUrl: string, automationsStatus?: { __typename?: 'TriggeredAutomationsStatus', id: string, automationRuns: Array<{ __typename?: 'AutomateRun', id: string, functionRuns: Array<{ __typename?: 'AutomateFunctionRun', id: string, updatedAt: string, status: AutomateRunStatus, results?: {} | null, statusMessage?: string | null, contextView?: string | null, createdAt: string, function?: { __typename?: 'AutomateFunction', id: string, logo?: string | null, name: string } | null }>, automation: { __typename?: 'Automation', id: string, name: string } }> } | null, authorUser?: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } | null }> }, versions: { __typename?: 'VersionCollection', totalCount: number, cursor?: string | null, items: Array<{ __typename?: 'Version', id: string, message?: string | null, referencedObject: string, sourceApplication?: string | null, createdAt: string, previewUrl: string, authorUser?: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } | null }> } }> }, modelCount: { __typename?: 'ModelCollection', totalCount: number } } };

export type ViewerModelVersionsQueryVariables = Exact<{
  projectId: Scalars['String']['input'];
  modelId: Scalars['String']['input'];
  versionsCursor?: InputMaybe<Scalars['String']['input']>;
}>;


export type ViewerModelVersionsQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, role?: string | null, model: { __typename?: 'Model', id: string, versions: { __typename?: 'VersionCollection', totalCount: number, cursor?: string | null, items: Array<{ __typename?: 'Version', id: string, message?: string | null, referencedObject: string, sourceApplication?: string | null, createdAt: string, previewUrl: string, authorUser?: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } | null }> } } } };

export type ViewerDiffVersionsQueryVariables = Exact<{
  projectId: Scalars['String']['input'];
  modelId: Scalars['String']['input'];
  versionAId: Scalars['String']['input'];
  versionBId: Scalars['String']['input'];
}>;


export type ViewerDiffVersionsQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, model: { __typename?: 'Model', id: string, versionA: { __typename?: 'Version', id: string, message?: string | null, referencedObject: string, sourceApplication?: string | null, createdAt: string, previewUrl: string, authorUser?: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } | null }, versionB: { __typename?: 'Version', id: string, message?: string | null, referencedObject: string, sourceApplication?: string | null, createdAt: string, previewUrl: string, authorUser?: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } | null } } } };

export type ViewerLoadedThreadsQueryVariables = Exact<{
  projectId: Scalars['String']['input'];
  filter: ProjectCommentsFilter;
  cursor?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type ViewerLoadedThreadsQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, commentThreads: { __typename?: 'ProjectCommentCollection', totalCount: number, totalArchivedCount: number, items: Array<{ __typename?: 'Comment', id: string, rawText: string, archived: boolean, createdAt: string, viewedAt?: string | null, viewerState?: {} | null, viewerResources: Array<{ __typename?: 'ViewerResourceItem', modelId?: string | null, versionId?: string | null, objectId: string }>, author: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null }, replies: { __typename?: 'CommentCollection', totalCount: number, cursor?: string | null, items: Array<{ __typename?: 'Comment', id: string, archived: boolean, rawText: string, createdAt: string, text: { __typename?: 'SmartTextEditorValue', doc?: {} | null, attachments?: Array<{ __typename?: 'BlobMetadata', id: string, fileName: string, fileType: string, fileSize?: number | null }> | null }, author: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } }> }, replyAuthors: { __typename?: 'CommentReplyAuthorCollection', totalCount: number, items: Array<{ __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null }> }, resources: Array<{ __typename?: 'ResourceIdentifier', resourceId: string, resourceType: ResourceType }>, text: { __typename?: 'SmartTextEditorValue', doc?: {} | null, attachments?: Array<{ __typename?: 'BlobMetadata', id: string, fileName: string, fileType: string, fileSize?: number | null }> | null } }> } } };

export type ViewerRawProjectObjectQueryVariables = Exact<{
  projectId: Scalars['String']['input'];
  objectId: Scalars['String']['input'];
}>;


export type ViewerRawProjectObjectQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, object?: { __typename?: 'Object', id: string, data?: {} | null } | null } };

export type OnViewerUserActivityBroadcastedSubscriptionVariables = Exact<{
  target: ViewerUpdateTrackingTarget;
  sessionId: Scalars['String']['input'];
}>;


export type OnViewerUserActivityBroadcastedSubscription = { __typename?: 'Subscription', viewerUserActivityBroadcasted: { __typename?: 'ViewerUserActivityMessage', userName: string, userId?: string | null, state?: {} | null, status: ViewerUserActivityStatus, sessionId: string, user?: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } | null } };

export type OnViewerCommentsUpdatedSubscriptionVariables = Exact<{
  target: ViewerUpdateTrackingTarget;
}>;


export type OnViewerCommentsUpdatedSubscription = { __typename?: 'Subscription', projectCommentsUpdated: { __typename?: 'ProjectCommentsUpdatedMessage', id: string, type: ProjectCommentsUpdatedMessageType, comment?: { __typename?: 'Comment', id: string, rawText: string, archived: boolean, createdAt: string, viewedAt?: string | null, viewerState?: {} | null, parent?: { __typename?: 'Comment', id: string } | null, author: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null }, replies: { __typename?: 'CommentCollection', totalCount: number, cursor?: string | null, items: Array<{ __typename?: 'Comment', id: string, archived: boolean, rawText: string, createdAt: string, text: { __typename?: 'SmartTextEditorValue', doc?: {} | null, attachments?: Array<{ __typename?: 'BlobMetadata', id: string, fileName: string, fileType: string, fileSize?: number | null }> | null }, author: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } }> }, replyAuthors: { __typename?: 'CommentReplyAuthorCollection', totalCount: number, items: Array<{ __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null }> }, resources: Array<{ __typename?: 'ResourceIdentifier', resourceId: string, resourceType: ResourceType }>, text: { __typename?: 'SmartTextEditorValue', doc?: {} | null, attachments?: Array<{ __typename?: 'BlobMetadata', id: string, fileName: string, fileType: string, fileSize?: number | null }> | null } } | null } };

export type LinkableCommentFragment = { __typename?: 'Comment', id: string, viewerResources: Array<{ __typename?: 'ViewerResourceItem', modelId?: string | null, versionId?: string | null, objectId: string }> };

export type LegacyBranchRedirectMetadataQueryVariables = Exact<{
  streamId: Scalars['String']['input'];
  branchName: Scalars['String']['input'];
}>;


export type LegacyBranchRedirectMetadataQuery = { __typename?: 'Query', project: { __typename?: 'Project', modelByName: { __typename?: 'Model', id: string } } };

export type LegacyViewerCommitRedirectMetadataQueryVariables = Exact<{
  streamId: Scalars['String']['input'];
  commitId: Scalars['String']['input'];
}>;


export type LegacyViewerCommitRedirectMetadataQuery = { __typename?: 'Query', project: { __typename?: 'Project', version?: { __typename?: 'Version', id: string, model: { __typename?: 'Model', id: string } } | null } };

export type LegacyViewerStreamRedirectMetadataQueryVariables = Exact<{
  streamId: Scalars['String']['input'];
}>;


export type LegacyViewerStreamRedirectMetadataQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, versions: { __typename?: 'VersionCollection', totalCount: number, items: Array<{ __typename?: 'Version', id: string, model: { __typename?: 'Model', id: string } }> } } };

export type ResolveCommentLinkQueryVariables = Exact<{
  commentId: Scalars['String']['input'];
  projectId: Scalars['String']['input'];
}>;


export type ResolveCommentLinkQuery = { __typename?: 'Query', project: { __typename?: 'Project', comment?: { __typename?: 'Comment', id: string, viewerResources: Array<{ __typename?: 'ViewerResourceItem', modelId?: string | null, versionId?: string | null, objectId: string }> } | null } };

export type AutomateFunctionPage_AutomateFunctionFragment = { __typename?: 'AutomateFunction', id: string, name: string, description: string, logo?: string | null, supportedSourceApps: Array<string>, tags: Array<string>, automationCount: number, isFeatured: boolean, creator?: { __typename?: 'LimitedUser', id: string } | null, repo: { __typename?: 'BasicGitRepositoryMetadata', id: string, url: string, owner: string, name: string }, releases: { __typename?: 'AutomateFunctionReleaseCollection', totalCount: number, items: Array<{ __typename?: 'AutomateFunctionRelease', id: string, inputSchema?: {} | null, createdAt: string, commitId: string }> } };

export type AutomateFunctionPageQueryVariables = Exact<{
  functionId: Scalars['ID']['input'];
}>;


export type AutomateFunctionPageQuery = { __typename?: 'Query', automateFunction: { __typename?: 'AutomateFunction', id: string, name: string, description: string, logo?: string | null, supportedSourceApps: Array<string>, tags: Array<string>, automationCount: number, isFeatured: boolean, creator?: { __typename?: 'LimitedUser', id: string } | null, repo: { __typename?: 'BasicGitRepositoryMetadata', id: string, url: string, owner: string, name: string }, releases: { __typename?: 'AutomateFunctionReleaseCollection', totalCount: number, items: Array<{ __typename?: 'AutomateFunctionRelease', id: string, inputSchema?: {} | null, createdAt: string, commitId: string }> } } };

export type AutomateFunctionsPageQueryVariables = Exact<{
  search?: InputMaybe<Scalars['String']['input']>;
  cursor?: InputMaybe<Scalars['String']['input']>;
}>;


export type AutomateFunctionsPageQuery = { __typename?: 'Query', automateFunctions: { __typename?: 'AutomateFunctionCollection', totalCount: number, cursor?: string | null, items: Array<{ __typename?: 'AutomateFunction', id: string, name: string, isFeatured: boolean, description: string, logo?: string | null, repo: { __typename?: 'BasicGitRepositoryMetadata', id: string, url: string, owner: string, name: string }, releases: { __typename?: 'AutomateFunctionReleaseCollection', items: Array<{ __typename?: 'AutomateFunctionRelease', id: string, inputSchema?: {} | null }> } }> }, activeUser?: { __typename?: 'User', id: string, automateInfo: { __typename?: 'UserAutomateInfo', hasAutomateGithubApp: boolean, availableGithubOrgs: Array<string> } } | null, serverInfo: { __typename?: 'ServerInfo', automate: { __typename?: 'ServerAutomateInfo', availableFunctionTemplates: Array<{ __typename?: 'AutomateFunctionTemplate', id: AutomateFunctionTemplateLanguage, title: string, logo: string, url: string }> } } };

export type ProjectPageProjectFragment = { __typename?: 'Project', id: string, createdAt: string, role?: string | null, name: string, description?: string | null, visibility: ProjectVisibility, allowPublicComments: boolean, modelCount: { __typename?: 'ModelCollection', totalCount: number }, commentThreadCount: { __typename?: 'ProjectCommentCollection', totalCount: number }, team: Array<{ __typename?: 'ProjectCollaborator', id: string, role: string, user: { __typename?: 'LimitedUser', role?: string | null, id: string, name: string, avatar?: string | null } }>, invitedTeam?: Array<{ __typename?: 'PendingStreamCollaborator', id: string, title: string, inviteId: string, role: string, user?: { __typename?: 'LimitedUser', role?: string | null, id: string, name: string, avatar?: string | null } | null }> | null };

export type ProjectPageAutomationPage_AutomationFragment = { __typename?: 'Automation', id: string, name: string, enabled: boolean, isTestAutomation: boolean, currentRevision?: { __typename?: 'AutomationRevision', id: string, triggerDefinitions: Array<{ __typename?: 'VersionCreatedTriggerDefinition', type: AutomateRunTriggerType, model?: { __typename?: 'Model', id: string, name: string, displayName: string, previewUrl?: string | null, createdAt: string, updatedAt: string, description?: string | null, versionCount: { __typename?: 'VersionCollection', totalCount: number }, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number }, pendingImportedVersions: Array<{ __typename?: 'FileUpload', id: string, projectId: string, modelName: string, convertedStatus: number, convertedMessage?: string | null, uploadDate: string, convertedLastUpdate: string, fileType: string, fileName: string }>, automationsStatus?: { __typename?: 'TriggeredAutomationsStatus', id: string, automationRuns: Array<{ __typename?: 'AutomateRun', id: string, functionRuns: Array<{ __typename?: 'AutomateFunctionRun', id: string, updatedAt: string, status: AutomateRunStatus, results?: {} | null, statusMessage?: string | null, contextView?: string | null, createdAt: string, function?: { __typename?: 'AutomateFunction', id: string, logo?: string | null, name: string } | null }>, automation: { __typename?: 'Automation', id: string, name: string } }> } | null } | null }>, functions: Array<{ __typename?: 'AutomationRevisionFunction', parameters?: {} | null, release: { __typename?: 'AutomateFunctionRelease', id: string, inputSchema?: {} | null, function: { __typename?: 'AutomateFunction', id: string, name: string, isFeatured: boolean, description: string, logo?: string | null, releases: { __typename?: 'AutomateFunctionReleaseCollection', items: Array<{ __typename?: 'AutomateFunctionRelease', id: string }> }, repo: { __typename?: 'BasicGitRepositoryMetadata', id: string, url: string, owner: string, name: string } } } }> } | null, runs: { __typename?: 'AutomateRunCollection', totalCount: number, cursor?: string | null, items: Array<{ __typename?: 'AutomateRun', id: string, status: AutomateRunStatus, createdAt: string, updatedAt: string, functionRuns: Array<{ __typename?: 'AutomateFunctionRun', statusMessage?: string | null, id: string, status: AutomateRunStatus }>, trigger: { __typename?: 'VersionCreatedTrigger', version?: { __typename?: 'Version', id: string } | null, model?: { __typename?: 'Model', id: string } | null } }> } };

export type ProjectPageAutomationPage_ProjectFragment = { __typename?: 'Project', id: string, role?: string | null, visibility: ProjectVisibility };

export type ProjectPageSettingsTab_ProjectFragment = { __typename?: 'Project', id: string, role?: string | null };

export const AuthRegisterPanelServerInfoFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AuthRegisterPanelServerInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ServerInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"inviteOnly"}}]}}]} as unknown as DocumentNode<AuthRegisterPanelServerInfoFragment, unknown>;
export const ServerTermsOfServicePrivacyPolicyFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ServerTermsOfServicePrivacyPolicyFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ServerInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"termsOfService"}}]}}]} as unknown as DocumentNode<ServerTermsOfServicePrivacyPolicyFragmentFragment, unknown>;
export const AuthStategiesServerInfoFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AuthStategiesServerInfoFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ServerInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"authStrategies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"url"}}]}}]}}]} as unknown as DocumentNode<AuthStategiesServerInfoFragmentFragment, unknown>;
export const AutomationsFunctionsCard_AutomateFunctionFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationsFunctionsCard_AutomateFunction"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunction"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isFeatured"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"repo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"owner"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<AutomationsFunctionsCard_AutomateFunctionFragment, unknown>;
export const AutomateFunctionCreateDialogDoneStep_AutomateFunctionFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateFunctionCreateDialogDoneStep_AutomateFunction"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunction"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"repo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"owner"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationsFunctionsCard_AutomateFunction"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationsFunctionsCard_AutomateFunction"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunction"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isFeatured"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"repo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"owner"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<AutomateFunctionCreateDialogDoneStep_AutomateFunctionFragment, unknown>;
export const AutomateFunctionCreateDialogTemplateStep_AutomateFunctionTemplateFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateFunctionCreateDialogTemplateStep_AutomateFunctionTemplate"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionTemplate"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"url"}}]}}]} as unknown as DocumentNode<AutomateFunctionCreateDialogTemplateStep_AutomateFunctionTemplateFragment, unknown>;
export const AutomateFunctionsPageHeader_QueryFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateFunctionsPageHeader_Query"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Query"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automateInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasAutomateGithubApp"}},{"kind":"Field","name":{"kind":"Name","value":"availableGithubOrgs"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"serverInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"automate"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"availableFunctionTemplates"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateFunctionCreateDialogTemplateStep_AutomateFunctionTemplate"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateFunctionCreateDialogTemplateStep_AutomateFunctionTemplate"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionTemplate"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"url"}}]}}]} as unknown as DocumentNode<AutomateFunctionsPageHeader_QueryFragment, unknown>;
export const AutomateAutomationCreateDialogFunctionParametersStep_AutomateFunctionFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateAutomationCreateDialogFunctionParametersStep_AutomateFunction"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunction"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"releases"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"inputSchema"}}]}}]}}]}}]} as unknown as DocumentNode<AutomateAutomationCreateDialogFunctionParametersStep_AutomateFunctionFragment, unknown>;
export const AutomateAutomationCreateDialog_AutomateFunctionFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateAutomationCreateDialog_AutomateFunction"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunction"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationsFunctionsCard_AutomateFunction"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateAutomationCreateDialogFunctionParametersStep_AutomateFunction"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationsFunctionsCard_AutomateFunction"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunction"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isFeatured"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"repo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"owner"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateAutomationCreateDialogFunctionParametersStep_AutomateFunction"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunction"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"releases"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"inputSchema"}}]}}]}}]}}]} as unknown as DocumentNode<AutomateAutomationCreateDialog_AutomateFunctionFragment, unknown>;
export const AutomateFunctionsPageItems_QueryFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateFunctionsPageItems_Query"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Query"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"automateFunctions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"20"}},{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}}]}},{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationsFunctionsCard_AutomateFunction"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateAutomationCreateDialog_AutomateFunction"}}]}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationsFunctionsCard_AutomateFunction"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunction"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isFeatured"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"repo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"owner"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateAutomationCreateDialogFunctionParametersStep_AutomateFunction"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunction"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"releases"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"inputSchema"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateAutomationCreateDialog_AutomateFunction"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunction"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationsFunctionsCard_AutomateFunction"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateAutomationCreateDialogFunctionParametersStep_AutomateFunction"}}]}}]} as unknown as DocumentNode<AutomateFunctionsPageItems_QueryFragment, unknown>;
export const AutomateViewerPanelFunctionRunRow_AutomateFunctionRunFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateViewerPanelFunctionRunRow_AutomateFunctionRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"results"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"statusMessage"}},{"kind":"Field","name":{"kind":"Name","value":"contextView"}},{"kind":"Field","name":{"kind":"Name","value":"function"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<AutomateViewerPanelFunctionRunRow_AutomateFunctionRunFragment, unknown>;
export const AutomationsStatusOrderedRuns_AutomationRunFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<AutomationsStatusOrderedRuns_AutomationRunFragment, unknown>;
export const AutomateViewerPanel_AutomateRunFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateViewerPanel_AutomateRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateViewerPanelFunctionRunRow_AutomateFunctionRun"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateViewerPanelFunctionRunRow_AutomateFunctionRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"results"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"statusMessage"}},{"kind":"Field","name":{"kind":"Name","value":"contextView"}},{"kind":"Field","name":{"kind":"Name","value":"function"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<AutomateViewerPanel_AutomateRunFragment, unknown>;
export const FormSelectModels_ModelFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FormSelectModels_Model"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]} as unknown as DocumentNode<FormSelectModels_ModelFragment, unknown>;
export const FormSelectProjects_ProjectFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FormSelectProjects_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]} as unknown as DocumentNode<FormSelectProjects_ProjectFragment, unknown>;
export const ProjectsPageTeamDialogManagePermissions_ProjectFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectsPageTeamDialogManagePermissions_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]} as unknown as DocumentNode<ProjectsPageTeamDialogManagePermissions_ProjectFragment, unknown>;
export const ProjectsModelPageEmbed_ProjectFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectsModelPageEmbed_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsPageTeamDialogManagePermissions_Project"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectsPageTeamDialogManagePermissions_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]} as unknown as DocumentNode<ProjectsModelPageEmbed_ProjectFragment, unknown>;
export const HeaderNavShare_ProjectFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"HeaderNavShare_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsModelPageEmbed_Project"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectsPageTeamDialogManagePermissions_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectsModelPageEmbed_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsPageTeamDialogManagePermissions_Project"}}]}}]} as unknown as DocumentNode<HeaderNavShare_ProjectFragment, unknown>;
export const ProjectModelPageHeaderProjectFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectModelPageHeaderProject"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"model"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"modelId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]} as unknown as DocumentNode<ProjectModelPageHeaderProjectFragment, unknown>;
export const ProjectPageProjectHeaderFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageProjectHeader"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"allowPublicComments"}}]}}]} as unknown as DocumentNode<ProjectPageProjectHeaderFragment, unknown>;
export const PendingFileUploadFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PendingFileUpload"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FileUpload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"modelName"}},{"kind":"Field","name":{"kind":"Name","value":"convertedStatus"}},{"kind":"Field","name":{"kind":"Name","value":"convertedMessage"}},{"kind":"Field","name":{"kind":"Name","value":"uploadDate"}},{"kind":"Field","name":{"kind":"Name","value":"convertedLastUpdate"}},{"kind":"Field","name":{"kind":"Name","value":"fileType"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}}]}}]} as unknown as DocumentNode<PendingFileUploadFragment, unknown>;
export const LimitedUserAvatarFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LimitedUserAvatar"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LimitedUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}}]} as unknown as DocumentNode<LimitedUserAvatarFragment, unknown>;
export const ProjectModelPageDialogDeleteVersionFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectModelPageDialogDeleteVersion"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Version"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]} as unknown as DocumentNode<ProjectModelPageDialogDeleteVersionFragment, unknown>;
export const ProjectModelPageDialogMoveToVersionFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectModelPageDialogMoveToVersion"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Version"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]} as unknown as DocumentNode<ProjectModelPageDialogMoveToVersionFragment, unknown>;
export const FunctionRunStatusForSummaryFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FunctionRunStatusForSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]} as unknown as DocumentNode<FunctionRunStatusForSummaryFragment, unknown>;
export const TriggeredAutomationsStatusSummaryFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TriggeredAutomationsStatusSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automationRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"FunctionRunStatusForSummary"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FunctionRunStatusForSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]} as unknown as DocumentNode<TriggeredAutomationsStatusSummaryFragment, unknown>;
export const AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRunFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"results"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"statusMessage"}},{"kind":"Field","name":{"kind":"Name","value":"contextView"}},{"kind":"Field","name":{"kind":"Name","value":"function"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRunFragment, unknown>;
export const AutomateRunsTriggerStatusDialogRunsRows_AutomateRunFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogRunsRows_AutomateRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRun"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"results"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"statusMessage"}},{"kind":"Field","name":{"kind":"Name","value":"contextView"}},{"kind":"Field","name":{"kind":"Name","value":"function"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<AutomateRunsTriggerStatusDialogRunsRows_AutomateRunFragment, unknown>;
export const AutomateRunsTriggerStatusDialog_TriggeredAutomationsStatusFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialog_TriggeredAutomationsStatus"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automationRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogRunsRows_AutomateRun"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"results"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"statusMessage"}},{"kind":"Field","name":{"kind":"Name","value":"contextView"}},{"kind":"Field","name":{"kind":"Name","value":"function"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogRunsRows_AutomateRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRun"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"}}]}}]} as unknown as DocumentNode<AutomateRunsTriggerStatusDialog_TriggeredAutomationsStatusFragment, unknown>;
export const AutomateRunsTriggerStatus_TriggeredAutomationsStatusFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatus_TriggeredAutomationsStatus"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"TriggeredAutomationsStatusSummary"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialog_TriggeredAutomationsStatus"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FunctionRunStatusForSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"results"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"statusMessage"}},{"kind":"Field","name":{"kind":"Name","value":"contextView"}},{"kind":"Field","name":{"kind":"Name","value":"function"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogRunsRows_AutomateRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRun"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TriggeredAutomationsStatusSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automationRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"FunctionRunStatusForSummary"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialog_TriggeredAutomationsStatus"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automationRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogRunsRows_AutomateRun"}}]}}]}}]} as unknown as DocumentNode<AutomateRunsTriggerStatus_TriggeredAutomationsStatusFragment, unknown>;
export const ProjectModelPageVersionsCardVersionFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectModelPageVersionsCardVersion"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Version"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"authorUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"previewUrl"}},{"kind":"Field","name":{"kind":"Name","value":"sourceApplication"}},{"kind":"Field","alias":{"kind":"Name","value":"commentThreadCount"},"name":{"kind":"Name","value":"commentThreads"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectModelPageDialogDeleteVersion"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectModelPageDialogMoveToVersion"}},{"kind":"Field","name":{"kind":"Name","value":"automationsStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatus_TriggeredAutomationsStatus"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FunctionRunStatusForSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TriggeredAutomationsStatusSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automationRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"FunctionRunStatusForSummary"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"results"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"statusMessage"}},{"kind":"Field","name":{"kind":"Name","value":"contextView"}},{"kind":"Field","name":{"kind":"Name","value":"function"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogRunsRows_AutomateRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRun"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialog_TriggeredAutomationsStatus"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automationRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogRunsRows_AutomateRun"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LimitedUserAvatar"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LimitedUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectModelPageDialogDeleteVersion"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Version"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectModelPageDialogMoveToVersion"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Version"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatus_TriggeredAutomationsStatus"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"TriggeredAutomationsStatusSummary"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialog_TriggeredAutomationsStatus"}}]}}]} as unknown as DocumentNode<ProjectModelPageVersionsCardVersionFragment, unknown>;
export const ProjectModelPageVersionsPaginationFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectModelPageVersionsPagination"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"model"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"modelId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"versions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"16"}},{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"Variable","name":{"kind":"Name","value":"versionsCursor"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectModelPageVersionsCardVersion"}}]}}]}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsModelPageEmbed_Project"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LimitedUserAvatar"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LimitedUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectModelPageDialogDeleteVersion"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Version"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectModelPageDialogMoveToVersion"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Version"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FunctionRunStatusForSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TriggeredAutomationsStatusSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automationRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"FunctionRunStatusForSummary"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"results"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"statusMessage"}},{"kind":"Field","name":{"kind":"Name","value":"contextView"}},{"kind":"Field","name":{"kind":"Name","value":"function"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogRunsRows_AutomateRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRun"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialog_TriggeredAutomationsStatus"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automationRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogRunsRows_AutomateRun"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatus_TriggeredAutomationsStatus"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"TriggeredAutomationsStatusSummary"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialog_TriggeredAutomationsStatus"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectsPageTeamDialogManagePermissions_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectModelPageVersionsCardVersion"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Version"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"authorUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"previewUrl"}},{"kind":"Field","name":{"kind":"Name","value":"sourceApplication"}},{"kind":"Field","alias":{"kind":"Name","value":"commentThreadCount"},"name":{"kind":"Name","value":"commentThreads"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectModelPageDialogDeleteVersion"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectModelPageDialogMoveToVersion"}},{"kind":"Field","name":{"kind":"Name","value":"automationsStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatus_TriggeredAutomationsStatus"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectsModelPageEmbed_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsPageTeamDialogManagePermissions_Project"}}]}}]} as unknown as DocumentNode<ProjectModelPageVersionsPaginationFragment, unknown>;
export const ProjectModelPageVersionsProjectFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectModelPageVersionsProject"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageProjectHeader"}},{"kind":"Field","name":{"kind":"Name","value":"model"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"modelId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"pendingImportedVersions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PendingFileUpload"}}]}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectModelPageVersionsPagination"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsModelPageEmbed_Project"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LimitedUserAvatar"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LimitedUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectModelPageDialogDeleteVersion"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Version"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectModelPageDialogMoveToVersion"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Version"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FunctionRunStatusForSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TriggeredAutomationsStatusSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automationRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"FunctionRunStatusForSummary"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"results"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"statusMessage"}},{"kind":"Field","name":{"kind":"Name","value":"contextView"}},{"kind":"Field","name":{"kind":"Name","value":"function"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogRunsRows_AutomateRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRun"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialog_TriggeredAutomationsStatus"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automationRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogRunsRows_AutomateRun"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatus_TriggeredAutomationsStatus"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"TriggeredAutomationsStatusSummary"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialog_TriggeredAutomationsStatus"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectModelPageVersionsCardVersion"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Version"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"authorUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"previewUrl"}},{"kind":"Field","name":{"kind":"Name","value":"sourceApplication"}},{"kind":"Field","alias":{"kind":"Name","value":"commentThreadCount"},"name":{"kind":"Name","value":"commentThreads"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectModelPageDialogDeleteVersion"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectModelPageDialogMoveToVersion"}},{"kind":"Field","name":{"kind":"Name","value":"automationsStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatus_TriggeredAutomationsStatus"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectsPageTeamDialogManagePermissions_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectsModelPageEmbed_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsPageTeamDialogManagePermissions_Project"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageProjectHeader"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"allowPublicComments"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PendingFileUpload"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FileUpload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"modelName"}},{"kind":"Field","name":{"kind":"Name","value":"convertedStatus"}},{"kind":"Field","name":{"kind":"Name","value":"convertedMessage"}},{"kind":"Field","name":{"kind":"Name","value":"uploadDate"}},{"kind":"Field","name":{"kind":"Name","value":"convertedLastUpdate"}},{"kind":"Field","name":{"kind":"Name","value":"fileType"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectModelPageVersionsPagination"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"model"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"modelId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"versions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"16"}},{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"Variable","name":{"kind":"Name","value":"versionsCursor"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectModelPageVersionsCardVersion"}}]}}]}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsModelPageEmbed_Project"}}]}}]} as unknown as DocumentNode<ProjectModelPageVersionsProjectFragment, unknown>;
export const ProjectModelPageDialogEditMessageVersionFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectModelPageDialogEditMessageVersion"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Version"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]} as unknown as DocumentNode<ProjectModelPageDialogEditMessageVersionFragment, unknown>;
export const ProjectPageTeamInternals_ProjectFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageTeamInternals_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"invitedTeam"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"inviteId"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LimitedUserAvatar"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LimitedUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}}]} as unknown as DocumentNode<ProjectPageTeamInternals_ProjectFragment, unknown>;
export const ProjectPageInviteDialog_ProjectFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageInviteDialog_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageTeamInternals_Project"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LimitedUserAvatar"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LimitedUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageTeamInternals_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"invitedTeam"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"inviteId"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}}]}}]}}]}}]} as unknown as DocumentNode<ProjectPageInviteDialog_ProjectFragment, unknown>;
export const ProjectPageAutomationsEmptyState_QueryFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageAutomationsEmptyState_Query"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Query"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"automateFunctions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"9"}},{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"featuredFunctionsOnly"},"value":{"kind":"BooleanValue","value":true}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationsFunctionsCard_AutomateFunction"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateAutomationCreateDialog_AutomateFunction"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationsFunctionsCard_AutomateFunction"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunction"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isFeatured"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"repo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"owner"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateAutomationCreateDialogFunctionParametersStep_AutomateFunction"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunction"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"releases"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"inputSchema"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateAutomationCreateDialog_AutomateFunction"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunction"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationsFunctionsCard_AutomateFunction"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateAutomationCreateDialogFunctionParametersStep_AutomateFunction"}}]}}]} as unknown as DocumentNode<ProjectPageAutomationsEmptyState_QueryFragment, unknown>;
export const AutomationRunDetailsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationRunDetails"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FunctionRunStatusForSummary"}},{"kind":"Field","name":{"kind":"Name","value":"statusMessage"}}]}},{"kind":"Field","name":{"kind":"Name","value":"trigger"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"VersionCreatedTrigger"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"version"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"model"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FunctionRunStatusForSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]} as unknown as DocumentNode<AutomationRunDetailsFragment, unknown>;
export const ProjectPageAutomationsRow_AutomationFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageAutomationsRow_Automation"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Automation"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"isTestAutomation"}},{"kind":"Field","name":{"kind":"Name","value":"currentRevision"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"triggerDefinitions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"VersionCreatedTriggerDefinition"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"model"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"runs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"10"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationRunDetails"}}]}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FunctionRunStatusForSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationRunDetails"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FunctionRunStatusForSummary"}},{"kind":"Field","name":{"kind":"Name","value":"statusMessage"}}]}},{"kind":"Field","name":{"kind":"Name","value":"trigger"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"VersionCreatedTrigger"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"version"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"model"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<ProjectPageAutomationsRow_AutomationFragment, unknown>;
export const ProjectDiscussionsPageHeader_ProjectFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectDiscussionsPageHeader_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]} as unknown as DocumentNode<ProjectDiscussionsPageHeader_ProjectFragment, unknown>;
export const ProjectDiscussionsPageResults_ProjectFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectDiscussionsPageResults_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]} as unknown as DocumentNode<ProjectDiscussionsPageResults_ProjectFragment, unknown>;
export const FormUsersSelectItemFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FormUsersSelectItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LimitedUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}}]} as unknown as DocumentNode<FormUsersSelectItemFragment, unknown>;
export const ProjectModelsPageHeader_ProjectFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectModelsPageHeader_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"sourceApps"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FormUsersSelectItem"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FormUsersSelectItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LimitedUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}}]} as unknown as DocumentNode<ProjectModelsPageHeader_ProjectFragment, unknown>;
export const ProjectPageModelsActions_ProjectFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsActions_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsModelPageEmbed_Project"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectsPageTeamDialogManagePermissions_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectsModelPageEmbed_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsPageTeamDialogManagePermissions_Project"}}]}}]} as unknown as DocumentNode<ProjectPageModelsActions_ProjectFragment, unknown>;
export const ProjectPageModelsStructureItem_ProjectFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsStructureItem_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsActions_Project"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectsPageTeamDialogManagePermissions_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectsModelPageEmbed_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsPageTeamDialogManagePermissions_Project"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsActions_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsModelPageEmbed_Project"}}]}}]} as unknown as DocumentNode<ProjectPageModelsStructureItem_ProjectFragment, unknown>;
export const ProjectPageLatestItemsModelsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageLatestItemsModels"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","alias":{"kind":"Name","value":"modelCount"},"name":{"kind":"Name","value":"models"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsStructureItem_Project"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectsPageTeamDialogManagePermissions_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectsModelPageEmbed_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsPageTeamDialogManagePermissions_Project"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsActions_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsModelPageEmbed_Project"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsStructureItem_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsActions_Project"}}]}}]} as unknown as DocumentNode<ProjectPageLatestItemsModelsFragment, unknown>;
export const ProjectModelsPageResults_ProjectFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectModelsPageResults_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageLatestItemsModels"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectsPageTeamDialogManagePermissions_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectsModelPageEmbed_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsPageTeamDialogManagePermissions_Project"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsActions_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsModelPageEmbed_Project"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsStructureItem_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsActions_Project"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageLatestItemsModels"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","alias":{"kind":"Name","value":"modelCount"},"name":{"kind":"Name","value":"models"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsStructureItem_Project"}}]}}]} as unknown as DocumentNode<ProjectModelsPageResults_ProjectFragment, unknown>;
export const ProjectPageModelsCardRenameDialogFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsCardRenameDialog"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]} as unknown as DocumentNode<ProjectPageModelsCardRenameDialogFragment, unknown>;
export const ProjectPageModelsCardDeleteDialogFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsCardDeleteDialog"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]} as unknown as DocumentNode<ProjectPageModelsCardDeleteDialogFragment, unknown>;
export const ProjectPageModelsActionsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsActions"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]} as unknown as DocumentNode<ProjectPageModelsActionsFragment, unknown>;
export const ProjectPageLatestItemsModelItemFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageLatestItemsModelItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","alias":{"kind":"Name","value":"versionCount"},"name":{"kind":"Name","value":"versions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","alias":{"kind":"Name","value":"commentThreadCount"},"name":{"kind":"Name","value":"commentThreads"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pendingImportedVersions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PendingFileUpload"}}]}},{"kind":"Field","name":{"kind":"Name","value":"previewUrl"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsCardRenameDialog"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsCardDeleteDialog"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsActions"}},{"kind":"Field","name":{"kind":"Name","value":"automationsStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatus_TriggeredAutomationsStatus"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FunctionRunStatusForSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TriggeredAutomationsStatusSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automationRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"FunctionRunStatusForSummary"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"results"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"statusMessage"}},{"kind":"Field","name":{"kind":"Name","value":"contextView"}},{"kind":"Field","name":{"kind":"Name","value":"function"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogRunsRows_AutomateRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRun"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialog_TriggeredAutomationsStatus"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automationRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogRunsRows_AutomateRun"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PendingFileUpload"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FileUpload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"modelName"}},{"kind":"Field","name":{"kind":"Name","value":"convertedStatus"}},{"kind":"Field","name":{"kind":"Name","value":"convertedMessage"}},{"kind":"Field","name":{"kind":"Name","value":"uploadDate"}},{"kind":"Field","name":{"kind":"Name","value":"convertedLastUpdate"}},{"kind":"Field","name":{"kind":"Name","value":"fileType"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsCardRenameDialog"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsCardDeleteDialog"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsActions"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatus_TriggeredAutomationsStatus"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"TriggeredAutomationsStatusSummary"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialog_TriggeredAutomationsStatus"}}]}}]} as unknown as DocumentNode<ProjectPageLatestItemsModelItemFragment, unknown>;
export const SingleLevelModelTreeItemFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SingleLevelModelTreeItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ModelsTreeItem"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}},{"kind":"Field","name":{"kind":"Name","value":"model"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageLatestItemsModelItem"}}]}},{"kind":"Field","name":{"kind":"Name","value":"hasChildren"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PendingFileUpload"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FileUpload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"modelName"}},{"kind":"Field","name":{"kind":"Name","value":"convertedStatus"}},{"kind":"Field","name":{"kind":"Name","value":"convertedMessage"}},{"kind":"Field","name":{"kind":"Name","value":"uploadDate"}},{"kind":"Field","name":{"kind":"Name","value":"convertedLastUpdate"}},{"kind":"Field","name":{"kind":"Name","value":"fileType"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsCardRenameDialog"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsCardDeleteDialog"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsActions"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FunctionRunStatusForSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TriggeredAutomationsStatusSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automationRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"FunctionRunStatusForSummary"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"results"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"statusMessage"}},{"kind":"Field","name":{"kind":"Name","value":"contextView"}},{"kind":"Field","name":{"kind":"Name","value":"function"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogRunsRows_AutomateRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRun"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialog_TriggeredAutomationsStatus"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automationRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogRunsRows_AutomateRun"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatus_TriggeredAutomationsStatus"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"TriggeredAutomationsStatusSummary"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialog_TriggeredAutomationsStatus"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageLatestItemsModelItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","alias":{"kind":"Name","value":"versionCount"},"name":{"kind":"Name","value":"versions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","alias":{"kind":"Name","value":"commentThreadCount"},"name":{"kind":"Name","value":"commentThreads"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pendingImportedVersions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PendingFileUpload"}}]}},{"kind":"Field","name":{"kind":"Name","value":"previewUrl"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsCardRenameDialog"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsCardDeleteDialog"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsActions"}},{"kind":"Field","name":{"kind":"Name","value":"automationsStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatus_TriggeredAutomationsStatus"}}]}}]}}]} as unknown as DocumentNode<SingleLevelModelTreeItemFragment, unknown>;
export const ProjectPageSettingsGeneralBlockAccess_ProjectFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageSettingsGeneralBlockAccess_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}}]}}]} as unknown as DocumentNode<ProjectPageSettingsGeneralBlockAccess_ProjectFragment, unknown>;
export const ProjectPageSettingsGeneralBlockDelete_ProjectFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageSettingsGeneralBlockDelete_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"models"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"commentThreads"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}}]} as unknown as DocumentNode<ProjectPageSettingsGeneralBlockDelete_ProjectFragment, unknown>;
export const ProjectPageSettingsGeneralBlockDiscussions_ProjectFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageSettingsGeneralBlockDiscussions_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"allowPublicComments"}}]}}]} as unknown as DocumentNode<ProjectPageSettingsGeneralBlockDiscussions_ProjectFragment, unknown>;
export const ProjectPageSettingsGeneralBlockLeave_ProjectFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageSettingsGeneralBlockLeave_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LimitedUserAvatar"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LimitedUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}}]} as unknown as DocumentNode<ProjectPageSettingsGeneralBlockLeave_ProjectFragment, unknown>;
export const ProjectPageSettingsGeneralBlockProjectInfo_ProjectFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageSettingsGeneralBlockProjectInfo_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]} as unknown as DocumentNode<ProjectPageSettingsGeneralBlockProjectInfo_ProjectFragment, unknown>;
export const ProjectPageModelsCardProjectFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsCardProject"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsActions_Project"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectsPageTeamDialogManagePermissions_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectsModelPageEmbed_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsPageTeamDialogManagePermissions_Project"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsActions_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsModelPageEmbed_Project"}}]}}]} as unknown as DocumentNode<ProjectPageModelsCardProjectFragment, unknown>;
export const ProjectDashboardItemNoModelsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectDashboardItemNoModels"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsCardProject"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectsPageTeamDialogManagePermissions_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectsModelPageEmbed_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsPageTeamDialogManagePermissions_Project"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsActions_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsModelPageEmbed_Project"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsCardProject"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsActions_Project"}}]}}]} as unknown as DocumentNode<ProjectDashboardItemNoModelsFragment, unknown>;
export const ProjectDashboardItemFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectDashboardItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectDashboardItemNoModels"}},{"kind":"Field","name":{"kind":"Name","value":"models"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"4"}},{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"onlyWithVersions"},"value":{"kind":"BooleanValue","value":true}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageLatestItemsModelItem"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pendingImportedModels"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"4"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PendingFileUpload"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectsPageTeamDialogManagePermissions_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectsModelPageEmbed_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsPageTeamDialogManagePermissions_Project"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsActions_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsModelPageEmbed_Project"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsCardProject"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsActions_Project"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PendingFileUpload"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FileUpload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"modelName"}},{"kind":"Field","name":{"kind":"Name","value":"convertedStatus"}},{"kind":"Field","name":{"kind":"Name","value":"convertedMessage"}},{"kind":"Field","name":{"kind":"Name","value":"uploadDate"}},{"kind":"Field","name":{"kind":"Name","value":"convertedLastUpdate"}},{"kind":"Field","name":{"kind":"Name","value":"fileType"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsCardRenameDialog"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsCardDeleteDialog"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsActions"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FunctionRunStatusForSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TriggeredAutomationsStatusSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automationRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"FunctionRunStatusForSummary"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"results"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"statusMessage"}},{"kind":"Field","name":{"kind":"Name","value":"contextView"}},{"kind":"Field","name":{"kind":"Name","value":"function"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogRunsRows_AutomateRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRun"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialog_TriggeredAutomationsStatus"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automationRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogRunsRows_AutomateRun"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatus_TriggeredAutomationsStatus"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"TriggeredAutomationsStatusSummary"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialog_TriggeredAutomationsStatus"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectDashboardItemNoModels"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsCardProject"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageLatestItemsModelItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","alias":{"kind":"Name","value":"versionCount"},"name":{"kind":"Name","value":"versions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","alias":{"kind":"Name","value":"commentThreadCount"},"name":{"kind":"Name","value":"commentThreads"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pendingImportedVersions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PendingFileUpload"}}]}},{"kind":"Field","name":{"kind":"Name","value":"previewUrl"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsCardRenameDialog"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsCardDeleteDialog"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsActions"}},{"kind":"Field","name":{"kind":"Name","value":"automationsStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatus_TriggeredAutomationsStatus"}}]}}]}}]} as unknown as DocumentNode<ProjectDashboardItemFragment, unknown>;
export const ProjectsDashboardFilledFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectsDashboardFilled"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ProjectCollection"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectDashboardItem"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectsPageTeamDialogManagePermissions_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectsModelPageEmbed_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsPageTeamDialogManagePermissions_Project"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsActions_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsModelPageEmbed_Project"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsCardProject"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsActions_Project"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectDashboardItemNoModels"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsCardProject"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PendingFileUpload"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FileUpload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"modelName"}},{"kind":"Field","name":{"kind":"Name","value":"convertedStatus"}},{"kind":"Field","name":{"kind":"Name","value":"convertedMessage"}},{"kind":"Field","name":{"kind":"Name","value":"uploadDate"}},{"kind":"Field","name":{"kind":"Name","value":"convertedLastUpdate"}},{"kind":"Field","name":{"kind":"Name","value":"fileType"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsCardRenameDialog"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsCardDeleteDialog"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsActions"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FunctionRunStatusForSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TriggeredAutomationsStatusSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automationRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"FunctionRunStatusForSummary"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"results"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"statusMessage"}},{"kind":"Field","name":{"kind":"Name","value":"contextView"}},{"kind":"Field","name":{"kind":"Name","value":"function"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogRunsRows_AutomateRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRun"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialog_TriggeredAutomationsStatus"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automationRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogRunsRows_AutomateRun"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatus_TriggeredAutomationsStatus"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"TriggeredAutomationsStatusSummary"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialog_TriggeredAutomationsStatus"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageLatestItemsModelItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","alias":{"kind":"Name","value":"versionCount"},"name":{"kind":"Name","value":"versions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","alias":{"kind":"Name","value":"commentThreadCount"},"name":{"kind":"Name","value":"commentThreads"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pendingImportedVersions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PendingFileUpload"}}]}},{"kind":"Field","name":{"kind":"Name","value":"previewUrl"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsCardRenameDialog"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsCardDeleteDialog"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsActions"}},{"kind":"Field","name":{"kind":"Name","value":"automationsStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatus_TriggeredAutomationsStatus"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectDashboardItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectDashboardItemNoModels"}},{"kind":"Field","name":{"kind":"Name","value":"models"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"4"}},{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"onlyWithVersions"},"value":{"kind":"BooleanValue","value":true}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageLatestItemsModelItem"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pendingImportedModels"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"4"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PendingFileUpload"}}]}}]}}]} as unknown as DocumentNode<ProjectsDashboardFilledFragment, unknown>;
export const ProjectsInviteBannerFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectsInviteBanner"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PendingStreamCollaborator"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"invitedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}}]}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"projectName"}},{"kind":"Field","name":{"kind":"Name","value":"token"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LimitedUserAvatar"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LimitedUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}}]} as unknown as DocumentNode<ProjectsInviteBannerFragment, unknown>;
export const ProjectsInviteBannersFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectsInviteBanners"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectInvites"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsInviteBanner"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LimitedUserAvatar"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LimitedUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectsInviteBanner"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PendingStreamCollaborator"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"invitedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}}]}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"projectName"}},{"kind":"Field","name":{"kind":"Name","value":"token"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<ProjectsInviteBannersFragment, unknown>;
export const ActiveUserAvatarFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ActiveUserAvatar"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}}]} as unknown as DocumentNode<ActiveUserAvatarFragment, unknown>;
export const UserProfileEditDialogAvatar_UserFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserProfileEditDialogAvatar_User"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ActiveUserAvatar"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ActiveUserAvatar"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}}]} as unknown as DocumentNode<UserProfileEditDialogAvatar_UserFragment, unknown>;
export const UserProfileEditDialogBio_UserFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserProfileEditDialogBio_User"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"company"}},{"kind":"Field","name":{"kind":"Name","value":"bio"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserProfileEditDialogAvatar_User"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ActiveUserAvatar"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserProfileEditDialogAvatar_User"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ActiveUserAvatar"}}]}}]} as unknown as DocumentNode<UserProfileEditDialogBio_UserFragment, unknown>;
export const UserProfileEditDialogDeleteAccount_UserFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserProfileEditDialogDeleteAccount_User"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]} as unknown as DocumentNode<UserProfileEditDialogDeleteAccount_UserFragment, unknown>;
export const UserProfileEditDialogNotificationPreferences_UserFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserProfileEditDialogNotificationPreferences_User"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"notificationPreferences"}}]}}]} as unknown as DocumentNode<UserProfileEditDialogNotificationPreferences_UserFragment, unknown>;
export const ModelPageProjectFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ModelPageProject"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}}]}}]} as unknown as DocumentNode<ModelPageProjectFragment, unknown>;
export const ViewerModelVersionCardItemFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ViewerModelVersionCardItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Version"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"referencedObject"}},{"kind":"Field","name":{"kind":"Name","value":"sourceApplication"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"previewUrl"}},{"kind":"Field","name":{"kind":"Name","value":"authorUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LimitedUserAvatar"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LimitedUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}}]} as unknown as DocumentNode<ViewerModelVersionCardItemFragment, unknown>;
export const SearchAutomateFunctionReleaseItemFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SearchAutomateFunctionReleaseItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRelease"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"versionTag"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"inputSchema"}}]}}]} as unknown as DocumentNode<SearchAutomateFunctionReleaseItemFragment, unknown>;
export const ProjectUpdatableMetadataFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectUpdatableMetadata"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"allowPublicComments"}}]}}]} as unknown as DocumentNode<ProjectUpdatableMetadataFragment, unknown>;
export const ProjectPageLatestItemsCommentsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageLatestItemsComments"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","alias":{"kind":"Name","value":"commentThreadCount"},"name":{"kind":"Name","value":"commentThreads"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}}]} as unknown as DocumentNode<ProjectPageLatestItemsCommentsFragment, unknown>;
export const ProjectPageLatestItemsCommentItemFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageLatestItemsCommentItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Comment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FormUsersSelectItem"}}]}},{"kind":"Field","name":{"kind":"Name","value":"screenshot"}},{"kind":"Field","name":{"kind":"Name","value":"rawText"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"archived"}},{"kind":"Field","alias":{"kind":"Name","value":"repliesCount"},"name":{"kind":"Name","value":"replies"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"replyAuthors"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"4"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FormUsersSelectItem"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FormUsersSelectItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LimitedUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}}]} as unknown as DocumentNode<ProjectPageLatestItemsCommentItemFragment, unknown>;
export const AppAuthorAvatarFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AppAuthorAvatar"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AppAuthor"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}}]} as unknown as DocumentNode<AppAuthorAvatarFragment, unknown>;
export const ThreadCommentAttachmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ThreadCommentAttachment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Comment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"text"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"attachments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}},{"kind":"Field","name":{"kind":"Name","value":"fileType"}},{"kind":"Field","name":{"kind":"Name","value":"fileSize"}}]}}]}}]}}]} as unknown as DocumentNode<ThreadCommentAttachmentFragment, unknown>;
export const ViewerCommentsReplyItemFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ViewerCommentsReplyItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Comment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"archived"}},{"kind":"Field","name":{"kind":"Name","value":"rawText"}},{"kind":"Field","name":{"kind":"Name","value":"text"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"doc"}}]}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ThreadCommentAttachment"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LimitedUserAvatar"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LimitedUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ThreadCommentAttachment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Comment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"text"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"attachments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}},{"kind":"Field","name":{"kind":"Name","value":"fileType"}},{"kind":"Field","name":{"kind":"Name","value":"fileSize"}}]}}]}}]}}]} as unknown as DocumentNode<ViewerCommentsReplyItemFragment, unknown>;
export const ViewerCommentsListItemFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ViewerCommentsListItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Comment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"rawText"}},{"kind":"Field","name":{"kind":"Name","value":"archived"}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"viewedAt"}},{"kind":"Field","name":{"kind":"Name","value":"replies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ViewerCommentsReplyItem"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"replyAuthors"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"4"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FormUsersSelectItem"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"resources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resourceId"}},{"kind":"Field","name":{"kind":"Name","value":"resourceType"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LimitedUserAvatar"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LimitedUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ThreadCommentAttachment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Comment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"text"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"attachments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}},{"kind":"Field","name":{"kind":"Name","value":"fileType"}},{"kind":"Field","name":{"kind":"Name","value":"fileSize"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ViewerCommentsReplyItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Comment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"archived"}},{"kind":"Field","name":{"kind":"Name","value":"rawText"}},{"kind":"Field","name":{"kind":"Name","value":"text"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"doc"}}]}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ThreadCommentAttachment"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FormUsersSelectItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LimitedUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}}]} as unknown as DocumentNode<ViewerCommentsListItemFragment, unknown>;
export const ViewerCommentBubblesDataFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ViewerCommentBubblesData"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Comment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"viewedAt"}},{"kind":"Field","name":{"kind":"Name","value":"viewerState"}}]}}]} as unknown as DocumentNode<ViewerCommentBubblesDataFragment, unknown>;
export const ViewerCommentThreadFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ViewerCommentThread"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Comment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ViewerCommentsListItem"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ViewerCommentBubblesData"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ViewerCommentsReplyItem"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LimitedUserAvatar"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LimitedUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ThreadCommentAttachment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Comment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"text"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"attachments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}},{"kind":"Field","name":{"kind":"Name","value":"fileType"}},{"kind":"Field","name":{"kind":"Name","value":"fileSize"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ViewerCommentsReplyItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Comment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"archived"}},{"kind":"Field","name":{"kind":"Name","value":"rawText"}},{"kind":"Field","name":{"kind":"Name","value":"text"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"doc"}}]}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ThreadCommentAttachment"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FormUsersSelectItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LimitedUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ViewerCommentsListItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Comment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"rawText"}},{"kind":"Field","name":{"kind":"Name","value":"archived"}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"viewedAt"}},{"kind":"Field","name":{"kind":"Name","value":"replies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ViewerCommentsReplyItem"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"replyAuthors"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"4"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FormUsersSelectItem"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"resources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resourceId"}},{"kind":"Field","name":{"kind":"Name","value":"resourceType"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ViewerCommentBubblesData"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Comment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"viewedAt"}},{"kind":"Field","name":{"kind":"Name","value":"viewerState"}}]}}]} as unknown as DocumentNode<ViewerCommentThreadFragment, unknown>;
export const LinkableCommentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LinkableComment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Comment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"viewerResources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"modelId"}},{"kind":"Field","name":{"kind":"Name","value":"versionId"}},{"kind":"Field","name":{"kind":"Name","value":"objectId"}}]}}]}}]} as unknown as DocumentNode<LinkableCommentFragment, unknown>;
export const AutomateFunctionPageHeader_FunctionFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateFunctionPageHeader_Function"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunction"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"repo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"owner"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"releases"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}}]} as unknown as DocumentNode<AutomateFunctionPageHeader_FunctionFragment, unknown>;
export const AutomateFunctionPageParametersDialog_AutomateFunctionReleaseFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateFunctionPageParametersDialog_AutomateFunctionRelease"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRelease"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"inputSchema"}}]}}]} as unknown as DocumentNode<AutomateFunctionPageParametersDialog_AutomateFunctionReleaseFragment, unknown>;
export const AutomateFunctionPageInfo_AutomateFunctionFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateFunctionPageInfo_AutomateFunction"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunction"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"repo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"owner"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"automationCount"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"releases"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"inputSchema"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"commitId"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateFunctionPageParametersDialog_AutomateFunctionRelease"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateFunctionPageParametersDialog_AutomateFunctionRelease"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRelease"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"inputSchema"}}]}}]} as unknown as DocumentNode<AutomateFunctionPageInfo_AutomateFunctionFragment, unknown>;
export const AutomateFunctionPage_AutomateFunctionFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateFunctionPage_AutomateFunction"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunction"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"supportedSourceApps"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateFunctionPageHeader_Function"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateFunctionPageInfo_AutomateFunction"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateAutomationCreateDialog_AutomateFunction"}},{"kind":"Field","name":{"kind":"Name","value":"creator"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateFunctionPageParametersDialog_AutomateFunctionRelease"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRelease"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"inputSchema"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationsFunctionsCard_AutomateFunction"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunction"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isFeatured"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"repo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"owner"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateAutomationCreateDialogFunctionParametersStep_AutomateFunction"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunction"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"releases"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"inputSchema"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateFunctionPageHeader_Function"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunction"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"repo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"owner"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"releases"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateFunctionPageInfo_AutomateFunction"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunction"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"repo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"owner"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"automationCount"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"releases"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"inputSchema"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"commitId"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateFunctionPageParametersDialog_AutomateFunctionRelease"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateAutomationCreateDialog_AutomateFunction"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunction"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationsFunctionsCard_AutomateFunction"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateAutomationCreateDialogFunctionParametersStep_AutomateFunction"}}]}}]} as unknown as DocumentNode<AutomateFunctionPage_AutomateFunctionFragment, unknown>;
export const ProjectPageTeamDialogFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageTeamDialog"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"allowPublicComments"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"invitedTeam"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"inviteId"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsPageTeamDialogManagePermissions_Project"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LimitedUserAvatar"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LimitedUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectsPageTeamDialogManagePermissions_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]} as unknown as DocumentNode<ProjectPageTeamDialogFragment, unknown>;
export const ProjectPageProjectFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageProject"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","alias":{"kind":"Name","value":"modelCount"},"name":{"kind":"Name","value":"models"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","alias":{"kind":"Name","value":"commentThreadCount"},"name":{"kind":"Name","value":"commentThreads"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageProjectHeader"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageTeamDialog"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LimitedUserAvatar"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LimitedUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectsPageTeamDialogManagePermissions_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageProjectHeader"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"allowPublicComments"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageTeamDialog"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"allowPublicComments"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"invitedTeam"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"inviteId"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsPageTeamDialogManagePermissions_Project"}}]}}]} as unknown as DocumentNode<ProjectPageProjectFragment, unknown>;
export const ProjectPageAutomationHeader_AutomationFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageAutomationHeader_Automation"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Automation"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"isTestAutomation"}},{"kind":"Field","name":{"kind":"Name","value":"currentRevision"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"triggerDefinitions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"VersionCreatedTriggerDefinition"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"model"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageLatestItemsModelItem"}}]}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PendingFileUpload"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FileUpload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"modelName"}},{"kind":"Field","name":{"kind":"Name","value":"convertedStatus"}},{"kind":"Field","name":{"kind":"Name","value":"convertedMessage"}},{"kind":"Field","name":{"kind":"Name","value":"uploadDate"}},{"kind":"Field","name":{"kind":"Name","value":"convertedLastUpdate"}},{"kind":"Field","name":{"kind":"Name","value":"fileType"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsCardRenameDialog"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsCardDeleteDialog"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsActions"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FunctionRunStatusForSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TriggeredAutomationsStatusSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automationRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"FunctionRunStatusForSummary"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"results"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"statusMessage"}},{"kind":"Field","name":{"kind":"Name","value":"contextView"}},{"kind":"Field","name":{"kind":"Name","value":"function"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogRunsRows_AutomateRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRun"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialog_TriggeredAutomationsStatus"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automationRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogRunsRows_AutomateRun"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatus_TriggeredAutomationsStatus"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"TriggeredAutomationsStatusSummary"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialog_TriggeredAutomationsStatus"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageLatestItemsModelItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","alias":{"kind":"Name","value":"versionCount"},"name":{"kind":"Name","value":"versions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","alias":{"kind":"Name","value":"commentThreadCount"},"name":{"kind":"Name","value":"commentThreads"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pendingImportedVersions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PendingFileUpload"}}]}},{"kind":"Field","name":{"kind":"Name","value":"previewUrl"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsCardRenameDialog"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsCardDeleteDialog"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsActions"}},{"kind":"Field","name":{"kind":"Name","value":"automationsStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatus_TriggeredAutomationsStatus"}}]}}]}}]} as unknown as DocumentNode<ProjectPageAutomationHeader_AutomationFragment, unknown>;
export const CommonModelSelectorModelFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CommonModelSelectorModel"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]} as unknown as DocumentNode<CommonModelSelectorModelFragment, unknown>;
export const ProjectPageAutomationFunctionSettingsDialog_AutomationRevisionFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageAutomationFunctionSettingsDialog_AutomationRevision"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomationRevision"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"triggerDefinitions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"VersionCreatedTriggerDefinition"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"model"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"CommonModelSelectorModel"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CommonModelSelectorModel"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]} as unknown as DocumentNode<ProjectPageAutomationFunctionSettingsDialog_AutomationRevisionFragment, unknown>;
export const ProjectPageAutomationFunctionSettingsDialog_AutomationRevisionFunctionFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageAutomationFunctionSettingsDialog_AutomationRevisionFunction"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomationRevisionFunction"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"parameters"}},{"kind":"Field","name":{"kind":"Name","value":"release"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"inputSchema"}},{"kind":"Field","name":{"kind":"Name","value":"function"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<ProjectPageAutomationFunctionSettingsDialog_AutomationRevisionFunctionFragment, unknown>;
export const ProjectPageAutomationFunctions_AutomationFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageAutomationFunctions_Automation"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Automation"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"currentRevision"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageAutomationFunctionSettingsDialog_AutomationRevision"}},{"kind":"Field","name":{"kind":"Name","value":"functions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"release"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"function"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationsFunctionsCard_AutomateFunction"}},{"kind":"Field","name":{"kind":"Name","value":"releases"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageAutomationFunctionSettingsDialog_AutomationRevisionFunction"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CommonModelSelectorModel"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageAutomationFunctionSettingsDialog_AutomationRevision"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomationRevision"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"triggerDefinitions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"VersionCreatedTriggerDefinition"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"model"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"CommonModelSelectorModel"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationsFunctionsCard_AutomateFunction"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunction"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isFeatured"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"repo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"owner"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageAutomationFunctionSettingsDialog_AutomationRevisionFunction"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomationRevisionFunction"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"parameters"}},{"kind":"Field","name":{"kind":"Name","value":"release"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"inputSchema"}},{"kind":"Field","name":{"kind":"Name","value":"function"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<ProjectPageAutomationFunctions_AutomationFragment, unknown>;
export const ProjectPageAutomationRuns_AutomationFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageAutomationRuns_Automation"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Automation"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"isTestAutomation"}},{"kind":"Field","name":{"kind":"Name","value":"runs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"10"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationRunDetails"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FunctionRunStatusForSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationRunDetails"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FunctionRunStatusForSummary"}},{"kind":"Field","name":{"kind":"Name","value":"statusMessage"}}]}},{"kind":"Field","name":{"kind":"Name","value":"trigger"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"VersionCreatedTrigger"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"version"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"model"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<ProjectPageAutomationRuns_AutomationFragment, unknown>;
export const ProjectPageAutomationPage_AutomationFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageAutomationPage_Automation"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Automation"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageAutomationHeader_Automation"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageAutomationFunctions_Automation"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageAutomationRuns_Automation"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PendingFileUpload"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FileUpload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"modelName"}},{"kind":"Field","name":{"kind":"Name","value":"convertedStatus"}},{"kind":"Field","name":{"kind":"Name","value":"convertedMessage"}},{"kind":"Field","name":{"kind":"Name","value":"uploadDate"}},{"kind":"Field","name":{"kind":"Name","value":"convertedLastUpdate"}},{"kind":"Field","name":{"kind":"Name","value":"fileType"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsCardRenameDialog"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsCardDeleteDialog"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsActions"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FunctionRunStatusForSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TriggeredAutomationsStatusSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automationRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"FunctionRunStatusForSummary"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"results"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"statusMessage"}},{"kind":"Field","name":{"kind":"Name","value":"contextView"}},{"kind":"Field","name":{"kind":"Name","value":"function"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogRunsRows_AutomateRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRun"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialog_TriggeredAutomationsStatus"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automationRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogRunsRows_AutomateRun"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatus_TriggeredAutomationsStatus"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"TriggeredAutomationsStatusSummary"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialog_TriggeredAutomationsStatus"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageLatestItemsModelItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","alias":{"kind":"Name","value":"versionCount"},"name":{"kind":"Name","value":"versions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","alias":{"kind":"Name","value":"commentThreadCount"},"name":{"kind":"Name","value":"commentThreads"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pendingImportedVersions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PendingFileUpload"}}]}},{"kind":"Field","name":{"kind":"Name","value":"previewUrl"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsCardRenameDialog"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsCardDeleteDialog"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsActions"}},{"kind":"Field","name":{"kind":"Name","value":"automationsStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatus_TriggeredAutomationsStatus"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CommonModelSelectorModel"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageAutomationFunctionSettingsDialog_AutomationRevision"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomationRevision"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"triggerDefinitions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"VersionCreatedTriggerDefinition"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"model"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"CommonModelSelectorModel"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationsFunctionsCard_AutomateFunction"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunction"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isFeatured"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"repo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"owner"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageAutomationFunctionSettingsDialog_AutomationRevisionFunction"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomationRevisionFunction"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"parameters"}},{"kind":"Field","name":{"kind":"Name","value":"release"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"inputSchema"}},{"kind":"Field","name":{"kind":"Name","value":"function"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationRunDetails"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FunctionRunStatusForSummary"}},{"kind":"Field","name":{"kind":"Name","value":"statusMessage"}}]}},{"kind":"Field","name":{"kind":"Name","value":"trigger"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"VersionCreatedTrigger"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"version"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"model"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageAutomationHeader_Automation"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Automation"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"isTestAutomation"}},{"kind":"Field","name":{"kind":"Name","value":"currentRevision"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"triggerDefinitions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"VersionCreatedTriggerDefinition"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"model"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageLatestItemsModelItem"}}]}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageAutomationFunctions_Automation"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Automation"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"currentRevision"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageAutomationFunctionSettingsDialog_AutomationRevision"}},{"kind":"Field","name":{"kind":"Name","value":"functions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"release"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"function"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationsFunctionsCard_AutomateFunction"}},{"kind":"Field","name":{"kind":"Name","value":"releases"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageAutomationFunctionSettingsDialog_AutomationRevisionFunction"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageAutomationRuns_Automation"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Automation"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"isTestAutomation"}},{"kind":"Field","name":{"kind":"Name","value":"runs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"10"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationRunDetails"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}}]}}]}}]} as unknown as DocumentNode<ProjectPageAutomationPage_AutomationFragment, unknown>;
export const ProjectPageAutomationHeader_ProjectFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageAutomationHeader_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsCardProject"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectsPageTeamDialogManagePermissions_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectsModelPageEmbed_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsPageTeamDialogManagePermissions_Project"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsActions_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsModelPageEmbed_Project"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsCardProject"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsActions_Project"}}]}}]} as unknown as DocumentNode<ProjectPageAutomationHeader_ProjectFragment, unknown>;
export const ProjectPageAutomationPage_ProjectFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageAutomationPage_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageAutomationHeader_Project"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectsPageTeamDialogManagePermissions_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectsModelPageEmbed_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsPageTeamDialogManagePermissions_Project"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsActions_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsModelPageEmbed_Project"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsCardProject"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsActions_Project"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageAutomationHeader_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsCardProject"}}]}}]} as unknown as DocumentNode<ProjectPageAutomationPage_ProjectFragment, unknown>;
export const ProjectPageSettingsTab_ProjectFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageSettingsTab_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]} as unknown as DocumentNode<ProjectPageSettingsTab_ProjectFragment, unknown>;
export const RegisterPanelServerInviteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"RegisterPanelServerInvite"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"token"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"serverInviteByToken"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"token"},"value":{"kind":"Variable","name":{"kind":"Name","value":"token"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]} as unknown as DocumentNode<RegisterPanelServerInviteQuery, RegisterPanelServerInviteQueryVariables>;
export const EmailVerificationBannerStateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"EmailVerificationBannerState"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"verified"}},{"kind":"Field","name":{"kind":"Name","value":"hasPendingVerification"}}]}}]}}]} as unknown as DocumentNode<EmailVerificationBannerStateQuery, EmailVerificationBannerStateQueryVariables>;
export const RequestVerificationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RequestVerification"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requestVerification"}}]}}]} as unknown as DocumentNode<RequestVerificationMutation, RequestVerificationMutationVariables>;
export const AutomationCreateDialogFunctionsSearchDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AutomationCreateDialogFunctionsSearch"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"defaultValue":{"kind":"NullValue"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"automateFunctions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"20"}},{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}}]}},{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateAutomationCreateDialog_AutomateFunction"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationsFunctionsCard_AutomateFunction"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunction"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isFeatured"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"repo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"owner"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateAutomationCreateDialogFunctionParametersStep_AutomateFunction"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunction"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"releases"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"inputSchema"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateAutomationCreateDialog_AutomateFunction"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunction"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationsFunctionsCard_AutomateFunction"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateAutomationCreateDialogFunctionParametersStep_AutomateFunction"}}]}}]} as unknown as DocumentNode<AutomationCreateDialogFunctionsSearchQuery, AutomationCreateDialogFunctionsSearchQueryVariables>;
export const ProjectPageSettingsCollaboratorsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectPageSettingsCollaborators"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageTeamInternals_Project"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageInviteDialog_Project"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LimitedUserAvatar"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LimitedUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageTeamInternals_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"invitedTeam"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"inviteId"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageInviteDialog_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageTeamInternals_Project"}}]}}]} as unknown as DocumentNode<ProjectPageSettingsCollaboratorsQuery, ProjectPageSettingsCollaboratorsQueryVariables>;
export const ProjectPageSettingsGeneralDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectPageSettingsGeneral"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageSettingsGeneralBlockProjectInfo_Project"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageSettingsGeneralBlockAccess_Project"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageSettingsGeneralBlockDiscussions_Project"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageSettingsGeneralBlockLeave_Project"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageSettingsGeneralBlockDelete_Project"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageTeamInternals_Project"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LimitedUserAvatar"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LimitedUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageSettingsGeneralBlockProjectInfo_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageSettingsGeneralBlockAccess_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageSettingsGeneralBlockDiscussions_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"allowPublicComments"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageSettingsGeneralBlockLeave_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageSettingsGeneralBlockDelete_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"models"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"commentThreads"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageTeamInternals_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"invitedTeam"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"inviteId"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}}]}}]}}]}}]} as unknown as DocumentNode<ProjectPageSettingsGeneralQuery, ProjectPageSettingsGeneralQueryVariables>;
export const OnUserProjectsUpdateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"OnUserProjectsUpdate"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userProjectsUpdated"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"project"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectDashboardItem"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectsPageTeamDialogManagePermissions_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectsModelPageEmbed_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsPageTeamDialogManagePermissions_Project"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsActions_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsModelPageEmbed_Project"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsCardProject"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsActions_Project"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectDashboardItemNoModels"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsCardProject"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PendingFileUpload"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FileUpload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"modelName"}},{"kind":"Field","name":{"kind":"Name","value":"convertedStatus"}},{"kind":"Field","name":{"kind":"Name","value":"convertedMessage"}},{"kind":"Field","name":{"kind":"Name","value":"uploadDate"}},{"kind":"Field","name":{"kind":"Name","value":"convertedLastUpdate"}},{"kind":"Field","name":{"kind":"Name","value":"fileType"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsCardRenameDialog"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsCardDeleteDialog"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsActions"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FunctionRunStatusForSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TriggeredAutomationsStatusSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automationRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"FunctionRunStatusForSummary"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"results"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"statusMessage"}},{"kind":"Field","name":{"kind":"Name","value":"contextView"}},{"kind":"Field","name":{"kind":"Name","value":"function"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogRunsRows_AutomateRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRun"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialog_TriggeredAutomationsStatus"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automationRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogRunsRows_AutomateRun"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatus_TriggeredAutomationsStatus"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"TriggeredAutomationsStatusSummary"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialog_TriggeredAutomationsStatus"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageLatestItemsModelItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","alias":{"kind":"Name","value":"versionCount"},"name":{"kind":"Name","value":"versions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","alias":{"kind":"Name","value":"commentThreadCount"},"name":{"kind":"Name","value":"commentThreads"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pendingImportedVersions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PendingFileUpload"}}]}},{"kind":"Field","name":{"kind":"Name","value":"previewUrl"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsCardRenameDialog"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsCardDeleteDialog"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsActions"}},{"kind":"Field","name":{"kind":"Name","value":"automationsStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatus_TriggeredAutomationsStatus"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectDashboardItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectDashboardItemNoModels"}},{"kind":"Field","name":{"kind":"Name","value":"models"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"4"}},{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"onlyWithVersions"},"value":{"kind":"BooleanValue","value":true}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageLatestItemsModelItem"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pendingImportedModels"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"4"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PendingFileUpload"}}]}}]}}]} as unknown as DocumentNode<OnUserProjectsUpdateSubscription, OnUserProjectsUpdateSubscriptionVariables>;
export const ActiveUserMainMetadataDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ActiveUserMainMetadata"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"company"}},{"kind":"Field","name":{"kind":"Name","value":"bio"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"isOnboardingFinished"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"verified"}},{"kind":"Field","name":{"kind":"Name","value":"notificationPreferences"}},{"kind":"Field","name":{"kind":"Name","value":"versions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}}]}}]} as unknown as DocumentNode<ActiveUserMainMetadataQuery, ActiveUserMainMetadataQueryVariables>;
export const CreateOnboardingProjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateOnboardingProject"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createForOnboarding"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageProject"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectDashboardItem"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageProjectHeader"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"allowPublicComments"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LimitedUserAvatar"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LimitedUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectsPageTeamDialogManagePermissions_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageTeamDialog"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"allowPublicComments"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"invitedTeam"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"inviteId"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsPageTeamDialogManagePermissions_Project"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectsModelPageEmbed_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsPageTeamDialogManagePermissions_Project"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsActions_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsModelPageEmbed_Project"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsCardProject"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsActions_Project"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectDashboardItemNoModels"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsCardProject"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PendingFileUpload"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FileUpload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"modelName"}},{"kind":"Field","name":{"kind":"Name","value":"convertedStatus"}},{"kind":"Field","name":{"kind":"Name","value":"convertedMessage"}},{"kind":"Field","name":{"kind":"Name","value":"uploadDate"}},{"kind":"Field","name":{"kind":"Name","value":"convertedLastUpdate"}},{"kind":"Field","name":{"kind":"Name","value":"fileType"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsCardRenameDialog"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsCardDeleteDialog"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsActions"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FunctionRunStatusForSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TriggeredAutomationsStatusSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automationRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"FunctionRunStatusForSummary"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"results"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"statusMessage"}},{"kind":"Field","name":{"kind":"Name","value":"contextView"}},{"kind":"Field","name":{"kind":"Name","value":"function"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogRunsRows_AutomateRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRun"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialog_TriggeredAutomationsStatus"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automationRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogRunsRows_AutomateRun"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatus_TriggeredAutomationsStatus"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"TriggeredAutomationsStatusSummary"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialog_TriggeredAutomationsStatus"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageLatestItemsModelItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","alias":{"kind":"Name","value":"versionCount"},"name":{"kind":"Name","value":"versions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","alias":{"kind":"Name","value":"commentThreadCount"},"name":{"kind":"Name","value":"commentThreads"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pendingImportedVersions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PendingFileUpload"}}]}},{"kind":"Field","name":{"kind":"Name","value":"previewUrl"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsCardRenameDialog"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsCardDeleteDialog"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsActions"}},{"kind":"Field","name":{"kind":"Name","value":"automationsStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatus_TriggeredAutomationsStatus"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageProject"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","alias":{"kind":"Name","value":"modelCount"},"name":{"kind":"Name","value":"models"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","alias":{"kind":"Name","value":"commentThreadCount"},"name":{"kind":"Name","value":"commentThreads"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageProjectHeader"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageTeamDialog"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectDashboardItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectDashboardItemNoModels"}},{"kind":"Field","name":{"kind":"Name","value":"models"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"4"}},{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"onlyWithVersions"},"value":{"kind":"BooleanValue","value":true}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageLatestItemsModelItem"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pendingImportedModels"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"4"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PendingFileUpload"}}]}}]}}]} as unknown as DocumentNode<CreateOnboardingProjectMutation, CreateOnboardingProjectMutationVariables>;
export const FinishOnboardingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"FinishOnboarding"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeUserMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"finishOnboarding"}}]}}]}}]} as unknown as DocumentNode<FinishOnboardingMutation, FinishOnboardingMutationVariables>;
export const RequestVerificationByEmailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RequestVerificationByEmail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"email"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requestVerificationByEmail"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"email"},"value":{"kind":"Variable","name":{"kind":"Name","value":"email"}}}]}]}}]} as unknown as DocumentNode<RequestVerificationByEmailMutation, RequestVerificationByEmailMutationVariables>;
export const AuthServerInfoDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AuthServerInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"serverInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AuthStategiesServerInfoFragment"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ServerTermsOfServicePrivacyPolicyFragment"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AuthRegisterPanelServerInfo"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AuthStategiesServerInfoFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ServerInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"authStrategies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"url"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ServerTermsOfServicePrivacyPolicyFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ServerInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"termsOfService"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AuthRegisterPanelServerInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ServerInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"inviteOnly"}}]}}]} as unknown as DocumentNode<AuthServerInfoQuery, AuthServerInfoQueryVariables>;
export const AuthorizableAppMetadataDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AuthorizableAppMetadata"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"app"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"trustByDefault"}},{"kind":"Field","name":{"kind":"Name","value":"redirectUrl"}},{"kind":"Field","name":{"kind":"Name","value":"scopes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}}]}}]}}]} as unknown as DocumentNode<AuthorizableAppMetadataQuery, AuthorizableAppMetadataQueryVariables>;
export const CreateAutomateFunctionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateAutomateFunction"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateAutomateFunctionInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"automateMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createFunction"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationsFunctionsCard_AutomateFunction"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateFunctionCreateDialogDoneStep_AutomateFunction"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationsFunctionsCard_AutomateFunction"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunction"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isFeatured"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"repo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"owner"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateFunctionCreateDialogDoneStep_AutomateFunction"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunction"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"repo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"owner"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationsFunctionsCard_AutomateFunction"}}]}}]} as unknown as DocumentNode<CreateAutomateFunctionMutation, CreateAutomateFunctionMutationVariables>;
export const UpdateAutomateFunctionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateAutomateFunction"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateAutomateFunctionInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"automateMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateFunction"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateFunctionPage_AutomateFunction"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateFunctionPageHeader_Function"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunction"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"repo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"owner"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"releases"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateFunctionPageParametersDialog_AutomateFunctionRelease"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRelease"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"inputSchema"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateFunctionPageInfo_AutomateFunction"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunction"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"repo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"owner"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"automationCount"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"releases"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"inputSchema"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"commitId"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateFunctionPageParametersDialog_AutomateFunctionRelease"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationsFunctionsCard_AutomateFunction"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunction"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isFeatured"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"repo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"owner"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateAutomationCreateDialogFunctionParametersStep_AutomateFunction"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunction"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"releases"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"inputSchema"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateAutomationCreateDialog_AutomateFunction"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunction"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationsFunctionsCard_AutomateFunction"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateAutomationCreateDialogFunctionParametersStep_AutomateFunction"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateFunctionPage_AutomateFunction"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunction"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"supportedSourceApps"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateFunctionPageHeader_Function"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateFunctionPageInfo_AutomateFunction"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateAutomationCreateDialog_AutomateFunction"}},{"kind":"Field","name":{"kind":"Name","value":"creator"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<UpdateAutomateFunctionMutation, UpdateAutomateFunctionMutationVariables>;
export const SearchAutomateFunctionReleasesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SearchAutomateFunctionReleases"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"functionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionReleasesFilter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"automateFunction"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"functionId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"releases"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SearchAutomateFunctionReleaseItem"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SearchAutomateFunctionReleaseItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRelease"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"versionTag"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"inputSchema"}}]}}]} as unknown as DocumentNode<SearchAutomateFunctionReleasesQuery, SearchAutomateFunctionReleasesQueryVariables>;
export const FunctionAccessCheckDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"FunctionAccessCheck"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"automateFunction"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<FunctionAccessCheckQuery, FunctionAccessCheckQueryVariables>;
export const ProjectAutomationCreationPublicKeysDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectAutomationCreationPublicKeys"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"automationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"automationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"creationPublicKeys"}}]}}]}}]}}]} as unknown as DocumentNode<ProjectAutomationCreationPublicKeysQuery, ProjectAutomationCreationPublicKeysQueryVariables>;
export const AutomateFunctionsPagePaginationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AutomateFunctionsPagePagination"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateFunctionsPageItems_Query"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationsFunctionsCard_AutomateFunction"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunction"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isFeatured"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"repo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"owner"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateAutomationCreateDialogFunctionParametersStep_AutomateFunction"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunction"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"releases"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"inputSchema"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateAutomationCreateDialog_AutomateFunction"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunction"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationsFunctionsCard_AutomateFunction"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateAutomationCreateDialogFunctionParametersStep_AutomateFunction"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateFunctionsPageItems_Query"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Query"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"automateFunctions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"20"}},{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}}]}},{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationsFunctionsCard_AutomateFunction"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateAutomationCreateDialog_AutomateFunction"}}]}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}}]}}]}}]} as unknown as DocumentNode<AutomateFunctionsPagePaginationQuery, AutomateFunctionsPagePaginationQueryVariables>;
export const MentionsUserSearchDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MentionsUserSearch"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"query"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"emailOnly"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}},"defaultValue":{"kind":"BooleanValue","value":false}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userSearch"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"query"},"value":{"kind":"Variable","name":{"kind":"Name","value":"query"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"5"}},{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"NullValue"}},{"kind":"Argument","name":{"kind":"Name","value":"archived"},"value":{"kind":"BooleanValue","value":false}},{"kind":"Argument","name":{"kind":"Name","value":"emailOnly"},"value":{"kind":"Variable","name":{"kind":"Name","value":"emailOnly"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"company"}}]}}]}}]}}]} as unknown as DocumentNode<MentionsUserSearchQuery, MentionsUserSearchQueryVariables>;
export const UserSearchDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"UserSearch"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"query"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"archived"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userSearch"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"query"},"value":{"kind":"Variable","name":{"kind":"Name","value":"query"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}}},{"kind":"Argument","name":{"kind":"Name","value":"archived"},"value":{"kind":"Variable","name":{"kind":"Name","value":"archived"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"bio"}},{"kind":"Field","name":{"kind":"Name","value":"company"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"verified"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]}}]}}]} as unknown as DocumentNode<UserSearchQuery, UserSearchQueryVariables>;
export const ServerInfoBlobSizeLimitDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ServerInfoBlobSizeLimit"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"serverInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"blobSizeLimitBytes"}}]}}]}}]} as unknown as DocumentNode<ServerInfoBlobSizeLimitQuery, ServerInfoBlobSizeLimitQueryVariables>;
export const ServerInfoAllScopesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ServerInfoAllScopes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"serverInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"scopes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]}}]} as unknown as DocumentNode<ServerInfoAllScopesQuery, ServerInfoAllScopesQueryVariables>;
export const ProjectModelsSelectorValuesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectModelsSelectorValues"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"models"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"100"}},{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CommonModelSelectorModel"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CommonModelSelectorModel"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]} as unknown as DocumentNode<ProjectModelsSelectorValuesQuery, ProjectModelsSelectorValuesQueryVariables>;
export const MainServerInfoDataDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MainServerInfoData"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"serverInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminContact"}},{"kind":"Field","name":{"kind":"Name","value":"blobSizeLimitBytes"}},{"kind":"Field","name":{"kind":"Name","value":"canonicalUrl"}},{"kind":"Field","name":{"kind":"Name","value":"company"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"guestModeEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"inviteOnly"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"termsOfService"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"automateUrl"}}]}}]}}]} as unknown as DocumentNode<MainServerInfoDataQuery, MainServerInfoDataQueryVariables>;
export const DeleteAccessTokenDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteAccessToken"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"token"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"apiTokenRevoke"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"token"},"value":{"kind":"Variable","name":{"kind":"Name","value":"token"}}}]}]}}]} as unknown as DocumentNode<DeleteAccessTokenMutation, DeleteAccessTokenMutationVariables>;
export const CreateAccessTokenDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateAccessToken"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"token"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ApiTokenCreateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"apiTokenCreate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"token"},"value":{"kind":"Variable","name":{"kind":"Name","value":"token"}}}]}]}}]} as unknown as DocumentNode<CreateAccessTokenMutation, CreateAccessTokenMutationVariables>;
export const DeleteApplicationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteApplication"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"appId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"appDelete"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"appId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"appId"}}}]}]}}]} as unknown as DocumentNode<DeleteApplicationMutation, DeleteApplicationMutationVariables>;
export const CreateApplicationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateApplication"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"app"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AppCreateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"appCreate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"app"},"value":{"kind":"Variable","name":{"kind":"Name","value":"app"}}}]}]}}]} as unknown as DocumentNode<CreateApplicationMutation, CreateApplicationMutationVariables>;
export const EditApplicationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"EditApplication"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"app"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AppUpdateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"appUpdate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"app"},"value":{"kind":"Variable","name":{"kind":"Name","value":"app"}}}]}]}}]} as unknown as DocumentNode<EditApplicationMutation, EditApplicationMutationVariables>;
export const RevokeAppAccessDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RevokeAppAccess"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"appId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"appRevokeAccess"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"appId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"appId"}}}]}]}}]} as unknown as DocumentNode<RevokeAppAccessMutation, RevokeAppAccessMutationVariables>;
export const DeveloperSettingsAccessTokensDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"DeveloperSettingsAccessTokens"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"apiTokens"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"lastUsed"}},{"kind":"Field","name":{"kind":"Name","value":"lastChars"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"scopes"}}]}}]}}]}}]} as unknown as DocumentNode<DeveloperSettingsAccessTokensQuery, DeveloperSettingsAccessTokensQueryVariables>;
export const DeveloperSettingsApplicationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"DeveloperSettingsApplications"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdApps"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"secret"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"redirectUrl"}},{"kind":"Field","name":{"kind":"Name","value":"scopes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<DeveloperSettingsApplicationsQuery, DeveloperSettingsApplicationsQueryVariables>;
export const DeveloperSettingsAuthorizedAppsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"DeveloperSettingsAuthorizedApps"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"authorizedApps"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}}]}}]}}]}}]} as unknown as DocumentNode<DeveloperSettingsAuthorizedAppsQuery, DeveloperSettingsAuthorizedAppsQueryVariables>;
export const SearchProjectsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SearchProjects"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"onlyWithRoles"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},"defaultValue":{"kind":"NullValue"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projects"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"10"}},{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"onlyWithRoles"},"value":{"kind":"Variable","name":{"kind":"Name","value":"onlyWithRoles"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FormSelectProjects_Project"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FormSelectProjects_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]} as unknown as DocumentNode<SearchProjectsQuery, SearchProjectsQueryVariables>;
export const SearchProjectModelsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SearchProjectModels"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"models"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"10"}},{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FormSelectModels_Model"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FormSelectModels_Model"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]} as unknown as DocumentNode<SearchProjectModelsQuery, SearchProjectModelsQueryVariables>;
export const RequestGendoAiRenderDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"requestGendoAIRender"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"GendoAIRenderInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"versionMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requestGendoAIRender"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]}}]} as unknown as DocumentNode<RequestGendoAiRenderMutation, RequestGendoAiRenderMutationVariables>;
export const GendoAiRenderDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GendoAIRender"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"gendoAiRenderId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"versionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"version"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"versionId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"gendoAIRender"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"gendoAiRenderId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"modelId"}},{"kind":"Field","name":{"kind":"Name","value":"versionId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"gendoGenerationId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"prompt"}},{"kind":"Field","name":{"kind":"Name","value":"camera"}},{"kind":"Field","name":{"kind":"Name","value":"responseImage"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<GendoAiRenderQuery, GendoAiRenderQueryVariables>;
export const GendoAiRendersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GendoAIRenders"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"versionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"version"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"versionId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"gendoAIRenders"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"gendoGenerationId"}},{"kind":"Field","name":{"kind":"Name","value":"prompt"}},{"kind":"Field","name":{"kind":"Name","value":"camera"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<GendoAiRendersQuery, GendoAiRendersQueryVariables>;
export const ProjectVersionGendoAiRenderCreatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"ProjectVersionGendoAIRenderCreated"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"versionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectVersionGendoAIRenderCreated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"versionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"versionId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"gendoGenerationId"}},{"kind":"Field","name":{"kind":"Name","value":"prompt"}},{"kind":"Field","name":{"kind":"Name","value":"camera"}}]}}]}}]} as unknown as DocumentNode<ProjectVersionGendoAiRenderCreatedSubscription, ProjectVersionGendoAiRenderCreatedSubscriptionVariables>;
export const ProjectVersionGendoAiRenderUpdatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"ProjectVersionGendoAIRenderUpdated"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"versionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectVersionGendoAIRenderUpdated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"versionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"versionId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"modelId"}},{"kind":"Field","name":{"kind":"Name","value":"versionId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"gendoGenerationId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"prompt"}},{"kind":"Field","name":{"kind":"Name","value":"camera"}},{"kind":"Field","name":{"kind":"Name","value":"responseImage"}}]}}]}}]} as unknown as DocumentNode<ProjectVersionGendoAiRenderUpdatedSubscription, ProjectVersionGendoAiRenderUpdatedSubscriptionVariables>;
export const CreateModelDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateModel"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateModelInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"modelMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"create"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageLatestItemsModelItem"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PendingFileUpload"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FileUpload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"modelName"}},{"kind":"Field","name":{"kind":"Name","value":"convertedStatus"}},{"kind":"Field","name":{"kind":"Name","value":"convertedMessage"}},{"kind":"Field","name":{"kind":"Name","value":"uploadDate"}},{"kind":"Field","name":{"kind":"Name","value":"convertedLastUpdate"}},{"kind":"Field","name":{"kind":"Name","value":"fileType"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsCardRenameDialog"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsCardDeleteDialog"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsActions"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FunctionRunStatusForSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TriggeredAutomationsStatusSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automationRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"FunctionRunStatusForSummary"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"results"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"statusMessage"}},{"kind":"Field","name":{"kind":"Name","value":"contextView"}},{"kind":"Field","name":{"kind":"Name","value":"function"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogRunsRows_AutomateRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRun"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialog_TriggeredAutomationsStatus"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automationRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogRunsRows_AutomateRun"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatus_TriggeredAutomationsStatus"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"TriggeredAutomationsStatusSummary"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialog_TriggeredAutomationsStatus"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageLatestItemsModelItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","alias":{"kind":"Name","value":"versionCount"},"name":{"kind":"Name","value":"versions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","alias":{"kind":"Name","value":"commentThreadCount"},"name":{"kind":"Name","value":"commentThreads"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pendingImportedVersions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PendingFileUpload"}}]}},{"kind":"Field","name":{"kind":"Name","value":"previewUrl"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsCardRenameDialog"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsCardDeleteDialog"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsActions"}},{"kind":"Field","name":{"kind":"Name","value":"automationsStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatus_TriggeredAutomationsStatus"}}]}}]}}]} as unknown as DocumentNode<CreateModelMutation, CreateModelMutationVariables>;
export const CreateProjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateProject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ProjectCreateInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"create"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageProject"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectDashboardItem"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageProjectHeader"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"allowPublicComments"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LimitedUserAvatar"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LimitedUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectsPageTeamDialogManagePermissions_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageTeamDialog"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"allowPublicComments"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"invitedTeam"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"inviteId"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsPageTeamDialogManagePermissions_Project"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectsModelPageEmbed_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsPageTeamDialogManagePermissions_Project"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsActions_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsModelPageEmbed_Project"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsCardProject"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsActions_Project"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectDashboardItemNoModels"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsCardProject"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PendingFileUpload"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FileUpload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"modelName"}},{"kind":"Field","name":{"kind":"Name","value":"convertedStatus"}},{"kind":"Field","name":{"kind":"Name","value":"convertedMessage"}},{"kind":"Field","name":{"kind":"Name","value":"uploadDate"}},{"kind":"Field","name":{"kind":"Name","value":"convertedLastUpdate"}},{"kind":"Field","name":{"kind":"Name","value":"fileType"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsCardRenameDialog"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsCardDeleteDialog"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsActions"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FunctionRunStatusForSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TriggeredAutomationsStatusSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automationRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"FunctionRunStatusForSummary"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"results"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"statusMessage"}},{"kind":"Field","name":{"kind":"Name","value":"contextView"}},{"kind":"Field","name":{"kind":"Name","value":"function"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogRunsRows_AutomateRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRun"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialog_TriggeredAutomationsStatus"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automationRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogRunsRows_AutomateRun"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatus_TriggeredAutomationsStatus"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"TriggeredAutomationsStatusSummary"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialog_TriggeredAutomationsStatus"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageLatestItemsModelItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","alias":{"kind":"Name","value":"versionCount"},"name":{"kind":"Name","value":"versions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","alias":{"kind":"Name","value":"commentThreadCount"},"name":{"kind":"Name","value":"commentThreads"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pendingImportedVersions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PendingFileUpload"}}]}},{"kind":"Field","name":{"kind":"Name","value":"previewUrl"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsCardRenameDialog"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsCardDeleteDialog"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsActions"}},{"kind":"Field","name":{"kind":"Name","value":"automationsStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatus_TriggeredAutomationsStatus"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageProject"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","alias":{"kind":"Name","value":"modelCount"},"name":{"kind":"Name","value":"models"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","alias":{"kind":"Name","value":"commentThreadCount"},"name":{"kind":"Name","value":"commentThreads"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageProjectHeader"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageTeamDialog"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectDashboardItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectDashboardItemNoModels"}},{"kind":"Field","name":{"kind":"Name","value":"models"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"4"}},{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"onlyWithVersions"},"value":{"kind":"BooleanValue","value":true}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageLatestItemsModelItem"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pendingImportedModels"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"4"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PendingFileUpload"}}]}}]}}]} as unknown as DocumentNode<CreateProjectMutation, CreateProjectMutationVariables>;
export const UpdateModelDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateModel"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateModelInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"modelMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"update"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageLatestItemsModelItem"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PendingFileUpload"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FileUpload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"modelName"}},{"kind":"Field","name":{"kind":"Name","value":"convertedStatus"}},{"kind":"Field","name":{"kind":"Name","value":"convertedMessage"}},{"kind":"Field","name":{"kind":"Name","value":"uploadDate"}},{"kind":"Field","name":{"kind":"Name","value":"convertedLastUpdate"}},{"kind":"Field","name":{"kind":"Name","value":"fileType"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsCardRenameDialog"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsCardDeleteDialog"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsActions"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FunctionRunStatusForSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TriggeredAutomationsStatusSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automationRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"FunctionRunStatusForSummary"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"results"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"statusMessage"}},{"kind":"Field","name":{"kind":"Name","value":"contextView"}},{"kind":"Field","name":{"kind":"Name","value":"function"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogRunsRows_AutomateRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRun"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialog_TriggeredAutomationsStatus"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automationRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogRunsRows_AutomateRun"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatus_TriggeredAutomationsStatus"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"TriggeredAutomationsStatusSummary"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialog_TriggeredAutomationsStatus"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageLatestItemsModelItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","alias":{"kind":"Name","value":"versionCount"},"name":{"kind":"Name","value":"versions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","alias":{"kind":"Name","value":"commentThreadCount"},"name":{"kind":"Name","value":"commentThreads"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pendingImportedVersions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PendingFileUpload"}}]}},{"kind":"Field","name":{"kind":"Name","value":"previewUrl"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsCardRenameDialog"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsCardDeleteDialog"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsActions"}},{"kind":"Field","name":{"kind":"Name","value":"automationsStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatus_TriggeredAutomationsStatus"}}]}}]}}]} as unknown as DocumentNode<UpdateModelMutation, UpdateModelMutationVariables>;
export const DeleteModelDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteModel"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DeleteModelInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"modelMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"delete"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]}}]} as unknown as DocumentNode<DeleteModelMutation, DeleteModelMutationVariables>;
export const UpdateProjectRoleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateProjectRole"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ProjectUpdateRoleInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateRole"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}}]}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LimitedUserAvatar"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LimitedUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}}]} as unknown as DocumentNode<UpdateProjectRoleMutation, UpdateProjectRoleMutationVariables>;
export const InviteProjectUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"InviteProjectUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ProjectInviteCreateInput"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"invites"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"batchCreate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageTeamDialog"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LimitedUserAvatar"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LimitedUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectsPageTeamDialogManagePermissions_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageTeamDialog"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"allowPublicComments"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"invitedTeam"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"inviteId"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsPageTeamDialogManagePermissions_Project"}}]}}]} as unknown as DocumentNode<InviteProjectUserMutation, InviteProjectUserMutationVariables>;
export const CancelProjectInviteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CancelProjectInvite"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"inviteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"invites"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cancel"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}},{"kind":"Argument","name":{"kind":"Name","value":"inviteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"inviteId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageTeamDialog"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LimitedUserAvatar"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LimitedUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectsPageTeamDialogManagePermissions_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageTeamDialog"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"allowPublicComments"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"invitedTeam"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"inviteId"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsPageTeamDialogManagePermissions_Project"}}]}}]} as unknown as DocumentNode<CancelProjectInviteMutation, CancelProjectInviteMutationVariables>;
export const UpdateProjectMetadataDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateProjectMetadata"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"update"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ProjectUpdateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"update"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"update"},"value":{"kind":"Variable","name":{"kind":"Name","value":"update"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectUpdatableMetadata"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectUpdatableMetadata"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"allowPublicComments"}}]}}]} as unknown as DocumentNode<UpdateProjectMetadataMutation, UpdateProjectMetadataMutationVariables>;
export const DeleteProjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteProject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"delete"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]}}]} as unknown as DocumentNode<DeleteProjectMutation, DeleteProjectMutationVariables>;
export const UseProjectInviteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UseProjectInvite"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ProjectInviteUseInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"invites"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"use"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]}}]}}]} as unknown as DocumentNode<UseProjectInviteMutation, UseProjectInviteMutationVariables>;
export const LeaveProjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"LeaveProject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"leave"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}]}]}}]}}]} as unknown as DocumentNode<LeaveProjectMutation, LeaveProjectMutationVariables>;
export const DeleteVersionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteVersions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DeleteVersionsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"versionMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"delete"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]}}]} as unknown as DocumentNode<DeleteVersionsMutation, DeleteVersionsMutationVariables>;
export const MoveVersionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MoveVersions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MoveVersionsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"versionMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"moveToModel"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<MoveVersionsMutation, MoveVersionsMutationVariables>;
export const UpdateVersionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateVersion"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateVersionInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"versionMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"update"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateVersionMutation, UpdateVersionMutationVariables>;
export const DeleteWebhookDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"deleteWebhook"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"webhook"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"WebhookDeleteInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"webhookDelete"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"webhook"},"value":{"kind":"Variable","name":{"kind":"Name","value":"webhook"}}}]}]}}]} as unknown as DocumentNode<DeleteWebhookMutation, DeleteWebhookMutationVariables>;
export const CreateWebhookDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createWebhook"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"webhook"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"WebhookCreateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"webhookCreate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"webhook"},"value":{"kind":"Variable","name":{"kind":"Name","value":"webhook"}}}]}]}}]} as unknown as DocumentNode<CreateWebhookMutation, CreateWebhookMutationVariables>;
export const UpdateWebhookDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updateWebhook"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"webhook"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"WebhookUpdateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"webhookUpdate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"webhook"},"value":{"kind":"Variable","name":{"kind":"Name","value":"webhook"}}}]}]}}]} as unknown as DocumentNode<UpdateWebhookMutation, UpdateWebhookMutationVariables>;
export const CreateAutomationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateAutomation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ProjectAutomationCreateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"automationMutations"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"create"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageAutomationsRow_Automation"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FunctionRunStatusForSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationRunDetails"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FunctionRunStatusForSummary"}},{"kind":"Field","name":{"kind":"Name","value":"statusMessage"}}]}},{"kind":"Field","name":{"kind":"Name","value":"trigger"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"VersionCreatedTrigger"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"version"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"model"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageAutomationsRow_Automation"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Automation"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"isTestAutomation"}},{"kind":"Field","name":{"kind":"Name","value":"currentRevision"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"triggerDefinitions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"VersionCreatedTriggerDefinition"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"model"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"runs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"10"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationRunDetails"}}]}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}}]}}]}}]} as unknown as DocumentNode<CreateAutomationMutation, CreateAutomationMutationVariables>;
export const UpdateAutomationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateAutomation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ProjectAutomationUpdateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"automationMutations"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"update"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}}]}}]}}]}}]}}]} as unknown as DocumentNode<UpdateAutomationMutation, UpdateAutomationMutationVariables>;
export const CreateAutomationRevisionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateAutomationRevision"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ProjectAutomationRevisionCreateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"automationMutations"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createRevision"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]}}]} as unknown as DocumentNode<CreateAutomationRevisionMutation, CreateAutomationRevisionMutationVariables>;
export const TriggerAutomationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"TriggerAutomation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"automationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"automationMutations"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"trigger"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"automationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"automationId"}}}]}]}}]}}]}}]} as unknown as DocumentNode<TriggerAutomationMutation, TriggerAutomationMutationVariables>;
export const CreateTestAutomationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateTestAutomation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ProjectTestAutomationCreateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"automationMutations"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createTestAutomation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageAutomationsRow_Automation"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FunctionRunStatusForSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationRunDetails"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FunctionRunStatusForSummary"}},{"kind":"Field","name":{"kind":"Name","value":"statusMessage"}}]}},{"kind":"Field","name":{"kind":"Name","value":"trigger"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"VersionCreatedTrigger"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"version"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"model"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageAutomationsRow_Automation"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Automation"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"isTestAutomation"}},{"kind":"Field","name":{"kind":"Name","value":"currentRevision"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"triggerDefinitions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"VersionCreatedTriggerDefinition"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"model"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"runs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"10"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationRunDetails"}}]}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}}]}}]}}]} as unknown as DocumentNode<CreateTestAutomationMutation, CreateTestAutomationMutationVariables>;
export const ProjectAccessCheckDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectAccessCheck"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<ProjectAccessCheckQuery, ProjectAccessCheckQueryVariables>;
export const ProjectRoleCheckDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectRoleCheck"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]}}]} as unknown as DocumentNode<ProjectRoleCheckQuery, ProjectRoleCheckQueryVariables>;
export const ProjectsDashboardQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectsDashboardQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"UserProjectsFilter"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"projects"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"6"}},{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectDashboardItem"}}]}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsInviteBanners"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectsPageTeamDialogManagePermissions_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectsModelPageEmbed_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsPageTeamDialogManagePermissions_Project"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsActions_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsModelPageEmbed_Project"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsCardProject"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsActions_Project"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectDashboardItemNoModels"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsCardProject"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PendingFileUpload"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FileUpload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"modelName"}},{"kind":"Field","name":{"kind":"Name","value":"convertedStatus"}},{"kind":"Field","name":{"kind":"Name","value":"convertedMessage"}},{"kind":"Field","name":{"kind":"Name","value":"uploadDate"}},{"kind":"Field","name":{"kind":"Name","value":"convertedLastUpdate"}},{"kind":"Field","name":{"kind":"Name","value":"fileType"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsCardRenameDialog"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsCardDeleteDialog"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsActions"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FunctionRunStatusForSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TriggeredAutomationsStatusSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automationRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"FunctionRunStatusForSummary"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"results"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"statusMessage"}},{"kind":"Field","name":{"kind":"Name","value":"contextView"}},{"kind":"Field","name":{"kind":"Name","value":"function"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogRunsRows_AutomateRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRun"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialog_TriggeredAutomationsStatus"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automationRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogRunsRows_AutomateRun"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatus_TriggeredAutomationsStatus"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"TriggeredAutomationsStatusSummary"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialog_TriggeredAutomationsStatus"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageLatestItemsModelItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","alias":{"kind":"Name","value":"versionCount"},"name":{"kind":"Name","value":"versions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","alias":{"kind":"Name","value":"commentThreadCount"},"name":{"kind":"Name","value":"commentThreads"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pendingImportedVersions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PendingFileUpload"}}]}},{"kind":"Field","name":{"kind":"Name","value":"previewUrl"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsCardRenameDialog"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsCardDeleteDialog"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsActions"}},{"kind":"Field","name":{"kind":"Name","value":"automationsStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatus_TriggeredAutomationsStatus"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LimitedUserAvatar"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LimitedUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectsInviteBanner"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PendingStreamCollaborator"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"invitedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}}]}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"projectName"}},{"kind":"Field","name":{"kind":"Name","value":"token"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectDashboardItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectDashboardItemNoModels"}},{"kind":"Field","name":{"kind":"Name","value":"models"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"4"}},{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"onlyWithVersions"},"value":{"kind":"BooleanValue","value":true}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageLatestItemsModelItem"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pendingImportedModels"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"4"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PendingFileUpload"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectsInviteBanners"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectInvites"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsInviteBanner"}}]}}]}}]} as unknown as DocumentNode<ProjectsDashboardQueryQuery, ProjectsDashboardQueryQueryVariables>;
export const ProjectPageQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectPageQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"token"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageProject"}}]}},{"kind":"Field","name":{"kind":"Name","value":"projectInvite"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"token"},"value":{"kind":"Variable","name":{"kind":"Name","value":"token"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsInviteBanner"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageProjectHeader"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"allowPublicComments"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LimitedUserAvatar"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LimitedUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectsPageTeamDialogManagePermissions_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageTeamDialog"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"allowPublicComments"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"invitedTeam"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"inviteId"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsPageTeamDialogManagePermissions_Project"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageProject"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","alias":{"kind":"Name","value":"modelCount"},"name":{"kind":"Name","value":"models"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","alias":{"kind":"Name","value":"commentThreadCount"},"name":{"kind":"Name","value":"commentThreads"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageProjectHeader"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageTeamDialog"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectsInviteBanner"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PendingStreamCollaborator"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"invitedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}}]}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"projectName"}},{"kind":"Field","name":{"kind":"Name","value":"token"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<ProjectPageQueryQuery, ProjectPageQueryQueryVariables>;
export const ProjectLatestModelsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectLatestModels"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ProjectModelsFilter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"models"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"NullValue"}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"16"}},{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageLatestItemsModelItem"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pendingImportedModels"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PendingFileUpload"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PendingFileUpload"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FileUpload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"modelName"}},{"kind":"Field","name":{"kind":"Name","value":"convertedStatus"}},{"kind":"Field","name":{"kind":"Name","value":"convertedMessage"}},{"kind":"Field","name":{"kind":"Name","value":"uploadDate"}},{"kind":"Field","name":{"kind":"Name","value":"convertedLastUpdate"}},{"kind":"Field","name":{"kind":"Name","value":"fileType"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsCardRenameDialog"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsCardDeleteDialog"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsActions"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FunctionRunStatusForSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TriggeredAutomationsStatusSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automationRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"FunctionRunStatusForSummary"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"results"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"statusMessage"}},{"kind":"Field","name":{"kind":"Name","value":"contextView"}},{"kind":"Field","name":{"kind":"Name","value":"function"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogRunsRows_AutomateRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRun"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialog_TriggeredAutomationsStatus"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automationRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogRunsRows_AutomateRun"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatus_TriggeredAutomationsStatus"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"TriggeredAutomationsStatusSummary"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialog_TriggeredAutomationsStatus"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageLatestItemsModelItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","alias":{"kind":"Name","value":"versionCount"},"name":{"kind":"Name","value":"versions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","alias":{"kind":"Name","value":"commentThreadCount"},"name":{"kind":"Name","value":"commentThreads"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pendingImportedVersions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PendingFileUpload"}}]}},{"kind":"Field","name":{"kind":"Name","value":"previewUrl"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsCardRenameDialog"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsCardDeleteDialog"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsActions"}},{"kind":"Field","name":{"kind":"Name","value":"automationsStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatus_TriggeredAutomationsStatus"}}]}}]}}]} as unknown as DocumentNode<ProjectLatestModelsQuery, ProjectLatestModelsQueryVariables>;
export const ProjectLatestModelsPaginationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectLatestModelsPagination"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ProjectModelsFilter"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"defaultValue":{"kind":"NullValue"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"models"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"16"}},{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageLatestItemsModelItem"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PendingFileUpload"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FileUpload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"modelName"}},{"kind":"Field","name":{"kind":"Name","value":"convertedStatus"}},{"kind":"Field","name":{"kind":"Name","value":"convertedMessage"}},{"kind":"Field","name":{"kind":"Name","value":"uploadDate"}},{"kind":"Field","name":{"kind":"Name","value":"convertedLastUpdate"}},{"kind":"Field","name":{"kind":"Name","value":"fileType"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsCardRenameDialog"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsCardDeleteDialog"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsActions"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FunctionRunStatusForSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TriggeredAutomationsStatusSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automationRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"FunctionRunStatusForSummary"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"results"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"statusMessage"}},{"kind":"Field","name":{"kind":"Name","value":"contextView"}},{"kind":"Field","name":{"kind":"Name","value":"function"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogRunsRows_AutomateRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRun"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialog_TriggeredAutomationsStatus"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automationRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogRunsRows_AutomateRun"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatus_TriggeredAutomationsStatus"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"TriggeredAutomationsStatusSummary"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialog_TriggeredAutomationsStatus"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageLatestItemsModelItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","alias":{"kind":"Name","value":"versionCount"},"name":{"kind":"Name","value":"versions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","alias":{"kind":"Name","value":"commentThreadCount"},"name":{"kind":"Name","value":"commentThreads"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pendingImportedVersions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PendingFileUpload"}}]}},{"kind":"Field","name":{"kind":"Name","value":"previewUrl"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsCardRenameDialog"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsCardDeleteDialog"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsActions"}},{"kind":"Field","name":{"kind":"Name","value":"automationsStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatus_TriggeredAutomationsStatus"}}]}}]}}]} as unknown as DocumentNode<ProjectLatestModelsPaginationQuery, ProjectLatestModelsPaginationQueryVariables>;
export const ProjectModelsTreeTopLevelDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectModelsTreeTopLevel"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ProjectModelsTreeFilter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"modelsTree"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"NullValue"}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"8"}},{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SingleLevelModelTreeItem"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pendingImportedModels"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PendingFileUpload"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PendingFileUpload"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FileUpload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"modelName"}},{"kind":"Field","name":{"kind":"Name","value":"convertedStatus"}},{"kind":"Field","name":{"kind":"Name","value":"convertedMessage"}},{"kind":"Field","name":{"kind":"Name","value":"uploadDate"}},{"kind":"Field","name":{"kind":"Name","value":"convertedLastUpdate"}},{"kind":"Field","name":{"kind":"Name","value":"fileType"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsCardRenameDialog"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsCardDeleteDialog"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsActions"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FunctionRunStatusForSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TriggeredAutomationsStatusSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automationRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"FunctionRunStatusForSummary"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"results"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"statusMessage"}},{"kind":"Field","name":{"kind":"Name","value":"contextView"}},{"kind":"Field","name":{"kind":"Name","value":"function"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogRunsRows_AutomateRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRun"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialog_TriggeredAutomationsStatus"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automationRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogRunsRows_AutomateRun"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatus_TriggeredAutomationsStatus"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"TriggeredAutomationsStatusSummary"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialog_TriggeredAutomationsStatus"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageLatestItemsModelItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","alias":{"kind":"Name","value":"versionCount"},"name":{"kind":"Name","value":"versions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","alias":{"kind":"Name","value":"commentThreadCount"},"name":{"kind":"Name","value":"commentThreads"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pendingImportedVersions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PendingFileUpload"}}]}},{"kind":"Field","name":{"kind":"Name","value":"previewUrl"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsCardRenameDialog"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsCardDeleteDialog"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsActions"}},{"kind":"Field","name":{"kind":"Name","value":"automationsStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatus_TriggeredAutomationsStatus"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SingleLevelModelTreeItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ModelsTreeItem"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}},{"kind":"Field","name":{"kind":"Name","value":"model"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageLatestItemsModelItem"}}]}},{"kind":"Field","name":{"kind":"Name","value":"hasChildren"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<ProjectModelsTreeTopLevelQuery, ProjectModelsTreeTopLevelQueryVariables>;
export const ProjectModelsTreeTopLevelPaginationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectModelsTreeTopLevelPagination"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ProjectModelsTreeFilter"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"defaultValue":{"kind":"NullValue"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"modelsTree"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"8"}},{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SingleLevelModelTreeItem"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PendingFileUpload"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FileUpload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"modelName"}},{"kind":"Field","name":{"kind":"Name","value":"convertedStatus"}},{"kind":"Field","name":{"kind":"Name","value":"convertedMessage"}},{"kind":"Field","name":{"kind":"Name","value":"uploadDate"}},{"kind":"Field","name":{"kind":"Name","value":"convertedLastUpdate"}},{"kind":"Field","name":{"kind":"Name","value":"fileType"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsCardRenameDialog"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsCardDeleteDialog"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsActions"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FunctionRunStatusForSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TriggeredAutomationsStatusSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automationRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"FunctionRunStatusForSummary"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"results"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"statusMessage"}},{"kind":"Field","name":{"kind":"Name","value":"contextView"}},{"kind":"Field","name":{"kind":"Name","value":"function"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogRunsRows_AutomateRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRun"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialog_TriggeredAutomationsStatus"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automationRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogRunsRows_AutomateRun"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatus_TriggeredAutomationsStatus"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"TriggeredAutomationsStatusSummary"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialog_TriggeredAutomationsStatus"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageLatestItemsModelItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","alias":{"kind":"Name","value":"versionCount"},"name":{"kind":"Name","value":"versions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","alias":{"kind":"Name","value":"commentThreadCount"},"name":{"kind":"Name","value":"commentThreads"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pendingImportedVersions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PendingFileUpload"}}]}},{"kind":"Field","name":{"kind":"Name","value":"previewUrl"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsCardRenameDialog"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsCardDeleteDialog"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsActions"}},{"kind":"Field","name":{"kind":"Name","value":"automationsStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatus_TriggeredAutomationsStatus"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SingleLevelModelTreeItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ModelsTreeItem"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}},{"kind":"Field","name":{"kind":"Name","value":"model"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageLatestItemsModelItem"}}]}},{"kind":"Field","name":{"kind":"Name","value":"hasChildren"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<ProjectModelsTreeTopLevelPaginationQuery, ProjectModelsTreeTopLevelPaginationQueryVariables>;
export const ProjectModelChildrenTreeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectModelChildrenTree"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"parentName"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"modelChildrenTree"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"fullName"},"value":{"kind":"Variable","name":{"kind":"Name","value":"parentName"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SingleLevelModelTreeItem"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PendingFileUpload"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FileUpload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"modelName"}},{"kind":"Field","name":{"kind":"Name","value":"convertedStatus"}},{"kind":"Field","name":{"kind":"Name","value":"convertedMessage"}},{"kind":"Field","name":{"kind":"Name","value":"uploadDate"}},{"kind":"Field","name":{"kind":"Name","value":"convertedLastUpdate"}},{"kind":"Field","name":{"kind":"Name","value":"fileType"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsCardRenameDialog"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsCardDeleteDialog"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsActions"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FunctionRunStatusForSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TriggeredAutomationsStatusSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automationRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"FunctionRunStatusForSummary"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"results"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"statusMessage"}},{"kind":"Field","name":{"kind":"Name","value":"contextView"}},{"kind":"Field","name":{"kind":"Name","value":"function"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogRunsRows_AutomateRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRun"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialog_TriggeredAutomationsStatus"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automationRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogRunsRows_AutomateRun"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatus_TriggeredAutomationsStatus"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"TriggeredAutomationsStatusSummary"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialog_TriggeredAutomationsStatus"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageLatestItemsModelItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","alias":{"kind":"Name","value":"versionCount"},"name":{"kind":"Name","value":"versions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","alias":{"kind":"Name","value":"commentThreadCount"},"name":{"kind":"Name","value":"commentThreads"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pendingImportedVersions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PendingFileUpload"}}]}},{"kind":"Field","name":{"kind":"Name","value":"previewUrl"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsCardRenameDialog"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsCardDeleteDialog"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsActions"}},{"kind":"Field","name":{"kind":"Name","value":"automationsStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatus_TriggeredAutomationsStatus"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SingleLevelModelTreeItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ModelsTreeItem"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}},{"kind":"Field","name":{"kind":"Name","value":"model"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageLatestItemsModelItem"}}]}},{"kind":"Field","name":{"kind":"Name","value":"hasChildren"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<ProjectModelChildrenTreeQuery, ProjectModelChildrenTreeQueryVariables>;
export const ProjectLatestCommentThreadsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectLatestCommentThreads"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"defaultValue":{"kind":"NullValue"}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ProjectCommentsFilter"}},"defaultValue":{"kind":"NullValue"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"commentThreads"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"8"}},{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageLatestItemsCommentItem"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FormUsersSelectItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LimitedUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageLatestItemsCommentItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Comment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FormUsersSelectItem"}}]}},{"kind":"Field","name":{"kind":"Name","value":"screenshot"}},{"kind":"Field","name":{"kind":"Name","value":"rawText"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"archived"}},{"kind":"Field","alias":{"kind":"Name","value":"repliesCount"},"name":{"kind":"Name","value":"replies"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"replyAuthors"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"4"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FormUsersSelectItem"}}]}}]}}]}}]} as unknown as DocumentNode<ProjectLatestCommentThreadsQuery, ProjectLatestCommentThreadsQueryVariables>;
export const ProjectInviteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectInvite"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"token"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectInvite"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}},{"kind":"Argument","name":{"kind":"Name","value":"token"},"value":{"kind":"Variable","name":{"kind":"Name","value":"token"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsInviteBanner"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LimitedUserAvatar"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LimitedUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectsInviteBanner"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PendingStreamCollaborator"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"invitedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}}]}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"projectName"}},{"kind":"Field","name":{"kind":"Name","value":"token"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<ProjectInviteQuery, ProjectInviteQueryVariables>;
export const ProjectModelCheckDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectModelCheck"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"modelId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"model"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"modelId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<ProjectModelCheckQuery, ProjectModelCheckQueryVariables>;
export const ProjectModelPageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectModelPage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"modelId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"versionsCursor"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectModelPageHeaderProject"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectModelPageVersionsProject"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageProjectHeader"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"allowPublicComments"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PendingFileUpload"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FileUpload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"modelName"}},{"kind":"Field","name":{"kind":"Name","value":"convertedStatus"}},{"kind":"Field","name":{"kind":"Name","value":"convertedMessage"}},{"kind":"Field","name":{"kind":"Name","value":"uploadDate"}},{"kind":"Field","name":{"kind":"Name","value":"convertedLastUpdate"}},{"kind":"Field","name":{"kind":"Name","value":"fileType"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LimitedUserAvatar"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LimitedUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectModelPageDialogDeleteVersion"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Version"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectModelPageDialogMoveToVersion"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Version"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FunctionRunStatusForSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TriggeredAutomationsStatusSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automationRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"FunctionRunStatusForSummary"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"results"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"statusMessage"}},{"kind":"Field","name":{"kind":"Name","value":"contextView"}},{"kind":"Field","name":{"kind":"Name","value":"function"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogRunsRows_AutomateRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRun"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialog_TriggeredAutomationsStatus"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automationRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogRunsRows_AutomateRun"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatus_TriggeredAutomationsStatus"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"TriggeredAutomationsStatusSummary"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialog_TriggeredAutomationsStatus"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectModelPageVersionsCardVersion"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Version"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"authorUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"previewUrl"}},{"kind":"Field","name":{"kind":"Name","value":"sourceApplication"}},{"kind":"Field","alias":{"kind":"Name","value":"commentThreadCount"},"name":{"kind":"Name","value":"commentThreads"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectModelPageDialogDeleteVersion"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectModelPageDialogMoveToVersion"}},{"kind":"Field","name":{"kind":"Name","value":"automationsStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatus_TriggeredAutomationsStatus"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectsPageTeamDialogManagePermissions_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectsModelPageEmbed_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsPageTeamDialogManagePermissions_Project"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectModelPageVersionsPagination"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"model"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"modelId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"versions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"16"}},{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"Variable","name":{"kind":"Name","value":"versionsCursor"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectModelPageVersionsCardVersion"}}]}}]}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsModelPageEmbed_Project"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectModelPageHeaderProject"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"model"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"modelId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectModelPageVersionsProject"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageProjectHeader"}},{"kind":"Field","name":{"kind":"Name","value":"model"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"modelId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"pendingImportedVersions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PendingFileUpload"}}]}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectModelPageVersionsPagination"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsModelPageEmbed_Project"}}]}}]} as unknown as DocumentNode<ProjectModelPageQuery, ProjectModelPageQueryVariables>;
export const ProjectModelVersionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectModelVersions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"modelId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"versionsCursor"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectModelPageVersionsPagination"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LimitedUserAvatar"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LimitedUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectModelPageDialogDeleteVersion"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Version"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectModelPageDialogMoveToVersion"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Version"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FunctionRunStatusForSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TriggeredAutomationsStatusSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automationRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"FunctionRunStatusForSummary"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"results"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"statusMessage"}},{"kind":"Field","name":{"kind":"Name","value":"contextView"}},{"kind":"Field","name":{"kind":"Name","value":"function"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogRunsRows_AutomateRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRun"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialog_TriggeredAutomationsStatus"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automationRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogRunsRows_AutomateRun"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatus_TriggeredAutomationsStatus"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"TriggeredAutomationsStatusSummary"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialog_TriggeredAutomationsStatus"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectModelPageVersionsCardVersion"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Version"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"authorUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"previewUrl"}},{"kind":"Field","name":{"kind":"Name","value":"sourceApplication"}},{"kind":"Field","alias":{"kind":"Name","value":"commentThreadCount"},"name":{"kind":"Name","value":"commentThreads"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectModelPageDialogDeleteVersion"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectModelPageDialogMoveToVersion"}},{"kind":"Field","name":{"kind":"Name","value":"automationsStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatus_TriggeredAutomationsStatus"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectsPageTeamDialogManagePermissions_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectsModelPageEmbed_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsPageTeamDialogManagePermissions_Project"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectModelPageVersionsPagination"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"model"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"modelId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"versions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"16"}},{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"Variable","name":{"kind":"Name","value":"versionsCursor"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectModelPageVersionsCardVersion"}}]}}]}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsModelPageEmbed_Project"}}]}}]} as unknown as DocumentNode<ProjectModelVersionsQuery, ProjectModelVersionsQueryVariables>;
export const ProjectModelsPageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectModelsPage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectModelsPageHeader_Project"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectModelsPageResults_Project"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FormUsersSelectItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LimitedUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectsPageTeamDialogManagePermissions_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectsModelPageEmbed_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsPageTeamDialogManagePermissions_Project"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsActions_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsModelPageEmbed_Project"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsStructureItem_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsActions_Project"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageLatestItemsModels"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","alias":{"kind":"Name","value":"modelCount"},"name":{"kind":"Name","value":"models"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsStructureItem_Project"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectModelsPageHeader_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"sourceApps"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FormUsersSelectItem"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectModelsPageResults_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageLatestItemsModels"}}]}}]} as unknown as DocumentNode<ProjectModelsPageQuery, ProjectModelsPageQueryVariables>;
export const ProjectDiscussionsPageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectDiscussionsPage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectDiscussionsPageHeader_Project"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectDiscussionsPageResults_Project"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectDiscussionsPageHeader_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectDiscussionsPageResults_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]} as unknown as DocumentNode<ProjectDiscussionsPageQuery, ProjectDiscussionsPageQueryVariables>;
export const ProjectAutomationsTabDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectAutomationsTab"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"models"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"automations"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"NullValue"}},{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"NullValue"}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"5"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageAutomationsRow_Automation"}}]}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"FormSelectProjects_Project"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageAutomationsEmptyState_Query"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FunctionRunStatusForSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationRunDetails"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FunctionRunStatusForSummary"}},{"kind":"Field","name":{"kind":"Name","value":"statusMessage"}}]}},{"kind":"Field","name":{"kind":"Name","value":"trigger"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"VersionCreatedTrigger"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"version"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"model"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationsFunctionsCard_AutomateFunction"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunction"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isFeatured"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"repo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"owner"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateAutomationCreateDialogFunctionParametersStep_AutomateFunction"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunction"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"releases"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"inputSchema"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateAutomationCreateDialog_AutomateFunction"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunction"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationsFunctionsCard_AutomateFunction"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateAutomationCreateDialogFunctionParametersStep_AutomateFunction"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageAutomationsRow_Automation"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Automation"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"isTestAutomation"}},{"kind":"Field","name":{"kind":"Name","value":"currentRevision"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"triggerDefinitions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"VersionCreatedTriggerDefinition"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"model"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"runs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"10"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationRunDetails"}}]}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FormSelectProjects_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageAutomationsEmptyState_Query"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Query"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"automateFunctions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"9"}},{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"featuredFunctionsOnly"},"value":{"kind":"BooleanValue","value":true}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationsFunctionsCard_AutomateFunction"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateAutomationCreateDialog_AutomateFunction"}}]}}]}}]}}]} as unknown as DocumentNode<ProjectAutomationsTabQuery, ProjectAutomationsTabQueryVariables>;
export const ProjectAutomationsTabAutomationsPaginationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectAutomationsTabAutomationsPagination"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"defaultValue":{"kind":"NullValue"}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"defaultValue":{"kind":"NullValue"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automations"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}},{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"5"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageAutomationsRow_Automation"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FunctionRunStatusForSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationRunDetails"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FunctionRunStatusForSummary"}},{"kind":"Field","name":{"kind":"Name","value":"statusMessage"}}]}},{"kind":"Field","name":{"kind":"Name","value":"trigger"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"VersionCreatedTrigger"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"version"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"model"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageAutomationsRow_Automation"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Automation"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"isTestAutomation"}},{"kind":"Field","name":{"kind":"Name","value":"currentRevision"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"triggerDefinitions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"VersionCreatedTriggerDefinition"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"model"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"runs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"10"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationRunDetails"}}]}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}}]}}]}}]} as unknown as DocumentNode<ProjectAutomationsTabAutomationsPaginationQuery, ProjectAutomationsTabAutomationsPaginationQueryVariables>;
export const ProjectAutomationPageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectAutomationPage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"automationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageAutomationPage_Project"}},{"kind":"Field","name":{"kind":"Name","value":"automation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"automationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageAutomationPage_Automation"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectsPageTeamDialogManagePermissions_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectsModelPageEmbed_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsPageTeamDialogManagePermissions_Project"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsActions_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsModelPageEmbed_Project"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsCardProject"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsActions_Project"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageAutomationHeader_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsCardProject"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PendingFileUpload"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FileUpload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"modelName"}},{"kind":"Field","name":{"kind":"Name","value":"convertedStatus"}},{"kind":"Field","name":{"kind":"Name","value":"convertedMessage"}},{"kind":"Field","name":{"kind":"Name","value":"uploadDate"}},{"kind":"Field","name":{"kind":"Name","value":"convertedLastUpdate"}},{"kind":"Field","name":{"kind":"Name","value":"fileType"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsCardRenameDialog"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsCardDeleteDialog"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsActions"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FunctionRunStatusForSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TriggeredAutomationsStatusSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automationRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"FunctionRunStatusForSummary"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"results"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"statusMessage"}},{"kind":"Field","name":{"kind":"Name","value":"contextView"}},{"kind":"Field","name":{"kind":"Name","value":"function"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogRunsRows_AutomateRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRun"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialog_TriggeredAutomationsStatus"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automationRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogRunsRows_AutomateRun"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatus_TriggeredAutomationsStatus"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"TriggeredAutomationsStatusSummary"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialog_TriggeredAutomationsStatus"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageLatestItemsModelItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","alias":{"kind":"Name","value":"versionCount"},"name":{"kind":"Name","value":"versions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","alias":{"kind":"Name","value":"commentThreadCount"},"name":{"kind":"Name","value":"commentThreads"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pendingImportedVersions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PendingFileUpload"}}]}},{"kind":"Field","name":{"kind":"Name","value":"previewUrl"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsCardRenameDialog"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsCardDeleteDialog"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsActions"}},{"kind":"Field","name":{"kind":"Name","value":"automationsStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatus_TriggeredAutomationsStatus"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageAutomationHeader_Automation"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Automation"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"isTestAutomation"}},{"kind":"Field","name":{"kind":"Name","value":"currentRevision"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"triggerDefinitions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"VersionCreatedTriggerDefinition"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"model"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageLatestItemsModelItem"}}]}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CommonModelSelectorModel"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageAutomationFunctionSettingsDialog_AutomationRevision"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomationRevision"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"triggerDefinitions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"VersionCreatedTriggerDefinition"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"model"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"CommonModelSelectorModel"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationsFunctionsCard_AutomateFunction"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunction"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isFeatured"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"repo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"owner"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageAutomationFunctionSettingsDialog_AutomationRevisionFunction"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomationRevisionFunction"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"parameters"}},{"kind":"Field","name":{"kind":"Name","value":"release"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"inputSchema"}},{"kind":"Field","name":{"kind":"Name","value":"function"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageAutomationFunctions_Automation"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Automation"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"currentRevision"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageAutomationFunctionSettingsDialog_AutomationRevision"}},{"kind":"Field","name":{"kind":"Name","value":"functions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"release"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"function"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationsFunctionsCard_AutomateFunction"}},{"kind":"Field","name":{"kind":"Name","value":"releases"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageAutomationFunctionSettingsDialog_AutomationRevisionFunction"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationRunDetails"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FunctionRunStatusForSummary"}},{"kind":"Field","name":{"kind":"Name","value":"statusMessage"}}]}},{"kind":"Field","name":{"kind":"Name","value":"trigger"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"VersionCreatedTrigger"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"version"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"model"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageAutomationRuns_Automation"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Automation"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"isTestAutomation"}},{"kind":"Field","name":{"kind":"Name","value":"runs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"10"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationRunDetails"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageAutomationPage_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageAutomationHeader_Project"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageAutomationPage_Automation"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Automation"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageAutomationHeader_Automation"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageAutomationFunctions_Automation"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageAutomationRuns_Automation"}}]}}]} as unknown as DocumentNode<ProjectAutomationPageQuery, ProjectAutomationPageQueryVariables>;
export const ProjectAutomationPagePaginatedRunsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectAutomationPagePaginatedRuns"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"automationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"defaultValue":{"kind":"NullValue"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"automationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"runs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"10"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationRunDetails"}}]}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FunctionRunStatusForSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationRunDetails"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FunctionRunStatusForSummary"}},{"kind":"Field","name":{"kind":"Name","value":"statusMessage"}}]}},{"kind":"Field","name":{"kind":"Name","value":"trigger"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"VersionCreatedTrigger"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"version"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"model"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<ProjectAutomationPagePaginatedRunsQuery, ProjectAutomationPagePaginatedRunsQueryVariables>;
export const ProjectAutomationAccessCheckDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectAutomationAccessCheck"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automations"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}}]}}]} as unknown as DocumentNode<ProjectAutomationAccessCheckQuery, ProjectAutomationAccessCheckQueryVariables>;
export const ProjectWebhooksDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectWebhooks"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"webhooks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"streamId"}},{"kind":"Field","name":{"kind":"Name","value":"triggers"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"history"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"5"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"statusInfo"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}}]}}]} as unknown as DocumentNode<ProjectWebhooksQuery, ProjectWebhooksQueryVariables>;
export const ProjectBlobInfoDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectBlobInfo"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"blobId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"blob"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"blobId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}},{"kind":"Field","name":{"kind":"Name","value":"fileType"}},{"kind":"Field","name":{"kind":"Name","value":"fileSize"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]}}]} as unknown as DocumentNode<ProjectBlobInfoQuery, ProjectBlobInfoQueryVariables>;
export const OnProjectUpdatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"OnProjectUpdated"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectUpdated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"project"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageProject"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectDashboardItemNoModels"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageProjectHeader"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"allowPublicComments"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LimitedUserAvatar"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LimitedUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectsPageTeamDialogManagePermissions_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageTeamDialog"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"allowPublicComments"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"invitedTeam"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"inviteId"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsPageTeamDialogManagePermissions_Project"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectsModelPageEmbed_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsPageTeamDialogManagePermissions_Project"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsActions_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsModelPageEmbed_Project"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsCardProject"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsActions_Project"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageProject"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","alias":{"kind":"Name","value":"modelCount"},"name":{"kind":"Name","value":"models"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","alias":{"kind":"Name","value":"commentThreadCount"},"name":{"kind":"Name","value":"commentThreads"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageProjectHeader"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageTeamDialog"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectDashboardItemNoModels"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsCardProject"}}]}}]} as unknown as DocumentNode<OnProjectUpdatedSubscription, OnProjectUpdatedSubscriptionVariables>;
export const OnProjectModelsUpdateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"OnProjectModelsUpdate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectModelsUpdated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"model"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"versions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"referencedObject"}}]}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageLatestItemsModelItem"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PendingFileUpload"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FileUpload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"modelName"}},{"kind":"Field","name":{"kind":"Name","value":"convertedStatus"}},{"kind":"Field","name":{"kind":"Name","value":"convertedMessage"}},{"kind":"Field","name":{"kind":"Name","value":"uploadDate"}},{"kind":"Field","name":{"kind":"Name","value":"convertedLastUpdate"}},{"kind":"Field","name":{"kind":"Name","value":"fileType"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsCardRenameDialog"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsCardDeleteDialog"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsActions"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FunctionRunStatusForSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TriggeredAutomationsStatusSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automationRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"FunctionRunStatusForSummary"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"results"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"statusMessage"}},{"kind":"Field","name":{"kind":"Name","value":"contextView"}},{"kind":"Field","name":{"kind":"Name","value":"function"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogRunsRows_AutomateRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRun"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialog_TriggeredAutomationsStatus"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automationRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogRunsRows_AutomateRun"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatus_TriggeredAutomationsStatus"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"TriggeredAutomationsStatusSummary"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialog_TriggeredAutomationsStatus"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageLatestItemsModelItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","alias":{"kind":"Name","value":"versionCount"},"name":{"kind":"Name","value":"versions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","alias":{"kind":"Name","value":"commentThreadCount"},"name":{"kind":"Name","value":"commentThreads"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pendingImportedVersions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PendingFileUpload"}}]}},{"kind":"Field","name":{"kind":"Name","value":"previewUrl"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsCardRenameDialog"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsCardDeleteDialog"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsActions"}},{"kind":"Field","name":{"kind":"Name","value":"automationsStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatus_TriggeredAutomationsStatus"}}]}}]}}]} as unknown as DocumentNode<OnProjectModelsUpdateSubscription, OnProjectModelsUpdateSubscriptionVariables>;
export const OnProjectVersionsUpdateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"OnProjectVersionsUpdate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectVersionsUpdated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"modelId"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"version"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ViewerModelVersionCardItem"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectModelPageVersionsCardVersion"}},{"kind":"Field","name":{"kind":"Name","value":"model"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageLatestItemsModelItem"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LimitedUserAvatar"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LimitedUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectModelPageDialogDeleteVersion"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Version"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectModelPageDialogMoveToVersion"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Version"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FunctionRunStatusForSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TriggeredAutomationsStatusSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automationRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"FunctionRunStatusForSummary"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"results"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"statusMessage"}},{"kind":"Field","name":{"kind":"Name","value":"contextView"}},{"kind":"Field","name":{"kind":"Name","value":"function"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogRunsRows_AutomateRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRun"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialog_TriggeredAutomationsStatus"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automationRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogRunsRows_AutomateRun"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatus_TriggeredAutomationsStatus"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"TriggeredAutomationsStatusSummary"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialog_TriggeredAutomationsStatus"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PendingFileUpload"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FileUpload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"modelName"}},{"kind":"Field","name":{"kind":"Name","value":"convertedStatus"}},{"kind":"Field","name":{"kind":"Name","value":"convertedMessage"}},{"kind":"Field","name":{"kind":"Name","value":"uploadDate"}},{"kind":"Field","name":{"kind":"Name","value":"convertedLastUpdate"}},{"kind":"Field","name":{"kind":"Name","value":"fileType"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsCardRenameDialog"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsCardDeleteDialog"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsActions"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ViewerModelVersionCardItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Version"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"referencedObject"}},{"kind":"Field","name":{"kind":"Name","value":"sourceApplication"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"previewUrl"}},{"kind":"Field","name":{"kind":"Name","value":"authorUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectModelPageVersionsCardVersion"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Version"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"authorUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"previewUrl"}},{"kind":"Field","name":{"kind":"Name","value":"sourceApplication"}},{"kind":"Field","alias":{"kind":"Name","value":"commentThreadCount"},"name":{"kind":"Name","value":"commentThreads"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectModelPageDialogDeleteVersion"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectModelPageDialogMoveToVersion"}},{"kind":"Field","name":{"kind":"Name","value":"automationsStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatus_TriggeredAutomationsStatus"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageLatestItemsModelItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","alias":{"kind":"Name","value":"versionCount"},"name":{"kind":"Name","value":"versions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","alias":{"kind":"Name","value":"commentThreadCount"},"name":{"kind":"Name","value":"commentThreads"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pendingImportedVersions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PendingFileUpload"}}]}},{"kind":"Field","name":{"kind":"Name","value":"previewUrl"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsCardRenameDialog"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsCardDeleteDialog"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsActions"}},{"kind":"Field","name":{"kind":"Name","value":"automationsStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatus_TriggeredAutomationsStatus"}}]}}]}}]} as unknown as DocumentNode<OnProjectVersionsUpdateSubscription, OnProjectVersionsUpdateSubscriptionVariables>;
export const OnProjectVersionsPreviewGeneratedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"OnProjectVersionsPreviewGenerated"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectVersionsPreviewGenerated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"objectId"}},{"kind":"Field","name":{"kind":"Name","value":"versionId"}}]}}]}}]} as unknown as DocumentNode<OnProjectVersionsPreviewGeneratedSubscription, OnProjectVersionsPreviewGeneratedSubscriptionVariables>;
export const OnProjectPendingModelsUpdatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"OnProjectPendingModelsUpdated"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectPendingModelsUpdated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"model"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PendingFileUpload"}},{"kind":"Field","name":{"kind":"Name","value":"model"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageLatestItemsModelItem"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PendingFileUpload"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FileUpload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"modelName"}},{"kind":"Field","name":{"kind":"Name","value":"convertedStatus"}},{"kind":"Field","name":{"kind":"Name","value":"convertedMessage"}},{"kind":"Field","name":{"kind":"Name","value":"uploadDate"}},{"kind":"Field","name":{"kind":"Name","value":"convertedLastUpdate"}},{"kind":"Field","name":{"kind":"Name","value":"fileType"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsCardRenameDialog"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsCardDeleteDialog"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsActions"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FunctionRunStatusForSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TriggeredAutomationsStatusSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automationRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"FunctionRunStatusForSummary"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"results"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"statusMessage"}},{"kind":"Field","name":{"kind":"Name","value":"contextView"}},{"kind":"Field","name":{"kind":"Name","value":"function"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogRunsRows_AutomateRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRun"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialog_TriggeredAutomationsStatus"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automationRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogRunsRows_AutomateRun"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatus_TriggeredAutomationsStatus"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"TriggeredAutomationsStatusSummary"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialog_TriggeredAutomationsStatus"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageLatestItemsModelItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","alias":{"kind":"Name","value":"versionCount"},"name":{"kind":"Name","value":"versions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","alias":{"kind":"Name","value":"commentThreadCount"},"name":{"kind":"Name","value":"commentThreads"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pendingImportedVersions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PendingFileUpload"}}]}},{"kind":"Field","name":{"kind":"Name","value":"previewUrl"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsCardRenameDialog"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsCardDeleteDialog"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsActions"}},{"kind":"Field","name":{"kind":"Name","value":"automationsStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatus_TriggeredAutomationsStatus"}}]}}]}}]} as unknown as DocumentNode<OnProjectPendingModelsUpdatedSubscription, OnProjectPendingModelsUpdatedSubscriptionVariables>;
export const OnProjectPendingVersionsUpdatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"OnProjectPendingVersionsUpdated"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectPendingVersionsUpdated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"version"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PendingFileUpload"}},{"kind":"Field","name":{"kind":"Name","value":"model"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageLatestItemsModelItem"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PendingFileUpload"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FileUpload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"modelName"}},{"kind":"Field","name":{"kind":"Name","value":"convertedStatus"}},{"kind":"Field","name":{"kind":"Name","value":"convertedMessage"}},{"kind":"Field","name":{"kind":"Name","value":"uploadDate"}},{"kind":"Field","name":{"kind":"Name","value":"convertedLastUpdate"}},{"kind":"Field","name":{"kind":"Name","value":"fileType"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsCardRenameDialog"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsCardDeleteDialog"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsActions"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FunctionRunStatusForSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TriggeredAutomationsStatusSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automationRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"FunctionRunStatusForSummary"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"results"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"statusMessage"}},{"kind":"Field","name":{"kind":"Name","value":"contextView"}},{"kind":"Field","name":{"kind":"Name","value":"function"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogRunsRows_AutomateRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRun"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialog_TriggeredAutomationsStatus"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automationRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogRunsRows_AutomateRun"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatus_TriggeredAutomationsStatus"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"TriggeredAutomationsStatusSummary"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialog_TriggeredAutomationsStatus"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageLatestItemsModelItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","alias":{"kind":"Name","value":"versionCount"},"name":{"kind":"Name","value":"versions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","alias":{"kind":"Name","value":"commentThreadCount"},"name":{"kind":"Name","value":"commentThreads"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pendingImportedVersions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PendingFileUpload"}}]}},{"kind":"Field","name":{"kind":"Name","value":"previewUrl"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsCardRenameDialog"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsCardDeleteDialog"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsActions"}},{"kind":"Field","name":{"kind":"Name","value":"automationsStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatus_TriggeredAutomationsStatus"}}]}}]}}]} as unknown as DocumentNode<OnProjectPendingVersionsUpdatedSubscription, OnProjectPendingVersionsUpdatedSubscriptionVariables>;
export const OnProjectTriggeredAutomationsStatusUpdatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"OnProjectTriggeredAutomationsStatusUpdated"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectTriggeredAutomationsStatusUpdated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"version"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automationsStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"automationRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateViewerPanel_AutomateRun"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"TriggeredAutomationsStatusSummary"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialog_TriggeredAutomationsStatus"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"model"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"run"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automationId"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationRunDetails"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateViewerPanelFunctionRunRow_AutomateFunctionRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"results"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"statusMessage"}},{"kind":"Field","name":{"kind":"Name","value":"contextView"}},{"kind":"Field","name":{"kind":"Name","value":"function"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FunctionRunStatusForSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"results"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"statusMessage"}},{"kind":"Field","name":{"kind":"Name","value":"contextView"}},{"kind":"Field","name":{"kind":"Name","value":"function"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogRunsRows_AutomateRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRun"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateViewerPanel_AutomateRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateViewerPanelFunctionRunRow_AutomateFunctionRun"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TriggeredAutomationsStatusSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automationRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"FunctionRunStatusForSummary"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialog_TriggeredAutomationsStatus"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automationRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogRunsRows_AutomateRun"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationRunDetails"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FunctionRunStatusForSummary"}},{"kind":"Field","name":{"kind":"Name","value":"statusMessage"}}]}},{"kind":"Field","name":{"kind":"Name","value":"trigger"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"VersionCreatedTrigger"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"version"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"model"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<OnProjectTriggeredAutomationsStatusUpdatedSubscription, OnProjectTriggeredAutomationsStatusUpdatedSubscriptionVariables>;
export const OnProjectAutomationsUpdatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"OnProjectAutomationsUpdated"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectAutomationsUpdated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"automationId"}},{"kind":"Field","name":{"kind":"Name","value":"automation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageAutomationPage_Automation"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageAutomationsRow_Automation"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PendingFileUpload"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FileUpload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"modelName"}},{"kind":"Field","name":{"kind":"Name","value":"convertedStatus"}},{"kind":"Field","name":{"kind":"Name","value":"convertedMessage"}},{"kind":"Field","name":{"kind":"Name","value":"uploadDate"}},{"kind":"Field","name":{"kind":"Name","value":"convertedLastUpdate"}},{"kind":"Field","name":{"kind":"Name","value":"fileType"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsCardRenameDialog"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsCardDeleteDialog"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsActions"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FunctionRunStatusForSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TriggeredAutomationsStatusSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automationRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"FunctionRunStatusForSummary"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"results"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"statusMessage"}},{"kind":"Field","name":{"kind":"Name","value":"contextView"}},{"kind":"Field","name":{"kind":"Name","value":"function"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogRunsRows_AutomateRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRun"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialog_TriggeredAutomationsStatus"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automationRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialogRunsRows_AutomateRun"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateRunsTriggerStatus_TriggeredAutomationsStatus"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TriggeredAutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"TriggeredAutomationsStatusSummary"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatusDialog_TriggeredAutomationsStatus"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageLatestItemsModelItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","alias":{"kind":"Name","value":"versionCount"},"name":{"kind":"Name","value":"versions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","alias":{"kind":"Name","value":"commentThreadCount"},"name":{"kind":"Name","value":"commentThreads"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pendingImportedVersions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PendingFileUpload"}}]}},{"kind":"Field","name":{"kind":"Name","value":"previewUrl"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsCardRenameDialog"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsCardDeleteDialog"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsActions"}},{"kind":"Field","name":{"kind":"Name","value":"automationsStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateRunsTriggerStatus_TriggeredAutomationsStatus"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageAutomationHeader_Automation"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Automation"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"isTestAutomation"}},{"kind":"Field","name":{"kind":"Name","value":"currentRevision"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"triggerDefinitions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"VersionCreatedTriggerDefinition"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"model"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageLatestItemsModelItem"}}]}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CommonModelSelectorModel"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageAutomationFunctionSettingsDialog_AutomationRevision"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomationRevision"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"triggerDefinitions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"VersionCreatedTriggerDefinition"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"model"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"CommonModelSelectorModel"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationsFunctionsCard_AutomateFunction"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunction"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isFeatured"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"repo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"owner"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageAutomationFunctionSettingsDialog_AutomationRevisionFunction"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomationRevisionFunction"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"parameters"}},{"kind":"Field","name":{"kind":"Name","value":"release"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"inputSchema"}},{"kind":"Field","name":{"kind":"Name","value":"function"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageAutomationFunctions_Automation"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Automation"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"currentRevision"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageAutomationFunctionSettingsDialog_AutomationRevision"}},{"kind":"Field","name":{"kind":"Name","value":"functions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"release"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"function"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationsFunctionsCard_AutomateFunction"}},{"kind":"Field","name":{"kind":"Name","value":"releases"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageAutomationFunctionSettingsDialog_AutomationRevisionFunction"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationRunDetails"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FunctionRunStatusForSummary"}},{"kind":"Field","name":{"kind":"Name","value":"statusMessage"}}]}},{"kind":"Field","name":{"kind":"Name","value":"trigger"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"VersionCreatedTrigger"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"version"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"model"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageAutomationRuns_Automation"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Automation"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"isTestAutomation"}},{"kind":"Field","name":{"kind":"Name","value":"runs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"10"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationRunDetails"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageAutomationPage_Automation"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Automation"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageAutomationHeader_Automation"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageAutomationFunctions_Automation"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageAutomationRuns_Automation"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageAutomationsRow_Automation"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Automation"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"isTestAutomation"}},{"kind":"Field","name":{"kind":"Name","value":"currentRevision"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"triggerDefinitions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"VersionCreatedTriggerDefinition"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"model"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"runs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"10"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationRunDetails"}}]}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}}]}}]}}]} as unknown as DocumentNode<OnProjectAutomationsUpdatedSubscription, OnProjectAutomationsUpdatedSubscriptionVariables>;
export const ServerInfoUpdateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ServerInfoUpdate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"info"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ServerInfoUpdateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"serverInfoUpdate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"info"},"value":{"kind":"Variable","name":{"kind":"Name","value":"info"}}}]}]}}]} as unknown as DocumentNode<ServerInfoUpdateMutation, ServerInfoUpdateMutationVariables>;
export const AdminPanelDeleteUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminPanelDeleteUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userConfirmation"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UserDeleteInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminDeleteUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userConfirmation"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userConfirmation"}}}]}]}}]} as unknown as DocumentNode<AdminPanelDeleteUserMutation, AdminPanelDeleteUserMutationVariables>;
export const AdminPanelDeleteProjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminPanelDeleteProject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ids"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"batchDelete"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"ids"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ids"}}}]}]}}]}}]} as unknown as DocumentNode<AdminPanelDeleteProjectMutation, AdminPanelDeleteProjectMutationVariables>;
export const AdminPanelResendInviteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminPanelResendInvite"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"inviteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"inviteResend"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"inviteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"inviteId"}}}]}]}}]} as unknown as DocumentNode<AdminPanelResendInviteMutation, AdminPanelResendInviteMutationVariables>;
export const AdminPanelDeleteInviteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminPanelDeleteInvite"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"inviteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"inviteDelete"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"inviteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"inviteId"}}}]}]}}]} as unknown as DocumentNode<AdminPanelDeleteInviteMutation, AdminPanelDeleteInviteMutationVariables>;
export const AdminChangeUseRoleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminChangeUseRole"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userRoleInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UserRoleInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userRoleChange"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userRoleInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userRoleInput"}}}]}]}}]} as unknown as DocumentNode<AdminChangeUseRoleMutation, AdminChangeUseRoleMutationVariables>;
export const ServerManagementDataPageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ServerManagementDataPage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"admin"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userList"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"projectList"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"inviteList"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"serverInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"version"}}]}}]}}]} as unknown as DocumentNode<ServerManagementDataPageQuery, ServerManagementDataPageQueryVariables>;
export const ServerSettingsDialogDataDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ServerSettingsDialogData"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"serverInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"adminContact"}},{"kind":"Field","name":{"kind":"Name","value":"company"}},{"kind":"Field","name":{"kind":"Name","value":"termsOfService"}},{"kind":"Field","name":{"kind":"Name","value":"inviteOnly"}},{"kind":"Field","name":{"kind":"Name","value":"guestModeEnabled"}}]}}]}}]} as unknown as DocumentNode<ServerSettingsDialogDataQuery, ServerSettingsDialogDataQueryVariables>;
export const AdminPanelUsersListDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminPanelUsersList"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"query"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"admin"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userList"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}}},{"kind":"Argument","name":{"kind":"Name","value":"query"},"value":{"kind":"Variable","name":{"kind":"Name","value":"query"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"verified"}},{"kind":"Field","name":{"kind":"Name","value":"company"}}]}}]}}]}}]}}]} as unknown as DocumentNode<AdminPanelUsersListQuery, AdminPanelUsersListQueryVariables>;
export const AdminPanelProjectsListDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminPanelProjectsList"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"query"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"visibility"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"admin"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectList"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"query"},"value":{"kind":"Variable","name":{"kind":"Name","value":"query"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"visibility"},"value":{"kind":"Variable","name":{"kind":"Name","value":"visibility"}}},{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"models"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"versions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}}]}}]}}]}}]} as unknown as DocumentNode<AdminPanelProjectsListQuery, AdminPanelProjectsListQueryVariables>;
export const AdminPanelInvitesListDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminPanelInvitesList"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"query"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"admin"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"inviteList"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}}},{"kind":"Argument","name":{"kind":"Name","value":"query"},"value":{"kind":"Variable","name":{"kind":"Name","value":"query"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"invitedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}}]}}]} as unknown as DocumentNode<AdminPanelInvitesListQuery, AdminPanelInvitesListQueryVariables>;
export const InviteServerUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"InviteServerUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ServerInviteCreateInput"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"serverInviteBatchCreate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<InviteServerUserMutation, InviteServerUserMutationVariables>;
export const UpdateUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UserUpdateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeUserMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"update"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"user"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"bio"}},{"kind":"Field","name":{"kind":"Name","value":"company"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateUserMutation, UpdateUserMutationVariables>;
export const UpdateNotificationPreferencesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateNotificationPreferences"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"JSONObject"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userNotificationPreferencesUpdate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"preferences"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<UpdateNotificationPreferencesMutation, UpdateNotificationPreferencesMutationVariables>;
export const DeleteAccountDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteAccount"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UserDeleteInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userDelete"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userConfirmation"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<DeleteAccountMutation, DeleteAccountMutationVariables>;
export const ProfileEditDialogDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProfileEditDialog"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserProfileEditDialogBio_User"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserProfileEditDialogNotificationPreferences_User"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserProfileEditDialogDeleteAccount_User"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ActiveUserAvatar"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserProfileEditDialogAvatar_User"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ActiveUserAvatar"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserProfileEditDialogBio_User"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"company"}},{"kind":"Field","name":{"kind":"Name","value":"bio"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserProfileEditDialogAvatar_User"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserProfileEditDialogNotificationPreferences_User"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"notificationPreferences"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserProfileEditDialogDeleteAccount_User"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]} as unknown as DocumentNode<ProfileEditDialogQuery, ProfileEditDialogQueryVariables>;
export const BroadcastViewerUserActivityDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"BroadcastViewerUserActivity"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"resourceIdString"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"message"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ViewerUserActivityMessageInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"broadcastViewerUserActivity"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}},{"kind":"Argument","name":{"kind":"Name","value":"resourceIdString"},"value":{"kind":"Variable","name":{"kind":"Name","value":"resourceIdString"}}},{"kind":"Argument","name":{"kind":"Name","value":"message"},"value":{"kind":"Variable","name":{"kind":"Name","value":"message"}}}]}]}}]} as unknown as DocumentNode<BroadcastViewerUserActivityMutation, BroadcastViewerUserActivityMutationVariables>;
export const MarkCommentViewedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MarkCommentViewed"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"threadId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"commentMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markViewed"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"commentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"threadId"}}}]}]}}]}}]} as unknown as DocumentNode<MarkCommentViewedMutation, MarkCommentViewedMutationVariables>;
export const CreateCommentThreadDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateCommentThread"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateCommentInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"commentMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"create"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ViewerCommentThread"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LimitedUserAvatar"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LimitedUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ThreadCommentAttachment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Comment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"text"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"attachments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}},{"kind":"Field","name":{"kind":"Name","value":"fileType"}},{"kind":"Field","name":{"kind":"Name","value":"fileSize"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ViewerCommentsReplyItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Comment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"archived"}},{"kind":"Field","name":{"kind":"Name","value":"rawText"}},{"kind":"Field","name":{"kind":"Name","value":"text"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"doc"}}]}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ThreadCommentAttachment"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FormUsersSelectItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LimitedUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ViewerCommentsListItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Comment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"rawText"}},{"kind":"Field","name":{"kind":"Name","value":"archived"}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"viewedAt"}},{"kind":"Field","name":{"kind":"Name","value":"replies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ViewerCommentsReplyItem"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"replyAuthors"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"4"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FormUsersSelectItem"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"resources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resourceId"}},{"kind":"Field","name":{"kind":"Name","value":"resourceType"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ViewerCommentBubblesData"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Comment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"viewedAt"}},{"kind":"Field","name":{"kind":"Name","value":"viewerState"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ViewerCommentThread"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Comment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ViewerCommentsListItem"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ViewerCommentBubblesData"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ViewerCommentsReplyItem"}}]}}]} as unknown as DocumentNode<CreateCommentThreadMutation, CreateCommentThreadMutationVariables>;
export const CreateCommentReplyDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateCommentReply"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateCommentReplyInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"commentMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"reply"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ViewerCommentsReplyItem"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LimitedUserAvatar"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LimitedUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ThreadCommentAttachment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Comment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"text"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"attachments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}},{"kind":"Field","name":{"kind":"Name","value":"fileType"}},{"kind":"Field","name":{"kind":"Name","value":"fileSize"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ViewerCommentsReplyItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Comment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"archived"}},{"kind":"Field","name":{"kind":"Name","value":"rawText"}},{"kind":"Field","name":{"kind":"Name","value":"text"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"doc"}}]}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ThreadCommentAttachment"}}]}}]} as unknown as DocumentNode<CreateCommentReplyMutation, CreateCommentReplyMutationVariables>;
export const ArchiveCommentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ArchiveComment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"commentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"archived"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"commentMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"archive"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"commentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"commentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"archived"},"value":{"kind":"Variable","name":{"kind":"Name","value":"archived"}}}]}]}}]}}]} as unknown as DocumentNode<ArchiveCommentMutation, ArchiveCommentMutationVariables>;
export const ProjectViewerResourcesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectViewerResources"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"resourceUrlString"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"viewerResources"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"resourceIdString"},"value":{"kind":"Variable","name":{"kind":"Name","value":"resourceUrlString"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"identifier"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"modelId"}},{"kind":"Field","name":{"kind":"Name","value":"versionId"}},{"kind":"Field","name":{"kind":"Name","value":"objectId"}}]}}]}}]}}]}}]} as unknown as DocumentNode<ProjectViewerResourcesQuery, ProjectViewerResourcesQueryVariables>;
export const ViewerLoadedResourcesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ViewerLoadedResources"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"modelIds"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"versionIds"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"allowPublicComments"}},{"kind":"Field","name":{"kind":"Name","value":"models"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"ids"},"value":{"kind":"Variable","name":{"kind":"Name","value":"modelIds"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","alias":{"kind":"Name","value":"loadedVersion"},"name":{"kind":"Name","value":"versions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"priorityIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"versionIds"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"priorityIdsOnly"},"value":{"kind":"BooleanValue","value":true}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ViewerModelVersionCardItem"}},{"kind":"Field","name":{"kind":"Name","value":"automationsStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automationRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateViewerPanel_AutomateRun"}}]}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"versions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"5"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ViewerModelVersionCardItem"}}]}}]}}]}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageLatestItemsModels"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ModelPageProject"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"HeaderNavShare_Project"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LimitedUserAvatar"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LimitedUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateViewerPanelFunctionRunRow_AutomateFunctionRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"results"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"statusMessage"}},{"kind":"Field","name":{"kind":"Name","value":"contextView"}},{"kind":"Field","name":{"kind":"Name","value":"function"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectsPageTeamDialogManagePermissions_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectsModelPageEmbed_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsPageTeamDialogManagePermissions_Project"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsActions_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsModelPageEmbed_Project"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsStructureItem_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsActions_Project"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ViewerModelVersionCardItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Version"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"referencedObject"}},{"kind":"Field","name":{"kind":"Name","value":"sourceApplication"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"previewUrl"}},{"kind":"Field","name":{"kind":"Name","value":"authorUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateViewerPanel_AutomateRun"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateViewerPanelFunctionRunRow_AutomateFunctionRun"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationsStatusOrderedRuns_AutomationRun"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageLatestItemsModels"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","alias":{"kind":"Name","value":"modelCount"},"name":{"kind":"Name","value":"models"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsStructureItem_Project"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ModelPageProject"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"HeaderNavShare_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsModelPageEmbed_Project"}}]}}]} as unknown as DocumentNode<ViewerLoadedResourcesQuery, ViewerLoadedResourcesQueryVariables>;
export const ViewerModelVersionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ViewerModelVersions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"modelId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"versionsCursor"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"model"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"modelId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"versions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"Variable","name":{"kind":"Name","value":"versionsCursor"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"5"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ViewerModelVersionCardItem"}}]}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LimitedUserAvatar"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LimitedUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ViewerModelVersionCardItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Version"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"referencedObject"}},{"kind":"Field","name":{"kind":"Name","value":"sourceApplication"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"previewUrl"}},{"kind":"Field","name":{"kind":"Name","value":"authorUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}}]}}]}}]} as unknown as DocumentNode<ViewerModelVersionsQuery, ViewerModelVersionsQueryVariables>;
export const ViewerDiffVersionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ViewerDiffVersions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"modelId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"versionAId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"versionBId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"model"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"modelId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","alias":{"kind":"Name","value":"versionA"},"name":{"kind":"Name","value":"version"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"versionAId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ViewerModelVersionCardItem"}}]}},{"kind":"Field","alias":{"kind":"Name","value":"versionB"},"name":{"kind":"Name","value":"version"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"versionBId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ViewerModelVersionCardItem"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LimitedUserAvatar"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LimitedUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ViewerModelVersionCardItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Version"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"referencedObject"}},{"kind":"Field","name":{"kind":"Name","value":"sourceApplication"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"previewUrl"}},{"kind":"Field","name":{"kind":"Name","value":"authorUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}}]}}]}}]} as unknown as DocumentNode<ViewerDiffVersionsQuery, ViewerDiffVersionsQueryVariables>;
export const ViewerLoadedThreadsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ViewerLoadedThreads"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ProjectCommentsFilter"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"25"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"commentThreads"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}},{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"totalArchivedCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ViewerCommentThread"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"LinkableComment"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LimitedUserAvatar"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LimitedUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ThreadCommentAttachment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Comment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"text"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"attachments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}},{"kind":"Field","name":{"kind":"Name","value":"fileType"}},{"kind":"Field","name":{"kind":"Name","value":"fileSize"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ViewerCommentsReplyItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Comment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"archived"}},{"kind":"Field","name":{"kind":"Name","value":"rawText"}},{"kind":"Field","name":{"kind":"Name","value":"text"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"doc"}}]}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ThreadCommentAttachment"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FormUsersSelectItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LimitedUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ViewerCommentsListItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Comment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"rawText"}},{"kind":"Field","name":{"kind":"Name","value":"archived"}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"viewedAt"}},{"kind":"Field","name":{"kind":"Name","value":"replies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ViewerCommentsReplyItem"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"replyAuthors"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"4"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FormUsersSelectItem"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"resources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resourceId"}},{"kind":"Field","name":{"kind":"Name","value":"resourceType"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ViewerCommentBubblesData"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Comment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"viewedAt"}},{"kind":"Field","name":{"kind":"Name","value":"viewerState"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ViewerCommentThread"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Comment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ViewerCommentsListItem"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ViewerCommentBubblesData"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ViewerCommentsReplyItem"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LinkableComment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Comment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"viewerResources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"modelId"}},{"kind":"Field","name":{"kind":"Name","value":"versionId"}},{"kind":"Field","name":{"kind":"Name","value":"objectId"}}]}}]}}]} as unknown as DocumentNode<ViewerLoadedThreadsQuery, ViewerLoadedThreadsQueryVariables>;
export const ViewerRawProjectObjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ViewerRawProjectObject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"objectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"object"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"objectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"data"}}]}}]}}]}}]} as unknown as DocumentNode<ViewerRawProjectObjectQuery, ViewerRawProjectObjectQueryVariables>;
export const OnViewerUserActivityBroadcastedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"OnViewerUserActivityBroadcasted"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"target"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ViewerUpdateTrackingTarget"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sessionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"viewerUserActivityBroadcasted"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"target"},"value":{"kind":"Variable","name":{"kind":"Name","value":"target"}}},{"kind":"Argument","name":{"kind":"Name","value":"sessionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sessionId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userName"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}}]}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"sessionId"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LimitedUserAvatar"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LimitedUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}}]} as unknown as DocumentNode<OnViewerUserActivityBroadcastedSubscription, OnViewerUserActivityBroadcastedSubscriptionVariables>;
export const OnViewerCommentsUpdatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"OnViewerCommentsUpdated"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"target"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ViewerUpdateTrackingTarget"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectCommentsUpdated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"target"},"value":{"kind":"Variable","name":{"kind":"Name","value":"target"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"comment"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ViewerCommentThread"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LimitedUserAvatar"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LimitedUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ThreadCommentAttachment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Comment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"text"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"attachments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}},{"kind":"Field","name":{"kind":"Name","value":"fileType"}},{"kind":"Field","name":{"kind":"Name","value":"fileSize"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ViewerCommentsReplyItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Comment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"archived"}},{"kind":"Field","name":{"kind":"Name","value":"rawText"}},{"kind":"Field","name":{"kind":"Name","value":"text"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"doc"}}]}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ThreadCommentAttachment"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FormUsersSelectItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LimitedUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ViewerCommentsListItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Comment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"rawText"}},{"kind":"Field","name":{"kind":"Name","value":"archived"}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"viewedAt"}},{"kind":"Field","name":{"kind":"Name","value":"replies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ViewerCommentsReplyItem"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"replyAuthors"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"4"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FormUsersSelectItem"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"resources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resourceId"}},{"kind":"Field","name":{"kind":"Name","value":"resourceType"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ViewerCommentBubblesData"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Comment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"viewedAt"}},{"kind":"Field","name":{"kind":"Name","value":"viewerState"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ViewerCommentThread"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Comment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ViewerCommentsListItem"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ViewerCommentBubblesData"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ViewerCommentsReplyItem"}}]}}]} as unknown as DocumentNode<OnViewerCommentsUpdatedSubscription, OnViewerCommentsUpdatedSubscriptionVariables>;
export const LegacyBranchRedirectMetadataDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"LegacyBranchRedirectMetadata"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"branchName"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"modelByName"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"branchName"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<LegacyBranchRedirectMetadataQuery, LegacyBranchRedirectMetadataQueryVariables>;
export const LegacyViewerCommitRedirectMetadataDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"LegacyViewerCommitRedirectMetadata"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"commitId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"version"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"commitId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"model"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]}}]} as unknown as DocumentNode<LegacyViewerCommitRedirectMetadataQuery, LegacyViewerCommitRedirectMetadataQueryVariables>;
export const LegacyViewerStreamRedirectMetadataDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"LegacyViewerStreamRedirectMetadata"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"versions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"model"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<LegacyViewerStreamRedirectMetadataQuery, LegacyViewerStreamRedirectMetadataQueryVariables>;
export const ResolveCommentLinkDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ResolveCommentLink"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"commentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"comment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"commentId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"LinkableComment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LinkableComment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Comment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"viewerResources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"modelId"}},{"kind":"Field","name":{"kind":"Name","value":"versionId"}},{"kind":"Field","name":{"kind":"Name","value":"objectId"}}]}}]}}]} as unknown as DocumentNode<ResolveCommentLinkQuery, ResolveCommentLinkQueryVariables>;
export const AutomateFunctionPageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AutomateFunctionPage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"functionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"automateFunction"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"functionId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateFunctionPage_AutomateFunction"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateFunctionPageHeader_Function"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunction"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"repo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"owner"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"releases"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateFunctionPageParametersDialog_AutomateFunctionRelease"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionRelease"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"inputSchema"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateFunctionPageInfo_AutomateFunction"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunction"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"repo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"owner"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"automationCount"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"releases"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"inputSchema"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"commitId"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateFunctionPageParametersDialog_AutomateFunctionRelease"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationsFunctionsCard_AutomateFunction"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunction"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isFeatured"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"repo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"owner"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateAutomationCreateDialogFunctionParametersStep_AutomateFunction"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunction"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"releases"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"inputSchema"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateAutomationCreateDialog_AutomateFunction"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunction"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationsFunctionsCard_AutomateFunction"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateAutomationCreateDialogFunctionParametersStep_AutomateFunction"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateFunctionPage_AutomateFunction"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunction"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"supportedSourceApps"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateFunctionPageHeader_Function"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateFunctionPageInfo_AutomateFunction"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateAutomationCreateDialog_AutomateFunction"}},{"kind":"Field","name":{"kind":"Name","value":"creator"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<AutomateFunctionPageQuery, AutomateFunctionPageQueryVariables>;
export const AutomateFunctionsPageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AutomateFunctionsPage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"defaultValue":{"kind":"NullValue"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateFunctionsPageItems_Query"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateFunctionsPageHeader_Query"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationsFunctionsCard_AutomateFunction"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunction"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isFeatured"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"repo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"owner"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateAutomationCreateDialogFunctionParametersStep_AutomateFunction"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunction"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"releases"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"inputSchema"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateAutomationCreateDialog_AutomateFunction"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunction"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationsFunctionsCard_AutomateFunction"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateAutomationCreateDialogFunctionParametersStep_AutomateFunction"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateFunctionCreateDialogTemplateStep_AutomateFunctionTemplate"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomateFunctionTemplate"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"url"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateFunctionsPageItems_Query"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Query"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"automateFunctions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"20"}},{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}}]}},{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationsFunctionsCard_AutomateFunction"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateAutomationCreateDialog_AutomateFunction"}}]}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomateFunctionsPageHeader_Query"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Query"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automateInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasAutomateGithubApp"}},{"kind":"Field","name":{"kind":"Name","value":"availableGithubOrgs"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"serverInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"automate"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"availableFunctionTemplates"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomateFunctionCreateDialogTemplateStep_AutomateFunctionTemplate"}}]}}]}}]}}]}}]} as unknown as DocumentNode<AutomateFunctionsPageQuery, AutomateFunctionsPageQueryVariables>;