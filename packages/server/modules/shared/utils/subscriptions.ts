import { MaybeAsync, Nullable } from '@speckle/shared'
import { getRedisUrl } from '@/modules/shared/helpers/envHelper'
import { RedisPubSub } from 'graphql-redis-subscriptions'
import Redis from 'ioredis'
import { withFilter } from 'graphql-subscriptions'
import { GraphQLContext } from '@/modules/shared/helpers/typeHelper'
import {
  ProjectCommentsUpdatedMessage,
  ProjectFileImportUpdatedMessage,
  ProjectModelsUpdatedMessage,
  ProjectPendingModelsUpdatedMessage,
  ProjectPendingVersionsUpdatedMessage,
  ProjectUpdatedMessage,
  ProjectVersionsPreviewGeneratedMessage,
  ProjectVersionsUpdatedMessage,
  SubscriptionProjectAutomationsUpdatedArgs,
  SubscriptionProjectCommentsUpdatedArgs,
  SubscriptionProjectFileImportUpdatedArgs,
  SubscriptionProjectModelsUpdatedArgs,
  SubscriptionProjectPendingModelsUpdatedArgs,
  SubscriptionProjectPendingVersionsUpdatedArgs,
  SubscriptionProjectTriggeredAutomationsStatusUpdatedArgs,
  SubscriptionProjectUpdatedArgs,
  SubscriptionProjectVersionsPreviewGeneratedArgs,
  SubscriptionProjectVersionsUpdatedArgs,
  SubscriptionSubscribeFn,
  SubscriptionViewerUserActivityBroadcastedArgs,
  UserProjectsUpdatedMessage,
  ViewerResourceItem,
  ViewerUserActivityMessage,
  GendoAiRender,
  SubscriptionProjectVersionGendoAiRenderUpdatedArgs,
  SubscriptionProjectVersionGendoAiRenderCreatedArgs,
  CommentThreadActivityMessage,
  SubscriptionCommentThreadActivityArgs,
  MutationUserViewerActivityBroadcastArgs,
  SubscriptionUserViewerActivityArgs,
  SubscriptionCommentActivityArgs,
  StreamUpdateInput,
  ProjectUpdateInput,
  SubscriptionStreamUpdatedArgs,
  SubscriptionStreamDeletedArgs,
  SubscriptionBranchCreatedArgs,
  SubscriptionBranchUpdatedArgs,
  BranchUpdateInput,
  UpdateModelInput,
  SubscriptionBranchDeletedArgs,
  BranchDeleteInput,
  DeleteModelInput,
  SubscriptionCommitCreatedArgs,
  CommitCreateInput,
  SubscriptionCommitUpdatedArgs,
  CommitUpdateInput
} from '@/modules/core/graph/generated/graphql'
import { Merge } from 'type-fest'
import {
  ModelGraphQLReturn,
  ProjectGraphQLReturn,
  VersionGraphQLReturn
} from '@/modules/core/helpers/graphTypes'
import { CommentGraphQLReturn } from '@/modules/comments/helpers/graphTypes'
import { FileUploadGraphQLReturn } from '@/modules/fileuploads/helpers/types'
import {
  ProjectTriggeredAutomationsStatusUpdatedMessageGraphQLReturn,
  ProjectAutomationsUpdatedMessageGraphQLReturn
} from '@/modules/automate/helpers/graphTypes'
import { CommentRecord } from '@/modules/comments/helpers/types'
import { CommitRecord } from '@/modules/core/helpers/types'
import { BranchRecord } from '@/modules/core/helpers/types'

/**
 * GraphQL Subscription PubSub instance
 */
export const pubsub = new RedisPubSub({
  publisher: new Redis(getRedisUrl()),
  subscriber: new Redis(getRedisUrl())
})

/**
 * Subscription event keys
 */

