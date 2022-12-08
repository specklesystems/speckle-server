import gql from 'graphql-tag';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
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
  authorId: Scalars['String'];
  createdAt?: Maybe<Scalars['DateTime']>;
  data?: Maybe<Scalars['JSONObject']>;
  id: Scalars['String'];
  /** Plain-text version of the comment text, ideal for previews */
  rawText: Scalars['String'];
  reactions?: Maybe<Array<Maybe<Scalars['String']>>>;
  /** Gets the replies to this comment. */
  replies?: Maybe<CommentCollection>;
  /** Resources that this comment targets. Can be a mixture of either one stream, or multiple commits and objects. */
  resources: Array<ResourceIdentifier>;
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

export type CommitObjectViewerState = {
  __typename?: 'CommitObjectViewerState';
  addingComment: Scalars['Boolean'];
  commentReactions: Array<Scalars['String']>;
  currentFilterState?: Maybe<Scalars['JSONObject']>;
  emojis: Array<Scalars['String']>;
  localFilterPropKey?: Maybe<Scalars['String']>;
  objectProperties?: Maybe<Array<Maybe<Scalars['JSONObject']>>>;
  preventCommentCollapse: Scalars['Boolean'];
  sectionBox?: Maybe<Scalars['Boolean']>;
  selectedCommentMetaData?: Maybe<SelectedCommentMetaData>;
  selectedObjects?: Maybe<Array<Maybe<Scalars['JSONObject']>>>;
  viewerBusy: Scalars['Boolean'];
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
  name?: Maybe<Scalars['String']>;
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
  id: Scalars['ID'];
  name: Scalars['String'];
  sourceApp: Scalars['String'];
  versionCount: Scalars['Int'];
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
  objectCreate: Array<Maybe<Scalars['String']>>;
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
  editedAt: Scalars['DateTime'];
  id: Scalars['ID'];
  modelCount: Scalars['Int'];
  name: Scalars['String'];
  role: Scalars['String'];
  team: Array<LimitedUser>;
};

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
  /** Commit/Object viewer state (local-only) */
  commitObjectViewerState: CommitObjectViewerState;
  /** All of the discoverable streams of the server */
  discoverableStreams?: Maybe<StreamCollection>;
  /** Get the (limited) profile information of another server user */
  otherUser?: Maybe<LimitedUser>;
  /** @deprecated only used for testing for now */
  project: Project;
  /** @deprecated only used for testing for now */
  projects: Array<Project>;
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
  id?: InputMaybe<Scalars['String']>;
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

