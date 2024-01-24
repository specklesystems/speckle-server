/* eslint-disable */
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
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
  BigInt: any;
  /** A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
  DateTime: string;
  EmailAddress: any;
  /** The `JSONObject` scalar type represents JSON objects as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSONObject: {};
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

export type AutomationsStatus = {
  __typename?: 'AutomationsStatus';
  automationRuns: Array<AutomationRun>;
  id: Scalars['ID'];
  status: AutomationRunStatus;
  statusMessage?: Maybe<Scalars['String']>;
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
  /** Returns a flat list of all project versions */
  versions: VersionCollection;
  /** Return metadata about resources being requested in the viewer */
  viewerResources: Array<ViewerResourceGroup>;
  visibility: ProjectVisibility;
  webhooks: WebhookCollection;
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

export type ProjectAutomationsStatusUpdatedMessage = {
  __typename?: 'ProjectAutomationsStatusUpdatedMessage';
  model: Model;
  project: Project;
  status: AutomationsStatus;
  version: Version;
};

export type ProjectCollaborator = {
  __typename?: 'ProjectCollaborator';
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

/** Information about this server. */
export type ServerInfo = {
  __typename?: 'ServerInfo';
  adminContact?: Maybe<Scalars['String']>;
  /** The authentication strategies available on this server. */
  authStrategies: Array<AuthStrategy>;
  /** Base URL of Speckle Automate, if set */
  automateUrl?: Maybe<Scalars['String']>;
  blobSizeLimitBytes: Scalars['Int'];
  canonicalUrl?: Maybe<Scalars['String']>;
  company?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  guestModeEnabled: Scalars['Boolean'];
  inviteOnly?: Maybe<Scalars['Boolean']>;
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
  /** Track updates to a specific project */
  projectUpdated: ProjectUpdatedMessage;
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


export type SubscriptionProjectUpdatedArgs = {
  id: Scalars['String'];
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
  authorizedApps?: Maybe<Array<Maybe<ServerAppListItem>>>;
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
  /** All comment threads in this version */
  commentThreads: CommentCollection;
  createdAt: Scalars['DateTime'];
  id: Scalars['ID'];
  message?: Maybe<Scalars['String']>;
  model: Model;
  previewUrl: Scalars['String'];
  referencedObject: Scalars['String'];
  sourceApplication?: Maybe<Scalars['String']>;
};


export type VersionCommentThreadsArgs = {
  cursor?: InputMaybe<Scalars['String']>;
  limit?: Scalars['Int'];
};

export type VersionCollection = {
  __typename?: 'VersionCollection';
  cursor?: Maybe<Scalars['String']>;
  items: Array<Version>;
  totalCount: Scalars['Int'];
};

export type VersionMutations = {
  __typename?: 'VersionMutations';
  delete: Scalars['Boolean'];
  moveToModel: Model;
  update: Version;
};


export type VersionMutationsDeleteArgs = {
  input: DeleteVersionsInput;
};


export type VersionMutationsMoveToModelArgs = {
  input: MoveVersionsInput;
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

export type AuthRegisterPanelServerInfoFragment = { __typename?: 'ServerInfo', inviteOnly?: boolean | null };

export type RegisterPanelServerInviteQueryVariables = Exact<{
  token: Scalars['String'];
}>;


export type RegisterPanelServerInviteQuery = { __typename?: 'Query', serverInviteByToken?: { __typename?: 'ServerInvite', id: string, email: string } | null };

export type ServerTermsOfServicePrivacyPolicyFragmentFragment = { __typename?: 'ServerInfo', termsOfService?: string | null };

export type EmailVerificationBannerStateQueryVariables = Exact<{ [key: string]: never; }>;


export type EmailVerificationBannerStateQuery = { __typename?: 'Query', activeUser?: { __typename?: 'User', id: string, email?: string | null, verified?: boolean | null, hasPendingVerification?: boolean | null } | null };

export type RequestVerificationMutationVariables = Exact<{ [key: string]: never; }>;


export type RequestVerificationMutation = { __typename?: 'Mutation', requestVerification: boolean };

export type AuthStategiesServerInfoFragmentFragment = { __typename?: 'ServerInfo', authStrategies: Array<{ __typename?: 'AuthStrategy', id: string, name: string, url: string }> };

export type CommonModelSelectorModelFragment = { __typename?: 'Model', id: string, name: string };

export type FormSelectProjects_ProjectFragment = { __typename?: 'Project', id: string, name: string };

export type FormUsersSelectItemFragment = { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null };

export type ProjectDiscussionsPageHeader_ProjectFragment = { __typename?: 'Project', id: string, name: string };

export type ProjectDiscussionsPageResults_ProjectFragment = { __typename?: 'Project', id: string };

export type ProjectModelPageHeaderProjectFragment = { __typename?: 'Project', id: string, name: string, model: { __typename?: 'Model', id: string, name: string } };

export type ProjectModelPageVersionsPaginationFragment = { __typename?: 'Project', id: string, visibility: ProjectVisibility, model: { __typename?: 'Model', id: string, versions: { __typename?: 'VersionCollection', cursor?: string | null, totalCount: number, items: Array<{ __typename?: 'Version', id: string, message?: string | null, createdAt: string, previewUrl: string, sourceApplication?: string | null, authorUser?: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } | null, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number }, automationStatus?: { __typename?: 'AutomationsStatus', id: string, status: AutomationRunStatus, statusMessage?: string | null, automationRuns: Array<{ __typename?: 'AutomationRun', id: string, automationId: string, automationName: string, createdAt: string, status: AutomationRunStatus, functionRuns: Array<{ __typename?: 'AutomationFunctionRun', id: string, functionId: string, functionName: string, functionLogo?: string | null, elapsed: number, status: AutomationRunStatus, statusMessage?: string | null, contextView?: string | null, results?: {} | null, resultVersions: Array<{ __typename?: 'Version', id: string, model: { __typename?: 'Model', id: string, name: string } }> }> }> } | null }> } } };

export type ProjectModelPageVersionsProjectFragment = { __typename?: 'Project', id: string, role?: string | null, name: string, description?: string | null, visibility: ProjectVisibility, allowPublicComments: boolean, model: { __typename?: 'Model', id: string, name: string, pendingImportedVersions: Array<{ __typename?: 'FileUpload', id: string, projectId: string, modelName: string, convertedStatus: number, convertedMessage?: string | null, uploadDate: string, convertedLastUpdate: string, fileType: string, fileName: string }>, versions: { __typename?: 'VersionCollection', cursor?: string | null, totalCount: number, items: Array<{ __typename?: 'Version', id: string, message?: string | null, createdAt: string, previewUrl: string, sourceApplication?: string | null, authorUser?: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } | null, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number }, automationStatus?: { __typename?: 'AutomationsStatus', id: string, status: AutomationRunStatus, statusMessage?: string | null, automationRuns: Array<{ __typename?: 'AutomationRun', id: string, automationId: string, automationName: string, createdAt: string, status: AutomationRunStatus, functionRuns: Array<{ __typename?: 'AutomationFunctionRun', id: string, functionId: string, functionName: string, functionLogo?: string | null, elapsed: number, status: AutomationRunStatus, statusMessage?: string | null, contextView?: string | null, results?: {} | null, resultVersions: Array<{ __typename?: 'Version', id: string, model: { __typename?: 'Model', id: string, name: string } }> }> }> } | null }> } } };

export type ProjectModelPageDialogDeleteVersionFragment = { __typename?: 'Version', id: string, message?: string | null };

export type ProjectModelPageDialogEditMessageVersionFragment = { __typename?: 'Version', id: string, message?: string | null };

export type ProjectModelPageDialogMoveToVersionFragment = { __typename?: 'Version', id: string, message?: string | null };

export type ProjectModelPageVersionsCardVersionFragment = { __typename?: 'Version', id: string, message?: string | null, createdAt: string, previewUrl: string, sourceApplication?: string | null, authorUser?: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } | null, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number }, automationStatus?: { __typename?: 'AutomationsStatus', id: string, status: AutomationRunStatus, statusMessage?: string | null, automationRuns: Array<{ __typename?: 'AutomationRun', id: string, automationId: string, automationName: string, createdAt: string, status: AutomationRunStatus, functionRuns: Array<{ __typename?: 'AutomationFunctionRun', id: string, functionId: string, functionName: string, functionLogo?: string | null, elapsed: number, status: AutomationRunStatus, statusMessage?: string | null, contextView?: string | null, results?: {} | null, resultVersions: Array<{ __typename?: 'Version', id: string, model: { __typename?: 'Model', id: string, name: string } }> }> }> } | null };

export type ProjectModelsPageHeader_ProjectFragment = { __typename?: 'Project', id: string, name: string, sourceApps: Array<string>, role?: string | null, team: Array<{ __typename?: 'ProjectCollaborator', user: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } }> };

export type ProjectModelsPageResults_ProjectFragment = { __typename?: 'Project', id: string, role?: string | null, visibility: ProjectVisibility, modelCount: { __typename?: 'ModelCollection', totalCount: number } };

export type ProjectPageProjectHeaderFragment = { __typename?: 'Project', id: string, role?: string | null, name: string, description?: string | null, visibility: ProjectVisibility, allowPublicComments: boolean };

export type ProjectPageLatestItemsCommentsFragment = { __typename?: 'Project', id: string, commentThreadCount: { __typename?: 'ProjectCommentCollection', totalCount: number } };

export type ProjectPageLatestItemsCommentItemFragment = { __typename?: 'Comment', id: string, screenshot?: string | null, rawText: string, createdAt: string, updatedAt: string, archived: boolean, author: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null }, repliesCount: { __typename?: 'CommentCollection', totalCount: number }, replyAuthors: { __typename?: 'CommentReplyAuthorCollection', totalCount: number, items: Array<{ __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null }> } };

export type ProjectPageLatestItemsModelsFragment = { __typename?: 'Project', id: string, role?: string | null, visibility: ProjectVisibility, modelCount: { __typename?: 'ModelCollection', totalCount: number } };

export type ProjectPageModelsActionsFragment = { __typename?: 'Model', id: string, name: string };

export type ProjectPageModelsCardProjectFragment = { __typename?: 'Project', id: string, role?: string | null, visibility: ProjectVisibility };

export type ModelPreviewFragment = { __typename?: 'Model', previewUrl?: string | null };

export type SingleLevelModelTreeItemFragment = { __typename?: 'ModelsTreeItem', id: string, name: string, fullName: string, hasChildren: boolean, updatedAt: string, model?: { __typename?: 'Model', id: string, name: string, displayName: string, previewUrl?: string | null, createdAt: string, updatedAt: string, description?: string | null, versionCount: { __typename?: 'VersionCollection', totalCount: number }, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number }, pendingImportedVersions: Array<{ __typename?: 'FileUpload', id: string, projectId: string, modelName: string, convertedStatus: number, convertedMessage?: string | null, uploadDate: string, convertedLastUpdate: string, fileType: string, fileName: string }>, automationStatus?: { __typename?: 'AutomationsStatus', id: string, status: AutomationRunStatus, statusMessage?: string | null, automationRuns: Array<{ __typename?: 'AutomationRun', id: string, automationId: string, automationName: string, createdAt: string, status: AutomationRunStatus, functionRuns: Array<{ __typename?: 'AutomationFunctionRun', id: string, functionId: string, functionName: string, functionLogo?: string | null, elapsed: number, status: AutomationRunStatus, statusMessage?: string | null, contextView?: string | null, results?: {} | null, resultVersions: Array<{ __typename?: 'Version', id: string, model: { __typename?: 'Model', id: string, name: string } }> }> }> } | null } | null };

export type ModelCardAutomationStatus_AutomationsStatusFragment = { __typename?: 'AutomationsStatus', id: string, status: AutomationRunStatus, statusMessage?: string | null, automationRuns: Array<{ __typename?: 'AutomationRun', id: string, automationId: string, automationName: string, createdAt: string, status: AutomationRunStatus, functionRuns: Array<{ __typename?: 'AutomationFunctionRun', id: string, functionId: string, functionName: string, functionLogo?: string | null, elapsed: number, status: AutomationRunStatus, statusMessage?: string | null, contextView?: string | null, results?: {} | null, resultVersions: Array<{ __typename?: 'Version', id: string, model: { __typename?: 'Model', id: string, name: string } }> }> }> };

export type ModelCardAutomationStatus_ModelFragment = { __typename?: 'Model', id: string, displayName: string, automationStatus?: { __typename?: 'AutomationsStatus', id: string, status: AutomationRunStatus, statusMessage?: string | null, automationRuns: Array<{ __typename?: 'AutomationRun', id: string, automationId: string, automationName: string, createdAt: string, status: AutomationRunStatus, functionRuns: Array<{ __typename?: 'AutomationFunctionRun', id: string, functionId: string, functionName: string, functionLogo?: string | null, elapsed: number, status: AutomationRunStatus, statusMessage?: string | null, contextView?: string | null, results?: {} | null, resultVersions: Array<{ __typename?: 'Version', id: string, model: { __typename?: 'Model', id: string, name: string } }> }> }> } | null };

export type ModelCardAutomationStatus_VersionFragment = { __typename?: 'Version', id: string, automationStatus?: { __typename?: 'AutomationsStatus', id: string, status: AutomationRunStatus, statusMessage?: string | null, automationRuns: Array<{ __typename?: 'AutomationRun', id: string, automationId: string, automationName: string, createdAt: string, status: AutomationRunStatus, functionRuns: Array<{ __typename?: 'AutomationFunctionRun', id: string, functionId: string, functionName: string, functionLogo?: string | null, elapsed: number, status: AutomationRunStatus, statusMessage?: string | null, contextView?: string | null, results?: {} | null, resultVersions: Array<{ __typename?: 'Version', id: string, model: { __typename?: 'Model', id: string, name: string } }> }> }> } | null };

export type ProjectPageModelsCardDeleteDialogFragment = { __typename?: 'Model', id: string, name: string };

export type ProjectPageModelsCardRenameDialogFragment = { __typename?: 'Model', id: string, name: string, description?: string | null };

export type ProjectPageStatsBlockCommentsFragment = { __typename?: 'Project', commentThreadCount: { __typename?: 'ProjectCommentCollection', totalCount: number } };

export type ProjectPageStatsBlockModelsFragment = { __typename?: 'Project', modelCount: { __typename?: 'ModelCollection', totalCount: number } };

export type ProjectPageStatsBlockTeamFragment = { __typename?: 'Project', id: string, role?: string | null, name: string, allowPublicComments: boolean, visibility: ProjectVisibility, team: Array<{ __typename?: 'ProjectCollaborator', role: string, user: { __typename?: 'LimitedUser', role?: string | null, id: string, name: string, avatar?: string | null } }>, invitedTeam?: Array<{ __typename?: 'PendingStreamCollaborator', id: string, title: string, inviteId: string, role: string, user?: { __typename?: 'LimitedUser', role?: string | null, id: string, name: string, avatar?: string | null } | null }> | null };

export type ProjectPageStatsBlockVersionsFragment = { __typename?: 'Project', versionCount: { __typename?: 'VersionCollection', totalCount: number } };

export type ProjectPageTeamDialogFragment = { __typename?: 'Project', id: string, name: string, role?: string | null, allowPublicComments: boolean, visibility: ProjectVisibility, team: Array<{ __typename?: 'ProjectCollaborator', role: string, user: { __typename?: 'LimitedUser', role?: string | null, id: string, name: string, avatar?: string | null } }>, invitedTeam?: Array<{ __typename?: 'PendingStreamCollaborator', id: string, title: string, inviteId: string, role: string, user?: { __typename?: 'LimitedUser', role?: string | null, id: string, name: string, avatar?: string | null } | null }> | null };

export type OnUserProjectsUpdateSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type OnUserProjectsUpdateSubscription = { __typename?: 'Subscription', userProjectsUpdated: { __typename?: 'UserProjectsUpdatedMessage', type: UserProjectsUpdatedMessageType, id: string, project?: { __typename?: 'Project', id: string, name: string, createdAt: string, updatedAt: string, role?: string | null, visibility: ProjectVisibility, models: { __typename?: 'ModelCollection', totalCount: number, items: Array<{ __typename?: 'Model', id: string, name: string, displayName: string, previewUrl?: string | null, createdAt: string, updatedAt: string, description?: string | null, versionCount: { __typename?: 'VersionCollection', totalCount: number }, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number }, pendingImportedVersions: Array<{ __typename?: 'FileUpload', id: string, projectId: string, modelName: string, convertedStatus: number, convertedMessage?: string | null, uploadDate: string, convertedLastUpdate: string, fileType: string, fileName: string }>, automationStatus?: { __typename?: 'AutomationsStatus', id: string, status: AutomationRunStatus, statusMessage?: string | null, automationRuns: Array<{ __typename?: 'AutomationRun', id: string, automationId: string, automationName: string, createdAt: string, status: AutomationRunStatus, functionRuns: Array<{ __typename?: 'AutomationFunctionRun', id: string, functionId: string, functionName: string, functionLogo?: string | null, elapsed: number, status: AutomationRunStatus, statusMessage?: string | null, contextView?: string | null, results?: {} | null, resultVersions: Array<{ __typename?: 'Version', id: string, model: { __typename?: 'Model', id: string, name: string } }> }> }> } | null }> }, pendingImportedModels: Array<{ __typename?: 'FileUpload', id: string, projectId: string, modelName: string, convertedStatus: number, convertedMessage?: string | null, uploadDate: string, convertedLastUpdate: string, fileType: string, fileName: string }>, team: Array<{ __typename?: 'ProjectCollaborator', user: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } }> } | null } };

export type ProjectsDashboardFilledFragment = { __typename?: 'ProjectCollection', items: Array<{ __typename?: 'Project', id: string, name: string, createdAt: string, updatedAt: string, role?: string | null, visibility: ProjectVisibility, models: { __typename?: 'ModelCollection', totalCount: number, items: Array<{ __typename?: 'Model', id: string, name: string, displayName: string, previewUrl?: string | null, createdAt: string, updatedAt: string, description?: string | null, versionCount: { __typename?: 'VersionCollection', totalCount: number }, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number }, pendingImportedVersions: Array<{ __typename?: 'FileUpload', id: string, projectId: string, modelName: string, convertedStatus: number, convertedMessage?: string | null, uploadDate: string, convertedLastUpdate: string, fileType: string, fileName: string }>, automationStatus?: { __typename?: 'AutomationsStatus', id: string, status: AutomationRunStatus, statusMessage?: string | null, automationRuns: Array<{ __typename?: 'AutomationRun', id: string, automationId: string, automationName: string, createdAt: string, status: AutomationRunStatus, functionRuns: Array<{ __typename?: 'AutomationFunctionRun', id: string, functionId: string, functionName: string, functionLogo?: string | null, elapsed: number, status: AutomationRunStatus, statusMessage?: string | null, contextView?: string | null, results?: {} | null, resultVersions: Array<{ __typename?: 'Version', id: string, model: { __typename?: 'Model', id: string, name: string } }> }> }> } | null }> }, pendingImportedModels: Array<{ __typename?: 'FileUpload', id: string, projectId: string, modelName: string, convertedStatus: number, convertedMessage?: string | null, uploadDate: string, convertedLastUpdate: string, fileType: string, fileName: string }>, team: Array<{ __typename?: 'ProjectCollaborator', user: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } }> }> };

