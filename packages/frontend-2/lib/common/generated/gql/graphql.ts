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
  id?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
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
  data?: Maybe<CommentViewerData>;
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

export type CommentDataInput = {
  /**
   * An array representing a user's camera position:
   * [camPos.x, camPos.y, camPos.z, camTarget.x, camTarget.y, camTarget.z, isOrtho, zoomNumber]
   */
  camPos: Array<Scalars['Float']>;
  /** Old FE LocalFilterState type */
  filters: CommentDataFiltersInput;
  /** THREE.Vector3 {x, y, z} */
  location: Scalars['JSONObject'];
  /** Viewer.getCurrentSectionBox(): THREE.Box3 */
  sectionBox?: InputMaybe<Scalars['JSONObject']>;
  /** Currently unused. Ideally comments should keep track of selected objects. */
  selection?: InputMaybe<Scalars['JSONObject']>;
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

export type CommentViewerData = {
  __typename?: 'CommentViewerData';
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

export type Commit = {
  __typename?: 'Commit';
  /** All the recent activity on this commit in chronological order */
  activity?: Maybe<ActivityCollection>;
  authorAvatar?: Maybe<Scalars['String']>;
  authorId?: Maybe<Scalars['String']>;
  authorName?: Maybe<Scalars['String']>;
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
  viewerData: CommentDataInput;
};

export type CreateCommentReplyInput = {
  content: CommentContentInput;
  threadId: Scalars['String'];
};

export type CreateModelInput = {
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
  branchName?: Maybe<Scalars['String']>;
  /** If present, the conversion result is stored in this commit. */
  convertedCommitId?: Maybe<Scalars['String']>;
  convertedLastUpdate: Scalars['DateTime'];
  /** Holds any errors or info. */
  convertedMessage?: Maybe<Scalars['String']>;
  /** 0 = queued, 1 = processing, 2 = success, 3 = error */
  convertedStatus: Scalars['Int'];
  fileName: Scalars['String'];
  fileSize: Scalars['Int'];
  fileType: Scalars['String'];
  id: Scalars['String'];
  streamId: Scalars['String'];
  uploadComplete: Scalars['Boolean'];
  uploadDate: Scalars['DateTime'];
  /** The user's id that uploaded this file. */
  userId: Scalars['String'];
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
  previewUrl?: Maybe<Scalars['String']>;
  updatedAt: Scalars['DateTime'];
  version?: Maybe<Version>;
  versions: VersionCollection;
};


export type ModelCommentThreadsArgs = {
  cursor?: InputMaybe<Scalars['String']>;
  limit?: Scalars['Int'];
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
  /** Revokes (deletes) an personal api token. */
  apiTokenRevoke: Scalars['Boolean'];
  /** Register a new third party application. */
  appCreate: Scalars['String'];
  /** Deletes a thirty party application. */
  appDelete: Scalars['Boolean'];
  /** Revokes (de-authorizes) an application that you have previously authorized. */
  appRevokeAccess?: Maybe<Scalars['Boolean']>;
  /** Update an existing third party application. **Note: This will invalidate all existing tokens, refresh tokens and access codes and will require existing users to re-authorize it.** */
  appUpdate: Scalars['Boolean'];
  branchCreate: Scalars['String'];
  branchDelete: Scalars['Boolean'];
  branchUpdate: Scalars['Boolean'];
  /** Broadcast user activity in the viewer */
  broadcastViewerUserActivity: Scalars['Boolean'];
  /** Archives a comment. */
  commentArchive: Scalars['Boolean'];
  /** Creates a comment */
  commentCreate: Scalars['String'];
  /** Edits a comment. */
  commentEdit: Scalars['Boolean'];
  commentMutations: CommentMutations;
  /** Adds a reply to a comment. */
  commentReply: Scalars['String'];
  /** Flags a comment as viewed by you (the logged in user). */
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
  /** Edits a user's profile. */
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
  model?: Maybe<Model>;
  /** Return a model tree of children for the specified model name */
  modelChildrenTree: Array<ModelsTreeItem>;
  /** Returns a flat list of all models */
  models: ModelCollection;
  /**
   * Return's a project's models in a tree view with submodels being nested under parent models
   * real or fake (e.g., with a foo/bar model, it will be nested under foo even if such a model doesn't actually exist)
   */
  modelsTree: Array<ModelsTreeItem>;
  name: Scalars['String'];
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


export type ProjectVersionsArgs = {
  cursor?: InputMaybe<Scalars['String']>;
  limit?: Scalars['Int'];
};


export type ProjectViewerResourcesArgs = {
  loadedVersionsOnly?: InputMaybe<Scalars['Boolean']>;
  resourceIdString: Scalars['String'];
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

export type ProjectInviteCreateInput = {
  /** Either this or userId must be filled */
  email?: InputMaybe<Scalars['String']>;
  projectId: Scalars['ID'];
  /** Defaults to the contributor role, if not specified */
  role?: InputMaybe<Scalars['String']>;
  /** Either this or email must be filled */
  userId?: InputMaybe<Scalars['String']>;
};

export type ProjectInviteMutations = {
  __typename?: 'ProjectInviteMutations';
  /** Cancel a pending stream invite. Can only be invoked by a project owner. */
  cancel: Project;
  /** Invite a new or registered user to be a project collaborator. Can only be invoked by a project owner. */
  create: Project;
  /** Accept or decline a project invite */
  use: Scalars['Boolean'];
};


export type ProjectInviteMutationsCancelArgs = {
  inviteId: Scalars['String'];
  projectId: Scalars['ID'];
};


export type ProjectInviteMutationsCreateArgs = {
  input: ProjectInviteCreateInput;
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
  /** Create onboarding/tutorial project */
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
  /** All the streams of the server. Available to admins only. */
  adminStreams?: Maybe<StreamCollection>;
  /**
   * Get all (or search for specific) users, registered or invited, from the server in a paginated view.
   * The query looks for matches in name, company and email.
   */
  adminUsers?: Maybe<AdminUsersListCollection>;
  /** Gets a specific app from the server. */
  app?: Maybe<ServerApp>;
  /** Returns all the publicly available apps on this server. */
  apps?: Maybe<Array<Maybe<ServerAppListItem>>>;
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
  project?: Maybe<Project>;
  /**
   * Look for an invitation to a project, for the current user (authed or not). If token
   * isn't specified, the server will look for any valid invite.
   */
  projectInvite?: Maybe<PendingStreamCollaborator>;
  serverInfo: ServerInfo;
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
  testList: Array<TestItem>;
  testNumber?: Maybe<Scalars['Int']>;
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

/** Available roles. */
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
  blobSizeLimitBytes: Scalars['Int'];
  canonicalUrl?: Maybe<Scalars['String']>;
  company?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  inviteOnly?: Maybe<Scalars['Boolean']>;
  name: Scalars['String'];
  roles: Array<Maybe<Role>>;
  scopes: Array<Maybe<Scope>>;
  termsOfService?: Maybe<Scalars['String']>;
  version?: Maybe<Scalars['String']>;
};

export type ServerInfoUpdateInput = {
  adminContact?: InputMaybe<Scalars['String']>;
  company?: InputMaybe<Scalars['String']>;
  description?: InputMaybe<Scalars['String']>;
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
};

export enum ServerRole {
  ServerAdmin = 'SERVER_ADMIN',
  ServerArchivedUser = 'SERVER_ARCHIVED_USER',
  ServerUser = 'SERVER_USER'
}

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
  fileUploads?: Maybe<Array<Maybe<FileUpload>>>;
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
  webhooks?: Maybe<WebhookCollection>;
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
  /**
   * Subscribe to updates to resource comments/threads. Optionally specify resource ID string to only receive
   * updates regarding comments for those resources.
   */
  projectCommentsUpdated: ProjectCommentsUpdatedMessage;
  /** Subscribe to changes to a project's models. Optionally specify modelIds to track. */
  projectModelsUpdated: ProjectModelsUpdatedMessage;
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


export type SubscriptionProjectCommentsUpdatedArgs = {
  target: ViewerUpdateTrackingTarget;
};


export type SubscriptionProjectModelsUpdatedArgs = {
  id: Scalars['String'];
  modelIds?: InputMaybe<Array<Scalars['String']>>;
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
  target: ViewerUpdateTrackingTarget;
};

export type TestItem = {
  __typename?: 'TestItem';
  bar: Scalars['String'];
  foo: Scalars['String'];
};

export type UpdateModelInput = {
  id: Scalars['ID'];
  name: Scalars['String'];
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
  apiTokens?: Maybe<Array<Maybe<ApiToken>>>;
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
  /**
   * E-mail can be null, if it's requested for a user other than the authenticated one
   * and the user isn't an admin
   */
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
  email?: InputMaybe<Scalars['String']>;
};

export type UserProjectsFilter = {
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
  selection?: Maybe<ViewerUserSelectionInfo>;
  status: ViewerUserActivityStatus;
  typing?: Maybe<ViewerUserTypingMessage>;
  user: LimitedUser;
  userId: Scalars['String'];
  userName: Scalars['String'];
  viewerSessionId: Scalars['String'];
};

export type ViewerUserActivityMessageInput = {
  /** Must be set if status !== 'disconnected' */
  selection?: InputMaybe<ViewerUserSelectionInfoInput>;
  status: ViewerUserActivityStatus;
  /** Must be set if status === 'typing' */
  typing?: InputMaybe<ViewerUserTypingMessageInput>;
  userId?: InputMaybe<Scalars['String']>;
  userName: Scalars['String'];
  /** The same user will have different session IDs across tabs where the viewer is open */
  viewerSessionId: Scalars['String'];
};

export enum ViewerUserActivityStatus {
  Disconnected = 'DISCONNECTED',
  Typing = 'TYPING',
  Viewing = 'VIEWING'
}

export type ViewerUserSelectionInfo = {
  __typename?: 'ViewerUserSelectionInfo';
  camera: Array<Scalars['Float']>;
  filteringState: Scalars['JSONObject'];
  sectionBox?: Maybe<Scalars['JSONObject']>;
  selectionLocation?: Maybe<Scalars['JSONObject']>;
};

export type ViewerUserSelectionInfoInput = {
  /**
   * An array representing a user's camera position:
   * [camPos.x, camPos.y, camPos.z, camTarget.x, camTarget.y, camTarget.z, isOrtho, zoomNumber]
   */
  camera: Array<Scalars['Float']>;
  /** 'FilteringState' of @speckle/viewer. Represents the filters activated in the viewer by the user. */
  filteringState: Scalars['JSONObject'];
  /** Viewer.getCurrentSectionBox(): THREE.Box3 */
  sectionBox?: InputMaybe<Scalars['JSONObject']>;
  /** THREE.Vector3 - the user's selection's focus point */
  selectionLocation?: InputMaybe<Scalars['JSONObject']>;
};

export type ViewerUserTypingMessage = {
  __typename?: 'ViewerUserTypingMessage';
  isTyping: Scalars['Boolean'];
  threadId: Scalars['String'];
};

export type ViewerUserTypingMessageInput = {
  isTyping: Scalars['Boolean'];
  threadId: Scalars['String'];
};

export type Webhook = {
  __typename?: 'Webhook';
  description?: Maybe<Scalars['String']>;
  enabled?: Maybe<Scalars['Boolean']>;
  history?: Maybe<WebhookEventCollection>;
  id: Scalars['String'];
  streamId: Scalars['String'];
  triggers: Array<Maybe<Scalars['String']>>;
  url: Scalars['String'];
};


export type WebhookHistoryArgs = {
  limit?: Scalars['Int'];
};

export type WebhookCollection = {
  __typename?: 'WebhookCollection';
  items?: Maybe<Array<Maybe<Webhook>>>;
  totalCount?: Maybe<Scalars['Int']>;
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

export type IntegrationStoryDemoServerInfoQueryFragmentFragment = { __typename?: 'ServerInfo', blobSizeLimitBytes: number, name: string, company?: string | null, description?: string | null, adminContact?: string | null, canonicalUrl?: string | null, termsOfService?: string | null, inviteOnly?: boolean | null, version?: string | null };

export type AuthRegisterPanelServerInfoFragment = { __typename?: 'ServerInfo', inviteOnly?: boolean | null };

export type ServerTermsOfServicePrivacyPolicyFragmentFragment = { __typename?: 'ServerInfo', termsOfService?: string | null };

export type EmailVerificationBannerStateQueryVariables = Exact<{ [key: string]: never; }>;


export type EmailVerificationBannerStateQuery = { __typename?: 'Query', activeUser?: { __typename?: 'User', id: string, email?: string | null, verified?: boolean | null, hasPendingVerification?: boolean | null } | null };

export type RequestVerificationMutationVariables = Exact<{ [key: string]: never; }>;


export type RequestVerificationMutation = { __typename?: 'Mutation', requestVerification: boolean };

export type AuthStategiesServerInfoFragmentFragment = { __typename?: 'ServerInfo', authStrategies: Array<{ __typename?: 'AuthStrategy', id: string, name: string, url: string }> };

export type CommonModelSelectorModelFragment = { __typename?: 'Model', id: string, name: string };

export type FormUsersSelectItemFragment = { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null };

export type ProjectModelPageHeaderProjectFragment = { __typename?: 'Project', id: string, name: string, model?: { __typename?: 'Model', id: string, name: string } | null };

export type ProjectModelPageVersionsProjectFragment = { __typename?: 'Project', id: string, role?: string | null, model?: { __typename?: 'Model', id: string, versions: { __typename?: 'VersionCollection', cursor?: string | null, totalCount: number, items: Array<{ __typename?: 'Version', id: string, message?: string | null, createdAt: string, previewUrl: string, sourceApplication?: string | null, authorUser?: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } | null, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number } }> } } | null };

export type ProjectModelPageDialogDeleteVersionFragment = { __typename?: 'Version', id: string, message?: string | null };

export type ProjectModelPageDialogEditMessageVersionFragment = { __typename?: 'Version', id: string, message?: string | null };

export type ProjectModelPageDialogMoveToVersionFragment = { __typename?: 'Version', id: string, message?: string | null };

export type ProjectModelPageVersionsCardVersionFragment = { __typename?: 'Version', id: string, message?: string | null, createdAt: string, previewUrl: string, sourceApplication?: string | null, authorUser?: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } | null, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number } };

export type ProjectPageProjectHeaderFragment = { __typename?: 'Project', id: string, role?: string | null, name: string, description?: string | null, visibility: ProjectVisibility, allowPublicComments: boolean };

export type ProjectPageLatestItemsCommentsFragment = { __typename?: 'Project', id: string, commentThreadCount: { __typename?: 'ProjectCommentCollection', totalCount: number } };

export type ProjectPageLatestItemsCommentItemFragment = { __typename?: 'Comment', id: string, screenshot?: string | null, rawText: string, createdAt: string, updatedAt: string, author: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null }, repliesCount: { __typename?: 'CommentCollection', totalCount: number }, replyAuthors: { __typename?: 'CommentReplyAuthorCollection', totalCount: number, items: Array<{ __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null }> }, viewerResources: Array<{ __typename?: 'ViewerResourceItem', modelId?: string | null, versionId?: string | null, objectId: string }> };

