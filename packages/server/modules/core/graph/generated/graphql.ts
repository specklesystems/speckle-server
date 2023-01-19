import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import { StreamGraphQLReturn, CommitGraphQLReturn, ProjectGraphQLReturn, VersionGraphQLReturn, ModelGraphQLReturn, ModelsTreeItemGraphQLReturn, LimitedUserGraphQLReturn, MutationsObjectGraphQLReturn } from '@/modules/core/helpers/graphTypes';
import { StreamAccessRequestGraphQLReturn } from '@/modules/accessrequests/helpers/graphTypes';
import { CommentReplyAuthorCollectionGraphQLReturn } from '@/modules/comments/helpers/graphTypes';
import { GraphQLContext } from '@/modules/shared/helpers/typeHelper';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
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
  DateTime: Date;
  EmailAddress: any;
  /** The `JSONObject` scalar type represents JSON objects as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSONObject: Record<string, unknown>;
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
  data?: Maybe<Scalars['JSONObject']>;
  id: Scalars['String'];
  /** Plain-text version of the comment text, ideal for previews */
  rawText: Scalars['String'];
  /** @deprecated Not actually implemented */
  reactions?: Maybe<Array<Maybe<Scalars['String']>>>;
  /** Gets the replies to this comment. */
  replies: CommentCollection;
  /** Total number of replies to this comment */
  repliesCount: Scalars['Int'];
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