export type ProjectsInviteBannerFragment = { __typename?: 'PendingStreamCollaborator', id: string, projectId: string, projectName: string, token?: string | null, invitedBy: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } };

export type ProjectsInviteBannersFragment = { __typename?: 'User', projectInvites: Array<{ __typename?: 'PendingStreamCollaborator', id: string, projectId: string, projectName: string, token?: string | null, invitedBy: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } }> };

export type UserProfileEditDialogAvatar_UserFragment = { __typename?: 'User', id: string, avatar?: string | null, name: string };

export type UserProfileEditDialogBio_UserFragment = { __typename?: 'User', id: string, name: string, company?: string | null, bio?: string | null, avatar?: string | null };

export type UserProfileEditDialogDeleteAccount_UserFragment = { __typename?: 'User', id: string, email?: string | null };

export type UserProfileEditDialogNotificationPreferences_UserFragment = { __typename?: 'User', id: string, notificationPreferences: {} };

export type ModelPageProjectFragment = { __typename?: 'Project', id: string, createdAt: string, name: string, visibility: ProjectVisibility };

export type ThreadCommentAttachmentFragment = { __typename?: 'Comment', text: { __typename?: 'SmartTextEditorValue', attachments?: Array<{ __typename?: 'BlobMetadata', id: string, fileName: string, fileType: string, fileSize?: number | null }> | null } };

export type ViewerCommentsListItemFragment = { __typename?: 'Comment', id: string, rawText: string, archived: boolean, createdAt: string, viewedAt?: string | null, author: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null }, replies: { __typename?: 'CommentCollection', totalCount: number, cursor?: string | null, items: Array<{ __typename?: 'Comment', id: string, archived: boolean, rawText: string, createdAt: string, text: { __typename?: 'SmartTextEditorValue', doc?: {} | null, attachments?: Array<{ __typename?: 'BlobMetadata', id: string, fileName: string, fileType: string, fileSize?: number | null }> | null }, author: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } }> }, replyAuthors: { __typename?: 'CommentReplyAuthorCollection', totalCount: number, items: Array<{ __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null }> }, resources: Array<{ __typename?: 'ResourceIdentifier', resourceId: string, resourceType: ResourceType }> };

export type ViewerModelVersionCardItemFragment = { __typename?: 'Version', id: string, message?: string | null, referencedObject: string, sourceApplication?: string | null, createdAt: string, previewUrl: string, authorUser?: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } | null };

export type ActiveUserMainMetadataQueryVariables = Exact<{ [key: string]: never; }>;


export type ActiveUserMainMetadataQuery = { __typename?: 'Query', activeUser?: { __typename?: 'User', id: string, email?: string | null, company?: string | null, bio?: string | null, name: string, role?: string | null, avatar?: string | null, isOnboardingFinished?: boolean | null, createdAt?: string | null, verified?: boolean | null, notificationPreferences: {} } | null };

export type CreateOnboardingProjectMutationVariables = Exact<{ [key: string]: never; }>;


export type CreateOnboardingProjectMutation = { __typename?: 'Mutation', projectMutations: { __typename?: 'ProjectMutations', createForOnboarding: { __typename?: 'Project', id: string, createdAt: string, role?: string | null, name: string, description?: string | null, visibility: ProjectVisibility, allowPublicComments: boolean, updatedAt: string, models: { __typename?: 'ModelCollection', totalCount: number, items: Array<{ __typename?: 'Model', id: string, name: string, displayName: string, previewUrl?: string | null, createdAt: string, updatedAt: string, description?: string | null, versionCount: { __typename?: 'VersionCollection', totalCount: number }, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number }, pendingImportedVersions: Array<{ __typename?: 'FileUpload', id: string, projectId: string, modelName: string, convertedStatus: number, convertedMessage?: string | null, uploadDate: string, convertedLastUpdate: string, fileType: string, fileName: string }>, automationStatus?: { __typename?: 'AutomationsStatus', id: string, status: AutomationRunStatus, statusMessage?: string | null, automationRuns: Array<{ __typename?: 'AutomationRun', id: string, automationId: string, automationName: string, createdAt: string, status: AutomationRunStatus, functionRuns: Array<{ __typename?: 'AutomationFunctionRun', id: string, functionId: string, functionName: string, functionLogo?: string | null, elapsed: number, status: AutomationRunStatus, statusMessage?: string | null, contextView?: string | null, results?: {} | null, resultVersions: Array<{ __typename?: 'Version', id: string, model: { __typename?: 'Model', id: string, name: string } }> }> }> } | null }> }, pendingImportedModels: Array<{ __typename?: 'FileUpload', id: string, projectId: string, modelName: string, convertedStatus: number, convertedMessage?: string | null, uploadDate: string, convertedLastUpdate: string, fileType: string, fileName: string }>, team: Array<{ __typename?: 'ProjectCollaborator', role: string, user: { __typename?: 'LimitedUser', role?: string | null, id: string, name: string, avatar?: string | null } }>, invitedTeam?: Array<{ __typename?: 'PendingStreamCollaborator', id: string, title: string, inviteId: string, role: string, user?: { __typename?: 'LimitedUser', role?: string | null, id: string, name: string, avatar?: string | null } | null }> | null, versionCount: { __typename?: 'VersionCollection', totalCount: number }, modelCount: { __typename?: 'ModelCollection', totalCount: number }, commentThreadCount: { __typename?: 'ProjectCommentCollection', totalCount: number } } } };

export type FinishOnboardingMutationVariables = Exact<{ [key: string]: never; }>;


export type FinishOnboardingMutation = { __typename?: 'Mutation', activeUserMutations: { __typename?: 'ActiveUserMutations', finishOnboarding: boolean } };

export type RequestVerificationByEmailMutationVariables = Exact<{
  email: Scalars['String'];
}>;


export type RequestVerificationByEmailMutation = { __typename?: 'Mutation', requestVerificationByEmail: boolean };

export type AuthServerInfoQueryVariables = Exact<{ [key: string]: never; }>;


export type AuthServerInfoQuery = { __typename?: 'Query', serverInfo: { __typename?: 'ServerInfo', termsOfService?: string | null, inviteOnly?: boolean | null, authStrategies: Array<{ __typename?: 'AuthStrategy', id: string, name: string, url: string }> } };

export type AuthorizableAppMetadataQueryVariables = Exact<{
  id: Scalars['String'];
}>;


export type AuthorizableAppMetadataQuery = { __typename?: 'Query', app?: { __typename?: 'ServerApp', id: string, name: string, description?: string | null, trustByDefault?: boolean | null, redirectUrl: string, scopes: Array<{ __typename?: 'Scope', name: string, description: string }>, author?: { __typename?: 'AppAuthor', name: string, id: string, avatar?: string | null } | null } | null };

export type OnModelVersionCardAutomationsStatusUpdatedSubscriptionVariables = Exact<{
  projectId: Scalars['String'];
}>;


export type OnModelVersionCardAutomationsStatusUpdatedSubscription = { __typename?: 'Subscription', projectAutomationsStatusUpdated: { __typename?: 'ProjectAutomationsStatusUpdatedMessage', status: { __typename?: 'AutomationsStatus', id: string, status: AutomationRunStatus, statusMessage?: string | null, automationRuns: Array<{ __typename?: 'AutomationRun', id: string, automationId: string, automationName: string, createdAt: string, status: AutomationRunStatus, functionRuns: Array<{ __typename?: 'AutomationFunctionRun', id: string, functionId: string, functionName: string, functionLogo?: string | null, elapsed: number, status: AutomationRunStatus, statusMessage?: string | null, contextView?: string | null, results?: {} | null, resultVersions: Array<{ __typename?: 'Version', id: string, model: { __typename?: 'Model', id: string, name: string } }> }> }> }, version: { __typename?: 'Version', id: string }, model: { __typename?: 'Model', id: string, versions: { __typename?: 'VersionCollection', items: Array<{ __typename?: 'Version', id: string }> } } } };

export type MentionsUserSearchQueryVariables = Exact<{
  query: Scalars['String'];
  emailOnly?: InputMaybe<Scalars['Boolean']>;
}>;


export type MentionsUserSearchQuery = { __typename?: 'Query', userSearch: { __typename?: 'UserSearchResultCollection', items: Array<{ __typename?: 'LimitedUser', id: string, name: string, company?: string | null }> } };

export type UserSearchQueryVariables = Exact<{
  query: Scalars['String'];
  limit?: InputMaybe<Scalars['Int']>;
  cursor?: InputMaybe<Scalars['String']>;
  archived?: InputMaybe<Scalars['Boolean']>;
}>;


export type UserSearchQuery = { __typename?: 'Query', userSearch: { __typename?: 'UserSearchResultCollection', cursor?: string | null, items: Array<{ __typename?: 'LimitedUser', id: string, name: string, bio?: string | null, company?: string | null, avatar?: string | null, verified?: boolean | null, role?: string | null }> } };

export type ServerInfoBlobSizeLimitQueryVariables = Exact<{ [key: string]: never; }>;


export type ServerInfoBlobSizeLimitQuery = { __typename?: 'Query', serverInfo: { __typename?: 'ServerInfo', blobSizeLimitBytes: number } };

export type ServerInfoAllScopesQueryVariables = Exact<{ [key: string]: never; }>;


export type ServerInfoAllScopesQuery = { __typename?: 'Query', serverInfo: { __typename?: 'ServerInfo', scopes: Array<{ __typename?: 'Scope', name: string, description: string }> } };

export type ProjectModelsSelectorValuesQueryVariables = Exact<{
  projectId: Scalars['String'];
  cursor?: InputMaybe<Scalars['String']>;
}>;


export type ProjectModelsSelectorValuesQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, models: { __typename?: 'ModelCollection', cursor?: string | null, totalCount: number, items: Array<{ __typename?: 'Model', id: string, name: string }> } } };

export type MainServerInfoDataQueryVariables = Exact<{ [key: string]: never; }>;


export type MainServerInfoDataQuery = { __typename?: 'Query', serverInfo: { __typename?: 'ServerInfo', adminContact?: string | null, blobSizeLimitBytes: number, canonicalUrl?: string | null, company?: string | null, description?: string | null, guestModeEnabled: boolean, inviteOnly?: boolean | null, name: string, termsOfService?: string | null, version?: string | null, automateUrl?: string | null } };

export type DeleteAccessTokenMutationVariables = Exact<{
  token: Scalars['String'];
}>;


export type DeleteAccessTokenMutation = { __typename?: 'Mutation', apiTokenRevoke: boolean };

export type CreateAccessTokenMutationVariables = Exact<{
  token: ApiTokenCreateInput;
}>;


export type CreateAccessTokenMutation = { __typename?: 'Mutation', apiTokenCreate: string };

export type DeleteApplicationMutationVariables = Exact<{
  appId: Scalars['String'];
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

export type DeveloperSettingsAccessTokensQueryVariables = Exact<{ [key: string]: never; }>;


export type DeveloperSettingsAccessTokensQuery = { __typename?: 'Query', activeUser?: { __typename?: 'User', id: string, apiTokens: Array<{ __typename?: 'ApiToken', id: string, name: string, lastUsed: string, lastChars: string, createdAt: string, scopes: Array<string | null> }> } | null };

export type DeveloperSettingsApplicationsQueryVariables = Exact<{ [key: string]: never; }>;


export type DeveloperSettingsApplicationsQuery = { __typename?: 'Query', activeUser?: { __typename?: 'User', id: string, createdApps?: Array<{ __typename?: 'ServerApp', id: string, secret?: string | null, name: string, description?: string | null, redirectUrl: string, scopes: Array<{ __typename?: 'Scope', name: string, description: string }> }> | null } | null };

export type SearchProjectsQueryVariables = Exact<{
  search?: InputMaybe<Scalars['String']>;
  onlyWithRoles?: InputMaybe<Array<Scalars['String']> | Scalars['String']>;
}>;


export type SearchProjectsQuery = { __typename?: 'Query', activeUser?: { __typename?: 'User', projects: { __typename?: 'ProjectCollection', totalCount: number, items: Array<{ __typename?: 'Project', id: string, name: string }> } } | null };

export type ProjectDashboardItemNoModelsFragment = { __typename?: 'Project', id: string, name: string, createdAt: string, updatedAt: string, role?: string | null, visibility: ProjectVisibility, team: Array<{ __typename?: 'ProjectCollaborator', user: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } }> };

export type ProjectDashboardItemFragment = { __typename?: 'Project', id: string, name: string, createdAt: string, updatedAt: string, role?: string | null, visibility: ProjectVisibility, models: { __typename?: 'ModelCollection', totalCount: number, items: Array<{ __typename?: 'Model', id: string, name: string, displayName: string, previewUrl?: string | null, createdAt: string, updatedAt: string, description?: string | null, versionCount: { __typename?: 'VersionCollection', totalCount: number }, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number }, pendingImportedVersions: Array<{ __typename?: 'FileUpload', id: string, projectId: string, modelName: string, convertedStatus: number, convertedMessage?: string | null, uploadDate: string, convertedLastUpdate: string, fileType: string, fileName: string }>, automationStatus?: { __typename?: 'AutomationsStatus', id: string, status: AutomationRunStatus, statusMessage?: string | null, automationRuns: Array<{ __typename?: 'AutomationRun', id: string, automationId: string, automationName: string, createdAt: string, status: AutomationRunStatus, functionRuns: Array<{ __typename?: 'AutomationFunctionRun', id: string, functionId: string, functionName: string, functionLogo?: string | null, elapsed: number, status: AutomationRunStatus, statusMessage?: string | null, contextView?: string | null, results?: {} | null, resultVersions: Array<{ __typename?: 'Version', id: string, model: { __typename?: 'Model', id: string, name: string } }> }> }> } | null }> }, pendingImportedModels: Array<{ __typename?: 'FileUpload', id: string, projectId: string, modelName: string, convertedStatus: number, convertedMessage?: string | null, uploadDate: string, convertedLastUpdate: string, fileType: string, fileName: string }>, team: Array<{ __typename?: 'ProjectCollaborator', user: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } }> };

export type PendingFileUploadFragment = { __typename?: 'FileUpload', id: string, projectId: string, modelName: string, convertedStatus: number, convertedMessage?: string | null, uploadDate: string, convertedLastUpdate: string, fileType: string, fileName: string };

export type ProjectPageLatestItemsModelItemFragment = { __typename?: 'Model', id: string, name: string, displayName: string, previewUrl?: string | null, createdAt: string, updatedAt: string, description?: string | null, versionCount: { __typename?: 'VersionCollection', totalCount: number }, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number }, pendingImportedVersions: Array<{ __typename?: 'FileUpload', id: string, projectId: string, modelName: string, convertedStatus: number, convertedMessage?: string | null, uploadDate: string, convertedLastUpdate: string, fileType: string, fileName: string }>, automationStatus?: { __typename?: 'AutomationsStatus', id: string, status: AutomationRunStatus, statusMessage?: string | null, automationRuns: Array<{ __typename?: 'AutomationRun', id: string, automationId: string, automationName: string, createdAt: string, status: AutomationRunStatus, functionRuns: Array<{ __typename?: 'AutomationFunctionRun', id: string, functionId: string, functionName: string, functionLogo?: string | null, elapsed: number, status: AutomationRunStatus, statusMessage?: string | null, contextView?: string | null, results?: {} | null, resultVersions: Array<{ __typename?: 'Version', id: string, model: { __typename?: 'Model', id: string, name: string } }> }> }> } | null };

export type ProjectUpdatableMetadataFragment = { __typename?: 'Project', id: string, name: string, description?: string | null, visibility: ProjectVisibility, allowPublicComments: boolean };

export type CreateModelMutationVariables = Exact<{
  input: CreateModelInput;
}>;


export type CreateModelMutation = { __typename?: 'Mutation', modelMutations: { __typename?: 'ModelMutations', create: { __typename?: 'Model', id: string, name: string, displayName: string, previewUrl?: string | null, createdAt: string, updatedAt: string, description?: string | null, versionCount: { __typename?: 'VersionCollection', totalCount: number }, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number }, pendingImportedVersions: Array<{ __typename?: 'FileUpload', id: string, projectId: string, modelName: string, convertedStatus: number, convertedMessage?: string | null, uploadDate: string, convertedLastUpdate: string, fileType: string, fileName: string }>, automationStatus?: { __typename?: 'AutomationsStatus', id: string, status: AutomationRunStatus, statusMessage?: string | null, automationRuns: Array<{ __typename?: 'AutomationRun', id: string, automationId: string, automationName: string, createdAt: string, status: AutomationRunStatus, functionRuns: Array<{ __typename?: 'AutomationFunctionRun', id: string, functionId: string, functionName: string, functionLogo?: string | null, elapsed: number, status: AutomationRunStatus, statusMessage?: string | null, contextView?: string | null, results?: {} | null, resultVersions: Array<{ __typename?: 'Version', id: string, model: { __typename?: 'Model', id: string, name: string } }> }> }> } | null } } };

export type CreateProjectMutationVariables = Exact<{
  input?: InputMaybe<ProjectCreateInput>;
}>;