export type ProjectPageLatestItemsModelsFragment = { __typename?: 'Project', id: string, sourceApps: Array<string>, modelCount: { __typename?: 'ModelCollection', totalCount: number }, team: Array<{ __typename?: 'ProjectCollaborator', user: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } }> };

export type ProjectPageModelsActionsFragment = { __typename?: 'Model', id: string, name: string };

export type ProjectPageModelsCardProjectFragment = { __typename?: 'Project', id: string, role?: string | null };

export type ModelPreviewFragment = { __typename?: 'Model', previewUrl?: string | null };

export type SingleLevelModelTreeItemFragment = { __typename?: 'ModelsTreeItem', id: string, name: string, fullName: string, hasChildren: boolean, updatedAt: string, model?: { __typename?: 'Model', id: string, name: string, displayName: string, previewUrl?: string | null, updatedAt: string, versionCount: { __typename?: 'VersionCollection', totalCount: number }, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number } } | null };

export type ProjectPageModelsViewFragment = { __typename?: 'Project', id: string, role?: string | null, sourceApps: Array<string>, modelCount: { __typename?: 'ModelCollection', totalCount: number }, team: Array<{ __typename?: 'ProjectCollaborator', user: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } }> };

export type ProjectModelsViewModelItemFragment = { __typename?: 'Model', id: string, name: string, displayName: string, previewUrl?: string | null, updatedAt: string, versionCount: { __typename?: 'VersionCollection', totalCount: number }, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number } };

export type ProjectPageModelsCardDeleteDialogFragment = { __typename?: 'Model', id: string, name: string };

export type ProjectPageModelsCardRenameDialogFragment = { __typename?: 'Model', id: string, name: string };

export type ProjectPageStatsBlockCommentsFragment = { __typename?: 'Project', commentThreadCount: { __typename?: 'ProjectCommentCollection', totalCount: number } };

export type ProjectPageStatsBlockModelsFragment = { __typename?: 'Project', modelCount: { __typename?: 'ModelCollection', totalCount: number } };

export type ProjectPageStatsBlockTeamFragment = { __typename?: 'Project', id: string, role?: string | null, team: Array<{ __typename?: 'ProjectCollaborator', role: string, user: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } }> };

export type ProjectPageStatsBlockVersionsFragment = { __typename?: 'Project', versionCount: { __typename?: 'VersionCollection', totalCount: number } };

export type ProjectPageTeamDialogFragment = { __typename?: 'Project', id: string, name: string, role?: string | null, allowPublicComments: boolean, visibility: ProjectVisibility, team: Array<{ __typename?: 'ProjectCollaborator', role: string, user: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } }>, invitedTeam?: Array<{ __typename?: 'PendingStreamCollaborator', id: string, title: string, inviteId: string, role: string, user?: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } | null }> | null };

export type OnUserProjectsUpdateSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type OnUserProjectsUpdateSubscription = { __typename?: 'Subscription', userProjectsUpdated: { __typename?: 'UserProjectsUpdatedMessage', type: UserProjectsUpdatedMessageType, id: string, project?: { __typename?: 'Project', id: string, name: string, createdAt: string, updatedAt: string, role?: string | null, models: { __typename?: 'ModelCollection', totalCount: number, items: Array<{ __typename?: 'Model', id: string, name: string, displayName: string, previewUrl?: string | null, createdAt: string, updatedAt: string, versionCount: { __typename?: 'VersionCollection', totalCount: number }, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number } }> }, team: Array<{ __typename?: 'ProjectCollaborator', user: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } }> } | null } };

export type CreateOnboardingProjectMutationVariables = Exact<{ [key: string]: never; }>;


export type CreateOnboardingProjectMutation = { __typename?: 'Mutation', projectMutations: { __typename?: 'ProjectMutations', createForOnboarding: { __typename?: 'Project', id: string, createdAt: string, role?: string | null, name: string, description?: string | null, visibility: ProjectVisibility, allowPublicComments: boolean, sourceApps: Array<string>, updatedAt: string, models: { __typename?: 'ModelCollection', totalCount: number, items: Array<{ __typename?: 'Model', id: string, name: string, displayName: string, previewUrl?: string | null, createdAt: string, updatedAt: string, versionCount: { __typename?: 'VersionCollection', totalCount: number }, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number } }> }, team: Array<{ __typename?: 'ProjectCollaborator', role: string, user: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } }>, invitedTeam?: Array<{ __typename?: 'PendingStreamCollaborator', id: string, title: string, inviteId: string, role: string, user?: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } | null }> | null, versionCount: { __typename?: 'VersionCollection', totalCount: number }, modelCount: { __typename?: 'ModelCollection', totalCount: number }, commentThreadCount: { __typename?: 'ProjectCommentCollection', totalCount: number } } } };

export type ProjectsDashboardFilledFragment = { __typename?: 'ProjectCollection', items: Array<{ __typename?: 'Project', id: string, name: string, createdAt: string, updatedAt: string, role?: string | null, models: { __typename?: 'ModelCollection', totalCount: number, items: Array<{ __typename?: 'Model', id: string, name: string, displayName: string, previewUrl?: string | null, createdAt: string, updatedAt: string, versionCount: { __typename?: 'VersionCollection', totalCount: number }, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number } }> }, team: Array<{ __typename?: 'ProjectCollaborator', user: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } }> }> };

export type ProjectsInviteBannerFragment = { __typename?: 'PendingStreamCollaborator', id: string, projectId: string, projectName: string, token?: string | null, invitedBy: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } };

export type ProjectsInviteBannersFragment = { __typename?: 'User', projectInvites: Array<{ __typename?: 'PendingStreamCollaborator', id: string, projectId: string, projectName: string, token?: string | null, invitedBy: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } }> };

export type AppAuthorAvatarFragment = { __typename?: 'AppAuthor', id?: string | null, name?: string | null, avatar?: string | null };

export type LimitedUserAvatarFragment = { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null };

export type ActiveUserAvatarFragment = { __typename?: 'User', id: string, name: string, avatar?: string | null };

export type ThreadCommentAttachmentFragment = { __typename?: 'Comment', text: { __typename?: 'SmartTextEditorValue', attachments?: Array<{ __typename?: 'BlobMetadata', id: string, fileName: string, fileType: string, fileSize?: number | null }> | null } };

export type ViewerCommentsListItemFragment = { __typename?: 'Comment', id: string, rawText: string, archived: boolean, createdAt: string, viewedAt?: string | null, author: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null }, replies: { __typename?: 'CommentCollection', totalCount: number, cursor?: string | null, items: Array<{ __typename?: 'Comment', id: string, archived: boolean, rawText: string, createdAt: string, text: { __typename?: 'SmartTextEditorValue', doc?: {} | null, attachments?: Array<{ __typename?: 'BlobMetadata', id: string, fileName: string, fileType: string, fileSize?: number | null }> | null }, author: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } }> }, replyAuthors: { __typename?: 'CommentReplyAuthorCollection', totalCount: number, items: Array<{ __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null }> }, resources: Array<{ __typename?: 'ResourceIdentifier', resourceId: string, resourceType: ResourceType }> };

export type ViewerModelVersionCardItemFragment = { __typename?: 'Version', id: string, message?: string | null, referencedObject: string, sourceApplication?: string | null, createdAt: string, previewUrl: string, authorUser?: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } | null };

export type ActiveUserMainMetadataQueryVariables = Exact<{ [key: string]: never; }>;


export type ActiveUserMainMetadataQuery = { __typename?: 'Query', activeUser?: { __typename?: 'User', id: string, email?: string | null, name: string, role?: string | null, avatar?: string | null, isOnboardingFinished?: boolean | null, createdAt?: string | null, verified?: boolean | null } | null };

export type FinishOnboardingMutationVariables = Exact<{ [key: string]: never; }>;


export type FinishOnboardingMutation = { __typename?: 'Mutation', activeUserMutations: { __typename?: 'ActiveUserMutations', finishOnboarding: boolean } };

export type AuthServerInfoQueryVariables = Exact<{ [key: string]: never; }>;


export type AuthServerInfoQuery = { __typename?: 'Query', serverInfo: { __typename?: 'ServerInfo', termsOfService?: string | null, inviteOnly?: boolean | null, authStrategies: Array<{ __typename?: 'AuthStrategy', id: string, name: string, url: string }> } };

export type AuthorizableAppMetadataQueryVariables = Exact<{
  id: Scalars['String'];
}>;


export type AuthorizableAppMetadataQuery = { __typename?: 'Query', app?: { __typename?: 'ServerApp', id: string, name: string, description?: string | null, trustByDefault?: boolean | null, redirectUrl: string, scopes: Array<{ __typename?: 'Scope', name: string, description: string }>, author?: { __typename?: 'AppAuthor', name?: string | null, id?: string | null, avatar?: string | null } | null } | null };

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