export type CommentEditInput = {
  /** IDs of uploaded blobs that should be attached to this comment */
  blobIds: Array<Scalars['String']>;
  id: Scalars['String'];
  streamId: Scalars['String'];
  /** ProseMirror document object */
  text?: InputMaybe<Scalars['JSONObject']>;
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

export type CreateModelInput = {
  name: Scalars['String'];
  projectId: Scalars['ID'];
};

export enum DiscoverableStreamsSortType {
  CreatedDate = 'CREATED_DATE',
  FavoritesCount = 'FAVORITES_COUNT'
}

export type DiscoverableStreamsSortingInput = {
  direction: SortDirection;
  type: DiscoverableStreamsSortType;
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
  commentThreadCount: Scalars['Int'];
  /** All comment threads in this model */
  commentThreads?: Maybe<CommentCollection>;
  createdAt: Scalars['DateTime'];
  description?: Maybe<Scalars['String']>;
  /** The shortened/display name that doesn't include the names of parent models */
  displayName: Scalars['String'];
  id: Scalars['ID'];
  /** Full name including the names of parent models delimited by forward slashes */
  name: Scalars['String'];
  previewUrl?: Maybe<Scalars['String']>;
  updatedAt: Scalars['DateTime'];
  versionCount: Scalars['Int'];
  versions: VersionCollection;
};


export type ModelCommentThreadsArgs = {
  cursor?: InputMaybe<Scalars['String']>;
  limit?: Scalars['Int'];
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
};


export type ModelMutationsCreateArgs = {
  input: CreateModelInput;
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
  /**
   * Nullable cause the item can represent a parent that doesn't actually exist as a model on its own.
   * E.g. A model named "foo/bar" is supposed to be a child of "foo" and will be represented as such,
   * even if "foo" doesn't exist as its own model.
   */
  model?: Maybe<Model>;
  name: Scalars['String'];
  updatedAt: Scalars['DateTime'];
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
  /** Archives a comment. */
  commentArchive: Scalars['Boolean'];
  /** Creates a comment */
  commentCreate: Scalars['String'];
  /** Edits a comment. */
  commentEdit: Scalars['Boolean'];
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
  /** Used for broadcasting real time typing status in comment threads. Does not persist any info. */
  userCommentThreadActivityBroadcast: Scalars['Boolean'];
  /** Delete a user's account. */
  userDelete: Scalars['Boolean'];
  userNotificationPreferencesUpdate?: Maybe<Scalars['Boolean']>;
  userRoleChange: Scalars['Boolean'];
  /** Edits a user's profile. */
  userUpdate: Scalars['Boolean'];
  /** Used for broadcasting real time chat head bubbles and status. Does not persist any info. */
  userViewerActivityBroadcast: Scalars['Boolean'];
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
  /** The total number of comment threads in this project */
  commentThreadCount: Scalars['Int'];
  /** All comment threads in this project */
  commentThreads?: Maybe<CommentCollection>;
  createdAt: Scalars['DateTime'];
  description?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  /** Returns a specific model by its ID */
  model?: Maybe<Model>;
  /** Return a model tree of children for the specified model name */
  modelChildrenTree: Array<ModelsTreeItem>;
  modelCount: Scalars['Int'];
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
  team: Array<LimitedUser>;
  updatedAt: Scalars['DateTime'];
  versionCount: Scalars['Int'];
  /** Return metadata about resources being requested in the viewer */
  viewerResources: Array<ViewerResourceGroup>;
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


export type ProjectViewerResourcesArgs = {
  resourceIdString: Scalars['String'];
};

export type ProjectCollection = {
  __typename?: 'ProjectCollection';
  cursor?: Maybe<Scalars['String']>;
  items: Array<Project>;
  totalCount: Scalars['Int'];
};

export type ProjectCommentsFilter = {
  /**
   * Only request comments belonging to the resources identified by this
   * comma-delimited resouce string (same format that's used in the viewer URL)
   */
  resourceIdString?: InputMaybe<Scalars['String']>;
};

export type ProjectModelsFilter = {
  /** Filter by IDs of contributors who participated in models */
  contributors?: InputMaybe<Array<Scalars['String']>>;
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
  /** Create onboarding/tutorial project */
  createForOnboarding: Project;
  /** Delete an existing project */
  delete: Scalars['Boolean'];
  /** Updates an existing project */
  update: Project;
};


export type ProjectMutationsDeleteArgs = {
  id: Scalars['String'];
};


export type ProjectMutationsUpdateArgs = {
  stream: ProjectUpdateInput;
};

/** Any values left null will be ignored, so only set the properties that you want updated */
export type ProjectUpdateInput = {
  allowPublicComments?: InputMaybe<Scalars['Boolean']>;
  description?: InputMaybe<Scalars['String']>;
  id: Scalars['ID'];
  /**
   * Whether the stream (if public) can be found on public stream exploration pages
   * and searches
   */
  isDiscoverable?: InputMaybe<Scalars['Boolean']>;
  /** Whether the stream can be viewed by non-contributors */
  isPublic?: InputMaybe<Scalars['Boolean']>;
  name?: InputMaybe<Scalars['String']>;
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

export type ProjectVersionsUpdatedMessage = {
  __typename?: 'ProjectVersionsUpdatedMessage';
  /** Version ID */
  id: Scalars['String'];
  type: ProjectVersionsUpdatedMessageType;
  /** Null if version was deleted */
  version?: Maybe<Version>;
};

export enum ProjectVersionsUpdatedMessageType {
  Created = 'CREATED',
  Deleted = 'DELETED',
  Updated = 'UPDATED'
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
  userSearch?: Maybe<UserSearchResultCollection>;
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
  limit?: Scalars['Int'];
  query: Scalars['String'];
};

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
  scopes: Array<Maybe<Scope>>;
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
   */
  commentActivity: CommentActivityMessage;
  /**
   * Subscribes to events on a specific comment. Use to find out when:
   * - a top level comment is deleted (trigger a deletion event outside)
   * - a top level comment receives a reply.
   */
  commentThreadActivity: CommentThreadActivityMessage;
  /** Subscribe to commit created event */
  commitCreated?: Maybe<Scalars['JSONObject']>;
  /** Subscribe to commit deleted event */
  commitDeleted?: Maybe<Scalars['JSONObject']>;
  /** Subscribe to commit updated event. */
  commitUpdated?: Maybe<Scalars['JSONObject']>;
  /** Subscribe to changes to a project's models. Optionally specify modelIds to track. */
  projectModelsUpdated: ProjectModelsUpdatedMessage;
  /** Track updates to a specific project */
  projectUpdated: ProjectUpdatedMessage;
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
  /** Broadcasts "real-time" location data for viewer users. */
  userViewerActivity?: Maybe<Scalars['JSONObject']>;
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


export type SubscriptionProjectModelsUpdatedArgs = {
  id: Scalars['String'];
  modelIds?: InputMaybe<Array<Scalars['String']>>;
};


export type SubscriptionProjectUpdatedArgs = {
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

export type TestItem = {
  __typename?: 'TestItem';
  bar: Scalars['String'];
  foo: Scalars['String'];
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
  createdApps?: Maybe<Array<Maybe<ServerApp>>>;
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
  items?: Maybe<Array<Maybe<LimitedUser>>>;
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
  commentThreads?: Maybe<CommentCollection>;
  createdAt: Scalars['DateTime'];
  id: Scalars['ID'];
  message?: Maybe<Scalars['String']>;
  model: Model;
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
  ActivityCollection: ResolverTypeWrapper<ActivityCollection>;
  AdminUsersListCollection: ResolverTypeWrapper<Omit<AdminUsersListCollection, 'items'> & { items: Array<ResolversTypes['AdminUsersListItem']> }>;
  AdminUsersListItem: ResolverTypeWrapper<Omit<AdminUsersListItem, 'invitedUser' | 'registeredUser'> & { invitedUser?: Maybe<ResolversTypes['ServerInvite']>, registeredUser?: Maybe<ResolversTypes['User']> }>;
  ApiToken: ResolverTypeWrapper<ApiToken>;
  ApiTokenCreateInput: ApiTokenCreateInput;
  AppAuthor: ResolverTypeWrapper<AppAuthor>;
  AppCreateInput: AppCreateInput;
  AppUpdateInput: AppUpdateInput;
  AuthStrategy: ResolverTypeWrapper<AuthStrategy>;
  BigInt: ResolverTypeWrapper<Scalars['BigInt']>;
  BlobMetadata: ResolverTypeWrapper<BlobMetadata>;
  BlobMetadataCollection: ResolverTypeWrapper<BlobMetadataCollection>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']>;
  Branch: ResolverTypeWrapper<Omit<Branch, 'author' | 'commits'> & { author?: Maybe<ResolversTypes['User']>, commits?: Maybe<ResolversTypes['CommitCollection']> }>;
  BranchCollection: ResolverTypeWrapper<Omit<BranchCollection, 'items'> & { items?: Maybe<Array<ResolversTypes['Branch']>> }>;
  BranchCreateInput: BranchCreateInput;
  BranchDeleteInput: BranchDeleteInput;
  BranchUpdateInput: BranchUpdateInput;
  Comment: ResolverTypeWrapper<Omit<Comment, 'author' | 'replies' | 'replyAuthors'> & { author: ResolversTypes['LimitedUser'], replies: ResolversTypes['CommentCollection'], replyAuthors: ResolversTypes['CommentReplyAuthorCollection'] }>;
  CommentActivityMessage: ResolverTypeWrapper<Omit<CommentActivityMessage, 'comment'> & { comment: ResolversTypes['Comment'] }>;
  CommentCollection: ResolverTypeWrapper<Omit<CommentCollection, 'items'> & { items: Array<ResolversTypes['Comment']> }>;
  CommentCreateInput: CommentCreateInput;
  CommentEditInput: CommentEditInput;
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
  CreateModelInput: CreateModelInput;
  DateTime: ResolverTypeWrapper<Scalars['DateTime']>;
  DiscoverableStreamsSortType: DiscoverableStreamsSortType;
  DiscoverableStreamsSortingInput: DiscoverableStreamsSortingInput;
  EmailAddress: ResolverTypeWrapper<Scalars['EmailAddress']>;
  FileUpload: ResolverTypeWrapper<FileUpload>;
  ID: ResolverTypeWrapper<Scalars['ID']>;
  Int: ResolverTypeWrapper<Scalars['Int']>;
  JSONObject: ResolverTypeWrapper<Scalars['JSONObject']>;
  LimitedUser: ResolverTypeWrapper<LimitedUserGraphQLReturn>;
  Model: ResolverTypeWrapper<ModelGraphQLReturn>;
  ModelCollection: ResolverTypeWrapper<Omit<ModelCollection, 'items'> & { items: Array<ResolversTypes['Model']> }>;
  ModelMutations: ResolverTypeWrapper<MutationsObjectGraphQLReturn>;
  ModelVersionsFilter: ModelVersionsFilter;
  ModelsTreeItem: ResolverTypeWrapper<ModelsTreeItemGraphQLReturn>;
  Mutation: ResolverTypeWrapper<{}>;
  Object: ResolverTypeWrapper<Object>;
  ObjectCollection: ResolverTypeWrapper<ObjectCollection>;
  ObjectCreateInput: ObjectCreateInput;
  PasswordStrengthCheckFeedback: ResolverTypeWrapper<PasswordStrengthCheckFeedback>;
  PasswordStrengthCheckResults: ResolverTypeWrapper<PasswordStrengthCheckResults>;
  PendingStreamCollaborator: ResolverTypeWrapper<Omit<PendingStreamCollaborator, 'invitedBy' | 'user'> & { invitedBy: ResolversTypes['LimitedUser'], user?: Maybe<ResolversTypes['LimitedUser']> }>;
  Project: ResolverTypeWrapper<ProjectGraphQLReturn>;
  ProjectCollection: ResolverTypeWrapper<Omit<ProjectCollection, 'items'> & { items: Array<ResolversTypes['Project']> }>;
  ProjectCommentsFilter: ProjectCommentsFilter;
  ProjectModelsFilter: ProjectModelsFilter;
  ProjectModelsUpdatedMessage: ResolverTypeWrapper<Omit<ProjectModelsUpdatedMessage, 'model'> & { model?: Maybe<ResolversTypes['Model']> }>;
  ProjectModelsUpdatedMessageType: ProjectModelsUpdatedMessageType;
  ProjectMutations: ResolverTypeWrapper<MutationsObjectGraphQLReturn>;
  ProjectUpdateInput: ProjectUpdateInput;
  ProjectUpdatedMessage: ResolverTypeWrapper<Omit<ProjectUpdatedMessage, 'project'> & { project?: Maybe<ResolversTypes['Project']> }>;
  ProjectUpdatedMessageType: ProjectUpdatedMessageType;
  ProjectVersionsUpdatedMessage: ResolverTypeWrapper<Omit<ProjectVersionsUpdatedMessage, 'version'> & { version?: Maybe<ResolversTypes['Version']> }>;
  ProjectVersionsUpdatedMessageType: ProjectVersionsUpdatedMessageType;
  Query: ResolverTypeWrapper<{}>;
  ReplyCreateInput: ReplyCreateInput;
  ResourceIdentifier: ResolverTypeWrapper<ResourceIdentifier>;
  ResourceIdentifierInput: ResourceIdentifierInput;
  ResourceType: ResourceType;
  Role: ResolverTypeWrapper<Role>;
  Scope: ResolverTypeWrapper<Scope>;
  ServerApp: ResolverTypeWrapper<ServerApp>;
  ServerAppListItem: ResolverTypeWrapper<ServerAppListItem>;
  ServerInfo: ResolverTypeWrapper<ServerInfo>;
  ServerInfoUpdateInput: ServerInfoUpdateInput;
  ServerInvite: ResolverTypeWrapper<Omit<ServerInvite, 'invitedBy'> & { invitedBy: ResolversTypes['LimitedUser'] }>;
  ServerInviteCreateInput: ServerInviteCreateInput;
  ServerRole: ServerRole;
  ServerStats: ResolverTypeWrapper<ServerStats>;
  SmartTextEditorValue: ResolverTypeWrapper<SmartTextEditorValue>;
  SortDirection: SortDirection;
  Stream: ResolverTypeWrapper<StreamGraphQLReturn>;
  StreamAccessRequest: ResolverTypeWrapper<StreamAccessRequestGraphQLReturn>;
  StreamCollaborator: ResolverTypeWrapper<StreamCollaborator>;
  StreamCollection: ResolverTypeWrapper<Omit<StreamCollection, 'items'> & { items?: Maybe<Array<ResolversTypes['Stream']>> }>;
  StreamCreateInput: StreamCreateInput;
  StreamInviteCreateInput: StreamInviteCreateInput;
  StreamRevokePermissionInput: StreamRevokePermissionInput;
  StreamRole: StreamRole;
  StreamUpdateInput: StreamUpdateInput;
  StreamUpdatePermissionInput: StreamUpdatePermissionInput;
  String: ResolverTypeWrapper<Scalars['String']>;
  Subscription: ResolverTypeWrapper<{}>;
  TestItem: ResolverTypeWrapper<TestItem>;
  User: ResolverTypeWrapper<Omit<User, 'commits' | 'favoriteStreams' | 'projects' | 'streams'> & { commits?: Maybe<ResolversTypes['CommitCollection']>, favoriteStreams: ResolversTypes['StreamCollection'], projects: ResolversTypes['ProjectCollection'], streams: ResolversTypes['StreamCollection'] }>;
  UserDeleteInput: UserDeleteInput;
  UserProjectsFilter: UserProjectsFilter;
  UserProjectsUpdatedMessage: ResolverTypeWrapper<Omit<UserProjectsUpdatedMessage, 'project'> & { project?: Maybe<ResolversTypes['Project']> }>;
  UserProjectsUpdatedMessageType: UserProjectsUpdatedMessageType;
  UserRoleInput: UserRoleInput;
  UserSearchResultCollection: ResolverTypeWrapper<Omit<UserSearchResultCollection, 'items'> & { items?: Maybe<Array<Maybe<ResolversTypes['LimitedUser']>>> }>;
  UserUpdateInput: UserUpdateInput;
  Version: ResolverTypeWrapper<VersionGraphQLReturn>;
  VersionCollection: ResolverTypeWrapper<Omit<VersionCollection, 'items'> & { items: Array<ResolversTypes['Version']> }>;
  ViewerResourceGroup: ResolverTypeWrapper<ViewerResourceGroup>;
  ViewerResourceItem: ResolverTypeWrapper<ViewerResourceItem>;
  Webhook: ResolverTypeWrapper<Webhook>;
  WebhookCollection: ResolverTypeWrapper<WebhookCollection>;
  WebhookCreateInput: WebhookCreateInput;
  WebhookDeleteInput: WebhookDeleteInput;
  WebhookEvent: ResolverTypeWrapper<WebhookEvent>;
  WebhookEventCollection: ResolverTypeWrapper<WebhookEventCollection>;
  WebhookUpdateInput: WebhookUpdateInput;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  ActiveUserMutations: MutationsObjectGraphQLReturn;
  Activity: Activity;
  ActivityCollection: ActivityCollection;
  AdminUsersListCollection: Omit<AdminUsersListCollection, 'items'> & { items: Array<ResolversParentTypes['AdminUsersListItem']> };
  AdminUsersListItem: Omit<AdminUsersListItem, 'invitedUser' | 'registeredUser'> & { invitedUser?: Maybe<ResolversParentTypes['ServerInvite']>, registeredUser?: Maybe<ResolversParentTypes['User']> };
  ApiToken: ApiToken;
  ApiTokenCreateInput: ApiTokenCreateInput;
  AppAuthor: AppAuthor;
  AppCreateInput: AppCreateInput;
  AppUpdateInput: AppUpdateInput;
  AuthStrategy: AuthStrategy;
  BigInt: Scalars['BigInt'];
  BlobMetadata: BlobMetadata;
  BlobMetadataCollection: BlobMetadataCollection;
  Boolean: Scalars['Boolean'];
  Branch: Omit<Branch, 'author' | 'commits'> & { author?: Maybe<ResolversParentTypes['User']>, commits?: Maybe<ResolversParentTypes['CommitCollection']> };
  BranchCollection: Omit<BranchCollection, 'items'> & { items?: Maybe<Array<ResolversParentTypes['Branch']>> };
  BranchCreateInput: BranchCreateInput;
  BranchDeleteInput: BranchDeleteInput;
  BranchUpdateInput: BranchUpdateInput;
  Comment: Omit<Comment, 'author' | 'replies' | 'replyAuthors'> & { author: ResolversParentTypes['LimitedUser'], replies: ResolversParentTypes['CommentCollection'], replyAuthors: ResolversParentTypes['CommentReplyAuthorCollection'] };
  CommentActivityMessage: Omit<CommentActivityMessage, 'comment'> & { comment: ResolversParentTypes['Comment'] };
  CommentCollection: Omit<CommentCollection, 'items'> & { items: Array<ResolversParentTypes['Comment']> };
  CommentCreateInput: CommentCreateInput;
  CommentEditInput: CommentEditInput;
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
  CreateModelInput: CreateModelInput;
  DateTime: Scalars['DateTime'];
  DiscoverableStreamsSortingInput: DiscoverableStreamsSortingInput;
  EmailAddress: Scalars['EmailAddress'];
  FileUpload: FileUpload;
  ID: Scalars['ID'];
  Int: Scalars['Int'];
  JSONObject: Scalars['JSONObject'];
  LimitedUser: LimitedUserGraphQLReturn;
  Model: ModelGraphQLReturn;
  ModelCollection: Omit<ModelCollection, 'items'> & { items: Array<ResolversParentTypes['Model']> };
  ModelMutations: MutationsObjectGraphQLReturn;
  ModelVersionsFilter: ModelVersionsFilter;
  ModelsTreeItem: ModelsTreeItemGraphQLReturn;
  Mutation: {};
  Object: Object;
  ObjectCollection: ObjectCollection;
  ObjectCreateInput: ObjectCreateInput;
  PasswordStrengthCheckFeedback: PasswordStrengthCheckFeedback;
  PasswordStrengthCheckResults: PasswordStrengthCheckResults;
  PendingStreamCollaborator: Omit<PendingStreamCollaborator, 'invitedBy' | 'user'> & { invitedBy: ResolversParentTypes['LimitedUser'], user?: Maybe<ResolversParentTypes['LimitedUser']> };
  Project: ProjectGraphQLReturn;
  ProjectCollection: Omit<ProjectCollection, 'items'> & { items: Array<ResolversParentTypes['Project']> };
  ProjectCommentsFilter: ProjectCommentsFilter;
  ProjectModelsFilter: ProjectModelsFilter;
  ProjectModelsUpdatedMessage: Omit<ProjectModelsUpdatedMessage, 'model'> & { model?: Maybe<ResolversParentTypes['Model']> };
  ProjectMutations: MutationsObjectGraphQLReturn;
  ProjectUpdateInput: ProjectUpdateInput;
  ProjectUpdatedMessage: Omit<ProjectUpdatedMessage, 'project'> & { project?: Maybe<ResolversParentTypes['Project']> };
  ProjectVersionsUpdatedMessage: Omit<ProjectVersionsUpdatedMessage, 'version'> & { version?: Maybe<ResolversParentTypes['Version']> };
  Query: {};
  ReplyCreateInput: ReplyCreateInput;
  ResourceIdentifier: ResourceIdentifier;
  ResourceIdentifierInput: ResourceIdentifierInput;
  Role: Role;
  Scope: Scope;
  ServerApp: ServerApp;
  ServerAppListItem: ServerAppListItem;
  ServerInfo: ServerInfo;
  ServerInfoUpdateInput: ServerInfoUpdateInput;
  ServerInvite: Omit<ServerInvite, 'invitedBy'> & { invitedBy: ResolversParentTypes['LimitedUser'] };
  ServerInviteCreateInput: ServerInviteCreateInput;
  ServerStats: ServerStats;
  SmartTextEditorValue: SmartTextEditorValue;
  Stream: StreamGraphQLReturn;
  StreamAccessRequest: StreamAccessRequestGraphQLReturn;
  StreamCollaborator: StreamCollaborator;
  StreamCollection: Omit<StreamCollection, 'items'> & { items?: Maybe<Array<ResolversParentTypes['Stream']>> };
  StreamCreateInput: StreamCreateInput;
  StreamInviteCreateInput: StreamInviteCreateInput;
  StreamRevokePermissionInput: StreamRevokePermissionInput;
  StreamUpdateInput: StreamUpdateInput;
  StreamUpdatePermissionInput: StreamUpdatePermissionInput;
  String: Scalars['String'];
  Subscription: {};
  TestItem: TestItem;
  User: Omit<User, 'commits' | 'favoriteStreams' | 'projects' | 'streams'> & { commits?: Maybe<ResolversParentTypes['CommitCollection']>, favoriteStreams: ResolversParentTypes['StreamCollection'], projects: ResolversParentTypes['ProjectCollection'], streams: ResolversParentTypes['StreamCollection'] };
  UserDeleteInput: UserDeleteInput;
  UserProjectsFilter: UserProjectsFilter;
  UserProjectsUpdatedMessage: Omit<UserProjectsUpdatedMessage, 'project'> & { project?: Maybe<ResolversParentTypes['Project']> };
  UserRoleInput: UserRoleInput;
  UserSearchResultCollection: Omit<UserSearchResultCollection, 'items'> & { items?: Maybe<Array<Maybe<ResolversParentTypes['LimitedUser']>>> };
  UserUpdateInput: UserUpdateInput;
  Version: VersionGraphQLReturn;
  VersionCollection: Omit<VersionCollection, 'items'> & { items: Array<ResolversParentTypes['Version']> };
  ViewerResourceGroup: ViewerResourceGroup;
  ViewerResourceItem: ViewerResourceItem;
  Webhook: Webhook;
  WebhookCollection: WebhookCollection;
  WebhookCreateInput: WebhookCreateInput;
  WebhookDeleteInput: WebhookDeleteInput;
  WebhookEvent: WebhookEvent;
  WebhookEventCollection: WebhookEventCollection;
  WebhookUpdateInput: WebhookUpdateInput;
};

export type HasRoleDirectiveArgs = {
  role: Scalars['String'];
};

export type HasRoleDirectiveResolver<Result, Parent, ContextType = GraphQLContext, Args = HasRoleDirectiveArgs> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type HasScopeDirectiveArgs = {
  scope: Scalars['String'];
};

export type HasScopeDirectiveResolver<Result, Parent, ContextType = GraphQLContext, Args = HasScopeDirectiveArgs> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type HasScopesDirectiveArgs = {
  scopes: Array<Maybe<Scalars['String']>>;
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

export type IsOwnerDirectiveArgs = { };

export type IsOwnerDirectiveResolver<Result, Parent, ContextType = GraphQLContext, Args = IsOwnerDirectiveArgs> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type ActiveUserMutationsResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ActiveUserMutations'] = ResolversParentTypes['ActiveUserMutations']> = {
  finishOnboarding?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
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
  items?: Resolver<Maybe<Array<Maybe<ResolversTypes['Activity']>>>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
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
  id?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
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

export type CommentResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Comment'] = ResolversParentTypes['Comment']> = {
  archived?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  author?: Resolver<ResolversTypes['LimitedUser'], ParentType, ContextType>;
  authorId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  data?: Resolver<Maybe<ResolversTypes['JSONObject']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  rawText?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  reactions?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  replies?: Resolver<ResolversTypes['CommentCollection'], ParentType, ContextType, RequireFields<CommentRepliesArgs, 'limit'>>;
  repliesCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  replyAuthors?: Resolver<ResolversTypes['CommentReplyAuthorCollection'], ParentType, ContextType, RequireFields<CommentReplyAuthorsArgs, 'limit'>>;
  resources?: Resolver<Array<ResolversTypes['ResourceIdentifier']>, ParentType, ContextType>;
  screenshot?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  text?: Resolver<ResolversTypes['SmartTextEditorValue'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  viewedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
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

export interface DateTimeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['DateTime'], any> {
  name: 'DateTime';
}

export interface EmailAddressScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['EmailAddress'], any> {
  name: 'EmailAddress';
}

export type FileUploadResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['FileUpload'] = ResolversParentTypes['FileUpload']> = {
  branchName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  convertedCommitId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  convertedLastUpdate?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  convertedMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  convertedStatus?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  fileName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  fileSize?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  fileType?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  streamId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uploadComplete?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  uploadDate?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface JsonObjectScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['JSONObject'], any> {
  name: 'JSONObject';
}

export type LimitedUserResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['LimitedUser'] = ResolversParentTypes['LimitedUser']> = {
  activity?: Resolver<Maybe<ResolversTypes['ActivityCollection']>, ParentType, ContextType, RequireFields<LimitedUserActivityArgs, 'limit'>>;
  avatar?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  bio?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  commits?: Resolver<Maybe<ResolversTypes['CommitCollection']>, ParentType, ContextType, RequireFields<LimitedUserCommitsArgs, 'limit'>>;
  company?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  role?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  streams?: Resolver<ResolversTypes['StreamCollection'], ParentType, ContextType, RequireFields<LimitedUserStreamsArgs, 'limit'>>;
  timeline?: Resolver<Maybe<ResolversTypes['ActivityCollection']>, ParentType, ContextType, RequireFields<LimitedUserTimelineArgs, 'limit'>>;
  totalOwnedStreamsFavorites?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  verified?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ModelResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Model'] = ResolversParentTypes['Model']> = {
  author?: Resolver<ResolversTypes['LimitedUser'], ParentType, ContextType>;
  childrenTree?: Resolver<Array<ResolversTypes['ModelsTreeItem']>, ParentType, ContextType>;
  commentThreadCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  commentThreads?: Resolver<Maybe<ResolversTypes['CommentCollection']>, ParentType, ContextType, RequireFields<ModelCommentThreadsArgs, 'limit'>>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  displayName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  previewUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  versionCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
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
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ModelsTreeItemResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ModelsTreeItem'] = ResolversParentTypes['ModelsTreeItem']> = {
  children?: Resolver<Array<ResolversTypes['ModelsTreeItem']>, ParentType, ContextType>;
  fullName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  hasChildren?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  model?: Resolver<Maybe<ResolversTypes['Model']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MutationResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  _?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  activeUserMutations?: Resolver<ResolversTypes['ActiveUserMutations'], ParentType, ContextType>;
  adminDeleteUser?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationAdminDeleteUserArgs, 'userConfirmation'>>;
  apiTokenCreate?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<MutationApiTokenCreateArgs, 'token'>>;
  apiTokenRevoke?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationApiTokenRevokeArgs, 'token'>>;
  appCreate?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<MutationAppCreateArgs, 'app'>>;
  appDelete?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationAppDeleteArgs, 'appId'>>;
  appRevokeAccess?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, RequireFields<MutationAppRevokeAccessArgs, 'appId'>>;
  appUpdate?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationAppUpdateArgs, 'app'>>;
  branchCreate?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<MutationBranchCreateArgs, 'branch'>>;
  branchDelete?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationBranchDeleteArgs, 'branch'>>;
  branchUpdate?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationBranchUpdateArgs, 'branch'>>;
  commentArchive?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationCommentArchiveArgs, 'archived' | 'commentId' | 'streamId'>>;
  commentCreate?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<MutationCommentCreateArgs, 'input'>>;
  commentEdit?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationCommentEditArgs, 'input'>>;
  commentReply?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<MutationCommentReplyArgs, 'input'>>;
  commentView?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationCommentViewArgs, 'commentId' | 'streamId'>>;
  commitCreate?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<MutationCommitCreateArgs, 'commit'>>;
  commitDelete?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationCommitDeleteArgs, 'commit'>>;
  commitReceive?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationCommitReceiveArgs, 'input'>>;
  commitUpdate?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationCommitUpdateArgs, 'commit'>>;
  commitsDelete?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationCommitsDeleteArgs, 'input'>>;
  commitsMove?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationCommitsMoveArgs, 'input'>>;
  inviteDelete?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationInviteDeleteArgs, 'inviteId'>>;
  inviteResend?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationInviteResendArgs, 'inviteId'>>;
  modelMutations?: Resolver<ResolversTypes['ModelMutations'], ParentType, ContextType>;
  objectCreate?: Resolver<Array<Maybe<ResolversTypes['String']>>, ParentType, ContextType, RequireFields<MutationObjectCreateArgs, 'objectInput'>>;
  projectMutations?: Resolver<ResolversTypes['ProjectMutations'], ParentType, ContextType>;
  requestVerification?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
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
  webhookCreate?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<MutationWebhookCreateArgs, 'webhook'>>;
  webhookDelete?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<MutationWebhookDeleteArgs, 'webhook'>>;
  webhookUpdate?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<MutationWebhookUpdateArgs, 'webhook'>>;
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
  objects?: Resolver<Array<Maybe<ResolversTypes['Object']>>, ParentType, ContextType>;
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
  role?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  streamId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  streamName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  token?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  user?: Resolver<Maybe<ResolversTypes['LimitedUser']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ProjectResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Project'] = ResolversParentTypes['Project']> = {
  commentThreadCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  commentThreads?: Resolver<Maybe<ResolversTypes['CommentCollection']>, ParentType, ContextType, RequireFields<ProjectCommentThreadsArgs, 'limit'>>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  model?: Resolver<Maybe<ResolversTypes['Model']>, ParentType, ContextType, RequireFields<ProjectModelArgs, 'id'>>;
  modelChildrenTree?: Resolver<Array<ResolversTypes['ModelsTreeItem']>, ParentType, ContextType, RequireFields<ProjectModelChildrenTreeArgs, 'fullName'>>;
  modelCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  models?: Resolver<ResolversTypes['ModelCollection'], ParentType, ContextType, RequireFields<ProjectModelsArgs, 'limit'>>;
  modelsTree?: Resolver<Array<ResolversTypes['ModelsTreeItem']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  role?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  sourceApps?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  team?: Resolver<Array<ResolversTypes['LimitedUser']>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  versionCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  viewerResources?: Resolver<Array<ResolversTypes['ViewerResourceGroup']>, ParentType, ContextType, RequireFields<ProjectViewerResourcesArgs, 'resourceIdString'>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ProjectCollectionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ProjectCollection'] = ResolversParentTypes['ProjectCollection']> = {
  cursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  items?: Resolver<Array<ResolversTypes['Project']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ProjectModelsUpdatedMessageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ProjectModelsUpdatedMessage'] = ResolversParentTypes['ProjectModelsUpdatedMessage']> = {
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  model?: Resolver<Maybe<ResolversTypes['Model']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['ProjectModelsUpdatedMessageType'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ProjectMutationsResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ProjectMutations'] = ResolversParentTypes['ProjectMutations']> = {
  createForOnboarding?: Resolver<ResolversTypes['Project'], ParentType, ContextType>;
  delete?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<ProjectMutationsDeleteArgs, 'id'>>;
  update?: Resolver<ResolversTypes['Project'], ParentType, ContextType, RequireFields<ProjectMutationsUpdateArgs, 'stream'>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ProjectUpdatedMessageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ProjectUpdatedMessage'] = ResolversParentTypes['ProjectUpdatedMessage']> = {
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  project?: Resolver<Maybe<ResolversTypes['Project']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['ProjectUpdatedMessageType'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ProjectVersionsUpdatedMessageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ProjectVersionsUpdatedMessage'] = ResolversParentTypes['ProjectVersionsUpdatedMessage']> = {
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['ProjectVersionsUpdatedMessageType'], ParentType, ContextType>;
  version?: Resolver<Maybe<ResolversTypes['Version']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type QueryResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  _?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  activeUser?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  adminStreams?: Resolver<Maybe<ResolversTypes['StreamCollection']>, ParentType, ContextType, RequireFields<QueryAdminStreamsArgs, 'limit' | 'offset'>>;
  adminUsers?: Resolver<Maybe<ResolversTypes['AdminUsersListCollection']>, ParentType, ContextType, RequireFields<QueryAdminUsersArgs, 'limit' | 'offset' | 'query'>>;
  app?: Resolver<Maybe<ResolversTypes['ServerApp']>, ParentType, ContextType, RequireFields<QueryAppArgs, 'id'>>;
  apps?: Resolver<Maybe<Array<Maybe<ResolversTypes['ServerAppListItem']>>>, ParentType, ContextType>;
  comment?: Resolver<Maybe<ResolversTypes['Comment']>, ParentType, ContextType, RequireFields<QueryCommentArgs, 'id' | 'streamId'>>;
  comments?: Resolver<Maybe<ResolversTypes['CommentCollection']>, ParentType, ContextType, RequireFields<QueryCommentsArgs, 'archived' | 'limit' | 'streamId'>>;
  discoverableStreams?: Resolver<Maybe<ResolversTypes['StreamCollection']>, ParentType, ContextType, RequireFields<QueryDiscoverableStreamsArgs, 'limit'>>;
  otherUser?: Resolver<Maybe<ResolversTypes['LimitedUser']>, ParentType, ContextType, RequireFields<QueryOtherUserArgs, 'id'>>;
  project?: Resolver<Maybe<ResolversTypes['Project']>, ParentType, ContextType, RequireFields<QueryProjectArgs, 'id'>>;
  serverInfo?: Resolver<ResolversTypes['ServerInfo'], ParentType, ContextType>;
  serverStats?: Resolver<ResolversTypes['ServerStats'], ParentType, ContextType>;
  stream?: Resolver<Maybe<ResolversTypes['Stream']>, ParentType, ContextType, RequireFields<QueryStreamArgs, 'id'>>;
  streamAccessRequest?: Resolver<Maybe<ResolversTypes['StreamAccessRequest']>, ParentType, ContextType, RequireFields<QueryStreamAccessRequestArgs, 'streamId'>>;
  streamInvite?: Resolver<Maybe<ResolversTypes['PendingStreamCollaborator']>, ParentType, ContextType, RequireFields<QueryStreamInviteArgs, 'streamId'>>;
  streamInvites?: Resolver<Array<ResolversTypes['PendingStreamCollaborator']>, ParentType, ContextType>;
  streams?: Resolver<Maybe<ResolversTypes['StreamCollection']>, ParentType, ContextType, RequireFields<QueryStreamsArgs, 'limit'>>;
  testList?: Resolver<Array<ResolversTypes['TestItem']>, ParentType, ContextType>;
  testNumber?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  user?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, Partial<QueryUserArgs>>;
  userPwdStrength?: Resolver<ResolversTypes['PasswordStrengthCheckResults'], ParentType, ContextType, RequireFields<QueryUserPwdStrengthArgs, 'pwd'>>;
  userSearch?: Resolver<Maybe<ResolversTypes['UserSearchResultCollection']>, ParentType, ContextType, RequireFields<QueryUserSearchArgs, 'archived' | 'limit' | 'query'>>;
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
  scopes?: Resolver<Array<Maybe<ResolversTypes['Scope']>>, ParentType, ContextType>;
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

export type ServerInfoResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ServerInfo'] = ResolversParentTypes['ServerInfo']> = {
  adminContact?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  authStrategies?: Resolver<Array<ResolversTypes['AuthStrategy']>, ParentType, ContextType>;
  blobSizeLimitBytes?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  canonicalUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  company?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  inviteOnly?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  roles?: Resolver<Array<Maybe<ResolversTypes['Role']>>, ParentType, ContextType>;
  scopes?: Resolver<Array<Maybe<ResolversTypes['Scope']>>, ParentType, ContextType>;
  termsOfService?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  version?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ServerInviteResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ServerInvite'] = ResolversParentTypes['ServerInvite']> = {
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  invitedBy?: Resolver<ResolversTypes['LimitedUser'], ParentType, ContextType>;
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
  fileUploads?: Resolver<Maybe<Array<Maybe<ResolversTypes['FileUpload']>>>, ParentType, ContextType>;
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
  webhooks?: Resolver<Maybe<ResolversTypes['WebhookCollection']>, ParentType, ContextType, Partial<StreamWebhooksArgs>>;
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
  projectModelsUpdated?: SubscriptionResolver<ResolversTypes['ProjectModelsUpdatedMessage'], "projectModelsUpdated", ParentType, ContextType, RequireFields<SubscriptionProjectModelsUpdatedArgs, 'id'>>;
  projectUpdated?: SubscriptionResolver<ResolversTypes['ProjectUpdatedMessage'], "projectUpdated", ParentType, ContextType, RequireFields<SubscriptionProjectUpdatedArgs, 'id'>>;
  projectVersionsUpdated?: SubscriptionResolver<ResolversTypes['ProjectVersionsUpdatedMessage'], "projectVersionsUpdated", ParentType, ContextType, RequireFields<SubscriptionProjectVersionsUpdatedArgs, 'id'>>;
  streamDeleted?: SubscriptionResolver<Maybe<ResolversTypes['JSONObject']>, "streamDeleted", ParentType, ContextType, Partial<SubscriptionStreamDeletedArgs>>;
  streamUpdated?: SubscriptionResolver<Maybe<ResolversTypes['JSONObject']>, "streamUpdated", ParentType, ContextType, Partial<SubscriptionStreamUpdatedArgs>>;
  userProjectsUpdated?: SubscriptionResolver<ResolversTypes['UserProjectsUpdatedMessage'], "userProjectsUpdated", ParentType, ContextType>;
  userStreamAdded?: SubscriptionResolver<Maybe<ResolversTypes['JSONObject']>, "userStreamAdded", ParentType, ContextType>;
  userStreamRemoved?: SubscriptionResolver<Maybe<ResolversTypes['JSONObject']>, "userStreamRemoved", ParentType, ContextType>;
  userViewerActivity?: SubscriptionResolver<Maybe<ResolversTypes['JSONObject']>, "userViewerActivity", ParentType, ContextType, RequireFields<SubscriptionUserViewerActivityArgs, 'resourceId' | 'streamId'>>;
};

export type TestItemResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['TestItem'] = ResolversParentTypes['TestItem']> = {
  bar?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  foo?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UserResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['User'] = ResolversParentTypes['User']> = {
  activity?: Resolver<Maybe<ResolversTypes['ActivityCollection']>, ParentType, ContextType, RequireFields<UserActivityArgs, 'limit'>>;
  apiTokens?: Resolver<Maybe<Array<Maybe<ResolversTypes['ApiToken']>>>, ParentType, ContextType>;
  authorizedApps?: Resolver<Maybe<Array<Maybe<ResolversTypes['ServerAppListItem']>>>, ParentType, ContextType>;
  avatar?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  bio?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  commits?: Resolver<Maybe<ResolversTypes['CommitCollection']>, ParentType, ContextType, RequireFields<UserCommitsArgs, 'limit'>>;
  company?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  createdApps?: Resolver<Maybe<Array<Maybe<ResolversTypes['ServerApp']>>>, ParentType, ContextType>;
  createdAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  email?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  favoriteStreams?: Resolver<ResolversTypes['StreamCollection'], ParentType, ContextType, RequireFields<UserFavoriteStreamsArgs, 'limit'>>;
  hasPendingVerification?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isOnboardingFinished?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  notificationPreferences?: Resolver<ResolversTypes['JSONObject'], ParentType, ContextType>;
  profiles?: Resolver<Maybe<ResolversTypes['JSONObject']>, ParentType, ContextType>;
  projects?: Resolver<ResolversTypes['ProjectCollection'], ParentType, ContextType, RequireFields<UserProjectsArgs, 'limit'>>;
  role?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  streams?: Resolver<ResolversTypes['StreamCollection'], ParentType, ContextType, RequireFields<UserStreamsArgs, 'limit'>>;
  timeline?: Resolver<Maybe<ResolversTypes['ActivityCollection']>, ParentType, ContextType, RequireFields<UserTimelineArgs, 'limit'>>;
  totalOwnedStreamsFavorites?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  verified?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
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
  items?: Resolver<Maybe<Array<Maybe<ResolversTypes['LimitedUser']>>>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type VersionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Version'] = ResolversParentTypes['Version']> = {
  authorUser?: Resolver<Maybe<ResolversTypes['LimitedUser']>, ParentType, ContextType>;
  commentThreads?: Resolver<Maybe<ResolversTypes['CommentCollection']>, ParentType, ContextType, RequireFields<VersionCommentThreadsArgs, 'limit'>>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  message?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  model?: Resolver<ResolversTypes['Model'], ParentType, ContextType>;
  referencedObject?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  sourceApplication?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type VersionCollectionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['VersionCollection'] = ResolversParentTypes['VersionCollection']> = {
  cursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  items?: Resolver<Array<ResolversTypes['Version']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
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

export type WebhookResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Webhook'] = ResolversParentTypes['Webhook']> = {
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  enabled?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  history?: Resolver<Maybe<ResolversTypes['WebhookEventCollection']>, ParentType, ContextType, RequireFields<WebhookHistoryArgs, 'limit'>>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  streamId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  triggers?: Resolver<Array<Maybe<ResolversTypes['String']>>, ParentType, ContextType>;
  url?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type WebhookCollectionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['WebhookCollection'] = ResolversParentTypes['WebhookCollection']> = {
  items?: Resolver<Maybe<Array<Maybe<ResolversTypes['Webhook']>>>, ParentType, ContextType>;
  totalCount?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
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

export type Resolvers<ContextType = GraphQLContext> = {
  ActiveUserMutations?: ActiveUserMutationsResolvers<ContextType>;
  Activity?: ActivityResolvers<ContextType>;
  ActivityCollection?: ActivityCollectionResolvers<ContextType>;
  AdminUsersListCollection?: AdminUsersListCollectionResolvers<ContextType>;
  AdminUsersListItem?: AdminUsersListItemResolvers<ContextType>;
  ApiToken?: ApiTokenResolvers<ContextType>;
  AppAuthor?: AppAuthorResolvers<ContextType>;
  AuthStrategy?: AuthStrategyResolvers<ContextType>;
  BigInt?: GraphQLScalarType;
  BlobMetadata?: BlobMetadataResolvers<ContextType>;
  BlobMetadataCollection?: BlobMetadataCollectionResolvers<ContextType>;
  Branch?: BranchResolvers<ContextType>;
  BranchCollection?: BranchCollectionResolvers<ContextType>;
  Comment?: CommentResolvers<ContextType>;
  CommentActivityMessage?: CommentActivityMessageResolvers<ContextType>;
  CommentCollection?: CommentCollectionResolvers<ContextType>;
  CommentReplyAuthorCollection?: CommentReplyAuthorCollectionResolvers<ContextType>;
  CommentThreadActivityMessage?: CommentThreadActivityMessageResolvers<ContextType>;
  Commit?: CommitResolvers<ContextType>;
  CommitCollection?: CommitCollectionResolvers<ContextType>;
  DateTime?: GraphQLScalarType;
  EmailAddress?: GraphQLScalarType;
  FileUpload?: FileUploadResolvers<ContextType>;
  JSONObject?: GraphQLScalarType;
  LimitedUser?: LimitedUserResolvers<ContextType>;
  Model?: ModelResolvers<ContextType>;
  ModelCollection?: ModelCollectionResolvers<ContextType>;
  ModelMutations?: ModelMutationsResolvers<ContextType>;
  ModelsTreeItem?: ModelsTreeItemResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  Object?: ObjectResolvers<ContextType>;
  ObjectCollection?: ObjectCollectionResolvers<ContextType>;
  PasswordStrengthCheckFeedback?: PasswordStrengthCheckFeedbackResolvers<ContextType>;
  PasswordStrengthCheckResults?: PasswordStrengthCheckResultsResolvers<ContextType>;
  PendingStreamCollaborator?: PendingStreamCollaboratorResolvers<ContextType>;
  Project?: ProjectResolvers<ContextType>;
  ProjectCollection?: ProjectCollectionResolvers<ContextType>;
  ProjectModelsUpdatedMessage?: ProjectModelsUpdatedMessageResolvers<ContextType>;
  ProjectMutations?: ProjectMutationsResolvers<ContextType>;
  ProjectUpdatedMessage?: ProjectUpdatedMessageResolvers<ContextType>;
  ProjectVersionsUpdatedMessage?: ProjectVersionsUpdatedMessageResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  ResourceIdentifier?: ResourceIdentifierResolvers<ContextType>;
  Role?: RoleResolvers<ContextType>;
  Scope?: ScopeResolvers<ContextType>;
  ServerApp?: ServerAppResolvers<ContextType>;
  ServerAppListItem?: ServerAppListItemResolvers<ContextType>;
  ServerInfo?: ServerInfoResolvers<ContextType>;
  ServerInvite?: ServerInviteResolvers<ContextType>;
  ServerStats?: ServerStatsResolvers<ContextType>;
  SmartTextEditorValue?: SmartTextEditorValueResolvers<ContextType>;
  Stream?: StreamResolvers<ContextType>;
  StreamAccessRequest?: StreamAccessRequestResolvers<ContextType>;
  StreamCollaborator?: StreamCollaboratorResolvers<ContextType>;
  StreamCollection?: StreamCollectionResolvers<ContextType>;
  Subscription?: SubscriptionResolvers<ContextType>;
  TestItem?: TestItemResolvers<ContextType>;
  User?: UserResolvers<ContextType>;
  UserProjectsUpdatedMessage?: UserProjectsUpdatedMessageResolvers<ContextType>;
  UserSearchResultCollection?: UserSearchResultCollectionResolvers<ContextType>;
  Version?: VersionResolvers<ContextType>;
  VersionCollection?: VersionCollectionResolvers<ContextType>;
  ViewerResourceGroup?: ViewerResourceGroupResolvers<ContextType>;
  ViewerResourceItem?: ViewerResourceItemResolvers<ContextType>;
  Webhook?: WebhookResolvers<ContextType>;
  WebhookCollection?: WebhookCollectionResolvers<ContextType>;
  WebhookEvent?: WebhookEventResolvers<ContextType>;
  WebhookEventCollection?: WebhookEventCollectionResolvers<ContextType>;
};

export type DirectiveResolvers<ContextType = GraphQLContext> = {
  hasRole?: HasRoleDirectiveResolver<any, any, ContextType>;
  hasScope?: HasScopeDirectiveResolver<any, any, ContextType>;
  hasScopes?: HasScopesDirectiveResolver<any, any, ContextType>;
  hasServerRole?: HasServerRoleDirectiveResolver<any, any, ContextType>;
  hasStreamRole?: HasStreamRoleDirectiveResolver<any, any, ContextType>;
  isOwner?: IsOwnerDirectiveResolver<any, any, ContextType>;
};