export type SelectedCommentMetaData = {
  __typename?: 'SelectedCommentMetaData';
  id: Scalars['String'];
  selectionLocation: Scalars['JSONObject'];
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
  name?: Maybe<Scalars['String']>;
  notificationPreferences: Scalars['JSONObject'];
  profiles?: Maybe<Scalars['JSONObject']>;
  /** Get projects that the user participates in */
  projects: Array<Project>;
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

export type GetStreamAccessRequestQueryVariables = Exact<{
  streamId: Scalars['String'];
}>;


export type GetStreamAccessRequestQuery = { __typename?: 'Query', streamAccessRequest?: { __typename?: 'StreamAccessRequest', id: string, streamId: string, createdAt: string } | null };

export type CreateStreamAccessRequestMutationVariables = Exact<{
  streamId: Scalars['String'];
}>;


export type CreateStreamAccessRequestMutation = { __typename?: 'Mutation', streamAccessRequestCreate: { __typename?: 'StreamAccessRequest', id: string, streamId: string, createdAt: string } };

export type UseStreamAccessRequestMutationVariables = Exact<{
  requestId: Scalars['String'];
  accept: Scalars['Boolean'];
  role?: InputMaybe<StreamRole>;
}>;


export type UseStreamAccessRequestMutation = { __typename?: 'Mutation', streamAccessRequestUse: boolean };

export type StreamWithBranchQueryVariables = Exact<{
  streamId: Scalars['String'];
  branchName: Scalars['String'];
  cursor?: InputMaybe<Scalars['String']>;
}>;


export type StreamWithBranchQuery = { __typename?: 'Query', stream?: { __typename?: 'Stream', id: string, name: string, role?: string | null, branch?: { __typename?: 'Branch', id: string, name: string, description?: string | null, commits?: { __typename?: 'CommitCollection', totalCount: number, cursor?: string | null, items?: Array<{ __typename?: 'Commit', id: string, authorName?: string | null, authorId?: string | null, authorAvatar?: string | null, sourceApplication?: string | null, message?: string | null, referencedObject: string, createdAt?: string | null, commentCount: number }> | null } | null } | null } | null };

export type BranchCreatedSubscriptionVariables = Exact<{
  streamId: Scalars['String'];
}>;


export type BranchCreatedSubscription = { __typename?: 'Subscription', branchCreated?: Record<string, unknown> | null };

export type CommentFullInfoFragment = { __typename?: 'Comment', id: string, archived: boolean, authorId: string, data?: Record<string, unknown> | null, screenshot?: string | null, createdAt?: string | null, updatedAt?: string | null, viewedAt?: string | null, text: { __typename?: 'SmartTextEditorValue', doc?: Record<string, unknown> | null, attachments?: Array<{ __typename?: 'BlobMetadata', id: string, fileName: string, streamId: string, fileType: string, fileSize?: number | null }> | null }, replies?: { __typename?: 'CommentCollection', totalCount: number } | null, resources: Array<{ __typename?: 'ResourceIdentifier', resourceId: string, resourceType: ResourceType }> };

export type StreamCommitQueryQueryVariables = Exact<{
  streamId: Scalars['String'];
  id: Scalars['String'];
}>;


export type StreamCommitQueryQuery = { __typename?: 'Query', stream?: { __typename?: 'Stream', id: string, name: string, role?: string | null, commit?: { __typename?: 'Commit', id: string, message?: string | null, referencedObject: string, authorName?: string | null, authorId?: string | null, authorAvatar?: string | null, createdAt?: string | null, branchName?: string | null, sourceApplication?: string | null } | null } | null };

export type StreamBranchesSelectorQueryVariables = Exact<{
  streamId: Scalars['String'];
}>;


export type StreamBranchesSelectorQuery = { __typename?: 'Query', stream?: { __typename?: 'Stream', id: string, branches?: { __typename?: 'BranchCollection', items?: Array<{ __typename?: 'Branch', name: string }> | null } | null } | null };

export type MoveCommitsMutationVariables = Exact<{
  input: CommitsMoveInput;
}>;


export type MoveCommitsMutation = { __typename?: 'Mutation', commitsMove: boolean };

export type DeleteCommitsMutationVariables = Exact<{
  input: CommitsDeleteInput;
}>;


export type DeleteCommitsMutation = { __typename?: 'Mutation', commitsDelete: boolean };

export type BasicStreamAccessRequestFieldsFragment = { __typename?: 'StreamAccessRequest', id: string, streamId: string, createdAt: string };

export type FullStreamAccessRequestFieldsFragment = { __typename?: 'StreamAccessRequest', id: string, streamId: string, createdAt: string, requester: { __typename?: 'LimitedUser', id: string, name?: string | null, bio?: string | null, company?: string | null, avatar?: string | null, verified?: boolean | null } };

export type ActivityMainFieldsFragment = { __typename?: 'Activity', id: string, actionType: string, info: Record<string, unknown>, userId: string, streamId?: string | null, resourceId: string, resourceType: string, time: string, message: string };

export type LimitedCommitActivityFieldsFragment = { __typename?: 'Activity', id: string, info: Record<string, unknown>, time: string, userId: string, message: string };

export type StreamPendingAccessRequestsFragment = { __typename?: 'Stream', pendingAccessRequests?: Array<{ __typename?: 'StreamAccessRequest', id: string, streamId: string, createdAt: string, requester: { __typename?: 'LimitedUser', id: string, name?: string | null, bio?: string | null, company?: string | null, avatar?: string | null, verified?: boolean | null } }> | null };

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

export type ServerInfoBlobSizeFieldsFragment = { __typename?: 'ServerInfo', blobSizeLimitBytes: number };

export type MainServerInfoFieldsFragment = { __typename?: 'ServerInfo', name: string, company?: string | null, description?: string | null, adminContact?: string | null, canonicalUrl?: string | null, termsOfService?: string | null, inviteOnly?: boolean | null, version?: string | null };

export type ServerInfoRolesFieldsFragment = { __typename?: 'ServerInfo', roles: Array<{ __typename?: 'Role', name: string, description: string, resourceTarget: string } | null> };

export type ServerInfoScopesFieldsFragment = { __typename?: 'ServerInfo', scopes: Array<{ __typename?: 'Scope', name: string, description: string } | null> };

export type MainServerInfoQueryVariables = Exact<{ [key: string]: never; }>;


export type MainServerInfoQuery = { __typename?: 'Query', serverInfo: { __typename?: 'ServerInfo', name: string, company?: string | null, description?: string | null, adminContact?: string | null, canonicalUrl?: string | null, termsOfService?: string | null, inviteOnly?: boolean | null, version?: string | null } };

export type FullServerInfoQueryVariables = Exact<{ [key: string]: never; }>;


export type FullServerInfoQuery = { __typename?: 'Query', serverInfo: { __typename?: 'ServerInfo', name: string, company?: string | null, description?: string | null, adminContact?: string | null, canonicalUrl?: string | null, termsOfService?: string | null, inviteOnly?: boolean | null, version?: string | null, blobSizeLimitBytes: number, roles: Array<{ __typename?: 'Role', name: string, description: string, resourceTarget: string } | null>, scopes: Array<{ __typename?: 'Scope', name: string, description: string } | null> } };

export type ServerInfoBlobSizeLimitQueryVariables = Exact<{ [key: string]: never; }>;


export type ServerInfoBlobSizeLimitQuery = { __typename?: 'Query', serverInfo: { __typename?: 'ServerInfo', blobSizeLimitBytes: number } };

export type StreamCommitsQueryVariables = Exact<{
  id: Scalars['String'];
}>;


export type StreamCommitsQuery = { __typename?: 'Query', stream?: { __typename?: 'Stream', id: string, role?: string | null, commits?: { __typename?: 'CommitCollection', totalCount: number, items?: Array<{ __typename?: 'Commit', id: string, authorId?: string | null, authorName?: string | null, authorAvatar?: string | null, createdAt?: string | null, message?: string | null, referencedObject: string, branchName?: string | null, sourceApplication?: string | null }> | null } | null } | null };

export type StreamsQueryVariables = Exact<{
  cursor?: InputMaybe<Scalars['String']>;
}>;


export type StreamsQuery = { __typename?: 'Query', streams?: { __typename?: 'StreamCollection', totalCount: number, cursor?: string | null, items?: Array<{ __typename?: 'Stream', id: string, name: string, description?: string | null, role?: string | null, isPublic: boolean, createdAt: string, updatedAt: string, commentCount: number, favoritedDate?: string | null, favoritesCount: number, collaborators: Array<{ __typename?: 'StreamCollaborator', id: string, name: string, company?: string | null, avatar?: string | null, role: string }>, commits?: { __typename?: 'CommitCollection', totalCount: number, items?: Array<{ __typename?: 'Commit', id: string, createdAt?: string | null, message?: string | null, authorId?: string | null, branchName?: string | null, authorName?: string | null, authorAvatar?: string | null, referencedObject: string }> | null } | null, branches?: { __typename?: 'BranchCollection', totalCount: number } | null }> | null } | null };

export type CommonStreamFieldsFragment = { __typename?: 'Stream', id: string, name: string, description?: string | null, role?: string | null, isPublic: boolean, createdAt: string, updatedAt: string, commentCount: number, favoritedDate?: string | null, favoritesCount: number, collaborators: Array<{ __typename?: 'StreamCollaborator', id: string, name: string, role: string, company?: string | null, avatar?: string | null }>, commits?: { __typename?: 'CommitCollection', totalCount: number } | null, branches?: { __typename?: 'BranchCollection', totalCount: number } | null };

export type StreamQueryVariables = Exact<{
  id: Scalars['String'];
}>;


export type StreamQuery = { __typename?: 'Query', stream?: { __typename?: 'Stream', id: string, name: string, description?: string | null, role?: string | null, isPublic: boolean, createdAt: string, updatedAt: string, commentCount: number, favoritedDate?: string | null, favoritesCount: number, collaborators: Array<{ __typename?: 'StreamCollaborator', id: string, name: string, role: string, company?: string | null, avatar?: string | null }>, commits?: { __typename?: 'CommitCollection', totalCount: number } | null, branches?: { __typename?: 'BranchCollection', totalCount: number } | null } | null };

export type StreamWithCollaboratorsQueryVariables = Exact<{
  id: Scalars['String'];
}>;


export type StreamWithCollaboratorsQuery = { __typename?: 'Query', stream?: { __typename?: 'Stream', id: string, name: string, isPublic: boolean, role?: string | null, collaborators: Array<{ __typename?: 'StreamCollaborator', id: string, name: string, role: string, company?: string | null, avatar?: string | null }>, pendingCollaborators?: Array<{ __typename?: 'PendingStreamCollaborator', title: string, inviteId: string, role: string, user?: { __typename?: 'LimitedUser', id: string, name?: string | null, bio?: string | null, company?: string | null, avatar?: string | null, verified?: boolean | null } | null }> | null, pendingAccessRequests?: Array<{ __typename?: 'StreamAccessRequest', id: string, streamId: string, createdAt: string, requester: { __typename?: 'LimitedUser', id: string, name?: string | null, bio?: string | null, company?: string | null, avatar?: string | null, verified?: boolean | null } }> | null } | null };

export type StreamWithActivityQueryVariables = Exact<{
  id: Scalars['String'];
  cursor?: InputMaybe<Scalars['DateTime']>;
}>;


export type StreamWithActivityQuery = { __typename?: 'Query', stream?: { __typename?: 'Stream', id: string, name: string, createdAt: string, commits?: { __typename?: 'CommitCollection', totalCount: number } | null, branches?: { __typename?: 'BranchCollection', totalCount: number } | null, activity?: { __typename?: 'ActivityCollection', totalCount: number, cursor?: string | null, items?: Array<{ __typename?: 'Activity', id: string, actionType: string, info: Record<string, unknown>, userId: string, streamId?: string | null, resourceId: string, resourceType: string, time: string, message: string } | null> | null } | null } | null };

export type LeaveStreamMutationVariables = Exact<{
  streamId: Scalars['String'];
}>;


export type LeaveStreamMutation = { __typename?: 'Mutation', streamLeave: boolean };

export type UpdateStreamPermissionMutationVariables = Exact<{
  params: StreamUpdatePermissionInput;
}>;


export type UpdateStreamPermissionMutation = { __typename?: 'Mutation', streamUpdatePermission?: boolean | null };

export type StreamFirstCommitQueryVariables = Exact<{
  id: Scalars['String'];
}>;


export type StreamFirstCommitQuery = { __typename?: 'Query', stream?: { __typename?: 'Stream', id: string, commits?: { __typename?: 'CommitCollection', totalCount: number, items?: Array<{ __typename?: 'Commit', id: string, referencedObject: string }> | null } | null } | null };

export type StreamBranchFirstCommitQueryVariables = Exact<{
  id: Scalars['String'];
  branch: Scalars['String'];
}>;


export type StreamBranchFirstCommitQuery = { __typename?: 'Query', stream?: { __typename?: 'Stream', id: string, branch?: { __typename?: 'Branch', commits?: { __typename?: 'CommitCollection', totalCount: number, items?: Array<{ __typename?: 'Commit', id: string, referencedObject: string }> | null } | null } | null } | null };

export type StreamSettingsQueryVariables = Exact<{
  id: Scalars['String'];
}>;


export type StreamSettingsQuery = { __typename?: 'Query', stream?: { __typename?: 'Stream', id: string, name: string, description?: string | null, isPublic: boolean, isDiscoverable: boolean, allowPublicComments: boolean, role?: string | null } | null };

export type SearchStreamsQueryVariables = Exact<{
  query?: InputMaybe<Scalars['String']>;
}>;


export type SearchStreamsQuery = { __typename?: 'Query', streams?: { __typename?: 'StreamCollection', totalCount: number, cursor?: string | null, items?: Array<{ __typename?: 'Stream', id: string, name: string, updatedAt: string }> | null } | null };

export type UpdateStreamSettingsMutationVariables = Exact<{
  input: StreamUpdateInput;
}>;


export type UpdateStreamSettingsMutation = { __typename?: 'Mutation', streamUpdate: boolean };

export type DeleteStreamMutationVariables = Exact<{
  id: Scalars['String'];
}>;


export type DeleteStreamMutation = { __typename?: 'Mutation', streamDelete: boolean };

export type ShareableStreamQueryVariables = Exact<{
  id: Scalars['String'];
}>;


export type ShareableStreamQuery = { __typename?: 'Query', stream?: { __typename?: 'Stream', id: string, isPublic: boolean, role?: string | null, collaborators: Array<{ __typename?: 'StreamCollaborator', id: string, name: string, role: string, company?: string | null, avatar?: string | null }> } | null };

export type CommonUserFieldsFragment = { __typename?: 'User', id: string, email?: string | null, name?: string | null, bio?: string | null, company?: string | null, avatar?: string | null, verified?: boolean | null, hasPendingVerification?: boolean | null, profiles?: Record<string, unknown> | null, role?: string | null, streams: { __typename?: 'StreamCollection', totalCount: number }, commits?: { __typename?: 'CommitCollection', totalCount: number, items?: Array<{ __typename?: 'Commit', id: string, createdAt?: string | null }> | null } | null };

export type UserFavoriteStreamsQueryVariables = Exact<{
  cursor?: InputMaybe<Scalars['String']>;
}>;


export type UserFavoriteStreamsQuery = { __typename?: 'Query', activeUser?: { __typename?: 'User', id: string, email?: string | null, name?: string | null, bio?: string | null, company?: string | null, avatar?: string | null, verified?: boolean | null, hasPendingVerification?: boolean | null, profiles?: Record<string, unknown> | null, role?: string | null, favoriteStreams: { __typename?: 'StreamCollection', totalCount: number, cursor?: string | null, items?: Array<{ __typename?: 'Stream', id: string, name: string, description?: string | null, role?: string | null, isPublic: boolean, createdAt: string, updatedAt: string, commentCount: number, favoritedDate?: string | null, favoritesCount: number, collaborators: Array<{ __typename?: 'StreamCollaborator', id: string, name: string, role: string, company?: string | null, avatar?: string | null }>, commits?: { __typename?: 'CommitCollection', totalCount: number } | null, branches?: { __typename?: 'BranchCollection', totalCount: number } | null }> | null }, streams: { __typename?: 'StreamCollection', totalCount: number }, commits?: { __typename?: 'CommitCollection', totalCount: number, items?: Array<{ __typename?: 'Commit', id: string, createdAt?: string | null }> | null } | null } | null };

export type MainUserDataQueryVariables = Exact<{ [key: string]: never; }>;


export type MainUserDataQuery = { __typename?: 'Query', activeUser?: { __typename?: 'User', id: string, email?: string | null, name?: string | null, bio?: string | null, company?: string | null, avatar?: string | null, verified?: boolean | null, hasPendingVerification?: boolean | null, profiles?: Record<string, unknown> | null, role?: string | null, streams: { __typename?: 'StreamCollection', totalCount: number }, commits?: { __typename?: 'CommitCollection', totalCount: number, items?: Array<{ __typename?: 'Commit', id: string, createdAt?: string | null }> | null } | null } | null };

export type ProfileSelfQueryVariables = Exact<{ [key: string]: never; }>;


export type ProfileSelfQuery = { __typename?: 'Query', activeUser?: { __typename?: 'User', totalOwnedStreamsFavorites: number, notificationPreferences: Record<string, unknown>, id: string, email?: string | null, name?: string | null, bio?: string | null, company?: string | null, avatar?: string | null, verified?: boolean | null, hasPendingVerification?: boolean | null, profiles?: Record<string, unknown> | null, role?: string | null, streams: { __typename?: 'StreamCollection', totalCount: number }, commits?: { __typename?: 'CommitCollection', totalCount: number, items?: Array<{ __typename?: 'Commit', id: string, createdAt?: string | null }> | null } | null } | null };

export type UserSearchQueryVariables = Exact<{
  query: Scalars['String'];
  limit: Scalars['Int'];
  cursor?: InputMaybe<Scalars['String']>;
  archived?: InputMaybe<Scalars['Boolean']>;
}>;


export type UserSearchQuery = { __typename?: 'Query', userSearch?: { __typename?: 'UserSearchResultCollection', cursor?: string | null, items?: Array<{ __typename?: 'LimitedUser', id: string, name?: string | null, bio?: string | null, company?: string | null, avatar?: string | null, verified?: boolean | null } | null> | null } | null };

export type IsLoggedInQueryVariables = Exact<{ [key: string]: never; }>;


export type IsLoggedInQuery = { __typename?: 'Query', activeUser?: { __typename?: 'User', id: string } | null };

export type AdminUsersListQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  query?: InputMaybe<Scalars['String']>;
}>;


