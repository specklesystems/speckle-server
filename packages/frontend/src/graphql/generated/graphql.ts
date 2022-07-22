import gql from 'graphql-tag';
import { createMutationFunction, createSmartQueryOptionsFunction, createSmartSubscriptionOptionsFunction } from 'vue-apollo-smart-ops';
import { ApolloError } from 'apollo-client';
import { handleApolloError } from '@/config/vueApolloSmartOpsConfig';
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
  DateTime: any;
  EmailAddress: any;
  /** The `JSONObject` scalar type represents JSON objects as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSONObject: Record<string, unknown>;
  /** The `Upload` scalar type represents a file upload. */
  Upload: any;
};

export type Activity = {
  __typename?: 'Activity';
  actionType: Scalars['String'];
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
  items?: Maybe<Array<Maybe<Branch>>>;
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

export enum CacheControlScope {
  Private = 'PRIVATE',
  Public = 'PUBLIC'
}

export type Comment = {
  __typename?: 'Comment';
  archived: Scalars['Boolean'];
  authorId: Scalars['String'];
  createdAt?: Maybe<Scalars['DateTime']>;
  data?: Maybe<Scalars['JSONObject']>;
  id: Scalars['String'];
  reactions?: Maybe<Array<Maybe<Scalars['String']>>>;
  /** Gets the replies to this comment. */
  replies?: Maybe<CommentCollection>;
  /** Resources that this comment targets. Can be a mixture of either one stream, or multiple commits and objects. */
  resources: Array<Maybe<ResourceIdentifier>>;
  screenshot?: Maybe<Scalars['String']>;
  text: SmartTextEditorValue;
  /** The time this comment was last updated. Corresponds also to the latest reply to this comment, if any. */
  updatedAt?: Maybe<Scalars['DateTime']>;
  /** The last time you viewed this comment. Present only if an auth'ed request. Relevant only if a top level commit. */
  viewedAt?: Maybe<Scalars['DateTime']>;
};


export type CommentRepliesArgs = {
  cursor?: InputMaybe<Scalars['String']>;
  limit?: InputMaybe<Scalars['Int']>;
};

export type CommentActivityMessage = {
  __typename?: 'CommentActivityMessage';
  comment: Comment;
  type: Scalars['String'];
};

export type CommentCollection = {
  __typename?: 'CommentCollection';
  cursor?: Maybe<Scalars['DateTime']>;
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
  items?: Maybe<Array<Maybe<Commit>>>;
  totalCount: Scalars['Int'];
};

export type CommitCollectionUser = {
  __typename?: 'CommitCollectionUser';
  cursor?: Maybe<Scalars['String']>;
  items?: Maybe<Array<Maybe<CommitCollectionUserNode>>>;
  totalCount: Scalars['Int'];
};

export type CommitCollectionUserNode = {
  __typename?: 'CommitCollectionUserNode';
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
  streamId?: Maybe<Scalars['String']>;
  streamName?: Maybe<Scalars['String']>;
  totalChildrenCount?: Maybe<Scalars['Int']>;
};

export type CommitCreateInput = {
  branchName: Scalars['String'];
  message?: InputMaybe<Scalars['String']>;
  objectId: Scalars['String'];
  parents?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  /** **DEPRECATED** Use the `parents` field. */
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
  avatar?: Maybe<Scalars['String']>;
  bio?: Maybe<Scalars['String']>;
  company?: Maybe<Scalars['String']>;
  id: Scalars['String'];
  name?: Maybe<Scalars['String']>;
  verified?: Maybe<Scalars['Boolean']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  /** The void stares back. */
  _?: Maybe<Scalars['String']>;
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
  /** Delete a pending invite */
  inviteDelete: Scalars['Boolean'];
  /** Re-send a pending invite */
  inviteResend: Scalars['Boolean'];
  objectCreate: Array<Maybe<Scalars['String']>>;
  serverInfoUpdate?: Maybe<Scalars['Boolean']>;
  serverInviteBatchCreate: Scalars['Boolean'];
  /** Invite a new user to the speckle server and return the invite ID */
  serverInviteCreate: Scalars['Boolean'];
  /** Creates a new stream. */
  streamCreate?: Maybe<Scalars['String']>;
  /** Deletes an existing stream. */
  streamDelete: Scalars['Boolean'];
  /** Favorite/unfavorite the given stream */
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

export type Query = {
  __typename?: 'Query';
  /** Stare into the void. */
  _?: Maybe<Scalars['String']>;
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
  serverInfo: ServerInfo;
  serverStats: ServerStats;
  /**
   * Returns a specific stream. Will throw an authorization error if active user isn't authorized
   * to see it.
   */
  stream?: Maybe<Stream>;
  /**
   * Look for an invitation to a stream, for the current user (authed or not). If token
   * isn't specified, the server will look for any valid invite.
   */
  streamInvite?: Maybe<PendingStreamCollaborator>;
  /** Get all invitations to streams that the active user has */
  streamInvites: Array<PendingStreamCollaborator>;
  /** All the streams of the current user, pass in the `query` parameter to search by name, description or ID. */
  streams?: Maybe<StreamCollection>;
  /**
   * Gets the profile of a user. If no id argument is provided, will return the current authenticated user's profile (as extracted from the authorization header).
   * If ID is provided, admin access is required
   */
  user?: Maybe<User>;
  userPwdStrength?: Maybe<Scalars['JSONObject']>;
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


export type QueryStreamArgs = {
  id: Scalars['String'];
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
  authStrategies?: Maybe<Array<Maybe<AuthStrategy>>>;
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
  /** How many times this stream has been favorited */
  favoritesCount: Scalars['Int'];
  /** Returns a specific file upload that belongs to this stream. */
  fileUpload?: Maybe<FileUpload>;
  /** Returns a list of all the file uploads for this stream. */
  fileUploads?: Maybe<Array<Maybe<FileUpload>>>;
  id: Scalars['String'];
  isPublic: Scalars['Boolean'];
  name: Scalars['String'];
  object?: Maybe<Object>;
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
  /** Subscribes to stream deleted event. Use this in clients/components that pertain only to this stream. */
  streamDeleted?: Maybe<Scalars['JSONObject']>;
  /** Subscribes to stream updated event. Use this in clients/components that pertain only to this stream. */
  streamUpdated?: Maybe<Scalars['JSONObject']>;
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
  commits?: Maybe<CommitCollectionUser>;
  company?: Maybe<Scalars['String']>;
  /** Returns the apps you have created. */
  createdApps?: Maybe<Array<Maybe<ServerApp>>>;
  /**
   * E-mail can be null, if it's requested for a user other than the authenticated one
   * and the user isn't an admin
   */
  email?: Maybe<Scalars['String']>;
  /** All the streams that a user has favorited */
  favoriteStreams?: Maybe<StreamCollection>;
  id: Scalars['String'];
  name?: Maybe<Scalars['String']>;
  profiles?: Maybe<Scalars['JSONObject']>;
  role?: Maybe<Scalars['String']>;
  /** All the streams that a user has access to. */
  streams?: Maybe<StreamCollection>;
  suuid?: Maybe<Scalars['String']>;
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

export type StreamWithBranchQueryVariables = Exact<{
  streamId: Scalars['String'];
  branchName: Scalars['String'];
  cursor?: InputMaybe<Scalars['String']>;
}>;


export type StreamWithBranchQuery = { __typename?: 'Query', stream?: { __typename?: 'Stream', id: string, name: string, branch?: { __typename?: 'Branch', id: string, name: string, description?: string | null, commits?: { __typename?: 'CommitCollection', totalCount: number, cursor?: string | null, items?: Array<{ __typename?: 'Commit', id: string, authorName?: string | null, authorId?: string | null, authorAvatar?: string | null, sourceApplication?: string | null, message?: string | null, referencedObject: string, createdAt?: any | null, commentCount: number } | null> | null } | null } | null } | null };

export type BranchCreatedSubscriptionVariables = Exact<{
  streamId: Scalars['String'];
}>;


export type BranchCreatedSubscription = { __typename?: 'Subscription', branchCreated?: Record<string, unknown> | null };

export type CommentFullInfoFragment = { __typename?: 'Comment', id: string, archived: boolean, authorId: string, data?: Record<string, unknown> | null, screenshot?: string | null, createdAt?: any | null, updatedAt?: any | null, viewedAt?: any | null, text: { __typename?: 'SmartTextEditorValue', doc?: Record<string, unknown> | null, attachments?: Array<{ __typename?: 'BlobMetadata', id: string, fileName: string, streamId: string, fileType: string, fileSize?: number | null }> | null }, replies?: { __typename?: 'CommentCollection', totalCount: number } | null, resources: Array<{ __typename?: 'ResourceIdentifier', resourceId: string, resourceType: ResourceType } | null> };

export type StreamCommitQueryQueryVariables = Exact<{
  streamId: Scalars['String'];
  id: Scalars['String'];
}>;


export type StreamCommitQueryQuery = { __typename?: 'Query', stream?: { __typename?: 'Stream', id: string, name: string, role?: string | null, commit?: { __typename?: 'Commit', id: string, message?: string | null, referencedObject: string, authorName?: string | null, authorId?: string | null, authorAvatar?: string | null, createdAt?: any | null, branchName?: string | null, sourceApplication?: string | null } | null } | null };

export type LimitedUserFieldsFragment = { __typename?: 'LimitedUser', id: string, name?: string | null, bio?: string | null, company?: string | null, avatar?: string | null, verified?: boolean | null };

export type StreamCollaboratorFieldsFragment = { __typename?: 'StreamCollaborator', id: string, name: string, role: string, company?: string | null, avatar?: string | null };

export type UsersOwnInviteFieldsFragment = { __typename?: 'PendingStreamCollaborator', id: string, inviteId: string, streamId: string, streamName: string, token?: string | null, invitedBy: { __typename?: 'LimitedUser', id: string, name?: string | null, bio?: string | null, company?: string | null, avatar?: string | null, verified?: boolean | null } };

export type StreamInviteQueryVariables = Exact<{
  streamId: Scalars['String'];
  token?: InputMaybe<Scalars['String']>;
}>;


export type StreamInviteQuery = { __typename?: 'Query', streamInvite?: { __typename?: 'PendingStreamCollaborator', id: string, inviteId: string, streamId: string, streamName: string, token?: string | null, invitedBy: { __typename?: 'LimitedUser', id: string, name?: string | null, bio?: string | null, company?: string | null, avatar?: string | null, verified?: boolean | null } } | null };

export type UserStreamInvitesQueryVariables = Exact<{ [key: string]: never; }>;


export type UserStreamInvitesQuery = { __typename?: 'Query', streamInvites: Array<{ __typename?: 'PendingStreamCollaborator', id: string, inviteId: string, streamId: string, streamName: string, token?: string | null, invitedBy: { __typename?: 'LimitedUser', id: string, name?: string | null, bio?: string | null, company?: string | null, avatar?: string | null, verified?: boolean | null } }> };

export type UseStreamInviteMutationVariables = Exact<{
  accept: Scalars['Boolean'];
  streamId: Scalars['String'];
  token: Scalars['String'];
}>;


export type UseStreamInviteMutation = { __typename?: 'Mutation', streamInviteUse: boolean };

export type CancelStreamInviteMutationVariables = Exact<{
  streamId: Scalars['String'];
  inviteId: Scalars['String'];
}>;


export type CancelStreamInviteMutation = { __typename?: 'Mutation', streamInviteCancel: boolean };

export type DeleteInviteMutationVariables = Exact<{
  inviteId: Scalars['String'];
}>;


export type DeleteInviteMutation = { __typename?: 'Mutation', inviteDelete: boolean };

export type ResendInviteMutationVariables = Exact<{
  inviteId: Scalars['String'];
}>;


export type ResendInviteMutation = { __typename?: 'Mutation', inviteResend: boolean };

export type BatchInviteToServerMutationVariables = Exact<{
  paramsArray: Array<ServerInviteCreateInput> | ServerInviteCreateInput;
}>;


export type BatchInviteToServerMutation = { __typename?: 'Mutation', serverInviteBatchCreate: boolean };

export type BatchInviteToStreamsMutationVariables = Exact<{
  paramsArray: Array<StreamInviteCreateInput> | StreamInviteCreateInput;
}>;


export type BatchInviteToStreamsMutation = { __typename?: 'Mutation', streamInviteBatchCreate: boolean };

export type StreamObjectQueryVariables = Exact<{
  streamId: Scalars['String'];
  id: Scalars['String'];
}>;


export type StreamObjectQuery = { __typename?: 'Query', stream?: { __typename?: 'Stream', id: string, object?: { __typename?: 'Object', totalChildrenCount?: number | null, id: string, speckleType?: string | null, data?: Record<string, unknown> | null } | null } | null };

export type StreamObjectNoDataQueryVariables = Exact<{
  streamId: Scalars['String'];
  id: Scalars['String'];
}>;


export type StreamObjectNoDataQuery = { __typename?: 'Query', stream?: { __typename?: 'Stream', id: string, name: string, object?: { __typename?: 'Object', totalChildrenCount?: number | null, id: string, speckleType?: string | null } | null } | null };

export type MainServerInfoFieldsFragment = { __typename?: 'ServerInfo', name: string, company?: string | null, description?: string | null, adminContact?: string | null, canonicalUrl?: string | null, termsOfService?: string | null, inviteOnly?: boolean | null, version?: string | null };

export type ServerInfoRolesFieldsFragment = { __typename?: 'ServerInfo', roles: Array<{ __typename?: 'Role', name: string, description: string, resourceTarget: string } | null> };

export type ServerInfoScopesFieldsFragment = { __typename?: 'ServerInfo', scopes: Array<{ __typename?: 'Scope', name: string, description: string } | null> };

export type MainServerInfoQueryVariables = Exact<{ [key: string]: never; }>;


export type MainServerInfoQuery = { __typename?: 'Query', serverInfo: { __typename?: 'ServerInfo', name: string, company?: string | null, description?: string | null, adminContact?: string | null, canonicalUrl?: string | null, termsOfService?: string | null, inviteOnly?: boolean | null, version?: string | null } };

export type FullServerInfoQueryVariables = Exact<{ [key: string]: never; }>;


export type FullServerInfoQuery = { __typename?: 'Query', serverInfo: { __typename?: 'ServerInfo', name: string, company?: string | null, description?: string | null, adminContact?: string | null, canonicalUrl?: string | null, termsOfService?: string | null, inviteOnly?: boolean | null, version?: string | null, roles: Array<{ __typename?: 'Role', name: string, description: string, resourceTarget: string } | null>, scopes: Array<{ __typename?: 'Scope', name: string, description: string } | null> } };

export type StreamCommitsQueryVariables = Exact<{
  id: Scalars['String'];
}>;


export type StreamCommitsQuery = { __typename?: 'Query', stream?: { __typename?: 'Stream', id: string, role?: string | null, commits?: { __typename?: 'CommitCollection', totalCount: number, items?: Array<{ __typename?: 'Commit', id: string, authorId?: string | null, authorName?: string | null, authorAvatar?: string | null, createdAt?: any | null, message?: string | null, referencedObject: string, branchName?: string | null, sourceApplication?: string | null } | null> | null } | null } | null };

export type StreamsQueryVariables = Exact<{
  cursor?: InputMaybe<Scalars['String']>;
}>;


export type StreamsQuery = { __typename?: 'Query', streams?: { __typename?: 'StreamCollection', totalCount: number, cursor?: string | null, items?: Array<{ __typename?: 'Stream', id: string, name: string, description?: string | null, role?: string | null, isPublic: boolean, createdAt: any, updatedAt: any, commentCount: number, favoritedDate?: any | null, favoritesCount: number, collaborators: Array<{ __typename?: 'StreamCollaborator', id: string, name: string, company?: string | null, avatar?: string | null, role: string }>, commits?: { __typename?: 'CommitCollection', totalCount: number, items?: Array<{ __typename?: 'Commit', id: string, createdAt?: any | null, message?: string | null, authorId?: string | null, branchName?: string | null, authorName?: string | null, authorAvatar?: string | null, referencedObject: string } | null> | null } | null, branches?: { __typename?: 'BranchCollection', totalCount: number } | null }> | null } | null };

export type CommonStreamFieldsFragment = { __typename?: 'Stream', id: string, name: string, description?: string | null, role?: string | null, isPublic: boolean, createdAt: any, updatedAt: any, commentCount: number, favoritedDate?: any | null, favoritesCount: number, collaborators: Array<{ __typename?: 'StreamCollaborator', id: string, name: string, company?: string | null, avatar?: string | null, role: string }>, commits?: { __typename?: 'CommitCollection', totalCount: number } | null, branches?: { __typename?: 'BranchCollection', totalCount: number } | null };

export type StreamQueryVariables = Exact<{
  id: Scalars['String'];
}>;


export type StreamQuery = { __typename?: 'Query', stream?: { __typename?: 'Stream', id: string, name: string, description?: string | null, role?: string | null, isPublic: boolean, createdAt: any, updatedAt: any, commentCount: number, favoritedDate?: any | null, favoritesCount: number, collaborators: Array<{ __typename?: 'StreamCollaborator', id: string, name: string, company?: string | null, avatar?: string | null, role: string }>, commits?: { __typename?: 'CommitCollection', totalCount: number } | null, branches?: { __typename?: 'BranchCollection', totalCount: number } | null } | null };

export type StreamWithCollaboratorsQueryVariables = Exact<{
  id: Scalars['String'];
}>;


export type StreamWithCollaboratorsQuery = { __typename?: 'Query', stream?: { __typename?: 'Stream', id: string, name: string, isPublic: boolean, role?: string | null, collaborators: Array<{ __typename?: 'StreamCollaborator', id: string, name: string, role: string, company?: string | null, avatar?: string | null }>, pendingCollaborators?: Array<{ __typename?: 'PendingStreamCollaborator', title: string, inviteId: string, role: string, user?: { __typename?: 'LimitedUser', id: string, name?: string | null, bio?: string | null, company?: string | null, avatar?: string | null, verified?: boolean | null } | null }> | null } | null };

export type LeaveStreamMutationVariables = Exact<{
  streamId: Scalars['String'];
}>;


export type LeaveStreamMutation = { __typename?: 'Mutation', streamLeave: boolean };

export type UpdateStreamPermissionMutationVariables = Exact<{
  params: StreamUpdatePermissionInput;
}>;


export type UpdateStreamPermissionMutation = { __typename?: 'Mutation', streamUpdatePermission?: boolean | null };

export type CommonUserFieldsFragment = { __typename?: 'User', id: string, suuid?: string | null, email?: string | null, name?: string | null, bio?: string | null, company?: string | null, avatar?: string | null, verified?: boolean | null, profiles?: Record<string, unknown> | null, role?: string | null, streams?: { __typename?: 'StreamCollection', totalCount: number } | null, commits?: { __typename?: 'CommitCollectionUser', totalCount: number, items?: Array<{ __typename?: 'CommitCollectionUserNode', id: string, createdAt?: any | null } | null> | null } | null };

export type UserFavoriteStreamsQueryVariables = Exact<{
  cursor?: InputMaybe<Scalars['String']>;
}>;


export type UserFavoriteStreamsQuery = { __typename?: 'Query', user?: { __typename?: 'User', id: string, suuid?: string | null, email?: string | null, name?: string | null, bio?: string | null, company?: string | null, avatar?: string | null, verified?: boolean | null, profiles?: Record<string, unknown> | null, role?: string | null, favoriteStreams?: { __typename?: 'StreamCollection', totalCount: number, cursor?: string | null, items?: Array<{ __typename?: 'Stream', id: string, name: string, description?: string | null, role?: string | null, isPublic: boolean, createdAt: any, updatedAt: any, commentCount: number, favoritedDate?: any | null, favoritesCount: number, collaborators: Array<{ __typename?: 'StreamCollaborator', id: string, name: string, company?: string | null, avatar?: string | null, role: string }>, commits?: { __typename?: 'CommitCollection', totalCount: number } | null, branches?: { __typename?: 'BranchCollection', totalCount: number } | null }> | null } | null, streams?: { __typename?: 'StreamCollection', totalCount: number } | null, commits?: { __typename?: 'CommitCollectionUser', totalCount: number, items?: Array<{ __typename?: 'CommitCollectionUserNode', id: string, createdAt?: any | null } | null> | null } | null } | null };

export type MainUserDataQueryVariables = Exact<{ [key: string]: never; }>;


export type MainUserDataQuery = { __typename?: 'Query', user?: { __typename?: 'User', id: string, suuid?: string | null, email?: string | null, name?: string | null, bio?: string | null, company?: string | null, avatar?: string | null, verified?: boolean | null, profiles?: Record<string, unknown> | null, role?: string | null, streams?: { __typename?: 'StreamCollection', totalCount: number } | null, commits?: { __typename?: 'CommitCollectionUser', totalCount: number, items?: Array<{ __typename?: 'CommitCollectionUserNode', id: string, createdAt?: any | null } | null> | null } | null } | null };

export type ExtraUserDataQueryVariables = Exact<{ [key: string]: never; }>;


export type ExtraUserDataQuery = { __typename?: 'Query', user?: { __typename?: 'User', totalOwnedStreamsFavorites: number, id: string, suuid?: string | null, email?: string | null, name?: string | null, bio?: string | null, company?: string | null, avatar?: string | null, verified?: boolean | null, profiles?: Record<string, unknown> | null, role?: string | null, streams?: { __typename?: 'StreamCollection', totalCount: number } | null, commits?: { __typename?: 'CommitCollectionUser', totalCount: number, items?: Array<{ __typename?: 'CommitCollectionUserNode', id: string, createdAt?: any | null } | null> | null } | null } | null };

export type UserSearchQueryVariables = Exact<{
  query: Scalars['String'];
  limit: Scalars['Int'];
  cursor?: InputMaybe<Scalars['String']>;
  archived?: InputMaybe<Scalars['Boolean']>;
}>;


export type UserSearchQuery = { __typename?: 'Query', userSearch?: { __typename?: 'UserSearchResultCollection', cursor?: string | null, items?: Array<{ __typename?: 'LimitedUser', id: string, name?: string | null, bio?: string | null, company?: string | null, avatar?: string | null, verified?: boolean | null } | null> | null } | null };

export type IsLoggedInQueryVariables = Exact<{ [key: string]: never; }>;


export type IsLoggedInQuery = { __typename?: 'Query', user?: { __typename?: 'User', id: string } | null };

export type AdminUsersListQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  query?: InputMaybe<Scalars['String']>;
}>;


export type AdminUsersListQuery = { __typename?: 'Query', adminUsers?: { __typename?: 'AdminUsersListCollection', totalCount: number, items: Array<{ __typename?: 'AdminUsersListItem', id: string, registeredUser?: { __typename?: 'User', id: string, suuid?: string | null, email?: string | null, name?: string | null, bio?: string | null, company?: string | null, avatar?: string | null, verified?: boolean | null, profiles?: Record<string, unknown> | null, role?: string | null, authorizedApps?: Array<{ __typename?: 'ServerAppListItem', name: string } | null> | null } | null, invitedUser?: { __typename?: 'ServerInvite', id: string, email: string, invitedBy: { __typename?: 'LimitedUser', id: string, name?: string | null } } | null }> } | null };

export type UserQueryVariables = Exact<{
  id: Scalars['String'];
}>;


export type UserQuery = { __typename?: 'Query', user?: { __typename?: 'User', id: string, email?: string | null, name?: string | null, bio?: string | null, company?: string | null, avatar?: string | null, verified?: boolean | null, profiles?: Record<string, unknown> | null, role?: string | null, suuid?: string | null } | null };

export type Unnamed_1_QueryVariables = Exact<{ [key: string]: never; }>;


export type Unnamed_1_Query = { __typename?: 'Query', user?: { __typename?: 'User', id: string, email?: string | null, name?: string | null, bio?: string | null, company?: string | null, avatar?: string | null, verified?: boolean | null, profiles?: Record<string, unknown> | null, role?: string | null, streams?: { __typename?: 'StreamCollection', totalCount: number, cursor?: string | null, items?: Array<{ __typename?: 'Stream', id: string, name: string, description?: string | null, isPublic: boolean, createdAt: any, updatedAt: any, collaborators: Array<{ __typename?: 'StreamCollaborator', id: string, name: string, company?: string | null, avatar?: string | null, role: string }>, commits?: { __typename?: 'CommitCollection', totalCount: number } | null, branches?: { __typename?: 'BranchCollection', totalCount: number } | null }> | null } | null, commits?: { __typename?: 'CommitCollectionUser', totalCount: number, cursor?: string | null, items?: Array<{ __typename?: 'CommitCollectionUserNode', id: string, message?: string | null, streamId?: string | null, streamName?: string | null, createdAt?: any | null } | null> | null } | null } | null };

export type UserProfileQueryVariables = Exact<{
  id: Scalars['String'];
}>;


export type UserProfileQuery = { __typename?: 'Query', user?: { __typename?: 'User', id: string, name?: string | null, bio?: string | null, company?: string | null, avatar?: string | null, verified?: boolean | null } | null };

export type WebhookQueryVariables = Exact<{
  streamId: Scalars['String'];
  webhookId: Scalars['String'];
}>;


export type WebhookQuery = { __typename?: 'Query', stream?: { __typename?: 'Stream', id: string, role?: string | null, webhooks?: { __typename?: 'WebhookCollection', items?: Array<{ __typename?: 'Webhook', id: string, streamId: string, url: string, description?: string | null, triggers: Array<string | null>, enabled?: boolean | null, history?: { __typename?: 'WebhookEventCollection', items?: Array<{ __typename?: 'WebhookEvent', status: number, statusInfo: string } | null> | null } | null } | null> | null } | null } | null };

export type WebhooksQueryVariables = Exact<{
  streamId: Scalars['String'];
}>;


export type WebhooksQuery = { __typename?: 'Query', stream?: { __typename?: 'Stream', id: string, name: string, role?: string | null, webhooks?: { __typename?: 'WebhookCollection', items?: Array<{ __typename?: 'Webhook', id: string, streamId: string, url: string, description?: string | null, triggers: Array<string | null>, enabled?: boolean | null, history?: { __typename?: 'WebhookEventCollection', items?: Array<{ __typename?: 'WebhookEvent', status: number, statusInfo: string, lastUpdate: any } | null> | null } | null } | null> | null } | null } | null };

export const CommentFullInfo = gql`
    fragment CommentFullInfo on Comment {
  id
  archived
  authorId
  text {
    doc
    attachments {
      id
      fileName
      streamId
      fileType
      fileSize
    }
  }
  data
  screenshot
  replies {
    totalCount
  }
  resources {
    resourceId
    resourceType
  }
  createdAt
  updatedAt
  viewedAt
}
    `;
export const StreamCollaboratorFields = gql`
    fragment StreamCollaboratorFields on StreamCollaborator {
  id
  name
  role
  company
  avatar
}
    `;
export const LimitedUserFields = gql`
    fragment LimitedUserFields on LimitedUser {
  id
  name
  bio
  company
  avatar
  verified
}
    `;
export const UsersOwnInviteFields = gql`
    fragment UsersOwnInviteFields on PendingStreamCollaborator {
  id
  inviteId
  streamId
  streamName
  token
  invitedBy {
    ...LimitedUserFields
  }
}
    ${LimitedUserFields}`;
export const MainServerInfoFields = gql`
    fragment MainServerInfoFields on ServerInfo {
  name
  company
  description
  adminContact
  canonicalUrl
  termsOfService
  inviteOnly
  version
}
    `;
export const ServerInfoRolesFields = gql`
    fragment ServerInfoRolesFields on ServerInfo {
  roles {
    name
    description
    resourceTarget
  }
}
    `;
export const ServerInfoScopesFields = gql`
    fragment ServerInfoScopesFields on ServerInfo {
  scopes {
    name
    description
  }
}
    `;
export const CommonStreamFields = gql`
    fragment CommonStreamFields on Stream {
  id
  name
  description
  role
  isPublic
  createdAt
  updatedAt
  commentCount
  collaborators {
    id
    name
    company
    avatar
    role
  }
  commits(limit: 1) {
    totalCount
  }
  branches {
    totalCount
  }
  favoritedDate
  favoritesCount
}
    `;
export const CommonUserFields = gql`
    fragment CommonUserFields on User {
  id
  suuid
  email
  name
  bio
  company
  avatar
  verified
  profiles
  role
  suuid
  streams {
    totalCount
  }
  commits(limit: 1) {
    totalCount
    items {
      id
      createdAt
    }
  }
}
    `;
export const StreamWithBranch = gql`
    query StreamWithBranch($streamId: String!, $branchName: String!, $cursor: String) {
  stream(id: $streamId) {
    id
    name
    branch(name: $branchName) {
      id
      name
      description
      commits(cursor: $cursor, limit: 4) {
        totalCount
        cursor
        items {
          id
          authorName
          authorId
          authorAvatar
          sourceApplication
          message
          referencedObject
          createdAt
          commentCount
        }
      }
    }
  }
}
    `;
export const BranchCreated = gql`
    subscription BranchCreated($streamId: String!) {
  branchCreated(streamId: $streamId)
}
    `;
export const StreamCommitQuery = gql`
    query StreamCommitQuery($streamId: String!, $id: String!) {
  stream(id: $streamId) {
    id
    name
    role
    commit(id: $id) {
      id
      message
      referencedObject
      authorName
      authorId
      authorAvatar
      createdAt
      branchName
      sourceApplication
    }
  }
}
    `;
export const StreamInvite = gql`
    query StreamInvite($streamId: String!, $token: String) {
  streamInvite(streamId: $streamId, token: $token) {
    ...UsersOwnInviteFields
  }
}
    ${UsersOwnInviteFields}`;
export const UserStreamInvites = gql`
    query UserStreamInvites {
  streamInvites {
    ...UsersOwnInviteFields
  }
}
    ${UsersOwnInviteFields}`;
export const UseStreamInvite = gql`
    mutation UseStreamInvite($accept: Boolean!, $streamId: String!, $token: String!) {
  streamInviteUse(accept: $accept, streamId: $streamId, token: $token)
}
    `;
export const CancelStreamInvite = gql`
    mutation CancelStreamInvite($streamId: String!, $inviteId: String!) {
  streamInviteCancel(streamId: $streamId, inviteId: $inviteId)
}
    `;
export const DeleteInvite = gql`
    mutation DeleteInvite($inviteId: String!) {
  inviteDelete(inviteId: $inviteId)
}
    `;
export const ResendInvite = gql`
    mutation ResendInvite($inviteId: String!) {
  inviteResend(inviteId: $inviteId)
}
    `;
export const BatchInviteToServer = gql`
    mutation BatchInviteToServer($paramsArray: [ServerInviteCreateInput!]!) {
  serverInviteBatchCreate(input: $paramsArray)
}
    `;
export const BatchInviteToStreams = gql`
    mutation BatchInviteToStreams($paramsArray: [StreamInviteCreateInput!]!) {
  streamInviteBatchCreate(input: $paramsArray)
}
    `;
export const StreamObject = gql`
    query StreamObject($streamId: String!, $id: String!) {
  stream(id: $streamId) {
    id
    object(id: $id) {
      totalChildrenCount
      id
      speckleType
      data
    }
  }
}
    `;
export const StreamObjectNoData = gql`
    query StreamObjectNoData($streamId: String!, $id: String!) {
  stream(id: $streamId) {
    id
    name
    object(id: $id) {
      totalChildrenCount
      id
      speckleType
    }
  }
}
    `;
export const MainServerInfo = gql`
    query MainServerInfo {
  serverInfo {
    ...MainServerInfoFields
  }
}
    ${MainServerInfoFields}`;
export const FullServerInfo = gql`
    query FullServerInfo {
  serverInfo {
    ...MainServerInfoFields
    ...ServerInfoRolesFields
    ...ServerInfoScopesFields
  }
}
    ${MainServerInfoFields}
${ServerInfoRolesFields}
${ServerInfoScopesFields}`;
export const StreamCommits = gql`
    query StreamCommits($id: String!) {
  stream(id: $id) {
    id
    role
    commits {
      totalCount
      items {
        id
        authorId
        authorName
        authorAvatar
        createdAt
        message
        referencedObject
        branchName
        sourceApplication
      }
    }
  }
}
    `;
export const Streams = gql`
    query Streams($cursor: String) {
  streams(cursor: $cursor, limit: 10) {
    totalCount
    cursor
    items {
      id
      name
      description
      role
      isPublic
      createdAt
      updatedAt
      commentCount
      collaborators {
        id
        name
        company
        avatar
        role
      }
      commits(limit: 1) {
        totalCount
        items {
          id
          createdAt
          message
          authorId
          branchName
          authorName
          authorAvatar
          referencedObject
        }
      }
      branches {
        totalCount
      }
      favoritedDate
      favoritesCount
    }
  }
}
    `;
export const Stream = gql`
    query Stream($id: String!) {
  stream(id: $id) {
    ...CommonStreamFields
  }
}
    ${CommonStreamFields}`;
export const StreamWithCollaborators = gql`
    query StreamWithCollaborators($id: String!) {
  stream(id: $id) {
    id
    name
    isPublic
    role
    collaborators {
      ...StreamCollaboratorFields
    }
    pendingCollaborators {
      title
      inviteId
      role
      user {
        ...LimitedUserFields
      }
    }
  }
}
    ${StreamCollaboratorFields}
${LimitedUserFields}`;
export const LeaveStream = gql`
    mutation LeaveStream($streamId: String!) {
  streamLeave(streamId: $streamId)
}
    `;
export const UpdateStreamPermission = gql`
    mutation UpdateStreamPermission($params: StreamUpdatePermissionInput!) {
  streamUpdatePermission(permissionParams: $params)
}
    `;
export const UserFavoriteStreams = gql`
    query UserFavoriteStreams($cursor: String) {
  user {
    ...CommonUserFields
    favoriteStreams(cursor: $cursor, limit: 10) {
      totalCount
      cursor
      items {
        ...CommonStreamFields
      }
    }
  }
}
    ${CommonUserFields}
${CommonStreamFields}`;
export const MainUserData = gql`
    query MainUserData {
  user {
    ...CommonUserFields
  }
}
    ${CommonUserFields}`;
export const ExtraUserData = gql`
    query ExtraUserData {
  user {
    ...CommonUserFields
    totalOwnedStreamsFavorites
  }
}
    ${CommonUserFields}`;
export const UserSearch = gql`
    query UserSearch($query: String!, $limit: Int!, $cursor: String, $archived: Boolean) {
  userSearch(query: $query, limit: $limit, cursor: $cursor, archived: $archived) {
    cursor
    items {
      ...LimitedUserFields
    }
  }
}
    ${LimitedUserFields}`;
export const IsLoggedIn = gql`
    query IsLoggedIn {
  user {
    id
  }
}
    `;
export const AdminUsersList = gql`
    query AdminUsersList($limit: Int, $offset: Int, $query: String) {
  adminUsers(limit: $limit, offset: $offset, query: $query) {
    totalCount
    items {
      id
      registeredUser {
        id
        suuid
        email
        name
        bio
        company
        avatar
        verified
        profiles
        role
        authorizedApps {
          name
        }
      }
      invitedUser {
        id
        email
        invitedBy {
          id
          name
        }
      }
    }
  }
}
    `;
export const User = gql`
    query User($id: String!) {
  user(id: $id) {
    id
    email
    name
    bio
    company
    avatar
    verified
    profiles
    role
    suuid
  }
}
    `;

export const UserProfile = gql`
    query UserProfile($id: String!) {
  user(id: $id) {
    id
    name
    bio
    company
    avatar
    verified
  }
}
    `;
export const Webhook = gql`
    query webhook($streamId: String!, $webhookId: String!) {
  stream(id: $streamId) {
    id
    role
    webhooks(id: $webhookId) {
      items {
        id
        streamId
        url
        description
        triggers
        enabled
        history(limit: 1) {
          items {
            status
            statusInfo
          }
        }
      }
    }
  }
}
    `;
export const Webhooks = gql`
    query webhooks($streamId: String!) {
  stream(id: $streamId) {
    id
    name
    role
    webhooks {
      items {
        id
        streamId
        url
        description
        triggers
        enabled
        history(limit: 50) {
          items {
            status
            statusInfo
            lastUpdate
          }
        }
      }
    }
  }
}
    `;
export const CommentFullInfoFragmentDoc = gql`
    fragment CommentFullInfo on Comment {
  id
  archived
  authorId
  text {
    doc
    attachments {
      id
      fileName
      streamId
      fileType
      fileSize
    }
  }
  data
  screenshot
  replies {
    totalCount
  }
  resources {
    resourceId
    resourceType
  }
  createdAt
  updatedAt
  viewedAt
}
    `;
export const StreamCollaboratorFieldsFragmentDoc = gql`
    fragment StreamCollaboratorFields on StreamCollaborator {
  id
  name
  role
  company
  avatar
}
    `;
export const LimitedUserFieldsFragmentDoc = gql`
    fragment LimitedUserFields on LimitedUser {
  id
  name
  bio
  company
  avatar
  verified
}
    `;
export const UsersOwnInviteFieldsFragmentDoc = gql`
    fragment UsersOwnInviteFields on PendingStreamCollaborator {
  id
  inviteId
  streamId
  streamName
  token
  invitedBy {
    ...LimitedUserFields
  }
}
    ${LimitedUserFieldsFragmentDoc}`;
export const MainServerInfoFieldsFragmentDoc = gql`
    fragment MainServerInfoFields on ServerInfo {
  name
  company
  description
  adminContact
  canonicalUrl
  termsOfService
  inviteOnly
  version
}
    `;
export const ServerInfoRolesFieldsFragmentDoc = gql`
    fragment ServerInfoRolesFields on ServerInfo {
  roles {
    name
    description
    resourceTarget
  }
}
    `;
export const ServerInfoScopesFieldsFragmentDoc = gql`
    fragment ServerInfoScopesFields on ServerInfo {
  scopes {
    name
    description
  }
}
    `;
export const CommonStreamFieldsFragmentDoc = gql`
    fragment CommonStreamFields on Stream {
  id
  name
  description
  role
  isPublic
  createdAt
  updatedAt
  commentCount
  collaborators {
    id
    name
    company
    avatar
    role
  }
  commits(limit: 1) {
    totalCount
  }
  branches {
    totalCount
  }
  favoritedDate
  favoritesCount
}
    `;
export const CommonUserFieldsFragmentDoc = gql`
    fragment CommonUserFields on User {
  id
  suuid
  email
  name
  bio
  company
  avatar
  verified
  profiles
  role
  suuid
  streams {
    totalCount
  }
  commits(limit: 1) {
    totalCount
    items {
      id
      createdAt
    }
  }
}
    `;
export const StreamWithBranchDocument = gql`
    query StreamWithBranch($streamId: String!, $branchName: String!, $cursor: String) {
  stream(id: $streamId) {
    id
    name
    branch(name: $branchName) {
      id
      name
      description
      commits(cursor: $cursor, limit: 4) {
        totalCount
        cursor
        items {
          id
          authorName
          authorId
          authorAvatar
          sourceApplication
          message
          referencedObject
          createdAt
          commentCount
        }
      }
    }
  }
}
    `;

/**
 * __useStreamWithBranchQuery__
 *
 * To use a Smart Query within a Vue component, call `useStreamWithBranchQuery` as the value for a query key
 * in the component's `apollo` config, passing any options required for the query.
 *
 * @param options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/core/ApolloClient/#ApolloClient.query
 *
 * @example
 * {
 *   apollo: {
 *     streamWithBranch: useStreamWithBranchQuery({
 *       variables: {
 *         streamId: // value for 'streamId'
 *         branchName: // value for 'branchName'
 *         cursor: // value for 'cursor'
 *       },
 *       loadingKey: 'loading',
 *       fetchPolicy: 'no-cache',
 *     }),
 *   }
 * }
 */
export const useStreamWithBranchQuery = createSmartQueryOptionsFunction<
  StreamWithBranchQuery,
  StreamWithBranchQueryVariables,
  ApolloError
>(StreamWithBranchDocument, handleApolloError);

export const BranchCreatedDocument = gql`
    subscription BranchCreated($streamId: String!) {
  branchCreated(streamId: $streamId)
}
    `;

/**
 * __useBranchCreatedSubscription__
 *
 * To use a Smart Subscription within a Vue component, call `useBranchCreatedSubscription` as the value for a `$subscribe` key
 * in the component's `apollo` config, passing any options required for the subscription.
 *
 * @param options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/core/ApolloClient/#ApolloClient.subscribe
 *
 * @example
 * {
 *   apollo: {
 *     $subscribe: {
 *       branchCreated: useBranchCreatedSubscription({
 *         variables: {
 *           streamId: // value for 'streamId'
 *         },
 *         loadingKey: 'loading',
 *         fetchPolicy: 'no-cache',
 *       }),
 *     },
 *   }
 * }
 */
export const useBranchCreatedSubscription = createSmartSubscriptionOptionsFunction<
  BranchCreatedSubscription,
  BranchCreatedSubscriptionVariables,
  ApolloError
>(BranchCreatedDocument, handleApolloError);

export const StreamCommitQueryDocument = gql`
    query StreamCommitQuery($streamId: String!, $id: String!) {
  stream(id: $streamId) {
    id
    name
    role
    commit(id: $id) {
      id
      message
      referencedObject
      authorName
      authorId
      authorAvatar
      createdAt
      branchName
      sourceApplication
    }
  }
}
    `;

/**
 * __useStreamCommitQueryQuery__
 *
 * To use a Smart Query within a Vue component, call `useStreamCommitQueryQuery` as the value for a query key
 * in the component's `apollo` config, passing any options required for the query.
 *
 * @param options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/core/ApolloClient/#ApolloClient.query
 *
 * @example
 * {
 *   apollo: {
 *     streamCommitQuery: useStreamCommitQueryQuery({
 *       variables: {
 *         streamId: // value for 'streamId'
 *         id: // value for 'id'
 *       },
 *       loadingKey: 'loading',
 *       fetchPolicy: 'no-cache',
 *     }),
 *   }
 * }
 */
export const useStreamCommitQueryQuery = createSmartQueryOptionsFunction<
  StreamCommitQueryQuery,
  StreamCommitQueryQueryVariables,
  ApolloError
>(StreamCommitQueryDocument, handleApolloError);

export const StreamInviteDocument = gql`
    query StreamInvite($streamId: String!, $token: String) {
  streamInvite(streamId: $streamId, token: $token) {
    ...UsersOwnInviteFields
  }
}
    ${UsersOwnInviteFieldsFragmentDoc}`;

/**
 * __useStreamInviteQuery__
 *
 * To use a Smart Query within a Vue component, call `useStreamInviteQuery` as the value for a query key
 * in the component's `apollo` config, passing any options required for the query.
 *
 * @param options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/core/ApolloClient/#ApolloClient.query
 *
 * @example
 * {
 *   apollo: {
 *     streamInvite: useStreamInviteQuery({
 *       variables: {
 *         streamId: // value for 'streamId'
 *         token: // value for 'token'
 *       },
 *       loadingKey: 'loading',
 *       fetchPolicy: 'no-cache',
 *     }),
 *   }
 * }
 */
export const useStreamInviteQuery = createSmartQueryOptionsFunction<
  StreamInviteQuery,
  StreamInviteQueryVariables,
  ApolloError
>(StreamInviteDocument, handleApolloError);

export const UserStreamInvitesDocument = gql`
    query UserStreamInvites {
  streamInvites {
    ...UsersOwnInviteFields
  }
}
    ${UsersOwnInviteFieldsFragmentDoc}`;

/**
 * __useUserStreamInvitesQuery__
 *
 * To use a Smart Query within a Vue component, call `useUserStreamInvitesQuery` as the value for a query key
 * in the component's `apollo` config, passing any options required for the query.
 *
 * @param options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/core/ApolloClient/#ApolloClient.query
 *
 * @example
 * {
 *   apollo: {
 *     userStreamInvites: useUserStreamInvitesQuery({
 *       variables: {},
 *       loadingKey: 'loading',
 *       fetchPolicy: 'no-cache',
 *     }),
 *   }
 * }
 */
export const useUserStreamInvitesQuery = createSmartQueryOptionsFunction<
  UserStreamInvitesQuery,
  UserStreamInvitesQueryVariables,
  ApolloError
>(UserStreamInvitesDocument, handleApolloError);

export const UseStreamInviteDocument = gql`
    mutation UseStreamInvite($accept: Boolean!, $streamId: String!, $token: String!) {
  streamInviteUse(accept: $accept, streamId: $streamId, token: $token)
}
    `;

/**
 * __useStreamInviteMutation__
 *
 * To run a mutation, you call `useStreamInviteMutation` within a Vue component and pass it
 * your Vue app instance along with any options that fit your needs.
 *
 * @param app, a reference to your Vue app instance (which must have a `$apollo` property)
 * @param options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/core/ApolloClient/#ApolloClient.mutate
 * @param client (optional), which can be an instance of `DollarApollo` or the `mutate()` function provided by an `<ApolloMutation>` component
 *
 * @example
 * const { success, data, errors } = useStreamInviteMutation(this, {
 *   variables: {
 *     accept: // value for 'accept'
 *     streamId: // value for 'streamId'
 *     token: // value for 'token'
 *   },
 * });
 */
export const useStreamInviteMutation = createMutationFunction<
  UseStreamInviteMutation,
  UseStreamInviteMutationVariables,
  ApolloError
>(UseStreamInviteDocument, handleApolloError);

export const CancelStreamInviteDocument = gql`
    mutation CancelStreamInvite($streamId: String!, $inviteId: String!) {
  streamInviteCancel(streamId: $streamId, inviteId: $inviteId)
}
    `;

/**
 * __cancelStreamInviteMutation__
 *
 * To run a mutation, you call `cancelStreamInviteMutation` within a Vue component and pass it
 * your Vue app instance along with any options that fit your needs.
 *
 * @param app, a reference to your Vue app instance (which must have a `$apollo` property)
 * @param options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/core/ApolloClient/#ApolloClient.mutate
 * @param client (optional), which can be an instance of `DollarApollo` or the `mutate()` function provided by an `<ApolloMutation>` component
 *
 * @example
 * const { success, data, errors } = cancelStreamInviteMutation(this, {
 *   variables: {
 *     streamId: // value for 'streamId'
 *     inviteId: // value for 'inviteId'
 *   },
 * });
 */
export const cancelStreamInviteMutation = createMutationFunction<
  CancelStreamInviteMutation,
  CancelStreamInviteMutationVariables,
  ApolloError
>(CancelStreamInviteDocument, handleApolloError);

export const DeleteInviteDocument = gql`
    mutation DeleteInvite($inviteId: String!) {
  inviteDelete(inviteId: $inviteId)
}
    `;

/**
 * __deleteInviteMutation__
 *
 * To run a mutation, you call `deleteInviteMutation` within a Vue component and pass it
 * your Vue app instance along with any options that fit your needs.
 *
 * @param app, a reference to your Vue app instance (which must have a `$apollo` property)
 * @param options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/core/ApolloClient/#ApolloClient.mutate
 * @param client (optional), which can be an instance of `DollarApollo` or the `mutate()` function provided by an `<ApolloMutation>` component
 *
 * @example
 * const { success, data, errors } = deleteInviteMutation(this, {
 *   variables: {
 *     inviteId: // value for 'inviteId'
 *   },
 * });
 */
export const deleteInviteMutation = createMutationFunction<
  DeleteInviteMutation,
  DeleteInviteMutationVariables,
  ApolloError
>(DeleteInviteDocument, handleApolloError);

export const ResendInviteDocument = gql`
    mutation ResendInvite($inviteId: String!) {
  inviteResend(inviteId: $inviteId)
}
    `;

/**
 * __resendInviteMutation__
 *
 * To run a mutation, you call `resendInviteMutation` within a Vue component and pass it
 * your Vue app instance along with any options that fit your needs.
 *
 * @param app, a reference to your Vue app instance (which must have a `$apollo` property)
 * @param options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/core/ApolloClient/#ApolloClient.mutate
 * @param client (optional), which can be an instance of `DollarApollo` or the `mutate()` function provided by an `<ApolloMutation>` component
 *
 * @example
 * const { success, data, errors } = resendInviteMutation(this, {
 *   variables: {
 *     inviteId: // value for 'inviteId'
 *   },
 * });
 */
export const resendInviteMutation = createMutationFunction<
  ResendInviteMutation,
  ResendInviteMutationVariables,
  ApolloError
>(ResendInviteDocument, handleApolloError);

export const BatchInviteToServerDocument = gql`
    mutation BatchInviteToServer($paramsArray: [ServerInviteCreateInput!]!) {
  serverInviteBatchCreate(input: $paramsArray)
}
    `;

/**
 * __batchInviteToServerMutation__
 *
 * To run a mutation, you call `batchInviteToServerMutation` within a Vue component and pass it
 * your Vue app instance along with any options that fit your needs.
 *
 * @param app, a reference to your Vue app instance (which must have a `$apollo` property)
 * @param options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/core/ApolloClient/#ApolloClient.mutate
 * @param client (optional), which can be an instance of `DollarApollo` or the `mutate()` function provided by an `<ApolloMutation>` component
 *
 * @example
 * const { success, data, errors } = batchInviteToServerMutation(this, {
 *   variables: {
 *     paramsArray: // value for 'paramsArray'
 *   },
 * });
 */
export const batchInviteToServerMutation = createMutationFunction<
  BatchInviteToServerMutation,
  BatchInviteToServerMutationVariables,
  ApolloError
>(BatchInviteToServerDocument, handleApolloError);

export const BatchInviteToStreamsDocument = gql`
    mutation BatchInviteToStreams($paramsArray: [StreamInviteCreateInput!]!) {
  streamInviteBatchCreate(input: $paramsArray)
}
    `;

/**
 * __batchInviteToStreamsMutation__
 *
 * To run a mutation, you call `batchInviteToStreamsMutation` within a Vue component and pass it
 * your Vue app instance along with any options that fit your needs.
 *
 * @param app, a reference to your Vue app instance (which must have a `$apollo` property)
 * @param options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/core/ApolloClient/#ApolloClient.mutate
 * @param client (optional), which can be an instance of `DollarApollo` or the `mutate()` function provided by an `<ApolloMutation>` component
 *
 * @example
 * const { success, data, errors } = batchInviteToStreamsMutation(this, {
 *   variables: {
 *     paramsArray: // value for 'paramsArray'
 *   },
 * });
 */
export const batchInviteToStreamsMutation = createMutationFunction<
  BatchInviteToStreamsMutation,
  BatchInviteToStreamsMutationVariables,
  ApolloError
>(BatchInviteToStreamsDocument, handleApolloError);

export const StreamObjectDocument = gql`
    query StreamObject($streamId: String!, $id: String!) {
  stream(id: $streamId) {
    id
    object(id: $id) {
      totalChildrenCount
      id
      speckleType
      data
    }
  }
}
    `;

/**
 * __useStreamObjectQuery__
 *
 * To use a Smart Query within a Vue component, call `useStreamObjectQuery` as the value for a query key
 * in the component's `apollo` config, passing any options required for the query.
 *
 * @param options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/core/ApolloClient/#ApolloClient.query
 *
 * @example
 * {
 *   apollo: {
 *     streamObject: useStreamObjectQuery({
 *       variables: {
 *         streamId: // value for 'streamId'
 *         id: // value for 'id'
 *       },
 *       loadingKey: 'loading',
 *       fetchPolicy: 'no-cache',
 *     }),
 *   }
 * }
 */
export const useStreamObjectQuery = createSmartQueryOptionsFunction<
  StreamObjectQuery,
  StreamObjectQueryVariables,
  ApolloError
>(StreamObjectDocument, handleApolloError);

export const StreamObjectNoDataDocument = gql`
    query StreamObjectNoData($streamId: String!, $id: String!) {
  stream(id: $streamId) {
    id
    name
    object(id: $id) {
      totalChildrenCount
      id
      speckleType
    }
  }
}
    `;

/**
 * __useStreamObjectNoDataQuery__
 *
 * To use a Smart Query within a Vue component, call `useStreamObjectNoDataQuery` as the value for a query key
 * in the component's `apollo` config, passing any options required for the query.
 *
 * @param options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/core/ApolloClient/#ApolloClient.query
 *
 * @example
 * {
 *   apollo: {
 *     streamObjectNoData: useStreamObjectNoDataQuery({
 *       variables: {
 *         streamId: // value for 'streamId'
 *         id: // value for 'id'
 *       },
 *       loadingKey: 'loading',
 *       fetchPolicy: 'no-cache',
 *     }),
 *   }
 * }
 */
export const useStreamObjectNoDataQuery = createSmartQueryOptionsFunction<
  StreamObjectNoDataQuery,
  StreamObjectNoDataQueryVariables,
  ApolloError
>(StreamObjectNoDataDocument, handleApolloError);

export const MainServerInfoDocument = gql`
    query MainServerInfo {
  serverInfo {
    ...MainServerInfoFields
  }
}
    ${MainServerInfoFieldsFragmentDoc}`;

/**
 * __useMainServerInfoQuery__
 *
 * To use a Smart Query within a Vue component, call `useMainServerInfoQuery` as the value for a query key
 * in the component's `apollo` config, passing any options required for the query.
 *
 * @param options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/core/ApolloClient/#ApolloClient.query
 *
 * @example
 * {
 *   apollo: {
 *     mainServerInfo: useMainServerInfoQuery({
 *       variables: {},
 *       loadingKey: 'loading',
 *       fetchPolicy: 'no-cache',
 *     }),
 *   }
 * }
 */
export const useMainServerInfoQuery = createSmartQueryOptionsFunction<
  MainServerInfoQuery,
  MainServerInfoQueryVariables,
  ApolloError
>(MainServerInfoDocument, handleApolloError);

export const FullServerInfoDocument = gql`
    query FullServerInfo {
  serverInfo {
    ...MainServerInfoFields
    ...ServerInfoRolesFields
    ...ServerInfoScopesFields
  }
}
    ${MainServerInfoFieldsFragmentDoc}
${ServerInfoRolesFieldsFragmentDoc}
${ServerInfoScopesFieldsFragmentDoc}`;

/**
 * __useFullServerInfoQuery__
 *
 * To use a Smart Query within a Vue component, call `useFullServerInfoQuery` as the value for a query key
 * in the component's `apollo` config, passing any options required for the query.
 *
 * @param options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/core/ApolloClient/#ApolloClient.query
 *
 * @example
 * {
 *   apollo: {
 *     fullServerInfo: useFullServerInfoQuery({
 *       variables: {},
 *       loadingKey: 'loading',
 *       fetchPolicy: 'no-cache',
 *     }),
 *   }
 * }
 */
export const useFullServerInfoQuery = createSmartQueryOptionsFunction<
  FullServerInfoQuery,
  FullServerInfoQueryVariables,
  ApolloError
>(FullServerInfoDocument, handleApolloError);

export const StreamCommitsDocument = gql`
    query StreamCommits($id: String!) {
  stream(id: $id) {
    id
    role
    commits {
      totalCount
      items {
        id
        authorId
        authorName
        authorAvatar
        createdAt
        message
        referencedObject
        branchName
        sourceApplication
      }
    }
  }
}
    `;

/**
 * __useStreamCommitsQuery__
 *
 * To use a Smart Query within a Vue component, call `useStreamCommitsQuery` as the value for a query key
 * in the component's `apollo` config, passing any options required for the query.
 *
 * @param options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/core/ApolloClient/#ApolloClient.query
 *
 * @example
 * {
 *   apollo: {
 *     streamCommits: useStreamCommitsQuery({
 *       variables: {
 *         id: // value for 'id'
 *       },
 *       loadingKey: 'loading',
 *       fetchPolicy: 'no-cache',
 *     }),
 *   }
 * }
 */
export const useStreamCommitsQuery = createSmartQueryOptionsFunction<
  StreamCommitsQuery,
  StreamCommitsQueryVariables,
  ApolloError
>(StreamCommitsDocument, handleApolloError);

export const StreamsDocument = gql`
    query Streams($cursor: String) {
  streams(cursor: $cursor, limit: 10) {
    totalCount
    cursor
    items {
      id
      name
      description
      role
      isPublic
      createdAt
      updatedAt
      commentCount
      collaborators {
        id
        name
        company
        avatar
        role
      }
      commits(limit: 1) {
        totalCount
        items {
          id
          createdAt
          message
          authorId
          branchName
          authorName
          authorAvatar
          referencedObject
        }
      }
      branches {
        totalCount
      }
      favoritedDate
      favoritesCount
    }
  }
}
    `;

/**
 * __useStreamsQuery__
 *
 * To use a Smart Query within a Vue component, call `useStreamsQuery` as the value for a query key
 * in the component's `apollo` config, passing any options required for the query.
 *
 * @param options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/core/ApolloClient/#ApolloClient.query
 *
 * @example
 * {
 *   apollo: {
 *     streams: useStreamsQuery({
 *       variables: {
 *         cursor: // value for 'cursor'
 *       },
 *       loadingKey: 'loading',
 *       fetchPolicy: 'no-cache',
 *     }),
 *   }
 * }
 */
export const useStreamsQuery = createSmartQueryOptionsFunction<
  StreamsQuery,
  StreamsQueryVariables,
  ApolloError
>(StreamsDocument, handleApolloError);

export const StreamDocument = gql`
    query Stream($id: String!) {
  stream(id: $id) {
    ...CommonStreamFields
  }
}
    ${CommonStreamFieldsFragmentDoc}`;

/**
 * __useStreamQuery__
 *
 * To use a Smart Query within a Vue component, call `useStreamQuery` as the value for a query key
 * in the component's `apollo` config, passing any options required for the query.
 *
 * @param options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/core/ApolloClient/#ApolloClient.query
 *
 * @example
 * {
 *   apollo: {
 *     stream: useStreamQuery({
 *       variables: {
 *         id: // value for 'id'
 *       },
 *       loadingKey: 'loading',
 *       fetchPolicy: 'no-cache',
 *     }),
 *   }
 * }
 */
export const useStreamQuery = createSmartQueryOptionsFunction<
  StreamQuery,
  StreamQueryVariables,
  ApolloError
>(StreamDocument, handleApolloError);

export const StreamWithCollaboratorsDocument = gql`
    query StreamWithCollaborators($id: String!) {
  stream(id: $id) {
    id
    name
    isPublic
    role
    collaborators {
      ...StreamCollaboratorFields
    }
    pendingCollaborators {
      title
      inviteId
      role
      user {
        ...LimitedUserFields
      }
    }
  }
}
    ${StreamCollaboratorFieldsFragmentDoc}
${LimitedUserFieldsFragmentDoc}`;

/**
 * __useStreamWithCollaboratorsQuery__
 *
 * To use a Smart Query within a Vue component, call `useStreamWithCollaboratorsQuery` as the value for a query key
 * in the component's `apollo` config, passing any options required for the query.
 *
 * @param options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/core/ApolloClient/#ApolloClient.query
 *
 * @example
 * {
 *   apollo: {
 *     streamWithCollaborators: useStreamWithCollaboratorsQuery({
 *       variables: {
 *         id: // value for 'id'
 *       },
 *       loadingKey: 'loading',
 *       fetchPolicy: 'no-cache',
 *     }),
 *   }
 * }
 */
export const useStreamWithCollaboratorsQuery = createSmartQueryOptionsFunction<
  StreamWithCollaboratorsQuery,
  StreamWithCollaboratorsQueryVariables,
  ApolloError
>(StreamWithCollaboratorsDocument, handleApolloError);

export const LeaveStreamDocument = gql`
    mutation LeaveStream($streamId: String!) {
  streamLeave(streamId: $streamId)
}
    `;

/**
 * __leaveStreamMutation__
 *
 * To run a mutation, you call `leaveStreamMutation` within a Vue component and pass it
 * your Vue app instance along with any options that fit your needs.
 *
 * @param app, a reference to your Vue app instance (which must have a `$apollo` property)
 * @param options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/core/ApolloClient/#ApolloClient.mutate
 * @param client (optional), which can be an instance of `DollarApollo` or the `mutate()` function provided by an `<ApolloMutation>` component
 *
 * @example
 * const { success, data, errors } = leaveStreamMutation(this, {
 *   variables: {
 *     streamId: // value for 'streamId'
 *   },
 * });
 */
export const leaveStreamMutation = createMutationFunction<
  LeaveStreamMutation,
  LeaveStreamMutationVariables,
  ApolloError
>(LeaveStreamDocument, handleApolloError);

export const UpdateStreamPermissionDocument = gql`
    mutation UpdateStreamPermission($params: StreamUpdatePermissionInput!) {
  streamUpdatePermission(permissionParams: $params)
}
    `;

/**
 * __updateStreamPermissionMutation__
 *
 * To run a mutation, you call `updateStreamPermissionMutation` within a Vue component and pass it
 * your Vue app instance along with any options that fit your needs.
 *
 * @param app, a reference to your Vue app instance (which must have a `$apollo` property)
 * @param options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/core/ApolloClient/#ApolloClient.mutate
 * @param client (optional), which can be an instance of `DollarApollo` or the `mutate()` function provided by an `<ApolloMutation>` component
 *
 * @example
 * const { success, data, errors } = updateStreamPermissionMutation(this, {
 *   variables: {
 *     params: // value for 'params'
 *   },
 * });
 */
export const updateStreamPermissionMutation = createMutationFunction<
  UpdateStreamPermissionMutation,
  UpdateStreamPermissionMutationVariables,
  ApolloError
>(UpdateStreamPermissionDocument, handleApolloError);

export const UserFavoriteStreamsDocument = gql`
    query UserFavoriteStreams($cursor: String) {
  user {
    ...CommonUserFields
    favoriteStreams(cursor: $cursor, limit: 10) {
      totalCount
      cursor
      items {
        ...CommonStreamFields
      }
    }
  }
}
    ${CommonUserFieldsFragmentDoc}
${CommonStreamFieldsFragmentDoc}`;

/**
 * __useUserFavoriteStreamsQuery__
 *
 * To use a Smart Query within a Vue component, call `useUserFavoriteStreamsQuery` as the value for a query key
 * in the component's `apollo` config, passing any options required for the query.
 *
 * @param options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/core/ApolloClient/#ApolloClient.query
 *
 * @example
 * {
 *   apollo: {
 *     userFavoriteStreams: useUserFavoriteStreamsQuery({
 *       variables: {
 *         cursor: // value for 'cursor'
 *       },
 *       loadingKey: 'loading',
 *       fetchPolicy: 'no-cache',
 *     }),
 *   }
 * }
 */
export const useUserFavoriteStreamsQuery = createSmartQueryOptionsFunction<
  UserFavoriteStreamsQuery,
  UserFavoriteStreamsQueryVariables,
  ApolloError
>(UserFavoriteStreamsDocument, handleApolloError);

export const MainUserDataDocument = gql`
    query MainUserData {
  user {
    ...CommonUserFields
  }
}
    ${CommonUserFieldsFragmentDoc}`;

/**
 * __useMainUserDataQuery__
 *
 * To use a Smart Query within a Vue component, call `useMainUserDataQuery` as the value for a query key
 * in the component's `apollo` config, passing any options required for the query.
 *
 * @param options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/core/ApolloClient/#ApolloClient.query
 *
 * @example
 * {
 *   apollo: {
 *     mainUserData: useMainUserDataQuery({
 *       variables: {},
 *       loadingKey: 'loading',
 *       fetchPolicy: 'no-cache',
 *     }),
 *   }
 * }
 */
export const useMainUserDataQuery = createSmartQueryOptionsFunction<
  MainUserDataQuery,
  MainUserDataQueryVariables,
  ApolloError
>(MainUserDataDocument, handleApolloError);

export const ExtraUserDataDocument = gql`
    query ExtraUserData {
  user {
    ...CommonUserFields
    totalOwnedStreamsFavorites
  }
}
    ${CommonUserFieldsFragmentDoc}`;

/**
 * __useExtraUserDataQuery__
 *
 * To use a Smart Query within a Vue component, call `useExtraUserDataQuery` as the value for a query key
 * in the component's `apollo` config, passing any options required for the query.
 *
 * @param options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/core/ApolloClient/#ApolloClient.query
 *
 * @example
 * {
 *   apollo: {
 *     extraUserData: useExtraUserDataQuery({
 *       variables: {},
 *       loadingKey: 'loading',
 *       fetchPolicy: 'no-cache',
 *     }),
 *   }
 * }
 */
export const useExtraUserDataQuery = createSmartQueryOptionsFunction<
  ExtraUserDataQuery,
  ExtraUserDataQueryVariables,
  ApolloError
>(ExtraUserDataDocument, handleApolloError);

export const UserSearchDocument = gql`
    query UserSearch($query: String!, $limit: Int!, $cursor: String, $archived: Boolean) {
  userSearch(query: $query, limit: $limit, cursor: $cursor, archived: $archived) {
    cursor
    items {
      ...LimitedUserFields
    }
  }
}
    ${LimitedUserFieldsFragmentDoc}`;

/**
 * __useUserSearchQuery__
 *
 * To use a Smart Query within a Vue component, call `useUserSearchQuery` as the value for a query key
 * in the component's `apollo` config, passing any options required for the query.
 *
 * @param options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/core/ApolloClient/#ApolloClient.query
 *
 * @example
 * {
 *   apollo: {
 *     userSearch: useUserSearchQuery({
 *       variables: {
 *         query: // value for 'query'
 *         limit: // value for 'limit'
 *         cursor: // value for 'cursor'
 *         archived: // value for 'archived'
 *       },
 *       loadingKey: 'loading',
 *       fetchPolicy: 'no-cache',
 *     }),
 *   }
 * }
 */
export const useUserSearchQuery = createSmartQueryOptionsFunction<
  UserSearchQuery,
  UserSearchQueryVariables,
  ApolloError
>(UserSearchDocument, handleApolloError);

export const IsLoggedInDocument = gql`
    query IsLoggedIn {
  user {
    id
  }
}
    `;

/**
 * __useIsLoggedInQuery__
 *
 * To use a Smart Query within a Vue component, call `useIsLoggedInQuery` as the value for a query key
 * in the component's `apollo` config, passing any options required for the query.
 *
 * @param options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/core/ApolloClient/#ApolloClient.query
 *
 * @example
 * {
 *   apollo: {
 *     isLoggedIn: useIsLoggedInQuery({
 *       variables: {},
 *       loadingKey: 'loading',
 *       fetchPolicy: 'no-cache',
 *     }),
 *   }
 * }
 */
export const useIsLoggedInQuery = createSmartQueryOptionsFunction<
  IsLoggedInQuery,
  IsLoggedInQueryVariables,
  ApolloError
>(IsLoggedInDocument, handleApolloError);

export const AdminUsersListDocument = gql`
    query AdminUsersList($limit: Int, $offset: Int, $query: String) {
  adminUsers(limit: $limit, offset: $offset, query: $query) {
    totalCount
    items {
      id
      registeredUser {
        id
        suuid
        email
        name
        bio
        company
        avatar
        verified
        profiles
        role
        authorizedApps {
          name
        }
      }
      invitedUser {
        id
        email
        invitedBy {
          id
          name
        }
      }
    }
  }
}
    `;

/**
 * __useAdminUsersListQuery__
 *
 * To use a Smart Query within a Vue component, call `useAdminUsersListQuery` as the value for a query key
 * in the component's `apollo` config, passing any options required for the query.
 *
 * @param options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/core/ApolloClient/#ApolloClient.query
 *
 * @example
 * {
 *   apollo: {
 *     adminUsersList: useAdminUsersListQuery({
 *       variables: {
 *         limit: // value for 'limit'
 *         offset: // value for 'offset'
 *         query: // value for 'query'
 *       },
 *       loadingKey: 'loading',
 *       fetchPolicy: 'no-cache',
 *     }),
 *   }
 * }
 */
export const useAdminUsersListQuery = createSmartQueryOptionsFunction<
  AdminUsersListQuery,
  AdminUsersListQueryVariables,
  ApolloError
>(AdminUsersListDocument, handleApolloError);

export const UserDocument = gql`
    query User($id: String!) {
  user(id: $id) {
    id
    email
    name
    bio
    company
    avatar
    verified
    profiles
    role
    suuid
  }
}
    `;

/**
 * __useUserQuery__
 *
 * To use a Smart Query within a Vue component, call `useUserQuery` as the value for a query key
 * in the component's `apollo` config, passing any options required for the query.
 *
 * @param options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/core/ApolloClient/#ApolloClient.query
 *
 * @example
 * {
 *   apollo: {
 *     user: useUserQuery({
 *       variables: {
 *         id: // value for 'id'
 *       },
 *       loadingKey: 'loading',
 *       fetchPolicy: 'no-cache',
 *     }),
 *   }
 * }
 */
export const useUserQuery = createSmartQueryOptionsFunction<
  UserQuery,
  UserQueryVariables,
  ApolloError
>(UserDocument, handleApolloError);

export const Document = gql`
    {
  user {
    id
    email
    name
    bio
    company
    avatar
    verified
    profiles
    role
    streams(limit: 25) {
      totalCount
      cursor
      items {
        id
        name
        description
        isPublic
        createdAt
        updatedAt
        collaborators {
          id
          name
          company
          avatar
          role
        }
        commits {
          totalCount
        }
        branches {
          totalCount
        }
      }
    }
    commits(limit: 25) {
      totalCount
      cursor
      items {
        id
        message
        streamId
        streamName
        createdAt
      }
    }
  }
}
    `;
export const UserProfileDocument = gql`
    query UserProfile($id: String!) {
  user(id: $id) {
    id
    name
    bio
    company
    avatar
    verified
  }
}
    `;

/**
 * __useUserProfileQuery__
 *
 * To use a Smart Query within a Vue component, call `useUserProfileQuery` as the value for a query key
 * in the component's `apollo` config, passing any options required for the query.
 *
 * @param options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/core/ApolloClient/#ApolloClient.query
 *
 * @example
 * {
 *   apollo: {
 *     userProfile: useUserProfileQuery({
 *       variables: {
 *         id: // value for 'id'
 *       },
 *       loadingKey: 'loading',
 *       fetchPolicy: 'no-cache',
 *     }),
 *   }
 * }
 */
export const useUserProfileQuery = createSmartQueryOptionsFunction<
  UserProfileQuery,
  UserProfileQueryVariables,
  ApolloError
>(UserProfileDocument, handleApolloError);

export const WebhookDocument = gql`
    query webhook($streamId: String!, $webhookId: String!) {
  stream(id: $streamId) {
    id
    role
    webhooks(id: $webhookId) {
      items {
        id
        streamId
        url
        description
        triggers
        enabled
        history(limit: 1) {
          items {
            status
            statusInfo
          }
        }
      }
    }
  }
}
    `;

/**
 * __useWebhookQuery__
 *
 * To use a Smart Query within a Vue component, call `useWebhookQuery` as the value for a query key
 * in the component's `apollo` config, passing any options required for the query.
 *
 * @param options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/core/ApolloClient/#ApolloClient.query
 *
 * @example
 * {
 *   apollo: {
 *     webhook: useWebhookQuery({
 *       variables: {
 *         streamId: // value for 'streamId'
 *         webhookId: // value for 'webhookId'
 *       },
 *       loadingKey: 'loading',
 *       fetchPolicy: 'no-cache',
 *     }),
 *   }
 * }
 */
export const useWebhookQuery = createSmartQueryOptionsFunction<
  WebhookQuery,
  WebhookQueryVariables,
  ApolloError
>(WebhookDocument, handleApolloError);

export const WebhooksDocument = gql`
    query webhooks($streamId: String!) {
  stream(id: $streamId) {
    id
    name
    role
    webhooks {
      items {
        id
        streamId
        url
        description
        triggers
        enabled
        history(limit: 50) {
          items {
            status
            statusInfo
            lastUpdate
          }
        }
      }
    }
  }
}
    `;

/**
 * __useWebhooksQuery__
 *
 * To use a Smart Query within a Vue component, call `useWebhooksQuery` as the value for a query key
 * in the component's `apollo` config, passing any options required for the query.
 *
 * @param options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/core/ApolloClient/#ApolloClient.query
 *
 * @example
 * {
 *   apollo: {
 *     webhooks: useWebhooksQuery({
 *       variables: {
 *         streamId: // value for 'streamId'
 *       },
 *       loadingKey: 'loading',
 *       fetchPolicy: 'no-cache',
 *     }),
 *   }
 * }
 */
export const useWebhooksQuery = createSmartQueryOptionsFunction<
  WebhooksQuery,
  WebhooksQueryVariables,
  ApolloError
>(WebhooksDocument, handleApolloError);