// OLD:
export enum StreamSubscriptions {
  UserStreamAdded = 'USER_STREAM_ADDED',
  UserStreamRemoved = 'USER_STREAM_REMOVED',
  StreamUpdated = 'STREAM_UPDATED',
  StreamDeleted = 'STREAM_DELETED'
}

export enum CommitSubscriptions {
  CommitCreated = 'COMMIT_CREATED',
  CommitUpdated = 'COMMIT_UPDATED',
  CommitDeleted = 'COMMIT_DELETED'
}

export enum BranchSubscriptions {
  BranchCreated = 'BRANCH_CREATED',
  BranchUpdated = 'BRANCH_UPDATED',
  BranchDeleted = 'BRANCH_DELETED'
}

export enum CommentSubscriptions {
  ViewerActivity = 'VIEWER_ACTIVITY',
  CommentActivity = 'COMMENT_ACTIVITY',
  CommentThreadActivity = 'COMMENT_THREAD_ACTIVITY'
}

// NEW:
export enum UserSubscriptions {
  UserProjectsUpdated = 'USER_PROJECTS_UPDATED'
}

export enum ProjectSubscriptions {
  ProjectUpdated = 'PROJECT_UPDATED',
  ProjectModelsUpdated = 'PROJECT_MODELS_UPDATED',
  ProjectVersionsUpdated = 'PROJECT_VERSIONS_UPDATED',
  ProjectVersionsPreviewGenerated = 'PROJECT_VERSIONS_PREVIEW_GENERATED',
  ProjectCommentsUpdated = 'PROJECT_COMMENTS_UPDATED',
  // old beta subscription:
  ProjectTriggeredAutomationsStatusUpdated = 'PROJECT_TRIGGERED_AUTOMATION_STATUS_UPDATED',
  ProjectAutomationsUpdated = 'PROJECT_AUTOMATIONS_UPDATED',
  ProjectVersionGendoAIRenderUpdated = 'PROJECT_VERSION_GENDO_AI_RENDER_UPDATED',
  ProjectVersionGendoAIRenderCreated = 'PROJECT_VERSION_GENDO_AI_RENDER_CREATED'
}

export enum ViewerSubscriptions {
  UserActivityBroadcasted = 'VIEWER_USER_ACTIVITY_BROADCASTED'
}

export enum FileImportSubscriptions {
  ProjectPendingModelsUpdated = 'PROJECT_PENDING_MODELS_UPDATED',
  ProjectPendingVersionsUpdated = 'PROJECT_PENDING_VERSIONS_UPDATED',
  ProjectFileImportUpdated = 'PROJECT_FILE_IMPORT_UPDATED'
}

type NoVariables = Record<string, never>