export type UserSearchQuery = { __typename?: 'Query', userSearch: { __typename?: 'UserSearchResultCollection', cursor?: string | null, items: Array<{ __typename?: 'LimitedUser', id: string, name: string, bio?: string | null, company?: string | null, avatar?: string | null, verified?: boolean | null }> } };

export type ServerInfoBlobSizeLimitQueryVariables = Exact<{ [key: string]: never; }>;


export type ServerInfoBlobSizeLimitQuery = { __typename?: 'Query', serverInfo: { __typename?: 'ServerInfo', blobSizeLimitBytes: number } };

export type ProjectModelsSelectorValuesQueryVariables = Exact<{
  projectId: Scalars['String'];
  cursor?: InputMaybe<Scalars['String']>;
}>;


export type ProjectModelsSelectorValuesQuery = { __typename?: 'Query', project?: { __typename?: 'Project', id: string, models: { __typename?: 'ModelCollection', cursor?: string | null, totalCount: number, items: Array<{ __typename?: 'Model', id: string, name: string }> } } | null };

export type ServerVersionInfoQueryVariables = Exact<{ [key: string]: never; }>;


export type ServerVersionInfoQuery = { __typename?: 'Query', serverInfo: { __typename?: 'ServerInfo', version?: string | null } };

export type InternalTestDataQueryVariables = Exact<{ [key: string]: never; }>;


export type InternalTestDataQuery = { __typename?: 'Query', testNumber?: number | null, testList: Array<{ __typename?: 'TestItem', foo: string, bar: string }> };

export type ProjectDashboardItemNoModelsFragment = { __typename?: 'Project', id: string, name: string, createdAt: string, updatedAt: string, role?: string | null, team: Array<{ __typename?: 'ProjectCollaborator', user: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } }> };

export type ProjectDashboardItemFragment = { __typename?: 'Project', id: string, name: string, createdAt: string, updatedAt: string, role?: string | null, models: { __typename?: 'ModelCollection', totalCount: number, items: Array<{ __typename?: 'Model', id: string, name: string, displayName: string, previewUrl?: string | null, createdAt: string, updatedAt: string, versionCount: { __typename?: 'VersionCollection', totalCount: number }, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number } }> }, team: Array<{ __typename?: 'ProjectCollaborator', user: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } }> };

export type ProjectPageLatestItemsModelItemFragment = { __typename?: 'Model', id: string, name: string, displayName: string, previewUrl?: string | null, createdAt: string, updatedAt: string, versionCount: { __typename?: 'VersionCollection', totalCount: number }, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number } };

export type ProjectUpdatableMetadataFragment = { __typename?: 'Project', id: string, name: string, description?: string | null, visibility: ProjectVisibility, allowPublicComments: boolean };

export type CreateModelMutationVariables = Exact<{
  input: CreateModelInput;
}>;


export type CreateModelMutation = { __typename?: 'Mutation', modelMutations: { __typename?: 'ModelMutations', create: { __typename?: 'Model', id: string, name: string, displayName: string, previewUrl?: string | null, createdAt: string, updatedAt: string, versionCount: { __typename?: 'VersionCollection', totalCount: number }, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number } } } };

export type CreateProjectMutationVariables = Exact<{
  input?: InputMaybe<ProjectCreateInput>;
}>;


export type CreateProjectMutation = { __typename?: 'Mutation', projectMutations: { __typename?: 'ProjectMutations', create: { __typename?: 'Project', id: string, createdAt: string, role?: string | null, name: string, description?: string | null, visibility: ProjectVisibility, allowPublicComments: boolean, sourceApps: Array<string>, updatedAt: string, models: { __typename?: 'ModelCollection', totalCount: number, items: Array<{ __typename?: 'Model', id: string, name: string, displayName: string, previewUrl?: string | null, createdAt: string, updatedAt: string, versionCount: { __typename?: 'VersionCollection', totalCount: number }, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number } }> }, team: Array<{ __typename?: 'ProjectCollaborator', role: string, user: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } }>, invitedTeam?: Array<{ __typename?: 'PendingStreamCollaborator', id: string, title: string, inviteId: string, role: string, user?: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } | null }> | null, versionCount: { __typename?: 'VersionCollection', totalCount: number }, modelCount: { __typename?: 'ModelCollection', totalCount: number }, commentThreadCount: { __typename?: 'ProjectCommentCollection', totalCount: number } } } };

export type UpdateModelMutationVariables = Exact<{
  input: UpdateModelInput;
}>;


export type UpdateModelMutation = { __typename?: 'Mutation', modelMutations: { __typename?: 'ModelMutations', update: { __typename?: 'Model', id: string, name: string, displayName: string, previewUrl?: string | null, createdAt: string, updatedAt: string, versionCount: { __typename?: 'VersionCollection', totalCount: number }, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number } } } };

export type DeleteModelMutationVariables = Exact<{
  input: DeleteModelInput;
}>;


export type DeleteModelMutation = { __typename?: 'Mutation', modelMutations: { __typename?: 'ModelMutations', delete: boolean } };

export type UpdateProjectRoleMutationVariables = Exact<{
  input: ProjectUpdateRoleInput;
}>;


export type UpdateProjectRoleMutation = { __typename?: 'Mutation', projectMutations: { __typename?: 'ProjectMutations', updateRole: { __typename?: 'Project', id: string, team: Array<{ __typename?: 'ProjectCollaborator', role: string, user: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } }> } } };

export type InviteProjectUserMutationVariables = Exact<{
  input: ProjectInviteCreateInput;
}>;


export type InviteProjectUserMutation = { __typename?: 'Mutation', projectMutations: { __typename?: 'ProjectMutations', invites: { __typename?: 'ProjectInviteMutations', create: { __typename?: 'Project', id: string, name: string, role?: string | null, allowPublicComments: boolean, visibility: ProjectVisibility, team: Array<{ __typename?: 'ProjectCollaborator', role: string, user: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } }>, invitedTeam?: Array<{ __typename?: 'PendingStreamCollaborator', id: string, title: string, inviteId: string, role: string, user?: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } | null }> | null } } } };

export type CancelProjectInviteMutationVariables = Exact<{
  projectId: Scalars['ID'];
  inviteId: Scalars['String'];
}>;


export type CancelProjectInviteMutation = { __typename?: 'Mutation', projectMutations: { __typename?: 'ProjectMutations', invites: { __typename?: 'ProjectInviteMutations', cancel: { __typename?: 'Project', id: string, name: string, role?: string | null, allowPublicComments: boolean, visibility: ProjectVisibility, team: Array<{ __typename?: 'ProjectCollaborator', role: string, user: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } }>, invitedTeam?: Array<{ __typename?: 'PendingStreamCollaborator', id: string, title: string, inviteId: string, role: string, user?: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } | null }> | null } } } };

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

export type ProjectAccessCheckQueryVariables = Exact<{
  id: Scalars['String'];
}>;


export type ProjectAccessCheckQuery = { __typename?: 'Query', project?: { __typename?: 'Project', id: string } | null };

export type ProjectsDashboardQueryQueryVariables = Exact<{
  filter?: InputMaybe<UserProjectsFilter>;
  cursor?: InputMaybe<Scalars['String']>;
}>;


export type ProjectsDashboardQueryQuery = { __typename?: 'Query', activeUser?: { __typename?: 'User', id: string, projects: { __typename?: 'ProjectCollection', cursor?: string | null, totalCount: number, items: Array<{ __typename?: 'Project', id: string, name: string, createdAt: string, updatedAt: string, role?: string | null, models: { __typename?: 'ModelCollection', totalCount: number, items: Array<{ __typename?: 'Model', id: string, name: string, displayName: string, previewUrl?: string | null, createdAt: string, updatedAt: string, versionCount: { __typename?: 'VersionCollection', totalCount: number }, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number } }> }, team: Array<{ __typename?: 'ProjectCollaborator', user: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } }> }> }, projectInvites: Array<{ __typename?: 'PendingStreamCollaborator', id: string, projectId: string, projectName: string, token?: string | null, invitedBy: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } }> } | null };

export type ProjectPageQueryQueryVariables = Exact<{
  id: Scalars['String'];
  token?: InputMaybe<Scalars['String']>;
}>;


export type ProjectPageQueryQuery = { __typename?: 'Query', project?: { __typename?: 'Project', id: string, createdAt: string, role?: string | null, name: string, description?: string | null, visibility: ProjectVisibility, allowPublicComments: boolean, sourceApps: Array<string>, team: Array<{ __typename?: 'ProjectCollaborator', role: string, user: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } }>, invitedTeam?: Array<{ __typename?: 'PendingStreamCollaborator', id: string, title: string, inviteId: string, role: string, user?: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } | null }> | null, versionCount: { __typename?: 'VersionCollection', totalCount: number }, modelCount: { __typename?: 'ModelCollection', totalCount: number }, commentThreadCount: { __typename?: 'ProjectCommentCollection', totalCount: number } } | null, projectInvite?: { __typename?: 'PendingStreamCollaborator', id: string, projectId: string, projectName: string, token?: string | null, invitedBy: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } } | null };

export type ProjectLatestModelsQueryVariables = Exact<{
  projectId: Scalars['String'];
  filter?: InputMaybe<ProjectModelsFilter>;
}>;


export type ProjectLatestModelsQuery = { __typename?: 'Query', project?: { __typename?: 'Project', id: string, models: { __typename?: 'ModelCollection', totalCount: number, cursor?: string | null, items: Array<{ __typename?: 'Model', id: string, name: string, displayName: string, previewUrl?: string | null, createdAt: string, updatedAt: string, versionCount: { __typename?: 'VersionCollection', totalCount: number }, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number } }> } } | null };

export type ProjectModelsTreeTopLevelQueryVariables = Exact<{
  projectId: Scalars['String'];
}>;


export type ProjectModelsTreeTopLevelQuery = { __typename?: 'Query', project?: { __typename?: 'Project', id: string, modelsTree: Array<{ __typename?: 'ModelsTreeItem', id: string, name: string, fullName: string, hasChildren: boolean, updatedAt: string, model?: { __typename?: 'Model', id: string, name: string, displayName: string, previewUrl?: string | null, updatedAt: string, versionCount: { __typename?: 'VersionCollection', totalCount: number }, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number } } | null }> } | null };

export type ProjectModelChildrenTreeQueryVariables = Exact<{
  projectId: Scalars['String'];
  parentName: Scalars['String'];
}>;


export type ProjectModelChildrenTreeQuery = { __typename?: 'Query', project?: { __typename?: 'Project', id: string, modelChildrenTree: Array<{ __typename?: 'ModelsTreeItem', id: string, name: string, fullName: string, hasChildren: boolean, updatedAt: string, model?: { __typename?: 'Model', id: string, name: string, displayName: string, previewUrl?: string | null, updatedAt: string, versionCount: { __typename?: 'VersionCollection', totalCount: number }, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number } } | null }> } | null };

export type ProjectLatestCommentThreadsQueryVariables = Exact<{
  projectId: Scalars['String'];
}>;


export type ProjectLatestCommentThreadsQuery = { __typename?: 'Query', project?: { __typename?: 'Project', id: string, commentThreads: { __typename?: 'ProjectCommentCollection', totalCount: number, cursor?: string | null, items: Array<{ __typename?: 'Comment', id: string, screenshot?: string | null, rawText: string, createdAt: string, updatedAt: string, author: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null }, repliesCount: { __typename?: 'CommentCollection', totalCount: number }, replyAuthors: { __typename?: 'CommentReplyAuthorCollection', totalCount: number, items: Array<{ __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null }> }, viewerResources: Array<{ __typename?: 'ViewerResourceItem', modelId?: string | null, versionId?: string | null, objectId: string }> }> } } | null };