export type AdminUsersListQuery = { __typename?: 'Query', adminUsers?: { __typename?: 'AdminUsersListCollection', totalCount: number, items: Array<{ __typename?: 'AdminUsersListItem', id: string, registeredUser?: { __typename?: 'User', id: string, email?: string | null, name?: string | null, bio?: string | null, company?: string | null, avatar?: string | null, verified?: boolean | null, profiles?: Record<string, unknown> | null, role?: string | null, authorizedApps?: Array<{ __typename?: 'ServerAppListItem', name: string } | null> | null } | null, invitedUser?: { __typename?: 'ServerInvite', id: string, email: string, invitedBy: { __typename?: 'LimitedUser', id: string, name?: string | null } } | null }> } | null };

export type UserTimelineQueryVariables = Exact<{
  cursor?: InputMaybe<Scalars['DateTime']>;
}>;


export type UserTimelineQuery = { __typename?: 'Query', activeUser?: { __typename?: 'User', id: string, timeline?: { __typename?: 'ActivityCollection', totalCount: number, cursor?: string | null, items?: Array<{ __typename?: 'Activity', id: string, actionType: string, info: Record<string, unknown>, userId: string, streamId?: string | null, resourceId: string, resourceType: string, time: string, message: string } | null> | null } | null } | null };