// Add mappings between expected event constant, its payload and variables
type SubscriptionTypeMap = {
  [UserSubscriptions.UserProjectsUpdated]: {
    payload: {
      userProjectsUpdated: Merge<
        UserProjectsUpdatedMessage,
        { project: Nullable<ProjectGraphQLReturn> }
      >
      ownerId: string
    }
    variables: NoVariables
  }
  [ProjectSubscriptions.ProjectUpdated]: {
    payload: {
      projectUpdated: Merge<
        ProjectUpdatedMessage,
        { project: Nullable<ProjectGraphQLReturn> }
      >
    }
    variables: SubscriptionProjectUpdatedArgs
  }
  [ProjectSubscriptions.ProjectVersionGendoAIRenderUpdated]: {
    payload: {
      projectVersionGendoAIRenderUpdated: GendoAiRender
    }
    variables: SubscriptionProjectVersionGendoAiRenderUpdatedArgs
  }
  [ProjectSubscriptions.ProjectVersionGendoAIRenderCreated]: {
    payload: {
      projectVersionGendoAIRenderCreated: GendoAiRender
    }
    variables: SubscriptionProjectVersionGendoAiRenderCreatedArgs
  }
  [ProjectSubscriptions.ProjectModelsUpdated]: {
    payload: {
      projectModelsUpdated: Merge<
        ProjectModelsUpdatedMessage,
        { model: Nullable<ModelGraphQLReturn> }
      >
      projectId: string
    }
    variables: SubscriptionProjectModelsUpdatedArgs
  }
  [ProjectSubscriptions.ProjectVersionsUpdated]: {
    payload: {
      projectVersionsUpdated: Merge<
        ProjectVersionsUpdatedMessage,
        { version: Nullable<Omit<VersionGraphQLReturn, 'branchId'>> }
      >
      projectId: string
    }
    variables: SubscriptionProjectVersionsUpdatedArgs
  }
  [ProjectSubscriptions.ProjectVersionsPreviewGenerated]: {
    payload: {
      projectVersionsPreviewGenerated: ProjectVersionsPreviewGeneratedMessage
    }
    variables: SubscriptionProjectVersionsPreviewGeneratedArgs
  }
  [ViewerSubscriptions.UserActivityBroadcasted]: {
    payload: {
      viewerUserActivityBroadcasted: ViewerUserActivityMessage
      projectId: string
      resourceItems: ViewerResourceItem[]
      userId: Nullable<string>
    }
    variables: SubscriptionViewerUserActivityBroadcastedArgs
  }
  [ProjectSubscriptions.ProjectCommentsUpdated]: {
    payload: {
      projectCommentsUpdated: Merge<
        ProjectCommentsUpdatedMessage,
        { comment: Nullable<CommentGraphQLReturn> }
      >
      projectId: string
      resourceItems: ViewerResourceItem[]
    }
    variables: SubscriptionProjectCommentsUpdatedArgs
  }
  [FileImportSubscriptions.ProjectPendingModelsUpdated]: {
    payload: {
      projectPendingModelsUpdated: Merge<
        ProjectPendingModelsUpdatedMessage,
        { model: FileUploadGraphQLReturn }
      >
      projectId: string
    }
    variables: SubscriptionProjectPendingModelsUpdatedArgs
  }
  [FileImportSubscriptions.ProjectPendingVersionsUpdated]: {
    payload: {
      projectPendingVersionsUpdated: Merge<
        ProjectPendingVersionsUpdatedMessage,
        { version: FileUploadGraphQLReturn }
      >
      projectId: string
      branchName: string
    }
    variables: SubscriptionProjectPendingVersionsUpdatedArgs
  }
  [FileImportSubscriptions.ProjectFileImportUpdated]: {
    payload: {
      projectFileImportUpdated: Merge<
        ProjectFileImportUpdatedMessage,
        { upload: FileUploadGraphQLReturn }
      >
      projectId: string
    }
    variables: SubscriptionProjectFileImportUpdatedArgs
  }
  [ProjectSubscriptions.ProjectTriggeredAutomationsStatusUpdated]: {
    payload: {
      projectTriggeredAutomationsStatusUpdated: ProjectTriggeredAutomationsStatusUpdatedMessageGraphQLReturn
      projectId: string
    }
    variables: SubscriptionProjectTriggeredAutomationsStatusUpdatedArgs
  }
  [ProjectSubscriptions.ProjectAutomationsUpdated]: {
    payload: {
      projectAutomationsUpdated: ProjectAutomationsUpdatedMessageGraphQLReturn
      projectId: string
    }
    variables: SubscriptionProjectAutomationsUpdatedArgs
  }
  [CommentSubscriptions.CommentThreadActivity]: {
    payload: {
      commentThreadActivity: Partial<CommentThreadActivityMessage> &
        Pick<CommentThreadActivityMessage, 'type'>
      streamId: string
      commentId: string
    }
    variables: SubscriptionCommentThreadActivityArgs
  }
  [CommentSubscriptions.ViewerActivity]: {
    payload: {
      userViewerActivity: MutationUserViewerActivityBroadcastArgs
      streamId: string
      resourceId: string
      authorId: string
    }
    variables: SubscriptionUserViewerActivityArgs
  }
  [CommentSubscriptions.CommentActivity]: {
    payload: {
      commentActivity: {
        type: 'comment-added'
        comment: CommentRecord
      }
      streamId: string
      resourceIds: string[]
    }
    variables: SubscriptionCommentActivityArgs
  }
  /**
   * OLD ONES
   */
  [StreamSubscriptions.UserStreamAdded]: {
    payload: {
      userStreamAdded: { id: string; sharedBy?: string }
      ownerId: string
    }
    variables: NoVariables
  }
  [StreamSubscriptions.UserStreamRemoved]: {
    payload: {
      userStreamRemoved: { id: string; revokedBy?: string }
      ownerId: string
    }
    variables: NoVariables
  }
  [StreamSubscriptions.StreamUpdated]: {
    payload: { streamUpdated: StreamUpdateInput | ProjectUpdateInput; id: string }
    variables: SubscriptionStreamUpdatedArgs
  }
  [StreamSubscriptions.StreamDeleted]: {
    payload: { streamDeleted: { streamId: string }; streamId: string }
    variables: SubscriptionStreamDeletedArgs
  }
  [BranchSubscriptions.BranchCreated]: {
    payload: { branchCreated: BranchRecord; streamId: string }
    variables: SubscriptionBranchCreatedArgs
  }
  [BranchSubscriptions.BranchUpdated]: {
    payload: {
      branchUpdated: BranchUpdateInput | UpdateModelInput
      streamId: string
      branchId: string
    }
    variables: SubscriptionBranchUpdatedArgs
  }
  [BranchSubscriptions.BranchDeleted]: {
    payload: { branchDeleted: BranchDeleteInput | DeleteModelInput; streamId: string }
    variables: SubscriptionBranchDeletedArgs
  }
  [CommitSubscriptions.CommitCreated]: {
    payload: {
      commitCreated: CommitCreateInput & { id: string; authorId: string }
      streamId: string
    }
    variables: SubscriptionCommitCreatedArgs
  }
  [CommitSubscriptions.CommitUpdated]: {
    payload: { commitUpdated: CommitUpdateInput; streamId: string; commitId: string }
    variables: SubscriptionCommitUpdatedArgs
  }
  [CommitSubscriptions.CommitDeleted]: {
    payload: {
      commitDeleted: CommitRecord & { streamId: string; branchId: string }
      streamId: string
    }
    variables: SubscriptionCommitUpdatedArgs
  }
} & { [k in SubscriptionEvent]: { payload: unknown; variables: unknown } }