export type CreateProjectMutation = { __typename?: 'Mutation', projectMutations: { __typename?: 'ProjectMutations', create: { __typename?: 'Project', id: string, createdAt: string, role?: string | null, name: string, description?: string | null, visibility: ProjectVisibility, allowPublicComments: boolean, updatedAt: string, models: { __typename?: 'ModelCollection', totalCount: number, items: Array<{ __typename?: 'Model', id: string, name: string, displayName: string, previewUrl?: string | null, createdAt: string, updatedAt: string, description?: string | null, versionCount: { __typename?: 'VersionCollection', totalCount: number }, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number }, pendingImportedVersions: Array<{ __typename?: 'FileUpload', id: string, projectId: string, modelName: string, convertedStatus: number, convertedMessage?: string | null, uploadDate: string, convertedLastUpdate: string, fileType: string, fileName: string }>, automationStatus?: { __typename?: 'AutomationsStatus', id: string, status: AutomationRunStatus, statusMessage?: string | null, automationRuns: Array<{ __typename?: 'AutomationRun', id: string, automationId: string, automationName: string, createdAt: string, status: AutomationRunStatus, functionRuns: Array<{ __typename?: 'AutomationFunctionRun', id: string, functionId: string, functionName: string, functionLogo?: string | null, elapsed: number, status: AutomationRunStatus, statusMessage?: string | null, contextView?: string | null, results?: {} | null, resultVersions: Array<{ __typename?: 'Version', id: string, model: { __typename?: 'Model', id: string, name: string } }> }> }> } | null }> }, pendingImportedModels: Array<{ __typename?: 'FileUpload', id: string, projectId: string, modelName: string, convertedStatus: number, convertedMessage?: string | null, uploadDate: string, convertedLastUpdate: string, fileType: string, fileName: string }>, team: Array<{ __typename?: 'ProjectCollaborator', role: string, user: { __typename?: 'LimitedUser', role?: string | null, id: string, name: string, avatar?: string | null } }>, invitedTeam?: Array<{ __typename?: 'PendingStreamCollaborator', id: string, title: string, inviteId: string, role: string, user?: { __typename?: 'LimitedUser', role?: string | null, id: string, name: string, avatar?: string | null } | null }> | null, versionCount: { __typename?: 'VersionCollection', totalCount: number }, modelCount: { __typename?: 'ModelCollection', totalCount: number }, commentThreadCount: { __typename?: 'ProjectCommentCollection', totalCount: number } } } };

export type UpdateModelMutationVariables = Exact<{
  input: UpdateModelInput;
}>;


export type UpdateModelMutation = { __typename?: 'Mutation', modelMutations: { __typename?: 'ModelMutations', update: { __typename?: 'Model', id: string, name: string, displayName: string, previewUrl?: string | null, createdAt: string, updatedAt: string, description?: string | null, versionCount: { __typename?: 'VersionCollection', totalCount: number }, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number }, pendingImportedVersions: Array<{ __typename?: 'FileUpload', id: string, projectId: string, modelName: string, convertedStatus: number, convertedMessage?: string | null, uploadDate: string, convertedLastUpdate: string, fileType: string, fileName: string }>, automationStatus?: { __typename?: 'AutomationsStatus', id: string, status: AutomationRunStatus, statusMessage?: string | null, automationRuns: Array<{ __typename?: 'AutomationRun', id: string, automationId: string, automationName: string, createdAt: string, status: AutomationRunStatus, functionRuns: Array<{ __typename?: 'AutomationFunctionRun', id: string, functionId: string, functionName: string, functionLogo?: string | null, elapsed: number, status: AutomationRunStatus, statusMessage?: string | null, contextView?: string | null, results?: {} | null, resultVersions: Array<{ __typename?: 'Version', id: string, model: { __typename?: 'Model', id: string, name: string } }> }> }> } | null } } };

export type DeleteModelMutationVariables = Exact<{
  input: DeleteModelInput;
}>;


export type DeleteModelMutation = { __typename?: 'Mutation', modelMutations: { __typename?: 'ModelMutations', delete: boolean } };

export type UpdateProjectRoleMutationVariables = Exact<{
  input: ProjectUpdateRoleInput;
}>;


export type UpdateProjectRoleMutation = { __typename?: 'Mutation', projectMutations: { __typename?: 'ProjectMutations', updateRole: { __typename?: 'Project', id: string, team: Array<{ __typename?: 'ProjectCollaborator', role: string, user: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } }> } } };

export type InviteProjectUserMutationVariables = Exact<{
  projectId: Scalars['ID'];
  input: Array<ProjectInviteCreateInput> | ProjectInviteCreateInput;
}>;


export type InviteProjectUserMutation = { __typename?: 'Mutation', projectMutations: { __typename?: 'ProjectMutations', invites: { __typename?: 'ProjectInviteMutations', batchCreate: { __typename?: 'Project', id: string, name: string, role?: string | null, allowPublicComments: boolean, visibility: ProjectVisibility, team: Array<{ __typename?: 'ProjectCollaborator', role: string, user: { __typename?: 'LimitedUser', role?: string | null, id: string, name: string, avatar?: string | null } }>, invitedTeam?: Array<{ __typename?: 'PendingStreamCollaborator', id: string, title: string, inviteId: string, role: string, user?: { __typename?: 'LimitedUser', role?: string | null, id: string, name: string, avatar?: string | null } | null }> | null } } } };

export type CancelProjectInviteMutationVariables = Exact<{
  projectId: Scalars['ID'];
  inviteId: Scalars['String'];
}>;


export type CancelProjectInviteMutation = { __typename?: 'Mutation', projectMutations: { __typename?: 'ProjectMutations', invites: { __typename?: 'ProjectInviteMutations', cancel: { __typename?: 'Project', id: string, name: string, role?: string | null, allowPublicComments: boolean, visibility: ProjectVisibility, team: Array<{ __typename?: 'ProjectCollaborator', role: string, user: { __typename?: 'LimitedUser', role?: string | null, id: string, name: string, avatar?: string | null } }>, invitedTeam?: Array<{ __typename?: 'PendingStreamCollaborator', id: string, title: string, inviteId: string, role: string, user?: { __typename?: 'LimitedUser', role?: string | null, id: string, name: string, avatar?: string | null } | null }> | null } } } };

export type UpdateProjectMetadataMutationVariables = Exact<{
  update: ProjectUpdateInput;
}>;


export type UpdateProjectMetadataMutation = { __typename?: 'Mutation', projectMutations: { __typename?: 'ProjectMutations', update: { __typename?: 'Project', id: string, name: string, description?: string | null, visibility: ProjectVisibility, allowPublicComments: boolean } } };

export type DeleteProjectMutationVariables = Exact<{
  id: Scalars['String'];
}>;


export type DeleteProjectMutation = { __typename?: 'Mutation', projectMutations: { __typename?: 'ProjectMutations', delete: boolean } };

export type UseProjectInviteMutationVariables = Exact<{
  input: ProjectInviteUseInput;
}>;


export type UseProjectInviteMutation = { __typename?: 'Mutation', projectMutations: { __typename?: 'ProjectMutations', invites: { __typename?: 'ProjectInviteMutations', use: boolean } } };

export type LeaveProjectMutationVariables = Exact<{
  projectId: Scalars['String'];
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

export type ProjectAccessCheckQueryVariables = Exact<{
  id: Scalars['String'];
}>;


export type ProjectAccessCheckQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string } };

export type ProjectsDashboardQueryQueryVariables = Exact<{
  filter?: InputMaybe<UserProjectsFilter>;
  cursor?: InputMaybe<Scalars['String']>;
}>;


export type ProjectsDashboardQueryQuery = { __typename?: 'Query', activeUser?: { __typename?: 'User', id: string, projects: { __typename?: 'ProjectCollection', cursor?: string | null, totalCount: number, items: Array<{ __typename?: 'Project', id: string, name: string, createdAt: string, updatedAt: string, role?: string | null, visibility: ProjectVisibility, models: { __typename?: 'ModelCollection', totalCount: number, items: Array<{ __typename?: 'Model', id: string, name: string, displayName: string, previewUrl?: string | null, createdAt: string, updatedAt: string, description?: string | null, versionCount: { __typename?: 'VersionCollection', totalCount: number }, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number }, pendingImportedVersions: Array<{ __typename?: 'FileUpload', id: string, projectId: string, modelName: string, convertedStatus: number, convertedMessage?: string | null, uploadDate: string, convertedLastUpdate: string, fileType: string, fileName: string }>, automationStatus?: { __typename?: 'AutomationsStatus', id: string, status: AutomationRunStatus, statusMessage?: string | null, automationRuns: Array<{ __typename?: 'AutomationRun', id: string, automationId: string, automationName: string, createdAt: string, status: AutomationRunStatus, functionRuns: Array<{ __typename?: 'AutomationFunctionRun', id: string, functionId: string, functionName: string, functionLogo?: string | null, elapsed: number, status: AutomationRunStatus, statusMessage?: string | null, contextView?: string | null, results?: {} | null, resultVersions: Array<{ __typename?: 'Version', id: string, model: { __typename?: 'Model', id: string, name: string } }> }> }> } | null }> }, pendingImportedModels: Array<{ __typename?: 'FileUpload', id: string, projectId: string, modelName: string, convertedStatus: number, convertedMessage?: string | null, uploadDate: string, convertedLastUpdate: string, fileType: string, fileName: string }>, team: Array<{ __typename?: 'ProjectCollaborator', user: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } }> }> }, projectInvites: Array<{ __typename?: 'PendingStreamCollaborator', id: string, projectId: string, projectName: string, token?: string | null, invitedBy: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } }> } | null };

export type ProjectPageQueryQueryVariables = Exact<{
  id: Scalars['String'];
  token?: InputMaybe<Scalars['String']>;
}>;


export type ProjectPageQueryQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, createdAt: string, role?: string | null, name: string, description?: string | null, visibility: ProjectVisibility, allowPublicComments: boolean, team: Array<{ __typename?: 'ProjectCollaborator', role: string, user: { __typename?: 'LimitedUser', role?: string | null, id: string, name: string, avatar?: string | null } }>, invitedTeam?: Array<{ __typename?: 'PendingStreamCollaborator', id: string, title: string, inviteId: string, role: string, user?: { __typename?: 'LimitedUser', role?: string | null, id: string, name: string, avatar?: string | null } | null }> | null, versionCount: { __typename?: 'VersionCollection', totalCount: number }, modelCount: { __typename?: 'ModelCollection', totalCount: number }, commentThreadCount: { __typename?: 'ProjectCommentCollection', totalCount: number } }, projectInvite?: { __typename?: 'PendingStreamCollaborator', id: string, projectId: string, projectName: string, token?: string | null, invitedBy: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } } | null };

export type ProjectLatestModelsQueryVariables = Exact<{
  projectId: Scalars['String'];
  filter?: InputMaybe<ProjectModelsFilter>;
}>;


export type ProjectLatestModelsQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, models: { __typename?: 'ModelCollection', totalCount: number, cursor?: string | null, items: Array<{ __typename?: 'Model', id: string, name: string, displayName: string, previewUrl?: string | null, createdAt: string, updatedAt: string, description?: string | null, versionCount: { __typename?: 'VersionCollection', totalCount: number }, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number }, pendingImportedVersions: Array<{ __typename?: 'FileUpload', id: string, projectId: string, modelName: string, convertedStatus: number, convertedMessage?: string | null, uploadDate: string, convertedLastUpdate: string, fileType: string, fileName: string }>, automationStatus?: { __typename?: 'AutomationsStatus', id: string, status: AutomationRunStatus, statusMessage?: string | null, automationRuns: Array<{ __typename?: 'AutomationRun', id: string, automationId: string, automationName: string, createdAt: string, status: AutomationRunStatus, functionRuns: Array<{ __typename?: 'AutomationFunctionRun', id: string, functionId: string, functionName: string, functionLogo?: string | null, elapsed: number, status: AutomationRunStatus, statusMessage?: string | null, contextView?: string | null, results?: {} | null, resultVersions: Array<{ __typename?: 'Version', id: string, model: { __typename?: 'Model', id: string, name: string } }> }> }> } | null }> }, pendingImportedModels: Array<{ __typename?: 'FileUpload', id: string, projectId: string, modelName: string, convertedStatus: number, convertedMessage?: string | null, uploadDate: string, convertedLastUpdate: string, fileType: string, fileName: string }> } };

export type ProjectLatestModelsPaginationQueryVariables = Exact<{
  projectId: Scalars['String'];
  filter?: InputMaybe<ProjectModelsFilter>;
  cursor?: InputMaybe<Scalars['String']>;
}>;


export type ProjectLatestModelsPaginationQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, models: { __typename?: 'ModelCollection', totalCount: number, cursor?: string | null, items: Array<{ __typename?: 'Model', id: string, name: string, displayName: string, previewUrl?: string | null, createdAt: string, updatedAt: string, description?: string | null, versionCount: { __typename?: 'VersionCollection', totalCount: number }, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number }, pendingImportedVersions: Array<{ __typename?: 'FileUpload', id: string, projectId: string, modelName: string, convertedStatus: number, convertedMessage?: string | null, uploadDate: string, convertedLastUpdate: string, fileType: string, fileName: string }>, automationStatus?: { __typename?: 'AutomationsStatus', id: string, status: AutomationRunStatus, statusMessage?: string | null, automationRuns: Array<{ __typename?: 'AutomationRun', id: string, automationId: string, automationName: string, createdAt: string, status: AutomationRunStatus, functionRuns: Array<{ __typename?: 'AutomationFunctionRun', id: string, functionId: string, functionName: string, functionLogo?: string | null, elapsed: number, status: AutomationRunStatus, statusMessage?: string | null, contextView?: string | null, results?: {} | null, resultVersions: Array<{ __typename?: 'Version', id: string, model: { __typename?: 'Model', id: string, name: string } }> }> }> } | null }> } } };

export type ProjectModelsTreeTopLevelQueryVariables = Exact<{
  projectId: Scalars['String'];
  filter?: InputMaybe<ProjectModelsTreeFilter>;
}>;


export type ProjectModelsTreeTopLevelQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, modelsTree: { __typename?: 'ModelsTreeItemCollection', totalCount: number, cursor?: string | null, items: Array<{ __typename?: 'ModelsTreeItem', id: string, name: string, fullName: string, hasChildren: boolean, updatedAt: string, model?: { __typename?: 'Model', id: string, name: string, displayName: string, previewUrl?: string | null, createdAt: string, updatedAt: string, description?: string | null, versionCount: { __typename?: 'VersionCollection', totalCount: number }, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number }, pendingImportedVersions: Array<{ __typename?: 'FileUpload', id: string, projectId: string, modelName: string, convertedStatus: number, convertedMessage?: string | null, uploadDate: string, convertedLastUpdate: string, fileType: string, fileName: string }>, automationStatus?: { __typename?: 'AutomationsStatus', id: string, status: AutomationRunStatus, statusMessage?: string | null, automationRuns: Array<{ __typename?: 'AutomationRun', id: string, automationId: string, automationName: string, createdAt: string, status: AutomationRunStatus, functionRuns: Array<{ __typename?: 'AutomationFunctionRun', id: string, functionId: string, functionName: string, functionLogo?: string | null, elapsed: number, status: AutomationRunStatus, statusMessage?: string | null, contextView?: string | null, results?: {} | null, resultVersions: Array<{ __typename?: 'Version', id: string, model: { __typename?: 'Model', id: string, name: string } }> }> }> } | null } | null }> }, pendingImportedModels: Array<{ __typename?: 'FileUpload', id: string, projectId: string, modelName: string, convertedStatus: number, convertedMessage?: string | null, uploadDate: string, convertedLastUpdate: string, fileType: string, fileName: string }> } };

export type ProjectModelsTreeTopLevelPaginationQueryVariables = Exact<{
  projectId: Scalars['String'];
  filter?: InputMaybe<ProjectModelsTreeFilter>;
  cursor?: InputMaybe<Scalars['String']>;
}>;


export type ProjectModelsTreeTopLevelPaginationQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, modelsTree: { __typename?: 'ModelsTreeItemCollection', totalCount: number, cursor?: string | null, items: Array<{ __typename?: 'ModelsTreeItem', id: string, name: string, fullName: string, hasChildren: boolean, updatedAt: string, model?: { __typename?: 'Model', id: string, name: string, displayName: string, previewUrl?: string | null, createdAt: string, updatedAt: string, description?: string | null, versionCount: { __typename?: 'VersionCollection', totalCount: number }, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number }, pendingImportedVersions: Array<{ __typename?: 'FileUpload', id: string, projectId: string, modelName: string, convertedStatus: number, convertedMessage?: string | null, uploadDate: string, convertedLastUpdate: string, fileType: string, fileName: string }>, automationStatus?: { __typename?: 'AutomationsStatus', id: string, status: AutomationRunStatus, statusMessage?: string | null, automationRuns: Array<{ __typename?: 'AutomationRun', id: string, automationId: string, automationName: string, createdAt: string, status: AutomationRunStatus, functionRuns: Array<{ __typename?: 'AutomationFunctionRun', id: string, functionId: string, functionName: string, functionLogo?: string | null, elapsed: number, status: AutomationRunStatus, statusMessage?: string | null, contextView?: string | null, results?: {} | null, resultVersions: Array<{ __typename?: 'Version', id: string, model: { __typename?: 'Model', id: string, name: string } }> }> }> } | null } | null }> } } };

export type ProjectModelChildrenTreeQueryVariables = Exact<{
  projectId: Scalars['String'];
  parentName: Scalars['String'];
}>;


export type ProjectModelChildrenTreeQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, modelChildrenTree: Array<{ __typename?: 'ModelsTreeItem', id: string, name: string, fullName: string, hasChildren: boolean, updatedAt: string, model?: { __typename?: 'Model', id: string, name: string, displayName: string, previewUrl?: string | null, createdAt: string, updatedAt: string, description?: string | null, versionCount: { __typename?: 'VersionCollection', totalCount: number }, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number }, pendingImportedVersions: Array<{ __typename?: 'FileUpload', id: string, projectId: string, modelName: string, convertedStatus: number, convertedMessage?: string | null, uploadDate: string, convertedLastUpdate: string, fileType: string, fileName: string }>, automationStatus?: { __typename?: 'AutomationsStatus', id: string, status: AutomationRunStatus, statusMessage?: string | null, automationRuns: Array<{ __typename?: 'AutomationRun', id: string, automationId: string, automationName: string, createdAt: string, status: AutomationRunStatus, functionRuns: Array<{ __typename?: 'AutomationFunctionRun', id: string, functionId: string, functionName: string, functionLogo?: string | null, elapsed: number, status: AutomationRunStatus, statusMessage?: string | null, contextView?: string | null, results?: {} | null, resultVersions: Array<{ __typename?: 'Version', id: string, model: { __typename?: 'Model', id: string, name: string } }> }> }> } | null } | null }> } };

export type ProjectLatestCommentThreadsQueryVariables = Exact<{
  projectId: Scalars['String'];
  cursor?: InputMaybe<Scalars['String']>;
  filter?: InputMaybe<ProjectCommentsFilter>;
}>;


export type ProjectLatestCommentThreadsQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, commentThreads: { __typename?: 'ProjectCommentCollection', totalCount: number, cursor?: string | null, items: Array<{ __typename?: 'Comment', id: string, screenshot?: string | null, rawText: string, createdAt: string, updatedAt: string, archived: boolean, author: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null }, repliesCount: { __typename?: 'CommentCollection', totalCount: number }, replyAuthors: { __typename?: 'CommentReplyAuthorCollection', totalCount: number, items: Array<{ __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null }> } }> } } };

export type ProjectInviteQueryVariables = Exact<{
  projectId: Scalars['String'];
  token?: InputMaybe<Scalars['String']>;
}>;


export type ProjectInviteQuery = { __typename?: 'Query', projectInvite?: { __typename?: 'PendingStreamCollaborator', id: string, projectId: string, projectName: string, token?: string | null, invitedBy: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } } | null };

export type ProjectModelCheckQueryVariables = Exact<{
  projectId: Scalars['String'];
  modelId: Scalars['String'];
}>;


export type ProjectModelCheckQuery = { __typename?: 'Query', project: { __typename?: 'Project', model: { __typename?: 'Model', id: string } } };

export type ProjectModelPageQueryVariables = Exact<{
  projectId: Scalars['String'];
  modelId: Scalars['String'];
  versionsCursor?: InputMaybe<Scalars['String']>;
}>;


export type ProjectModelPageQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, name: string, role?: string | null, description?: string | null, visibility: ProjectVisibility, allowPublicComments: boolean, model: { __typename?: 'Model', id: string, name: string, pendingImportedVersions: Array<{ __typename?: 'FileUpload', id: string, projectId: string, modelName: string, convertedStatus: number, convertedMessage?: string | null, uploadDate: string, convertedLastUpdate: string, fileType: string, fileName: string }>, versions: { __typename?: 'VersionCollection', cursor?: string | null, totalCount: number, items: Array<{ __typename?: 'Version', id: string, message?: string | null, createdAt: string, previewUrl: string, sourceApplication?: string | null, authorUser?: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } | null, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number }, automationStatus?: { __typename?: 'AutomationsStatus', id: string, status: AutomationRunStatus, statusMessage?: string | null, automationRuns: Array<{ __typename?: 'AutomationRun', id: string, automationId: string, automationName: string, createdAt: string, status: AutomationRunStatus, functionRuns: Array<{ __typename?: 'AutomationFunctionRun', id: string, functionId: string, functionName: string, functionLogo?: string | null, elapsed: number, status: AutomationRunStatus, statusMessage?: string | null, contextView?: string | null, results?: {} | null, resultVersions: Array<{ __typename?: 'Version', id: string, model: { __typename?: 'Model', id: string, name: string } }> }> }> } | null }> } } } };

export type ProjectModelVersionsQueryVariables = Exact<{
  projectId: Scalars['String'];
  modelId: Scalars['String'];
  versionsCursor?: InputMaybe<Scalars['String']>;
}>;


export type ProjectModelVersionsQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, visibility: ProjectVisibility, model: { __typename?: 'Model', id: string, versions: { __typename?: 'VersionCollection', cursor?: string | null, totalCount: number, items: Array<{ __typename?: 'Version', id: string, message?: string | null, createdAt: string, previewUrl: string, sourceApplication?: string | null, authorUser?: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } | null, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number }, automationStatus?: { __typename?: 'AutomationsStatus', id: string, status: AutomationRunStatus, statusMessage?: string | null, automationRuns: Array<{ __typename?: 'AutomationRun', id: string, automationId: string, automationName: string, createdAt: string, status: AutomationRunStatus, functionRuns: Array<{ __typename?: 'AutomationFunctionRun', id: string, functionId: string, functionName: string, functionLogo?: string | null, elapsed: number, status: AutomationRunStatus, statusMessage?: string | null, contextView?: string | null, results?: {} | null, resultVersions: Array<{ __typename?: 'Version', id: string, model: { __typename?: 'Model', id: string, name: string } }> }> }> } | null }> } } } };

export type ProjectModelsPageQueryVariables = Exact<{
  projectId: Scalars['String'];
}>;


export type ProjectModelsPageQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, name: string, sourceApps: Array<string>, role?: string | null, visibility: ProjectVisibility, team: Array<{ __typename?: 'ProjectCollaborator', user: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } }>, modelCount: { __typename?: 'ModelCollection', totalCount: number } } };

export type ProjectDiscussionsPageQueryVariables = Exact<{
  projectId: Scalars['String'];
}>;


export type ProjectDiscussionsPageQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, name: string } };

export type ProjectWebhooksQueryVariables = Exact<{
  projectId: Scalars['String'];
}>;


export type ProjectWebhooksQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, name: string, webhooks: { __typename?: 'WebhookCollection', totalCount: number, items: Array<{ __typename?: 'Webhook', streamId: string, triggers: Array<string>, enabled?: boolean | null, url: string, id: string, description?: string | null, history?: { __typename?: 'WebhookEventCollection', items?: Array<{ __typename?: 'WebhookEvent', status: number, statusInfo: string } | null> | null } | null }> } } };

export type BlobQueryVariables = Exact<{
  blobId: Scalars['String'];
  streamId: Scalars['String'];
}>;


export type BlobQuery = { __typename?: 'Query', stream?: { __typename?: 'Stream', blob?: { __typename?: 'BlobMetadata', id: string, fileName: string, fileType: string, fileSize?: number | null, createdAt: string } | null } | null };

export type OnProjectUpdatedSubscriptionVariables = Exact<{
  id: Scalars['String'];
}>;


export type OnProjectUpdatedSubscription = { __typename?: 'Subscription', projectUpdated: { __typename?: 'ProjectUpdatedMessage', id: string, type: ProjectUpdatedMessageType, project?: { __typename?: 'Project', id: string, createdAt: string, name: string, updatedAt: string, role?: string | null, description?: string | null, visibility: ProjectVisibility, allowPublicComments: boolean, team: Array<{ __typename?: 'ProjectCollaborator', role: string, user: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null, role?: string | null } }>, invitedTeam?: Array<{ __typename?: 'PendingStreamCollaborator', id: string, title: string, inviteId: string, role: string, user?: { __typename?: 'LimitedUser', role?: string | null, id: string, name: string, avatar?: string | null } | null }> | null, versionCount: { __typename?: 'VersionCollection', totalCount: number }, modelCount: { __typename?: 'ModelCollection', totalCount: number }, commentThreadCount: { __typename?: 'ProjectCommentCollection', totalCount: number } } | null } };

export type OnProjectModelsUpdateSubscriptionVariables = Exact<{
  id: Scalars['String'];
}>;


export type OnProjectModelsUpdateSubscription = { __typename?: 'Subscription', projectModelsUpdated: { __typename?: 'ProjectModelsUpdatedMessage', id: string, type: ProjectModelsUpdatedMessageType, model?: { __typename?: 'Model', id: string, name: string, displayName: string, previewUrl?: string | null, createdAt: string, updatedAt: string, description?: string | null, versions: { __typename?: 'VersionCollection', items: Array<{ __typename?: 'Version', id: string, referencedObject: string }> }, versionCount: { __typename?: 'VersionCollection', totalCount: number }, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number }, pendingImportedVersions: Array<{ __typename?: 'FileUpload', id: string, projectId: string, modelName: string, convertedStatus: number, convertedMessage?: string | null, uploadDate: string, convertedLastUpdate: string, fileType: string, fileName: string }>, automationStatus?: { __typename?: 'AutomationsStatus', id: string, status: AutomationRunStatus, statusMessage?: string | null, automationRuns: Array<{ __typename?: 'AutomationRun', id: string, automationId: string, automationName: string, createdAt: string, status: AutomationRunStatus, functionRuns: Array<{ __typename?: 'AutomationFunctionRun', id: string, functionId: string, functionName: string, functionLogo?: string | null, elapsed: number, status: AutomationRunStatus, statusMessage?: string | null, contextView?: string | null, results?: {} | null, resultVersions: Array<{ __typename?: 'Version', id: string, model: { __typename?: 'Model', id: string, name: string } }> }> }> } | null } | null } };

export type OnProjectVersionsUpdateSubscriptionVariables = Exact<{
  id: Scalars['String'];
}>;


export type OnProjectVersionsUpdateSubscription = { __typename?: 'Subscription', projectVersionsUpdated: { __typename?: 'ProjectVersionsUpdatedMessage', id: string, modelId?: string | null, type: ProjectVersionsUpdatedMessageType, version?: { __typename?: 'Version', id: string, message?: string | null, referencedObject: string, sourceApplication?: string | null, createdAt: string, previewUrl: string, model: { __typename?: 'Model', id: string, name: string, displayName: string, previewUrl?: string | null, createdAt: string, updatedAt: string, description?: string | null, versionCount: { __typename?: 'VersionCollection', totalCount: number }, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number }, pendingImportedVersions: Array<{ __typename?: 'FileUpload', id: string, projectId: string, modelName: string, convertedStatus: number, convertedMessage?: string | null, uploadDate: string, convertedLastUpdate: string, fileType: string, fileName: string }>, automationStatus?: { __typename?: 'AutomationsStatus', id: string, status: AutomationRunStatus, statusMessage?: string | null, automationRuns: Array<{ __typename?: 'AutomationRun', id: string, automationId: string, automationName: string, createdAt: string, status: AutomationRunStatus, functionRuns: Array<{ __typename?: 'AutomationFunctionRun', id: string, functionId: string, functionName: string, functionLogo?: string | null, elapsed: number, status: AutomationRunStatus, statusMessage?: string | null, contextView?: string | null, results?: {} | null, resultVersions: Array<{ __typename?: 'Version', id: string, model: { __typename?: 'Model', id: string, name: string } }> }> }> } | null }, authorUser?: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } | null, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number }, automationStatus?: { __typename?: 'AutomationsStatus', id: string, status: AutomationRunStatus, statusMessage?: string | null, automationRuns: Array<{ __typename?: 'AutomationRun', id: string, automationId: string, automationName: string, createdAt: string, status: AutomationRunStatus, functionRuns: Array<{ __typename?: 'AutomationFunctionRun', id: string, functionId: string, functionName: string, functionLogo?: string | null, elapsed: number, status: AutomationRunStatus, statusMessage?: string | null, contextView?: string | null, results?: {} | null, resultVersions: Array<{ __typename?: 'Version', id: string, model: { __typename?: 'Model', id: string, name: string } }> }> }> } | null } | null } };

export type OnProjectVersionsPreviewGeneratedSubscriptionVariables = Exact<{
  id: Scalars['String'];
}>;


export type OnProjectVersionsPreviewGeneratedSubscription = { __typename?: 'Subscription', projectVersionsPreviewGenerated: { __typename?: 'ProjectVersionsPreviewGeneratedMessage', projectId: string, objectId: string, versionId: string } };

export type OnProjectPendingModelsUpdatedSubscriptionVariables = Exact<{
  id: Scalars['String'];
}>;


export type OnProjectPendingModelsUpdatedSubscription = { __typename?: 'Subscription', projectPendingModelsUpdated: { __typename?: 'ProjectPendingModelsUpdatedMessage', id: string, type: ProjectPendingModelsUpdatedMessageType, model: { __typename?: 'FileUpload', id: string, projectId: string, modelName: string, convertedStatus: number, convertedMessage?: string | null, uploadDate: string, convertedLastUpdate: string, fileType: string, fileName: string, model?: { __typename?: 'Model', id: string, name: string, displayName: string, previewUrl?: string | null, createdAt: string, updatedAt: string, description?: string | null, versionCount: { __typename?: 'VersionCollection', totalCount: number }, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number }, pendingImportedVersions: Array<{ __typename?: 'FileUpload', id: string, projectId: string, modelName: string, convertedStatus: number, convertedMessage?: string | null, uploadDate: string, convertedLastUpdate: string, fileType: string, fileName: string }>, automationStatus?: { __typename?: 'AutomationsStatus', id: string, status: AutomationRunStatus, statusMessage?: string | null, automationRuns: Array<{ __typename?: 'AutomationRun', id: string, automationId: string, automationName: string, createdAt: string, status: AutomationRunStatus, functionRuns: Array<{ __typename?: 'AutomationFunctionRun', id: string, functionId: string, functionName: string, functionLogo?: string | null, elapsed: number, status: AutomationRunStatus, statusMessage?: string | null, contextView?: string | null, results?: {} | null, resultVersions: Array<{ __typename?: 'Version', id: string, model: { __typename?: 'Model', id: string, name: string } }> }> }> } | null } | null } } };

export type OnProjectPendingVersionsUpdatedSubscriptionVariables = Exact<{
  id: Scalars['String'];
}>;


export type OnProjectPendingVersionsUpdatedSubscription = { __typename?: 'Subscription', projectPendingVersionsUpdated: { __typename?: 'ProjectPendingVersionsUpdatedMessage', id: string, type: ProjectPendingVersionsUpdatedMessageType, version: { __typename?: 'FileUpload', id: string, projectId: string, modelName: string, convertedStatus: number, convertedMessage?: string | null, uploadDate: string, convertedLastUpdate: string, fileType: string, fileName: string, model?: { __typename?: 'Model', id: string, name: string, displayName: string, previewUrl?: string | null, createdAt: string, updatedAt: string, description?: string | null, versionCount: { __typename?: 'VersionCollection', totalCount: number }, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number }, pendingImportedVersions: Array<{ __typename?: 'FileUpload', id: string, projectId: string, modelName: string, convertedStatus: number, convertedMessage?: string | null, uploadDate: string, convertedLastUpdate: string, fileType: string, fileName: string }>, automationStatus?: { __typename?: 'AutomationsStatus', id: string, status: AutomationRunStatus, statusMessage?: string | null, automationRuns: Array<{ __typename?: 'AutomationRun', id: string, automationId: string, automationName: string, createdAt: string, status: AutomationRunStatus, functionRuns: Array<{ __typename?: 'AutomationFunctionRun', id: string, functionId: string, functionName: string, functionLogo?: string | null, elapsed: number, status: AutomationRunStatus, statusMessage?: string | null, contextView?: string | null, results?: {} | null, resultVersions: Array<{ __typename?: 'Version', id: string, model: { __typename?: 'Model', id: string, name: string } }> }> }> } | null } | null } } };

export type ServerInfoUpdateMutationVariables = Exact<{
  info: ServerInfoUpdateInput;
}>;


export type ServerInfoUpdateMutation = { __typename?: 'Mutation', serverInfoUpdate?: boolean | null };

export type AdminPanelDeleteUserMutationVariables = Exact<{
  userConfirmation: UserDeleteInput;
}>;


export type AdminPanelDeleteUserMutation = { __typename?: 'Mutation', adminDeleteUser: boolean };

export type AdminPanelDeleteProjectMutationVariables = Exact<{
  ids?: InputMaybe<Array<Scalars['String']> | Scalars['String']>;
}>;


export type AdminPanelDeleteProjectMutation = { __typename?: 'Mutation', streamsDelete: boolean };

export type AdminPanelResendInviteMutationVariables = Exact<{
  inviteId: Scalars['String'];
}>;


export type AdminPanelResendInviteMutation = { __typename?: 'Mutation', inviteResend: boolean };

export type AdminPanelDeleteInviteMutationVariables = Exact<{
  inviteId: Scalars['String'];
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
  limit: Scalars['Int'];
  cursor?: InputMaybe<Scalars['String']>;
  query?: InputMaybe<Scalars['String']>;
}>;


export type AdminPanelUsersListQuery = { __typename?: 'Query', admin: { __typename?: 'AdminQueries', userList: { __typename?: 'AdminUserList', totalCount: number, cursor?: string | null, items: Array<{ __typename?: 'AdminUserListItem', id: string, email?: string | null, avatar?: string | null, name: string, role?: string | null, verified?: boolean | null, company?: string | null }> } } };

export type AdminPanelProjectsListQueryVariables = Exact<{
  query?: InputMaybe<Scalars['String']>;
  orderBy?: InputMaybe<Scalars['String']>;
  limit: Scalars['Int'];
  visibility?: InputMaybe<Scalars['String']>;
  cursor?: InputMaybe<Scalars['String']>;
}>;


export type AdminPanelProjectsListQuery = { __typename?: 'Query', admin: { __typename?: 'AdminQueries', projectList: { __typename?: 'ProjectCollection', cursor?: string | null, totalCount: number, items: Array<{ __typename?: 'Project', id: string, name: string, visibility: ProjectVisibility, createdAt: string, updatedAt: string, models: { __typename?: 'ModelCollection', totalCount: number }, versions: { __typename?: 'VersionCollection', totalCount: number }, team: Array<{ __typename?: 'ProjectCollaborator', user: { __typename?: 'LimitedUser', name: string, id: string, avatar?: string | null } }> }> } } };

export type AdminPanelInvitesListQueryVariables = Exact<{
  limit: Scalars['Int'];
  cursor?: InputMaybe<Scalars['String']>;
  query?: InputMaybe<Scalars['String']>;
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
  input: Scalars['JSONObject'];
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
  projectId: Scalars['String'];
  resourceIdString: Scalars['String'];
  message: ViewerUserActivityMessageInput;
}>;


export type BroadcastViewerUserActivityMutation = { __typename?: 'Mutation', broadcastViewerUserActivity: boolean };

export type MarkCommentViewedMutationVariables = Exact<{
  threadId: Scalars['String'];
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
  commentId: Scalars['String'];
  archived?: InputMaybe<Scalars['Boolean']>;
}>;


export type ArchiveCommentMutation = { __typename?: 'Mutation', commentMutations: { __typename?: 'CommentMutations', archive: boolean } };

export type ProjectViewerResourcesQueryVariables = Exact<{
  projectId: Scalars['String'];
  resourceUrlString: Scalars['String'];
}>;


export type ProjectViewerResourcesQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, viewerResources: Array<{ __typename?: 'ViewerResourceGroup', identifier: string, items: Array<{ __typename?: 'ViewerResourceItem', modelId?: string | null, versionId?: string | null, objectId: string }> }> } };

export type ViewerLoadedResourcesQueryVariables = Exact<{
  projectId: Scalars['String'];
  modelIds: Array<Scalars['String']> | Scalars['String'];
  versionIds?: InputMaybe<Array<Scalars['String']> | Scalars['String']>;
}>;


export type ViewerLoadedResourcesQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, role?: string | null, visibility: ProjectVisibility, createdAt: string, name: string, models: { __typename?: 'ModelCollection', totalCount: number, items: Array<{ __typename?: 'Model', id: string, name: string, updatedAt: string, loadedVersion: { __typename?: 'VersionCollection', items: Array<{ __typename?: 'Version', id: string, message?: string | null, referencedObject: string, sourceApplication?: string | null, createdAt: string, previewUrl: string, automationStatus?: { __typename?: 'AutomationsStatus', id: string, status: AutomationRunStatus, statusMessage?: string | null, automationRuns: Array<{ __typename?: 'AutomationRun', id: string, automationId: string, automationName: string, versionId: string, createdAt: string, updatedAt: string, status: AutomationRunStatus, functionRuns: Array<{ __typename?: 'AutomationFunctionRun', id: string, functionId: string, functionName: string, functionLogo?: string | null, elapsed: number, status: AutomationRunStatus, contextView?: string | null, statusMessage?: string | null, results?: {} | null, resultVersions: Array<{ __typename?: 'Version', id: string, referencedObject: string, model: { __typename?: 'Model', id: string, name: string } }> }> }> } | null, authorUser?: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } | null }> }, versions: { __typename?: 'VersionCollection', totalCount: number, cursor?: string | null, items: Array<{ __typename?: 'Version', id: string, message?: string | null, referencedObject: string, sourceApplication?: string | null, createdAt: string, previewUrl: string, authorUser?: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } | null }> } }> }, modelCount: { __typename?: 'ModelCollection', totalCount: number } } };

export type ViewerModelVersionsQueryVariables = Exact<{
  projectId: Scalars['String'];
  modelId: Scalars['String'];
  versionsCursor?: InputMaybe<Scalars['String']>;
}>;


export type ViewerModelVersionsQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, role?: string | null, model: { __typename?: 'Model', id: string, versions: { __typename?: 'VersionCollection', totalCount: number, cursor?: string | null, items: Array<{ __typename?: 'Version', id: string, message?: string | null, referencedObject: string, sourceApplication?: string | null, createdAt: string, previewUrl: string, authorUser?: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } | null }> } } } };

export type ViewerDiffVersionsQueryVariables = Exact<{
  projectId: Scalars['String'];
  modelId: Scalars['String'];
  versionAId: Scalars['String'];
  versionBId: Scalars['String'];
}>;


export type ViewerDiffVersionsQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, model: { __typename?: 'Model', id: string, versionA: { __typename?: 'Version', id: string, message?: string | null, referencedObject: string, sourceApplication?: string | null, createdAt: string, previewUrl: string, authorUser?: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } | null }, versionB: { __typename?: 'Version', id: string, message?: string | null, referencedObject: string, sourceApplication?: string | null, createdAt: string, previewUrl: string, authorUser?: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } | null } } } };

export type ViewerLoadedThreadsQueryVariables = Exact<{
  projectId: Scalars['String'];
  filter: ProjectCommentsFilter;
  cursor?: InputMaybe<Scalars['String']>;
  limit?: InputMaybe<Scalars['Int']>;
}>;


export type ViewerLoadedThreadsQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, commentThreads: { __typename?: 'ProjectCommentCollection', totalCount: number, totalArchivedCount: number, items: Array<{ __typename?: 'Comment', id: string, rawText: string, archived: boolean, createdAt: string, viewedAt?: string | null, viewerState?: {} | null, viewerResources: Array<{ __typename?: 'ViewerResourceItem', modelId?: string | null, versionId?: string | null, objectId: string }>, author: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null }, replies: { __typename?: 'CommentCollection', totalCount: number, cursor?: string | null, items: Array<{ __typename?: 'Comment', id: string, archived: boolean, rawText: string, createdAt: string, text: { __typename?: 'SmartTextEditorValue', doc?: {} | null, attachments?: Array<{ __typename?: 'BlobMetadata', id: string, fileName: string, fileType: string, fileSize?: number | null }> | null }, author: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } }> }, replyAuthors: { __typename?: 'CommentReplyAuthorCollection', totalCount: number, items: Array<{ __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null }> }, resources: Array<{ __typename?: 'ResourceIdentifier', resourceId: string, resourceType: ResourceType }>, text: { __typename?: 'SmartTextEditorValue', doc?: {} | null, attachments?: Array<{ __typename?: 'BlobMetadata', id: string, fileName: string, fileType: string, fileSize?: number | null }> | null } }> } } };

export type OnViewerUserActivityBroadcastedSubscriptionVariables = Exact<{
  target: ViewerUpdateTrackingTarget;
  sessionId: Scalars['String'];
}>;


export type OnViewerUserActivityBroadcastedSubscription = { __typename?: 'Subscription', viewerUserActivityBroadcasted: { __typename?: 'ViewerUserActivityMessage', userName: string, userId?: string | null, state?: {} | null, status: ViewerUserActivityStatus, sessionId: string, user?: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } | null } };

export type OnViewerCommentsUpdatedSubscriptionVariables = Exact<{
  target: ViewerUpdateTrackingTarget;
}>;


export type OnViewerCommentsUpdatedSubscription = { __typename?: 'Subscription', projectCommentsUpdated: { __typename?: 'ProjectCommentsUpdatedMessage', id: string, type: ProjectCommentsUpdatedMessageType, comment?: { __typename?: 'Comment', id: string, rawText: string, archived: boolean, createdAt: string, viewedAt?: string | null, viewerState?: {} | null, parent?: { __typename?: 'Comment', id: string } | null, author: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null }, replies: { __typename?: 'CommentCollection', totalCount: number, cursor?: string | null, items: Array<{ __typename?: 'Comment', id: string, archived: boolean, rawText: string, createdAt: string, text: { __typename?: 'SmartTextEditorValue', doc?: {} | null, attachments?: Array<{ __typename?: 'BlobMetadata', id: string, fileName: string, fileType: string, fileSize?: number | null }> | null }, author: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } }> }, replyAuthors: { __typename?: 'CommentReplyAuthorCollection', totalCount: number, items: Array<{ __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null }> }, resources: Array<{ __typename?: 'ResourceIdentifier', resourceId: string, resourceType: ResourceType }>, text: { __typename?: 'SmartTextEditorValue', doc?: {} | null, attachments?: Array<{ __typename?: 'BlobMetadata', id: string, fileName: string, fileType: string, fileSize?: number | null }> | null } } | null } };

export type LinkableCommentFragment = { __typename?: 'Comment', id: string, viewerResources: Array<{ __typename?: 'ViewerResourceItem', modelId?: string | null, versionId?: string | null, objectId: string }> };

export type LegacyBranchRedirectMetadataQueryVariables = Exact<{
  streamId: Scalars['String'];
  branchName: Scalars['String'];
}>;


export type LegacyBranchRedirectMetadataQuery = { __typename?: 'Query', stream?: { __typename?: 'Stream', branch?: { __typename?: 'Branch', id: string } | null } | null };

export type LegacyViewerCommitRedirectMetadataQueryVariables = Exact<{
  streamId: Scalars['String'];
  commitId: Scalars['String'];
}>;


export type LegacyViewerCommitRedirectMetadataQuery = { __typename?: 'Query', stream?: { __typename?: 'Stream', commit?: { __typename?: 'Commit', id: string, branch?: { __typename?: 'Branch', id: string } | null } | null } | null };

export type ResolveCommentLinkQueryVariables = Exact<{
  commentId: Scalars['String'];
  projectId: Scalars['String'];
}>;


export type ResolveCommentLinkQuery = { __typename?: 'Query', comment?: { __typename?: 'Comment', id: string, viewerResources: Array<{ __typename?: 'ViewerResourceItem', modelId?: string | null, versionId?: string | null, objectId: string }> } | null };

export type ProjectPageProjectFragment = { __typename?: 'Project', id: string, createdAt: string, role?: string | null, name: string, description?: string | null, visibility: ProjectVisibility, allowPublicComments: boolean, team: Array<{ __typename?: 'ProjectCollaborator', role: string, user: { __typename?: 'LimitedUser', role?: string | null, id: string, name: string, avatar?: string | null } }>, invitedTeam?: Array<{ __typename?: 'PendingStreamCollaborator', id: string, title: string, inviteId: string, role: string, user?: { __typename?: 'LimitedUser', role?: string | null, id: string, name: string, avatar?: string | null } | null }> | null, versionCount: { __typename?: 'VersionCollection', totalCount: number }, modelCount: { __typename?: 'ModelCollection', totalCount: number }, commentThreadCount: { __typename?: 'ProjectCommentCollection', totalCount: number } };

export const AuthRegisterPanelServerInfoFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AuthRegisterPanelServerInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ServerInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"inviteOnly"}}]}}]} as unknown as DocumentNode<AuthRegisterPanelServerInfoFragment, unknown>;
export const ServerTermsOfServicePrivacyPolicyFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ServerTermsOfServicePrivacyPolicyFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ServerInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"termsOfService"}}]}}]} as unknown as DocumentNode<ServerTermsOfServicePrivacyPolicyFragmentFragment, unknown>;
export const AuthStategiesServerInfoFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AuthStategiesServerInfoFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ServerInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"authStrategies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"url"}}]}}]}}]} as unknown as DocumentNode<AuthStategiesServerInfoFragmentFragment, unknown>;
export const CommonModelSelectorModelFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CommonModelSelectorModel"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]} as unknown as DocumentNode<CommonModelSelectorModelFragment, unknown>;
export const FormSelectProjects_ProjectFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FormSelectProjects_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]} as unknown as DocumentNode<FormSelectProjects_ProjectFragment, unknown>;
export const ProjectDiscussionsPageHeader_ProjectFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectDiscussionsPageHeader_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]} as unknown as DocumentNode<ProjectDiscussionsPageHeader_ProjectFragment, unknown>;
export const ProjectDiscussionsPageResults_ProjectFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectDiscussionsPageResults_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]} as unknown as DocumentNode<ProjectDiscussionsPageResults_ProjectFragment, unknown>;
export const ProjectModelPageHeaderProjectFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectModelPageHeaderProject"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"model"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"modelId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<ProjectModelPageHeaderProjectFragment, unknown>;
export const ProjectPageProjectHeaderFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageProjectHeader"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"allowPublicComments"}}]}}]} as unknown as DocumentNode<ProjectPageProjectHeaderFragment, unknown>;
export const PendingFileUploadFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PendingFileUpload"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FileUpload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"modelName"}},{"kind":"Field","name":{"kind":"Name","value":"convertedStatus"}},{"kind":"Field","name":{"kind":"Name","value":"convertedMessage"}},{"kind":"Field","name":{"kind":"Name","value":"uploadDate"}},{"kind":"Field","name":{"kind":"Name","value":"convertedLastUpdate"}},{"kind":"Field","name":{"kind":"Name","value":"fileType"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}}]}}]} as unknown as DocumentNode<PendingFileUploadFragment, unknown>;
export const LimitedUserAvatarFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LimitedUserAvatar"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LimitedUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}}]} as unknown as DocumentNode<LimitedUserAvatarFragment, unknown>;
export const ProjectModelPageDialogDeleteVersionFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectModelPageDialogDeleteVersion"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Version"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]} as unknown as DocumentNode<ProjectModelPageDialogDeleteVersionFragment, unknown>;
export const ProjectModelPageDialogMoveToVersionFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectModelPageDialogMoveToVersion"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Version"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]} as unknown as DocumentNode<ProjectModelPageDialogMoveToVersionFragment, unknown>;
export const ModelCardAutomationStatus_AutomationsStatusFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ModelCardAutomationStatus_AutomationsStatus"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomationsStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"statusMessage"}},{"kind":"Field","name":{"kind":"Name","value":"automationRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automationId"}},{"kind":"Field","name":{"kind":"Name","value":"automationName"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"functionId"}},{"kind":"Field","name":{"kind":"Name","value":"functionName"}},{"kind":"Field","name":{"kind":"Name","value":"functionLogo"}},{"kind":"Field","name":{"kind":"Name","value":"elapsed"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"statusMessage"}},{"kind":"Field","name":{"kind":"Name","value":"contextView"}},{"kind":"Field","name":{"kind":"Name","value":"results"}},{"kind":"Field","name":{"kind":"Name","value":"resultVersions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"model"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<ModelCardAutomationStatus_AutomationsStatusFragment, unknown>;
export const ModelCardAutomationStatus_VersionFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ModelCardAutomationStatus_Version"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Version"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automationStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ModelCardAutomationStatus_AutomationsStatus"}}]}}]}}]} as unknown as DocumentNode<ModelCardAutomationStatus_VersionFragment, unknown>;
export const ProjectModelPageVersionsCardVersionFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectModelPageVersionsCardVersion"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Version"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"authorUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"previewUrl"}},{"kind":"Field","name":{"kind":"Name","value":"sourceApplication"}},{"kind":"Field","alias":{"kind":"Name","value":"commentThreadCount"},"name":{"kind":"Name","value":"commentThreads"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectModelPageDialogDeleteVersion"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectModelPageDialogMoveToVersion"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ModelCardAutomationStatus_Version"}}]}}]} as unknown as DocumentNode<ProjectModelPageVersionsCardVersionFragment, unknown>;
export const ProjectModelPageVersionsPaginationFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectModelPageVersionsPagination"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"model"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"modelId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"versions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"16"}},{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"Variable","name":{"kind":"Name","value":"versionsCursor"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectModelPageVersionsCardVersion"}}]}}]}}]}}]}}]} as unknown as DocumentNode<ProjectModelPageVersionsPaginationFragment, unknown>;
export const ProjectModelPageVersionsProjectFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectModelPageVersionsProject"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageProjectHeader"}},{"kind":"Field","name":{"kind":"Name","value":"model"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"modelId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"pendingImportedVersions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PendingFileUpload"}}]}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectModelPageVersionsPagination"}}]}}]} as unknown as DocumentNode<ProjectModelPageVersionsProjectFragment, unknown>;
export const ProjectModelPageDialogEditMessageVersionFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectModelPageDialogEditMessageVersion"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Version"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]} as unknown as DocumentNode<ProjectModelPageDialogEditMessageVersionFragment, unknown>;
export const FormUsersSelectItemFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FormUsersSelectItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LimitedUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}}]} as unknown as DocumentNode<FormUsersSelectItemFragment, unknown>;
export const ProjectModelsPageHeader_ProjectFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectModelsPageHeader_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"sourceApps"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FormUsersSelectItem"}}]}}]}}]}}]} as unknown as DocumentNode<ProjectModelsPageHeader_ProjectFragment, unknown>;
export const ProjectPageLatestItemsModelsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageLatestItemsModels"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","alias":{"kind":"Name","value":"modelCount"},"name":{"kind":"Name","value":"models"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}}]} as unknown as DocumentNode<ProjectPageLatestItemsModelsFragment, unknown>;
export const ProjectModelsPageResults_ProjectFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectModelsPageResults_Project"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageLatestItemsModels"}}]}}]} as unknown as DocumentNode<ProjectModelsPageResults_ProjectFragment, unknown>;
export const ProjectPageLatestItemsCommentItemFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageLatestItemsCommentItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Comment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FormUsersSelectItem"}}]}},{"kind":"Field","name":{"kind":"Name","value":"screenshot"}},{"kind":"Field","name":{"kind":"Name","value":"rawText"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"archived"}},{"kind":"Field","alias":{"kind":"Name","value":"repliesCount"},"name":{"kind":"Name","value":"replies"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"replyAuthors"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"4"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FormUsersSelectItem"}}]}}]}}]}}]} as unknown as DocumentNode<ProjectPageLatestItemsCommentItemFragment, unknown>;
export const ModelPreviewFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ModelPreview"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"previewUrl"}}]}}]} as unknown as DocumentNode<ModelPreviewFragment, unknown>;
export const ProjectPageModelsCardRenameDialogFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsCardRenameDialog"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]} as unknown as DocumentNode<ProjectPageModelsCardRenameDialogFragment, unknown>;
export const ProjectPageModelsCardDeleteDialogFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsCardDeleteDialog"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]} as unknown as DocumentNode<ProjectPageModelsCardDeleteDialogFragment, unknown>;
export const ProjectPageModelsActionsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsActions"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]} as unknown as DocumentNode<ProjectPageModelsActionsFragment, unknown>;
export const ModelCardAutomationStatus_ModelFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ModelCardAutomationStatus_Model"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"automationStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ModelCardAutomationStatus_AutomationsStatus"}}]}}]}}]} as unknown as DocumentNode<ModelCardAutomationStatus_ModelFragment, unknown>;
export const ProjectPageLatestItemsModelItemFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageLatestItemsModelItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","alias":{"kind":"Name","value":"versionCount"},"name":{"kind":"Name","value":"versions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","alias":{"kind":"Name","value":"commentThreadCount"},"name":{"kind":"Name","value":"commentThreads"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pendingImportedVersions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PendingFileUpload"}}]}},{"kind":"Field","name":{"kind":"Name","value":"previewUrl"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsCardRenameDialog"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsCardDeleteDialog"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsActions"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ModelCardAutomationStatus_Model"}}]}}]} as unknown as DocumentNode<ProjectPageLatestItemsModelItemFragment, unknown>;
export const SingleLevelModelTreeItemFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SingleLevelModelTreeItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ModelsTreeItem"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}},{"kind":"Field","name":{"kind":"Name","value":"model"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageLatestItemsModelItem"}}]}},{"kind":"Field","name":{"kind":"Name","value":"hasChildren"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<SingleLevelModelTreeItemFragment, unknown>;
export const ProjectPageModelsCardProjectFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsCardProject"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}}]}}]} as unknown as DocumentNode<ProjectPageModelsCardProjectFragment, unknown>;
export const ProjectDashboardItemNoModelsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectDashboardItemNoModels"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsCardProject"}}]}}]} as unknown as DocumentNode<ProjectDashboardItemNoModelsFragment, unknown>;
export const ProjectDashboardItemFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectDashboardItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectDashboardItemNoModels"}},{"kind":"Field","name":{"kind":"Name","value":"models"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"4"}},{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"onlyWithVersions"},"value":{"kind":"BooleanValue","value":true}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageLatestItemsModelItem"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pendingImportedModels"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"4"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PendingFileUpload"}}]}}]}}]} as unknown as DocumentNode<ProjectDashboardItemFragment, unknown>;
export const ProjectsDashboardFilledFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectsDashboardFilled"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ProjectCollection"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectDashboardItem"}}]}}]}}]} as unknown as DocumentNode<ProjectsDashboardFilledFragment, unknown>;
export const ProjectsInviteBannerFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectsInviteBanner"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PendingStreamCollaborator"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"invitedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}}]}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"projectName"}},{"kind":"Field","name":{"kind":"Name","value":"token"}}]}}]} as unknown as DocumentNode<ProjectsInviteBannerFragment, unknown>;
export const ProjectsInviteBannersFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectsInviteBanners"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectInvites"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsInviteBanner"}}]}}]}}]} as unknown as DocumentNode<ProjectsInviteBannersFragment, unknown>;
export const ActiveUserAvatarFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ActiveUserAvatar"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}}]} as unknown as DocumentNode<ActiveUserAvatarFragment, unknown>;
export const UserProfileEditDialogAvatar_UserFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserProfileEditDialogAvatar_User"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ActiveUserAvatar"}}]}}]} as unknown as DocumentNode<UserProfileEditDialogAvatar_UserFragment, unknown>;
export const UserProfileEditDialogBio_UserFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserProfileEditDialogBio_User"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"company"}},{"kind":"Field","name":{"kind":"Name","value":"bio"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserProfileEditDialogAvatar_User"}}]}}]} as unknown as DocumentNode<UserProfileEditDialogBio_UserFragment, unknown>;
export const UserProfileEditDialogDeleteAccount_UserFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserProfileEditDialogDeleteAccount_User"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]} as unknown as DocumentNode<UserProfileEditDialogDeleteAccount_UserFragment, unknown>;
export const UserProfileEditDialogNotificationPreferences_UserFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserProfileEditDialogNotificationPreferences_User"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"notificationPreferences"}}]}}]} as unknown as DocumentNode<UserProfileEditDialogNotificationPreferences_UserFragment, unknown>;
export const ModelPageProjectFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ModelPageProject"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}}]}}]} as unknown as DocumentNode<ModelPageProjectFragment, unknown>;
export const ViewerModelVersionCardItemFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ViewerModelVersionCardItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Version"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"referencedObject"}},{"kind":"Field","name":{"kind":"Name","value":"sourceApplication"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"previewUrl"}},{"kind":"Field","name":{"kind":"Name","value":"authorUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}}]}}]}}]} as unknown as DocumentNode<ViewerModelVersionCardItemFragment, unknown>;
export const ProjectUpdatableMetadataFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectUpdatableMetadata"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"allowPublicComments"}}]}}]} as unknown as DocumentNode<ProjectUpdatableMetadataFragment, unknown>;
export const AppAuthorAvatarFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AppAuthorAvatar"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AppAuthor"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}}]} as unknown as DocumentNode<AppAuthorAvatarFragment, unknown>;
export const ThreadCommentAttachmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ThreadCommentAttachment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Comment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"text"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"attachments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}},{"kind":"Field","name":{"kind":"Name","value":"fileType"}},{"kind":"Field","name":{"kind":"Name","value":"fileSize"}}]}}]}}]}}]} as unknown as DocumentNode<ThreadCommentAttachmentFragment, unknown>;
export const ViewerCommentsReplyItemFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ViewerCommentsReplyItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Comment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"archived"}},{"kind":"Field","name":{"kind":"Name","value":"rawText"}},{"kind":"Field","name":{"kind":"Name","value":"text"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"doc"}}]}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ThreadCommentAttachment"}}]}}]} as unknown as DocumentNode<ViewerCommentsReplyItemFragment, unknown>;
export const ViewerCommentsListItemFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ViewerCommentsListItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Comment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"rawText"}},{"kind":"Field","name":{"kind":"Name","value":"archived"}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"viewedAt"}},{"kind":"Field","name":{"kind":"Name","value":"replies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ViewerCommentsReplyItem"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"replyAuthors"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"4"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FormUsersSelectItem"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"resources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resourceId"}},{"kind":"Field","name":{"kind":"Name","value":"resourceType"}}]}}]}}]} as unknown as DocumentNode<ViewerCommentsListItemFragment, unknown>;
export const ViewerCommentBubblesDataFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ViewerCommentBubblesData"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Comment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"viewedAt"}},{"kind":"Field","name":{"kind":"Name","value":"viewerState"}}]}}]} as unknown as DocumentNode<ViewerCommentBubblesDataFragment, unknown>;
export const ViewerCommentThreadFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ViewerCommentThread"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Comment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ViewerCommentsListItem"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ViewerCommentBubblesData"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ViewerCommentsReplyItem"}}]}}]} as unknown as DocumentNode<ViewerCommentThreadFragment, unknown>;
export const LinkableCommentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LinkableComment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Comment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"viewerResources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"modelId"}},{"kind":"Field","name":{"kind":"Name","value":"versionId"}},{"kind":"Field","name":{"kind":"Name","value":"objectId"}}]}}]}}]} as unknown as DocumentNode<LinkableCommentFragment, unknown>;
export const ProjectPageTeamDialogFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageTeamDialog"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"allowPublicComments"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"invitedTeam"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"inviteId"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]}}]}}]} as unknown as DocumentNode<ProjectPageTeamDialogFragment, unknown>;
export const ProjectPageStatsBlockTeamFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageStatsBlockTeam"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}}]}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageTeamDialog"}}]}}]} as unknown as DocumentNode<ProjectPageStatsBlockTeamFragment, unknown>;
export const ProjectPageStatsBlockVersionsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageStatsBlockVersions"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"versionCount"},"name":{"kind":"Name","value":"versions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}}]} as unknown as DocumentNode<ProjectPageStatsBlockVersionsFragment, unknown>;
export const ProjectPageStatsBlockModelsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageStatsBlockModels"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"modelCount"},"name":{"kind":"Name","value":"models"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}}]} as unknown as DocumentNode<ProjectPageStatsBlockModelsFragment, unknown>;
export const ProjectPageStatsBlockCommentsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageStatsBlockComments"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"commentThreadCount"},"name":{"kind":"Name","value":"commentThreads"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}}]} as unknown as DocumentNode<ProjectPageStatsBlockCommentsFragment, unknown>;
export const ProjectPageLatestItemsCommentsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageLatestItemsComments"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","alias":{"kind":"Name","value":"commentThreadCount"},"name":{"kind":"Name","value":"commentThreads"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}}]} as unknown as DocumentNode<ProjectPageLatestItemsCommentsFragment, unknown>;
export const ProjectPageProjectFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageProject"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageProjectHeader"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageStatsBlockTeam"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageTeamDialog"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageStatsBlockVersions"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageStatsBlockModels"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageStatsBlockComments"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageLatestItemsModels"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageLatestItemsComments"}}]}}]} as unknown as DocumentNode<ProjectPageProjectFragment, unknown>;
export const RegisterPanelServerInviteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"RegisterPanelServerInvite"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"token"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"serverInviteByToken"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"token"},"value":{"kind":"Variable","name":{"kind":"Name","value":"token"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]} as unknown as DocumentNode<RegisterPanelServerInviteQuery, RegisterPanelServerInviteQueryVariables>;
export const EmailVerificationBannerStateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"EmailVerificationBannerState"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"verified"}},{"kind":"Field","name":{"kind":"Name","value":"hasPendingVerification"}}]}}]}}]} as unknown as DocumentNode<EmailVerificationBannerStateQuery, EmailVerificationBannerStateQueryVariables>;
export const RequestVerificationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RequestVerification"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requestVerification"}}]}}]} as unknown as DocumentNode<RequestVerificationMutation, RequestVerificationMutationVariables>;
export const OnUserProjectsUpdateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"OnUserProjectsUpdate"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userProjectsUpdated"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"project"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectDashboardItem"}}]}}]}}]}},...ProjectDashboardItemFragmentDoc.definitions,...ProjectDashboardItemNoModelsFragmentDoc.definitions,...ProjectPageModelsCardProjectFragmentDoc.definitions,...ProjectPageLatestItemsModelItemFragmentDoc.definitions,...PendingFileUploadFragmentDoc.definitions,...ProjectPageModelsCardRenameDialogFragmentDoc.definitions,...ProjectPageModelsCardDeleteDialogFragmentDoc.definitions,...ProjectPageModelsActionsFragmentDoc.definitions,...ModelCardAutomationStatus_ModelFragmentDoc.definitions,...ModelCardAutomationStatus_AutomationsStatusFragmentDoc.definitions]} as unknown as DocumentNode<OnUserProjectsUpdateSubscription, OnUserProjectsUpdateSubscriptionVariables>;
export const ActiveUserMainMetadataDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ActiveUserMainMetadata"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"company"}},{"kind":"Field","name":{"kind":"Name","value":"bio"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"isOnboardingFinished"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"verified"}},{"kind":"Field","name":{"kind":"Name","value":"notificationPreferences"}}]}}]}}]} as unknown as DocumentNode<ActiveUserMainMetadataQuery, ActiveUserMainMetadataQueryVariables>;
export const CreateOnboardingProjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateOnboardingProject"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createForOnboarding"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageProject"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectDashboardItem"}}]}}]}}]}},...ProjectPageProjectFragmentDoc.definitions,...ProjectPageProjectHeaderFragmentDoc.definitions,...ProjectPageStatsBlockTeamFragmentDoc.definitions,...LimitedUserAvatarFragmentDoc.definitions,...ProjectPageTeamDialogFragmentDoc.definitions,...ProjectPageStatsBlockVersionsFragmentDoc.definitions,...ProjectPageStatsBlockModelsFragmentDoc.definitions,...ProjectPageStatsBlockCommentsFragmentDoc.definitions,...ProjectPageLatestItemsModelsFragmentDoc.definitions,...ProjectPageLatestItemsCommentsFragmentDoc.definitions,...ProjectDashboardItemFragmentDoc.definitions,...ProjectDashboardItemNoModelsFragmentDoc.definitions,...ProjectPageModelsCardProjectFragmentDoc.definitions,...ProjectPageLatestItemsModelItemFragmentDoc.definitions,...PendingFileUploadFragmentDoc.definitions,...ProjectPageModelsCardRenameDialogFragmentDoc.definitions,...ProjectPageModelsCardDeleteDialogFragmentDoc.definitions,...ProjectPageModelsActionsFragmentDoc.definitions,...ModelCardAutomationStatus_ModelFragmentDoc.definitions,...ModelCardAutomationStatus_AutomationsStatusFragmentDoc.definitions]} as unknown as DocumentNode<CreateOnboardingProjectMutation, CreateOnboardingProjectMutationVariables>;
export const FinishOnboardingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"FinishOnboarding"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeUserMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"finishOnboarding"}}]}}]}}]} as unknown as DocumentNode<FinishOnboardingMutation, FinishOnboardingMutationVariables>;
export const RequestVerificationByEmailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RequestVerificationByEmail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"email"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requestVerificationByEmail"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"email"},"value":{"kind":"Variable","name":{"kind":"Name","value":"email"}}}]}]}}]} as unknown as DocumentNode<RequestVerificationByEmailMutation, RequestVerificationByEmailMutationVariables>;
export const AuthServerInfoDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AuthServerInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"serverInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AuthStategiesServerInfoFragment"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ServerTermsOfServicePrivacyPolicyFragment"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AuthRegisterPanelServerInfo"}}]}}]}},...AuthStategiesServerInfoFragmentFragmentDoc.definitions,...ServerTermsOfServicePrivacyPolicyFragmentFragmentDoc.definitions,...AuthRegisterPanelServerInfoFragmentDoc.definitions]} as unknown as DocumentNode<AuthServerInfoQuery, AuthServerInfoQueryVariables>;
export const AuthorizableAppMetadataDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AuthorizableAppMetadata"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"app"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"trustByDefault"}},{"kind":"Field","name":{"kind":"Name","value":"redirectUrl"}},{"kind":"Field","name":{"kind":"Name","value":"scopes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}}]}}]}}]} as unknown as DocumentNode<AuthorizableAppMetadataQuery, AuthorizableAppMetadataQueryVariables>;
export const OnModelVersionCardAutomationsStatusUpdatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"OnModelVersionCardAutomationsStatusUpdated"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectAutomationsStatusUpdated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ModelCardAutomationStatus_AutomationsStatus"}}]}},{"kind":"Field","name":{"kind":"Name","value":"version"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"model"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"versions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]}}]}},...ModelCardAutomationStatus_AutomationsStatusFragmentDoc.definitions]} as unknown as DocumentNode<OnModelVersionCardAutomationsStatusUpdatedSubscription, OnModelVersionCardAutomationsStatusUpdatedSubscriptionVariables>;
export const MentionsUserSearchDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MentionsUserSearch"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"query"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"emailOnly"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}},"defaultValue":{"kind":"BooleanValue","value":false}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userSearch"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"query"},"value":{"kind":"Variable","name":{"kind":"Name","value":"query"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"5"}},{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"NullValue"}},{"kind":"Argument","name":{"kind":"Name","value":"archived"},"value":{"kind":"BooleanValue","value":false}},{"kind":"Argument","name":{"kind":"Name","value":"emailOnly"},"value":{"kind":"Variable","name":{"kind":"Name","value":"emailOnly"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"company"}}]}}]}}]}}]} as unknown as DocumentNode<MentionsUserSearchQuery, MentionsUserSearchQueryVariables>;
export const UserSearchDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"UserSearch"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"query"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"archived"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userSearch"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"query"},"value":{"kind":"Variable","name":{"kind":"Name","value":"query"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}}},{"kind":"Argument","name":{"kind":"Name","value":"archived"},"value":{"kind":"Variable","name":{"kind":"Name","value":"archived"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"bio"}},{"kind":"Field","name":{"kind":"Name","value":"company"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"verified"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]}}]}}]} as unknown as DocumentNode<UserSearchQuery, UserSearchQueryVariables>;
export const ServerInfoBlobSizeLimitDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ServerInfoBlobSizeLimit"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"serverInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"blobSizeLimitBytes"}}]}}]}}]} as unknown as DocumentNode<ServerInfoBlobSizeLimitQuery, ServerInfoBlobSizeLimitQueryVariables>;
export const ServerInfoAllScopesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ServerInfoAllScopes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"serverInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"scopes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]}}]} as unknown as DocumentNode<ServerInfoAllScopesQuery, ServerInfoAllScopesQueryVariables>;
export const ProjectModelsSelectorValuesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectModelsSelectorValues"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"models"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"100"}},{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CommonModelSelectorModel"}}]}}]}}]}}]}},...CommonModelSelectorModelFragmentDoc.definitions]} as unknown as DocumentNode<ProjectModelsSelectorValuesQuery, ProjectModelsSelectorValuesQueryVariables>;
export const MainServerInfoDataDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MainServerInfoData"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"serverInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminContact"}},{"kind":"Field","name":{"kind":"Name","value":"blobSizeLimitBytes"}},{"kind":"Field","name":{"kind":"Name","value":"canonicalUrl"}},{"kind":"Field","name":{"kind":"Name","value":"company"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"guestModeEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"inviteOnly"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"termsOfService"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"automateUrl"}}]}}]}}]} as unknown as DocumentNode<MainServerInfoDataQuery, MainServerInfoDataQueryVariables>;
export const DeleteAccessTokenDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteAccessToken"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"token"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"apiTokenRevoke"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"token"},"value":{"kind":"Variable","name":{"kind":"Name","value":"token"}}}]}]}}]} as unknown as DocumentNode<DeleteAccessTokenMutation, DeleteAccessTokenMutationVariables>;
export const CreateAccessTokenDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateAccessToken"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"token"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ApiTokenCreateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"apiTokenCreate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"token"},"value":{"kind":"Variable","name":{"kind":"Name","value":"token"}}}]}]}}]} as unknown as DocumentNode<CreateAccessTokenMutation, CreateAccessTokenMutationVariables>;
export const DeleteApplicationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteApplication"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"appId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"appDelete"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"appId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"appId"}}}]}]}}]} as unknown as DocumentNode<DeleteApplicationMutation, DeleteApplicationMutationVariables>;
export const CreateApplicationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateApplication"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"app"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AppCreateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"appCreate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"app"},"value":{"kind":"Variable","name":{"kind":"Name","value":"app"}}}]}]}}]} as unknown as DocumentNode<CreateApplicationMutation, CreateApplicationMutationVariables>;
export const EditApplicationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"EditApplication"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"app"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AppUpdateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"appUpdate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"app"},"value":{"kind":"Variable","name":{"kind":"Name","value":"app"}}}]}]}}]} as unknown as DocumentNode<EditApplicationMutation, EditApplicationMutationVariables>;
export const DeveloperSettingsAccessTokensDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"DeveloperSettingsAccessTokens"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"apiTokens"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"lastUsed"}},{"kind":"Field","name":{"kind":"Name","value":"lastChars"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"scopes"}}]}}]}}]}}]} as unknown as DocumentNode<DeveloperSettingsAccessTokensQuery, DeveloperSettingsAccessTokensQueryVariables>;
export const DeveloperSettingsApplicationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"DeveloperSettingsApplications"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdApps"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"secret"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"redirectUrl"}},{"kind":"Field","name":{"kind":"Name","value":"scopes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<DeveloperSettingsApplicationsQuery, DeveloperSettingsApplicationsQueryVariables>;
export const SearchProjectsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SearchProjects"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"onlyWithRoles"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},"defaultValue":{"kind":"NullValue"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projects"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"10"}},{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"onlyWithRoles"},"value":{"kind":"Variable","name":{"kind":"Name","value":"onlyWithRoles"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FormSelectProjects_Project"}}]}}]}}]}}]}},...FormSelectProjects_ProjectFragmentDoc.definitions]} as unknown as DocumentNode<SearchProjectsQuery, SearchProjectsQueryVariables>;
export const CreateModelDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateModel"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateModelInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"modelMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"create"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageLatestItemsModelItem"}}]}}]}}]}},...ProjectPageLatestItemsModelItemFragmentDoc.definitions,...PendingFileUploadFragmentDoc.definitions,...ProjectPageModelsCardRenameDialogFragmentDoc.definitions,...ProjectPageModelsCardDeleteDialogFragmentDoc.definitions,...ProjectPageModelsActionsFragmentDoc.definitions,...ModelCardAutomationStatus_ModelFragmentDoc.definitions,...ModelCardAutomationStatus_AutomationsStatusFragmentDoc.definitions]} as unknown as DocumentNode<CreateModelMutation, CreateModelMutationVariables>;
export const CreateProjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateProject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ProjectCreateInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"create"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageProject"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectDashboardItem"}}]}}]}}]}},...ProjectPageProjectFragmentDoc.definitions,...ProjectPageProjectHeaderFragmentDoc.definitions,...ProjectPageStatsBlockTeamFragmentDoc.definitions,...LimitedUserAvatarFragmentDoc.definitions,...ProjectPageTeamDialogFragmentDoc.definitions,...ProjectPageStatsBlockVersionsFragmentDoc.definitions,...ProjectPageStatsBlockModelsFragmentDoc.definitions,...ProjectPageStatsBlockCommentsFragmentDoc.definitions,...ProjectPageLatestItemsModelsFragmentDoc.definitions,...ProjectPageLatestItemsCommentsFragmentDoc.definitions,...ProjectDashboardItemFragmentDoc.definitions,...ProjectDashboardItemNoModelsFragmentDoc.definitions,...ProjectPageModelsCardProjectFragmentDoc.definitions,...ProjectPageLatestItemsModelItemFragmentDoc.definitions,...PendingFileUploadFragmentDoc.definitions,...ProjectPageModelsCardRenameDialogFragmentDoc.definitions,...ProjectPageModelsCardDeleteDialogFragmentDoc.definitions,...ProjectPageModelsActionsFragmentDoc.definitions,...ModelCardAutomationStatus_ModelFragmentDoc.definitions,...ModelCardAutomationStatus_AutomationsStatusFragmentDoc.definitions]} as unknown as DocumentNode<CreateProjectMutation, CreateProjectMutationVariables>;
export const UpdateModelDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateModel"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateModelInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"modelMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"update"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageLatestItemsModelItem"}}]}}]}}]}},...ProjectPageLatestItemsModelItemFragmentDoc.definitions,...PendingFileUploadFragmentDoc.definitions,...ProjectPageModelsCardRenameDialogFragmentDoc.definitions,...ProjectPageModelsCardDeleteDialogFragmentDoc.definitions,...ProjectPageModelsActionsFragmentDoc.definitions,...ModelCardAutomationStatus_ModelFragmentDoc.definitions,...ModelCardAutomationStatus_AutomationsStatusFragmentDoc.definitions]} as unknown as DocumentNode<UpdateModelMutation, UpdateModelMutationVariables>;
export const DeleteModelDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteModel"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DeleteModelInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"modelMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"delete"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]}}]} as unknown as DocumentNode<DeleteModelMutation, DeleteModelMutationVariables>;
export const UpdateProjectRoleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateProjectRole"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ProjectUpdateRoleInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateRole"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}}]}}]}}]}}]}}]}},...LimitedUserAvatarFragmentDoc.definitions]} as unknown as DocumentNode<UpdateProjectRoleMutation, UpdateProjectRoleMutationVariables>;
export const InviteProjectUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"InviteProjectUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ProjectInviteCreateInput"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"invites"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"batchCreate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageTeamDialog"}}]}}]}}]}}]}},...ProjectPageTeamDialogFragmentDoc.definitions,...LimitedUserAvatarFragmentDoc.definitions]} as unknown as DocumentNode<InviteProjectUserMutation, InviteProjectUserMutationVariables>;
export const CancelProjectInviteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CancelProjectInvite"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"inviteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"invites"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cancel"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}},{"kind":"Argument","name":{"kind":"Name","value":"inviteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"inviteId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageTeamDialog"}}]}}]}}]}}]}},...ProjectPageTeamDialogFragmentDoc.definitions,...LimitedUserAvatarFragmentDoc.definitions]} as unknown as DocumentNode<CancelProjectInviteMutation, CancelProjectInviteMutationVariables>;
export const UpdateProjectMetadataDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateProjectMetadata"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"update"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ProjectUpdateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"update"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"update"},"value":{"kind":"Variable","name":{"kind":"Name","value":"update"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectUpdatableMetadata"}}]}}]}}]}},...ProjectUpdatableMetadataFragmentDoc.definitions]} as unknown as DocumentNode<UpdateProjectMetadataMutation, UpdateProjectMetadataMutationVariables>;
export const DeleteProjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteProject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"delete"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]}}]} as unknown as DocumentNode<DeleteProjectMutation, DeleteProjectMutationVariables>;
export const UseProjectInviteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UseProjectInvite"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ProjectInviteUseInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"invites"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"use"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]}}]}}]} as unknown as DocumentNode<UseProjectInviteMutation, UseProjectInviteMutationVariables>;
export const LeaveProjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"LeaveProject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"leave"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}]}]}}]}}]} as unknown as DocumentNode<LeaveProjectMutation, LeaveProjectMutationVariables>;
export const DeleteVersionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteVersions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DeleteVersionsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"versionMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"delete"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]}}]} as unknown as DocumentNode<DeleteVersionsMutation, DeleteVersionsMutationVariables>;
export const MoveVersionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MoveVersions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MoveVersionsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"versionMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"moveToModel"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<MoveVersionsMutation, MoveVersionsMutationVariables>;
export const UpdateVersionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateVersion"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateVersionInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"versionMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"update"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateVersionMutation, UpdateVersionMutationVariables>;
export const DeleteWebhookDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"deleteWebhook"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"webhook"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"WebhookDeleteInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"webhookDelete"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"webhook"},"value":{"kind":"Variable","name":{"kind":"Name","value":"webhook"}}}]}]}}]} as unknown as DocumentNode<DeleteWebhookMutation, DeleteWebhookMutationVariables>;
export const CreateWebhookDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createWebhook"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"webhook"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"WebhookCreateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"webhookCreate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"webhook"},"value":{"kind":"Variable","name":{"kind":"Name","value":"webhook"}}}]}]}}]} as unknown as DocumentNode<CreateWebhookMutation, CreateWebhookMutationVariables>;
export const UpdateWebhookDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updateWebhook"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"webhook"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"WebhookUpdateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"webhookUpdate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"webhook"},"value":{"kind":"Variable","name":{"kind":"Name","value":"webhook"}}}]}]}}]} as unknown as DocumentNode<UpdateWebhookMutation, UpdateWebhookMutationVariables>;
export const ProjectAccessCheckDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectAccessCheck"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<ProjectAccessCheckQuery, ProjectAccessCheckQueryVariables>;
export const ProjectsDashboardQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectsDashboardQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"UserProjectsFilter"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"projects"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"6"}},{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectDashboardItem"}}]}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsInviteBanners"}}]}}]}},...ProjectDashboardItemFragmentDoc.definitions,...ProjectDashboardItemNoModelsFragmentDoc.definitions,...ProjectPageModelsCardProjectFragmentDoc.definitions,...ProjectPageLatestItemsModelItemFragmentDoc.definitions,...PendingFileUploadFragmentDoc.definitions,...ProjectPageModelsCardRenameDialogFragmentDoc.definitions,...ProjectPageModelsCardDeleteDialogFragmentDoc.definitions,...ProjectPageModelsActionsFragmentDoc.definitions,...ModelCardAutomationStatus_ModelFragmentDoc.definitions,...ModelCardAutomationStatus_AutomationsStatusFragmentDoc.definitions,...ProjectsInviteBannersFragmentDoc.definitions,...ProjectsInviteBannerFragmentDoc.definitions,...LimitedUserAvatarFragmentDoc.definitions]} as unknown as DocumentNode<ProjectsDashboardQueryQuery, ProjectsDashboardQueryQueryVariables>;
export const ProjectPageQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectPageQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"token"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageProject"}}]}},{"kind":"Field","name":{"kind":"Name","value":"projectInvite"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"token"},"value":{"kind":"Variable","name":{"kind":"Name","value":"token"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsInviteBanner"}}]}}]}},...ProjectPageProjectFragmentDoc.definitions,...ProjectPageProjectHeaderFragmentDoc.definitions,...ProjectPageStatsBlockTeamFragmentDoc.definitions,...LimitedUserAvatarFragmentDoc.definitions,...ProjectPageTeamDialogFragmentDoc.definitions,...ProjectPageStatsBlockVersionsFragmentDoc.definitions,...ProjectPageStatsBlockModelsFragmentDoc.definitions,...ProjectPageStatsBlockCommentsFragmentDoc.definitions,...ProjectPageLatestItemsModelsFragmentDoc.definitions,...ProjectPageLatestItemsCommentsFragmentDoc.definitions,...ProjectsInviteBannerFragmentDoc.definitions]} as unknown as DocumentNode<ProjectPageQueryQuery, ProjectPageQueryQueryVariables>;
export const ProjectLatestModelsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectLatestModels"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ProjectModelsFilter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"models"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"NullValue"}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"16"}},{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageLatestItemsModelItem"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pendingImportedModels"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PendingFileUpload"}}]}}]}}]}},...ProjectPageLatestItemsModelItemFragmentDoc.definitions,...PendingFileUploadFragmentDoc.definitions,...ProjectPageModelsCardRenameDialogFragmentDoc.definitions,...ProjectPageModelsCardDeleteDialogFragmentDoc.definitions,...ProjectPageModelsActionsFragmentDoc.definitions,...ModelCardAutomationStatus_ModelFragmentDoc.definitions,...ModelCardAutomationStatus_AutomationsStatusFragmentDoc.definitions]} as unknown as DocumentNode<ProjectLatestModelsQuery, ProjectLatestModelsQueryVariables>;
export const ProjectLatestModelsPaginationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectLatestModelsPagination"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ProjectModelsFilter"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"defaultValue":{"kind":"NullValue"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"models"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"16"}},{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageLatestItemsModelItem"}}]}}]}}]}}]}},...ProjectPageLatestItemsModelItemFragmentDoc.definitions,...PendingFileUploadFragmentDoc.definitions,...ProjectPageModelsCardRenameDialogFragmentDoc.definitions,...ProjectPageModelsCardDeleteDialogFragmentDoc.definitions,...ProjectPageModelsActionsFragmentDoc.definitions,...ModelCardAutomationStatus_ModelFragmentDoc.definitions,...ModelCardAutomationStatus_AutomationsStatusFragmentDoc.definitions]} as unknown as DocumentNode<ProjectLatestModelsPaginationQuery, ProjectLatestModelsPaginationQueryVariables>;
export const ProjectModelsTreeTopLevelDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectModelsTreeTopLevel"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ProjectModelsTreeFilter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"modelsTree"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"NullValue"}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"8"}},{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SingleLevelModelTreeItem"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pendingImportedModels"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PendingFileUpload"}}]}}]}}]}},...SingleLevelModelTreeItemFragmentDoc.definitions,...ProjectPageLatestItemsModelItemFragmentDoc.definitions,...PendingFileUploadFragmentDoc.definitions,...ProjectPageModelsCardRenameDialogFragmentDoc.definitions,...ProjectPageModelsCardDeleteDialogFragmentDoc.definitions,...ProjectPageModelsActionsFragmentDoc.definitions,...ModelCardAutomationStatus_ModelFragmentDoc.definitions,...ModelCardAutomationStatus_AutomationsStatusFragmentDoc.definitions]} as unknown as DocumentNode<ProjectModelsTreeTopLevelQuery, ProjectModelsTreeTopLevelQueryVariables>;
export const ProjectModelsTreeTopLevelPaginationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectModelsTreeTopLevelPagination"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ProjectModelsTreeFilter"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"defaultValue":{"kind":"NullValue"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"modelsTree"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"8"}},{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SingleLevelModelTreeItem"}}]}}]}}]}}]}},...SingleLevelModelTreeItemFragmentDoc.definitions,...ProjectPageLatestItemsModelItemFragmentDoc.definitions,...PendingFileUploadFragmentDoc.definitions,...ProjectPageModelsCardRenameDialogFragmentDoc.definitions,...ProjectPageModelsCardDeleteDialogFragmentDoc.definitions,...ProjectPageModelsActionsFragmentDoc.definitions,...ModelCardAutomationStatus_ModelFragmentDoc.definitions,...ModelCardAutomationStatus_AutomationsStatusFragmentDoc.definitions]} as unknown as DocumentNode<ProjectModelsTreeTopLevelPaginationQuery, ProjectModelsTreeTopLevelPaginationQueryVariables>;
export const ProjectModelChildrenTreeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectModelChildrenTree"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"parentName"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"modelChildrenTree"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"fullName"},"value":{"kind":"Variable","name":{"kind":"Name","value":"parentName"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SingleLevelModelTreeItem"}}]}}]}}]}},...SingleLevelModelTreeItemFragmentDoc.definitions,...ProjectPageLatestItemsModelItemFragmentDoc.definitions,...PendingFileUploadFragmentDoc.definitions,...ProjectPageModelsCardRenameDialogFragmentDoc.definitions,...ProjectPageModelsCardDeleteDialogFragmentDoc.definitions,...ProjectPageModelsActionsFragmentDoc.definitions,...ModelCardAutomationStatus_ModelFragmentDoc.definitions,...ModelCardAutomationStatus_AutomationsStatusFragmentDoc.definitions]} as unknown as DocumentNode<ProjectModelChildrenTreeQuery, ProjectModelChildrenTreeQueryVariables>;
export const ProjectLatestCommentThreadsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectLatestCommentThreads"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"defaultValue":{"kind":"NullValue"}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ProjectCommentsFilter"}},"defaultValue":{"kind":"NullValue"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"commentThreads"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"8"}},{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageLatestItemsCommentItem"}}]}}]}}]}}]}},...ProjectPageLatestItemsCommentItemFragmentDoc.definitions,...FormUsersSelectItemFragmentDoc.definitions]} as unknown as DocumentNode<ProjectLatestCommentThreadsQuery, ProjectLatestCommentThreadsQueryVariables>;
export const ProjectInviteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectInvite"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"token"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectInvite"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}},{"kind":"Argument","name":{"kind":"Name","value":"token"},"value":{"kind":"Variable","name":{"kind":"Name","value":"token"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsInviteBanner"}}]}}]}},...ProjectsInviteBannerFragmentDoc.definitions,...LimitedUserAvatarFragmentDoc.definitions]} as unknown as DocumentNode<ProjectInviteQuery, ProjectInviteQueryVariables>;
export const ProjectModelCheckDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectModelCheck"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"modelId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"model"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"modelId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<ProjectModelCheckQuery, ProjectModelCheckQueryVariables>;
export const ProjectModelPageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectModelPage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"modelId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"versionsCursor"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectModelPageHeaderProject"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectModelPageVersionsProject"}}]}}]}},...ProjectModelPageHeaderProjectFragmentDoc.definitions,...ProjectModelPageVersionsProjectFragmentDoc.definitions,...ProjectPageProjectHeaderFragmentDoc.definitions,...PendingFileUploadFragmentDoc.definitions,...ProjectModelPageVersionsPaginationFragmentDoc.definitions,...ProjectModelPageVersionsCardVersionFragmentDoc.definitions,...LimitedUserAvatarFragmentDoc.definitions,...ProjectModelPageDialogDeleteVersionFragmentDoc.definitions,...ProjectModelPageDialogMoveToVersionFragmentDoc.definitions,...ModelCardAutomationStatus_VersionFragmentDoc.definitions,...ModelCardAutomationStatus_AutomationsStatusFragmentDoc.definitions]} as unknown as DocumentNode<ProjectModelPageQuery, ProjectModelPageQueryVariables>;
export const ProjectModelVersionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectModelVersions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"modelId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"versionsCursor"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectModelPageVersionsPagination"}}]}}]}},...ProjectModelPageVersionsPaginationFragmentDoc.definitions,...ProjectModelPageVersionsCardVersionFragmentDoc.definitions,...LimitedUserAvatarFragmentDoc.definitions,...ProjectModelPageDialogDeleteVersionFragmentDoc.definitions,...ProjectModelPageDialogMoveToVersionFragmentDoc.definitions,...ModelCardAutomationStatus_VersionFragmentDoc.definitions,...ModelCardAutomationStatus_AutomationsStatusFragmentDoc.definitions]} as unknown as DocumentNode<ProjectModelVersionsQuery, ProjectModelVersionsQueryVariables>;
export const ProjectModelsPageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectModelsPage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectModelsPageHeader_Project"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectModelsPageResults_Project"}}]}}]}},...ProjectModelsPageHeader_ProjectFragmentDoc.definitions,...FormUsersSelectItemFragmentDoc.definitions,...ProjectModelsPageResults_ProjectFragmentDoc.definitions,...ProjectPageLatestItemsModelsFragmentDoc.definitions]} as unknown as DocumentNode<ProjectModelsPageQuery, ProjectModelsPageQueryVariables>;
export const ProjectDiscussionsPageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectDiscussionsPage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectDiscussionsPageHeader_Project"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectDiscussionsPageResults_Project"}}]}}]}},...ProjectDiscussionsPageHeader_ProjectFragmentDoc.definitions,...ProjectDiscussionsPageResults_ProjectFragmentDoc.definitions]} as unknown as DocumentNode<ProjectDiscussionsPageQuery, ProjectDiscussionsPageQueryVariables>;
export const ProjectWebhooksDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectWebhooks"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"webhooks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"streamId"}},{"kind":"Field","name":{"kind":"Name","value":"triggers"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"history"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"5"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"statusInfo"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}}]}}]} as unknown as DocumentNode<ProjectWebhooksQuery, ProjectWebhooksQueryVariables>;
export const BlobDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Blob"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"blobId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stream"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"blob"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"blobId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}},{"kind":"Field","name":{"kind":"Name","value":"fileType"}},{"kind":"Field","name":{"kind":"Name","value":"fileSize"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]}}]} as unknown as DocumentNode<BlobQuery, BlobQueryVariables>;
export const OnProjectUpdatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"OnProjectUpdated"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectUpdated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"project"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageProject"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectDashboardItemNoModels"}}]}}]}}]}},...ProjectPageProjectFragmentDoc.definitions,...ProjectPageProjectHeaderFragmentDoc.definitions,...ProjectPageStatsBlockTeamFragmentDoc.definitions,...LimitedUserAvatarFragmentDoc.definitions,...ProjectPageTeamDialogFragmentDoc.definitions,...ProjectPageStatsBlockVersionsFragmentDoc.definitions,...ProjectPageStatsBlockModelsFragmentDoc.definitions,...ProjectPageStatsBlockCommentsFragmentDoc.definitions,...ProjectPageLatestItemsModelsFragmentDoc.definitions,...ProjectPageLatestItemsCommentsFragmentDoc.definitions,...ProjectDashboardItemNoModelsFragmentDoc.definitions,...ProjectPageModelsCardProjectFragmentDoc.definitions]} as unknown as DocumentNode<OnProjectUpdatedSubscription, OnProjectUpdatedSubscriptionVariables>;
export const OnProjectModelsUpdateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"OnProjectModelsUpdate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectModelsUpdated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"model"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"versions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"referencedObject"}}]}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageLatestItemsModelItem"}}]}}]}}]}},...ProjectPageLatestItemsModelItemFragmentDoc.definitions,...PendingFileUploadFragmentDoc.definitions,...ProjectPageModelsCardRenameDialogFragmentDoc.definitions,...ProjectPageModelsCardDeleteDialogFragmentDoc.definitions,...ProjectPageModelsActionsFragmentDoc.definitions,...ModelCardAutomationStatus_ModelFragmentDoc.definitions,...ModelCardAutomationStatus_AutomationsStatusFragmentDoc.definitions]} as unknown as DocumentNode<OnProjectModelsUpdateSubscription, OnProjectModelsUpdateSubscriptionVariables>;
export const OnProjectVersionsUpdateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"OnProjectVersionsUpdate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectVersionsUpdated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"modelId"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"version"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ViewerModelVersionCardItem"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectModelPageVersionsCardVersion"}},{"kind":"Field","name":{"kind":"Name","value":"model"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageLatestItemsModelItem"}}]}}]}}]}}]}},...ViewerModelVersionCardItemFragmentDoc.definitions,...LimitedUserAvatarFragmentDoc.definitions,...ProjectModelPageVersionsCardVersionFragmentDoc.definitions,...ProjectModelPageDialogDeleteVersionFragmentDoc.definitions,...ProjectModelPageDialogMoveToVersionFragmentDoc.definitions,...ModelCardAutomationStatus_VersionFragmentDoc.definitions,...ModelCardAutomationStatus_AutomationsStatusFragmentDoc.definitions,...ProjectPageLatestItemsModelItemFragmentDoc.definitions,...PendingFileUploadFragmentDoc.definitions,...ProjectPageModelsCardRenameDialogFragmentDoc.definitions,...ProjectPageModelsCardDeleteDialogFragmentDoc.definitions,...ProjectPageModelsActionsFragmentDoc.definitions,...ModelCardAutomationStatus_ModelFragmentDoc.definitions]} as unknown as DocumentNode<OnProjectVersionsUpdateSubscription, OnProjectVersionsUpdateSubscriptionVariables>;
export const OnProjectVersionsPreviewGeneratedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"OnProjectVersionsPreviewGenerated"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectVersionsPreviewGenerated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"objectId"}},{"kind":"Field","name":{"kind":"Name","value":"versionId"}}]}}]}}]} as unknown as DocumentNode<OnProjectVersionsPreviewGeneratedSubscription, OnProjectVersionsPreviewGeneratedSubscriptionVariables>;
export const OnProjectPendingModelsUpdatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"OnProjectPendingModelsUpdated"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectPendingModelsUpdated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"model"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PendingFileUpload"}},{"kind":"Field","name":{"kind":"Name","value":"model"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageLatestItemsModelItem"}}]}}]}}]}}]}},...PendingFileUploadFragmentDoc.definitions,...ProjectPageLatestItemsModelItemFragmentDoc.definitions,...ProjectPageModelsCardRenameDialogFragmentDoc.definitions,...ProjectPageModelsCardDeleteDialogFragmentDoc.definitions,...ProjectPageModelsActionsFragmentDoc.definitions,...ModelCardAutomationStatus_ModelFragmentDoc.definitions,...ModelCardAutomationStatus_AutomationsStatusFragmentDoc.definitions]} as unknown as DocumentNode<OnProjectPendingModelsUpdatedSubscription, OnProjectPendingModelsUpdatedSubscriptionVariables>;
export const OnProjectPendingVersionsUpdatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"OnProjectPendingVersionsUpdated"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectPendingVersionsUpdated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"version"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PendingFileUpload"}},{"kind":"Field","name":{"kind":"Name","value":"model"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageLatestItemsModelItem"}}]}}]}}]}}]}},...PendingFileUploadFragmentDoc.definitions,...ProjectPageLatestItemsModelItemFragmentDoc.definitions,...ProjectPageModelsCardRenameDialogFragmentDoc.definitions,...ProjectPageModelsCardDeleteDialogFragmentDoc.definitions,...ProjectPageModelsActionsFragmentDoc.definitions,...ModelCardAutomationStatus_ModelFragmentDoc.definitions,...ModelCardAutomationStatus_AutomationsStatusFragmentDoc.definitions]} as unknown as DocumentNode<OnProjectPendingVersionsUpdatedSubscription, OnProjectPendingVersionsUpdatedSubscriptionVariables>;
export const ServerInfoUpdateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ServerInfoUpdate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"info"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ServerInfoUpdateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"serverInfoUpdate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"info"},"value":{"kind":"Variable","name":{"kind":"Name","value":"info"}}}]}]}}]} as unknown as DocumentNode<ServerInfoUpdateMutation, ServerInfoUpdateMutationVariables>;
export const AdminPanelDeleteUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminPanelDeleteUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userConfirmation"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UserDeleteInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminDeleteUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userConfirmation"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userConfirmation"}}}]}]}}]} as unknown as DocumentNode<AdminPanelDeleteUserMutation, AdminPanelDeleteUserMutationVariables>;
export const AdminPanelDeleteProjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminPanelDeleteProject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ids"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"streamsDelete"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"ids"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ids"}}}]}]}}]} as unknown as DocumentNode<AdminPanelDeleteProjectMutation, AdminPanelDeleteProjectMutationVariables>;
export const AdminPanelResendInviteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminPanelResendInvite"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"inviteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"inviteResend"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"inviteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"inviteId"}}}]}]}}]} as unknown as DocumentNode<AdminPanelResendInviteMutation, AdminPanelResendInviteMutationVariables>;
export const AdminPanelDeleteInviteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminPanelDeleteInvite"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"inviteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"inviteDelete"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"inviteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"inviteId"}}}]}]}}]} as unknown as DocumentNode<AdminPanelDeleteInviteMutation, AdminPanelDeleteInviteMutationVariables>;
export const AdminChangeUseRoleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminChangeUseRole"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userRoleInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UserRoleInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userRoleChange"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userRoleInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userRoleInput"}}}]}]}}]} as unknown as DocumentNode<AdminChangeUseRoleMutation, AdminChangeUseRoleMutationVariables>;
export const ServerManagementDataPageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ServerManagementDataPage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"admin"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userList"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"projectList"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"inviteList"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"serverInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"version"}}]}}]}}]} as unknown as DocumentNode<ServerManagementDataPageQuery, ServerManagementDataPageQueryVariables>;
export const ServerSettingsDialogDataDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ServerSettingsDialogData"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"serverInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"adminContact"}},{"kind":"Field","name":{"kind":"Name","value":"company"}},{"kind":"Field","name":{"kind":"Name","value":"termsOfService"}},{"kind":"Field","name":{"kind":"Name","value":"inviteOnly"}},{"kind":"Field","name":{"kind":"Name","value":"guestModeEnabled"}}]}}]}}]} as unknown as DocumentNode<ServerSettingsDialogDataQuery, ServerSettingsDialogDataQueryVariables>;
export const AdminPanelUsersListDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminPanelUsersList"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"query"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"admin"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userList"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}}},{"kind":"Argument","name":{"kind":"Name","value":"query"},"value":{"kind":"Variable","name":{"kind":"Name","value":"query"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"verified"}},{"kind":"Field","name":{"kind":"Name","value":"company"}}]}}]}}]}}]}}]} as unknown as DocumentNode<AdminPanelUsersListQuery, AdminPanelUsersListQueryVariables>;
export const AdminPanelProjectsListDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminPanelProjectsList"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"query"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"visibility"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"admin"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectList"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"query"},"value":{"kind":"Variable","name":{"kind":"Name","value":"query"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"visibility"},"value":{"kind":"Variable","name":{"kind":"Name","value":"visibility"}}},{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"models"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"versions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}}]}}]}}]}}]} as unknown as DocumentNode<AdminPanelProjectsListQuery, AdminPanelProjectsListQueryVariables>;
export const AdminPanelInvitesListDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminPanelInvitesList"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"query"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"admin"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"inviteList"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}}},{"kind":"Argument","name":{"kind":"Name","value":"query"},"value":{"kind":"Variable","name":{"kind":"Name","value":"query"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"invitedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}}]}}]} as unknown as DocumentNode<AdminPanelInvitesListQuery, AdminPanelInvitesListQueryVariables>;
export const InviteServerUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"InviteServerUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ServerInviteCreateInput"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"serverInviteBatchCreate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<InviteServerUserMutation, InviteServerUserMutationVariables>;
export const UpdateUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UserUpdateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeUserMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"update"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"user"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"bio"}},{"kind":"Field","name":{"kind":"Name","value":"company"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateUserMutation, UpdateUserMutationVariables>;
export const UpdateNotificationPreferencesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateNotificationPreferences"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"JSONObject"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userNotificationPreferencesUpdate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"preferences"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<UpdateNotificationPreferencesMutation, UpdateNotificationPreferencesMutationVariables>;
export const DeleteAccountDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteAccount"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UserDeleteInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userDelete"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userConfirmation"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<DeleteAccountMutation, DeleteAccountMutationVariables>;
export const ProfileEditDialogDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProfileEditDialog"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserProfileEditDialogBio_User"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserProfileEditDialogNotificationPreferences_User"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserProfileEditDialogDeleteAccount_User"}}]}}]}},...UserProfileEditDialogBio_UserFragmentDoc.definitions,...UserProfileEditDialogAvatar_UserFragmentDoc.definitions,...ActiveUserAvatarFragmentDoc.definitions,...UserProfileEditDialogNotificationPreferences_UserFragmentDoc.definitions,...UserProfileEditDialogDeleteAccount_UserFragmentDoc.definitions]} as unknown as DocumentNode<ProfileEditDialogQuery, ProfileEditDialogQueryVariables>;
export const BroadcastViewerUserActivityDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"BroadcastViewerUserActivity"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"resourceIdString"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"message"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ViewerUserActivityMessageInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"broadcastViewerUserActivity"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}},{"kind":"Argument","name":{"kind":"Name","value":"resourceIdString"},"value":{"kind":"Variable","name":{"kind":"Name","value":"resourceIdString"}}},{"kind":"Argument","name":{"kind":"Name","value":"message"},"value":{"kind":"Variable","name":{"kind":"Name","value":"message"}}}]}]}}]} as unknown as DocumentNode<BroadcastViewerUserActivityMutation, BroadcastViewerUserActivityMutationVariables>;
export const MarkCommentViewedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MarkCommentViewed"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"threadId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"commentMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markViewed"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"commentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"threadId"}}}]}]}}]}}]} as unknown as DocumentNode<MarkCommentViewedMutation, MarkCommentViewedMutationVariables>;
export const CreateCommentThreadDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateCommentThread"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateCommentInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"commentMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"create"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ViewerCommentThread"}}]}}]}}]}},...ViewerCommentThreadFragmentDoc.definitions,...ViewerCommentsListItemFragmentDoc.definitions,...LimitedUserAvatarFragmentDoc.definitions,...ViewerCommentsReplyItemFragmentDoc.definitions,...ThreadCommentAttachmentFragmentDoc.definitions,...FormUsersSelectItemFragmentDoc.definitions,...ViewerCommentBubblesDataFragmentDoc.definitions]} as unknown as DocumentNode<CreateCommentThreadMutation, CreateCommentThreadMutationVariables>;
export const CreateCommentReplyDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateCommentReply"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateCommentReplyInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"commentMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"reply"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ViewerCommentsReplyItem"}}]}}]}}]}},...ViewerCommentsReplyItemFragmentDoc.definitions,...LimitedUserAvatarFragmentDoc.definitions,...ThreadCommentAttachmentFragmentDoc.definitions]} as unknown as DocumentNode<CreateCommentReplyMutation, CreateCommentReplyMutationVariables>;
export const ArchiveCommentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ArchiveComment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"commentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"archived"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"commentMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"archive"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"commentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"commentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"archived"},"value":{"kind":"Variable","name":{"kind":"Name","value":"archived"}}}]}]}}]}}]} as unknown as DocumentNode<ArchiveCommentMutation, ArchiveCommentMutationVariables>;
export const ProjectViewerResourcesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectViewerResources"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"resourceUrlString"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"viewerResources"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"resourceIdString"},"value":{"kind":"Variable","name":{"kind":"Name","value":"resourceUrlString"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"identifier"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"modelId"}},{"kind":"Field","name":{"kind":"Name","value":"versionId"}},{"kind":"Field","name":{"kind":"Name","value":"objectId"}}]}}]}}]}}]}}]} as unknown as DocumentNode<ProjectViewerResourcesQuery, ProjectViewerResourcesQueryVariables>;
export const ViewerLoadedResourcesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ViewerLoadedResources"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"modelIds"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"versionIds"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"models"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"ids"},"value":{"kind":"Variable","name":{"kind":"Name","value":"modelIds"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","alias":{"kind":"Name","value":"loadedVersion"},"name":{"kind":"Name","value":"versions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"priorityIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"versionIds"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"priorityIdsOnly"},"value":{"kind":"BooleanValue","value":true}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ViewerModelVersionCardItem"}},{"kind":"Field","name":{"kind":"Name","value":"automationStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"statusMessage"}},{"kind":"Field","name":{"kind":"Name","value":"automationRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"automationId"}},{"kind":"Field","name":{"kind":"Name","value":"automationName"}},{"kind":"Field","name":{"kind":"Name","value":"versionId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"functionRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"functionId"}},{"kind":"Field","name":{"kind":"Name","value":"functionName"}},{"kind":"Field","name":{"kind":"Name","value":"functionLogo"}},{"kind":"Field","name":{"kind":"Name","value":"resultVersions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"referencedObject"}},{"kind":"Field","name":{"kind":"Name","value":"model"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"elapsed"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"contextView"}},{"kind":"Field","name":{"kind":"Name","value":"statusMessage"}},{"kind":"Field","name":{"kind":"Name","value":"results"}}]}}]}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"versions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"5"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ViewerModelVersionCardItem"}}]}}]}}]}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageLatestItemsModels"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ModelPageProject"}}]}}]}},...ViewerModelVersionCardItemFragmentDoc.definitions,...LimitedUserAvatarFragmentDoc.definitions,...ProjectPageLatestItemsModelsFragmentDoc.definitions,...ModelPageProjectFragmentDoc.definitions]} as unknown as DocumentNode<ViewerLoadedResourcesQuery, ViewerLoadedResourcesQueryVariables>;
export const ViewerModelVersionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ViewerModelVersions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"modelId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"versionsCursor"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"model"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"modelId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"versions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"Variable","name":{"kind":"Name","value":"versionsCursor"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"5"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ViewerModelVersionCardItem"}}]}}]}}]}}]}}]}},...ViewerModelVersionCardItemFragmentDoc.definitions,...LimitedUserAvatarFragmentDoc.definitions]} as unknown as DocumentNode<ViewerModelVersionsQuery, ViewerModelVersionsQueryVariables>;
export const ViewerDiffVersionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ViewerDiffVersions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"modelId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"versionAId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"versionBId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"model"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"modelId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","alias":{"kind":"Name","value":"versionA"},"name":{"kind":"Name","value":"version"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"versionAId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ViewerModelVersionCardItem"}}]}},{"kind":"Field","alias":{"kind":"Name","value":"versionB"},"name":{"kind":"Name","value":"version"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"versionBId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ViewerModelVersionCardItem"}}]}}]}}]}}]}},...ViewerModelVersionCardItemFragmentDoc.definitions,...LimitedUserAvatarFragmentDoc.definitions]} as unknown as DocumentNode<ViewerDiffVersionsQuery, ViewerDiffVersionsQueryVariables>;
export const ViewerLoadedThreadsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ViewerLoadedThreads"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ProjectCommentsFilter"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"25"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"commentThreads"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}},{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"totalArchivedCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ViewerCommentThread"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"LinkableComment"}}]}}]}}]}}]}},...ViewerCommentThreadFragmentDoc.definitions,...ViewerCommentsListItemFragmentDoc.definitions,...LimitedUserAvatarFragmentDoc.definitions,...ViewerCommentsReplyItemFragmentDoc.definitions,...ThreadCommentAttachmentFragmentDoc.definitions,...FormUsersSelectItemFragmentDoc.definitions,...ViewerCommentBubblesDataFragmentDoc.definitions,...LinkableCommentFragmentDoc.definitions]} as unknown as DocumentNode<ViewerLoadedThreadsQuery, ViewerLoadedThreadsQueryVariables>;
export const OnViewerUserActivityBroadcastedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"OnViewerUserActivityBroadcasted"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"target"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ViewerUpdateTrackingTarget"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sessionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"viewerUserActivityBroadcasted"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"target"},"value":{"kind":"Variable","name":{"kind":"Name","value":"target"}}},{"kind":"Argument","name":{"kind":"Name","value":"sessionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sessionId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userName"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}}]}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"sessionId"}}]}}]}},...LimitedUserAvatarFragmentDoc.definitions]} as unknown as DocumentNode<OnViewerUserActivityBroadcastedSubscription, OnViewerUserActivityBroadcastedSubscriptionVariables>;
export const OnViewerCommentsUpdatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"OnViewerCommentsUpdated"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"target"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ViewerUpdateTrackingTarget"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectCommentsUpdated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"target"},"value":{"kind":"Variable","name":{"kind":"Name","value":"target"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"comment"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ViewerCommentThread"}}]}}]}}]}},...ViewerCommentThreadFragmentDoc.definitions,...ViewerCommentsListItemFragmentDoc.definitions,...LimitedUserAvatarFragmentDoc.definitions,...ViewerCommentsReplyItemFragmentDoc.definitions,...ThreadCommentAttachmentFragmentDoc.definitions,...FormUsersSelectItemFragmentDoc.definitions,...ViewerCommentBubblesDataFragmentDoc.definitions]} as unknown as DocumentNode<OnViewerCommentsUpdatedSubscription, OnViewerCommentsUpdatedSubscriptionVariables>;
export const LegacyBranchRedirectMetadataDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"LegacyBranchRedirectMetadata"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"branchName"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stream"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"branch"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"branchName"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<LegacyBranchRedirectMetadataQuery, LegacyBranchRedirectMetadataQueryVariables>;
export const LegacyViewerCommitRedirectMetadataDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"LegacyViewerCommitRedirectMetadata"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"commitId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stream"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"commit"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"commitId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"branch"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]}}]} as unknown as DocumentNode<LegacyViewerCommitRedirectMetadataQuery, LegacyViewerCommitRedirectMetadataQueryVariables>;
export const ResolveCommentLinkDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ResolveCommentLink"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"commentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"comment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"commentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"streamId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LinkableComment"}}]}}]}},...LinkableCommentFragmentDoc.definitions]} as unknown as DocumentNode<ResolveCommentLinkQuery, ResolveCommentLinkQueryVariables>;