export type ValidatePasswordStrengthQueryVariables = Exact<{
  pwd: Scalars['String'];
}>;


export type ValidatePasswordStrengthQuery = { __typename?: 'Query', userPwdStrength: { __typename?: 'PasswordStrengthCheckResults', score: number, feedback: { __typename?: 'PasswordStrengthCheckFeedback', warning?: string | null, suggestions: Array<string> } } };

export type EmailVerificationBannerStateQueryVariables = Exact<{ [key: string]: never; }>;


export type EmailVerificationBannerStateQuery = { __typename?: 'Query', activeUser?: { __typename?: 'User', id: string, email?: string | null, verified?: boolean | null, hasPendingVerification?: boolean | null } | null };

export type RequestVerificationMutationVariables = Exact<{ [key: string]: never; }>;


export type RequestVerificationMutation = { __typename?: 'Mutation', requestVerification: boolean };

export type UpdateUserNotificationPreferencesMutationVariables = Exact<{
  preferences: Scalars['JSONObject'];
}>;


export type UpdateUserNotificationPreferencesMutation = { __typename?: 'Mutation', userNotificationPreferencesUpdate?: boolean | null };

export type UserByIdQueryVariables = Exact<{
  id: Scalars['String'];
}>;


export type UserByIdQuery = { __typename?: 'Query', otherUser?: { __typename?: 'LimitedUser', id: string, name?: string | null, bio?: string | null, company?: string | null, avatar?: string | null, verified?: boolean | null } | null };

export type UserProfileQueryVariables = Exact<{
  id: Scalars['String'];
}>;


export type UserProfileQuery = { __typename?: 'Query', otherUser?: { __typename?: 'LimitedUser', id: string, name?: string | null, bio?: string | null, company?: string | null, avatar?: string | null, verified?: boolean | null } | null };

export type WebhookQueryVariables = Exact<{
  streamId: Scalars['String'];
  webhookId: Scalars['String'];
}>;


export type WebhookQuery = { __typename?: 'Query', stream?: { __typename?: 'Stream', id: string, role?: string | null, webhooks?: { __typename?: 'WebhookCollection', items?: Array<{ __typename?: 'Webhook', id: string, streamId: string, url: string, description?: string | null, triggers: Array<string | null>, enabled?: boolean | null, history?: { __typename?: 'WebhookEventCollection', items?: Array<{ __typename?: 'WebhookEvent', status: number, statusInfo: string } | null> | null } | null } | null> | null } | null } | null };

export type WebhooksQueryVariables = Exact<{
  streamId: Scalars['String'];
}>;


export type WebhooksQuery = { __typename?: 'Query', stream?: { __typename?: 'Stream', id: string, name: string, role?: string | null, webhooks?: { __typename?: 'WebhookCollection', items?: Array<{ __typename?: 'Webhook', id: string, streamId: string, url: string, description?: string | null, triggers: Array<string | null>, enabled?: boolean | null, history?: { __typename?: 'WebhookEventCollection', items?: Array<{ __typename?: 'WebhookEvent', status: number, statusInfo: string, lastUpdate: string } | null> | null } | null } | null> | null } | null } | null };

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
export const ActivityMainFields = gql`
    fragment ActivityMainFields on Activity {
  id
  actionType
  info
  userId
  streamId
  resourceId
  resourceType
  time
  message
}
    `;
export const LimitedCommitActivityFields = gql`
    fragment LimitedCommitActivityFields on Activity {
  id
  info
  time
  userId
  message
}
    `;