export type ProjectInviteQueryVariables = Exact<{
  projectId: Scalars['String'];
  token?: InputMaybe<Scalars['String']>;
}>;


export type ProjectInviteQuery = { __typename?: 'Query', projectInvite?: { __typename?: 'PendingStreamCollaborator', id: string, projectId: string, projectName: string, token?: string | null, invitedBy: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } } | null };

export type ProjectModelCheckQueryVariables = Exact<{
  projectId: Scalars['String'];
  modelId: Scalars['String'];
}>;


export type ProjectModelCheckQuery = { __typename?: 'Query', project?: { __typename?: 'Project', model?: { __typename?: 'Model', id: string } | null } | null };

export type ProjectModelPageQueryVariables = Exact<{
  projectId: Scalars['String'];
  modelId: Scalars['String'];
  versionsCursor?: InputMaybe<Scalars['String']>;
}>;


export type ProjectModelPageQuery = { __typename?: 'Query', project?: { __typename?: 'Project', id: string, name: string, role?: string | null, model?: { __typename?: 'Model', id: string, name: string, versions: { __typename?: 'VersionCollection', cursor?: string | null, totalCount: number, items: Array<{ __typename?: 'Version', id: string, message?: string | null, createdAt: string, previewUrl: string, sourceApplication?: string | null, authorUser?: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } | null, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number } }> } } | null } | null };

export type ProjectModelVersionsQueryVariables = Exact<{
  projectId: Scalars['String'];
  modelId: Scalars['String'];
  versionsCursor?: InputMaybe<Scalars['String']>;
}>;


export type ProjectModelVersionsQuery = { __typename?: 'Query', project?: { __typename?: 'Project', id: string, role?: string | null, model?: { __typename?: 'Model', id: string, versions: { __typename?: 'VersionCollection', cursor?: string | null, totalCount: number, items: Array<{ __typename?: 'Version', id: string, message?: string | null, createdAt: string, previewUrl: string, sourceApplication?: string | null, authorUser?: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } | null, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number } }> } } | null } | null };

export type OnProjectUpdatedSubscriptionVariables = Exact<{
  id: Scalars['String'];
}>;


export type OnProjectUpdatedSubscription = { __typename?: 'Subscription', projectUpdated: { __typename?: 'ProjectUpdatedMessage', id: string, type: ProjectUpdatedMessageType, project?: { __typename?: 'Project', id: string, createdAt: string, name: string, updatedAt: string, role?: string | null, description?: string | null, visibility: ProjectVisibility, allowPublicComments: boolean, sourceApps: Array<string>, team: Array<{ __typename?: 'ProjectCollaborator', role: string, user: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } }>, invitedTeam?: Array<{ __typename?: 'PendingStreamCollaborator', id: string, title: string, inviteId: string, role: string, user?: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } | null }> | null, versionCount: { __typename?: 'VersionCollection', totalCount: number }, modelCount: { __typename?: 'ModelCollection', totalCount: number }, commentThreadCount: { __typename?: 'ProjectCommentCollection', totalCount: number } } | null } };

export type OnProjectModelsUpdateSubscriptionVariables = Exact<{
  id: Scalars['String'];
}>;


export type OnProjectModelsUpdateSubscription = { __typename?: 'Subscription', projectModelsUpdated: { __typename?: 'ProjectModelsUpdatedMessage', id: string, type: ProjectModelsUpdatedMessageType, model?: { __typename?: 'Model', id: string, name: string, displayName: string, previewUrl?: string | null, createdAt: string, updatedAt: string, versions: { __typename?: 'VersionCollection', items: Array<{ __typename?: 'Version', id: string, referencedObject: string }> }, versionCount: { __typename?: 'VersionCollection', totalCount: number }, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number } } | null } };

export type OnProjectVersionsUpdateSubscriptionVariables = Exact<{
  id: Scalars['String'];
}>;


export type OnProjectVersionsUpdateSubscription = { __typename?: 'Subscription', projectVersionsUpdated: { __typename?: 'ProjectVersionsUpdatedMessage', id: string, modelId?: string | null, type: ProjectVersionsUpdatedMessageType, version?: { __typename?: 'Version', id: string, message?: string | null, referencedObject: string, sourceApplication?: string | null, createdAt: string, previewUrl: string, model: { __typename?: 'Model', id: string, name: string, displayName: string, previewUrl?: string | null, createdAt: string, updatedAt: string, versionCount: { __typename?: 'VersionCollection', totalCount: number }, commentThreadCount: { __typename?: 'CommentCollection', totalCount: number } }, authorUser?: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } | null } | null } };

export type OnProjectVersionsPreviewGeneratedSubscriptionVariables = Exact<{
  id: Scalars['String'];
}>;


export type OnProjectVersionsPreviewGeneratedSubscription = { __typename?: 'Subscription', projectVersionsPreviewGenerated: { __typename?: 'ProjectVersionsPreviewGeneratedMessage', projectId: string, objectId: string, versionId: string } };

export type InviteServerUserMutationVariables = Exact<{
  input: ServerInviteCreateInput;
}>;


export type InviteServerUserMutation = { __typename?: 'Mutation', serverInviteCreate: boolean };

export type ViewerCommentBubblesDataFragment = { __typename?: 'Comment', id: string, viewedAt?: string | null, data?: { __typename?: 'CommentViewerData', location: {}, camPos: Array<number>, sectionBox?: {} | null, selection?: {} | null, filters: { __typename?: 'CommentDataFilters', hiddenIds?: Array<string> | null, isolatedIds?: Array<string> | null, propertyInfoKey?: string | null, passMax?: number | null, passMin?: number | null, sectionBox?: {} | null } } | null };

export type ViewerCommentThreadFragment = { __typename?: 'Comment', id: string, rawText: string, archived: boolean, createdAt: string, viewedAt?: string | null, author: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null }, replies: { __typename?: 'CommentCollection', totalCount: number, cursor?: string | null, items: Array<{ __typename?: 'Comment', id: string, archived: boolean, rawText: string, createdAt: string, text: { __typename?: 'SmartTextEditorValue', doc?: {} | null, attachments?: Array<{ __typename?: 'BlobMetadata', id: string, fileName: string, fileType: string, fileSize?: number | null }> | null }, author: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } }> }, replyAuthors: { __typename?: 'CommentReplyAuthorCollection', totalCount: number, items: Array<{ __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null }> }, resources: Array<{ __typename?: 'ResourceIdentifier', resourceId: string, resourceType: ResourceType }>, data?: { __typename?: 'CommentViewerData', location: {}, camPos: Array<number>, sectionBox?: {} | null, selection?: {} | null, filters: { __typename?: 'CommentDataFilters', hiddenIds?: Array<string> | null, isolatedIds?: Array<string> | null, propertyInfoKey?: string | null, passMax?: number | null, passMin?: number | null, sectionBox?: {} | null } } | null, text: { __typename?: 'SmartTextEditorValue', doc?: {} | null, attachments?: Array<{ __typename?: 'BlobMetadata', id: string, fileName: string, fileType: string, fileSize?: number | null }> | null } };

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


export type CreateCommentThreadMutation = { __typename?: 'Mutation', commentMutations: { __typename?: 'CommentMutations', create: { __typename?: 'Comment', id: string, rawText: string, archived: boolean, createdAt: string, viewedAt?: string | null, author: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null }, replies: { __typename?: 'CommentCollection', totalCount: number, cursor?: string | null, items: Array<{ __typename?: 'Comment', id: string, archived: boolean, rawText: string, createdAt: string, text: { __typename?: 'SmartTextEditorValue', doc?: {} | null, attachments?: Array<{ __typename?: 'BlobMetadata', id: string, fileName: string, fileType: string, fileSize?: number | null }> | null }, author: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } }> }, replyAuthors: { __typename?: 'CommentReplyAuthorCollection', totalCount: number, items: Array<{ __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null }> }, resources: Array<{ __typename?: 'ResourceIdentifier', resourceId: string, resourceType: ResourceType }>, data?: { __typename?: 'CommentViewerData', location: {}, camPos: Array<number>, sectionBox?: {} | null, selection?: {} | null, filters: { __typename?: 'CommentDataFilters', hiddenIds?: Array<string> | null, isolatedIds?: Array<string> | null, propertyInfoKey?: string | null, passMax?: number | null, passMin?: number | null, sectionBox?: {} | null } } | null, text: { __typename?: 'SmartTextEditorValue', doc?: {} | null, attachments?: Array<{ __typename?: 'BlobMetadata', id: string, fileName: string, fileType: string, fileSize?: number | null }> | null } } } };

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


export type ProjectViewerResourcesQuery = { __typename?: 'Query', project?: { __typename?: 'Project', id: string, viewerResources: Array<{ __typename?: 'ViewerResourceGroup', identifier: string, items: Array<{ __typename?: 'ViewerResourceItem', modelId?: string | null, versionId?: string | null, objectId: string }> }> } | null };

export type ViewerLoadedResourcesQueryVariables = Exact<{
  projectId: Scalars['String'];
  modelIds: Array<Scalars['String']> | Scalars['String'];
  versionIds?: InputMaybe<Array<Scalars['String']> | Scalars['String']>;
}>;


export type ViewerLoadedResourcesQuery = { __typename?: 'Query', project?: { __typename?: 'Project', id: string, role?: string | null, sourceApps: Array<string>, createdAt: string, name: string, models: { __typename?: 'ModelCollection', totalCount: number, items: Array<{ __typename?: 'Model', id: string, name: string, updatedAt: string, loadedVersion: { __typename?: 'VersionCollection', items: Array<{ __typename?: 'Version', id: string, message?: string | null, referencedObject: string, sourceApplication?: string | null, createdAt: string, previewUrl: string, authorUser?: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } | null }> }, versions: { __typename?: 'VersionCollection', totalCount: number, cursor?: string | null, items: Array<{ __typename?: 'Version', id: string, message?: string | null, referencedObject: string, sourceApplication?: string | null, createdAt: string, previewUrl: string, authorUser?: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } | null }> } }> }, modelCount: { __typename?: 'ModelCollection', totalCount: number }, team: Array<{ __typename?: 'ProjectCollaborator', user: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } }> } | null };

export type ViewerModelVersionsQueryVariables = Exact<{
  projectId: Scalars['String'];
  modelId: Scalars['String'];
  versionsCursor?: InputMaybe<Scalars['String']>;
}>;


export type ViewerModelVersionsQuery = { __typename?: 'Query', project?: { __typename?: 'Project', id: string, role?: string | null, model?: { __typename?: 'Model', id: string, versions: { __typename?: 'VersionCollection', totalCount: number, cursor?: string | null, items: Array<{ __typename?: 'Version', id: string, message?: string | null, referencedObject: string, sourceApplication?: string | null, createdAt: string, previewUrl: string, authorUser?: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } | null }> } } | null } | null };

export type ViewerLoadedThreadsQueryVariables = Exact<{
  projectId: Scalars['String'];
  filter: ProjectCommentsFilter;
  cursor?: InputMaybe<Scalars['String']>;
  limit?: InputMaybe<Scalars['Int']>;
}>;