type SubscriptionEvent =
  | CommitSubscriptions
  | CommentSubscriptions
  | FileImportSubscriptions
  | ProjectSubscriptions
  | StreamSubscriptions
  | UserSubscriptions
  | ViewerSubscriptions
  | BranchSubscriptions

/**
 * Publish a GQL subscription event
 */
export const publish = <T extends SubscriptionEvent>(
  event: T,
  payload: SubscriptionTypeMap[T]['payload']
) => pubsub.publish(event, payload)

export type PublishSubscription = typeof publish

/**
 * Subscribe to a GQL subscription and use the filter function to filter subscribers
 * depending on the payload, variables and/or GQL context
 */
export const filteredSubscribe = <T extends SubscriptionEvent>(
  event: T,
  filterFn: (
    payload: SubscriptionTypeMap[T]['payload'],
    variables: SubscriptionTypeMap[T]['variables'],
    context: GraphQLContext
  ) => MaybeAsync<boolean>
) => {
  // we need to cast to graphql codegen types cause they're not fully compatible
  // with our version of graphql-subscriptions
  // https://github.com/dotansimha/graphql-code-generator/issues/7197#issuecomment-1098014584
  return withFilter(
    () => pubsub.asyncIterator([event]),
    filterFn
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) as unknown as SubscriptionSubscribeFn<any, any, any, any>
}