export const BasicStreamAccessRequestFields = gql`
    fragment BasicStreamAccessRequestFields on StreamAccessRequest {
  id
  streamId
  createdAt
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
export const FullStreamAccessRequestFields = gql`
    fragment FullStreamAccessRequestFields on StreamAccessRequest {
  ...BasicStreamAccessRequestFields
  requester {
    ...LimitedUserFields
  }
}
    `;
export const StreamPendingAccessRequests = gql`
    fragment StreamPendingAccessRequests on Stream {
  pendingAccessRequests {
    ...FullStreamAccessRequestFields
  }
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
    `;
export const ServerInfoBlobSizeFields = gql`
    fragment ServerInfoBlobSizeFields on ServerInfo {
  blobSizeLimitBytes
}
    `;
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
export const StreamCollaboratorFields = gql`
    fragment StreamCollaboratorFields on StreamCollaborator {
  id
  name
  role
  company
  avatar
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
    ...StreamCollaboratorFields
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
  email
  name
  bio
  company
  avatar
  verified
  hasPendingVerification
  profiles
  role
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
export const GetStreamAccessRequest = gql`
    query GetStreamAccessRequest($streamId: String!) {
  streamAccessRequest(streamId: $streamId) {
    ...BasicStreamAccessRequestFields
  }
}
    ${BasicStreamAccessRequestFields}`;
export const CreateStreamAccessRequest = gql`
    mutation CreateStreamAccessRequest($streamId: String!) {
  streamAccessRequestCreate(streamId: $streamId) {
    ...BasicStreamAccessRequestFields
  }
}
    ${BasicStreamAccessRequestFields}`;
export const UseStreamAccessRequest = gql`
    mutation UseStreamAccessRequest($requestId: String!, $accept: Boolean!, $role: StreamRole = STREAM_CONTRIBUTOR) {
  streamAccessRequestUse(requestId: $requestId, accept: $accept, role: $role)
}
    `;
export const StreamWithBranch = gql`
    query StreamWithBranch($streamId: String!, $branchName: String!, $cursor: String) {
  stream(id: $streamId) {
    id
    name
    role
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
export const StreamBranchesSelector = gql`
    query StreamBranchesSelector($streamId: String!) {
  stream(id: $streamId) {
    id
    branches(limit: 100) {
      items {
        name
      }
    }
  }
}
    `;
export const MoveCommits = gql`
    mutation MoveCommits($input: CommitsMoveInput!) {
  commitsMove(input: $input)
}
    `;
export const DeleteCommits = gql`
    mutation DeleteCommits($input: CommitsDeleteInput!) {
  commitsDelete(input: $input)
}
    `;
export const StreamInvite = gql`
    query StreamInvite($streamId: String!, $token: String) {
  streamInvite(streamId: $streamId, token: $token) {
    ...UsersOwnInviteFields
  }
}
    ${UsersOwnInviteFields}
${LimitedUserFields}`;
export const UserStreamInvites = gql`
    query UserStreamInvites {
  streamInvites {
    ...UsersOwnInviteFields
  }
}
    ${UsersOwnInviteFields}
${LimitedUserFields}`;
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
    ...ServerInfoBlobSizeFields
  }
}
    ${MainServerInfoFields}
${ServerInfoRolesFields}
${ServerInfoScopesFields}
${ServerInfoBlobSizeFields}`;
export const ServerInfoBlobSizeLimit = gql`
    query ServerInfoBlobSizeLimit {
  serverInfo {
    ...ServerInfoBlobSizeFields
  }
}
    ${ServerInfoBlobSizeFields}`;
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
    ${CommonStreamFields}
${StreamCollaboratorFields}`;
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
    pendingAccessRequests {
      ...FullStreamAccessRequestFields
    }
  }
}
    ${StreamCollaboratorFields}
${LimitedUserFields}
${FullStreamAccessRequestFields}
${BasicStreamAccessRequestFields}`;
export const StreamWithActivity = gql`
    query StreamWithActivity($id: String!, $cursor: DateTime) {
  stream(id: $id) {
    id
    name
    createdAt
    commits {
      totalCount
    }
    branches {
      totalCount
    }
    activity(cursor: $cursor) {
      totalCount
      cursor
      items {
        ...ActivityMainFields
      }
    }
  }
}
    ${ActivityMainFields}`;
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
export const StreamFirstCommit = gql`
    query StreamFirstCommit($id: String!) {
  stream(id: $id) {
    id
    commits(limit: 1) {
      totalCount
      items {
        id
        referencedObject
      }
    }
  }
}
    `;
export const StreamBranchFirstCommit = gql`
    query StreamBranchFirstCommit($id: String!, $branch: String!) {
  stream(id: $id) {
    id
    branch(name: $branch) {
      commits(limit: 1) {
        totalCount
        items {
          id
          referencedObject
        }
      }
    }
  }
}
    `;
export const StreamSettings = gql`
    query StreamSettings($id: String!) {
  stream(id: $id) {
    id
    name
    description
    isPublic
    isDiscoverable
    allowPublicComments
    role
  }
}
    `;
export const SearchStreams = gql`
    query SearchStreams($query: String) {
  streams(query: $query) {
    totalCount
    cursor
    items {
      id
      name
      updatedAt
    }
  }
}
    `;
export const UpdateStreamSettings = gql`
    mutation UpdateStreamSettings($input: StreamUpdateInput!) {
  streamUpdate(stream: $input)
}
    `;
export const DeleteStream = gql`
    mutation DeleteStream($id: String!) {
  streamDelete(id: $id)
}
    `;
export const ShareableStream = gql`
    query ShareableStream($id: String!) {
  stream(id: $id) {
    id
    isPublic
    role
    collaborators {
      ...StreamCollaboratorFields
    }
  }
}
    ${StreamCollaboratorFields}`;
export const UserFavoriteStreams = gql`
    query UserFavoriteStreams($cursor: String) {
  activeUser {
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
${CommonStreamFields}
${StreamCollaboratorFields}`;
export const MainUserData = gql`
    query MainUserData {
  activeUser {
    ...CommonUserFields
  }
}
    ${CommonUserFields}`;
export const ProfileSelf = gql`
    query ProfileSelf {
  activeUser {
    ...CommonUserFields
    totalOwnedStreamsFavorites
    notificationPreferences
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
  activeUser {
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
export const UserTimeline = gql`
    query UserTimeline($cursor: DateTime) {
  activeUser {
    id
    timeline(cursor: $cursor) {
      totalCount
      cursor
      items {
        ...ActivityMainFields
      }
    }
  }
}
    ${ActivityMainFields}`;
export const ValidatePasswordStrength = gql`
    query ValidatePasswordStrength($pwd: String!) {
  userPwdStrength(pwd: $pwd) {
    score
    feedback {
      warning
      suggestions
    }
  }
}
    `;
export const EmailVerificationBannerState = gql`
    query EmailVerificationBannerState {
  activeUser {
    id
    email
    verified
    hasPendingVerification
  }
}
    `;
export const RequestVerification = gql`
    mutation RequestVerification {
  requestVerification
}
    `;
export const UpdateUserNotificationPreferences = gql`
    mutation UpdateUserNotificationPreferences($preferences: JSONObject!) {
  userNotificationPreferencesUpdate(preferences: $preferences)
}
    `;
export const UserById = gql`
    query UserById($id: String!) {
  otherUser(id: $id) {
    id
    name
    bio
    company
    avatar
    verified
  }
}
    `;
export const UserProfile = gql`
    query UserProfile($id: String!) {
  otherUser(id: $id) {
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
export const CommentFullInfoFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CommentFullInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Comment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"archived"}},{"kind":"Field","name":{"kind":"Name","value":"authorId"}},{"kind":"Field","name":{"kind":"Name","value":"text"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"doc"}},{"kind":"Field","name":{"kind":"Name","value":"attachments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}},{"kind":"Field","name":{"kind":"Name","value":"streamId"}},{"kind":"Field","name":{"kind":"Name","value":"fileType"}},{"kind":"Field","name":{"kind":"Name","value":"fileSize"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"data"}},{"kind":"Field","name":{"kind":"Name","value":"screenshot"}},{"kind":"Field","name":{"kind":"Name","value":"replies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"resources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resourceId"}},{"kind":"Field","name":{"kind":"Name","value":"resourceType"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"viewedAt"}}]}}]} as unknown as DocumentNode<CommentFullInfoFragment, unknown>;
export const ActivityMainFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ActivityMainFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Activity"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"actionType"}},{"kind":"Field","name":{"kind":"Name","value":"info"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"streamId"}},{"kind":"Field","name":{"kind":"Name","value":"resourceId"}},{"kind":"Field","name":{"kind":"Name","value":"resourceType"}},{"kind":"Field","name":{"kind":"Name","value":"time"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]} as unknown as DocumentNode<ActivityMainFieldsFragment, unknown>;
export const LimitedCommitActivityFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LimitedCommitActivityFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Activity"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"info"}},{"kind":"Field","name":{"kind":"Name","value":"time"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]} as unknown as DocumentNode<LimitedCommitActivityFieldsFragment, unknown>;
export const BasicStreamAccessRequestFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BasicStreamAccessRequestFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StreamAccessRequest"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"streamId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<BasicStreamAccessRequestFieldsFragment, unknown>;
export const LimitedUserFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LimitedUserFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LimitedUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"bio"}},{"kind":"Field","name":{"kind":"Name","value":"company"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"verified"}}]}}]} as unknown as DocumentNode<LimitedUserFieldsFragment, unknown>;
export const FullStreamAccessRequestFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FullStreamAccessRequestFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StreamAccessRequest"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BasicStreamAccessRequestFields"}},{"kind":"Field","name":{"kind":"Name","value":"requester"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserFields"}}]}}]}}]} as unknown as DocumentNode<FullStreamAccessRequestFieldsFragment, unknown>;
export const StreamPendingAccessRequestsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StreamPendingAccessRequests"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Stream"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pendingAccessRequests"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FullStreamAccessRequestFields"}}]}}]}}]} as unknown as DocumentNode<StreamPendingAccessRequestsFragment, unknown>;
export const UsersOwnInviteFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UsersOwnInviteFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PendingStreamCollaborator"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"inviteId"}},{"kind":"Field","name":{"kind":"Name","value":"streamId"}},{"kind":"Field","name":{"kind":"Name","value":"streamName"}},{"kind":"Field","name":{"kind":"Name","value":"token"}},{"kind":"Field","name":{"kind":"Name","value":"invitedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserFields"}}]}}]}}]} as unknown as DocumentNode<UsersOwnInviteFieldsFragment, unknown>;
export const ServerInfoBlobSizeFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ServerInfoBlobSizeFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ServerInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"blobSizeLimitBytes"}}]}}]} as unknown as DocumentNode<ServerInfoBlobSizeFieldsFragment, unknown>;
export const MainServerInfoFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MainServerInfoFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ServerInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"company"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"adminContact"}},{"kind":"Field","name":{"kind":"Name","value":"canonicalUrl"}},{"kind":"Field","name":{"kind":"Name","value":"termsOfService"}},{"kind":"Field","name":{"kind":"Name","value":"inviteOnly"}},{"kind":"Field","name":{"kind":"Name","value":"version"}}]}}]} as unknown as DocumentNode<MainServerInfoFieldsFragment, unknown>;
export const ServerInfoRolesFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ServerInfoRolesFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ServerInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"roles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"resourceTarget"}}]}}]}}]} as unknown as DocumentNode<ServerInfoRolesFieldsFragment, unknown>;
export const ServerInfoScopesFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ServerInfoScopesFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ServerInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"scopes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]} as unknown as DocumentNode<ServerInfoScopesFieldsFragment, unknown>;
export const StreamCollaboratorFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StreamCollaboratorFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StreamCollaborator"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"company"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}}]} as unknown as DocumentNode<StreamCollaboratorFieldsFragment, unknown>;
export const CommonStreamFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CommonStreamFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Stream"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"commentCount"}},{"kind":"Field","name":{"kind":"Name","value":"collaborators"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StreamCollaboratorFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"commits"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"branches"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"favoritedDate"}},{"kind":"Field","name":{"kind":"Name","value":"favoritesCount"}}]}}]} as unknown as DocumentNode<CommonStreamFieldsFragment, unknown>;
export const CommonUserFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CommonUserFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"bio"}},{"kind":"Field","name":{"kind":"Name","value":"company"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"verified"}},{"kind":"Field","name":{"kind":"Name","value":"hasPendingVerification"}},{"kind":"Field","name":{"kind":"Name","value":"profiles"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"streams"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"commits"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]}}]} as unknown as DocumentNode<CommonUserFieldsFragment, unknown>;
export const GetStreamAccessRequestDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetStreamAccessRequest"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"streamAccessRequest"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"streamId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BasicStreamAccessRequestFields"}}]}}]}},...BasicStreamAccessRequestFieldsFragmentDoc.definitions]} as unknown as DocumentNode<GetStreamAccessRequestQuery, GetStreamAccessRequestQueryVariables>;
export const CreateStreamAccessRequestDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateStreamAccessRequest"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"streamAccessRequestCreate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"streamId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BasicStreamAccessRequestFields"}}]}}]}},...BasicStreamAccessRequestFieldsFragmentDoc.definitions]} as unknown as DocumentNode<CreateStreamAccessRequestMutation, CreateStreamAccessRequestMutationVariables>;
export const UseStreamAccessRequestDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UseStreamAccessRequest"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"requestId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"accept"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"role"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"StreamRole"}},"defaultValue":{"kind":"EnumValue","value":"STREAM_CONTRIBUTOR"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"streamAccessRequestUse"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"requestId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"requestId"}}},{"kind":"Argument","name":{"kind":"Name","value":"accept"},"value":{"kind":"Variable","name":{"kind":"Name","value":"accept"}}},{"kind":"Argument","name":{"kind":"Name","value":"role"},"value":{"kind":"Variable","name":{"kind":"Name","value":"role"}}}]}]}}]} as unknown as DocumentNode<UseStreamAccessRequestMutation, UseStreamAccessRequestMutationVariables>;
export const StreamWithBranchDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"StreamWithBranch"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"branchName"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stream"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"branch"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"branchName"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"commits"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"4"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"authorName"}},{"kind":"Field","name":{"kind":"Name","value":"authorId"}},{"kind":"Field","name":{"kind":"Name","value":"authorAvatar"}},{"kind":"Field","name":{"kind":"Name","value":"sourceApplication"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"referencedObject"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"commentCount"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<StreamWithBranchQuery, StreamWithBranchQueryVariables>;
export const BranchCreatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"BranchCreated"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"branchCreated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"streamId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}}}]}]}}]} as unknown as DocumentNode<BranchCreatedSubscription, BranchCreatedSubscriptionVariables>;
export const StreamCommitQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"StreamCommitQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stream"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"commit"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"referencedObject"}},{"kind":"Field","name":{"kind":"Name","value":"authorName"}},{"kind":"Field","name":{"kind":"Name","value":"authorId"}},{"kind":"Field","name":{"kind":"Name","value":"authorAvatar"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"branchName"}},{"kind":"Field","name":{"kind":"Name","value":"sourceApplication"}}]}}]}}]}}]} as unknown as DocumentNode<StreamCommitQueryQuery, StreamCommitQueryQueryVariables>;
export const StreamBranchesSelectorDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"StreamBranchesSelector"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stream"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"branches"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"100"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]} as unknown as DocumentNode<StreamBranchesSelectorQuery, StreamBranchesSelectorQueryVariables>;
export const MoveCommitsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MoveCommits"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CommitsMoveInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"commitsMove"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<MoveCommitsMutation, MoveCommitsMutationVariables>;
export const DeleteCommitsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteCommits"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CommitsDeleteInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"commitsDelete"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<DeleteCommitsMutation, DeleteCommitsMutationVariables>;
export const StreamInviteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"StreamInvite"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"token"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"streamInvite"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"streamId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}}},{"kind":"Argument","name":{"kind":"Name","value":"token"},"value":{"kind":"Variable","name":{"kind":"Name","value":"token"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UsersOwnInviteFields"}}]}}]}},...UsersOwnInviteFieldsFragmentDoc.definitions,...LimitedUserFieldsFragmentDoc.definitions]} as unknown as DocumentNode<StreamInviteQuery, StreamInviteQueryVariables>;
export const UserStreamInvitesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"UserStreamInvites"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"streamInvites"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UsersOwnInviteFields"}}]}}]}},...UsersOwnInviteFieldsFragmentDoc.definitions,...LimitedUserFieldsFragmentDoc.definitions]} as unknown as DocumentNode<UserStreamInvitesQuery, UserStreamInvitesQueryVariables>;
export const UseStreamInviteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UseStreamInvite"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"accept"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"token"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"streamInviteUse"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"accept"},"value":{"kind":"Variable","name":{"kind":"Name","value":"accept"}}},{"kind":"Argument","name":{"kind":"Name","value":"streamId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}}},{"kind":"Argument","name":{"kind":"Name","value":"token"},"value":{"kind":"Variable","name":{"kind":"Name","value":"token"}}}]}]}}]} as unknown as DocumentNode<UseStreamInviteMutation, UseStreamInviteMutationVariables>;
export const CancelStreamInviteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CancelStreamInvite"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"inviteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"streamInviteCancel"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"streamId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}}},{"kind":"Argument","name":{"kind":"Name","value":"inviteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"inviteId"}}}]}]}}]} as unknown as DocumentNode<CancelStreamInviteMutation, CancelStreamInviteMutationVariables>;
export const DeleteInviteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteInvite"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"inviteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"inviteDelete"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"inviteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"inviteId"}}}]}]}}]} as unknown as DocumentNode<DeleteInviteMutation, DeleteInviteMutationVariables>;
export const ResendInviteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ResendInvite"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"inviteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"inviteResend"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"inviteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"inviteId"}}}]}]}}]} as unknown as DocumentNode<ResendInviteMutation, ResendInviteMutationVariables>;
export const BatchInviteToServerDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"BatchInviteToServer"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paramsArray"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ServerInviteCreateInput"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"serverInviteBatchCreate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paramsArray"}}}]}]}}]} as unknown as DocumentNode<BatchInviteToServerMutation, BatchInviteToServerMutationVariables>;
export const BatchInviteToStreamsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"BatchInviteToStreams"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paramsArray"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"StreamInviteCreateInput"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"streamInviteBatchCreate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paramsArray"}}}]}]}}]} as unknown as DocumentNode<BatchInviteToStreamsMutation, BatchInviteToStreamsMutationVariables>;
export const StreamObjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"StreamObject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stream"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"object"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalChildrenCount"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"speckleType"}},{"kind":"Field","name":{"kind":"Name","value":"data"}}]}}]}}]}}]} as unknown as DocumentNode<StreamObjectQuery, StreamObjectQueryVariables>;
export const StreamObjectNoDataDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"StreamObjectNoData"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stream"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"object"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalChildrenCount"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"speckleType"}}]}}]}}]}}]} as unknown as DocumentNode<StreamObjectNoDataQuery, StreamObjectNoDataQueryVariables>;
export const MainServerInfoDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MainServerInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"serverInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MainServerInfoFields"}}]}}]}},...MainServerInfoFieldsFragmentDoc.definitions]} as unknown as DocumentNode<MainServerInfoQuery, MainServerInfoQueryVariables>;
export const FullServerInfoDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"FullServerInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"serverInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MainServerInfoFields"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ServerInfoRolesFields"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ServerInfoScopesFields"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ServerInfoBlobSizeFields"}}]}}]}},...MainServerInfoFieldsFragmentDoc.definitions,...ServerInfoRolesFieldsFragmentDoc.definitions,...ServerInfoScopesFieldsFragmentDoc.definitions,...ServerInfoBlobSizeFieldsFragmentDoc.definitions]} as unknown as DocumentNode<FullServerInfoQuery, FullServerInfoQueryVariables>;
export const ServerInfoBlobSizeLimitDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ServerInfoBlobSizeLimit"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"serverInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ServerInfoBlobSizeFields"}}]}}]}},...ServerInfoBlobSizeFieldsFragmentDoc.definitions]} as unknown as DocumentNode<ServerInfoBlobSizeLimitQuery, ServerInfoBlobSizeLimitQueryVariables>;
export const StreamCommitsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"StreamCommits"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stream"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"commits"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"authorId"}},{"kind":"Field","name":{"kind":"Name","value":"authorName"}},{"kind":"Field","name":{"kind":"Name","value":"authorAvatar"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"referencedObject"}},{"kind":"Field","name":{"kind":"Name","value":"branchName"}},{"kind":"Field","name":{"kind":"Name","value":"sourceApplication"}}]}}]}}]}}]}}]} as unknown as DocumentNode<StreamCommitsQuery, StreamCommitsQueryVariables>;
export const StreamsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Streams"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"streams"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"10"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"commentCount"}},{"kind":"Field","name":{"kind":"Name","value":"collaborators"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"company"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}},{"kind":"Field","name":{"kind":"Name","value":"commits"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"authorId"}},{"kind":"Field","name":{"kind":"Name","value":"branchName"}},{"kind":"Field","name":{"kind":"Name","value":"authorName"}},{"kind":"Field","name":{"kind":"Name","value":"authorAvatar"}},{"kind":"Field","name":{"kind":"Name","value":"referencedObject"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"branches"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"favoritedDate"}},{"kind":"Field","name":{"kind":"Name","value":"favoritesCount"}}]}}]}}]}}]} as unknown as DocumentNode<StreamsQuery, StreamsQueryVariables>;
export const StreamDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Stream"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stream"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CommonStreamFields"}}]}}]}},...CommonStreamFieldsFragmentDoc.definitions,...StreamCollaboratorFieldsFragmentDoc.definitions]} as unknown as DocumentNode<StreamQuery, StreamQueryVariables>;
export const StreamWithCollaboratorsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"StreamWithCollaborators"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stream"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"collaborators"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StreamCollaboratorFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pendingCollaborators"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"inviteId"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserFields"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pendingAccessRequests"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FullStreamAccessRequestFields"}}]}}]}}]}},...StreamCollaboratorFieldsFragmentDoc.definitions,...LimitedUserFieldsFragmentDoc.definitions,...FullStreamAccessRequestFieldsFragmentDoc.definitions,...BasicStreamAccessRequestFieldsFragmentDoc.definitions]} as unknown as DocumentNode<StreamWithCollaboratorsQuery, StreamWithCollaboratorsQueryVariables>;
export const StreamWithActivityDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"StreamWithActivity"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stream"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"commits"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"branches"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"activity"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ActivityMainFields"}}]}}]}}]}}]}},...ActivityMainFieldsFragmentDoc.definitions]} as unknown as DocumentNode<StreamWithActivityQuery, StreamWithActivityQueryVariables>;
export const LeaveStreamDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"LeaveStream"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"streamLeave"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"streamId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}}}]}]}}]} as unknown as DocumentNode<LeaveStreamMutation, LeaveStreamMutationVariables>;
export const UpdateStreamPermissionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateStreamPermission"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"params"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"StreamUpdatePermissionInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"streamUpdatePermission"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"permissionParams"},"value":{"kind":"Variable","name":{"kind":"Name","value":"params"}}}]}]}}]} as unknown as DocumentNode<UpdateStreamPermissionMutation, UpdateStreamPermissionMutationVariables>;
export const StreamFirstCommitDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"StreamFirstCommit"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stream"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"commits"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"referencedObject"}}]}}]}}]}}]}}]} as unknown as DocumentNode<StreamFirstCommitQuery, StreamFirstCommitQueryVariables>;
export const StreamBranchFirstCommitDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"StreamBranchFirstCommit"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"branch"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stream"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"branch"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"branch"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"commits"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"referencedObject"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<StreamBranchFirstCommitQuery, StreamBranchFirstCommitQueryVariables>;
export const StreamSettingsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"StreamSettings"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stream"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"isDiscoverable"}},{"kind":"Field","name":{"kind":"Name","value":"allowPublicComments"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]}}]} as unknown as DocumentNode<StreamSettingsQuery, StreamSettingsQueryVariables>;
export const SearchStreamsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SearchStreams"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"query"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"streams"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"query"},"value":{"kind":"Variable","name":{"kind":"Name","value":"query"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]}}]} as unknown as DocumentNode<SearchStreamsQuery, SearchStreamsQueryVariables>;
export const UpdateStreamSettingsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateStreamSettings"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"StreamUpdateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"streamUpdate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"stream"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<UpdateStreamSettingsMutation, UpdateStreamSettingsMutationVariables>;
export const DeleteStreamDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteStream"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"streamDelete"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteStreamMutation, DeleteStreamMutationVariables>;
export const ShareableStreamDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ShareableStream"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stream"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"collaborators"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StreamCollaboratorFields"}}]}}]}}]}},...StreamCollaboratorFieldsFragmentDoc.definitions]} as unknown as DocumentNode<ShareableStreamQuery, ShareableStreamQueryVariables>;
export const UserFavoriteStreamsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"UserFavoriteStreams"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CommonUserFields"}},{"kind":"Field","name":{"kind":"Name","value":"favoriteStreams"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"10"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CommonStreamFields"}}]}}]}}]}}]}},...CommonUserFieldsFragmentDoc.definitions,...CommonStreamFieldsFragmentDoc.definitions,...StreamCollaboratorFieldsFragmentDoc.definitions]} as unknown as DocumentNode<UserFavoriteStreamsQuery, UserFavoriteStreamsQueryVariables>;
export const MainUserDataDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MainUserData"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CommonUserFields"}}]}}]}},...CommonUserFieldsFragmentDoc.definitions]} as unknown as DocumentNode<MainUserDataQuery, MainUserDataQueryVariables>;
export const ProfileSelfDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProfileSelf"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CommonUserFields"}},{"kind":"Field","name":{"kind":"Name","value":"totalOwnedStreamsFavorites"}},{"kind":"Field","name":{"kind":"Name","value":"notificationPreferences"}}]}}]}},...CommonUserFieldsFragmentDoc.definitions]} as unknown as DocumentNode<ProfileSelfQuery, ProfileSelfQueryVariables>;
export const UserSearchDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"UserSearch"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"query"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"archived"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userSearch"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"query"},"value":{"kind":"Variable","name":{"kind":"Name","value":"query"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}}},{"kind":"Argument","name":{"kind":"Name","value":"archived"},"value":{"kind":"Variable","name":{"kind":"Name","value":"archived"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LimitedUserFields"}}]}}]}}]}},...LimitedUserFieldsFragmentDoc.definitions]} as unknown as DocumentNode<UserSearchQuery, UserSearchQueryVariables>;
export const IsLoggedInDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"IsLoggedIn"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<IsLoggedInQuery, IsLoggedInQueryVariables>;
export const AdminUsersListDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminUsersList"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"query"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminUsers"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}},{"kind":"Argument","name":{"kind":"Name","value":"query"},"value":{"kind":"Variable","name":{"kind":"Name","value":"query"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"registeredUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"bio"}},{"kind":"Field","name":{"kind":"Name","value":"company"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"verified"}},{"kind":"Field","name":{"kind":"Name","value":"profiles"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"authorizedApps"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"invitedUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"invitedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<AdminUsersListQuery, AdminUsersListQueryVariables>;
export const UserTimelineDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"UserTimeline"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"timeline"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"cursor"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ActivityMainFields"}}]}}]}}]}}]}},...ActivityMainFieldsFragmentDoc.definitions]} as unknown as DocumentNode<UserTimelineQuery, UserTimelineQueryVariables>;
export const ValidatePasswordStrengthDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ValidatePasswordStrength"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pwd"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userPwdStrength"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pwd"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pwd"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"score"}},{"kind":"Field","name":{"kind":"Name","value":"feedback"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"warning"}},{"kind":"Field","name":{"kind":"Name","value":"suggestions"}}]}}]}}]}}]} as unknown as DocumentNode<ValidatePasswordStrengthQuery, ValidatePasswordStrengthQueryVariables>;
export const EmailVerificationBannerStateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"EmailVerificationBannerState"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"verified"}},{"kind":"Field","name":{"kind":"Name","value":"hasPendingVerification"}}]}}]}}]} as unknown as DocumentNode<EmailVerificationBannerStateQuery, EmailVerificationBannerStateQueryVariables>;
export const RequestVerificationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RequestVerification"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requestVerification"}}]}}]} as unknown as DocumentNode<RequestVerificationMutation, RequestVerificationMutationVariables>;
export const UpdateUserNotificationPreferencesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateUserNotificationPreferences"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"preferences"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"JSONObject"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userNotificationPreferencesUpdate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"preferences"},"value":{"kind":"Variable","name":{"kind":"Name","value":"preferences"}}}]}]}}]} as unknown as DocumentNode<UpdateUserNotificationPreferencesMutation, UpdateUserNotificationPreferencesMutationVariables>;
export const UserByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"UserById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"otherUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"bio"}},{"kind":"Field","name":{"kind":"Name","value":"company"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"verified"}}]}}]}}]} as unknown as DocumentNode<UserByIdQuery, UserByIdQueryVariables>;
export const UserProfileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"UserProfile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"otherUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"bio"}},{"kind":"Field","name":{"kind":"Name","value":"company"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"verified"}}]}}]}}]} as unknown as DocumentNode<UserProfileQuery, UserProfileQueryVariables>;
export const WebhookDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"webhook"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"webhookId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stream"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"webhooks"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"webhookId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"streamId"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"triggers"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"history"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"statusInfo"}}]}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<WebhookQuery, WebhookQueryVariables>;
export const WebhooksDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"webhooks"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stream"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"webhooks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"streamId"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"triggers"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"history"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"50"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"statusInfo"}},{"kind":"Field","name":{"kind":"Name","value":"lastUpdate"}}]}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<WebhooksQuery, WebhooksQueryVariables>;