export type ViewerLoadedThreadsQuery = { __typename?: 'Query', project?: { __typename?: 'Project', id: string, commentThreads: { __typename?: 'ProjectCommentCollection', totalCount: number, totalArchivedCount: number, items: Array<{ __typename?: 'Comment', id: string, rawText: string, archived: boolean, createdAt: string, viewedAt?: string | null, viewerResources: Array<{ __typename?: 'ViewerResourceItem', modelId?: string | null, versionId?: string | null, objectId: string }>, author: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null }, replies: { __typename?: 'CommentCollection', totalCount: number, cursor?: string | null, items: Array<{ __typename?: 'Comment', id: string, archived: boolean, rawText: string, createdAt: string, text: { __typename?: 'SmartTextEditorValue', doc?: {} | null, attachments?: Array<{ __typename?: 'BlobMetadata', id: string, fileName: string, fileType: string, fileSize?: number | null }> | null }, author: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } }> }, replyAuthors: { __typename?: 'CommentReplyAuthorCollection', totalCount: number, items: Array<{ __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null }> }, resources: Array<{ __typename?: 'ResourceIdentifier', resourceId: string, resourceType: ResourceType }>, data?: { __typename?: 'CommentViewerData', location: {}, camPos: Array<number>, sectionBox?: {} | null, selection?: {} | null, filters: { __typename?: 'CommentDataFilters', hiddenIds?: Array<string> | null, isolatedIds?: Array<string> | null, propertyInfoKey?: string | null, passMax?: number | null, passMin?: number | null, sectionBox?: {} | null } } | null, text: { __typename?: 'SmartTextEditorValue', doc?: {} | null, attachments?: Array<{ __typename?: 'BlobMetadata', id: string, fileName: string, fileType: string, fileSize?: number | null }> | null } }> } } | null };

export type OnViewerUserActivityBroadcastedSubscriptionVariables = Exact<{
  target: ViewerUpdateTrackingTarget;
}>;


export type OnViewerUserActivityBroadcastedSubscription = { __typename?: 'Subscription', viewerUserActivityBroadcasted: { __typename?: 'ViewerUserActivityMessage', userName: string, userId: string, viewerSessionId: string, status: ViewerUserActivityStatus, user: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null }, typing?: { __typename?: 'ViewerUserTypingMessage', isTyping: boolean, threadId: string } | null, selection?: { __typename?: 'ViewerUserSelectionInfo', filteringState: {}, selectionLocation?: {} | null, sectionBox?: {} | null, camera: Array<number> } | null } };

export type OnViewerCommentsUpdatedSubscriptionVariables = Exact<{
  target: ViewerUpdateTrackingTarget;
}>;


export type OnViewerCommentsUpdatedSubscription = { __typename?: 'Subscription', projectCommentsUpdated: { __typename?: 'ProjectCommentsUpdatedMessage', id: string, type: ProjectCommentsUpdatedMessageType, comment?: { __typename?: 'Comment', id: string, rawText: string, archived: boolean, createdAt: string, viewedAt?: string | null, parent?: { __typename?: 'Comment', id: string } | null, author: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null }, replies: { __typename?: 'CommentCollection', totalCount: number, cursor?: string | null, items: Array<{ __typename?: 'Comment', id: string, archived: boolean, rawText: string, createdAt: string, text: { __typename?: 'SmartTextEditorValue', doc?: {} | null, attachments?: Array<{ __typename?: 'BlobMetadata', id: string, fileName: string, fileType: string, fileSize?: number | null }> | null }, author: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } }> }, replyAuthors: { __typename?: 'CommentReplyAuthorCollection', totalCount: number, items: Array<{ __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null }> }, resources: Array<{ __typename?: 'ResourceIdentifier', resourceId: string, resourceType: ResourceType }>, data?: { __typename?: 'CommentViewerData', location: {}, camPos: Array<number>, sectionBox?: {} | null, selection?: {} | null, filters: { __typename?: 'CommentDataFilters', hiddenIds?: Array<string> | null, isolatedIds?: Array<string> | null, propertyInfoKey?: string | null, passMax?: number | null, passMin?: number | null, sectionBox?: {} | null } } | null, text: { __typename?: 'SmartTextEditorValue', doc?: {} | null, attachments?: Array<{ __typename?: 'BlobMetadata', id: string, fileName: string, fileType: string, fileSize?: number | null }> | null } } | null } };

export type LinkableCommentFragment = { __typename?: 'Comment', id: string, viewerResources: Array<{ __typename?: 'ViewerResourceItem', modelId?: string | null, versionId?: string | null, objectId: string }> };

export type GetActiveUserQueryVariables = Exact<{ [key: string]: never; }>;


export type GetActiveUserQuery = { __typename?: 'Query', activeUser?: { __typename?: 'User', id: string, name: string, role?: string | null } | null };

export type ProjectPageProjectFragment = { __typename?: 'Project', id: string, createdAt: string, role?: string | null, name: string, description?: string | null, visibility: ProjectVisibility, allowPublicComments: boolean, sourceApps: Array<string>, team: Array<{ __typename?: 'ProjectCollaborator', role: string, user: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } }>, invitedTeam?: Array<{ __typename?: 'PendingStreamCollaborator', id: string, title: string, inviteId: string, role: string, user?: { __typename?: 'LimitedUser', id: string, name: string, avatar?: string | null } | null }> | null, versionCount: { __typename?: 'VersionCollection', totalCount: number }, modelCount: { __typename?: 'ModelCollection', totalCount: number }, commentThreadCount: { __typename?: 'ProjectCommentCollection', totalCount: number } };

export type ModelPageProjectFragment = { __typename?: 'Project', id: string, createdAt: string, name: string };

export const IntegrationStoryDemoServerInfoQueryFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"IntegrationStoryDemoServerInfoQueryFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ServerInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"blobSizeLimitBytes"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"company"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"adminContact"}},{"kind":"Field","name":{"kind":"Name","value":"canonicalUrl"}},{"kind":"Field","name":{"kind":"Name","value":"termsOfService"}},{"kind":"Field","name":{"kind":"Name","value":"inviteOnly"}},{"kind":"Field","name":{"kind":"Name","value":"version"}}]}}]} as unknown as DocumentNode<IntegrationStoryDemoServerInfoQueryFragmentFragment, unknown>;
export const AuthRegisterPanelServerInfoFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AuthRegisterPanelServerInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ServerInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"inviteOnly"}}]}}]} as unknown as DocumentNode<AuthRegisterPanelServerInfoFragment, unknown>;
export const ServerTermsOfServicePrivacyPolicyFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ServerTermsOfServicePrivacyPolicyFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ServerInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"termsOfService"}}]}}]} as unknown as DocumentNode<ServerTermsOfServicePrivacyPolicyFragmentFragment, unknown>;
export const AuthStategiesServerInfoFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AuthStategiesServerInfoFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ServerInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"authStrategies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"url"}}]}}]}}]} as unknown as DocumentNode<AuthStategiesServerInfoFragmentFragment, unknown>;
export const CommonModelSelectorModelFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CommonModelSelectorModel"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]} as unknown as DocumentNode<CommonModelSelectorModelFragment, unknown>;
export const ProjectModelPageHeaderProjectFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectModelPageHeaderProject"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"model"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"modelId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<ProjectModelPageHeaderProjectFragment, unknown>;
export const LimitedUserAvatarFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LimitedUserAvatar"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LimitedUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}}]} as unknown as DocumentNode<LimitedUserAvatarFragment, unknown>;
export const ProjectModelPageDialogDeleteVersionFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectModelPageDialogDeleteVersion"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Version"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]} as unknown as DocumentNode<ProjectModelPageDialogDeleteVersionFragment, unknown>;
export const ProjectModelPageDialogMoveToVersionFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectModelPageDialogMoveToVersion"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Version"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]} as unknown as DocumentNode<ProjectModelPageDialogMoveToVersionFragment, unknown>;
export const ProjectModelPageVersionsCardVersionFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectModelPageVersionsCardVersion"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Version"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"authorUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"previewUrl"}},{"kind":"Field","name":{"kind":"Name","value":"sourceApplication"}},{"kind":"Field","alias":{"kind":"Name","value":"commentThreadCount"},"name":{"kind":"Name","value":"commentThreads"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectModelPageDialogDeleteVersion"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectModelPageDialogMoveToVersion"}}]}}]} as unknown as DocumentNode<ProjectModelPageVersionsCardVersionFragment, unknown>;
export const ProjectModelPageVersionsProjectFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectModelPageVersionsProject"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"model"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"modelId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"versions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"16"}},{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"Variable","name":{"kind":"Name","value":"versionsCursor"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectModelPageVersionsCardVersion"}}]}}]}}]}}]}}]} as unknown as DocumentNode<ProjectModelPageVersionsProjectFragment, unknown>;
export const ProjectModelPageDialogEditMessageVersionFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectModelPageDialogEditMessageVersion"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Version"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]} as unknown as DocumentNode<ProjectModelPageDialogEditMessageVersionFragment, unknown>;
export const FormUsersSelectItemFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FormUsersSelectItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LimitedUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}}]} as unknown as DocumentNode<FormUsersSelectItemFragment, unknown>;
export const LinkableCommentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LinkableComment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Comment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"viewerResources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"modelId"}},{"kind":"Field","name":{"kind":"Name","value":"versionId"}},{"kind":"Field","name":{"kind":"Name","value":"objectId"}}]}}]}}]} as unknown as DocumentNode<LinkableCommentFragment, unknown>;
export const ProjectPageLatestItemsCommentItemFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageLatestItemsCommentItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Comment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FormUsersSelectItem"}}]}},{"kind":"Field","name":{"kind":"Name","value":"screenshot"}},{"kind":"Field","name":{"kind":"Name","value":"rawText"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","alias":{"kind":"Name","value":"repliesCount"},"name":{"kind":"Name","value":"replies"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"replyAuthors"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"4"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FormUsersSelectItem"}}]}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"LinkableComment"}}]}}]} as unknown as DocumentNode<ProjectPageLatestItemsCommentItemFragment, unknown>;
export const ModelPreviewFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ModelPreview"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"previewUrl"}}]}}]} as unknown as DocumentNode<ModelPreviewFragment, unknown>;
export const ProjectModelsViewModelItemFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectModelsViewModelItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","alias":{"kind":"Name","value":"versionCount"},"name":{"kind":"Name","value":"versions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","alias":{"kind":"Name","value":"commentThreadCount"},"name":{"kind":"Name","value":"commentThreads"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"previewUrl"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<ProjectModelsViewModelItemFragment, unknown>;
export const SingleLevelModelTreeItemFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SingleLevelModelTreeItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ModelsTreeItem"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}},{"kind":"Field","name":{"kind":"Name","value":"model"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectModelsViewModelItem"}}]}},{"kind":"Field","name":{"kind":"Name","value":"hasChildren"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<SingleLevelModelTreeItemFragment, unknown>;
export const ProjectPageModelsCardProjectFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsCardProject"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]} as unknown as DocumentNode<ProjectPageModelsCardProjectFragment, unknown>;
export const ProjectDashboardItemNoModelsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectDashboardItemNoModels"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsCardProject"}}]}}]} as unknown as DocumentNode<ProjectDashboardItemNoModelsFragment, unknown>;
export const ProjectPageModelsCardRenameDialogFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsCardRenameDialog"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]} as unknown as DocumentNode<ProjectPageModelsCardRenameDialogFragment, unknown>;
export const ProjectPageModelsCardDeleteDialogFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsCardDeleteDialog"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]} as unknown as DocumentNode<ProjectPageModelsCardDeleteDialogFragment, unknown>;
export const ProjectPageModelsActionsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsActions"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]} as unknown as DocumentNode<ProjectPageModelsActionsFragment, unknown>;
export const ProjectPageLatestItemsModelItemFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageLatestItemsModelItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Model"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","alias":{"kind":"Name","value":"versionCount"},"name":{"kind":"Name","value":"versions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","alias":{"kind":"Name","value":"commentThreadCount"},"name":{"kind":"Name","value":"commentThreads"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"previewUrl"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsCardRenameDialog"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsCardDeleteDialog"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsActions"}}]}}]} as unknown as DocumentNode<ProjectPageLatestItemsModelItemFragment, unknown>;
export const ProjectDashboardItemFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectDashboardItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectDashboardItemNoModels"}},{"kind":"Field","name":{"kind":"Name","value":"models"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"4"}},{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"onlyWithVersions"},"value":{"kind":"BooleanValue","value":true}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageLatestItemsModelItem"}}]}}]}}]}}]} as unknown as DocumentNode<ProjectDashboardItemFragment, unknown>;
export const ProjectsDashboardFilledFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectsDashboardFilled"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ProjectCollection"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectDashboardItem"}}]}}]}}]} as unknown as DocumentNode<ProjectsDashboardFilledFragment, unknown>;
export const ProjectsInviteBannerFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectsInviteBanner"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PendingStreamCollaborator"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"invitedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}}]}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"projectName"}},{"kind":"Field","name":{"kind":"Name","value":"token"}}]}}]} as unknown as DocumentNode<ProjectsInviteBannerFragment, unknown>;
export const ProjectsInviteBannersFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectsInviteBanners"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectInvites"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsInviteBanner"}}]}}]}}]} as unknown as DocumentNode<ProjectsInviteBannersFragment, unknown>;
export const AppAuthorAvatarFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AppAuthorAvatar"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AppAuthor"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}}]} as unknown as DocumentNode<AppAuthorAvatarFragment, unknown>;
export const ActiveUserAvatarFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ActiveUserAvatar"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}}]} as unknown as DocumentNode<ActiveUserAvatarFragment, unknown>;
export const ViewerModelVersionCardItemFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ViewerModelVersionCardItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Version"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"referencedObject"}},{"kind":"Field","name":{"kind":"Name","value":"sourceApplication"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"previewUrl"}},{"kind":"Field","name":{"kind":"Name","value":"authorUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}}]}}]}}]} as unknown as DocumentNode<ViewerModelVersionCardItemFragment, unknown>;
export const ProjectUpdatableMetadataFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectUpdatableMetadata"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"allowPublicComments"}}]}}]} as unknown as DocumentNode<ProjectUpdatableMetadataFragment, unknown>;
export const ThreadCommentAttachmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ThreadCommentAttachment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Comment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"text"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"attachments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}},{"kind":"Field","name":{"kind":"Name","value":"fileType"}},{"kind":"Field","name":{"kind":"Name","value":"fileSize"}}]}}]}}]}}]} as unknown as DocumentNode<ThreadCommentAttachmentFragment, unknown>;
export const ViewerCommentsReplyItemFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ViewerCommentsReplyItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Comment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"archived"}},{"kind":"Field","name":{"kind":"Name","value":"rawText"}},{"kind":"Field","name":{"kind":"Name","value":"text"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"doc"}}]}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ThreadCommentAttachment"}}]}}]} as unknown as DocumentNode<ViewerCommentsReplyItemFragment, unknown>;
export const ViewerCommentsListItemFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ViewerCommentsListItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Comment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"rawText"}},{"kind":"Field","name":{"kind":"Name","value":"archived"}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"viewedAt"}},{"kind":"Field","name":{"kind":"Name","value":"replies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ViewerCommentsReplyItem"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"replyAuthors"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"4"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FormUsersSelectItem"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"resources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resourceId"}},{"kind":"Field","name":{"kind":"Name","value":"resourceType"}}]}}]}}]} as unknown as DocumentNode<ViewerCommentsListItemFragment, unknown>;
export const ViewerCommentBubblesDataFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ViewerCommentBubblesData"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Comment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"viewedAt"}},{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"location"}},{"kind":"Field","name":{"kind":"Name","value":"camPos"}},{"kind":"Field","name":{"kind":"Name","value":"sectionBox"}},{"kind":"Field","name":{"kind":"Name","value":"selection"}},{"kind":"Field","name":{"kind":"Name","value":"filters"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hiddenIds"}},{"kind":"Field","name":{"kind":"Name","value":"isolatedIds"}},{"kind":"Field","name":{"kind":"Name","value":"propertyInfoKey"}},{"kind":"Field","name":{"kind":"Name","value":"passMax"}},{"kind":"Field","name":{"kind":"Name","value":"passMin"}},{"kind":"Field","name":{"kind":"Name","value":"sectionBox"}}]}}]}}]}}]} as unknown as DocumentNode<ViewerCommentBubblesDataFragment, unknown>;
export const ViewerCommentThreadFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ViewerCommentThread"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Comment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ViewerCommentsListItem"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ViewerCommentBubblesData"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ViewerCommentsReplyItem"}}]}}]} as unknown as DocumentNode<ViewerCommentThreadFragment, unknown>;
export const ProjectPageProjectHeaderFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageProjectHeader"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"allowPublicComments"}}]}}]} as unknown as DocumentNode<ProjectPageProjectHeaderFragment, unknown>;
export const ProjectPageStatsBlockTeamFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageStatsBlockTeam"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}}]}}]}}]}}]} as unknown as DocumentNode<ProjectPageStatsBlockTeamFragment, unknown>;
export const ProjectPageTeamDialogFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageTeamDialog"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"allowPublicComments"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"invitedTeam"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"inviteId"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}}]}}]}}]}}]} as unknown as DocumentNode<ProjectPageTeamDialogFragment, unknown>;
export const ProjectPageStatsBlockVersionsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageStatsBlockVersions"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"versionCount"},"name":{"kind":"Name","value":"versions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}}]} as unknown as DocumentNode<ProjectPageStatsBlockVersionsFragment, unknown>;
export const ProjectPageStatsBlockModelsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageStatsBlockModels"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"modelCount"},"name":{"kind":"Name","value":"models"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}}]} as unknown as DocumentNode<ProjectPageStatsBlockModelsFragment, unknown>;
export const ProjectPageStatsBlockCommentsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageStatsBlockComments"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"commentThreadCount"},"name":{"kind":"Name","value":"commentThreads"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}}]} as unknown as DocumentNode<ProjectPageStatsBlockCommentsFragment, unknown>;
export const ProjectPageLatestItemsModelsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageLatestItemsModels"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","alias":{"kind":"Name","value":"modelCount"},"name":{"kind":"Name","value":"models"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"sourceApps"}},{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FormUsersSelectItem"}}]}}]}}]}}]} as unknown as DocumentNode<ProjectPageLatestItemsModelsFragment, unknown>;
export const ProjectPageLatestItemsCommentsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageLatestItemsComments"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","alias":{"kind":"Name","value":"commentThreadCount"},"name":{"kind":"Name","value":"commentThreads"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}}]} as unknown as DocumentNode<ProjectPageLatestItemsCommentsFragment, unknown>;
export const ProjectPageModelsViewFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageModelsView"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","alias":{"kind":"Name","value":"modelCount"},"name":{"kind":"Name","value":"models"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"sourceApps"}},{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FormUsersSelectItem"}}]}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsCardProject"}}]}}]} as unknown as DocumentNode<ProjectPageModelsViewFragment, unknown>;
export const ProjectPageProjectFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectPageProject"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageProjectHeader"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageStatsBlockTeam"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageTeamDialog"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageStatsBlockVersions"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageStatsBlockModels"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageStatsBlockComments"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageLatestItemsModels"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageLatestItemsComments"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsView"}}]}}]} as unknown as DocumentNode<ProjectPageProjectFragment, unknown>;
export const ModelPageProjectFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ModelPageProject"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]} as unknown as DocumentNode<ModelPageProjectFragment, unknown>;
export const EmailVerificationBannerStateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"EmailVerificationBannerState"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"verified"}},{"kind":"Field","name":{"kind":"Name","value":"hasPendingVerification"}}]}}]}}]} as unknown as DocumentNode<EmailVerificationBannerStateQuery, EmailVerificationBannerStateQueryVariables>;
export const RequestVerificationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RequestVerification"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requestVerification"}}]}}]} as unknown as DocumentNode<RequestVerificationMutation, RequestVerificationMutationVariables>;
export const OnUserProjectsUpdateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"OnUserProjectsUpdate"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userProjectsUpdated"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"project"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectDashboardItem"}}]}}]}}]}},...ProjectDashboardItemFragmentDoc.definitions,...ProjectDashboardItemNoModelsFragmentDoc.definitions,...ProjectPageModelsCardProjectFragmentDoc.definitions,...ProjectPageLatestItemsModelItemFragmentDoc.definitions,...ProjectPageModelsCardRenameDialogFragmentDoc.definitions,...ProjectPageModelsCardDeleteDialogFragmentDoc.definitions,...ProjectPageModelsActionsFragmentDoc.definitions]} as unknown as DocumentNode<OnUserProjectsUpdateSubscription, OnUserProjectsUpdateSubscriptionVariables>;
export const CreateOnboardingProjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateOnboardingProject"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createForOnboarding"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageProject"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectDashboardItem"}}]}}]}}]}},...ProjectPageProjectFragmentDoc.definitions,...ProjectPageProjectHeaderFragmentDoc.definitions,...ProjectPageStatsBlockTeamFragmentDoc.definitions,...LimitedUserAvatarFragmentDoc.definitions,...ProjectPageTeamDialogFragmentDoc.definitions,...ProjectPageStatsBlockVersionsFragmentDoc.definitions,...ProjectPageStatsBlockModelsFragmentDoc.definitions,...ProjectPageStatsBlockCommentsFragmentDoc.definitions,...ProjectPageLatestItemsModelsFragmentDoc.definitions,...FormUsersSelectItemFragmentDoc.definitions,...ProjectPageLatestItemsCommentsFragmentDoc.definitions,...ProjectPageModelsViewFragmentDoc.definitions,...ProjectPageModelsCardProjectFragmentDoc.definitions,...ProjectDashboardItemFragmentDoc.definitions,...ProjectDashboardItemNoModelsFragmentDoc.definitions,...ProjectPageLatestItemsModelItemFragmentDoc.definitions,...ProjectPageModelsCardRenameDialogFragmentDoc.definitions,...ProjectPageModelsCardDeleteDialogFragmentDoc.definitions,...ProjectPageModelsActionsFragmentDoc.definitions]} as unknown as DocumentNode<CreateOnboardingProjectMutation, CreateOnboardingProjectMutationVariables>;
export const ActiveUserMainMetadataDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ActiveUserMainMetadata"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"isOnboardingFinished"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"verified"}}]}}]}}]} as unknown as DocumentNode<ActiveUserMainMetadataQuery, ActiveUserMainMetadataQueryVariables>;
export const FinishOnboardingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"FinishOnboarding"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeUserMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"finishOnboarding"}}]}}]}}]} as unknown as DocumentNode<FinishOnboardingMutation, FinishOnboardingMutationVariables>;
export const AuthServerInfoDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AuthServerInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"serverInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AuthStategiesServerInfoFragment"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ServerTermsOfServicePrivacyPolicyFragment"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AuthRegisterPanelServerInfo"}}]}}]}},...AuthStategiesServerInfoFragmentFragmentDoc.definitions,...ServerTermsOfServicePrivacyPolicyFragmentFragmentDoc.definitions,...AuthRegisterPanelServerInfoFragmentDoc.definitions]} as unknown as DocumentNode<AuthServerInfoQuery, AuthServerInfoQueryVariables>;
export const AuthorizableAppMetadataDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AuthorizableAppMetadata"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"app"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"trustByDefault"}},{"kind":"Field","name":{"kind":"Name","value":"redirectUrl"}},{"kind":"Field","name":{"kind":"Name","value":"scopes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}}]}}]}}]} as unknown as DocumentNode<AuthorizableAppMetadataQuery, AuthorizableAppMetadataQueryVariables>;
export const MentionsUserSearchDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MentionsUserSearch"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"query"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"emailOnly"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}},"defaultValue":{"kind":"BooleanValue","value":false}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userSearch"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"query"},"value":{"kind":"Variable","name":{"kind":"Name","value":"query"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"5"}},{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"NullValue"}},{"kind":"Argument","name":{"kind":"Name","value":"archived"},"value":{"kind":"BooleanValue","value":false}},{"kind":"Argument","name":{"kind":"Name","value":"emailOnly"},"value":{"kind":"Variable","name":{"kind":"Name","value":"emailOnly"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"company"}}]}}]}}]}}]} as unknown as DocumentNode<MentionsUserSearchQuery, MentionsUserSearchQueryVariables>;
export const UserSearchDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"UserSearch"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"query"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"archived"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userSearch"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"query"},"value":{"kind":"Variable","name":{"kind":"Name","value":"query"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}}},{"kind":"Argument","name":{"kind":"Name","value":"archived"},"value":{"kind":"Variable","name":{"kind":"Name","value":"archived"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"bio"}},{"kind":"Field","name":{"kind":"Name","value":"company"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"verified"}}]}}]}}]}}]} as unknown as DocumentNode<UserSearchQuery, UserSearchQueryVariables>;
export const ServerInfoBlobSizeLimitDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ServerInfoBlobSizeLimit"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"serverInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"blobSizeLimitBytes"}}]}}]}}]} as unknown as DocumentNode<ServerInfoBlobSizeLimitQuery, ServerInfoBlobSizeLimitQueryVariables>;
export const ProjectModelsSelectorValuesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectModelsSelectorValues"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"models"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"100"}},{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CommonModelSelectorModel"}}]}}]}}]}}]}},...CommonModelSelectorModelFragmentDoc.definitions]} as unknown as DocumentNode<ProjectModelsSelectorValuesQuery, ProjectModelsSelectorValuesQueryVariables>;
export const ServerVersionInfoDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ServerVersionInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"serverInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"version"}}]}}]}}]} as unknown as DocumentNode<ServerVersionInfoQuery, ServerVersionInfoQueryVariables>;
export const InternalTestDataDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"InternalTestData"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"testNumber"}},{"kind":"Field","name":{"kind":"Name","value":"testList"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"foo"}},{"kind":"Field","name":{"kind":"Name","value":"bar"}}]}}]}}]} as unknown as DocumentNode<InternalTestDataQuery, InternalTestDataQueryVariables>;
export const CreateModelDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateModel"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateModelInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"modelMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"create"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageLatestItemsModelItem"}}]}}]}}]}},...ProjectPageLatestItemsModelItemFragmentDoc.definitions,...ProjectPageModelsCardRenameDialogFragmentDoc.definitions,...ProjectPageModelsCardDeleteDialogFragmentDoc.definitions,...ProjectPageModelsActionsFragmentDoc.definitions]} as unknown as DocumentNode<CreateModelMutation, CreateModelMutationVariables>;
export const CreateProjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateProject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ProjectCreateInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"create"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageProject"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectDashboardItem"}}]}}]}}]}},...ProjectPageProjectFragmentDoc.definitions,...ProjectPageProjectHeaderFragmentDoc.definitions,...ProjectPageStatsBlockTeamFragmentDoc.definitions,...LimitedUserAvatarFragmentDoc.definitions,...ProjectPageTeamDialogFragmentDoc.definitions,...ProjectPageStatsBlockVersionsFragmentDoc.definitions,...ProjectPageStatsBlockModelsFragmentDoc.definitions,...ProjectPageStatsBlockCommentsFragmentDoc.definitions,...ProjectPageLatestItemsModelsFragmentDoc.definitions,...FormUsersSelectItemFragmentDoc.definitions,...ProjectPageLatestItemsCommentsFragmentDoc.definitions,...ProjectPageModelsViewFragmentDoc.definitions,...ProjectPageModelsCardProjectFragmentDoc.definitions,...ProjectDashboardItemFragmentDoc.definitions,...ProjectDashboardItemNoModelsFragmentDoc.definitions,...ProjectPageLatestItemsModelItemFragmentDoc.definitions,...ProjectPageModelsCardRenameDialogFragmentDoc.definitions,...ProjectPageModelsCardDeleteDialogFragmentDoc.definitions,...ProjectPageModelsActionsFragmentDoc.definitions]} as unknown as DocumentNode<CreateProjectMutation, CreateProjectMutationVariables>;
export const UpdateModelDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateModel"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateModelInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"modelMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"update"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageLatestItemsModelItem"}}]}}]}}]}},...ProjectPageLatestItemsModelItemFragmentDoc.definitions,...ProjectPageModelsCardRenameDialogFragmentDoc.definitions,...ProjectPageModelsCardDeleteDialogFragmentDoc.definitions,...ProjectPageModelsActionsFragmentDoc.definitions]} as unknown as DocumentNode<UpdateModelMutation, UpdateModelMutationVariables>;
export const DeleteModelDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteModel"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DeleteModelInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"modelMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"delete"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]}}]} as unknown as DocumentNode<DeleteModelMutation, DeleteModelMutationVariables>;
export const UpdateProjectRoleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateProjectRole"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ProjectUpdateRoleInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateRole"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}}]}}]}}]}}]}}]}},...LimitedUserAvatarFragmentDoc.definitions]} as unknown as DocumentNode<UpdateProjectRoleMutation, UpdateProjectRoleMutationVariables>;
export const InviteProjectUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"InviteProjectUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ProjectInviteCreateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"invites"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"create"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageTeamDialog"}}]}}]}}]}}]}},...ProjectPageTeamDialogFragmentDoc.definitions,...LimitedUserAvatarFragmentDoc.definitions]} as unknown as DocumentNode<InviteProjectUserMutation, InviteProjectUserMutationVariables>;
export const CancelProjectInviteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CancelProjectInvite"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"inviteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"invites"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cancel"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}},{"kind":"Argument","name":{"kind":"Name","value":"inviteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"inviteId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageTeamDialog"}}]}}]}}]}}]}},...ProjectPageTeamDialogFragmentDoc.definitions,...LimitedUserAvatarFragmentDoc.definitions]} as unknown as DocumentNode<CancelProjectInviteMutation, CancelProjectInviteMutationVariables>;
export const UpdateProjectMetadataDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateProjectMetadata"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"update"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ProjectUpdateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"update"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"update"},"value":{"kind":"Variable","name":{"kind":"Name","value":"update"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectUpdatableMetadata"}}]}}]}}]}},...ProjectUpdatableMetadataFragmentDoc.definitions]} as unknown as DocumentNode<UpdateProjectMetadataMutation, UpdateProjectMetadataMutationVariables>;
export const DeleteProjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteProject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"delete"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]}}]} as unknown as DocumentNode<DeleteProjectMutation, DeleteProjectMutationVariables>;
export const UseProjectInviteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UseProjectInvite"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ProjectInviteUseInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"invites"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"use"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]}}]}}]} as unknown as DocumentNode<UseProjectInviteMutation, UseProjectInviteMutationVariables>;
export const LeaveProjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"LeaveProject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"leave"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}]}]}}]}}]} as unknown as DocumentNode<LeaveProjectMutation, LeaveProjectMutationVariables>;
export const DeleteVersionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteVersions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DeleteVersionsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"versionMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"delete"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]}}]} as unknown as DocumentNode<DeleteVersionsMutation, DeleteVersionsMutationVariables>;
export const MoveVersionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MoveVersions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MoveVersionsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"versionMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"moveToModel"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<MoveVersionsMutation, MoveVersionsMutationVariables>;
export const UpdateVersionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateVersion"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateVersionInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"versionMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"update"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateVersionMutation, UpdateVersionMutationVariables>;
export const ProjectAccessCheckDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectAccessCheck"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<ProjectAccessCheckQuery, ProjectAccessCheckQueryVariables>;
export const ProjectsDashboardQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectsDashboardQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"UserProjectsFilter"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"projects"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"6"}},{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectDashboardItem"}}]}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsInviteBanners"}}]}}]}},...ProjectDashboardItemFragmentDoc.definitions,...ProjectDashboardItemNoModelsFragmentDoc.definitions,...ProjectPageModelsCardProjectFragmentDoc.definitions,...ProjectPageLatestItemsModelItemFragmentDoc.definitions,...ProjectPageModelsCardRenameDialogFragmentDoc.definitions,...ProjectPageModelsCardDeleteDialogFragmentDoc.definitions,...ProjectPageModelsActionsFragmentDoc.definitions,...ProjectsInviteBannersFragmentDoc.definitions,...ProjectsInviteBannerFragmentDoc.definitions,...LimitedUserAvatarFragmentDoc.definitions]} as unknown as DocumentNode<ProjectsDashboardQueryQuery, ProjectsDashboardQueryQueryVariables>;
export const ProjectPageQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectPageQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"token"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageProject"}}]}},{"kind":"Field","name":{"kind":"Name","value":"projectInvite"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"token"},"value":{"kind":"Variable","name":{"kind":"Name","value":"token"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsInviteBanner"}}]}}]}},...ProjectPageProjectFragmentDoc.definitions,...ProjectPageProjectHeaderFragmentDoc.definitions,...ProjectPageStatsBlockTeamFragmentDoc.definitions,...LimitedUserAvatarFragmentDoc.definitions,...ProjectPageTeamDialogFragmentDoc.definitions,...ProjectPageStatsBlockVersionsFragmentDoc.definitions,...ProjectPageStatsBlockModelsFragmentDoc.definitions,...ProjectPageStatsBlockCommentsFragmentDoc.definitions,...ProjectPageLatestItemsModelsFragmentDoc.definitions,...FormUsersSelectItemFragmentDoc.definitions,...ProjectPageLatestItemsCommentsFragmentDoc.definitions,...ProjectPageModelsViewFragmentDoc.definitions,...ProjectPageModelsCardProjectFragmentDoc.definitions,...ProjectsInviteBannerFragmentDoc.definitions]} as unknown as DocumentNode<ProjectPageQueryQuery, ProjectPageQueryQueryVariables>;
export const ProjectLatestModelsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectLatestModels"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ProjectModelsFilter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"models"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"NullValue"}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"100"}},{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageLatestItemsModelItem"}}]}}]}}]}}]}},...ProjectPageLatestItemsModelItemFragmentDoc.definitions,...ProjectPageModelsCardRenameDialogFragmentDoc.definitions,...ProjectPageModelsCardDeleteDialogFragmentDoc.definitions,...ProjectPageModelsActionsFragmentDoc.definitions]} as unknown as DocumentNode<ProjectLatestModelsQuery, ProjectLatestModelsQueryVariables>;
export const ProjectModelsTreeTopLevelDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectModelsTreeTopLevel"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"modelsTree"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SingleLevelModelTreeItem"}}]}}]}}]}},...SingleLevelModelTreeItemFragmentDoc.definitions,...ProjectModelsViewModelItemFragmentDoc.definitions]} as unknown as DocumentNode<ProjectModelsTreeTopLevelQuery, ProjectModelsTreeTopLevelQueryVariables>;
export const ProjectModelChildrenTreeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectModelChildrenTree"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"parentName"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"modelChildrenTree"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"fullName"},"value":{"kind":"Variable","name":{"kind":"Name","value":"parentName"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SingleLevelModelTreeItem"}}]}}]}}]}},...SingleLevelModelTreeItemFragmentDoc.definitions,...ProjectModelsViewModelItemFragmentDoc.definitions]} as unknown as DocumentNode<ProjectModelChildrenTreeQuery, ProjectModelChildrenTreeQueryVariables>;
export const ProjectLatestCommentThreadsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectLatestCommentThreads"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"commentThreads"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"NullValue"}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"8"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageLatestItemsCommentItem"}}]}}]}}]}}]}},...ProjectPageLatestItemsCommentItemFragmentDoc.definitions,...FormUsersSelectItemFragmentDoc.definitions,...LinkableCommentFragmentDoc.definitions]} as unknown as DocumentNode<ProjectLatestCommentThreadsQuery, ProjectLatestCommentThreadsQueryVariables>;
export const ProjectInviteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectInvite"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"token"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectInvite"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}},{"kind":"Argument","name":{"kind":"Name","value":"token"},"value":{"kind":"Variable","name":{"kind":"Name","value":"token"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectsInviteBanner"}}]}}]}},...ProjectsInviteBannerFragmentDoc.definitions,...LimitedUserAvatarFragmentDoc.definitions]} as unknown as DocumentNode<ProjectInviteQuery, ProjectInviteQueryVariables>;
export const ProjectModelCheckDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectModelCheck"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"modelId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"model"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"modelId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<ProjectModelCheckQuery, ProjectModelCheckQueryVariables>;
export const ProjectModelPageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectModelPage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"modelId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"versionsCursor"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectModelPageHeaderProject"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectModelPageVersionsProject"}}]}}]}},...ProjectModelPageHeaderProjectFragmentDoc.definitions,...ProjectModelPageVersionsProjectFragmentDoc.definitions,...ProjectModelPageVersionsCardVersionFragmentDoc.definitions,...LimitedUserAvatarFragmentDoc.definitions,...ProjectModelPageDialogDeleteVersionFragmentDoc.definitions,...ProjectModelPageDialogMoveToVersionFragmentDoc.definitions]} as unknown as DocumentNode<ProjectModelPageQuery, ProjectModelPageQueryVariables>;
export const ProjectModelVersionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectModelVersions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"modelId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"versionsCursor"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectModelPageVersionsProject"}}]}}]}},...ProjectModelPageVersionsProjectFragmentDoc.definitions,...ProjectModelPageVersionsCardVersionFragmentDoc.definitions,...LimitedUserAvatarFragmentDoc.definitions,...ProjectModelPageDialogDeleteVersionFragmentDoc.definitions,...ProjectModelPageDialogMoveToVersionFragmentDoc.definitions]} as unknown as DocumentNode<ProjectModelVersionsQuery, ProjectModelVersionsQueryVariables>;
export const OnProjectUpdatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"OnProjectUpdated"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectUpdated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"project"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageProject"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectDashboardItemNoModels"}}]}}]}}]}},...ProjectPageProjectFragmentDoc.definitions,...ProjectPageProjectHeaderFragmentDoc.definitions,...ProjectPageStatsBlockTeamFragmentDoc.definitions,...LimitedUserAvatarFragmentDoc.definitions,...ProjectPageTeamDialogFragmentDoc.definitions,...ProjectPageStatsBlockVersionsFragmentDoc.definitions,...ProjectPageStatsBlockModelsFragmentDoc.definitions,...ProjectPageStatsBlockCommentsFragmentDoc.definitions,...ProjectPageLatestItemsModelsFragmentDoc.definitions,...FormUsersSelectItemFragmentDoc.definitions,...ProjectPageLatestItemsCommentsFragmentDoc.definitions,...ProjectPageModelsViewFragmentDoc.definitions,...ProjectPageModelsCardProjectFragmentDoc.definitions,...ProjectDashboardItemNoModelsFragmentDoc.definitions]} as unknown as DocumentNode<OnProjectUpdatedSubscription, OnProjectUpdatedSubscriptionVariables>;
export const OnProjectModelsUpdateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"OnProjectModelsUpdate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectModelsUpdated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"model"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"versions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"referencedObject"}}]}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageLatestItemsModelItem"}}]}}]}}]}},...ProjectPageLatestItemsModelItemFragmentDoc.definitions,...ProjectPageModelsCardRenameDialogFragmentDoc.definitions,...ProjectPageModelsCardDeleteDialogFragmentDoc.definitions,...ProjectPageModelsActionsFragmentDoc.definitions]} as unknown as DocumentNode<OnProjectModelsUpdateSubscription, OnProjectModelsUpdateSubscriptionVariables>;
export const OnProjectVersionsUpdateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"OnProjectVersionsUpdate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectVersionsUpdated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"modelId"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"version"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ViewerModelVersionCardItem"}},{"kind":"Field","name":{"kind":"Name","value":"model"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageLatestItemsModelItem"}}]}}]}}]}}]}},...ViewerModelVersionCardItemFragmentDoc.definitions,...LimitedUserAvatarFragmentDoc.definitions,...ProjectPageLatestItemsModelItemFragmentDoc.definitions,...ProjectPageModelsCardRenameDialogFragmentDoc.definitions,...ProjectPageModelsCardDeleteDialogFragmentDoc.definitions,...ProjectPageModelsActionsFragmentDoc.definitions]} as unknown as DocumentNode<OnProjectVersionsUpdateSubscription, OnProjectVersionsUpdateSubscriptionVariables>;
export const OnProjectVersionsPreviewGeneratedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"OnProjectVersionsPreviewGenerated"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectVersionsPreviewGenerated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"objectId"}},{"kind":"Field","name":{"kind":"Name","value":"versionId"}}]}}]}}]} as unknown as DocumentNode<OnProjectVersionsPreviewGeneratedSubscription, OnProjectVersionsPreviewGeneratedSubscriptionVariables>;
export const InviteServerUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"InviteServerUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ServerInviteCreateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"serverInviteCreate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<InviteServerUserMutation, InviteServerUserMutationVariables>;
export const BroadcastViewerUserActivityDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"BroadcastViewerUserActivity"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"resourceIdString"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"message"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ViewerUserActivityMessageInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"broadcastViewerUserActivity"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}},{"kind":"Argument","name":{"kind":"Name","value":"resourceIdString"},"value":{"kind":"Variable","name":{"kind":"Name","value":"resourceIdString"}}},{"kind":"Argument","name":{"kind":"Name","value":"message"},"value":{"kind":"Variable","name":{"kind":"Name","value":"message"}}}]}]}}]} as unknown as DocumentNode<BroadcastViewerUserActivityMutation, BroadcastViewerUserActivityMutationVariables>;
export const MarkCommentViewedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MarkCommentViewed"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"threadId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"commentMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markViewed"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"commentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"threadId"}}}]}]}}]}}]} as unknown as DocumentNode<MarkCommentViewedMutation, MarkCommentViewedMutationVariables>;
export const CreateCommentThreadDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateCommentThread"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateCommentInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"commentMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"create"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ViewerCommentThread"}}]}}]}}]}},...ViewerCommentThreadFragmentDoc.definitions,...ViewerCommentsListItemFragmentDoc.definitions,...LimitedUserAvatarFragmentDoc.definitions,...ViewerCommentsReplyItemFragmentDoc.definitions,...ThreadCommentAttachmentFragmentDoc.definitions,...FormUsersSelectItemFragmentDoc.definitions,...ViewerCommentBubblesDataFragmentDoc.definitions]} as unknown as DocumentNode<CreateCommentThreadMutation, CreateCommentThreadMutationVariables>;
export const CreateCommentReplyDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateCommentReply"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateCommentReplyInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"commentMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"reply"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ViewerCommentsReplyItem"}}]}}]}}]}},...ViewerCommentsReplyItemFragmentDoc.definitions,...LimitedUserAvatarFragmentDoc.definitions,...ThreadCommentAttachmentFragmentDoc.definitions]} as unknown as DocumentNode<CreateCommentReplyMutation, CreateCommentReplyMutationVariables>;
export const ArchiveCommentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ArchiveComment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"commentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"archived"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"commentMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"archive"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"commentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"commentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"archived"},"value":{"kind":"Variable","name":{"kind":"Name","value":"archived"}}}]}]}}]}}]} as unknown as DocumentNode<ArchiveCommentMutation, ArchiveCommentMutationVariables>;
export const ProjectViewerResourcesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectViewerResources"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"resourceUrlString"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"viewerResources"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"resourceIdString"},"value":{"kind":"Variable","name":{"kind":"Name","value":"resourceUrlString"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"identifier"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"modelId"}},{"kind":"Field","name":{"kind":"Name","value":"versionId"}},{"kind":"Field","name":{"kind":"Name","value":"objectId"}}]}}]}}]}}]}}]} as unknown as DocumentNode<ProjectViewerResourcesQuery, ProjectViewerResourcesQueryVariables>;
export const ViewerLoadedResourcesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ViewerLoadedResources"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"modelIds"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"versionIds"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"models"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"ids"},"value":{"kind":"Variable","name":{"kind":"Name","value":"modelIds"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","alias":{"kind":"Name","value":"loadedVersion"},"name":{"kind":"Name","value":"versions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"priorityIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"versionIds"}}}]}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ViewerModelVersionCardItem"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"versions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"5"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ViewerModelVersionCardItem"}}]}}]}}]}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectPageModelsView"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ModelPageProject"}}]}}]}},...ViewerModelVersionCardItemFragmentDoc.definitions,...LimitedUserAvatarFragmentDoc.definitions,...ProjectPageModelsViewFragmentDoc.definitions,...FormUsersSelectItemFragmentDoc.definitions,...ProjectPageModelsCardProjectFragmentDoc.definitions,...ModelPageProjectFragmentDoc.definitions]} as unknown as DocumentNode<ViewerLoadedResourcesQuery, ViewerLoadedResourcesQueryVariables>;
export const ViewerModelVersionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ViewerModelVersions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"modelId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"versionsCursor"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"model"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"modelId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"versions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"Variable","name":{"kind":"Name","value":"versionsCursor"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"5"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ViewerModelVersionCardItem"}}]}}]}}]}}]}}]}},...ViewerModelVersionCardItemFragmentDoc.definitions,...LimitedUserAvatarFragmentDoc.definitions]} as unknown as DocumentNode<ViewerModelVersionsQuery, ViewerModelVersionsQueryVariables>;
export const ViewerLoadedThreadsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ViewerLoadedThreads"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ProjectCommentsFilter"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"25"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"commentThreads"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}},{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"totalArchivedCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ViewerCommentThread"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"LinkableComment"}}]}}]}}]}}]}},...ViewerCommentThreadFragmentDoc.definitions,...ViewerCommentsListItemFragmentDoc.definitions,...LimitedUserAvatarFragmentDoc.definitions,...ViewerCommentsReplyItemFragmentDoc.definitions,...ThreadCommentAttachmentFragmentDoc.definitions,...FormUsersSelectItemFragmentDoc.definitions,...ViewerCommentBubblesDataFragmentDoc.definitions,...LinkableCommentFragmentDoc.definitions]} as unknown as DocumentNode<ViewerLoadedThreadsQuery, ViewerLoadedThreadsQueryVariables>;
export const OnViewerUserActivityBroadcastedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"OnViewerUserActivityBroadcasted"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"target"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ViewerUpdateTrackingTarget"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"viewerUserActivityBroadcasted"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"target"},"value":{"kind":"Variable","name":{"kind":"Name","value":"target"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userName"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserAvatar"}}]}},{"kind":"Field","name":{"kind":"Name","value":"viewerSessionId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"typing"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"isTyping"}},{"kind":"Field","name":{"kind":"Name","value":"threadId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"selection"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"filteringState"}},{"kind":"Field","name":{"kind":"Name","value":"selectionLocation"}},{"kind":"Field","name":{"kind":"Name","value":"sectionBox"}},{"kind":"Field","name":{"kind":"Name","value":"camera"}}]}}]}}]}},...LimitedUserAvatarFragmentDoc.definitions]} as unknown as DocumentNode<OnViewerUserActivityBroadcastedSubscription, OnViewerUserActivityBroadcastedSubscriptionVariables>;
export const OnViewerCommentsUpdatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"OnViewerCommentsUpdated"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"target"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ViewerUpdateTrackingTarget"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectCommentsUpdated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"target"},"value":{"kind":"Variable","name":{"kind":"Name","value":"target"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"comment"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ViewerCommentThread"}}]}}]}}]}},...ViewerCommentThreadFragmentDoc.definitions,...ViewerCommentsListItemFragmentDoc.definitions,...LimitedUserAvatarFragmentDoc.definitions,...ViewerCommentsReplyItemFragmentDoc.definitions,...ThreadCommentAttachmentFragmentDoc.definitions,...FormUsersSelectItemFragmentDoc.definitions,...ViewerCommentBubblesDataFragmentDoc.definitions]} as unknown as DocumentNode<OnViewerCommentsUpdatedSubscription, OnViewerCommentsUpdatedSubscriptionVariables>;
export const GetActiveUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetActiveUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]}}]} as unknown as DocumentNode<GetActiveUserQuery, GetActiveUserQueryVariables>;